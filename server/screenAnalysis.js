// Light Phase 2: 업로드한 화면 한 장을 분석해 분류 체계에 맞는 구조화 JSON을 돌려줘요.
// 이미지는 메모리에서 Claude Code CLI 표준 입력(base64)으로만 전달해요. 파일·DB에 저장하지 않고 로그에도 남기지 않아요.
// (CLI 호출에 쓰는 임시 파일은 이미지가 없는 지시문 파일 하나뿐이에요.)
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeFileSync } from 'node:fs'
import { DOMAINS, SCREEN_TYPES, TASK_GROUPS, TASKS, UI_PATTERNS } from '../src/data/benchmark/taxonomy.js'

const TIMEOUT_MS = 3 * 60 * 1000
const MAX_BYTES = 8 * 1024 * 1024
const ids = (list) => list.map((x) => x.id)

const list = (items) => items.map((x) => `- ${x.id}: ${x.label}${x.description ? ` — ${x.description}` : ''}`).join('\n')

const PROMPT = `당신은 자동차·금융 서비스의 UX 벤치마킹 분석가예요. 사용자가 올린 화면 스크린샷 한 장을 보고 구조화된 JSON으로 분석해요.

## 규칙
- 이미지에 실제로 보이는 것만 써요. 단일 스크린샷으로 알 수 없는 인터랙션, 이전·다음 화면, 숨은 동작은 추측하지 않고 notVisible에 적어요.
- 분류 값은 아래 목록의 id만 써요. 맞는 것이 없으면 null(또는 빈 배열)로 두고 이유를 reasoning에 적어요.
- 화면 속 개인정보·계좌·이름 같은 민감 값은 옮겨 적지 않아요(필요하면 "이름 입력란"처럼 종류만 써요).
- 다크패턴 여부나 법·규정 준수 판단은 하지 않아요. UX 구조 분석만 해요.
- 각 분류에는 화면에서 보인 근거(evidence)를 한국어 한 줄로 적어요.

## 사용자 과업 (userTask) — 사용자가 이 화면에서 달성하려는 '목적'만 기준으로 골라요
사용자 과업·화면 유형·UI 패턴은 서로 독립된 분류예요. 화면 유형('결과')이나 UI 패턴('카드')을 과업으로 쓰지 않아요.
실제 앱의 메뉴 이름이 아니라 사용자의 목적으로 판단해요(같은 목적이면 서비스가 달라도 같은 과업이에요).
${TASK_GROUPS.map((g) => `### ${g.id} · ${g.label}\n${list(TASKS.filter((t) => t.group === g.id))}`).join('\n')}

판단 우선순위: ① 화면의 실제 목적 ② 가장 강조된 핵심 CTA(primaryCta) ③ 화면에 보이는 주요 정보 ④ 화면 제목·앱 이름·메뉴 이름(가장 약한 근거). 제목이나 메뉴 이름이 같아도 화면의 목적이 다르면 목적을 따라요.
과업 선택 규칙
- 화면의 주요 목적을 대표하는 세부 과업 하나를 primaryTask(id)로 정하고, 그 대분류를 primaryCategory(id)로 적어요.
- 한 화면에서 명확히 확인되는 다른 목적이 있을 때만 secondaryTasks(id, 최대 2개)로 더해요.
- 헷갈리기 쉬운 쌍은 반드시 구분해요.
  · 한도 조회(금융 이용 가능 금액·조건 확인) ↔ 견적 조회(선택한 상품·차량·기간·금액에 따른 예상 비용 확인)
  · 상품 탐색(여러 상품을 찾아보고 선택) ↔ 상품 비교(복수 상품의 조건을 나란히 검토)
  · 심사 결과 확인(승인·거절·조건부 승인 같은 심사 상태) ↔ 금융 실행·지급 결과 확인(거래가 실제 실행·완료된 상태)
  · 결제·납부 내역 조회(이미 낸 금액과 이력) ↔ 상환 일정 조회(앞으로 낼 금액과 예정일)
  · 차량 구매 견적 조회(차량 가격·옵션 등 차량 구매 비용) ↔ 할부·리스·렌트 견적 조회(금융 조건에 따른 금융 비용)
  · 차량 검색(검색창·필터·조건 입력으로 특정 차량·매물을 찾는 화면) ↔ 차종·모델 탐색(제조사·차종·모델 카테고리를 둘러보며 고르는 화면)
  · 차량 상세 정보 확인(차량·매물 한 대의 정보 중심) ↔ 차량 가격·제원 확인(가격·제원 수치 중심) ↔ 모델·트림·옵션 비교(둘 이상을 나란히 비교)
  · 대출 한도 조회(이용 가능한 금액 중심) ↔ 대출 금리 조회(이율 중심)
  · 주요 서비스 바로가기(아이콘 메뉴가 중심인 홈) ↔ 맞춤형 추천 확인(추천 카드가 중심인 홈)
  · 한 화면에 목적이 여러 개면 가장 크게·위에 강조된 목적을 대표 과업으로 하고, 다른 목적은 보조 과업이에요.
