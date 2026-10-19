// 팀 공유 모드: 만들어 둔 화면(dist)과 검색·AI 서버를 한 서버로 켜서 같은 사내망의 팀원이 접속할 수 있게 해요.
// 실행: npm run serve (화면을 새로 빌드한 뒤 시작) 또는 npm start (빌드 없이 시작)
// 접속 주소는 시작할 때 출력돼요. 이 PC가 켜져 있을 때만 접속돼요.
import { existsSync } from 'node:fs'

if (!existsSync(new URL('../dist/index.html', import.meta.url))) {
  console.error('dist가 없어요. 먼저 npm run build를 실행하거나 npm run serve로 시작해 주세요.')
  process.exit(1)
}

process.env.SERVE_STATIC = '1'
process.env.HOST ??= '0.0.0.0' // 사내망 접속 허용 (이 PC에서만 쓰려면 HOST=127.0.0.1)
process.env.APP_URL ??= `http://localhost:${process.env.PORT ?? 8787}`

await import('../server/index.js')
