import { useEffect, useState } from 'react'

// 화면을 어느 컬렉션에 저장할지 고르는 작은 대화상자예요. 여러 컬렉션에 동시에 담을 수 있어요.
export default function SaveDialog({ screen, store, onClose }) {
  const [newName, setNewName] = useState('')
  const savedIn = store.collectionsOf(screen)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  function create(e) {
    e.preventDefault()
    const id = store.createCollection(newName)
    if (id) {
      store.toggleBookmark(screen, id)
      setNewName('')
    }
  }

  return (
    <div className="save-backdrop" onClick={onClose}>
      <div className="save-dialog" role="dialog" aria-modal="true" aria-label="컬렉션에 저장" onClick={(e) => e.stopPropagation()}>
        <div className="save-head">
          <strong>컬렉션에 저장</strong>
          <button type="button" className="detail-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        <p className="save-target">
          {screen.service} · {screen.pattern} / {screen.title}
        </p>

        <ul className="save-list">
          {store.collections.map((c) => (
            <li key={c.id}>
              <label className="save-option">
                <input type="checkbox" checked={savedIn.includes(c.id)} onChange={() => store.toggleBookmark(screen, c.id)} />
                <span>{c.name}</span>
                <span className="save-option-count">{store.bookmarks.filter((b) => b.collectionId === c.id).length}</span>
              </label>
            </li>
          ))}
        </ul>

        <form className="save-new" onSubmit={create}>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="새 컬렉션 이름" aria-label="새 컬렉션 이름" />
          <button type="submit" className="button" disabled={!newName.trim()}>
            만들고 저장
          </button>
        </form>

        <p className="save-hint">이미지는 저장하지 않고 원본 링크와 화면 정보만 이 브라우저에 보관해요.</p>
        {store.storageError && <p className="save-hint save-error">저장하지 못했어요: {store.storageError}</p>}
      </div>
    </div>
  )
}
