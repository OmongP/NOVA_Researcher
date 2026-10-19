import { useEffect, useMemo, useRef, useState } from 'react'
import { GUIDE, RULES, VERDICTS, ruleById } from '../data/darkPatternRules'
import { IS_DEMO } from '../lib/demo'

const VERDICT_ORDER = ['suspect', 'hold', 'pass', 'na']
const CONFIDENCE = { low: '낮음', medium: '보통', high: '높음' }
const ANSWER = { yes: '예', no: '아니오', unknown: '확인 불가' }
const MAX_EDGE = 2000

const PROVIDERS = {
  api: { label: 'Claude API', desc: 'API 키로 바로 검토해요' },
  cli: { label: 'Claude Code CLI', desc: '이 컴퓨터에 로그인한 Claude Code 계정으로 바로 검토해요' },
  bridge: { label: 'Claude Code 대화 대기열', desc: '자동으로 처리되지 않아요. Claude Code 대화창에 요청해야 분석이 시작돼요' },
}
const BRIDGE_PROMPT = '다크패턴 검토 대기열 처리해줘'
const JOB_KEY = 'ux-finder:ai-job:v1'
const POLL_MS = 2000
const BRIDGE_HINT_AFTER = 60 // 초

const STEPS = [
  { key: 'queued', label: '대기 중' },
  { key: 'processing', label: '분석 중' },
  { key: 'done', label: '완료' },
]

const formatElapsed = (sec) => (sec < 60 ? `${sec}초` : `${Math.floor(sec / 60)}분 ${sec % 60}초`)

// 새로고침 후 복원한 이미지는 서버 주소라서, 재검토할 때 다시 data URL로 바꿔요.
async function ensureDataUrl(image) {
  if (image.dataUrl.startsWith('data:')) return image.dataUrl
  const blob = await fetch(image.dataUrl).then((r) => r.blob())
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

function loadSavedJob() {
  try {
    return JSON.parse(localStorage.getItem(JOB_KEY))
  } catch {
    return null
  }
}

function saveJob(job) {
  try {
    if (job) localStorage.setItem(JOB_KEY, JSON.stringify(job))
    else localStorage.removeItem(JOB_KEY)
  } catch {
    // 저장소를 못 써도 현재 화면은 계속 동작해요.
  }
}

// 이미지 위에 판정 근거 영역을 그려요. 썸네일·확대 보기에서 같이 써요.
function AnnotatedImage({ image, boxes, onClick, className = '' }) {
  return (
    <div className={`ai-canvas ${className}`} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      <img src={image.dataUrl} alt={image.name} />
      {boxes.map((b) => (
        <span
          key={b.key}
          className={`ai-box ai-box-${b.verdict}`}
          style={{ left: `${b.box.x * 100}%`, top: `${b.box.y * 100}%`, width: `${b.box.w * 100}%`, height: `${b.box.h * 100}%` }}
          title={b.label}
        />
      ))}
    </div>
  )
}

function Lightbox({ image, boxes, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true" aria-label={`${image.name} 확대 보기`}>
      <AnnotatedImage image={image} boxes={boxes} className="lightbox-image" />
      <button type="button" className="lightbox-close" onClick={onClose} aria-label="닫기">
        ✕
      </button>
    </div>
  )
}

const formatDate = (iso) => new Date(iso).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })

// 큰 스크린샷은 긴 변 2000px로 줄여 보내요. 좌표는 비율이라 원본 크기와 상관없어요.
function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('이미지를 읽지 못했어요'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('이미지 형식을 확인해 주세요'))
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
        if (scale === 1 && file.size < 4_000_000) return resolve({ dataUrl: reader.result, width: img.width, height: img.height })
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.9), width: canvas.width, height: canvas.height })
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function overrideNotes(findings, overrides) {
  return findings
    .filter((f) => overrides[f.ruleId]?.verdict || overrides[f.ruleId]?.memo)
    .map((f) => {
      const o = overrides[f.ruleId]
      return `- ${f.ruleId}: AI ${VERDICTS[f.verdict].label} → 검토자 ${o.verdict ? VERDICTS[o.verdict].label : '판정 유지'}${o.memo ? ` (${o.memo})` : ''}`
    })
    .join('\n')
}

