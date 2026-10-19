// Cloudflare 데모 사이트가 쓸 UI Bowl 로그인(OAuth)을 한 번 만들어 KV에 저장해요.
// UI Bowl 토큰은 갱신할 때마다 바뀌어서 로컬 서버(server/.auth.json)와 로그인을 나눠 써야 해요.
// 실행: node scripts/cloud-auth.js  → 출력되는 주소를 브라우저에서 열어 UI Bowl에 로그인·허용해 주세요.
import { createHash, randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const ISSUER = 'https://uibowl.io'
const MCP_URL = `${ISSUER}/api/mcp`
const PORT = 8799
const REDIRECT = `http://localhost:${PORT}/callback`
const KV_ID = process.env.UXLENS_KV_ID ?? 'ecf59c5216cf4b76848bb01f381dbad4'

const meta = await (await fetch(`${ISSUER}/.well-known/oauth-authorization-server`)).json()
const reg = await (
  await fetch(meta.registration_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'UX Lens (cloud demo)',
      redirect_uris: [REDIRECT],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      scope: 'mcp',
    }),
  })
).json()
if (!reg.client_id) throw new Error(`클라이언트 등록 실패: ${JSON.stringify(reg)}`)

const verifier = randomBytes(32).toString('base64url')
const challenge = createHash('sha256').update(verifier).digest('base64url')
const state = randomBytes(16).toString('hex')
const authUrl = new URL(meta.authorization_endpoint)
authUrl.search = new URLSearchParams({
  response_type: 'code',
  client_id: reg.client_id,
  redirect_uri: REDIRECT,
  code_challenge: challenge,
  code_challenge_method: 'S256',
  scope: 'mcp',
  state,
  resource: MCP_URL,
}).toString()

console.log('\n아래 주소를 브라우저에서 열어 UI Bowl에 로그인하고 허용해 주세요:\n')
console.log(authUrl.toString(), '\n')

const code = await new Promise((resolve, reject) => {
  const server = createServer((req, res) => {
    const url = new URL(req.url, REDIRECT)
    if (url.pathname !== '/callback') return res.writeHead(404).end()
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    if (url.searchParams.get('state') !== state || !url.searchParams.get('code')) {
      res.end('<p>로그인에 실패했어요. 터미널을 확인해 주세요.</p>')
      server.close()
      return reject(new Error(url.searchParams.get('error') ?? 'state 불일치'))
    }
    res.end('<p>UX Lens 클라우드 연결이 끝났어요. 이 창을 닫아도 돼요.</p>')
    server.close()
    resolve(url.searchParams.get('code'))
  })
  server.listen(PORT)
  setTimeout(() => reject(new Error('10분 안에 로그인이 끝나지 않았어요')), 600_000).unref()
})

const tokenRes = await fetch(meta.token_endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT, client_id: reg.client_id, code_verifier: verifier }),
})
const tokens = await tokenRes.json()
if (!tokenRes.ok || !tokens.access_token) throw new Error(`토큰 교환 실패: ${tokens.error ?? tokenRes.status}`)

const dir = mkdtempSync(join(tmpdir(), 'uxlens-'))
const file = join(dir, 'auth.json')
writeFileSync(file, JSON.stringify({ client: reg, tokens: { ...tokens, obtainedAt: Date.now() } }), { mode: 0o600 })
try {
  execFileSync('npx', ['wrangler', 'kv', 'key', 'put', 'auth', '--path', file, '--namespace-id', KV_ID, '--remote'], { stdio: 'inherit' })
} finally {
  rmSync(dir, { recursive: true, force: true })
}
console.log('\nKV에 저장했어요. 이제 데모 사이트가 실시간 UI Bowl 검색을 써요.')
