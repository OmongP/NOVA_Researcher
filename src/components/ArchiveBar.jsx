// Archive 위쪽: 내 보관함 / 팀 보관함 전환과 현재 이름.
export default function ArchiveBar({ scope, onScope, name, onChangeName, team, mineCount, onConnect }) {
  const teamLabel = team.bookmarks.length ? `팀 보관함 ${team.bookmarks.length}` : '팀 보관함'
  return (
    <div className="archive-bar">
      <div className="segmented" role="tablist" aria-label="보관함 종류">
        <button type="button" role="tab" aria-selected={scope === 'mine'} className={scope === 'mine' ? 'is-active' : ''} onClick={() => onScope('mine')}>
          내 보관함 {mineCount}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={scope === 'team'}
          className={scope === 'team' ? 'is-active' : ''}
          onClick={() => onScope('team')}
          title={name ? '팀 모두가 함께 쓰는 보관함이에요' : '이름을 입력하면 쓸 수 있어요'}
        >
          {teamLabel}
        </button>
      </div>
      <p className="archive-user">
        {name ? (
          <>
            <strong>{name}</strong> 님
          </>
        ) : (
          '이름 없음'
        )}
        <button type="button" className="link-button" onClick={onChangeName}>
          {name ? '이름 바꾸기' : '이름 입력'}
        </button>
      </p>
      {scope === 'team' && team.status === 'needsCode' && (
        <p className="status archive-note">
          <span>팀 보관함을 보려면 팀 코드가 필요해요.</span>
          <button type="button" className="button" onClick={onConnect}>
            팀 코드 입력
          </button>
        </p>
      )}
      {scope === 'team' && team.status === 'offline' && (
        <p className="status status-error archive-note">
          <span>서버 PC에 연결할 수 없어서 팀 보관함의 최신 내용을 불러오지 못했어요. 마지막으로 받은 내용을 보여줘요. 변경한 내용은 연결되면 다시 시도해야 해요.</span>
        </p>
      )}
      {scope === 'team' && !name && (
        <p className="status archive-note">
          <span>이름을 입력하면 팀 보관함에 저장할 때 내 이름이 같이 표시돼요.</span>
        </p>
      )}
    </div>
  )
}
