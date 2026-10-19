// 사이트(Cloudflare)의 AI 다크패턴 사전 검토를 이 PC의 Claude Code로 돌리게 해요.
//   npm run share           서버 + Cloudflare Tunnel을 켜고 사이트에 터널 주소를 알려줘요. 이 PC가 켜져 있는 동안만 사이트에서 실제 AI 검토가 돼요.
//   npm run share -- --setup  처음 한 번: 비밀키(AI_PROXY_SECRET)와 팀 코드(TEAM_CODE)를 만들어 Cloudflare에 저장해요.
// 비밀값은 저장소에 올라가지 않아요(server/.env, Cloudflare 비밀 설정).
import { spawn, execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { appendFileSync, existsSync, readFileSync } from 'node:fs'

const PROJECT = 'nova-researcher'
const KV_ID = process.env.UXLENS_KV_ID ?? 'ecf59c5216cf4b76848bb01f381dbad4'
const ENV_FILE = new URL('../server/.env', import.meta.url)
const PORT = process.env.PORT ?? 8787
// PATH에 없어도 ~/.local/bin 에 설치한 cloudflared 를 찾아요.
const LOCAL_CLOUDFLARED = `${process.env.HOME}/.local/bin/cloudflared`
const CLOUDFLARED = existsSync(LOCAL_CLOUDFLARED) ? LOCAL_CLOUDFLARED : 'cloudflared'

const readEnvValue = (name) => (existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8').match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim() : '') || ''
const wrangler = (args, input) => execFileSync('npx', ['wrangler', ...args], { input, stdio: ['pipe', 'inherit', 'inherit'] })

if (process.argv.includes('--setup')) {
  let secret = readEnvValue('AI_PROXY_SECRET')
  if (secret.length < 16) {
    secret = randomBytes(24).toString('hex')
    appendFileSync(ENV_FILE, `\nAI_PROXY_SECRET=${secret}\n`)
    console.log('server/.env 에 AI_PROXY_SECRET 을 만들었어요.')
  }
  wrangler(['pages', 'secret', 'put', 'AI_PROXY_SECRET', '--project-name', PROJECT], secret)

  const code = randomBytes(4).toString('hex') // 8자리 팀 코드
  wrangler(['pages', 'secret', 'put', 'TEAM_CODE', '--project-name', PROJECT], code)
  console.log(`\n팀 코드: ${code}\n사이트에서 AI 검토를 처음 요청할 때 입력하는 코드예요. 팀원에게만 알려 주세요. 사이트를 다시 배포해야 적용돼요.`)
  process.exit(0)
}

if (readEnvValue('AI_PROXY_SECRET').length < 16) {
  console.error('먼저 npm run share -- --setup 을 실행해 비밀키와 팀 코드를 만들어 주세요.')
  process.exit(1)
}

const children = []
const run = (cmd, args, opts = {}) => {
  const child = spawn(cmd, args, opts)
  children.push(child)
  return child
}

// 1) 화면 + 검색·AI 서버
run('node', ['--env-file-if-exists=server/.env', 'scripts/serve.js'], { stdio: 'inherit' })

// 2) 터널
let published = false
const tunnel = run(CLOUDFLARED, ['tunnel', '--no-autoupdate', '--url', `http://localhost:${PORT}`], { stdio: ['ignore', 'ignore', 'pipe'] })
tunnel.on('error', (err) => {
  console.error(`cloudflared 를 실행할 수 없어요(${err.code ?? err.message}). 설치되어 있는지 확인해 주세요. 찾은 위치: ${CLOUDFLARED}`)
  shutdown(1)
})
tunnel.stderr.on('data', (chunk) => {
  const url = String(chunk).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)?.[0]
  if (!url || published) return
  published = true
  try {
    wrangler(['kv', 'key', 'put', 'ai_tunnel', url, '--namespace-id', KV_ID, '--remote'])
    console.log(`\n[share] 터널 연결 완료 → ${url}\n[share] 사이트에서 AI 검토가 내 PC의 Claude Code로 돌아가요. 끝내려면 Ctrl+C.`)
  } catch {
    console.error('[share] 사이트에 터널 주소를 알리지 못했어요(wrangler 로그인 확인).')
  }
})

// 종료하면 사이트가 샘플 모드로 돌아가도록 터널 주소를 지워요.
function shutdown(code = 0) {
  try {
    wrangler(['kv', 'key', 'delete', 'ai_tunnel', '--namespace-id', KV_ID, '--remote'])
  } catch {
    // 이미 없으면 무시
  }
  for (const c of children) c.kill()
  process.exit(code)
}
process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
