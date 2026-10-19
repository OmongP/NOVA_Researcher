// 사이트의 AI 다크패턴 사전 검토 요청을 내 PC의 서버로 넘겨요(Cloudflare Tunnel 경유).
// AI는 내 PC의 Claude Code 로그인으로 돌고, 토큰은 PC 밖으로 나가지 않아요.
//  - 터널 주소는 KV(UXLENS_AUTH, 키 'ai_tunnel')에 있어요. npm run share 가 시작할 때마다 갱신해요.
//  - PC에는 비밀키(AI_PROXY_SECRET)를 붙여 보내요. 비밀키가 맞지 않으면 PC 서버가 거절해요.
//  - 사이트 사용자는 팀 코드(TEAM_CODE)를 입력해야 분석을 요청할 수 있어요(내 Claude 사용량을 지키기 위해서예요).
import { json, sameSite } from '../../_lib/guard.js'

const safeEqual = (a, b) => {
  const x = new TextEncoder().encode(String(a))
  const y = new TextEncoder().encode(String(b))
  if (x.length !== y.length) return false
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i]
  return diff === 0
}

export async function onRequest({ request, env, params }) {
  if (!sameSite(request) && request.method !== 'GET') return json({ error: '허용되지 않은 요청이에요' }, 403)

  const path = [params.path ?? []].flat().join('/')
  const isStatus = request.method === 'GET' && path === 'status'

  // 상태 조회는 누구나 해요(사이트가 실제 검토를 쓸 수 있는지 보려고). 나머지는 팀 코드가 필요해요.
  if (!isStatus) {
    if (!env.TEAM_CODE) return json({ error: '팀 코드가 설정되지 않아 AI 검토를 쓸 수 없어요' }, 503)
    if (!safeEqual(request.headers.get('x-team-code') ?? '', env.TEAM_CODE)) return json({ error: '팀 코드가 맞지 않아요' }, 401)
  }

  const tunnel = (await env.UXLENS_AUTH?.get('ai_tunnel')) ?? ''
  if (!tunnel || !env.AI_PROXY_SECRET) return json({ error: 'AI 검토 서버(내 PC)가 연결돼 있지 않아요' }, 503)

  const url = new URL(request.url)
  const target = `${tunnel.replace(/\/$/, '')}/api/ai/${path}${url.search}`
  const headers = new Headers({ 'x-ux-lens-proxy': env.AI_PROXY_SECRET })
  const type = request.headers.get('content-type')
  if (type) headers.set('content-type', type)

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    })
    const out = new Headers({ 'Cache-Control': 'no-store' })
    const outType = upstream.headers.get('content-type')
    if (outType) out.set('content-type', outType)
    return new Response(upstream.body, { status: upstream.status, headers: out })
  } catch {
    return json({ error: 'AI 검토 서버(내 PC)에 연결할 수 없어요. PC가 꺼져 있거나 터널이 끊겼을 수 있어요' }, 502)
  }
}
