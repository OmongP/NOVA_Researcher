// Light: 분석한 화면(원본)과 벤치마킹 사례 2~3개를 같은 기준으로 나란히 비교해요.
// 원본 이미지는 브라우저가 보낸 것을 메모리에서만 쓰고, 사례 이미지는 UI Bowl 이미지 서버에서만 받아요(저장하지 않아요).
import { runClaude } from './screenAnalysis.js'

const MAX_CASES = 3
const MAX_BYTES = 8 * 1024 * 1024
// 사례 이미지는 UI Bowl 이미지 서버 주소만 받아요(다른 주소로 서버가 요청을 보내지 않게요).
const IMAGE_HOSTS = ['d31var7gpnk8lm.cloudfront.net']

export const CRITERIA = [
  { id: 'first', label: '첫 화면 정보', question: '사용자가 가장 먼저 알게 되는 것은 무엇인가' },
  { id: 'baseline', label: '비교 기준', question: '전월·평균·목표 등 무엇과 비교해 보여주는가(비교가 없으면 없다고)' },
  { id: 'depth', label: '상세 수준', question: '어디까지 요약하고 어디서 상세로 넘기는가' },
  { id: 'action', label: '주요 행동', question: '확인한 뒤 어떤 행동으로 연결하는가' },
  { id: 'composition', label: '구성 방식', question: '같은 정보를 카드·차트·리스트 등으로 어떻게 표현하는가' },
]

const PROMPT = `당신은 자동차·금융 서비스의 UX 벤치마킹 분석가예요. 첫 번째 이미지는 사용자가 분석 중인 '원본' 화면이고, 그다음 이미지들은 비교할 '사례' 화면이에요(순서대로 사례 1, 2, 3).
같은 기준으로 나란히 비교해 실무자가 설계 선택지를 판단할 수 있게 JSON으로 정리해요.

## 규칙
- 이미지에 보이는 것만 근거로 써요. 보이지 않는 부분은 "이미지로 확인 불가"라고 써요. 추측은 "(추정)"을 붙여요.
- 어느 쪽이 더 좋다고 단정하지 않아요. '차이'와 '그 방식이 맞는 조건'으로 써요(예: "지출 변화를 확인하는 목적이라면 전월 비교를 검토할 수 있어요").
- 화면 속 개인정보·계좌·이름 같은 민감 값은 옮겨 적지 않아요. 다크패턴·법규 판단은 하지 않아요.
- 사용자가 '참고하려는 점'을 보내면 그 관점의 차이를 우선해서 써요.

## 비교 기준 (rows, 아래 순서와 id 그대로)
${CRITERIA.map((c) => `- ${c.id}: ${c.label} — ${c.question}`).join('\n')}

## 출력
JSON 객체 하나만 출력해요(마크다운·설명 금지).
{
  "rows": [{"id": 기준 id, "cells": [원본 설명, 사례1 설명, 사례2 설명, ...]}],   // cells 길이 = 이미지 수, 각 한두 문장
  "differences": [{"text": 차이 한 문장, "fitWhen": 각 방식이 맞는 조건 한 문장}],   // 2~4개
  "suggestion": 원본 화면을 설계할 때 검토할 선택지 한두 문장(단정하지 않아요)
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

function extractJson(text) {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text ?? '')
  const body = fenced ? fenced[1] : (text ?? '')
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('AI 응답에서 비교 결과(JSON)를 찾지 못했어요. 다시 시도해 주세요.')
  return JSON.parse(body.slice(start, end + 1))
}

export function validateCompare(raw, count) {
  const byId = Object.fromEntries((Array.isArray(raw?.rows) ? raw.rows : []).map((r) => [r?.id, r]))
  return {
    rows: CRITERIA.map((c) => ({
      id: c.id,
      label: c.label,
      question: c.question,
      cells: Array.from({ length: count }, (_, i) => str(byId[c.id]?.cells?.[i], 240) || '—'),
    })),
    differences: (Array.isArray(raw?.differences) ? raw.differences : [])
      .filter((d) => typeof d?.text === 'string' && d.text.trim())
      .slice(0, 4)
      .map((d) => ({ text: str(d.text, 240), fitWhen: str(d.fitWhen, 240) })),
    suggestion: str(raw?.suggestion, 400),
  }
}

// cases: [{ imageUrl, service, title, dataMonth }]
export async function compareScreens({ dataUrl, cases, focus, summary } = {}) {
  const original = parseDataUrl(dataUrl)
  const list = (Array.isArray(cases) ? cases : []).slice(0, MAX_CASES)
  if (list.length === 0) throw new Error('비교할 사례를 골라 주세요')
  const images = await Promise.all(list.map((c) => fetchCaseImage(c?.imageUrl)))
  const names = list.map((c, i) => `사례 ${i + 1}: ${str(c?.service, 40)} — ${str(c?.title, 60)}`).join('\n')
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
  return { compare: validateCompare(extractJson(text), list.length + 1), model, comparedAt: new Date().toISOString() }
}
