// AI 검토 API 호출. 로컬(npm run dev/serve)에서는 그냥 fetch예요.
// 데모 사이트에서는 요청이 내 PC로 전달되기 때문에, 팀 코드(x-team-code 헤더)가 필요해요.
import { IS_DEMO } from './demo'

const KEY = 'ux-lens:team-code'

const read = () => {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}
const write = (code) => {
  try {
    code ? localStorage.setItem(KEY, code) : localStorage.removeItem(KEY)
  } catch {
    // 저장이 막혀 있으면 이번 요청에만 써요.
  }
}

export async function aiFetch(url, options = {}) {
  if (!IS_DEMO) return fetch(url, options)
  const send = (code) => fetch(url, { ...options, headers: { ...options.headers, 'x-team-code': code } })

  let res = await send(read())
  if (res.status === 401) {
    const code = window.prompt('팀 코드를 입력해 주세요 (AI 다크패턴 사전 검토를 쓰려면 필요해요)')?.trim()
    if (!code) return res
    res = await send(code)
    write(res.status === 401 ? '' : code)
  }
  return res
}
