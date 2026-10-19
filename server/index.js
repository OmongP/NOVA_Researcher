// 로컬 검색 프록시 서버 (http://localhost:8787)
// 브라우저 앱 → 이 서버 → UI Bowl MCP 순서로 검색해요.
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { networkInterfaces } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import express from 'express'
import { interpretQuery } from '../src/lib/searchQuery.js'
import { runDarkSearch, runSearch } from './searchCore.js'
import { getAuthStatus, finishLogin, callTool } from './uibowl.js'
import { ruleById } from '../src/data/darkPatternRules.js'
import { cancelJob, getJob, getProviders, jobImagePath, recoverInterruptedJobs, retryJob, startReview } from './aiReview.js'

const PORT = Number(process.env.PORT ?? 8787)
// 개발 중에는 Vite(5173)가 화면을 서비스하고, 팀 공유 모드(npm run serve)에서는 이 서버가 화면까지 서비스해요.
const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'
const HOST = process.env.HOST // 비우면 기존처럼 열고, 팀 공유 모드에서는 0.0.0.0(사내망 접속 허용)

const app = express()
app.use(express.json({ limit: '25mb' }))
// Vite 프록시(로컬 루프백)를 거쳐 와도 접속한 사람의 IP를 읽어요.
app.set('trust proxy', 'loopback')

// 보관함: 접속 IP별로 서버에 보관해요. 로그인이 없어서 같은 IP를 쓰는 사람은 같은 보관함을 봐요.
// 파일 이름에는 IP를 그대로 쓰지 않고 해시를 써요.
const LIBRARY_DIR = new URL('./library/', import.meta.url)
function libraryFile(req) {
  const ip = String(req.ip ?? '').replace(/^::ffff:/, '')
  const owner = ['::1', '127.0.0.1', ''].includes(ip) ? 'localhost' : ip
  return new URL(`${createHash('sha256').update(owner).digest('hex').slice(0, 24)}.json`, LIBRARY_DIR)
}

app.get('/api/library', async (req, res) => {
  try {
    res.json(JSON.parse(await readFile(libraryFile(req), 'utf8')))
  } catch (err) {
    if (err.code === 'ENOENT') return res.json({ state: null, updatedAt: null })
    res.status(500).json({ error: `보관함을 읽지 못했어요: ${err.message}` })
  }
})

app.put('/api/library', async (req, res) => {
  const { collections, bookmarks } = req.body ?? {}
  if (!Array.isArray(collections) || !Array.isArray(bookmarks)) return res.status(400).json({ error: '보관함 형식이 올바르지 않아요' })
  try {
    await mkdir(LIBRARY_DIR, { recursive: true })
    const saved = { state: { collections, bookmarks }, updatedAt: new Date().toISOString() }
    await writeFile(libraryFile(req), JSON.stringify(saved))
    res.json({ ok: true, updatedAt: saved.updatedAt })
  } catch (err) {
    res.status(500).json({ error: `보관함을 저장하지 못했어요: ${err.message}` })
  }
})

app.get('/api/auth/status', async (_req, res) => {
  res.json(await getAuthStatus())
})

app.get('/api/auth/callback', async (req, res) => {
  const { code, error } = req.query
  if (error || !code) return res.status(400).send(`UI Bowl 로그인 실패: ${error ?? 'code 없음'}`)
  try {
    await finishLogin(String(code))
    res.redirect(APP_URL)
  } catch (err) {
    res.status(500).send(`토큰 교환 실패: ${err.message}`)
  }
})

app.post('/api/search', async (req, res) => {
  const { q, domain = '전체' } = req.body ?? {}
  if (!interpretQuery(q ?? '')) return res.status(400).json({ error: '검색어가 비어 있어요' })

  const status = await getAuthStatus()
  if (!status.connected) return res.status(401).json(status)

  res.json(await runSearch(q, domain, callTool))
})

app.post('/api/dark/search', async (req, res) => {
  const rule = ruleById(req.body?.ruleId)
  if (!rule) return res.status(400).json({ error: '규칙을 찾을 수 없어요' })

  const status = await getAuthStatus()
  if (!status.connected) return res.status(401).json(status)

  res.json(await runDarkSearch(rule, callTool))
})

// AI 1차 검토: 스크린샷과 가이드 규칙을 Claude API로 보내 참고용 판정을 받아요.
app.get('/api/ai/status', (_req, res) => {
  res.json(getProviders())
})

// 검토 요청: 작업을 만들고 바로 id·상태를 돌려줘요. 진행 상황은 /api/ai/jobs/:id로 확인해요.
app.post('/api/ai/analyze', (req, res) => {
  try {
    res.json(startReview(req.body ?? {}))
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/ai/jobs/:id', (req, res) => {
  try {
    res.json(getJob(req.params.id))
  } catch (err) {
    res.status(400).json({ state: 'failed', error: err.message })
  }
})

app.get('/api/ai/jobs/:id/image', (req, res) => {
  try {
    res.sendFile(jobImagePath(req.params.id))
  } catch {
    res.status(404).end()
  }
})

app.post('/api/ai/jobs/:id/retry', (req, res) => {
  try {
    res.json(retryJob(req.params.id))
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.delete('/api/ai/jobs/:id', (req, res) => {
  try {
    res.json(cancelJob(req.params.id))
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

recoverInterruptedJobs()

// 팀 공유 모드: npm run build로 만든 화면(dist)을 이 서버가 함께 서비스해요. /api 이외 경로는 화면으로 보내요.
const DIST = fileURLToPath(new URL('../dist/', import.meta.url))
if (process.env.SERVE_STATIC && existsSync(DIST)) {
  app.use(express.static(DIST))
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(join(DIST, 'index.html')))
}

function lanUrls() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((n) => n && n.family === 'IPv4' && !n.internal)
    .map((n) => `http://${n.address}:${PORT}`)
}

app.listen(PORT, HOST, () => {
  console.log(`[ux-finder] search proxy on http://localhost:${PORT}`)
  if (process.env.SERVE_STATIC) {
    console.log('[ux-finder] 팀 공유 모드: 같은 사내망의 팀원은 아래 주소로 접속해요 (이 PC가 켜져 있을 때만 돼요)')
    for (const url of lanUrls()) console.log(`  ${url}`)
  }
})
