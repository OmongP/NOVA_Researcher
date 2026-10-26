import { useEffect, useMemo, useRef, useState } from 'react'
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

const RELEVANCE_LABEL = { direct: '직접 관련', common: '공통 UX 참고', out_of_scope: '분류 범위 밖' }
const FIELD_LABEL = { userTask: '대표 과업', screenType: '화면 유형', domain: '도메인', uiPatterns: 'UI 패턴', flow: '정보 구조', userGoal: '사용자 목적' }
const SIMILAR_PREVIEW = 4

// 관찰(이미지에서 보이는 사실)은 표시 없이, 추정(AI 해석)만 '추정'으로 표시해요.
const Basis = ({ basis }) => (basis === 'inferred' ? <span className="an-badge">추정</span> : null)
const md = (basis) => (basis === 'inferred' ? ' (추정)' : '')

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

// 기획서·디자인 검토에 붙여 넣을 Markdown
function toMarkdown(a, tags) {
  const d = a.design
  const list = (items) => items.map((t) => `- ${typeof t === 'string' ? t : t.text + md(t.basis)}`).join('\n')
  const parts = [`# 화면 분석${d.summary ? ` — ${d.summary}` : ''}`]
  if (d.userGoal) parts.push(`**사용자 목적** ${d.userGoal.text}${md(d.userGoal.basis)}`)
  if (d.keyInfo.length) parts.push(`## 핵심 정보\n${list(d.keyInfo)}`)
  if (a.primaryAction) parts.push(`**주요 행동** ${a.primaryAction.label} — ${a.primaryAction.description}`)
  if (d.flow) parts.push(`## 정보 구조\n${d.flow}${d.flowNote ? `\n※ ${d.flowNote}` : ''}`)
  if (d.composition.length) parts.push(`## 구성 방식\n${list(d.composition)}`)
  if (d.takeaways.pm.length || d.takeaways.designer.length)
    parts.push(`## 참고할 설계 방식\n${d.takeaways.pm.length ? `**PM 관점**\n${list(d.takeaways.pm)}\n` : ''}${d.takeaways.designer.length ? `**디자이너 관점**\n${list(d.takeaways.designer)}` : ''}`)
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
  parts.push('_UX Lens AI 1차 분석. ‘(추정)’은 이미지에서 확인한 사실이 아니라 AI의 해석이에요._')
  return parts.join('\n\n')
}

