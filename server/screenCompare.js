// Light: 분석한 화면(원본)과 벤치마킹 사례 2~3개를 같은 기준으로 나란히 비교해요.
// 원본 이미지는 브라우저가 보낸 것을 메모리에서만 쓰고, 사례 이미지는 UI Bowl 이미지 서버에서만 받아요(저장하지 않아요).
import { extractJson, runClaude } from './screenAnalysis.js'

const MAX_CASES = 3
const MAX_BYTES = 8 * 1024 * 1024
// 사례 이미지는 UI Bowl 이미지 서버 주소만 받아요(다른 주소로 서버가 요청을 보내지 않게요).
const IMAGE_HOSTS = ['d31var7gpnk8lm.cloudfront.net']

// 비교 항목: 넓은 말(비교 기준·상세 수준) 대신 무엇을 써야 하는지 분명한 5개예요. AI가 비교 목적에 맞는 3~5개만 골라 써요(purpose는 항상).
export const CRITERIA = [
  { id: 'purpose', label: '사용자 목적', question: '사용자가 이 화면에서 해결하려는 일' },
  { id: 'first', label: '먼저 보이는 정보', question: '첫 화면에서 강조하는 정보와 그 순서' },
  { id: 'decision', label: '판단을 돕는 정보', question: '금리·한도·비용·조건 등 선택에 필요한 정보를 무엇을, 어떻게 보여주는가' },
  { id: 'action', label: '주요 행동', question: '가장 강조된 버튼과 그다음 단계' },
  { id: 'layout', label: '정보 배치', question: '요약·상세 구분, 탭·카드·목록의 활용' },
]
const ALWAYS = ['purpose']

// 사례 관계(브라우저가 분류해서 보내요)에 따라 무엇을 비교할지 달라져요.
export const RELATIONS = {
  'same-step': { label: '같은 과업·같은 단계', focus: '정보 제공 범위, 주요 행동, 구성 방식' },
  'same-task': { label: '같은 과업·다른 단계', focus: '단계별로 필요한 정보와 행동의 차이' },
  'similar-ui': { label: '다른 과업·유사한 UI', focus: '공통된 UI(금액 강조, 카드 구성 등)의 표현 방식만' },
}

const PROMPT = `당신은 자동차·금융 서비스의 UX 벤치마킹 분석가예요. 첫 번째 이미지는 사용자가 분석 중인 '원본' 화면이고, 그다음 이미지들은 비교할 '사례' 화면이에요(순서대로 사례 1, 2, 3).
디자이너·기획자가 "왜 이 사례와 비교했고, 어떤 차이가 있으며, 무엇을 참고할지" 바로 알 수 있게 JSON으로 정리해요. 화면별 설명을 길게 쓰지 말고 '차이'가 드러나게 써요.

## 사례 관계와 비교 범위
각 사례에는 원본과의 관계가 붙어 와요. 관계에 맞춰 비교 범위를 정해요.
${Object.values(RELATIONS).map((r) => `- ${r.label}: ${r.focus}을(를) 비교해요`).join('\n')}
- 사용자 목적이 다른 사례(다른 과업)는 화면 전체를 같은 기준으로 비교하지 말고, 비슷한 UI 표현만 좁혀서 비교해요.
- scope에는 이번 비교 범위를 한 문장으로 써요(예: "사례 1은 이용 중인 대출 현황 화면이라 목적이 달라요. 금액 강조 방식만 비교해요").

## 규칙
- 이미지에 보이는 것만 근거로 써요. 추측은 "(추정)"을 붙여요.
- 어느 쪽이 더 좋다고 단정하지 않아요. 효과는 단정하지 말고 "~할 수 있어요(검증 필요)"처럼 써요.
- 화면 속 개인정보·계좌·이름 같은 민감 값은 옮겨 적지 않아요. 다크패턴·법규 판단은 하지 않아요.
- 사용자가 '참고하려는 점'을 보내면 그 관점의 차이를 우선해서 써요.
- id·영문 코드·null 같은 내부 값은 쓰지 말고 한국어로 써요.

## 비교 항목 (rows)
아래에서 비교 범위에 맞는 3~5개만 골라요. purpose(사용자 목적)는 항상 넣어요. 해당 사례에 그 항목이 의미 없으면 그 칸은 ""(빈 문자열)로 두고, 화면이 잘려서 볼 수 없을 때만 "이미지로 확인 불가"라고 써요.
${CRITERIA.map((c) => `- ${c.id}: ${c.label} — ${c.question}`).join('\n')}

## 출력
JSON 객체 하나만 출력해요(마크다운·설명 금지).
{
  "scope": 비교 범위 한 문장,
  "rows": [{"id": 항목 id, "cells": [원본, 사례1, 사례2, ...]}],   // 3~5개, cells 길이 = 이미지 수, 각 한 문장(짧게)
  "findings": [{
    "difference": 핵심 차이 — 화면에서 관찰한 사실만 한 문장 (예: "원본은 금리·승인 가능성을, 사례 1은 이자지원 혜택을 먼저 강조해요"),
    "reference": 참고할 점 — 원본에 적용할 아이디어 한 문장,
    "check": 적용 전 확인 — 실제 제공 가능한 정보·서비스의 주요 행동과 맞는지 등 확인할 것 한 문장
  }]   // 2~3개, 차이가 큰 것부터
}`

