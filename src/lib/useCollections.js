// 내 보관함: 북마크·컬렉션을 이름 기준(이름이 없으면 접속 IP 기준)으로 서버 PC에 보관해요(server/library). 브라우저 로컬 저장소는 캐시로 같이 써요.
// 서버가 없거나 꺼진 때, 팀 코드를 입력하지 않은 데모 사이트에서는 이 브라우저에만 보관해요.
// 이미지 파일은 저장하지 않고 원본 URL과 화면 메타데이터만 남겨요.
import { useCallback, useEffect, useRef, useState } from 'react'
import { aiFetch, hasTeamCode } from './aiFetch'
import { IS_DEMO } from './demo'

const STORAGE_KEY = 'ux-finder:collections:v1'

const DEFAULT_COLLECTIONS = ['대출 한도 조회', '내차 등록', '차량 시세', '본인인증 실패']

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

function initialState() {
  const now = new Date().toISOString()
  return {
    collections: DEFAULT_COLLECTIONS.map((name) => ({ id: makeId(), name, createdAt: now })),
    bookmarks: [],
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : initialState()
  } catch {
    return initialState()
  }
}

// 같은 화면 묶음을 알아보는 키예요. 서버의 중복 병합 키와 같아요.
export function screenKey(screen) {
  return `${screen.service}|${screen.pattern}|${screen.variant ?? ''}`
}

// 저장할 때는 검색 상태(점수 등)를 빼고 리서치 근거로 쓸 정보만 남겨요.
export function snapshot(screen) {
  const { service, domain, pattern, variant, title, dataMonth, screenCount, image, images, uiUrl, source, searchedAt, matchedTexts, components, relevance } =
    screen
  return { service, domain, pattern, variant, title, dataMonth, screenCount, image, images, uiUrl, source, searchedAt, matchedTexts, components, relevance }
}

const SAVE_DELAY_MS = 400
// 이 브라우저에 있던 보관함을 어떤 이름으로 서버에 처음 올렸는지 기억해요(다른 이름으로 바꿨을 때 남의 데이터를 복사하지 않으려고요).
const MIGRATED_KEY = 'ux-lens:name-migrated'
const readMigrated = () => {
  try {
    return localStorage.getItem(MIGRATED_KEY) ?? ''
  } catch {
    return ''
  }
}
const writeMigrated = (name) => {
  try {
    localStorage.setItem(MIGRATED_KEY, name)
  } catch {
    // 저장이 막혀 있으면 무시해요.
  }
}

// 이름이 있으면 이름 기준(/api/user-library), 없으면 예전처럼 접속 IP 기준(/api/library)이에요.
const serverUrl = (name) => (name ? `/api/user-library?name=${encodeURIComponent(name)}` : '/api/library')

