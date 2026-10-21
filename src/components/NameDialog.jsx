import { useEffect, useRef, useState } from 'react'
import { MAX_NAME } from '../lib/identity'

// 보관함에 쓸 이름(별칭)을 받는 작은 대화상자예요. 로그인이 아니라 "누가 저장했는지" 표시용이에요.
export default function NameDialog({ initial = '', onSubmit, onClose }) {
  const [value, setValue] = useState(initial)
  const input = useRef(null)

  useEffect(() => {
    input.current?.focus()
    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  function submit(e) {
    e.preventDefault()
    if (value.trim()) onSubmit(value)
  }

  return (
    <div className="save-backdrop" onClick={onClose}>
      <form className="save-dialog" role="dialog" aria-modal="true" aria-label="이름 입력" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="save-head">
          <strong>{initial ? '이름 바꾸기' : '이름을 알려 주세요'}</strong>
          <button type="button" className="detail-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        <p className="save-hint">
          팀 보관함에 저장한 사람으로 표시되고, <strong>내 보관함</strong>이 이 이름으로 저장돼요. 로그인이 아니라 표시용이라 비밀번호는 없어요. 같은 이름을 쓰면 같은 내 보관함이
          열려요.
        </p>
        <div className="save-new">
          <input ref={input} value={value} maxLength={MAX_NAME} onChange={(e) => setValue(e.target.value)} placeholder="예) 박혜영" aria-label="이름" />
          <button type="submit" className="button button-primary" disabled={!value.trim()}>
            확인
          </button>
        </div>
        <button type="button" className="button save-done" onClick={onClose}>
          {initial ? '취소' : '나중에 (이름 없이 쓰기)'}
        </button>
      </form>
    </div>
  )
}
