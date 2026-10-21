// 이름 기준 개인 보관함: /api/user-library?name=이름 → 내 PC 서버. 팀 코드가 필요해요.
import { proxyToPc } from '../_lib/proxy.js'

export function onRequest({ request, env }) {
  return proxyToPc({ request, env, path: '/api/user-library' })
}
