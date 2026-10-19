// 스크린샷 다크패턴 AI 1차 검토 (Claude API)
// 결과는 참고용 1차 검토예요. 법적 위반 여부를 확정하지 않아요.
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import * as DB from '../src/data/darkPatternRules.js'
import * as RegulationDB from '../src/data/regulationGuideline.js'

const { FALSE_POSITIVES, FRAMEWORK, GUIDE, OVERLAPS, RULES, TYPES } = DB
const FIRST_OR_REPEAT = DB.FIRST_OR_REPEAT // 공개 예시 규칙에는 없을 수 있어요
const { REGULATION, REGULATION_BY_RULE } = RegulationDB

export const MODEL = 'claude-opus-5-5'

const RULE_IDS = RULES.map((r) => r.id)

// 화면 좌표는 이미지 크기와 무관하게 0~1 비율로 받아요.
const Box = z.object({
  x: z.number().describe('왼쪽 위 x (이미지 너비 대비 0~1)'),
  y: z.number().describe('왼쪽 위 y (이미지 높이 대비 0~1)'),
  w: z.number().describe('너비 (0~1)'),
  h: z.number().describe('높이 (0~1)'),
})

const AnalysisSchema = z.object({
  screen: z.object({
    purpose: z.string().describe('이 화면의 목적 한 문장'),
    decision: z.string().describe('고객이 이 화면에서 내려야 하는 실질적 의사결정 (판단 프레임 01 Decision)'),
    stage: z.string().describe('진입 / 입력 / 동의 / 결과 / 완료 / 해지 등 화면 단계'),
  }),
  texts: z
    .array(
      z.object({
        id: z.string().describe('T1, T2 …'),
        text: z.string(),
        role: z.enum(['title', 'body', 'primary_button', 'secondary_button', 'text_button', 'checkbox_label', 'notice', 'badge', 'number', 'other']),
        box: Box,
      }),
    )
    .describe('화면에 보이는 주요 텍스트. 판단에 쓰일 문구는 빠짐없이'),
  components: z
    .array(
      z.object({
        id: z.string().describe('C1, C2 …'),
        type: z.string().describe('버튼, 체크박스, 바텀시트, 팝업, 배너, 카운트다운, 탭 등'),
        label: z.string(),
        state: z.string().describe('강조(Primary)/약함(Text)/체크됨/체크 안 됨/비활성 등. 없으면 빈 문자열'),
        box: Box,
      }),
    )
    .describe('판단에 영향을 주는 주요 UI 구성요소'),
  findings: z
    .array(
      z.object({
        ruleId: z.enum(RULE_IDS),
        verdict: z.enum(['suspect', 'pass', 'hold', 'na']).describe('suspect=위반 의심, pass=기준 충족, hold=판단 보류, na=해당 없음'),
        confidence: z.enum(['low', 'medium', 'high']),
        summary: z.string().describe('판정 한 줄 요약. "위반이다" 같은 확정 표현 금지'),
        reasoning: z.string().describe('판단 프레임 순서(Decision→Information→Choice→Influence→Obstruction)에 따른 근거. 단계마다 "Decision: …"처럼 단계 이름으로 시작하고, 단계 사이는 줄바꿈(\\n)으로 구분'),
        questions: z.array(
          z.object({
            question: z.string().describe('규칙의 판단기준 문항 그대로'),
            answer: z.enum(['yes', 'no', 'unknown']),
            basis: z.string().describe('답의 근거가 된 화면 요소 (T1, C2 등 id 포함)'),
          }),
        ),
        evidence: z.array(
          z.object({
            elementIds: z.array(z.string()),
            box: Box,
            description: z.string(),
          }),
        ),
        guideRefs: z.array(z.string()).describe('근거가 된 가이드 출처 (규칙의 가이드 근거 값)'),
        exceptionApplied: z.string().describe('적용한 예외·오탐 기준. 없으면 빈 문자열'),
        cannotVerify: z.array(z.string()).describe('단일 화면으로 확인할 수 없는 사항 (실제 데이터 여부, 클릭 이후 동작, 이전 동의·거절 상태 등)'),
        improvement: z.string().describe('개선 방향. 기준 충족·해당 없음이면 빈 문자열'),
      }),
    )
    .describe('이 화면과 관련 있다고 본 규칙만. 관련 있지만 해당하지 않으면 verdict=na'),
  notRelevant: z.array(z.enum(RULE_IDS)).describe('화면과 관련이 없어 검토하지 않은 규칙'),
  overall: z.object({
    summary: z.string().describe('전체 1차 검토 요약 2~3문장'),
    nextChecks: z.array(z.string()).describe('검토자가 다음에 확인할 일'),
  }),
})

