// Light Phase 2: 업로드한 화면 한 장을 분석해 분류 체계에 맞는 구조화 JSON을 돌려줘요.
// 이미지는 메모리에서 Claude Code CLI 표준 입력(base64)으로만 전달해요. 파일·DB에 저장하지 않고 로그에도 남기지 않아요.
// (CLI 호출에 쓰는 임시 파일은 이미지가 없는 지시문 파일 하나뿐이에요.)
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeFileSync } from 'node:fs'
import { DOMAINS, SCREEN_TYPES, TASKS, UI_PATTERNS } from '../src/data/benchmark/taxonomy.js'

const TIMEOUT_MS = 3 * 60 * 1000
const MAX_BYTES = 8 * 1024 * 1024
const ids = (list) => list.map((x) => x.id)

const list = (items, extra) => items.map((x) => `- ${x.id}: ${x.label} — ${x.description}${extra?.(x) ?? ''}`).join('\n')

const PROMPT = `당신은 자동차·금융 서비스의 UX 벤치마킹 분석가예요. 사용자가 올린 화면 스크린샷 한 장을 보고 구조화된 JSON으로 분석해요.

## 규칙
- 이미지에 실제로 보이는 것만 써요. 단일 스크린샷으로 알 수 없는 인터랙션, 이전·다음 화면, 숨은 동작은 추측하지 않고 notVisible에 적어요.
- 분류 값은 아래 목록의 id만 써요. 맞는 것이 없으면 null(또는 빈 배열)로 두고 이유를 reasoning에 적어요.
- 화면 속 개인정보·계좌·이름 같은 민감 값은 옮겨 적지 않아요(필요하면 "이름 입력란"처럼 종류만 써요).
- 다크패턴 여부나 법·규정 준수 판단은 하지 않아요. UX 구조 분석만 해요.
- 각 분류에는 화면에서 보인 근거(evidence)를 한국어 한 줄로 적어요.

## 사용자 과업 (userTask)
${list(TASKS)}

## 화면 유형 (screenType)
${list(SCREEN_TYPES)}

## UI 패턴 (uiPatterns, 여러 개 가능)
${list(UI_PATTERNS)}

## 도메인 (domain)
${list(DOMAINS)}

## 출력
JSON 객체 하나만 출력해요(마크다운·설명 금지). 키:
{
  "domain": {"id": 도메인 id|null, "evidence": string},
  "userTask": {"id": 과업 id|null, "evidence": string},
  "screenType": {"id": 화면 유형 id|null, "evidence": string},
  "components": string[],            // 화면에서 식별한 UI 요소 이름(예: "상단 앱바", "금액 입력 필드", "하단 고정 버튼")
  "uiPatterns": [{"id": UI 패턴 id, "evidence": string}],
  "informationHierarchy": string[],  // 눈에 먼저 들어오는 순서대로 정보 요소(1순위부터)
  "layout": {"summary": string, "characteristics": string[]},  // 배치·정렬·밀도·스크롤 구조 등 보이는 특징
  "primaryAction": {"label": string, "description": string} | null,  // 가장 강조된 행동. 없으면 null
  "notVisible": string[],            // 이 한 장만으로 알 수 없는 것
  "confidence": "high" | "medium" | "low",
  "reasoning": string                // 전체 판단을 2~3문장으로
}`

const CLI_ARGS = (promptFile) => [
  '-p',
  '--input-format', 'stream-json',
  '--output-format', 'stream-json',
  '--verbose',
  '--system-prompt-file', promptFile,
  '--tools', '',
  '--strict-mcp-config',
  '--setting-sources', '',
  '--no-session-persistence',
  ...(process.env.CLAUDE_REVIEW_MODEL ? ['--model', process.env.CLAUDE_REVIEW_MODEL] : []),
]

function parseImage(dataUrl) {
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl ?? '')
  if (!match) throw new Error('PNG·JPEG·WEBP·GIF 이미지만 분석할 수 있어요')
  if (match[2].length * 0.75 > MAX_BYTES) throw new Error('이미지가 너무 커요(8MB 이하로 올려 주세요)')
  return { mediaType: match[1], data: match[2] }
}

