// npm run cf-token: 터널 주소 저장 전용 Cloudflare 토큰을 확인하고 server/.cf-token 에 저장해요.
// 토큰 권한: Account > Workers KV Storage > Edit. 입력한 토큰은 화면과 로그에 나오지 않아요.
import { chmodSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { Writable } from 'node:stream'
import { kv, TOKEN_FILE } from './tunnel-kv.js'

process.stdout.write('토큰을 붙여 넣고 Enter를 눌러 주세요(화면에 보이지 않아요): ')
const muted = new Writable({ write: (_chunk, _encoding, done) => done() })
const rl = createInterface({ input: process.stdin, output: muted, terminal: Boolean(process.stdin.isTTY) })
const token = await new Promise((resolve) => {
  rl.once('line', resolve)
  rl.once('close', () => resolve(''))
})
rl.close()
process.stdout.write('\n')

const value = token.trim()
if (!value) {
  console.error('토큰이 입력되지 않았어요. 저장하지 않았어요.')
  process.exit(1)
}

// 완료 화면의 확인용 curl 명령처럼 토큰 말고 다른 내용이 복사된 경우예요.
if (/\s/.test(value)) {
  console.error('토큰 값만 복사해 주세요(공백이 없는 한 줄이에요). 확인용 curl 명령이 복사된 것 같아요. 저장하지 않았어요.')
  process.exit(1)
}

// Global API Key는 계정 전체 권한이라 받지 않아요.
if (value.startsWith('cfk_')) {
  console.error('API Token이 아니라 Global API Key로 보여요. 저장하지 않았어요. API Tokens의 Create Token으로 만든 값을, npm run cf-token 을 다시 실행해서 넣어 주세요.')
  process.exit(1)
}

// 실제로 써 보고 지워요. 실패하면 저장하지 않아요.
const CHECK_KEY = 'ai_tunnel_token_check'
try {
  kv(['put', CHECK_KEY, 'ok'], { token: value, stdio: 'ignore' })
  kv(['delete', CHECK_KEY], { token: value, stdio: 'ignore' })
} catch {
  console.error('이 토큰으로 저장에 실패했어요. 권한이 Account > Workers KV Storage > Edit 인지 확인해 주세요. 저장하지 않았어요. 다시 넣으려면 npm run cf-token 을 먼저 실행해 주세요.')
  process.exit(1)
}

writeFileSync(TOKEN_FILE, `${value}\n`, { mode: 0o600 })
chmodSync(TOKEN_FILE, 0o600) // 이미 있던 파일도 본인만 읽게 해요
console.log('토큰을 확인하고 저장했어요. 이제 이 탭은 닫아도 돼요.')
