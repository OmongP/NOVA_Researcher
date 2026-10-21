// 팀 공용 보관함: /api/team-library, /api/team-library/op → 내 PC 서버. 팀 코드가 필요해요.
import { proxyToPc } from '../../_lib/proxy.js'

export function onRequest({ request, env, params }) {
  const rest = [params.path ?? []].flat().join('/')
  return proxyToPc({ request, env, path: `/api/team-library${rest ? `/${rest}` : ''}` })
}
