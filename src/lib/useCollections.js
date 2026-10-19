// 북마크·컬렉션을 브라우저 로컬 저장소에 보관해요.
// 이미지 파일은 저장하지 않고 원본 URL과 화면 메타데이터만 남겨요.
import { useCallback, useEffect, useState } from 'react'

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
function snapshot(screen) {
  const { service, domain, pattern, variant, title, dataMonth, screenCount, image, images, uiUrl, source, searchedAt, matchedTexts, components, relevance } =
    screen
  return { service, domain, pattern, variant, title, dataMonth, screenCount, image, images, uiUrl, source, searchedAt, matchedTexts, components, relevance }
}

export function useCollections() {
  const [state, setState] = useState(load)
  const [storageError, setStorageError] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      setStorageError(null)
    } catch (err) {
      setStorageError(err.message)
    }
  }, [state])

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
    createCollection,
    renameCollection,
    deleteCollection,
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