- 분류가 불확실하면 억지로 과업을 정하지 않아요. 비슷한 과업 사이에서 한 장만으로 고를 수 없으면 primaryTask는 null로 두고, 알 수 있는 상위 대분류만 primaryCategory에 적어요(status: needs_review).
- 이미지가 잘렸거나 흐리거나 목적을 알 수 없을 만큼 정보가 부족하면 status를 insufficient_evidence로 해요(범위 밖과는 다른 상태예요).

## 자동차금융 관련성 (relevance) — 과업 분류와 별도로 먼저 판단해요
- direct: 자동차·금융 서비스의 과업을 수행하는 화면(차량 탐색·견적·한도·신청·계약·결제·상환·계약 관리·차량 관리 등)
- common: 자동차금융에 한정되지 않지만 서비스 공통 UX로 참고할 수 있는 화면(로그인, 홈, 설정, 알림, 고객센터, 약관 동의 등)
- out_of_scope: 자동차금융과 관련이 없는 화면(쇼핑·부동산·음식 등 다른 업종의 과업 화면)이거나 실제 사용 화면이 아닌 홍보·스토어 이미지
relevance가 out_of_scope면 과업을 정하지 않고(primaryTask·primaryCategory null) status를 out_of_scope로 해요.

## 상태 (status)
classified(세부 과업 확정) | needs_review(대분류까지만 알거나 유사 과업 사이에서 확정 불가) | out_of_scope(분류 범위 밖) | insufficient_evidence(분석 근거 부족)
- 화면에서 확인되지 않는 기능을 이 서비스가 제공한다고 단정하지 않아요.

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
  "userTask": {"primaryCategory": 대분류 id|null, "primaryTask": 대표 세부 과업 id|null, "secondaryTasks": 보조 세부 과업 id[](최대 2), "classificationConfidence": "high"|"medium"|"low", "relevance": "direct"|"common"|"out_of_scope", "status": "classified"|"needs_review"|"out_of_scope"|"insufficient_evidence", "primaryCta": string|null, "evidence": string},
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

// 대표 과업·대분류가 목록에 없으면 걸러내요. 분류 범위 밖·근거 부족·검토 필요는 서로 다른 상태로 두고, 이때는 과업을 억지로 정하지 않아요.
const RELEVANCE = ['direct', 'common', 'out_of_scope']
const STATUSES = ['classified', 'needs_review', 'out_of_scope', 'insufficient_evidence']
function validateTask(raw) {
  const taskIds = ids(TASKS)
  const relevance = pick(raw?.relevance, RELEVANCE) ?? 'direct'
  let status = pick(raw?.status, STATUSES) ?? (raw?.primaryTask ? 'classified' : 'needs_review')
  if (relevance === 'out_of_scope') status = 'out_of_scope'
  if (status === 'out_of_scope' && relevance !== 'out_of_scope') status = 'needs_review'
  let primary = pick(raw?.primaryTask, taskIds)
  if (status !== 'classified') primary = null
  else if (!primary) status = 'needs_review'
  const category = primary ? TASKS.find((t) => t.id === primary).group : status === 'needs_review' ? pick(raw?.primaryCategory, ids(TASK_GROUPS)) : null
  return {
    categoryId: category,
    id: primary,
    secondaryIds: primary ? (Array.isArray(raw?.secondaryTasks) ? raw.secondaryTasks : []).filter((id) => taskIds.includes(id) && id !== primary).slice(0, 2) : [],
    confidence: ['high', 'medium', 'low'].includes(raw?.classificationConfidence) ? raw.classificationConfidence : 'low',
    relevance,
    status,
    needsReview: status === 'needs_review' || status === 'insufficient_evidence', // 사용자 확인이 필요한 상태(범위 밖은 확인 대상이 아니에요)
    primaryCta: str(raw?.primaryCta, 100) || null,
    evidence: str(raw?.evidence),
  }
}

export function validateScreenAnalysis(raw) {
  const one = (node, allowed) => ({ id: pick(node?.id, allowed), evidence: str(node?.evidence) })
  const seen = new Set()
  const uiPatterns = (Array.isArray(raw?.uiPatterns) ? raw.uiPatterns : [])
    .map((p) => one(p, ids(UI_PATTERNS)))
    .filter((p) => p.id && !seen.has(p.id) && seen.add(p.id))
  return {
    domain: one(raw?.domain, ids(DOMAINS)),
    userTask: validateTask(raw?.userTask),
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