function toMarkdown({ run, fileName, context, overrides, cases }) {
  const { analysis: a, model, analyzedAt } = run
  const lines = [
    `# 다크패턴 AI 1차 검토 리포트`,
    '',
    `> 참고용 1차 검토예요. 법적 위반을 확정하지 않으며, 최종 판단은 검토자가 해요.`,
    '',
    `- 화면: ${fileName}`,
    `- 검토 시각: ${formatDate(analyzedAt)}`,
    `- 분석 모델: ${model} (Claude API)`,
    `- 기준: ${GUIDE.title} ${GUIDE.version}${GUIDE.credit ? ` (${GUIDE.credit})` : ''} · 규칙 DB src/data/darkPatternRules.js`,
    context ? `- 검토자가 준 맥락: ${context}` : '',
    '',
    `## 화면 요약`,
    `- 목적: ${a.screen.purpose}`,
    `- 고객 의사결정: ${a.screen.decision}`,
    `- 단계: ${a.screen.stage}`,
    '',
    `## 전체 의견`,
    a.overall.summary,
    '',
  ]
  for (const verdict of VERDICT_ORDER) {
    const items = a.findings.filter((f) => (overrides[f.ruleId]?.verdict ?? f.verdict) === verdict)
    if (!items.length) continue
    lines.push(`## ${VERDICTS[verdict].label} (${items.length}) · 검토자 수정 반영`, '')
    for (const f of items) {
      const rule = ruleById(f.ruleId)
      const o = overrides[f.ruleId]
      lines.push(`### ${f.ruleId} ${rule.type} · ${rule.name}`)
      lines.push(
        `- AI 1차 판정: ${VERDICTS[f.verdict].label} (확신도 ${CONFIDENCE[f.confidence]})${o?.verdict ? ` → 검토자 수정: **${VERDICTS[o.verdict].label}**` : ''}`,
      )
      lines.push(`- 요약: ${f.summary}`)
      lines.push(`- 근거: ${f.reasoning}`)
      f.questions.forEach((q) => lines.push(`  - ${q.question} → ${ANSWER[q.answer]} (${q.basis})`))
      f.evidence.forEach((e) => lines.push(`- 화면 영역: ${e.description} [${e.elementIds.join(', ')}]`))
      if (f.exceptionApplied) lines.push(`- 적용한 예외: ${f.exceptionApplied}`)
      if (f.cannotVerify.length) lines.push(`- 추가 확인 필요: ${f.cannotVerify.join(' / ')}`)
      if (f.improvement) lines.push(`- 개선 방향: ${f.improvement}`)
      if (o?.memo) lines.push(`- 검토자 메모: ${o.memo}`)
      lines.push(`- 가이드 근거: ${[...new Set([...f.guideRefs, rule.source.frame])].join(', ')}`)
      const c = cases[f.ruleId]
      if (c?.screens?.length) {
        lines.push(`- UI Bowl 유사 사례:`)
        c.screens.slice(0, 4).forEach((s) => lines.push(`  - ${s.service} · ${s.title} (수집월 ${s.dataMonth}) ${s.uiUrl}`))
      }
      lines.push('')
    }
  }
  if (a.notRelevant.length) lines.push(`## 검토 대상 아님`, a.notRelevant.map((id) => `${id} ${ruleById(id).name}`).join(', '), '')
  if (a.overall.nextChecks.length) lines.push(`## 다음 확인 사항`, ...a.overall.nextChecks.map((c) => `- ${c}`), '')
  return lines
    .filter((l) => l !== '')
    .join('\n')
    .replace(/\n(#{2,3} )/g, '\n\n$1')
}

export default function AiReview() {
  const [status, setStatus] = useState({ checked: false, active: null })
  const [image, setImage] = useState(null)
  const [context, setContext] = useState('')
  const [runs, setRuns] = useState([])
  const [runIndex, setRunIndex] = useState(0)
  const [job, setJob] = useState(null) // { id, state, provider, error, createdAt, rereview, duplicate }
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [overrides, setOverrides] = useState({})
  const [notes, setNotes] = useState('')
  const [active, setActive] = useState(null)
  const [showTexts, setShowTexts] = useState(false)
  const [zoom, setZoom] = useState(false)
  const [cases, setCases] = useState({})
  const [copied, setCopied] = useState(false)
  const fileInput = useRef(null)
  const rootRef = useRef(null)
  const sendingRef = useRef(false) // 상태 반영 전 연속 클릭도 막아요

  const run = runs[runIndex]
  const busy = sending || (job && ['queued', 'processing'].includes(job.state))
  const findings = useMemo(() => {
    if (!run) return []
    const rank = (f) => VERDICT_ORDER.indexOf(overrides[f.ruleId]?.verdict ?? f.verdict)
    return [...run.analysis.findings].sort((a, b) => rank(a) - rank(b))
  }, [run, overrides])

  useEffect(() => {
    if (IS_DEMO) return setStatus({ checked: true, active: null })
    fetch('/api/ai/status')
      .then((r) => r.json())
      .then((d) => setStatus({ checked: true, ...d }))
      .catch(() => setStatus({ checked: true, active: null }))
  }, [])

  // 새로고침해도 진행 중이던 검토를 이어서 확인해요.
  useEffect(() => {
    const saved = loadSavedJob()
    if (!saved?.id) return
    setImage({ dataUrl: `/api/ai/jobs/${saved.id}/image`, name: saved.fileName || '업로드한 화면' })
    setContext(saved.context ?? '')
    setJob({ id: saved.id, state: 'queued', createdAt: saved.createdAt })
  }, [])

  // 진행 중인 작업 상태를 주기적으로 확인해요.
  useEffect(() => {
    if (!job || !['queued', 'processing'].includes(job.state)) return
    let stopped = false
    async function poll() {
      try {
        const data = await fetch(`/api/ai/jobs/${job.id}`).then((r) => r.json())
        if (stopped) return
        if (data.state === 'done') {
          setRuns((prev) => {
            setRunIndex(prev.length)
            return [...prev, data]
          })
          if (job.rereview) {
            setOverrides({})
            setNotes('')
          }
          setJob({ ...job, ...data })
          saveJob(null)
        } else if (data.state === 'missing') {
          setJob({ ...job, state: 'failed', error: data.error })
          saveJob(null)
        } else {
          setJob((j) => ({ ...j, state: data.state, provider: data.provider ?? j.provider, error: data.error, createdAt: data.createdAt ?? j.createdAt, startedAt: data.startedAt }))
        }
      } catch {
        // 일시적인 연결 오류는 다음 주기에 다시 확인해요.
      }
    }
    poll()
    const timer = setInterval(poll, POLL_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [job?.id, job?.state]) // eslint-disable-line react-hooks/exhaustive-deps

  // 경과 시간 표시
  useEffect(() => {
    if (!busy) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [busy])

  // 화면 어디서든 Ctrl/Cmd+V로 스크린샷을 붙여 넣을 수 있어요.
  useEffect(() => {
    function onPaste(e) {
      // 화면에 보일 때만 붙여 넣기를 받아요 (다른 탭에서는 숨겨진 채로 마운트돼 있어요).
      if (!rootRef.current?.offsetParent) return
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'))
      if (file) loadFile(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [busy]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadFile(file) {
    if (busy) return setError('진행 중인 검토가 끝나거나 취소한 뒤에 다른 화면을 올릴 수 있어요')
    if (!file?.type.startsWith('image/')) return setError('이미지 파일만 올릴 수 있어요')
    try {
      const img = await readImage(file)
      setImage({ ...img, name: file.name || '붙여 넣은 이미지' })
      setContext('')
      setRuns([])
      setOverrides({})
      setCases({})
      setJob(null)
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  async function analyze({ rereview = false } = {}) {
    if (busy || sendingRef.current) return
    sendingRef.current = true
    setSending(true)
    setError(null)
    try {
      const body = { dataUrl: await ensureDataUrl(image), context, fileName: image.name }
      if (rereview && run) {
        body.previous = run.analysis
        body.reviewerNotes = [overrideNotes(run.analysis.findings, overrides), notes].filter(Boolean).join('\n')
      }
      const res = await fetch('/api/ai/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      const next = { ...data, rereview, createdAt: new Date().toISOString() }
      setJob(next)
      saveJob({ id: data.id, fileName: image.name, context, createdAt: next.createdAt })
    } catch (err) {
      setError(err.message)
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }

  async function retry() {
    const data = await fetch(`/api/ai/jobs/${job.id}/retry`, { method: 'POST' }).then((r) => r.json())
    if (data.error) {
      setError(data.error)
      return
    }
    setJob((j) => ({ ...j, state: data.state, provider: data.provider ?? j.provider, error: '', createdAt: new Date().toISOString() }))
    saveJob({ id: job.id, fileName: image?.name, context, createdAt: new Date().toISOString() })
  }

  async function cancel() {
    await fetch(`/api/ai/jobs/${job.id}`, { method: 'DELETE' }).catch(() => {})
    setJob(null)
    saveJob(null)
  }

  async function findCases(ruleId) {
    setCases((c) => ({ ...c, [ruleId]: { loading: true } }))
    try {
      const res = await fetch('/api/dark/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ruleId }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? (data.loginUrl ? 'UI Bowl 로그인이 필요해요' : `HTTP ${res.status}`))
      const screens = [...data.screens].sort((a, b) => b.triggerHits.length - a.triggerHits.length)
      setCases((c) => ({ ...c, [ruleId]: { screens } }))
    } catch (err) {
      setCases((c) => ({ ...c, [ruleId]: { error: err.message } }))
    }
  }

  function setOverride(ruleId, patch) {
    setOverrides((o) => ({ ...o, [ruleId]: { ...o[ruleId], ...patch } }))
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(toMarkdown({ run, fileName: image.name, context, overrides, cases }))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const activeFinding = findings.find((f) => f.ruleId === active)
  const boxes = !run
    ? []
    : activeFinding
      ? activeFinding.evidence.map((e, i) => ({
          key: `${active}-${i}`,
          box: e.box,
          label: e.description,
          verdict: overrides[active]?.verdict ?? activeFinding.verdict,
        }))
      : findings.flatMap((f) =>
          f.verdict === 'na'
            ? []
            : f.evidence.map((e, i) => ({
                key: `${f.ruleId}-${i}`,
                box: e.box,
                label: `${f.ruleId} ${e.description}`,
                verdict: overrides[f.ruleId]?.verdict ?? f.verdict,
              })),
        )
  const textBoxes =
    run && showTexts
      ? [...run.analysis.texts, ...run.analysis.components].map((t) => ({ key: t.id, box: t.box, label: `${t.id} ${t.text ?? t.label}`, verdict: 'text' }))
      : []

  // 분석 중에는 분석을 시작한 시점부터, 대기 중에는 요청한 시점부터 세요.
  const since = job?.state === 'processing' && job.startedAt ? job.startedAt : job?.createdAt
  const elapsed = since ? Math.max(0, Math.round((now - new Date(since).getTime()) / 1000)) : 0
  const stepIndex = job ? (job.state === 'failed' ? -1 : STEPS.findIndex((s) => s.key === job.state)) : -1

  return (
    <div className="ai-review" ref={rootRef}>
      <div className="status status-loading">
        AI 결과는 참고용 1차 검토예요. 법적 위반을 확정하지 않으며, 최종 판단은 검토자가 해요. 올린 스크린샷과 가이드 규칙은 분석을 위해 Claude로 전송돼요. 사내
        화면은 보안 정책을 먼저 확인해 주세요.
      </div>

      {IS_DEMO && (
        <div className="status">
          <span>데모 사이트에서는 AI 1차 검토를 쓸 수 없어요. 스크린샷을 올리면 사내 설치 버전에서 Claude가 규칙과 대조해 판정해요.</span>
        </div>
      )}

      {status.active && (
        <div className="status">
          <span>
            검토 방식: <strong>{PROVIDERS[status.active].label}</strong> · {PROVIDERS[status.active].desc}
            {status.active === 'bridge' && ' API 키를 server/.env에 넣거나 터미널에서 claude auth login을 하면 웹에서 바로 분석돼요.'}
          </span>
        </div>
      )}

      {job && job.state !== 'done' && (
        <section className={`ai-job ai-job-${job.state}`} aria-live="polite">
          <ol className="ai-steps">
            {STEPS.map((s, i) => (
              <li key={s.key} className={job.state === 'failed' ? '' : i < stepIndex ? 'is-done' : i === stepIndex ? 'is-current' : ''}>
                {s.label}
              </li>
            ))}
            {job.state === 'failed' && <li className="is-failed">실패</li>}
          </ol>

          {job.state === 'queued' && job.provider === 'bridge' && (
            <p>
              대기열에 저장했어요 ({formatElapsed(elapsed)} 경과). 이 방식은 자동으로 처리되지 않아요. Claude Code 대화창에 <strong>“{BRIDGE_PROMPT}”</strong>
              라고 입력하면 분석이 시작되고, 끝나면 이 화면에 결과가 자동으로 들어와요.
              {elapsed >= BRIDGE_HINT_AFTER && ' 아직 Claude Code에 요청하지 않았다면 지금 요청해 주세요.'}
            </p>
          )}
          {job.state === 'queued' && job.provider !== 'bridge' && <p>분석 순서를 기다리고 있어요 ({formatElapsed(elapsed)} 경과).</p>}
          {job.state === 'processing' && <p>화면을 읽고 {RULES.length}개 규칙과 대조하고 있어요 ({formatElapsed(elapsed)} 경과). 보통 30초~2분 걸려요.</p>}
          {job.state === 'failed' && <p className="ai-job-error">검토에 실패했어요: {job.error || '알 수 없는 오류'}</p>}
          {job.duplicate && <p className="card-reason">같은 화면·같은 요청이 이미 진행 중이라 새로 만들지 않고 그 요청을 이어서 확인해요.</p>}

          <div className="detail-actions">
            {job.state === 'queued' && job.provider === 'bridge' && (
              <button type="button" className="button button-primary" onClick={() => navigator.clipboard?.writeText(BRIDGE_PROMPT)}>
                요청 문구 복사
              </button>
            )}
            {job.state === 'failed' && (
              <button type="button" className="button button-primary" onClick={retry}>
                다시 시도
              </button>
            )}
            <button type="button" className="button" onClick={cancel}>
              {job.state === 'failed' ? '닫기' : '요청 취소'}
            </button>
          </div>
        </section>
      )}

      <div className="ai-layout">
        <div className="ai-left">
          {image ? (
            <>
              {run ? (
                <AnnotatedImage image={image} boxes={[...boxes, ...textBoxes]} onClick={() => setZoom(true)} className="is-zoomable" />
              ) : (
                <button type="button" className="ai-thumb" onClick={() => setZoom(true)} aria-label="업로드한 화면 크게 보기">
                  <img src={image.dataUrl} alt={image.name} />
                  <span className="ai-thumb-meta">
                    <strong>{image.name}</strong>
                    {image.width ? `${image.width}×${image.height}px · ` : ''}클릭해서 크게 보기
                  </span>
                </button>
              )}
              {run && <p className="card-reason">이미지를 클릭하면 판정 영역과 함께 크게 볼 수 있어요.</p>}
            </>
          ) : (
            <button
              type="button"
              className="ai-drop"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                loadFile(e.dataTransfer.files[0])
              }}
            >
              <strong>UI 스크린샷을 올려 주세요</strong>
              <span>끌어다 놓기 · 클릭해서 선택 · Cmd/Ctrl+V로 붙여 넣기</span>
            </button>
          )}
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => loadFile(e.target.files[0])} />

          {image && (
            <div className="ai-controls">
              <textarea
                className="saved-note"
                rows={2}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                disabled={busy}
                placeholder="화면 맥락 (선택): 예) 대출 신청 3단계, 직전 화면에서 마케팅 동의를 거절함"
              />
              <div className="detail-actions">
                <button type="button" className="button button-primary" disabled={busy || !status.active} onClick={() => analyze()}>
                  {sending ? '요청 보내는 중…' : busy ? '검토 진행 중' : run ? '처음부터 다시 검토' : 'AI 1차 검토 시작'}
                </button>
                <button type="button" className="button" disabled={busy} onClick={() => fileInput.current?.click()}>
                  다른 화면 올리기
                </button>
                {run && (
                  <label className="ai-toggle">
                    <input type="checkbox" checked={showTexts} onChange={(e) => setShowTexts(e.target.checked)} /> 인식한 텍스트·요소 표시
                  </label>
                )}
              </div>
            </div>
          )}
          {error && <div className="status status-error">{error}</div>}
        </div>

        <div className="ai-right">
          {!run && !busy && (
            <div className="empty">
              <p className="empty-title">스크린샷을 올리고 AI 1차 검토를 시작하세요</p>
              <p className="empty-desc">텍스트와 UI 요소를 읽고, 관련 규칙({RULES.length}개)을 찾아 위반 의심·기준 충족·판단 보류·해당 없음으로 분류해요.</p>
            </div>
          )}
          {!run && busy && (
            <div className="empty">
              <p className="empty-desc">검토가 끝나면 결과가 여기에 나와요.</p>
            </div>
          )}

          {run && (
            <>
              <div className="library-head">
                <div>
                  <h2 className="library-title">AI 1차 검토 결과</h2>
                  <p className="tagline">
                    {formatDate(run.analyzedAt)} · {run.model}
                    {runs.length > 1 && ` · 검토 ${runIndex + 1}/${runs.length}`}
                  </p>
                </div>
                <div className="library-actions">
                  {runs.length > 1 && (
                    <select className="review-select" value={runIndex} onChange={(e) => setRunIndex(Number(e.target.value))} aria-label="검토 회차">
                      {runs.map((r, i) => (
                        <option key={r.analyzedAt} value={i}>
                          {i === 0 ? '최초 검토' : `재검토 ${i}`}
                        </option>
                      ))}
                    </select>
                  )}
                  <button type="button" className="button" onClick={copyReport}>
                    {copied ? '복사했어요' : '리포트 복사'}
                  </button>
                </div>
              </div>

              <div className="ai-summary">
                <p>
                  <strong>화면 목적</strong> {run.analysis.screen.purpose}
                </p>
                <p>
                  <strong>고객 의사결정</strong> {run.analysis.screen.decision} · {run.analysis.screen.stage}
                </p>
                <p>{run.analysis.overall.summary}</p>
                <div className="ai-counts">
                  {VERDICT_ORDER.map((v) => (
                    <span key={v} className={`chip verdict-chip-${v}`}>
                      {VERDICTS[v].label} {findings.filter((f) => (overrides[f.ruleId]?.verdict ?? f.verdict) === v).length}
                    </span>
                  ))}
                </div>
              </div>

              {findings.map((f) => {
                const rule = ruleById(f.ruleId)
                const o = overrides[f.ruleId] ?? {}
                const c = cases[f.ruleId]
                return (
                  <article
                    key={f.ruleId}
                    className={`ai-finding ${active === f.ruleId ? 'is-active' : ''}`}
                    onMouseEnter={() => setActive(f.ruleId)}
                    onMouseLeave={() => setActive(null)}
                  >
                    <div className="card-meta">
                      <span className={`chip verdict-chip-${f.verdict}`}>AI 1차 · {VERDICTS[f.verdict].label}</span>
                      {o.verdict && <span className={`chip verdict-chip-${o.verdict}`}>검토자 · {VERDICTS[o.verdict].label}</span>}
                      <span className="chip chip-stage">확신도 {CONFIDENCE[f.confidence]}</span>
                    </div>
                    <h3 className="card-service">
                      {f.ruleId} · {rule.type} · {rule.name}
                    </h3>
                    <p className="card-title">{f.summary}</p>
                    <details>
                      <summary>판정 근거 보기</summary>
                      <p className="ai-reasoning">{f.reasoning}</p>
                      <ul className="rule-list">
                        {f.questions.map((q) => (
                          <li key={q.question}>
                            {q.question} → <strong>{ANSWER[q.answer]}</strong> <span className="card-reason">({q.basis})</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                    {f.evidence.length > 0 && (
                      <p className="card-reason">
                        화면 영역: {f.evidence.map((e) => e.description).join(' / ')}{' '}
                        <span className="ai-hint">(카드에 마우스를 올리면 이미지에 표시돼요)</span>
                      </p>
                    )}
                    {f.exceptionApplied && <p className="card-reason">적용한 예외: {f.exceptionApplied}</p>}
                    {f.cannotVerify.length > 0 && <p className="ai-unverified">단일 화면으로 확인할 수 없어요: {f.cannotVerify.join(' / ')}</p>}
                    {f.improvement && <p className="card-reason">개선 방향: {f.improvement}</p>}
                    <p className="card-reason">가이드 근거: {[...new Set([...f.guideRefs, rule.source.frame])].join(', ')}</p>

                    <div className="ai-override">
                      <span className="card-reason">검토자 판정</span>
                      <div className="segmented">
                        {VERDICT_ORDER.map((v) => (
                          <button
                            key={v}
                            type="button"
                            className={o.verdict === v ? 'is-active' : ''}
                            onClick={() => setOverride(f.ruleId, { verdict: o.verdict === v ? undefined : v })}
                          >
                            {VERDICTS[v].label}
                          </button>
                        ))}
                      </div>
                      <input
                        className="review-select"
                        value={o.memo ?? ''}
                        onChange={(e) => setOverride(f.ruleId, { memo: e.target.value })}
                        placeholder="수정 이유·확인한 사실 (재검토에 반영돼요)"
                      />
                    </div>

                    <div className="ai-cases">
                      {!c && (
                        <button type="button" className="link-button" onClick={() => findCases(f.ruleId)}>
                          UI Bowl에서 같은 유형의 실제 사례 보기 →
                        </button>
                      )}
                      {c?.loading && <span className="card-reason">사례를 찾고 있어요…</span>}
                      {c?.error && <span className="card-reason">사례 검색 실패: {c.error}</span>}
                      {c?.screens && (
                        <div className="ai-case-strip">
                          {c.screens.slice(0, 4).map((s) => (
                            <a key={s.id} href={s.uiUrl} target="_blank" rel="noreferrer" title={`${s.service} · ${s.title}`}>
                              {s.image && <img src={s.image} alt="" loading="lazy" />}
                              <span>{s.service}</span>
                            </a>
                          ))}
                          {c.screens.length === 0 && <span className="card-reason">UI Bowl에서 후보 사례를 찾지 못했어요</span>}
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}

              {run.analysis.notRelevant.length > 0 && (
                <p className="card-reason">검토 대상 아님: {run.analysis.notRelevant.map((id) => `${id} ${ruleById(id).name}`).join(', ')}</p>
              )}

              <section className="ai-rereview">
                <h3 className="review-heading">재검토</h3>
                <p className="card-reason">검토자 판정·메모와 아래 의견을 함께 보내 AI가 다시 판정해요. 이전 결과는 회차 선택에서 계속 볼 수 있어요.</p>
                <textarea
                  className="saved-note"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="예) '100명이 신청 중'은 실시간 집계 데이터로 확인함 / 이 바텀시트는 동의 거절 직후 노출됨"
                />
                <div className="detail-actions">
                  <button
                    type="button"
                    className="button button-primary"
                    disabled={busy || (!notes.trim() && !Object.values(overrides).some((o) => o.verdict || o.memo))}
                    onClick={() => analyze({ rereview: true })}
                  >
                    {busy ? '검토 진행 중' : '의견 반영해 재검토'}
                  </button>
                </div>
              </section>

              <details className="ai-extracted">
                <summary>
                  인식한 텍스트 {run.analysis.texts.length}개 · UI 요소 {run.analysis.components.length}개
                </summary>
                <ul className="rule-list">
                  {run.analysis.texts.map((t) => (
                    <li key={t.id}>
                      {t.id} [{t.role}] {t.text}
                    </li>
                  ))}
                  {run.analysis.components.map((c) => (
                    <li key={c.id}>
                      {c.id} [{c.type}] {c.label} {c.state && `· ${c.state}`}
                    </li>
                  ))}
                </ul>
              </details>
            </>
          )}
        </div>
      </div>

      {zoom && image && <Lightbox image={image} boxes={[...boxes, ...textBoxes]} onClose={() => setZoom(false)} />}
    </div>
  )
}
