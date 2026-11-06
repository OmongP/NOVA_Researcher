import { useEffect, useRef, useState } from 'react'
import { MAX_NAME, MAX_PIN, MIN_PIN } from '../lib/identity'

// 보관함에 쓸 이름과 비밀번호를 받는 작은 대화상자예요.
// 처음 쓰는 이름이면 이번 비밀번호로 정해지고, 이미 있는 이름이면 그때 정한 비밀번호를 넣어야 내 보관함이 열려요.
export default function NameDialog({ initial = '', error = null, onSubmit, onClose }) {
  const [value, setValue] = useState(initial)
  const [pin, setPin] = useState('')
  const input = useRef(null)
  const pinInput = useRef(null)

  useEffect(() => {
    ;(initial ? pinInput : input).current?.focus()
    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose, initial])

  const pinOk = pin.length >= MIN_PIN && pin.length <= MAX_PIN
  const ready = value.trim() && pinOk

  function submit(e) {
    e.preventDefault()
    if (ready) onSubmit(value, pin)
  }

  return (
    <div className="save-backdrop" onClick={onClose}>
      <form className="save-dialog" role="dialog" aria-modal="true" aria-label="이름과 비밀번호 입력" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="save-head">
          <strong>{initial ? '이름·비밀번호' : '이름을 알려 주세요'}</strong>
          <button type="button" className="detail-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        <p className="save-hint">
          <strong>내 보관함</strong>이 이 이름과 비밀번호로 서버 PC에 저장돼요. 다른 PC에서도 같은 이름·비밀번호를 넣으면 같은 보관함이 열려요. 처음 쓰는 이름이면 지금 넣은 비밀번호로 정해져요. 팀
          보관함에는 저장한 사람으로 이름이 표시돼요.
        </p>
        {error && <p className="save-hint save-error">{error}</p>}
        <div className="name-fields">
          <input ref={input} value={value} maxLength={MAX_NAME} onChange={(e) => setValue(e.target.value)} placeholder="이름 (예: 박혜영)" aria-label="이름" autoComplete="username" />
          <input
            ref={pinInput}
            type="password"
            value={pin}
            maxLength={MAX_PIN}
            onChange={(e) => setPin(e.target.value)}
            placeholder={`비밀번호 (${MIN_PIN}자 이상)`}
            aria-label="비밀번호"
            autoComplete="current-password"
          />
          <button type="submit" className="button button-primary" disabled={!ready}>
            확인
          </button>
        </div>
        <p className="save-hint">비밀번호는 이 브라우저에 기억돼서 다음에는 다시 넣지 않아도 돼요. 잊어버리면 서버 PC 관리자에게 초기화를 부탁해 주세요.</p>
        <button type="button" className="button save-done" onClick={onClose}>
          {initial ? '취소' : '나중에 (이름 없이 쓰기)'}
        </button>
      </form>
    </div>
  )
}
