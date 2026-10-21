import { useState } from 'react'
import ScreenCard from './ScreenCard'
import { collectionToMarkdown } from '../lib/useCollections'

const ALL = 'all'

// 보관함: 컬렉션별로 저장한 화면을 모아 보고, 메모·삭제·내보내기를 해요.
export default function Library({ store, onOpen, onSave, showSavedBy = false }) {
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
          <span>전체 저장</span>
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
          <h2 className="library-title">{active ? active.name : '전체 저장'}</h2>
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
            <p className="empty-title">아직 저장한 화면이 없어요</p>
            <p className="empty-desc">검색 결과 카드의 ☆을 눌러 컬렉션에 담아 보세요.</p>
          </div>
        ) : (
          <div className="grid">
            {sorted.map((b) => (
              <div key={b.id} className="saved">
                <ScreenCard screen={b.screen} onOpen={onOpen} saved onSave={onSave} />
                <div className="saved-meta">
                  {activeId === ALL && <span className="chip chip-stage">{nameOf(b.collectionId)}</span>}
                  <span>
                    {showSavedBy && b.savedBy ? `${b.savedBy} · ` : ''}저장 {new Date(b.savedAt).toLocaleDateString('ko-KR')}
                  </span>
                  <button type="button" className="saved-remove" onClick={() => store.removeBookmark(b.id)}>
                    빼기
                  </button>
                </div>
                <textarea
                  className="saved-note"
                  value={b.note}
                  onChange={(e) => store.updateNote(b.id, e.target.value)}
                  placeholder={showSavedBy ? "팀 메모 (모두가 보고 고칠 수 있어요)" : "메모 (예: CTA 위치, 금액 강조 방식)"}
                  rows={2}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
