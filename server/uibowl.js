// UI Bowl MCP(https://uibowl.io/api/mcp)에 붙는 MCP 클라이언트예요.
// OAuth 토큰은 server/.auth.json에 저장하고 브라우저 앱에는 절대 내보내지 않아요.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js'

const MCP_URL = new URL('https://uibowl.io/api/mcp')
const AUTH_FILE = new URL('./.auth.json', import.meta.url)

export const REDIRECT_URL = 'http://localhost:8787/api/auth/callback'

function loadStore() {
  if (!existsSync(AUTH_FILE)) return {}
  return JSON.parse(readFileSync(AUTH_FILE, 'utf8'))
}

function saveStore(patch) {
  const next = { ...loadStore(), ...patch }
  writeFileSync(AUTH_FILE, JSON.stringify(next, null, 2), { mode: 0o600 })
}

// 로그인 URL은 파일에도 저장해서, 서버가 재시작돼도 같은 code verifier로 콜백을 처리해요.
let pendingAuthUrl = loadStore().pendingAuthUrl ?? null

const authProvider = {
  get redirectUrl() {
    return REDIRECT_URL
  },
  get clientMetadata() {
    return {
      client_name: 'Finance & Auto UX Finder (local)',
      redirect_uris: [REDIRECT_URL],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      scope: 'mcp',
    }
  },
  clientInformation: () => loadStore().client,
  saveClientInformation: (client) => saveStore({ client }),
  tokens: () => loadStore().tokens,
  saveTokens: (tokens) => saveStore({ tokens }),
  redirectToAuthorization: (url) => {
    pendingAuthUrl = url.toString()
    saveStore({ pendingAuthUrl })
  },
  saveCodeVerifier: (codeVerifier) => saveStore({ codeVerifier }),
  codeVerifier: () => loadStore().codeVerifier,
  invalidateCredentials: (scope) => {
    if (scope === 'all') saveStore({ client: undefined, tokens: undefined, codeVerifier: undefined })
    if (scope === 'tokens') saveStore({ tokens: undefined })
  },
}

let client = null
let transport = null

async function connect() {
  if (client) return client
  transport = new StreamableHTTPClientTransport(MCP_URL, { authProvider })
  const next = new Client({ name: 'finance-auto-ux-finder', version: '0.1.0' })
  await next.connect(transport)
  client = next
  return client
}

// 로그인 상태 확인. 로그인이 필요하면 UI Bowl 로그인 URL을 함께 돌려줘요.
export async function getAuthStatus() {
  // 로그인 진행 중에는 새 로그인 URL을 만들지 않아요. 새로 만들면 code verifier가 바뀌어 콜백이 실패해요.
  if (pendingAuthUrl && !loadStore().tokens) return { connected: false, loginUrl: pendingAuthUrl }
  try {
    await connect()
    return { connected: true }
  } catch (err) {
    client = null
    if (err instanceof UnauthorizedError && pendingAuthUrl) {
      return { connected: false, loginUrl: pendingAuthUrl }
    }
    return { connected: false, error: err.message }
  }
}

export async function finishLogin(code) {
  transport ??= new StreamableHTTPClientTransport(MCP_URL, { authProvider })
  await transport.finishAuth(code)
  pendingAuthUrl = null
  saveStore({ pendingAuthUrl: undefined })
  client = null
  await connect()
}

const cache = new Map()

export async function callTool(name, args) {
  const key = JSON.stringify([name, args])
  if (cache.has(key)) return cache.get(key)

  const c = await connect()
  const result = await c.callTool({ name, arguments: args })
  // 사람이 읽는 설명은 content(text)에, 검색 데이터는 structuredContent에 들어 있어요.
  const data = result.structuredContent
  if (result.isError || !data) {
    const text = result.content?.find((item) => item.type === 'text')?.text
    throw new Error(text || `${name} 호출 실패`)
  }
  cache.set(key, data)
  return data
}
