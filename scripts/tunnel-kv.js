// 터널 주소를 Cloudflare KV에 저장·삭제해요.
// server/.cf-token 에 전용 토큰이 있으면 그걸 쓰고(로그인 만료와 상관없어요), 없으면 npx wrangler login 을 써요.
// 토큰은 이 명령에만 넘겨요. 서버와 Claude Code에는 전달되지 않아요.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const KV_ID = process.env.UXLENS_KV_ID ?? 'ecf59c5216cf4b76848bb01f381dbad4'
const ACCOUNT_ID = process.env.UXLENS_ACCOUNT_ID ?? '5c9ada9758edee904875616d0bbbb8c3'
export const TOKEN_FILE = new URL('../server/.cf-token', import.meta.url)

const savedToken = () => (existsSync(TOKEN_FILE) ? readFileSync(TOKEN_FILE, 'utf8').trim() : '')

export function kv(args, { token = savedToken(), stdio = ['ignore', 'inherit', 'inherit'] } = {}) {
  execFileSync('npx', ['wrangler', 'kv', 'key', ...args, '--namespace-id', KV_ID, '--remote'], {
    stdio,
    shell: process.platform === 'win32', // Windows 에서는 npx 가 npx.cmd 라서 shell 을 거쳐야 실행돼요.
    env: token ? { ...process.env, CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID } : process.env,
  })
}
