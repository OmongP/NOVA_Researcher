// 사이트의 AI 다크패턴 사전 검토 요청을 내 PC의 서버로 넘겨요. 상태 조회는 누구나, 나머지는 팀 코드가 필요해요.
import { proxyToPc } from '../../_lib/proxy.js'

export function onRequest({ request, env, params }) {
  const path = [params.path ?? []].flat().join('/')
  const isStatus = request.method === 'GET' && path === 'status'
  return proxyToPc({ request, env, path: `/api/ai/${path}`, requireCode: !isStatus })
}
