// 팀 공용 보관함: 서버 PC의 한 곳(server/library/_team.json)에 팀원이 함께 저장해요.
// 여러 명이 동시에 쓰기 때문에 통째로 덮어쓰지 않고, 변경을 작업 단위로 서버에 보내요(server/library.js).
// 화면은 낙관적으로 먼저 바꾸고, 서버가 돌려준 최신 상태로 맞춰요. 20초마다·창을 다시 볼 때 새로 받아와요.
import { useCallback, useEffect, useRef, useState } from 'react'
import { aiFetch, hasTeamCode } from './aiFetch'
import { IS_DEMO } from './demo'
import { screenKey, snapshot } from './useCollections'

const CACHE_KEY = 'ux-lens:team-cache'
const POLL_MS = 20_000
const NOTE_DELAY_MS = 600

const makeId = () => (Math.random().toString(36) + '00000000').slice(2, 10)
const empty = { collections: [], bookmarks: [] }

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) ?? empty
  } catch {
    return empty
  }
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }

// epoch: 팀 코드를 새로 입력하는 등 연결 조건이 바뀌었을 때 올리는 숫자예요.
export function useTeamLibrary(name, epoch = 0) {
  const [state, setState] = useState(loadCache)
  // 'idle'(연결 전) | 'loading' | 'ready' | 'offline'(서버 PC에 연결 안 됨) | 'needsCode'(팀 코드 필요)
  const [status, setStatus] = useState(!IS_DEMO || hasTeamCode() ? 'loading' : 'needsCode')
  const [error, setError] = useState(null)
  const nameRef = useRef(name)
  const pending = useRef(0)
  const chain = useRef(Promise.resolve())
  const lastServer = useRef(null)
  const noteTimers = useRef(new Map())

  useEffect(() => {
    nameRef.current = name
  }, [name])

  const remember = useCallback((next) => {
    setState(next)
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(next))
    } catch {
      // 캐시를 못 써도 괜찮아요.
    }
  }, [])

  const refresh = useCallback(
    async ({ prompt = false } = {}) => {
      if (pending.current > 0) return false
      try {
        const res = await aiFetch('/api/team-library', {}, { prompt })
        if (res.status === 401) {
          setStatus('needsCode')
          return false
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        remember((await res.json()).state)
        setStatus('ready')
        setError(null)
        return true
      } catch {
        setStatus('offline')
        return false
      }
    },
    [remember],
  )

  // 서버로 보내는 작업은 한 줄로 세워서 보낸 순서대로 반영돼요.
  const send = useCallback(
    (op) => {
      pending.current += 1
      chain.current = chain.current.then(async () => {
        let failed = false
        try {
          const res = await aiFetch('/api/team-library/op', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ ...op, by: nameRef.current }) }, { prompt: false })
          if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`)
          lastServer.current = (await res.json()).state
          setError(null)
        } catch (err) {
          failed = true
          setError(`팀 보관함에 저장하지 못했어요: ${err.message}`)
        } finally {
          pending.current -= 1
          if (pending.current === 0) {
            if (!failed && lastServer.current) remember(lastServer.current)
            else refresh()
          }
        }
      })
    },
    [refresh, remember],
  )

  // 처음 열 때, 연결 조건이 바뀔 때, 20초마다, 창을 다시 볼 때 최신 상태를 받아와요.
  useEffect(() => {
    if (IS_DEMO && !hasTeamCode()) {
      setStatus('needsCode')
      return
    }
    refresh()
    const tick = () => document.visibilityState === 'visible' && refresh()
    const timer = setInterval(tick, POLL_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [refresh, epoch])

  // 팀 코드를 입력받아(데모 사이트) 연결해요. 성공하면 true.
  const connect = useCallback(() => refresh({ prompt: true }), [refresh])

  const apply = useCallback(
    (fn) => {
      setState((s) => {
        const next = fn(s)
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(next))
        } catch {
          // 무시
        }
        return next
      })
    },
    [],
  )

  const createCollection = useCallback(
    (collectionName) => {
      const trimmed = collectionName.trim()
      if (!trimmed) return null
      const id = makeId()
      apply((s) => ({ ...s, collections: [...s.collections, { id, name: trimmed, createdAt: new Date().toISOString(), createdBy: nameRef.current }] }))
      send({ type: 'createCollection', id, name: trimmed })
      return id
    },
    [apply, send],
  )

  const renameCollection = useCallback(
    (id, collectionName) => {
      const trimmed = collectionName.trim()
      if (!trimmed) return
      apply((s) => ({ ...s, collections: s.collections.map((c) => (c.id === id ? { ...c, name: trimmed } : c)) }))
      send({ type: 'renameCollection', id, name: trimmed })
    },
    [apply, send],
  )

  const deleteCollection = useCallback(
    (id) => {
      apply((s) => ({ collections: s.collections.filter((c) => c.id !== id), bookmarks: s.bookmarks.filter((b) => b.collectionId !== id) }))
      send({ type: 'deleteCollection', id })
    },
    [apply, send],
  )

  const moveCollection = useCallback(
    (id, targetId) => {
      apply((s) => {
        const from = s.collections.findIndex((c) => c.id === id)
        const to = s.collections.findIndex((c) => c.id === targetId)
        if (from < 0 || to < 0 || from === to) return s
        const collections = [...s.collections]
        const [item] = collections.splice(from, 1)
        collections.splice(to, 0, item)
        return { ...s, collections }
      })
      send({ type: 'moveCollection', id, targetId })
    },
    [apply, send],
  )

  const moveCollectionBy = useCallback(
    (id, delta) => {
      const list = state.collections
      const from = list.findIndex((c) => c.id === id)
      const target = list[from + delta]
      if (from >= 0 && target) moveCollection(id, target.id)
    },
    [state.collections, moveCollection],
  )

  const toggleBookmark = useCallback(
    (screen, collectionId) => {
      const key = screenKey(screen)
      const exists = state.bookmarks.some((b) => b.key === key && b.collectionId === collectionId)
      if (exists) {
        apply((s) => ({ ...s, bookmarks: s.bookmarks.filter((b) => !(b.key === key && b.collectionId === collectionId)) }))
        send({ type: 'removeBookmark', key, collectionId })
      } else {
        const id = makeId()
        const snap = snapshot(screen)
        apply((s) => ({ ...s, bookmarks: [...s.bookmarks, { id, key, collectionId, savedAt: new Date().toISOString(), savedBy: nameRef.current, note: '', screen: snap }] }))
        send({ type: 'addBookmark', id, key, collectionId, screen: snap })
      }
    },
    [state.bookmarks, apply, send],
  )

  // 메모는 입력할 때마다 보내지 않고, 멈추면 한 번에 보내요.
  const updateNote = useCallback(
    (bookmarkId, note) => {
      apply((s) => ({ ...s, bookmarks: s.bookmarks.map((b) => (b.id === bookmarkId ? { ...b, note, noteBy: nameRef.current } : b)) }))
      clearTimeout(noteTimers.current.get(bookmarkId))
      noteTimers.current.set(
        bookmarkId,
        setTimeout(() => {
          noteTimers.current.delete(bookmarkId)
          send({ type: 'updateNote', bookmarkId, note })
        }, NOTE_DELAY_MS),
      )
    },
    [apply, send],
  )

  const removeBookmark = useCallback(
    (bookmarkId) => {
      apply((s) => ({ ...s, bookmarks: s.bookmarks.filter((b) => b.id !== bookmarkId) }))
      send({ type: 'removeBookmark', bookmarkId })
    },
    [apply, send],
  )

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
    storageError: error,
    storageMode: status === 'ready' ? 'team' : status,
    status,
    isTeam: true,
    refresh,
    connect,
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