// pool: 비교할 벤치마킹 화면(벤치마킹 DB, bm 분류가 붙은 화면). onFindSimilar(taskId): Explore에서 같은 과업 화면 보기.
export default function ScreenAnalyzer({ pool = [], onFindSimilar }) {
  const [preview, setPreview] = useState(null) // { dataUrl, name }
  const [state, setState] = useState({ status: 'idle' }) // idle | loading | done | error
  const [tags, setTags] = useState(null) // 사용자가 확인·수정하는 값
  const [edited, setEdited] = useState(false)
  const [userEdited, setUserEdited] = useState({}) // 사용자가 직접 고친 항목: 재분석해도 덮어쓰지 않아요
  const [dragging, setDragging] = useState(false)
  const [copied, setCopied] = useState(null) // 'md' | 'json'
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
  const d = a?.design

  // 같은 과업의 벤치마킹 화면(대표 과업 기준). 세부 과업이 없으면 같은 대분류로 넓혀요.
  // Explore 과업 필터와 같은 기준(대표 과업)으로 세야 'Explore에서 보기'의 결과 수와 맞아요.
  const similar = useMemo(() => {
    if (!tags) return { list: [], scope: null }
    if (tags.userTask) {
      const list = pool.filter((s) => s.bm?.taskIds[0] === tags.userTask)
      if (list.length) return { list, scope: 'task' }
    }
    const group = tags.userTask ? TASK_BY_ID[tags.userTask]?.group : tags.category
    if (!group) return { list: [], scope: null }
    const list = pool.filter((s) => TASK_BY_ID[s.bm?.taskIds[0]]?.group === group)
    return { list, scope: 'group', group, taskIds: [...new Set(list.map((s) => s.bm.taskIds[0]))] }
  }, [pool, tags])

  const copy = async (kind) => {
    const text =
      kind === 'md'
        ? toMarkdown(a, tags)
        : JSON.stringify(
            {
              domain: tags.domain,
              primaryTaskCategory: tags.category,
              primaryTask: tags.userTask,
              secondaryTasks: tags.secondary,
              classificationConfidence: a.userTask.confidence,
              relevance: a.userTask.relevance,
              taskStatus: a.userTask.status,
              evidence: a.userTask.evidence,
              tagSources: Object.fromEntries(['domain', 'userTask', 'screenType', 'uiPatterns', 'components'].map((k) => [k, userEdited[k] ? 'user' : 'ai'])),
              screenType: tags.screenType,
              uiComponents: tags.components,
              uiPatterns: tags.uiPatterns,
              informationHierarchy: a.informationHierarchy,
              layout: a.layout,
              primaryAction: a.primaryAction,
              design: a.design,
              notVisible: a.notVisible,
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
    ...tags.secondary.map((id) => labelOf.task(id)),
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
              {/* 1. 화면 요약 */}
              <section className="an-section" aria-label="화면 요약">
                <h3 className="an-h">화면 요약</h3>
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
              </section>

              {/* 2. 설계 분석 */}
              <section className="an-section" aria-label="설계 분석">
                <h3 className="an-h">설계 분석</h3>
                {d.flow ? (
                  <div className="an-block">
                    <h4 className="an-label">정보 구조</h4>
                    <p className="an-flow">{d.flow}</p>
                    {d.flowNote && <p className="an-evidence">※ {d.flowNote}</p>}
                  </div>
                ) : (
                  <Notes title="정보 위계 (눈에 먼저 들어오는 순서)" items={a.informationHierarchy} />
                )}
                <Notes title="구성 방식" items={d.composition.length ? d.composition : a.layout.characteristics} />
                {(d.takeaways.pm.length > 0 || d.takeaways.designer.length > 0) && (
                  <div className="an-two an-boxed">
                    <Notes title="참고할 점 · PM 관점" items={d.takeaways.pm} />
                    <Notes title="참고할 점 · 디자이너 관점" items={d.takeaways.designer} />
                  </div>
                )}
              </section>

              {/* 3. 추가 확인 사항 */}
              {(d.openQuestions.pm.length > 0 || d.openQuestions.designer.length > 0 || a.notVisible.length > 0) && (
                <section className="an-section" aria-label="추가 확인 사항">
                  <h3 className="an-h">추가 확인 사항</h3>
                  {d.openQuestions.pm.length || d.openQuestions.designer.length ? (
                    <div className="an-two">
                      <Notes title="정책·데이터·흐름" items={d.openQuestions.pm} />
                      <Notes title="상태·예외" items={d.openQuestions.designer} />
                    </div>
                  ) : (
                    <Notes title="" items={a.notVisible} />
                  )}
                </section>
              )}

              {/* 4. 분류·태그 (수정은 접어 둬요) */}
              <section className="an-section" aria-label="분류·태그">
                <h3 className="an-h">분류·태그</h3>
                <div className="an-tags">
                  {tagChips.map((t, i) => (
                    <span key={i} className="an-tag">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="an-evidence">자동차금융 관련성: {RELEVANCE_LABEL[a.userTask.relevance]}{edited && ' · 내가 수정함'}</p>
                <details className="an-edit">
                  <summary>분류 수정하기</summary>
                  <div className="an-edit-body">
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
                    <div className="an-block">
                      <h4 className="an-label">분류 근거</h4>
                      <ul className="an-evidence-list">
                        {[
                          ['도메인', a.domain.evidence],
                          ['과업', a.userTask.evidence],
                          ['화면 유형', a.screenType.evidence],
                          ...a.uiPatterns.map((p) => [labelOf.pattern(p.id), p.evidence]),
                        ]
                          .filter(([, e]) => e)
                          .map(([k, e]) => (
                            <li key={k}>
                              <strong>{k}</strong> — {e}
                            </li>
                          ))}
                      </ul>
                    </div>
                    <p className="an-note">수정한 내용은 이 화면을 닫으면 사라져요.</p>
                  </div>
                </details>
              </section>

              {/* 5. 다음 행동 */}
              <section className="an-section" aria-label="다음 행동">
                <h3 className="an-h">다른 사례와 비교하기</h3>
                {similar.list.length > 0 ? (
                  <>
                    <p className="an-evidence">
                      {similar.scope === 'task' ? `‘${labelOf.task(tags.userTask)}’ 과업` : `‘${labelOf.taskGroup(similar.group)}’ 대분류`}의 벤치마킹 화면이 {similar.list.length}개 있어요.
                    </p>
                    <div className="an-similar">
                      {similar.list.slice(0, SIMILAR_PREVIEW).map((s) => (
                        <a key={s.id} className="an-similar-item" href={s.uiUrl} target="_blank" rel="noreferrer" title="UI Bowl 원본 보기">
                          {s.image && <img src={s.image} alt="" loading="lazy" />}
                          <span className="an-similar-name">{s.service}</span>
                          <span className="an-similar-title">{s.title}</span>
                        </a>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="an-evidence">같은 과업으로 분류된 벤치마킹 화면이 아직 없어요. 과업을 직접 고르면 다시 찾아요.</p>
                )}
                <div className="an-actions">
                  {similar.list.length > 0 && onFindSimilar && (
                    <button type="button" className="button button-primary" onClick={() => onFindSimilar(similar.scope === 'task' ? [tags.userTask] : similar.taskIds)}>
                      Explore에서 {similar.list.length}개 모두 보기
                    </button>
                  )}
                  <button type="button" className="button" onClick={() => copy('md')}>
                    {copied === 'md' ? '복사했어요' : '분석 내용 복사 (Markdown)'}
                  </button>
                </div>
              </section>

              <details className="an-meta-details">
                <summary>상세 정보</summary>
                <p className="an-meta">
                  {result.model} · {new Date(result.analyzedAt).toLocaleString('ko-KR')}
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
