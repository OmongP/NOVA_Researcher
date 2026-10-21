import { useEffect, useRef, useState } from 'react'

const NOTICE_MS = 2200

// 화면을 어느 컬렉션에 저장할지 고르는 작은 대화상자예요. 여러 컬렉션에 동시에 담을 수 있어요.
// 저장·제거할 때마다 안내 문구를 보여주고, 닫을 때 바뀐 내용이 있으면 onClose(요약)로 알려줘요.
export default function SaveDialog({ screen, store: mine, team, name, onClose }) {
  const [newName, setNewName] = useState('')
  const [dest, setDest] = useState('mine') // 저장할 곳: 내 보관함 / 팀 보관함
  const store = dest === 'team' ? team : mine
  const where = dest === 'team' ? '팀 보관함 ' : ''
  const [dragId, setDragId] = useState(null) // 순서를 바꾸려고 끌고 있는 컬렉션
  const [overId, setOverId] = useState(null)
  const [notice, setNotice] = useState(null)
  const savedIn = store.collectionsOf(screen)
  const timer = useRef(null)

  // 닫는 시점의 최신 상태로 요약을 만들기 위해, 렌더가 끝난 뒤 최신 값을 ref에 담아 둬요.
  const latest = useRef({ changed: false, count: 0 })
  useEffect(() => {
    latest.current.count = savedIn.length
  })

  function close() {
    const { changed: didChange, count } = latest.current
    onClose(didChange ? (count > 0 ? `${count}개 컬렉션에 저장했어요` : '컬렉션에서 뺐어요') : undefined)
  }
  const closeRef = useRef(close)
  useEffect(() => {
    closeRef.current = close
  })

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        closeRef.current()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  function flash(text, kind) {
    latest.current.changed = true
    setNotice((prev) => ({ text, kind, key: (prev?.key ?? 0) + 1 }))
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setNotice(null), NOTICE_MS)
  }

  function toggle(collection) {
    const wasSaved = savedIn.includes(collection.id)
    store.toggleBookmark(screen, collection.id)
    flash(wasSaved ? `${where}‘${collection.name}’에서 뺐어요` : `${where}‘${collection.name}’에 저장했어요`, wasSaved ? 'removed' : 'saved')
  }

  function create(e) {
    e.preventDefault()
    const collectionName = newName.trim()
    const id = store.createCollection(collectionName)
    if (id) {
      store.toggleBookmark(screen, id)
      flash(`${where}새 컬렉션 ‘${collectionName}’을 만들고 저장했어요`, 'saved')
      setNewName('')
    }
  }

  return (
    <div className="save-backdrop" onClick={close}>
      <div className="save-dialog" role="dialog" aria-modal="true" aria-label="컬렉션에 저장" onClick={(e) => e.stopPropagation()}>
        <div className="save-head">
          <strong>컬렉션에 저장</strong>
          <button type="button" className="detail-close" onClick={close} aria-label="닫기">
            ✕
          </button>
        </div>
        <p className="save-target">
          {screen.service} · {screen.pattern} / {screen.title}
        </p>

        {name && (
          <div className="segmented save-dest" role="tablist" aria-label="저장할 곳">
            <button type="button" role="tab" aria-selected={dest === 'mine'} className={dest === 'mine' ? 'is-active' : ''} onClick={() => setDest('mine')}>
              내 보관함
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={dest === 'team'}
              className={dest === 'team' ? 'is-active' : ''}
              disabled={team.status !== 'ready'}
              title={team.status === 'ready' ? '팀 모두가 함께 쓰는 보관함이에요' : '서버 PC에 연결돼 있고 팀 코드를 입력했을 때 쓸 수 있어요'}
              onClick={() => setDest('team')}
            >
              팀 보관함
            </button>
          </div>
        )}

        <p className={`save-state ${savedIn.length > 0 ? 'is-saved' : ''}`}>
          {savedIn.length > 0 ? `✓ ${savedIn.length}개 컬렉션에 저장됨` : '아직 저장하지 않았어요. 컬렉션을 골라 주세요'}
        </p>

        <ul className="save-list">
          {store.collections.map((c, index) => {
            const dragIndex = store.collections.findIndex((x) => x.id === dragId)
            const dropClass = overId === c.id && dragId && dragId !== c.id ? (dragIndex > index ? 'is-over-before' : 'is-over-after') : ''
            return (
              <li
                key={c.id}
                draggable
                className={`save-item ${dragId === c.id ? 'is-dragging' : ''} ${dropClass}`}
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
                <label className="save-option">
                  <span className="library-grip" aria-hidden="true">
                    ⋮⋮
                  </span>
                  <input type="checkbox" checked={savedIn.includes(c.id)} onChange={() => toggle(c)} />
                  <span>{c.name}</span>
                  <span className="save-option-count">{store.bookmarks.filter((b) => b.collectionId === c.id).length}</span>
                </label>
              </li>
            )
          })}
        </ul>

        <form className="save-new" onSubmit={create}>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="새 컬렉션 이름" aria-label="새 컬렉션 이름" />
          <button type="submit" className="button" disabled={!newName.trim()}>
            만들고 저장
          </button>
        </form>

        <div className="save-live" role="status" aria-live="polite">
          {notice && (
            <p key={notice.key} className={`save-notice is-${notice.kind}`}>
              {notice.kind === 'saved' ? '✓' : '−'} {notice.text}
            </p>
          )}
        </div>

        <button type="button" className="button button-primary save-done" onClick={close}>
          완료
        </button>

        <p className="save-hint">이미지는 저장하지 않고 원본 링크와 화면 정보만 {dest === 'team' ? '팀 모두가 함께 보는 서버 PC의 팀 보관함에' : store.storageMode === 'server' ? (name ? '이름 기준으로 서버 PC에' : '접속 IP 기준으로 서버 PC에') : '이 브라우저에'} 보관해요. 저장한 화면은 위쪽 ‘Archive’에서 볼 수 있어요. 컬렉션은 끌어서 순서를 바꿀 수 있어요.</p>
        {store.storageError && <p className="save-hint save-error">저장하지 못했어요: {store.storageError}</p>}
      </div>
    </div>
  )
}
