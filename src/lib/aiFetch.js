// 내 PC 서버로 가는 API(AI 검토·화면 분석, 팀·개인 보관함) 호출. 로컬(npm run dev/serve)에서는 그냥 fetch예요.
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

export const hasTeamCode = () => Boolean(read())

// prompt: false 면 팀 코드가 없거나 틀려도 입력창을 띄우지 않고 401을 그대로 돌려줘요(백그라운드 조회용).
export async function aiFetch(url, options = {}, { prompt = true } = {}) {
  if (!IS_DEMO) return fetch(url, options)
  const send = (code) => fetch(url, { ...options, headers: { ...options.headers, 'x-team-code': code } })

  let res = await send(read())
  if (res.status === 401 && prompt) {
    const code = window.prompt('팀 코드를 입력해 주세요 (AI 기능을 쓰려면 필요해요)')?.trim()
    if (!code) return res
    res = await send(code)
    write(res.status === 401 ? '' : code)
  }
  return res
}