const str = (v, max = 300) => (typeof v === 'string' ? v.slice(0, max) : '')

function parseDataUrl(dataUrl) {
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl ?? '')
  if (!match) throw new Error('원본 이미지를 읽지 못했어요')
  if (match[2].length * 0.75 > MAX_BYTES) throw new Error('원본 이미지가 너무 커요')
  return { type: 'image', source: { type: 'base64', media_type: match[1], data: match[2] } }
}

async function fetchCaseImage(url) {
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('사례 이미지 주소가 올바르지 않아요')
  }
  if (parsed.protocol !== 'https:' || !IMAGE_HOSTS.includes(parsed.hostname)) throw new Error('UI Bowl 이미지만 비교할 수 있어요')
  const res = await fetch(parsed, { signal: AbortSignal.timeout(20_000) })
  if (!res.ok) throw new Error(`사례 이미지를 받지 못했어요(HTTP ${res.status})`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.byteLength > MAX_BYTES) throw new Error('사례 이미지가 너무 커요')
  const type = (res.headers.get('content-type') ?? '').split(';')[0]
  const mediaType = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(type) ? type : 'image/png'
  return { type: 'image', source: { type: 'base64', media_type: mediaType, data: buf.toString('base64') } }
}

const EMPTY_CELL = /^(?:—|-|없음|해당 없음|n\/a|null)?$/i

export function validateCompare(raw, count) {
  const byId = Object.fromEntries((Array.isArray(raw?.rows) ? raw.rows : []).map((r) => [r?.id, r]))
  const wanted = CRITERIA.filter((c) => byId[c.id] || ALWAYS.includes(c.id))
  const rows = (wanted.length > ALWAYS.length ? wanted : CRITERIA)
    .map((c) => ({
      id: c.id,
      label: c.label,
      question: c.question,
      cells: Array.from({ length: count }, (_, i) => {
        const v = str(byId[c.id]?.cells?.[i], 240).trim()
        return EMPTY_CELL.test(v) ? '' : v
      }),
    }))
    // 모든 칸이 비어 있거나 원본 말고는 다 빈 항목은 비교가 안 되니 숨겨요.
    .filter((r) => r.cells.filter(Boolean).length >= 2)
  return {
    scope: str(raw?.scope, 300),
    rows,
    findings: (Array.isArray(raw?.findings) ? raw.findings : [])
      .filter((f) => typeof f?.difference === 'string' && f.difference.trim())
      .slice(0, 3)
      .map((f) => ({ difference: str(f.difference, 240), reference: str(f.reference, 240), check: str(f.check, 240) })),
  }
}

const originalContext = (ctx) => {
  const task = str(ctx?.task, 40)
  const type = str(ctx?.screenType, 20)
  return task || type ? `원본: ${[task && `과업: ${task}`, type && `화면 유형: ${type}`].filter(Boolean).join(', ')}` : ''
}

// cases[].relation: 'same-step' | 'same-task' | 'similar-ui', task·screenType·shared는 한국어 이름이에요. context: 원본의 과업·화면 유형.
export async function compareScreens({ dataUrl, cases, focus, summary, context } = {}) {
  const original = parseDataUrl(dataUrl)
  const list = (Array.isArray(cases) ? cases : []).slice(0, MAX_CASES)
  if (list.length === 0) throw new Error('비교할 사례를 골라 주세요')
  const images = await Promise.all(list.map((c) => fetchCaseImage(c?.imageUrl)))
  const names = [
    originalContext(context),
    ...list.map((c, i) => {
      const rel = RELATIONS[c?.relation] && { ...RELATIONS[c.relation], label: str(c?.relationLabel, 30) || RELATIONS[c.relation].label }
      const about = [str(c?.why, 80) && `근거: ${str(c.why, 80)}`, str(c?.task, 40) && `과업: ${str(c.task, 40)}`, str(c?.screenType, 20) && `화면 유형: ${str(c.screenType, 20)}`, str(c?.shared, 80) && `공통 UI: ${str(c.shared, 80)}`].filter(Boolean).join(', ')
      return `사례 ${i + 1}: ${str(c?.service, 40)} — ${str(c?.title, 60)}${rel ? ` [관계: ${rel.label}]` : ''}${about ? ` (${about})` : ''}`
    }),
  ]
    .filter(Boolean)
    .join('\n')
  const note = [
    typeof summary === 'string' && summary.trim() ? `원본 화면 요약: ${summary.trim().slice(0, 200)}` : '',
    typeof focus === 'string' && focus.trim() ? `참고하려는 점: ${focus.trim().slice(0, 300)}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  const { text, model } = await runClaude(
    PROMPT,
    [original, ...images, { type: 'text', text: `원본과 사례를 비교해 주세요.\n${names}${note ? `\n${note}` : ''}` }],
    { label: '비교', promptName: 'screen-compare' },
  )
  return { compare: validateCompare(extractJson(text, '비교 결과'), list.length + 1), model, comparedAt: new Date().toISOString() }
}
