import { TIERS } from '../lib/searchQuery'

function sourceLine(screen) {
  return `${screen.source ?? 'UI Bowl'} · 수집월 ${screen.dataMonth ?? '미확인'} · 앱 버전 미확인`
}

export default function ScreenCard({ screen, onOpen, saved, onSave }) {
  const tier = screen.relevance?.tier

  return (
    <article className="card">
      {onSave && (
        <button
          type="button"
          className={`card-save ${saved ? 'is-saved' : ''}`}
          onClick={() => onSave(screen)}
          aria-label={saved ? '저장됨 · 컬렉션 바꾸기' : '컬렉션에 저장'}
          title={saved ? '저장됨 · 컬렉션 바꾸기' : '컬렉션에 저장'}
        >
          {saved ? '★' : '☆'}
        </button>
      )}
      <button type="button" className="card-thumb" onClick={() => onOpen(screen)} aria-label={`${screen.service} ${screen.title} 상세 보기`}>
        {screen.image ? (
          <img src={screen.image} alt="" loading="lazy" />
        ) : (
          <span className="card-thumb-missing">이미지 미확보 · 원본 링크에서 확인해요</span>
        )}
      </button>
      <div className="card-body">
        <div className="card-meta">
          {tier && <span className={`chip chip-tier-${tier}`}>{TIERS[tier].label}</span>}
          <span className={`chip chip-${screen.domain}`}>{screen.domain}</span>
        </div>
        <h3 className="card-service">{screen.service}</h3>
        <p className="card-title">{screen.title}</p>
        <p className="card-pattern">
          {screen.pattern} · {screen.screenCount}장
        </p>
        {screen.relevance?.reason && <p className="card-reason">{screen.relevance.reason}</p>}
        <div className="card-footer">
          <span>{sourceLine(screen)}</span>
          <a href={screen.uiUrl} target="_blank" rel="noreferrer">
            원본 ↗
          </a>
        </div>
      </div>
    </article>
  )
}
