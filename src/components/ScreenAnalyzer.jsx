import { useEffect, useRef, useState } from 'react'
import { DOMAINS, SCREEN_TYPES, TASK_BY_ID, TASK_GROUPS, TASKS, UI_PATTERNS } from '../data/benchmark/taxonomy'
import { labelOf } from '../lib/benchmark'
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

const CONFIDENCE = { high: '확실', medium: '보통', low: '낮음' }
const RELEVANCE_LABEL = { direct: '직접 관련', common: '공통 UX 참고', out_of_scope: '분류 범위 밖' }

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

function List({ title, items }) {
  if (!items?.length) return null
  return (
    <div className="an-block">
      <h4 className="an-label">{title}</h4>
      <ul>
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  )
}

export default function ScreenAnalyzer() {
  const [preview, setPreview] = useState(null) // { dataUrl, name }
  const [state, setState] = useState({ status: 'idle' }) // idle | loading | done | error
  const [tags, setTags] = useState(null) // 사용자가 확인·수정하는 값
  const [edited, setEdited] = useState(false)
  const [userEdited, setUserEdited] = useState({}) // 사용자가 직접 고친 항목: 재분석해도 덮어쓰지 않아요
  const [dragging, setDragging] = useState(false)
  const [copied, setCopied] = useState(false)
  const input = useRef(null)

  async function load(file) {
    if (!file) return
    setState({ status: 'idle' })
    setTags(null)
    setEdited(false)
    setUserEdited({})
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
    try {
      // 사이트에서는 요청이 서버 PC(npm run share)로 전달되고, 팀 코드가 필요해요(aiFetch가 물어봐요).
      const res = await aiFetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataUrl: preview.dataUrl }) })
      if (res.status === 404 || res.status === 405) throw new Error('화면 분석 서버를 찾지 못했어요. 서버를 최신 코드로 다시 켜 주세요')
      if (res.status === 401) throw new Error('팀 코드가 필요해요. 다시 분석하면 팀 코드를 물어봐요')
      if (res.status === 502 || res.status === 503) throw new Error('지금은 화면 분석 서버 PC가 꺼져 있어요. 서버 PC에서 npm run share가 켜져 있어야 분석할 수 있어요')
      const data = await readJson(res)
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
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
      setState({ status: 'error', error: e.message.includes('Failed to fetch') ? (IS_DEMO ? '분석 서버에 연결하지 못했어요. 잠시 뒤에 다시 시도해 주세요' : '분석 서버에 연결하지 못했어요. npm run dev로 서버를 켜 주세요') : e.message })
    }
  }

  const change = (patch) => {
    setTags((t) => ({ ...t, ...patch }))
    setUserEdited((u) => ({ ...u, ...Object.fromEntries(Object.keys(patch).map((k) => [k, true])) }))
    setEdited(true)
  }
  const togglePattern = (id) => change({ uiPatterns: tags.uiPatterns.includes(id) ? tags.uiPatterns.filter((p) => p !== id) : [...tags.uiPatterns, id] })

  function reset() {
    setPreview(null)
    setTags(null)
    setEdited(false)
    setUserEdited({})
    setState({ status: 'idle' })
    if (input.current) input.current.value = ''
  }

  const result = state.status === 'done' ? state.result : null
  const a = result?.analysis

  const json = () =>
    JSON.stringify(
      {
        domain: tags.domain,
        primaryTaskCategory: tags.category,
        primaryTask: tags.userTask,
        secondaryTasks: tags.secondary,
        classificationConfidence: a.userTask.confidence,
        relevance: a.userTask.relevance,
        taskStatus: a.userTask.status,
        taskNeedsReview: !tags.userTask,
        evidence: a.userTask.evidence,
        tagSources: Object.fromEntries(['domain', 'userTask', 'screenType', 'uiPatterns', 'components'].map((k) => [k, userEdited[k] ? 'user' : 'ai'])),
        screenType: tags.screenType,
        uiComponents: tags.components,
        uiPatterns: tags.uiPatterns,
        informationHierarchy: a.informationHierarchy,
        layout: a.layout,
        primaryAction: a.primaryAction,
        notVisible: a.notVisible,
        meta: { source: edited ? 'ai+user-edited' : 'ai', model: result.model, analyzedAt: result.analyzedAt },
      },
      null,
      2,
    )

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
              <p className="an-meta">
                AI 분석 결과예요 · 신뢰도 {CONFIDENCE[a.confidence]} · {result.model}
                {edited && <strong> · 내가 수정함</strong>}
              </p>
              <p className="an-reason">{a.reasoning}</p>

              <div className="an-fields">
                <Select label="도메인" value={tags.domain} options={DOMAINS} onChange={(v) => change({ domain: v })} />
                <Select label="대표 과업" value={tags.userTask} options={TASKS} grouped emptyLabel="분류 검토 필요" onChange={(v) => change({ userTask: v, category: v ? TASK_BY_ID[v].group : tags.category })} />
                <Select label="화면 유형" value={tags.screenType} options={SCREEN_TYPES} onChange={(v) => change({ screenType: v })} />
              </div>
              {!tags.userTask && (
                <p className="an-evidence">
                  {{
                    out_of_scope: '분류 범위 밖 — 자동차금융과 관련 없는 화면으로 판단해 과업을 지정하지 않았어요.',
                    insufficient_evidence: '분석 근거 부족 — 화면이 잘렸거나 흐려서 목적을 판단하지 못했어요.',
                  }[a.userTask.status] ?? `분류 검토 필요 — 이 화면만으로는 세부 과업을 확정하지 못했어요${tags.category ? ` (상위 과업: ${labelOf.taskGroup(tags.category)})` : ''}. 직접 골라 주세요.`}
                </p>
              )}
              <p className="an-evidence">자동차금융 관련성: {RELEVANCE_LABEL[a.userTask.relevance]}{a.userTask.primaryCta ? ` · 핵심 CTA: ${a.userTask.primaryCta}` : ''}</p>
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
              <p className="an-evidence">
                {[a.domain, a.userTask, a.screenType]
                  .filter((x) => x.evidence)
                  .map((x) => x.evidence)
                  .join(' · ')}
              </p>

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
                {a.uiPatterns.length > 0 && (
                  <ul className="an-evidence-list">
                    {a.uiPatterns.map((p) => (
                      <li key={p.id}>
                        <strong>{labelOf.pattern(p.id)}</strong> — {p.evidence}
                      </li>
                    ))}
                  </ul>
                )}
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

              <List title="정보 위계 (눈에 먼저 들어오는 순서)" items={a.informationHierarchy} />
              <div className="an-block">
                <h4 className="an-label">레이아웃 특징</h4>
                <p>{a.layout.summary}</p>
                <List title="" items={a.layout.characteristics} />
              </div>
              <div className="an-block">
                <h4 className="an-label">주요 행동 (Primary Action)</h4>
                <p>{a.primaryAction ? `${a.primaryAction.label} — ${a.primaryAction.description}` : '뚜렷한 주요 행동이 보이지 않아요'}</p>
              </div>
              <List title="이 한 장만으로는 알 수 없어요" items={a.notVisible} />

              <div className="an-actions">
                <button
                  type="button"
                  className="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(json())
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1800)
                  }}
                >
                  {copied ? '복사했어요' : '결과 JSON 복사'}
                </button>
              </div>
              <p className="an-note">AI가 이미지를 보고 만든 태그예요. 틀린 부분은 위에서 직접 고쳐 주세요. 수정한 내용은 이 화면을 닫으면 사라져요.</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
