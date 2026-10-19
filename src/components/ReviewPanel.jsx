import { useEffect, useState } from 'react'
import { VERDICTS } from '../data/darkPatternRules'

const ANSWERS = ['예', '아니오', '확인 불가']

// 후보 화면 하나를 규칙의 판단기준으로 검토하는 패널이에요.
export default function ReviewPanel({ rule, screen, review, onSave, onClose }) {
  const images = screen.images?.length ? screen.images : screen.image ? [{ id: 'main', url: screen.image, uiUrl: screen.uiUrl }] : []
  const [index, setIndex] = useState(0)
  const current = images[index]
  const r = review ?? { answers: {}, exception: '', evidenceNote: '', memo: '', verdict: null }

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, images.length - 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  const save = (patch) => onSave(rule.id, screen, patch)

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <aside className="detail review" role="dialog" aria-modal="true" aria-label={`${screen.service} 다크패턴 검토`} onClick={(e) => e.stopPropagation()}>
        <div className="detail-viewer">
          {current ? <img src={current.url} alt={`${screen.service} ${index + 1}번째 화면`} /> : <p className="card-thumb-missing">이미지 미확보</p>}
        </div>

        <div className="detail-info">
          <button type="button" className="detail-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
          <span className="chip chip-tier-related">
            {rule.id} · {rule.type}
          </span>
          <h2 className="detail-title">{rule.name}</h2>
          <p className="detail-sub">
            {screen.service} · {screen.pattern} / {screen.title}
          </p>

          {images.length > 1 && (
            <div className="detail-thumbs">
              {images.map((img, i) => (
                <button key={img.id} type="button" className={`detail-thumb ${i === index ? 'is-active' : ''}`} onClick={() => setIndex(i)} aria-label={`${i + 1}번째 화면`}>
                  <img src={img.url} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}

          {screen.matchedTexts?.length > 0 && <p className="card-reason">화면 문구: {screen.matchedTexts.slice(0, 6).join(', ')}</p>}

          <h3 className="review-heading">판단기준</h3>
          <ol className="review-questions">
            {rule.questions.map((q, i) => (
              <li key={q}>
                <p>{q}</p>
                <div className="segmented">
                  {ANSWERS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      className={r.answers[i] === a ? 'is-active' : ''}
                      onClick={() => save({ answers: { ...r.answers, [i]: r.answers[i] === a ? undefined : a } })}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ol>

          {rule.exceptions.length > 0 && (
            <>
              <h3 className="review-heading">예외에 해당하나요?</h3>
              <select className="review-select" value={r.exception} onChange={(e) => save({ exception: e.target.value })}>
                <option value="">해당 없음</option>
                {rule.exceptions.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </>
          )}

          <h3 className="review-heading">화면만으로 확인할 수 없는 근거</h3>
          <ul className="review-evidence">
            {rule.evidence.map((ev) => (
              <li key={ev}>{ev}</li>
            ))}
          </ul>
          <textarea
            className="saved-note"
            rows={2}
            value={r.evidenceNote}
            onChange={(e) => save({ evidenceNote: e.target.value })}
            placeholder="확인한 근거 (예: 실시간 집계 데이터 확인 여부)"
          />

          <h3 className="review-heading">검토 결과</h3>
          <div className="verdicts">
            {Object.entries(VERDICTS).map(([key, v]) => (
              <button key={key} type="button" className={`verdict verdict-${key} ${r.verdict === key ? 'is-active' : ''}`} onClick={() => save({ verdict: r.verdict === key ? null : key })} title={v.desc}>
                {v.label}
              </button>
            ))}
          </div>
          <textarea className="saved-note" rows={2} value={r.memo} onChange={(e) => save({ memo: e.target.value })} placeholder={`개선 방향 (가이드: ${rule.improvement})`} />

          <div className="detail-actions">
            <a className="button" href={current?.uiUrl ?? screen.uiUrl} target="_blank" rel="noreferrer">
              원본 링크 열기 ↗
            </a>
          </div>
          <p className="save-hint">검토 내용은 이 브라우저에만 저장돼요. 이 도구의 결과는 법적 판단이 아니에요.</p>
        </div>
      </aside>
    </div>
  )
}
