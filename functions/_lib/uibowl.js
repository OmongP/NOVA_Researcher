// Cloudflare Pages Functions용 UI Bowl MCP 클라이언트예요(SDK 없이 fetch만 써요).
// OAuth 토큰은 KV(UXLENS_AUTH, 키 'auth')에만 두고 브라우저 앱에는 절대 내보내지 않아요.
// UI Bowl 토큰은 갱신할 때마다 바뀌어서(rotation), 로컬 서버와 로그인을 나눠 써요(scripts/cloud-auth.js로 따로 로그인).
const MCP_URL = 'https://uibowl.io/api/mcp'
const TOKEN_URL = 'https://uibowl.io/api/oauth/token'
const AUTH_KEY = 'auth'
const EXPIRY_MARGIN_MS = 60_000

const readAuth = async (kv) => JSON.parse((await kv.get(AUTH_KEY)) ?? 'null')

async function refresh(kv, auth) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: auth.tokens.refresh_token, client_id: auth.client.client_id }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.access_token) {
    // 동시에 갱신한 다른 요청이 이미 새 토큰을 저장했을 수 있어요. 한 번 다시 읽어 봐요.
    const latest = await readAuth(kv)
    if (latest && latest.tokens.access_token !== auth.tokens.access_token) return latest
    throw new Error(`UI Bowl 토큰 갱신에 실패했어요(${json.error ?? res.status}). scripts/cloud-auth.js로 다시 로그인해 주세요`)
  }
  const next = {
    ...auth,
    tokens: { ...auth.tokens, ...json, refresh_token: json.refresh_token ?? auth.tokens.refresh_token, obtainedAt: Date.now() },
  }
  await kv.put(AUTH_KEY, JSON.stringify(next))
  return next
}

async function validAuth(kv) {
  const auth = await readAuth(kv)
  if (!auth?.tokens?.access_token) return null
  const expiresAt = (auth.tokens.obtainedAt ?? 0) + (auth.tokens.expires_in ?? 0) * 1000
  return Date.now() > expiresAt - EXPIRY_MARGIN_MS ? refresh(kv, auth) : auth
}

// 응답은 JSON 또는 SSE(text/event-stream)로 와요.
async function readRpc(res) {
  const text = await res.text()
  if ((res.headers.get('content-type') ?? '').includes('text/event-stream')) {
    const data = text
      .split('\n')
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trim())
      .filter(Boolean)
    return JSON.parse(data[data.length - 1] ?? 'null')
  }
  return text ? JSON.parse(text) : null
}

export async function getAuthStatus(kv) {
  try {
    return { connected: Boolean(await validAuth(kv)) }
  } catch (err) {
    return { connected: false, error: err.message }
  }
}

// 요청 하나 안에서 MCP 세션을 한 번 만들고, 여러 검색을 그 세션으로 보내요.
export async function createCallTool(kv) {
  const auth = await validAuth(kv)
  if (!auth) throw new Error('UI Bowl에 연결되지 않았어요(Cloudflare 로그인 정보 없음)')
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    Authorization: `Bearer ${auth.tokens.access_token}`,
  }
  let id = 0
  let session = null
  const post = async (body, extra = {}) => {
    const res = await fetch(MCP_URL, { method: 'POST', headers: { ...headers, ...extra }, body: JSON.stringify(body) })
    if (res.status === 401) throw new Error('UI Bowl 인증이 만료됐어요')
    if (!res.ok && res.status !== 202) throw new Error(`UI Bowl 응답 오류 HTTP ${res.status}`)
    return res
  }

  const init = await post({
    jsonrpc: '2.0',
    id: ++id,
    method: 'initialize',
    params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'ux-lens-demo', version: '0.1.0' } },
  })
  session = init.headers.get('mcp-session-id')
  await readRpc(init)
  const sessionHeader = session ? { 'mcp-session-id': session } : {}
  await post({ jsonrpc: '2.0', method: 'notifications/initialized' }, sessionHeader).then((r) => r.text())

  const cache = new Map()
  return async function callTool(name, args) {
    const key = JSON.stringify([name, args])
    if (cache.has(key)) return cache.get(key)
    const res = await post({ jsonrpc: '2.0', id: ++id, method: 'tools/call', params: { name, arguments: args } }, sessionHeader)
    const msg = await readRpc(res)
    const result = msg?.result
    const data = result?.structuredContent
    if (msg?.error || result?.isError || !data) {
      const text = result?.content?.find((c) => c.type === 'text')?.text
      throw new Error(text || msg?.error?.message || `${name} 호출 실패`)
    }
    cache.set(key, data)
    return data
  }
}