function extractJson(text) {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text ?? '')
  const body = fenced ? fenced[1] : text ?? ''
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('AI 응답에서 분석 결과(JSON)를 찾지 못했어요. 다시 시도해 주세요.')
  return JSON.parse(body.slice(start, end + 1))
}

// 모델이 목록에 없는 id를 만들어 내도 화면에는 목록 안의 값만 나가게 걸러요.
const pick = (value, allowed) => (allowed.includes(value) ? value : null)
const str = (v, max = 300) => (typeof v === 'string' ? v.slice(0, max) : '')
const strs = (v, max = 12) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').map((x) => x.slice(0, 200)).slice(0, max) : [])

export function validateScreenAnalysis(raw) {
  const one = (node, allowed) => ({ id: pick(node?.id, allowed), evidence: str(node?.evidence) })
  const seen = new Set()
  const uiPatterns = (Array.isArray(raw?.uiPatterns) ? raw.uiPatterns : [])
    .map((p) => one(p, ids(UI_PATTERNS)))
    .filter((p) => p.id && !seen.has(p.id) && seen.add(p.id))
  return {
    domain: one(raw?.domain, ids(DOMAINS)),
    userTask: one(raw?.userTask, ids(TASKS)),
    screenType: one(raw?.screenType, ids(SCREEN_TYPES)),
    components: strs(raw?.components, 20),
    uiPatterns,
    informationHierarchy: strs(raw?.informationHierarchy),
    layout: { summary: str(raw?.layout?.summary, 400), characteristics: strs(raw?.layout?.characteristics) },
    primaryAction: raw?.primaryAction?.label ? { label: str(raw.primaryAction.label, 100), description: str(raw.primaryAction.description) } : null,
    notVisible: strs(raw?.notVisible),
    confidence: ['high', 'medium', 'low'].includes(raw?.confidence) ? raw.confidence : 'low',
    reasoning: str(raw?.reasoning, 600),
  }
}

let busy = 0 // 동시에 너무 많이 돌리지 않게 막아요
export function analyzeScreen(dataUrl) {
  const { mediaType, data } = parseImage(dataUrl)
  if (busy >= 2) return Promise.reject(new Error('분석 중인 요청이 많아요. 잠시 뒤에 다시 시도해 주세요.'))
  const promptFile = join(tmpdir(), 'ux-lens-screen-analysis-prompt.txt') // 지시문만 들어 있고 이미지는 없어요
  writeFileSync(promptFile, PROMPT, 'utf8')
  const input = JSON.stringify({
    type: 'user',
    message: { role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mediaType, data } }, { type: 'text', text: '이 화면을 분석해 주세요.' }] },
  })
  busy++
  return new Promise((resolve, reject) => {
    const bin = process.env.CLAUDE_BIN || 'claude'
    const child = spawn(bin, CLI_ARGS(promptFile), { cwd: tmpdir(), stdio: ['pipe', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    let settled = false
    const finish = (fn, value) => {
      if (settled) return
      settled = true
      busy--
      clearTimeout(timer)
      fn(value)
    }
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      finish(reject, new Error('분석이 3분 안에 끝나지 않았어요. 다시 시도해 주세요.'))
    }, TIMEOUT_MS)
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (err += d))
    child.stdin.on('error', () => {})
    child.on('error', (e) => finish(reject, new Error(e.code === 'ENOENT' ? `claude CLI를 찾을 수 없어요(${bin})` : e.message)))
    child.on('close', () => {
      try {
        const events = out.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l))
        const result = events.findLast((e) => e.type === 'result')
        if (!result) throw new Error(err.trim().slice(0, 200) || 'Claude Code가 결과를 돌려주지 않았어요')
        if (result.is_error) throw new Error(String(result.result || 'Claude Code 실행 실패').slice(0, 200))
        const model = events.find((e) => e.type === 'system' && e.subtype === 'init')?.model ?? 'Claude Code'
        finish(resolve, { analysis: validateScreenAnalysis(extractJson(result.result)), model: `${model} (Claude Code CLI)`, source: 'ai', analyzedAt: new Date().toISOString() })
      } catch (e) {
        finish(reject, e)
      }
    })
    child.stdin.end(input + '\n')
  })
}
