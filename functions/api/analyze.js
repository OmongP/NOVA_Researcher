// 사이트의 화면 분석(Analyze) 요청을 내 PC의 서버로 넘겨요. 내 Claude 사용량을 쓰는 기능이라 팀 코드가 필요해요.
import { proxyToPc } from '../_lib/proxy.js'

export function onRequestPost({ request, env }) {
  return proxyToPc({ request, env, path: '/api/analyze' })
}