async function pushToServer(name, next) {
  const res = await aiFetch(serverUrl(name), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) }, { prompt: false })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`)
}

// 데모 사이트는 팀 코드를 입력한 뒤에만 서버 PC에 보관해요(그 전에는 이 브라우저에만).
const canUseServer = () => !IS_DEMO || hasTeamCode()

// epoch: 팀 코드를 새로 입력하는 등 서버 연결 조건이 바뀌었을 때 다시 동기화하려고 올리는 숫자예요.
export function useCollections(name = '', epoch = 0) {
  const [state, setState] = useState(load)
  const [storageError, setStorageError] = useState(null)
  // 'checking' → 'server'(서버 PC에 보관) | 'local'(이 브라우저에만 보관)
  const [storageMode, setStorageMode] = useState(canUseServer() ? 'checking' : 'local')
  const serverReady = useRef(false)
  const latest = useRef(state)
  const timer = useRef(null)

  // 이름(또는 연결 조건)이 정해지면 서버의 보관함을 불러와요. 서버가 비어 있으면 이 브라우저의 보관함을 올려요.
  useEffect(() => {
    serverReady.current = false
    clearTimeout(timer.current)
    if (!canUseServer()) {
      setStorageMode('local')
      return
    }
    setStorageMode('checking')
    let cancelled = false
    aiFetch(serverUrl(name), {}, { prompt: false })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(async (data) => {
        if (cancelled) return
        if (data.state) {
          setState(data.state)
        } else {
          const migrated = readMigrated()
          if (!name || !migrated || migrated === name) {
            if (latest.current.bookmarks.length > 0) {
              await pushToServer(name, latest.current)
              if (name) writeMigrated(name)
            }
          } else {
            setState(initialState())
          }
        }
        serverReady.current = true
        setStorageMode('server')
      })
      .catch(() => !cancelled && setStorageMode('local'))
    return () => {
      cancelled = true
    }
  }, [name, epoch])

  useEffect(() => {
    latest.current = state
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      setStorageError(null)
    } catch (err) {
      setStorageError(err.message)
    }
    if (!serverReady.current) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      pushToServer(name, latest.current)
        .then(() => setStorageError(null))
        .catch((err) => setStorageError(`서버에 보관하지 못했어요: ${err.message}`))
    }, SAVE_DELAY_MS)
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimeout(timer.current), [])

  const createCollection = useCallback((name) => {
    const trimmed = name.trim()
    if (!trimmed) return null
    const collection = { id: makeId(), name: trimmed, createdAt: new Date().toISOString() }
    setState((s) => ({ ...s, collections: [...s.collections, collection] }))
    return collection.id
  }, [])

  const renameCollection = useCallback((id, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setState((s) => ({ ...s, collections: s.collections.map((c) => (c.id === id ? { ...c, name: trimmed } : c)) }))
  }, [])

  // 컬렉션 순서 바꾸기: id를 targetId 자리로 옮겨요(아래로 옮기면 target 뒤, 위로 옮기면 target 앞에 놓여요).
  const moveCollection = useCallback((id, targetId) => {
    setState((s) => {
      const from = s.collections.findIndex((c) => c.id === id)
      const to = s.collections.findIndex((c) => c.id === targetId)
      if (from < 0 || to < 0 || from === to) return s
      const collections = [...s.collections]
      const [item] = collections.splice(from, 1)
      collections.splice(to, 0, item)
      return { ...s, collections }
    })
  }, [])

  const moveCollectionBy = useCallback((id, delta) => {
    setState((s) => {
      const from = s.collections.findIndex((c) => c.id === id)
      const to = from + delta
      if (from < 0 || to < 0 || to >= s.collections.length) return s
      const collections = [...s.collections]
      const [item] = collections.splice(from, 1)
      collections.splice(to, 0, item)
      return { ...s, collections }
    })
  }, [])

  const deleteCollection = useCallback((id) => {
    setState((s) => ({
      collections: s.collections.filter((c) => c.id !== id),
      bookmarks: s.bookmarks.filter((b) => b.collectionId !== id),
    }))
  }, [])

  const toggleBookmark = useCallback((screen, collectionId) => {
    const key = screenKey(screen)
    setState((s) => {
      const exists = s.bookmarks.some((b) => b.key === key && b.collectionId === collectionId)
      return {
        ...s,
        bookmarks: exists
          ? s.bookmarks.filter((b) => !(b.key === key && b.collectionId === collectionId))
          : [...s.bookmarks, { id: makeId(), key, collectionId, savedAt: new Date().toISOString(), note: '', screen: snapshot(screen) }],
      }
    })
  }, [])

  const updateNote = useCallback((bookmarkId, note) => {
    setState((s) => ({ ...s, bookmarks: s.bookmarks.map((b) => (b.id === bookmarkId ? { ...b, note } : b)) }))
  }, [])

  const removeBookmark = useCallback((bookmarkId) => {
    setState((s) => ({ ...s, bookmarks: s.bookmarks.filter((b) => b.id !== bookmarkId) }))
  }, [])

  const collectionsOf = useCallback(
    (screen) => {
      const key = screenKey(screen)
      return state.bookmarks.filter((b) => b.key === key).map((b) => b.collectionId)
    },
    [state.bookmarks],
  )

  return {
    collections: state.collections,
    bookmarks: state.bookmarks,
    storageError,
    storageMode,
    createCollection,
    renameCollection,
    deleteCollection,
    moveCollection,
    moveCollectionBy,
    toggleBookmark,
    updateNote,
    removeBookmark,
    collectionsOf,
  }
}

// 컬렉션을 리서치 문서에 붙여 넣기 좋은 Markdown으로 만들어요.
export function collectionToMarkdown(collection, bookmarks) {
  const lines = [`## ${collection.name}`, '']
  for (const b of bookmarks) {
    const s = b.screen
    lines.push(`- **${s.service}** — ${s.pattern} / ${s.title} (${s.domain})`)
    lines.push(`  - 출처: ${s.source ?? 'UI Bowl'} · UI Bowl 수집월 ${s.dataMonth ?? '미확인'} · 앱 버전 미확인`)
    lines.push(`  - 저장일: ${new Date(b.savedAt).toLocaleDateString('ko-KR')}`)
    lines.push(`  - 원본: ${s.uiUrl}`)
    if (b.note) lines.push(`  - 메모: ${b.note}`)
  }
  return lines.join('\n')
}
