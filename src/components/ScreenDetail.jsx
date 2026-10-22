import { useEffect, useState } from 'react'
import { TIERS } from '../lib/searchQuery'
import BenchmarkDetail from './BenchmarkDetail'

function formatDate(iso) {
  if (!iso) return '미확인'
  return new Date(iso).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })
}

// 화면 정보를 리서치 문서에 붙여 넣기 좋은 텍스트로 만들어요.
function toClipboardText(screen, imageUrl) {
  return [
    `${screen.service} — ${screen.pattern} / ${screen.title}`,
    `분야: ${screen.domain}`,
    `적합도: ${TIERS[screen.relevance?.tier]?.label ?? '미판정'} (${screen.relevance?.reason ?? ''})`,
    `출처: ${screen.source ?? 'UI Bowl'}`,
    `UI Bowl 수집월: ${screen.dataMonth ?? '미확인'}`,
    `검색일: ${formatDate(screen.searchedAt)}`,
    `앱 버전: 미확인`,
    `원본 링크: ${imageUrl ?? screen.uiUrl}`,
  ].join('\n')
}

export default function ScreenDetail({ screen, onClose, saved, onSave }) {
  const images = screen.images?.length ? screen.images : screen.image ? [{ id: 'main', url: screen.image, uiUrl: screen.uiUrl }] : []
  const [index, setIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const current = images[index]

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, images.length - 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  async function copyInfo() {
    try {
      await navigator.clipboard.writeText(toClipboardText(screen, current?.uiUrl))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const tier = screen.relevance?.tier

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <aside className="detail" role="dialog" aria-modal="true" aria-label={`${screen.service} 화면 상세`} onClick={(e) => e.stopPropagation()}>
        <div className="detail-viewer">
          {current ? (
            <img src={current.url} alt={`${screen.service} ${screen.title} ${index + 1}번째 화면`} />
          ) : (
            <p className="card-thumb-missing">이미지 미확보 · 원본 링크에서 확인해요</p>
          )}
        </div>

        <div className="detail-info">
          <button type="button" className="detail-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
          <div className="card-meta">
            {tier && <span className={`chip chip-tier-${tier}`}>{TIERS[tier].label}</span>}
            <span className={`chip chip-${screen.domain}`}>{screen.domain}</span>
          </div>
          <h2 className="detail-title">{screen.service}</h2>
          <p className="detail-sub">
            {screen.pattern} / {screen.title}
          </p>
          {screen.relevance?.reason && <p className="card-reason">{screen.relevance.reason}</p>}

          {images.length > 1 && (
            <div className="detail-thumbs">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  className={`detail-thumb ${i === index ? 'is-active' : ''}`}
                  onClick={() => setIndex(i)}
                  aria-label={`${i + 1}번째 화면`}
                >
                  <img src={img.url} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}

          {screen.bm && <BenchmarkDetail screen={screen} />}

          <dl className="detail-meta">
            <dt>출처</dt>
            <dd>{screen.source ?? 'UI Bowl'}</dd>
            <dt>UI Bowl 수집월</dt>
            <dd>{screen.dataMonth ?? '미확인'}</dd>
            <dt>검색일</dt>
            <dd>{formatDate(screen.searchedAt)}</dd>
            <dt>앱 버전</dt>
            <dd>미확인 (UI Bowl이 제공하지 않아요)</dd>
            <dt>화면 수</dt>
            <dd>
              {screen.screenCount}장 중 {images.length}장 미리보기
            </dd>
            {screen.matchedTexts?.length > 0 && (
              <>
                <dt>확인된 문구</dt>
                <dd>{screen.matchedTexts.join(', ')}</dd>
              </>
            )}
            {screen.components?.length > 0 && (
              <>
                <dt>포함 요소</dt>
                <dd>{screen.components.join(', ')}</dd>
              </>
            )}
          </dl>

          <div className="detail-actions">
            <a className="button button-primary" href={current?.uiUrl ?? screen.uiUrl} target="_blank" rel="noreferrer">
              원본 링크 열기 ↗
            </a>
            {onSave && (
              <button type="button" className="button" onClick={() => onSave(screen)}>
                {saved ? '★ 저장됨' : '☆ 컬렉션에 저장'}
              </button>
            )}
            <button type="button" className="button" onClick={copyInfo}>
              {copied ? '복사했어요' : '화면 정보 복사'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