// 금융위·금감원 가이드라인 원문에서 판단에 쓸 부분만 프롬프트에 넣어요.
function regulationPrompt(reg) {
  const lines = [`금융당국 원문(${REGULATION.issuer} ${REGULATION.date}, ${reg.page}쪽): ${reg.definition}`]
  if (reg.points?.length) lines.push(...reg.points.map((t) => `  - ${t}`))
  if (reg.duties?.length) lines.push(`  사업자 준수사항: ${reg.duties.join(' / ')}`)
  if (reg.exceptions?.length) lines.push(`  원문이 인정하는 예외: ${reg.exceptions.join(' / ')}`)
  if (reg.combine) lines.push(`  결합 시 유의: ${reg.combine}`)
  return lines.join('\n')
}

export function buildSystemPrompt() {
  const rules = RULES.map((r) =>
    [
      `### ${r.id} ${r.type} · ${r.name}${r.typeConflict ? ` (유형 표기 확인 필요: ${r.typeConflict})` : ''}`,
      `정의: ${r.definition}`,
      r.keyQuestion ? `핵심 질문: ${r.keyQuestion}` : '',
      `판단기준(원문):\n${r.questions.map((q) => `- ${q}`).join('\n')}`,
      r.extraQuestions?.length ? `보강 판단 문항(사례·적용 가이드에서 나온 기준):\n${r.extraQuestions.map((e) => `- ${e.q} (${e.source})`).join('\n')}` : '',
      `원문 사례: ${r.example}`,
      `개선: ${r.improvement}`,
      r.exceptions.length ? `예외:\n${r.exceptions.map((e) => `- ${e}`).join('\n')}` : '예외: 원문에 명시된 예외 없음',
      `단일 화면으로 확인할 수 없는 근거: ${r.evidence.join(' / ')}`,
      REGULATION_BY_RULE[r.id] ? regulationPrompt(REGULATION_BY_RULE[r.id]) : '',
      r.cases?.length
        ? `정탐 사례(가이드가 다크패턴으로 판단한 예):\n${r.cases.map((c) => `- ${c.title}: ${c.summary}${c.basis?.length ? ` [근거: ${c.basis.join('; ')}]` : ''}`).join('\n')}`
        : '',
      r.applyGuide
        ? `적용 가이드: ${r.applyGuide.title} — ${r.applyGuide.summary}${r.applyGuide.improvements?.length ? ` 개선: ${r.applyGuide.improvements.join('; ')}` : ''}`
        : '',
      r.notes?.length ? `메모:\n${r.notes.map((n) => `- ${n}`).join('\n')}` : '',
      `가이드 근거: ${r.source.frame}`,
    ]
      .filter(Boolean)
      .join('\n'),
  ).join('\n\n')

  return `당신은 ${GUIDE.title} ${GUIDE.version}에 따라 금융·자동차 서비스 화면을 1차 검토하는 UX 리뷰어예요.
결과는 사람 검토자가 참고하는 1차 검토이며, 법적 위반 여부를 확정하지 않아요.

## 가이드 목적과 원칙
${GUIDE.purpose}
금융당국 원문 일반원칙: ${REGULATION.generalPrinciples.join(' ')}
취약 소비자상 전제: ${REGULATION.consumerModel}
${GUIDE.principle}

## 판단 프레임 (순서대로 검토)
${FRAMEWORK.map((f) => `${f.step} ${f.key}: ${f.question} — ${f.check}`).join('\n')}

## 유형
${Object.entries(TYPES)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}

## 세부 규칙
${rules}

## 다크패턴으로 보기 어려운 사례 (오탐 방지)
${FALSE_POSITIVES.map((f) => `- ${f.title}: ${f.summary}${f.conclusion ? ` → ${f.conclusion.result}. ${f.conclusion.detail}` : ''} (${f.source})`).join('\n')}

${FIRST_OR_REPEAT ? `## 최초 제안과 재 제안 (${FIRST_OR_REPEAT.frame})\n${FIRST_OR_REPEAT.summary}\n` : ''}
## 겹치는 규칙 구분
${OVERLAPS.map((o) => `- ${o.rules.join(' ↔ ')}: ${o.rule} (${o.source})`).join('\n')}

## 판정 규칙
- verdict는 suspect(위반 의심) / pass(기준 충족) / hold(판단 보류) / na(해당 없음) 중 하나예요.
- suspect는 규칙의 정의·판단기준에 해당하는 근거가 화면에서 직접 보일 때만 써요. 버튼 강조나 유사성만으로 suspect로 판단하지 않아요.
- 예외나 오탐 방지 사례에 해당하면 pass로 하고 exceptionApplied에 어떤 기준인지 써요.
- 실제 데이터 여부(예: "100명이 신청 중"이 실시간 집계인지), 클릭 이후 동작, 이전 단계의 동의·거절 상태, 애니메이션처럼 한 장의 화면으로 확인할 수 없는 사실에 판정이 달려 있으면 hold로 하고 cannotVerify에 적어요.
- 검토자가 추가 맥락을 주면 그 맥락을 사실로 받아들이고 판정에 반영해요.
- 화면과 관련이 있어 검토했지만 해당하지 않으면 na, 관련이 없으면 notRelevant에 넣어요.
- "위반이다", "불법", "법 위반" 같은 확정 표현을 쓰지 않아요. "위반 의심", "검토 필요"로 써요.
- 좌표(box)는 이미지 전체를 기준으로 0~1 비율이에요. 근거가 된 영역을 실제 위치에 맞게 넉넉하게 감싸요.
- 모든 문장은 한국어 "-해요"체로 써요.`
}

const SYSTEM_PROMPT = buildSystemPrompt()

let client = null
function getClient() {
  client ??= new Anthropic()
  return client
}

// ── 연결 방식 ─────────────────────────────────────────────
// 1) api: ANTHROPIC_API_KEY로 Claude API 직접 호출
// 2) cli: 이 컴퓨터의 Claude Code CLI(`claude auth login`으로 로그인한 회사 계정)로 호출
// 3) bridge: 이미지를 대기열(reviews/inbox)에 넣고, Claude Code 대화에서 처리한 결과(reviews/outbox)를 받아요
const REVIEWS_DIR = new URL('../reviews/', import.meta.url)
const INBOX = new URL('inbox/', REVIEWS_DIR)
const OUTBOX = new URL('outbox/', REVIEWS_DIR)
export const ANALYSIS_JSON_SCHEMA = z.toJSONSchema(AnalysisSchema)

// claude 실행 파일. PATH와 다른 위치에 설치했다면 server/.env의 CLAUDE_BIN으로 지정해요.
const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude'

let cliState = { checkedAt: 0, loggedIn: false }
function checkCli() {
  if (Date.now() - cliState.checkedAt < 30_000) return cliState.loggedIn
  cliState.checkedAt = Date.now()
  try {
    const out = execFileSync(CLAUDE_BIN, ['auth', 'status'], { encoding: 'utf8', timeout: 10_000 })
    cliState.loggedIn = JSON.parse(out).loggedIn === true
  } catch {
    cliState.loggedIn = false
  }
  return cliState.loggedIn
}

export function getProviders() {
  const api = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)
  const cli = checkCli()
  const active = api ? 'api' : cli ? 'cli' : 'bridge'
  const model = active === 'api' ? MODEL : active === 'cli' ? (process.env.CLAUDE_REVIEW_MODEL ?? 'Claude Code CLI 기본 모델') : 'Claude Code (대화)'
  return { api, cli, bridge: true, active, model }
}

function parseImage(dataUrl) {
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/.exec(dataUrl ?? '')
  if (!match) throw new Error('PNG·JPEG·WEBP·GIF 이미지만 검토할 수 있어요')
  return { mediaType: match[1], data: match[2] }
}

function buildUserText({ context, previous, reviewerNotes, userText }) {
  if (userText) return userText // 저장해 둔 요청을 다시 실행할 때
  return [
    '이 화면을 가이드 기준으로 1차 검토해 주세요.',
    context ? `\n검토자가 준 화면 맥락:\n${context}` : '',
    previous ? `\n이전 1차 검토 결과(JSON):\n${JSON.stringify(previous)}` : '',
    reviewerNotes ? `\n검토자의 재검토 요청과 수정 의견:\n${reviewerNotes}\n위 의견을 반영해 다시 판정하고, 판정이 바뀐 규칙은 reasoning에 이유를 적어 주세요.` : '',
  ].join('')
}

// 어떤 방식으로 만든 결과든 같은 스키마로 검증해요.
export function validateAnalysis(raw) {
  const parsed = AnalysisSchema.safeParse(raw)
  if (!parsed.success) throw new Error(`결과 형식이 규칙과 맞지 않아요: ${parsed.error.issues[0]?.path.join('.')} ${parsed.error.issues[0]?.message}`)
  return parsed.data
}

async function viaApi(request) {
  const { mediaType, data } = parseImage(request.dataUrl)
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high', format: betaZodOutputFormat(AnalysisSchema) },
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
          { type: 'text', text: buildUserText(request) },
        ],
      },
    ],
  })
  if (response.stop_reason === 'refusal') throw new Error(`모델이 이 요청을 처리하지 않았어요 (${response.stop_details?.category ?? '사유 미상'})`)
  if (response.stop_reason === 'max_tokens') throw new Error('결과가 너무 길어 중간에 잘렸어요. 화면을 나눠서 검토해 주세요.')
  if (!response.parsed_output) throw new Error('AI 결과를 해석하지 못했어요. 다시 시도해 주세요.')
  return { analysis: response.parsed_output, model: response.model, provider: 'api' }
}

// Claude Code CLI 헤드리스 모드. 도구·MCP·사용자 설정 없이 이미지와 규칙만으로 판정해요.
// - 이미지를 보내려면 --input-format stream-json이 필요하고, 이때 출력도 stream-json이어야 해요.
// - 모델은 CLI 기본값을 써요. 특정 모델이 필요하면 server/.env에 CLAUDE_REVIEW_MODEL을 넣어요
//   (CLI 버전이 그 모델을 지원해야 해요. 예: claude-opus-5-5는 2.1.280 이상).
const CLI_TIMEOUT_MS = 5 * 60 * 1000

// CLI는 $schema(draft 2020-12) 선언을 인식하지 못해서 그 키만 빼고 넘겨요.
const { $schema: _draft, ...CLI_SCHEMA } = ANALYSIS_JSON_SCHEMA

// CLI의 --json-schema는 출력 형식을 강제하지 않아서, JSON만 쓰라고 지시하고 서버에서 추출·검증해요.
const CLI_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

## 출력 형식
응답은 아래 JSON 스키마를 따르는 JSON 객체 하나만 출력해요. 마크다운, 코드 블록, 설명 문장을 붙이지 않아요.
${JSON.stringify(CLI_SCHEMA)}`

// 코드 블록(\`\`\`json)이나 앞뒤 문장이 섞여 와도 JSON 객체 부분만 꺼내요.
function extractJson(text) {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text ?? '')
  const body = fenced ? fenced[1] : text ?? ''
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('AI 응답에서 검토 결과(JSON)를 찾지 못했어요. 다시 시도해 주세요.')
  return JSON.parse(body.slice(start, end + 1))
}

