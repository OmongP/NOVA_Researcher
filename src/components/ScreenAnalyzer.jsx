import { useEffect, useMemo, useRef, useState } from 'react'
import { DOMAINS, SCREEN_TYPES, TASK_BY_ID, TASK_GROUPS, TASKS, UI_PATTERNS } from '../data/benchmark/taxonomy'
import { labelOf } from '../lib/benchmark'
import { squash } from '../lib/searchQuery'
import { readJson } from '../lib/http'
import { aiFetch } from '../lib/aiFetch'
import { IS_DEMO } from '../lib/demo'

const MAX_SIDE = 1600

// 올린 이미지는 브라우저 메모리에서만 다뤄요. 긴 변을 줄여 보내고(메타데이터도 함께 사라져요) 어디에도 저장하지 않아요.
function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('이미지를 읽지 못했어요. PNG·JPEG·WEBP 파일인지 확인해 주세요'))
    }
    img.src = url
  })
}

const RELEVANCE_LABEL = { direct: '직접 관련', common: '공통 UX 참고', out_of_scope: '분류 범위 밖' }
const FIELD_LABEL = { userTask: '대표 과업', screenType: '화면 유형', domain: '도메인', uiPatterns: 'UI 패턴', flow: '정보 구조', userGoal: '사용자 목적' }
const FOCUS_CHIPS = ['정보 구조', '데이터 시각화', 'CTA', '전체 구성']
const MAX_COMPARE = 3
const SHOW_CASES = 6

// 관찰(이미지에서 보이는 사실)은 표시 없이, 추정(AI 해석)만 '추정'으로 표시해요.
const Basis = ({ basis }) => (basis === 'inferred' ? <span className="an-badge">추정</span> : null)
const md = (basis) => (basis === 'inferred' ? ' (추정)' : '')
const fmtDate = (iso) => new Date(iso).toLocaleDateString('ko-KR').replace(/\.$/, '') // '2026. 10. 26' (문장 끝 마침표와 겹치지 않게)

// 서버 PC로 가는 요청의 공통 오류 처리(팀 코드·서버 PC 꺼짐)
async function postAi(url, body, label) {
  const res = await aiFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (res.status === 404 || res.status === 405) throw new Error(`${label} 서버를 찾지 못했어요. 서버를 최신 코드로 다시 켜 주세요`)
  if (res.status === 401) throw new Error('팀 코드가 필요해요. 다시 시도하면 팀 코드를 물어봐요')
  if (res.status === 502 || res.status === 503) throw new Error(`지금은 ${label} 서버 PC가 꺼져 있어요. 서버 PC에서 npm run share가 켜져 있어야 해요`)
  const data = await readJson(res)
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data
}
const netError = (e) => (e.message.includes('Failed to fetch') ? (IS_DEMO ? '서버에 연결하지 못했어요. 잠시 뒤에 다시 시도해 주세요' : '서버에 연결하지 못했어요. npm run dev로 서버를 켜 주세요') : e.message)

function Select({ label, value, options, onChange, grouped, emptyLabel = '분류 안 함' }) {
  const option = (o) => (
    <option key={o.id} value={o.id}>
      {o.label}
    </option>
  )
  return (
    <label className="an-field">
      <span className="an-label">{label}</span>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">{emptyLabel}</option>
        {grouped
          ? TASK_GROUPS.map((g) => (
              <optgroup key={g.id} label={g.label}>
                {options.filter((o) => o.group === g.id).map(option)}
              </optgroup>
            ))
          : options.map(option)}
      </select>
    </label>
  )
}

function Notes({ title, items }) {
  if (!items?.length) return null
  return (
    <div className="an-block">
      {title && <h4 className="an-label">{title}</h4>}
      <ul>
        {items.map((t, i) => (
          <li key={i}>
            {typeof t === 'string' ? t : t.text} {typeof t !== 'string' && <Basis basis={t.basis} />}
          </li>
        ))}
      </ul>
    </div>
  )
}

