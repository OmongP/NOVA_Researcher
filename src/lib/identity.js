// 보관함에서 "누가 저장했는지" 알려 주는 이름(별칭). 로그인이 없어서 본인 확인이 아니라 표시용이에요.
import { useCallback, useState } from 'react'

const KEY = 'ux-lens:user-name'
export const MAX_NAME = 30

export const cleanName = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, MAX_NAME)

export const readName = () => {
  try {
    return cleanName(localStorage.getItem(KEY))
  } catch {
    return ''
  }
}

export function useName() {
  const [name, setNameState] = useState(readName)
  const setName = useCallback((value) => {
    const next = cleanName(value)
    try {
      if (next) localStorage.setItem(KEY, next)
      else localStorage.removeItem(KEY)
    } catch {
      // 저장이 막혀 있으면 이번 방문에만 써요.
    }
    setNameState(next)
  }, [])
  return [name, setName]
}