function viaCli(request) {
  const { mediaType, data } = parseImage(request.dataUrl)
  const args = [
    '-p',
    '--input-format', 'stream-json',
    '--output-format', 'stream-json',
    '--verbose',
    '--json-schema', JSON.stringify(CLI_SCHEMA),
    '--system-prompt', CLI_SYSTEM_PROMPT,
    '--tools', '',
    '--strict-mcp-config',
    '--setting-sources', '',
    '--no-session-persistence',
    ...(process.env.CLAUDE_REVIEW_MODEL ? ['--model', process.env.CLAUDE_REVIEW_MODEL] : []),
  ]
  const input = JSON.stringify({
    type: 'user',
    message: {
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
        { type: 'text', text: buildUserText(request) },
      ],
    },
  })
  return new Promise((resolve, reject) => {
    const child = spawn(CLAUDE_BIN, args, { cwd: tmpdir(), stdio: ['pipe', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    let settled = false
    const finish = (fn, value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      fn(value)
    }
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      finish(reject, new Error('Claude Code 분석이 5분 안에 끝나지 않았어요. 다시 시도해 주세요.'))
    }, CLI_TIMEOUT_MS)

    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (err += d))
    // CLI가 입력을 읽기 전에 끝나도 서버가 죽지 않도록 stdin 오류를 받아요.
    child.stdin.on('error', () => {})
    child.on('error', (e) => finish(reject, new Error(e.code === 'ENOENT' ? 'claude CLI를 찾을 수 없어요' : e.message)))
    child.on('close', () => {
      try {
        const events = out
          .split('\n')
          .filter((l) => l.trim())
          .map((l) => JSON.parse(l))
        const result = events.findLast((e) => e.type === 'result')
        if (!result) throw new Error(err.trim() || 'Claude Code가 결과를 돌려주지 않았어요')
        if (result.is_error) throw new Error(result.result || 'Claude Code 실행 실패')
        const raw = result.structured_output ?? extractJson(result.result)
        // modelUsage에는 요약용 보조 모델도 섞여 있어서, 세션 시작 시 정해진 주 모델을 표시해요.
        const model = events.find((e) => e.type === 'system' && e.subtype === 'init')?.model ?? 'Claude Code'
        finish(resolve, { analysis: validateAnalysis(raw), model: `${model} (Claude Code CLI)`, provider: 'cli' })
      } catch (e) {
        finish(reject, e)
      }
    })
    child.stdin.end(input + '\n')
  })
}

