// 보관함에 쓰는 이름(별칭)과 비밀번호예요.
//  - 이름: 팀 보관함에 "누가 저장했는지" 표시하고, 내 보관함을 찾는 열쇠로 써요.
//  - 비밀번호: 내 보관함을 남이 열지 못하게 서버 PC가 확인해요. 이 브라우저에 기억해 두고 다음 방문 때 자동으로 써요.
import { useCallback, useState } from 'react'

const KEY = 'ux-lens:user-name'
const PIN_KEY = 'ux-lens:user-pin'
export const MAX_NAME = 30
export const MIN_PIN = 4
export const MAX_PIN = 30

export const cleanName = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, MAX_NAME)

const get = (key) => {
  try {
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}
const put = (key, value) => {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    // 저장이 막혀 있으면 이번 방문에만 써요.
  }
}

export const readName = () => cleanName(get(KEY))

// [이름, (이름, 비밀번호) => void, 비밀번호]
export function useName() {
  const [identity, setIdentity] = useState(() => ({ name: readName(), pin: get(PIN_KEY) }))
  const setName = useCallback((value, pin = '') => {
    const next = { name: cleanName(value), pin: String(pin ?? '').slice(0, MAX_PIN) }
    if (!next.name) next.pin = ''
    put(KEY, next.name)
    put(PIN_KEY, next.pin)
    setIdentity(next)
  }, [])
  return [identity.name, setName, identity.pin]
}