// 참고할 점: 방식 + 적용하기 좋은 조건 + 검토할 한계 + 우리 서비스 검토안
function Takeaways({ title, items }) {
  if (!items?.length) return null
  return (
    <div className="an-block">
      <h4 className="an-label">{title}</h4>
      <ul className="an-takeaways">
        {items.map((t, i) => (
          <li key={i}>
            <strong>{t.text}</strong> <Basis basis={t.basis} />
            {t.when && <span className="an-cond">적용하기 좋은 조건 · {t.when}</span>}
            {t.limit && <span className="an-cond">검토할 한계 · {t.limit}</span>}
            {t.idea && <span className="an-cond">우리 서비스 검토안 · {t.idea}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

// 추천 사례: 같은 목적 → 같은 화면 유형 → 비슷한 구성 → 같은 도메인 순으로 점수를 매기고, 카드마다 추천 이유를 붙여요.
// '같은 목적'은 대표 과업이 같거나, AI가 뽑은 목적 키워드가 사례 화면 이름에 들어 있을 때예요.
export function recommend(pool, analysis, tags) {
  const keywords = analysis.design.benchmarkKeywords ?? []
  const mine = new Set(tags.uiPatterns)
  const seen = new Set()
  const scored = []
  for (const s of pool) {
    const key = `${s.service}|${s.title}`
    if (!s.bm || seen.has(key)) continue
    seen.add(key)
    const text = squash([s.title, s.pattern, s.variant, ...(s.keywords ?? [])].join('|'))
    const sameTask = Boolean(tags.userTask) && s.bm.taskIds[0] === tags.userTask
    const word = keywords.find((k) => squash(k).length >= 2 && text.includes(squash(k)))
    const sameType = Boolean(tags.screenType) && s.bm.screenTypeId === tags.screenType
    const shared = s.bm.patternIds.filter((p) => mine.has(p))
    const sameDomain = Boolean(tags.domain) && s.bm.domainId === tags.domain
    const reasons = []
    if (sameTask) reasons.push(`같은 과업 · ${labelOf.task(tags.userTask)}`)
    else if (word) reasons.push(`같은 목적 · ‘${word}’ 화면`)
    if (sameType) reasons.push(`같은 화면 유형 · ${labelOf.screenType(tags.screenType)}`)
    if (shared.length >= 2) reasons.push(`비슷한 구성 · ${shared.slice(0, 2).map((p) => labelOf.pattern(p)).join('+')}`)
    if (sameDomain) reasons.push(`같은 도메인 · ${labelOf.domain(tags.domain)}`)
    const score = (sameTask ? 8 : word ? 6 : 0) + (sameType ? 3 : 0) + (shared.length >= 2 ? 2 : 0) + (sameDomain ? 1 : 0)
    if (score > 0) scored.push({ s, score, reasons, purpose: sameTask || Boolean(word) })
  }
  const byScore = (a, b) => b.score - a.score || (b.s.dataMonth ?? '').localeCompare(a.s.dataMonth ?? '')
  return {
    purpose: scored.filter((x) => x.purpose).sort(byScore),
    // 목적이 다르면 '넓힌 참고 범위'예요. 화면 유형·구성이 같은 것만 넣어요(도메인만 같은 건 너무 넓어요).
    broader: scored.filter((x) => !x.purpose && x.score >= 3).sort(byScore),
  }
}

// 기획서·디자인 검토에 붙여 넣을 Markdown
function toMarkdown({ a, tags, result, focus, compare, cases }) {
  const d = a.design
  const list = (items) => items.map((t) => `- ${typeof t === 'string' ? t : t.text + md(t.basis)}`).join('\n')
  const tk = (items) =>
    items.map((t) => [`- **${t.text}**${md(t.basis)}`, t.when && `  - 적용하기 좋은 조건: ${t.when}`, t.limit && `  - 검토할 한계: ${t.limit}`, t.idea && `  - 우리 서비스 검토안: ${t.idea}`].filter(Boolean).join('\n')).join('\n')
  const parts = [`# 화면 분석${d.summary ? ` — ${d.summary}` : ''}`]
  if (focus) parts.push(`**참고하려는 점** ${focus}`)
  if (d.userGoal) parts.push(`**사용자 목적** ${d.userGoal.text}${md(d.userGoal.basis)}`)
  if (d.keyInfo.length) parts.push(`## 핵심 정보\n${list(d.keyInfo)}`)
  if (a.primaryAction) parts.push(`**주요 행동** ${a.primaryAction.label} — ${a.primaryAction.description}`)
  if (d.flow) parts.push(`## 정보 구조\n${d.flow}${d.flowNote ? `\n※ ${d.flowNote}` : ''}`)
  if (d.takeaways.pm.length || d.takeaways.designer.length)
    parts.push(`## 핵심 벤치마킹 포인트\n${d.takeaways.pm.length ? `**PM 관점**\n${tk(d.takeaways.pm)}\n` : ''}${d.takeaways.designer.length ? `**디자이너 관점**\n${tk(d.takeaways.designer)}` : ''}`)
  if (compare) {
    const head = ['비교 항목', '원본', ...cases.map((c, i) => `사례 ${i + 1}`)]
    const rows = compare.rows.map((r) => [r.label, ...r.cells].map((c) => c.replace(/\|/g, '/')))
    parts.push(
      `## 사례 비교\n${cases.map((c, i) => `- 사례 ${i + 1}: ${c.service} — ${c.title} (UI Bowl 수집월 ${c.dataMonth ?? '확인 필요'}) ${c.uiUrl ?? ''}`).join('\n')}\n\n| ${head.join(' | ')} |\n| ${head.map(() => '---').join(' | ')} |\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}`,
    )
    if (compare.differences.length) parts.push(`**차이와 적합한 조건**\n${compare.differences.map((x) => `- ${x.text}${x.fitWhen ? ` → ${x.fitWhen}` : ''}`).join('\n')}`)
    if (compare.suggestion) parts.push(`**검토할 선택지** ${compare.suggestion}`)
  }
  if (d.openQuestions.pm.length || d.openQuestions.designer.length)
    parts.push(`## 추가 확인 사항\n${d.openQuestions.pm.length ? `**정책·데이터·흐름**\n${list(d.openQuestions.pm)}\n` : ''}${d.openQuestions.designer.length ? `**상태·예외**\n${list(d.openQuestions.designer)}` : ''}`)
  if (d.uncertain.length) parts.push(`## 확인 필요\n${d.uncertain.map((u) => `- ${FIELD_LABEL[u.field]} — ${u.reason}`).join('\n')}`)
  const tagLine = [
    tags.domain && labelOf.domain(tags.domain),
    tags.userTask ? labelOf.task(tags.userTask) : tags.category && `${labelOf.taskGroup(tags.category)}(세부 과업 미확정)`,
    tags.screenType && labelOf.screenType(tags.screenType),
    ...tags.uiPatterns.map((p) => labelOf.pattern(p)),
  ].filter(Boolean)
  parts.push(`## 분류\n${tagLine.join(' · ')}`)
  parts.push(`_UX Lens AI 1차 분석 · AI 분석일 ${fmtDate(result.analyzedAt)}${compare ? ` · 비교 분석일 ${fmtDate(compare.comparedAt)}` : ''}. ‘(추정)’은 이미지에서 확인한 사실이 아니라 AI의 해석이에요. 사례 화면의 날짜는 UI Bowl 수집월이에요._`)
  return parts.join('\n\n')
}

// pool: 비교할 벤치마킹 화면(벤치마킹 DB, bm 분류가 붙은 화면). onFindSimilar(taskIds): Explore에서 같은 과업 화면 보기.
export default function ScreenAnalyzer({ pool = [], onFindSimilar }) {
  const [preview, setPreview] = useState(null) // { dataUrl, name }
  const [focus, setFocus] = useState('') // 이번에 참고하려는 점(선택)
  const [state, setState] = useState({ status: 'idle' }) // idle | loading | done | error
  const [tags, setTags] = useState(null) // 사용자가 확인·수정하는 값
  const [edited, setEdited] = useState(false)
  const [userEdited, setUserEdited] = useState({}) // 사용자가 직접 고친 항목: 재분석해도 덮어쓰지 않아요
  const [dragging, setDragging] = useState(false)
  const [copied, setCopied] = useState(null) // 'md' | 'json'
  const [broaden, setBroaden] = useState(false)
  const [picked, setPicked] = useState([]) // 비교할 사례 id
  const [cmp, setCmp] = useState({ status: 'idle' }) // 비교 결과
  const input = useRef(null)
  const casesRef = useRef(null)

  function clearResult() {
    setState({ status: 'idle' })
    setTags(null)
    setEdited(false)
    setUserEdited({})
    setPicked([])
    setBroaden(false)
    setCmp({ status: 'idle' })
  }

  async function load(file) {
    if (!file) return
    clearResult()
    try {
      setPreview({ dataUrl: await toDataUrl(file), name: file.name })
    } catch (e) {
      setPreview(null)
      setState({ status: 'error', error: e.message })
    }
  }

  // 클립보드에 복사한 스크린샷도 붙여 넣을 수 있어요.
  useEffect(() => {
    const onPaste = (e) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'))
      if (file) load(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  async function analyze() {
    setState({ status: 'loading' })
    setCmp({ status: 'idle' })
    setPicked([])
    try {
      // 사이트에서는 요청이 서버 PC(npm run share)로 전달되고, 팀 코드가 필요해요(aiFetch가 물어봐요).
      const data = await postAi('/api/analyze', { dataUrl: preview.dataUrl, focus }, '화면 분석')
      setState({ status: 'done', result: data })
      const fresh = {
        domain: data.analysis.domain.id,
        userTask: data.analysis.userTask.id,
        category: data.analysis.userTask.categoryId,
        secondary: data.analysis.userTask.secondaryIds,
        screenType: data.analysis.screenType.id,
        uiPatterns: data.analysis.uiPatterns.map((p) => p.id),
        components: data.analysis.components,
      }
      // 재분석: 사용자가 고친 항목은 그대로 두고, 나머지만 새 AI 결과로 바꿔요.
      setTags((prev) => (prev ? Object.fromEntries(Object.entries(fresh).map(([k, v]) => [k, userEdited[k] ? prev[k] : v])) : fresh))
    } catch (e) {
      setState({ status: 'error', error: netError(e) })
    }
  }

  const change = (patch) => {
    setTags((t) => ({ ...t, ...patch }))
    setUserEdited((u) => ({ ...u, ...Object.fromEntries(Object.keys(patch).map((k) => [k, true])) }))
    setEdited(true)
  }
  const togglePattern = (id) => change({ uiPatterns: tags.uiPatterns.includes(id) ? tags.uiPatterns.filter((p) => p !== id) : [...tags.uiPatterns, id] })
  const toggleFocusChip = (chip) =>
    setFocus((f) => {
      const parts = f.split(',').map((x) => x.trim()).filter(Boolean)
      return (parts.includes(chip) ? parts.filter((x) => x !== chip) : [...parts, chip]).join(', ')
    })

  function reset() {
    setPreview(null)
    clearResult()
    if (input.current) input.current.value = ''
  }

  const result = state.status === 'done' ? state.result : null
  const a = result?.analysis
  const d = a?.design

  const rec = useMemo(() => (a && tags ? recommend(pool, a, tags) : { purpose: [], broader: [] }), [pool, a, tags])
  const shown = rec.purpose.length ? rec.purpose : broaden ? rec.broader : []
  const caseById = useMemo(() => Object.fromEntries([...rec.purpose, ...rec.broader].map((x) => [x.s.id, x.s])), [rec])
  const pickedCases = picked.map((id) => caseById[id]).filter(Boolean)
  const sameTaskIds = tags?.userTask && rec.purpose.some((x) => x.s.bm.taskIds[0] === tags.userTask) ? [tags.userTask] : null

  const togglePick = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= MAX_COMPARE ? p : [...p, id]))

  async function runCompare() {
    setCmp({ status: 'loading' })
    try {
      const data = await postAi(
        '/api/compare',
        {
          dataUrl: preview.dataUrl,
          focus,
          summary: d.summary,
          cases: pickedCases.map((s) => ({ imageUrl: s.image, service: s.service, title: s.title, dataMonth: s.dataMonth })),
        },
        '화면 비교',
      )
      setCmp({ status: 'done', result: { ...data.compare, comparedAt: data.comparedAt, model: data.model }, cases: pickedCases })
    } catch (e) {
      setCmp({ status: 'error', error: netError(e) })
    }
  }

  const copy = async (kind) => {
    const text =
      kind === 'md'
        ? toMarkdown({ a, tags, result, focus: result.focus, compare: cmp.status === 'done' ? cmp.result : null, cases: cmp.cases ?? [] })
        : JSON.stringify(
            {
              focus: result.focus,
              domain: tags.domain,
              primaryTaskCategory: tags.category,
              primaryTask: tags.userTask,
              secondaryTasks: tags.secondary,
              relevance: a.userTask.relevance,
              taskStatus: a.userTask.status,
              tagSources: Object.fromEntries(['domain', 'userTask', 'screenType', 'uiPatterns', 'components'].map((k) => [k, userEdited[k] ? 'user' : 'ai'])),
              screenType: tags.screenType,
              uiComponents: tags.components,
              uiPatterns: tags.uiPatterns,
              primaryAction: a.primaryAction,
              design: a.design,
              compare: cmp.status === 'done' ? { cases: cmp.cases.map((s) => ({ service: s.service, title: s.title, dataMonth: s.dataMonth, uiUrl: s.uiUrl })), ...cmp.result } : null,
              meta: { source: edited ? 'ai+user-edited' : 'ai', model: result.model, analyzedAt: result.analyzedAt },
            },
            null,
            2,
          )
    await navigator.clipboard.writeText(text)
    setCopied(kind)
    setTimeout(() => setCopied(null), 1800)
  }

  const tagChips = tags && [
    tags.domain && labelOf.domain(tags.domain),
    tags.userTask ? labelOf.task(tags.userTask) : tags.category ? `${labelOf.taskGroup(tags.category)} · 세부 과업 확인 필요` : '과업 확인 필요',
    tags.screenType && labelOf.screenType(tags.screenType),
    ...tags.uiPatterns.map((p) => labelOf.pattern(p)),
  ].filter(Boolean)

  return (
    <section className="an">
      {!preview ? (
        <div
          className={`an-drop ${dragging ? 'is-dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            load(e.dataTransfer.files?.[0])
          }}
        >
          <strong>분석할 화면 이미지를 올려 주세요</strong>
          <p>끌어다 놓거나, 붙여넣기(Ctrl/⌘+V) 하거나, 파일을 골라요. PNG · JPEG · WEBP</p>
          <button type="button" className="button" onClick={() => input.current?.click()}>
            파일 선택
          </button>
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => load(e.target.files?.[0])} />
          <p className="an-note">올린 이미지는 분석하는 동안만 쓰고 서버·DB에 저장하지 않아요. 분석은 {IS_DEMO ? '팀 서버 PC' : '이 PC'}의 Claude Code로 해요{IS_DEMO && '(팀 코드 필요)'}.</p>
          {state.status === 'error' && <p className="an-error">{state.error}</p>}
        </div>
      ) : (
        <div className="an-layout">
          <div className="an-shot">
            <img src={preview.dataUrl} alt="분석할 화면" />
            {/* 분석 전에 '이번에 무엇을 참고하려는지' 받아요(선택). 분석·비교에 계속 써요. */}
            <label className="an-focus">
              <span className="an-label">어떤 점을 참고하고 싶으세요? (선택)</span>
              <textarea
                value={focus}
                maxLength={300}
                rows={3}
                placeholder="예: 차계부와 소비 리포트를 통합하면서 첫 화면의 정보 우선순위를 정하고 싶어요"
                onChange={(e) => setFocus(e.target.value)}
                disabled={state.status === 'loading'}
              />
            </label>
            <div className="an-focus-chips">
              {FOCUS_CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`an-chip ${focus.split(',').map((x) => x.trim()).includes(c) ? 'is-on' : ''}`}
                  onClick={() => toggleFocusChip(c)}
                  disabled={state.status === 'loading'}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="an-actions">
              <button type="button" className="button button-primary" onClick={analyze} disabled={state.status === 'loading'}>
                {state.status === 'loading' ? '분석하는 중… (1~2분)' : result ? '다시 분석' : '분석하기'}
              </button>
              <button type="button" className="button" onClick={reset} disabled={state.status === 'loading'}>
                다른 이미지
              </button>
            </div>
            {state.status === 'error' && <p className="an-error">{state.error}</p>}
          </div>

          {result && tags && (
            <div className="an-result">
              <div className="an-topbar">
                <button type="button" className="button" onClick={() => casesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  비교 사례 보기
                </button>
                <button type="button" className="button" onClick={() => copy('md')}>
                  {copied === 'md' ? '복사했어요' : '분석 내용 복사'}
                </button>
              </div>

              {/* 1. 화면 요약 */}
              <section className="an-section" aria-label="화면 요약">
                <h3 className="an-h">화면 요약</h3>
                {result.focus && <p className="an-evidence">참고하려는 점 · {result.focus}</p>}
                {d.summary ? <p className="an-lead">{d.summary}</p> : <p className="an-lead">{a.reasoning}</p>}
                {d.userGoal && (
                  <div className="an-block">
                    <h4 className="an-label">사용자 목적</h4>
                    <p>
                      {d.userGoal.text} <Basis basis={d.userGoal.basis} />
                    </p>
                  </div>
                )}
                <Notes title="핵심 정보" items={d.keyInfo} />
                <div className="an-block">
                  <h4 className="an-label">주요 행동</h4>
                  <p>{a.primaryAction ? `${a.primaryAction.label} — ${a.primaryAction.description}` : '뚜렷한 주요 행동이 보이지 않아요'}</p>
                </div>
                {d.uncertain.length > 0 && (
                  <ul className="an-uncertain" aria-label="확인이 필요한 항목">
                    {d.uncertain.map((u, i) => (
                      <li key={i}>
                        <strong>{FIELD_LABEL[u.field]} 확인 필요</strong> — {u.reason}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="an-tags" aria-label="분류">
                  {tagChips.map((t, i) => (
                    <span key={i} className="an-tag">
                      {t}
                    </span>
                  ))}
                </div>
              </section>

              {/* 2. 핵심 벤치마킹 포인트 */}
              <section className="an-section" aria-label="핵심 벤치마킹 포인트">
                <h3 className="an-h">핵심 벤치마킹 포인트</h3>
                {d.flow && (
                  <div className="an-block">
                    <h4 className="an-label">정보 구조</h4>
                    <p className="an-flow">{d.flow}</p>
                    {d.flowNote && <p className="an-evidence">※ {d.flowNote}</p>}
                  </div>
                )}
                {(d.takeaways.pm.length > 0 || d.takeaways.designer.length > 0) && (
                  <div className="an-two an-boxed">
                    <Takeaways title="PM 관점" items={d.takeaways.pm} />
                    <Takeaways title="디자이너 관점" items={d.takeaways.designer} />
                  </div>
                )}
                {(d.composition.length > 0 || a.layout.characteristics.length > 0) && (
                  <details className="an-more">
                    <summary>구성 방식 자세히</summary>
                    <Notes items={d.composition.length ? d.composition : a.layout.characteristics} />
                  </details>
                )}
              </section>

              {/* 3. 추천·비교 사례 */}
              <section className="an-section" aria-label="추천·비교 사례" ref={casesRef}>
                <h3 className="an-h">추천·비교 사례</h3>
                {rec.purpose.length > 0 ? (
                  <p className="an-evidence">같은 목적의 벤치마킹 화면 {rec.purpose.length}개예요. 같은 목적 → 같은 화면 유형 → 비슷한 구성 → 같은 도메인 순으로 골랐어요.</p>
                ) : (
                  <div className="an-empty-cases">
                    <p>
                      <strong>같은 과업의 사례가 없어요.</strong> 목적이 같은 화면을 벤치마킹 DB에서 찾지 못했어요.
                    </p>
                    {rec.broader.length > 0 && !broaden && (
                      <button type="button" className="link-button" onClick={() => setBroaden(true)}>
                        참고 범위 넓히기 — 같은 화면 유형·비슷한 구성 {rec.broader.length}개 보기
                      </button>
                    )}
                    {broaden && <p className="an-evidence">목적은 다르지만 화면 유형이나 구성이 비슷한 사례예요. 그대로 따라 하기보다 표현 방식을 참고해 주세요.</p>}
                  </div>
                )}
                {shown.length > 0 && (
                  <>
                    <div className="an-cases">
                      {shown.slice(0, SHOW_CASES).map(({ s, reasons }) => {
                        const on = picked.includes(s.id)
                        const full = !on && picked.length >= MAX_COMPARE
                        return (
                          <div key={s.id} className={`an-case ${on ? 'is-on' : ''}`}>
                            <a href={s.uiUrl} target="_blank" rel="noreferrer" title="UI Bowl 원본 보기">
                              {s.image && <img src={s.image} alt="" loading="lazy" />}
                            </a>
                            <span className="an-similar-name">{s.service}</span>
                            <span className="an-similar-title">{s.title}</span>
                            <span className="an-case-reasons">
                              {reasons.slice(0, 2).map((r) => (
                                <span key={r}>{r}</span>
                              ))}
                            </span>
                            <label className={`an-case-pick ${full ? 'is-disabled' : ''}`} title={full ? `최대 ${MAX_COMPARE}개까지 비교할 수 있어요` : undefined}>
                              <input type="checkbox" checked={on} disabled={full} onChange={() => togglePick(s.id)} /> 비교에 추가
                            </label>
                          </div>
                        )
                      })}
                    </div>
                    <div className="an-actions">
                      <button type="button" className="button button-primary" disabled={picked.length === 0 || cmp.status === 'loading'} onClick={runCompare}>
                        {cmp.status === 'loading' ? '비교하는 중… (1~2분)' : picked.length ? `선택한 ${picked.length}개와 나란히 비교` : '비교할 사례를 골라 주세요 (최대 3개)'}
                      </button>
                      {sameTaskIds && onFindSimilar && (
                        <button type="button" className="button" onClick={() => onFindSimilar(sameTaskIds)}>
                          Explore에서 같은 과업 보기
                        </button>
                      )}
                    </div>
                  </>
                )}
                {cmp.status === 'error' && <p className="an-error">{cmp.error}</p>}
                {cmp.status === 'done' && (
                  <div className="an-compare">
                    <div className="an-compare-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th scope="col">비교 항목</th>
                            <th scope="col">
                              <img src={preview.dataUrl} alt="" />
                              원본
                            </th>
                            {cmp.cases.map((s, i) => (
                              <th key={s.id} scope="col">
                                <img src={s.image} alt="" />
                                사례 {i + 1} · {s.service}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {cmp.result.rows.map((r) => (
                            <tr key={r.id}>
                              <th scope="row" title={r.question}>
                                {r.label}
                              </th>
                              {r.cells.map((c, i) => (
                                <td key={i}>{c}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {cmp.result.differences.length > 0 && (
                      <div className="an-block an-boxed-single">
                        <h4 className="an-label">차이와 적합한 조건</h4>
                        <ul>
                          {cmp.result.differences.map((x, i) => (
                            <li key={i}>
                              {x.text}
                              {x.fitWhen && <span className="an-cond">{x.fitWhen}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {cmp.result.suggestion && <p className="an-evidence">검토할 선택지 · {cmp.result.suggestion}</p>}
                    <p className="an-note">사례 날짜는 UI Bowl 수집월({cmp.cases.map((s) => s.dataMonth ?? '확인 필요').join(', ')}), 비교 분석일은 {fmtDate(cmp.result.comparedAt)}이에요.</p>
                  </div>
                )}
              </section>

              {/* 4. 접어 두는 영역: 추가 확인 사항 · 분류 수정 · 상세 정보 */}
              {(d.openQuestions.pm.length > 0 || d.openQuestions.designer.length > 0 || a.notVisible.length > 0) && (
                <details className="an-more">
                  <summary>추가 확인 사항</summary>
                  {d.openQuestions.pm.length || d.openQuestions.designer.length ? (
                    <div className="an-two">
                      <Notes title="정책·데이터·흐름" items={d.openQuestions.pm} />
                      <Notes title="상태·예외" items={d.openQuestions.designer} />
                    </div>
                  ) : (
                    <Notes items={a.notVisible} />
                  )}
                </details>
              )}

              <details className="an-more">
                <summary>분류 수정하기{edited && ' · 내가 수정함'}</summary>
                <div className="an-edit-body">
                  <p className="an-evidence">자동차금융 관련성: {RELEVANCE_LABEL[a.userTask.relevance]}</p>
                  <div className="an-fields">
                    <Select label="도메인" value={tags.domain} options={DOMAINS} onChange={(v) => change({ domain: v })} />
                    <Select label="대표 과업" value={tags.userTask} options={TASKS} grouped emptyLabel="분류 검토 필요" onChange={(v) => change({ userTask: v, category: v ? TASK_BY_ID[v].group : tags.category })} />
                    <Select label="화면 유형" value={tags.screenType} options={SCREEN_TYPES} onChange={(v) => change({ screenType: v })} />
                  </div>
                  {tags.secondary.length > 0 && (
                    <div className="an-block">
                      <h4 className="an-label">보조 과업 (누르면 뺄 수 있어요)</h4>
                      <div className="bm-chips">
                        {tags.secondary.map((id) => (
                          <button key={id} type="button" className="bm-selected" onClick={() => change({ secondary: tags.secondary.filter((x) => x !== id) })}>
                            {labelOf.task(id)} <span aria-hidden="true">×</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="an-block">
                    <h4 className="an-label">UI 패턴</h4>
                    <div className="bm-options">
                      {UI_PATTERNS.map((p) => {
                        const on = tags.uiPatterns.includes(p.id)
                        return (
                          <label key={p.id} className={`bm-option ${on ? 'is-on' : ''}`}>
                            <input type="checkbox" checked={on} onChange={() => togglePattern(p.id)} />
                            <span>{p.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                  <div className="an-block">
                    <h4 className="an-label">UI 컴포넌트 (누르면 뺄 수 있어요)</h4>
                    <div className="bm-chips">
                      {tags.components.map((c) => (
                        <button key={c} type="button" className="bm-selected" onClick={() => change({ components: tags.components.filter((x) => x !== c) })}>
                          {c} <span aria-hidden="true">×</span>
                        </button>
                      ))}
                      {tags.components.length === 0 && <span className="an-evidence">식별된 요소가 없어요</span>}
                    </div>
                  </div>
                  <p className="an-note">분류를 고치면 추천 사례도 다시 골라요. 수정한 내용은 이 화면을 닫으면 사라져요.</p>
                </div>
              </details>

              <details className="an-more">
                <summary>상세 정보</summary>
                <p className="an-meta">
                  {result.model} · AI 분석일 {new Date(result.analyzedAt).toLocaleString('ko-KR')}
                </p>
                <p className="an-meta">{a.reasoning}</p>
                <button type="button" className="link-button" onClick={() => copy('json')}>
                  {copied === 'json' ? '복사했어요' : '결과 JSON 복사'}
                </button>
              </details>
              <p className="an-note">AI가 이미지를 보고 만든 1차 분석이에요. ‘추정’ 표시는 이미지에서 확인한 사실이 아니라 AI의 해석이에요.</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