// ── 검토 작업(job) ───────────────────────────────────────
// 모든 방식이 같은 작업 상태를 써요: queued(대기 중) → processing(분석 중) → done(완료) / failed(실패)
// 작업 폴더: reviews/inbox/<id>/ (screen.*, request.json, status.json), 결과: reviews/outbox/<id>.json
const FINAL = ['done', 'failed']

function jobDir(id) {
  if (!/^[\w-]+$/.test(id ?? '')) throw new Error('잘못된 요청 id예요')
  return new URL(`${id}/`, INBOX)
}

export function readStatus(id) {
  const file = new URL('status.json', jobDir(id))
  if (!existsSync(file)) {
    // 상태 파일이 없던 이전 요청은 결과 유무로 판단해요.
    if (existsSync(new URL(`${id}.json`, OUTBOX))) return { state: 'done' }
    if (existsSync(jobDir(id))) return { state: 'queued', provider: 'bridge' }
    return null
  }
  return JSON.parse(readFileSync(file, 'utf8'))
}

export function writeStatus(id, patch) {
  const prev = readStatus(id) ?? {}
  const next = { ...prev, ...patch, updatedAt: new Date().toISOString() }
  writeFileSync(new URL('status.json', jobDir(id)), JSON.stringify(next, null, 2))
  return next
}

