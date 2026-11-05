import { useEffect, useMemo, useState } from 'react'
import { screenKey } from '../lib/useCollections'

// 내 보관함의 화면을 팀 보관함에 공유해요. 저장(☆)과 공유를 따로 하는 행동으로 나눴어요.
// 동료가 바로 활용할 수 있게 '어디를 참고하면 좋은지' 한 줄과 관련 업무를 같이 남겨요.
// 팀에 공유한 자료는 내 보관함에서 빼도 그대로 남아요.
export default function ShareDialog({ screen, team, onClose }) {
  const existing = useMemo(() => team.bookmarks.find((b) => b.key === screenKey(screen)), [team.bookmarks, screen])
  const [collectionId, setCollectionId] = useState(existing?.collectionId ?? team.collections[0]?.id ?? '')
  const [newName, setNewName] = useState('')
  const [reason, setReason] = useState(existing?.reason ?? '')
  const [work, setWork] = useState(existing?.work ?? '')
  const works = useMemo(() => [...new Set(team.bookmarks.map((b) => b.work).filter(Boolean))].slice(0, 20), [team.bookmarks])
  const ready = team.status === 'ready'
  const making = collectionId === '__new'

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  function submit(e) {
    e.preventDefault()
    const target = making ? team.createCollection(newName) : collectionId
    if (!target) return
    team.share(screen, target, { reason: reason.trim(), work: work.trim() })
    const name = making ? newName.trim() : team.collections.find((c) => c.id === target)?.name
    onClose(existing ? '팀 공유 내용을 고쳤어요' : `팀 보관함 ‘${name}’에 공유했어요`)
  }

  return (
    <div className="save-backdrop" onClick={() => onClose()}>
      <form className="save-dialog share-dialog" role="dialog" aria-modal="true" aria-label="팀에 공유" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="save-head">
          <strong>{existing ? '팀 공유 내용 고치기' : '팀에 공유'}</strong>
          <button type="button" className="detail-close" onClick={() => onClose()} aria-label="닫기">
            ✕
          </button>
        </div>
        <p className="save-target">
          {screen.service} · {screen.title}
        </p>

        {!ready ? (
          <p className="status archive-note">팀 보관함은 서버 PC에 연결돼 있고 팀 코드를 입력했을 때 쓸 수 있어요. Archive의 ‘팀 보관함’에서 연결해 주세요.</p>
        ) : (
          <>
            <label className="share-field">
              <span>참고할 지점 (한 줄)</span>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={200}
                placeholder="예: 차계부 월별 비교 차트의 요약 문구 참고"
                autoFocus
              />
              <small>동료가 이 화면에서 무엇을 보면 되는지 알려 주세요.</small>
            </label>

            <label className="share-field">
              <span>관련 업무 (선택)</span>
              <input value={work} onChange={(e) => setWork(e.target.value)} maxLength={60} placeholder="예: 차계부 개편" list="share-works" />
              <datalist id="share-works">
                {works.map((w) => (
                  <option key={w} value={w} />
                ))}
              </datalist>
            </label>

            <label className="share-field">
              <span>팀 컬렉션</span>
              <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)} disabled={Boolean(existing)}>
                {team.collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="__new">+ 새 컬렉션</option>
              </select>
              {making && <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} placeholder="새 팀 컬렉션 이름" aria-label="새 팀 컬렉션 이름" />}
            </label>

            <button type="submit" className="button button-primary save-done" disabled={!reason.trim() || (making && !newName.trim())}>
              {existing ? '고치기' : '팀에 공유'}
            </button>
            <p className="save-hint">팀 보관함에는 공유한 사람·참고할 지점·관련 업무가 같이 보여요. 내 보관함에서 이 화면을 빼도 팀에 공유한 자료는 그대로 남아요.</p>
          </>
        )}
      </form>
    </div>
  )
}
