// 사이트(Cloudflare Pages) 배포. 사이트마다 어떤 버전으로 빌드할지 정해 두었어요.
//   node scripts/deploy.js nova-lens        Inspect·AI 다크패턴 사전 검토가 보이는 버전
//   node scripts/deploy.js nova-lens-lite   Light 버전(다크패턴 기능을 모두 숨기고 벤치마킹 기능만)
// Pages는 설정 파일 경로를 따로 지정할 수 없어서, 배포하는 동안만 wrangler.jsonc 의 name 을 바꿨다가 되돌려요.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const SITES = {
  'nova-lens': { label: '기본(Inspect·AI 사전 검토 보임)', env: { VITE_LITE: '', VITE_HIDE_AI_REVIEW: '' } },
  'nova-lens-lite': { label: 'Light(벤치마킹 전용, 다크패턴 기능 숨김)', env: { VITE_LITE: '1', VITE_HIDE_AI_REVIEW: '' } },
}

const site = process.argv[2]
if (!SITES[site]) {
  console.error(`사이트 이름을 알려 주세요: ${Object.keys(SITES).join(' | ')}`)
  process.exit(1)
}

const configUrl = new URL('../wrangler.jsonc', import.meta.url)
const original = readFileSync(configUrl, 'utf8')
const shell = process.platform === 'win32'
const run = (cmd, args, env = {}) => execFileSync(cmd, args, { stdio: 'inherit', shell, env: { ...process.env, ...env } })

try {
  console.log(`[deploy] ${site} 빌드 — ${SITES[site].label}`)
  run('npm', ['run', 'build:demo'], SITES[site].env)
  writeFileSync(configUrl, original.replace(/"name":\s*"[^"]*"/, `"name": "${site}"`))
  run('npx', ['wrangler', 'pages', 'deploy', '--project-name', site, '--branch', 'main'])
} finally {
  writeFileSync(configUrl, original) // 실패해도 설정 파일은 원래대로 돌려놔요
}