function saveResult(id, result) {
  mkdirSync(OUTBOX, { recursive: true })
  writeFileSync(new URL(`${id}.json`, OUTBOX), JSON.stringify({ ...result, analyzedAt: new Date().toISOString() }, null, 2))
}

export function completeJob(id, analysis, model) {
  saveResult(id, { analysis: validateAnalysis(analysis), model })
  writeStatus(id, { state: 'done', error: '' })
}

export function failJob(id, message) {
  writeStatus(id, { state: 'failed', error: message })
}

function listJobs() {
  if (!existsSync(INBOX)) return []
  return readdirSync(INBOX)
    .filter((d) => existsSync(new URL(`${d}/request.json`, INBOX)))
    .map((id) => ({ id, ...readStatus(id) }))
}

// api·cli 방식은 서버가 바로 처리해요. 응답을 기다리지 않고 상태로 진행 상황을 알려줘요.
async function runJob(id, provider, request) {
  writeStatus(id, { state: 'processing', provider, error: '', startedAt: new Date().toISOString() })
  try {
    const result = provider === 'api' ? await viaApi(request) : await viaCli(request)
    completeJob(id, result.analysis, result.model)
  } catch (err) {
    failJob(id, friendlyError(err))
  }
}

// 사용자에게 보여줄 실패 사유. SDK 오류 클래스로 구분해요.
function friendlyError(err) {
  if (err instanceof Anthropic.AuthenticationError) return 'API 키가 올바르지 않아요. server/.env의 ANTHROPIC_API_KEY를 확인해 주세요.'
  if (err instanceof Anthropic.PermissionDeniedError) return '이 API 키로는 해당 모델을 쓸 권한이 없어요.'
  if (err instanceof Anthropic.RateLimitError) return '요청이 많아 잠시 제한됐어요. 1분 뒤 다시 시도해 주세요.'
  if (err instanceof Anthropic.BadRequestError) return `요청을 처리하지 못했어요: ${err.message}`
  if (err instanceof Anthropic.APIConnectionError) return 'Claude API에 연결하지 못했어요. 네트워크를 확인해 주세요.'
  if (err instanceof Anthropic.APIError) return `Claude API 오류(${err.status ?? '알 수 없음'})가 났어요. 다시 시도해 주세요.`
  if (/authentication method/i.test(err.message ?? '')) return 'API 키가 설정되지 않았어요. server/.env에 ANTHROPIC_API_KEY를 넣고 서버를 다시 실행해 주세요.'
  if (/does not support this model/i.test(err.message ?? '')) return 'Claude Code CLI 버전이 이 모델을 지원하지 않아요. 터미널에서 claude update를 실행하거나 CLAUDE_REVIEW_MODEL 설정을 빼 주세요.'
  if (/Not logged in/i.test(err.message ?? '')) return 'Claude Code CLI에 로그인돼 있지 않아요. 터미널에서 claude auth login을 실행해 주세요.'
  return err.message || '분석 중 오류가 났어요'
}

