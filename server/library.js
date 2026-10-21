// 보관함 API
//  - 개인 보관함(이름 기준): GET/PUT /api/user-library?name=이름   → server/library/u-<이름 해시>.json
//  - 팀 공용 보관함: GET /api/team-library, POST /api/team-library/op  → server/library/_team.json
// 로그인이 없어서 이름은 "내가 누구인지 알려 주는 표시"일 뿐 본인 확인이 아니에요(팀 안에서 신뢰하는 용도).
// 팀 보관함은 여러 명이 동시에 쓰기 때문에, 통째로 덮어쓰지 않고 작업(op) 단위로 하나씩 순서대로 반영해요.
import { createHash, randomBytes } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const DIR = new URL('./library/', import.meta.url)
const TEAM_FILE = new URL('_team.json', DIR)
const DEFAULT_TEAM_COLLECTIONS = ['공통 레퍼런스']
const MAX_NAME = 30
const MAX_SCREEN_BYTES = 200_000

const makeId = () => randomBytes(4).toString('hex')
const cleanName = (v) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, MAX_NAME)
const userFile = (name) => new URL(`u-${createHash('sha256').update(`u:${name.toLowerCase()}`).digest('hex').slice(0, 24)}.json`, DIR)

class BadRequest extends Error {}

// ── 개인 보관함 ──────────────────────────────────────────
async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT') return null
    throw err
  }
}

// ── 팀 보관함 ────────────────────────────────────────────
let queue = Promise.resolve()

function initialTeam() {
  const now = new Date().toISOString()
  return { collections: DEFAULT_TEAM_COLLECTIONS.map((name) => ({ id: makeId(), name, createdAt: now, createdBy: '' })), bookmarks: [] }
}

async function readTeam() {
  return (await readJson(TEAM_FILE))?.state ?? initialTeam()
}

// 작업을 한 줄로 세워서 동시에 저장해도 서로의 변경이 사라지지 않게 해요.
function mutateTeam(fn) {
  const run = queue.then(async () => {
    const state = await readTeam()
    const result = fn(state)
    await mkdir(DIR, { recursive: true })
    const saved = { state, updatedAt: new Date().toISOString() }
    await writeFile(TEAM_FILE, JSON.stringify(saved))
    return { ...saved, result }
  })
  queue = run.catch(() => {})
  return run
}

// 화면이 낙관적으로 먼저 보여 주려고 미리 만든 ID를 그대로 써요(형식과 중복만 확인해요).
const pickId = (wanted, used) => (typeof wanted === 'string' && /^[a-z0-9]{4,16}$/.test(wanted) && !used.some((x) => x.id === wanted) ? wanted : makeId())

const need = (cond, msg) => {
  if (!cond) throw new BadRequest(msg)
}
const str = (v, label, max = 200) => {
  need(typeof v === 'string' && v.trim() && v.length <= max, `${label} 값이 올바르지 않아요`)
  return v
}

function move(list, id, targetId) {
  const from = list.findIndex((c) => c.id === id)
  const to = list.findIndex((c) => c.id === targetId)
  need(from >= 0 && to >= 0, '컬렉션을 찾을 수 없어요')
  if (from === to) return
  const [item] = list.splice(from, 1)
  list.splice(to, 0, item)
}

export function applyTeamOp(state, op) {
  const by = cleanName(op?.by)
  switch (op?.type) {
    case 'createCollection': {
      const name = str(op.name, '컬렉션 이름', 60).trim()
      const collection = { id: pickId(op.id, state.collections), name, createdAt: new Date().toISOString(), createdBy: by }
      state.collections.push(collection)
      return { id: collection.id }
    }
    case 'renameCollection': {
      const c = state.collections.find((x) => x.id === op.id)
      need(c, '컬렉션을 찾을 수 없어요')
      c.name = str(op.name, '컬렉션 이름', 60).trim()
      return {}
    }
    case 'deleteCollection': {
      need(state.collections.some((x) => x.id === op.id), '컬렉션을 찾을 수 없어요')
      state.collections = state.collections.filter((x) => x.id !== op.id)
      state.bookmarks = state.bookmarks.filter((b) => b.collectionId !== op.id)
      return {}
    }
    case 'moveCollection':
      move(state.collections, op.id, op.targetId)
      return {}
    case 'addBookmark': {
      need(state.collections.some((x) => x.id === op.collectionId), '컬렉션을 찾을 수 없어요')
      const key = str(op.key, '화면 키', 300)
      need(op.screen && typeof op.screen === 'object' && JSON.stringify(op.screen).length <= MAX_SCREEN_BYTES, '화면 정보가 올바르지 않아요')
      const exists = state.bookmarks.find((b) => b.key === key && b.collectionId === op.collectionId)
      if (exists) return { id: exists.id, existed: true }
      const bookmark = { id: pickId(op.id, state.bookmarks), key, collectionId: op.collectionId, savedAt: new Date().toISOString(), savedBy: by, note: '', screen: op.screen }
      state.bookmarks.push(bookmark)
      return { id: bookmark.id }
    }
    case 'removeBookmark': {
      const before = state.bookmarks.length
      state.bookmarks = state.bookmarks.filter((b) => (op.bookmarkId ? b.id !== op.bookmarkId : !(b.key === op.key && b.collectionId === op.collectionId)))
      return { removed: before - state.bookmarks.length }
    }
    case 'updateNote': {
      const b = state.bookmarks.find((x) => x.id === op.bookmarkId)
      need(b, '저장한 화면을 찾을 수 없어요')
      b.note = String(op.note ?? '').slice(0, 2000)
      b.noteBy = by
      return {}
    }
    default:
      throw new BadRequest('지원하지 않는 작업이에요')
  }
}

const fail = (res, err) => (err instanceof BadRequest ? res.status(400) : res.status(500)).json({ error: err instanceof BadRequest ? err.message : `보관함 처리 중 오류가 났어요: ${err.message}` })

export function registerLibraryRoutes(app) {
  app.get('/api/user-library', async (req, res) => {
    try {
      const name = cleanName(req.query.name)
      need(name, '이름이 필요해요')
      res.json((await readJson(userFile(name))) ?? { state: null, updatedAt: null })
    } catch (err) {
      fail(res, err)
    }
  })

  app.put('/api/user-library', async (req, res) => {
    try {
      const name = cleanName(req.query.name)
      need(name, '이름이 필요해요')
      const { collections, bookmarks } = req.body ?? {}
      need(Array.isArray(collections) && Array.isArray(bookmarks), '보관함 형식이 올바르지 않아요')
      await mkdir(DIR, { recursive: true })
      const saved = { state: { collections, bookmarks }, updatedAt: new Date().toISOString() }
      await writeFile(userFile(name), JSON.stringify(saved))
      res.json({ ok: true, updatedAt: saved.updatedAt })
    } catch (err) {
      fail(res, err)
    }
  })

  app.get('/api/team-library', async (_req, res) => {
    try {
      await queue
      // 파일이 아직 없으면 기본 컬렉션을 만들어 바로 저장해요(읽을 때마다 ID가 달라지지 않게).
      const saved = (await readJson(TEAM_FILE)) ?? (await mutateTeam(() => {}))
      res.json({ state: saved.state, updatedAt: saved.updatedAt })
    } catch (err) {
      fail(res, err)
    }
  })

  app.post('/api/team-library/op', async (req, res) => {
    try {
      const out = await mutateTeam((state) => applyTeamOp(state, req.body))
      res.json({ ok: true, state: out.state, updatedAt: out.updatedAt, result: out.result })
    } catch (err) {
      fail(res, err)
    }
  })
}
