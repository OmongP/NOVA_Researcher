import { useState } from 'react'
import ScreenCard from './ScreenCard'
import { collectionToMarkdown } from '../lib/useCollections'

const ALL = 'all'

// 보관함: 컬렉션별로 저장한 화면을 모아 보고, 메모·삭제·내보내기를 해요.
// scope 'mine'(내 보관함): 화면마다 '팀에 공유'. 'team'(팀 보관함): 공유한 사람·참고할 지점·관련 업무를 보여줘요.
// 내 저장과 팀 공유는 따로 관리해요. 내 보관함에서 빼도 팀에 공유한 자료는 남아요.
export default function Library({ store, onOpen, onSave, isSaved, scope = 'mine', team, onShare }) {
  const isTeam = scope === 'team'
  const [activeId, setActiveId] = useState(ALL)
  const [copied, setCopied] = useState(false)
  const [dragId, setDragId] = useState(null) // 순서를 바꾸려고 끌고 있는 컬렉션
  const [overId, setOverId] = useState(null) // 지금 위에 올려 둔 컬렉션

  const active = store.collections.find((c) => c.id === activeId)
  const bookmarks = activeId === ALL ? store.bookmarks : store.bookmarks.filter((b) => b.collectionId === activeId)
  const sorted = [...bookmarks].sort((a, b) => b.savedAt.localeCompare(a.savedAt))
  const nameOf = (id) => store.collections.find((c) => c.id === id)?.name ?? '삭제된 컬렉션'

  async function exportMarkdown() {
    const targets = active ? [active] : store.collections
    const text = targets
      .map((c) => collectionToMarkdown(c, store.bookmarks.filter((b) => b.collectionId === c.id)))
      .join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  function rename() {
    const name = window.prompt('컬렉션 이름', active.name)
    if (name) store.renameCollection(active.id, name)
  }

  function remove() {
    const count = bookmarks.length
    if (window.confirm(`‘${active.name}’ 컬렉션과 저장한 화면 ${count}개를 삭제할까요?`)) {
      store.deleteCollection(active.id)
      setActiveId(ALL)
    }
  }

  return (
    <div className="library">
      <nav className="library-nav" aria-label="컬렉션">
        <button type="button" className={`library-item ${activeId === ALL ? 'is-active' : ''}`} onClick={() => setActiveId(ALL)}>
          <span>{isTeam ? '전체 공유' : '전체 저장'}</span>
          <span className="library-count">{store.bookmarks.length}</span>
        </button>
        {store.collections.map((c, index) => {
          const dragIndex = store.collections.findIndex((x) => x.id === dragId)
          const dropClass = overId === c.id && dragId && dragId !== c.id ? (dragIndex > index ? 'is-over-before' : 'is-over-after') : ''
          return (
            <button
              key={c.id}
              type="button"
              draggable
              className={`library-item is-sortable ${activeId === c.id ? 'is-active' : ''} ${dragId === c.id ? 'is-dragging' : ''} ${dropClass}`}
              onClick={() => setActiveId(c.id)}
              onDragStart={(e) => {
                setDragId(c.id)
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', c.id)
              }}
              onDragOver={(e) => {
                if (!dragId) return
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                setOverId(c.id)
              }}
              onDrop={(e) => {
                e.preventDefault()
                if (dragId) store.moveCollection(dragId, c.id)
                setDragId(null)
                setOverId(null)
              }}
              onDragEnd={() => {
                setDragId(null)
                setOverId(null)
              }}
              onKeyDown={(e) => {
                // 키보드로도 순서를 바꿀 수 있어요: Alt+↑ / Alt+↓
                if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                  e.preventDefault()
                  store.moveCollectionBy(c.id, e.key === 'ArrowUp' ? -1 : 1)
                }
              }}
              title="드래그해서 순서를 바꿀 수 있어요 (Alt+↑/↓)"
            >
              <span className="library-grip" aria-hidden="true">
                ⋮⋮
              </span>
              <span className="library-item-name">{c.name}</span>
              <span className="library-count">{store.bookmarks.filter((b) => b.collectionId === c.id).length}</span>
            </button>
          )
        })}
        <button
          type="button"
          className="library-item library-add"
          onClick={() => {
            const name = window.prompt('새 컬렉션 이름')
            const id = name && store.createCollection(name)
            if (id) setActiveId(id)
          }}
        >
          + 새 컬렉션
        </button>
      </nav>

      <div className="library-main">
        <div className="library-head">
          <h2 className="library-title">{active ? active.name : isTeam ? '전체 공유' : '전체 저장'}</h2>
          <div className="library-actions">
            <button type="button" className="button" onClick={exportMarkdown} disabled={store.bookmarks.length === 0}>
              {copied ? '복사했어요' : 'Markdown으로 복사'}
            </button>
            {active && (
              <>
                <button type="button" className="button" onClick={rename}>
                  이름 바꾸기
                </button>
                <button type="button" className="button button-danger" onClick={remove}>
                  컬렉션 삭제
                </button>
              </>
            )}
          </div>
        </div>

        {store.storageError && <div className="status status-error">이 브라우저에 저장하지 못했어요: {store.storageError}</div>}

        {sorted.length === 0 ? (
          <div className="empty">
            <p className="empty-title">{isTeam ? '아직 팀에 공유한 화면이 없어요' : '아직 저장한 화면이 없어요'}</p>
            <p className="empty-desc">{isTeam ? '내 보관함에서 화면의 ‘팀에 공유’를 누르면 여기에 모여요.' : '검색 결과 카드의 ☆을 눌러 내 보관함에 담아 보세요.'}</p>
          </div>
        ) : (
          <div className="grid">
            {sorted.map((b) => {
              const shared = !isTeam && team?.collectionsOf(b.screen).length > 0
              return (
                <div key={b.id} className="saved">
                  <ScreenCard screen={b.screen} onOpen={onOpen} saved={isSaved ? isSaved(b.screen) : true} onSave={onSave} />
                  {isTeam && (
                    <div className="saved-share">
                      <p className="saved-reason">{b.reason ? <><span>참고</span> {b.reason}</> : <span className="saved-reason-empty">참고할 지점이 아직 없어요</span>}</p>
                      <p className="saved-by">
                        {b.work && <span className="chip chip-stage">{b.work}</span>}
                        <span>
                          {b.savedBy || '이름 없음'} 님이 공유 · {new Date(b.savedAt).toLocaleDateString('ko-KR')}
                        </span>
                      </p>
                    </div>
                  )}
                  <div className="saved-meta">
                    {activeId === ALL && <span className="chip chip-stage">{nameOf(b.collectionId)}</span>}
                    {!isTeam && <span>저장 {new Date(b.savedAt).toLocaleDateString('ko-KR')}</span>}
                    {onShare && (
                      <button
                        type="button"
                        className={`saved-share-button ${shared ? 'is-shared' : ''}`}
                        onClick={() => onShare(b.screen)}
                        title={isTeam ? '참고할 지점·관련 업무 고치기' : shared ? '팀에 공유됨 · 공유 내용 고치기' : '팀 보관함에 공유해요'}
                      >
                        {isTeam ? '고치기' : shared ? '✓ 팀 공유됨' : '팀에 공유'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="saved-remove"
                      title={isTeam ? '팀 보관함에서 빼요(모두에게서 빠져요)' : '내 보관함에서만 빼요. 팀에 공유한 자료는 남아요'}
                      onClick={() => (!isTeam || window.confirm('팀 보관함에서 빼면 팀 모두에게서 빠져요. 뺄까요?')) && store.removeBookmark(b.id)}
                    >
                      {isTeam ? '팀에서 빼기' : '빼기'}
                    </button>
                  </div>
                  <textarea
                    className="saved-note"
                    value={b.note}
                    onChange={(e) => store.updateNote(b.id, e.target.value)}
                    placeholder={isTeam ? '팀 메모 (모두가 보고 고칠 수 있어요)' : '내 메모 (예: CTA 위치, 금액 강조 방식)'}
                    rows={2}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