const pendingRequests = new Map() // 서버 재시작 전까지 재시도용 원본 요청을 보관해요

// 서버가 다시 시작되면 api·cli로 분석 중이던 작업은 이어갈 수 없어서 실패로 바꿔요(재시도 가능).
export function recoverInterruptedJobs() {
  for (const job of listJobs()) {
    if (job.state === 'processing' && job.provider !== 'bridge') failJob(job.id, '서버가 다시 시작돼 분석이 중단됐어요. 다시 시도해 주세요.')
  }
}

export function startReview(request) {
  const { mediaType, data } = parseImage(request.dataUrl)
  const userText = buildUserText(request)
  const hash = createHash('sha256').update(data).update(userText).digest('hex').slice(0, 16)

  // 같은 이미지·같은 요청이 아직 끝나지 않았으면 새로 만들지 않고 기존 작업을 돌려줘요.
  const existing = listJobs().find((j) => j.hash === hash && !FINAL.includes(j.state))
  if (existing) return { id: existing.id, state: existing.state, provider: existing.provider, duplicate: true }

  const provider = request.provider ?? getProviders().active
  const id = `${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}-${Math.random().toString(36).slice(2, 6)}`
  const dir = jobDir(id)
  mkdirSync(dir, { recursive: true })
  mkdirSync(OUTBOX, { recursive: true })
  const ext = mediaType.split('/')[1].replace('jpeg', 'jpg')
  writeFileSync(new URL(`screen.${ext}`, dir), Buffer.from(data, 'base64'))
  writeFileSync(
    new URL('request.json', dir),
    JSON.stringify({ id, image: `screen.${ext}`, fileName: request.fileName ?? '', userText, createdAt: new Date().toISOString() }, null, 2),
  )
  writeFileSync(new URL('SYSTEM_PROMPT.md', REVIEWS_DIR), SYSTEM_PROMPT)
  writeFileSync(new URL('SCHEMA.json', REVIEWS_DIR), JSON.stringify(ANALYSIS_JSON_SCHEMA, null, 2))
  writeStatus(id, { state: 'queued', provider, hash, createdAt: new Date().toISOString() })

  if (provider !== 'bridge') {
    pendingRequests.set(id, request)
    runJob(id, provider, request)
  }
  return { id, state: provider === 'bridge' ? 'queued' : 'processing', provider }
}

