// 사이트의 요청을 내 PC의 서버로 넘겨요(Cloudflare Tunnel 경유).
//  - 터널 주소는 KV(UXLENS_AUTH, 키 'ai_tunnel')에 있어요. npm run share 가 시작할 때마다 갱신해요.
//  - PC에는 비밀키(AI_PROXY_SECRET)를 붙여 보내요. 비밀키가 맞지 않으면 PC 서버가 거절해요.
//  - requireCode 인 요청은 팀 코드(TEAM_CODE)를 x-team-code 헤더로 받아요(내 Claude 사용량과 보관함을 지키기 위해서예요).
import { json, sameSite } from './guard.js'

const safeEqual = (a, b) => {
  const x = new TextEncoder().encode(String(a))
  const y = new TextEncoder().encode(String(b))
  if (x.length !== y.length) return false
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i]
  return diff === 0
}

export async function proxyToPc({ request, env, path, requireCode = true }) {
  if (!sameSite(request) && request.method !== 'GET') return json({ error: '허용되지 않은 요청이에요' }, 403)

  if (requireCode) {
    if (!env.TEAM_CODE) return json({ error: '팀 코드가 설정되지 않아 쓸 수 없어요' }, 503)
    if (!safeEqual(request.headers.get('x-team-code') ?? '', env.TEAM_CODE)) return json({ error: '팀 코드가 맞지 않아요' }, 401)
  }

  const tunnel = (await env.UXLENS_AUTH?.get('ai_tunnel')) ?? ''
  if (!tunnel || !env.AI_PROXY_SECRET) return json({ error: '서버 PC가 연결돼 있지 않아요' }, 503)

  const url = new URL(request.url)
  const headers = new Headers({ 'x-ux-lens-proxy': env.AI_PROXY_SECRET })
  const type = request.headers.get('content-type')
  if (type) headers.set('content-type', type)

  try {
    const upstream = await fetch(`${tunnel.replace(/\/$/, '')}${path}${url.search}`, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    })
    const out = new Headers({ 'Cache-Control': 'no-store' })
    const outType = upstream.headers.get('content-type')
    if (outType) out.set('content-type', outType)
    return new Response(upstream.body, { status: upstream.status, headers: out })
  } catch {
    return json({ error: '서버 PC에 연결할 수 없어요. PC가 꺼져 있거나 터널이 끊겼을 수 있어요' }, 502)
  }
}