export function getJob(id) {
  const status = readStatus(id)
  if (!status) return { state: 'missing', error: '요청을 찾을 수 없어요. 취소됐거나 삭제됐을 수 있어요.' }
  // 대기열에 있던 요청은 API 키나 CLI 로그인이 생기면 바로 자동 분석으로 넘겨요.
  // (runJob이 상태를 동기적으로 '분석 중'으로 바꿔서, 연달아 조회해도 한 번만 시작돼요)
  const active = getProviders().active
  if (status.state === 'queued' && active !== 'bridge') {
    runJob(id, active, pendingRequests.get(id) ?? savedRequest(id))
    return { ...status, state: 'processing', provider: active, error: '' }
  }
  if (status.state !== 'done') return status
  const saved = JSON.parse(readFileSync(new URL(`${id}.json`, OUTBOX), 'utf8'))
  return {
    ...status,
    analysis: validateAnalysis(saved.analysis ?? saved),
    model: saved.model ?? 'Claude Code (대화)',
    analyzedAt: saved.analyzedAt ?? status.updatedAt,
  }
}

// 업로드한 화면 파일 경로 (썸네일·새로고침 후 복원용)
export function jobImagePath(id) {
  const req = JSON.parse(readFileSync(new URL('request.json', jobDir(id)), 'utf8'))
  return fileURLToPath(new URL(req.image, jobDir(id)))
}

function savedRequest(id) {
  const req = JSON.parse(readFileSync(new URL('request.json', jobDir(id)), 'utf8'))
  const buf = readFileSync(new URL(req.image, jobDir(id)))
  const ext = req.image.split('.').pop()
  const mediaType = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }[ext] ?? 'image/png'
  return { dataUrl: `data:${mediaType};base64,${buf.toString('base64')}`, userText: req.userText }
}

export function retryJob(id) {
  const status = readStatus(id)
  if (!status) throw new Error('요청을 찾을 수 없어요')
  if (status.state !== 'failed') return status
  const provider = getProviders().active
  if (provider === 'bridge') return writeStatus(id, { state: 'queued', provider: 'bridge', error: '' })
  // 서버가 다시 시작돼 메모리에 원본이 없으면 저장해 둔 이미지·요청 문구로 다시 만들어요.
  const request = pendingRequests.get(id) ?? savedRequest(id)
  runJob(id, provider, request)
  return { ...status, state: 'processing', provider, error: '' }
}

export function cancelJob(id) {
  const status = readStatus(id)
  if (status?.state === 'done') throw new Error('완료된 검토는 취소할 수 없어요')
  rmSync(jobDir(id), { recursive: true, force: true })
  pendingRequests.delete(id)
  return { state: 'cancelled' }
}
