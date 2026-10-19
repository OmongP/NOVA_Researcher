import { useCallback, useEffect, useMemo, useState } from 'react'
import { sampleScreens } from './data/sampleScreens'
import { interpretQuery, rateRelevance, searchScreens, TIERS } from './lib/searchQuery'
import ScreenCard from './components/ScreenCard'
import ScreenDetail from './components/ScreenDetail'
import SaveDialog from './components/SaveDialog'
import Library from './components/Library'
import DarkPatternInspector from './components/DarkPatternInspector'
import { useCollections } from './lib/useCollections'
import { IS_DEMO } from './lib/demo'
import './App.css'

const DOMAINS = ['전체', '금융', '자동차', '모빌리티']
const SORTS = { relevance: '정확도순', recent: '최신순' }
const DEFAULT_QUERY = '대출한도 화면'
const SUGGESTIONS = ['대출한도 화면', '자동차 시세 조회', '본인인증', '차량 등록', '월 납입금', 'Empty 화면']

const formatTime = (iso) => new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

function AuthBanner({ auth, onRetry }) {
  if (auth.state === 'checking') return <div className="banner">UI Bowl 로그인 상태를 확인하고 있어요…</div>
  if (auth.state === 'connected') return null
  if (auth.state === 'demo') {
    return (
      <div className="banner">
        데모 사이트예요. UI Bowl에서 미리 모아 둔 샘플 화면 {sampleScreens.length}개로 검색해요. 실시간 검색과 AI 검토는 설치 버전에서 쓸 수 있어요.
      </div>
    )
  }
  if (auth.state === 'needsLogin') {
    return (
      <div className="banner banner-warn">
        <span>UI Bowl에 로그인하면 실시간 검색을 쓸 수 있어요. 지금은 샘플 {sampleScreens.length}개 화면만 검색해요.</span>
        <a className="banner-action" href={auth.loginUrl}>
          UI Bowl 로그인
        </a>
      </div>
    )
  }
  return (
    <div className="banner banner-warn">
      <span>검색 서버에 연결하지 못했어요. 샘플 화면만 검색해요. ({auth.error})</span>
      <button type="button" className="banner-action" onClick={onRetry}>
        다시 확인
      </button>
    </div>
  )
}

// "연결됐어요"는 실제 검색 호출이 성공했을 때만 보여줘요.
function SearchStatus({ isLive, query, search, counts, onRetry, onSuggest }) {
  if (!isLive) {
    return query ? <div className="status">샘플 데이터 검색 결과예요 · 실시간 결과가 아니에요</div> : null
  }
  if (!query) return <div className="status">UI Bowl에 로그인돼 있어요 · 검색하면 실시간 결과를 받아와요</div>
  if (search.status === 'loading') {
    return <div className="status status-loading">UI Bowl에서 ‘{query.component ?? query.uibowl}’ 화면을 찾고 있어요…</div>
  }
  if (search.status === 'failed') {
    return (
      <div className="status status-error">
        <span>UI Bowl 검색에 실패했어요: {search.errors.join(' / ')}</span>
        <button type="button" className="banner-action" onClick={onRetry}>
          다시 시도
        </button>
      </div>
    )
  }
  if (search.status === 'idle') return null

  const total = counts.exact + counts.related + counts.low
  return (
    <>
      <div className="status status-ok">
        UI Bowl 실시간 검색 성공 · {formatTime(search.searchedAt)} · {total}개 화면 묶음 (정확히 일치 {counts.exact} · 관련 {counts.related}{' '}
        · 관련성 낮음 {counts.low})
      </div>
      {search.failedCalls > 0 && (
        <div className="status status-error">
          <span>
            검색 {search.calls}건 중 {search.failedCalls}건이 실패해서 결과가 일부만 보여요.
          </span>
          <button type="button" className="banner-action" onClick={onRetry}>
            다시 시도
          </button>
        </div>
      )}
      {total === 0 && query.related.length > 0 && (
        <div className="status">
          <span>UI Bowl에 맞는 화면이 없어요. 이런 검색어는 어때요?</span>
          <span className="status-suggestions">
            {query.related.slice(0, 4).map((term) => (
              <button key={term} type="button" className="suggestion" onClick={() => onSuggest(term)}>
                {term}
              </button>
            ))}
          </span>
        </div>
      )}
    </>
  )
}

function ResultSection({ title, screens, onOpen, isSaved, onSave }) {
  if (screens.length === 0) return null
  return (
    <section className="result-section">
      <h2 className="section-title">
        {title} <span className="section-count">{screens.length}</span>
      </h2>
      <div className="grid">
        {screens.map((s) => (
          <ScreenCard key={s.id} screen={s} onOpen={onOpen} saved={isSaved(s)} onSave={onSave} />
        ))}
      </div>
    </section>
  )
}

export default function App() {
  // 게이트 페이지 없이 첫 화면부터 UI 검색 결과를 보여줘요.
  const [input, setInput] = useState(DEFAULT_QUERY)
  const [query, setQuery] = useState(() => interpretQuery(DEFAULT_QUERY))
  const [domain, setDomain] = useState('전체')
  const [sort, setSort] = useState('relevance')
  const [showLow, setShowLow] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(null)
  const [view, setView] = useState('search')
  const store = useCollections()
  const isSaved = (screen) => store.collectionsOf(screen).length > 0
  const [retryKey, setRetryKey] = useState(0)
  const [auth, setAuth] = useState({ state: 'checking' })
  const [search, setSearch] = useState({ status: 'idle', screens: [], errors: [] })

  const isLive = auth.state === 'connected'

  async function checkAuth() {
    if (IS_DEMO) return setAuth({ state: 'demo' })
    setAuth({ state: 'checking' })
    try {
      const res = await fetch('/api/auth/status')
      const data = await res.json()
      if (data.connected) setAuth({ state: 'connected' })
      else if (data.loginUrl) setAuth({ state: 'needsLogin', loginUrl: data.loginUrl })
      else setAuth({ state: 'error', error: data.error ?? '알 수 없는 오류' })
    } catch {
      setAuth({ state: 'error', error: 'npm run dev로 검색 서버를 함께 실행해 주세요' })
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (!isLive || !query) return
    let cancelled = false
    setSearch((prev) => ({ ...prev, status: 'loading', errors: [] }))
    fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query.raw, domain }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (cancelled) return
        if (data.loginUrl) {
          setAuth({ state: 'needsLogin', loginUrl: data.loginUrl })
          return
        }
        if (!res.ok || (data.calls > 0 && data.failedCalls === data.calls)) {
          setSearch({ status: 'failed', screens: [], errors: data.errors?.length ? data.errors : [data.error ?? `HTTP ${res.status}`] })
          return
        }
        const screens = data.screens.map((s) => ({ ...s, searchedAt: data.searchedAt }))
        setSearch({
          status: 'success',
          screens,
          errors: data.errors,
          calls: data.calls,
          failedCalls: data.failedCalls,
          searchedAt: data.searchedAt,
        })
      })
      .catch((err) => !cancelled && setSearch({ status: 'failed', screens: [], errors: [err.message] }))
    return () => {
      cancelled = true
    }
  }, [isLive, query, domain, retryKey])

  const rawResults = useMemo(
    () => (isLive && query ? search.screens : searchScreens(sampleScreens, query, domain)),
    [isLive, query, domain, search.screens],
  )

  const grouped = useMemo(() => {
    const rated = rawResults.map((s) => ({ ...s, relevance: rateRelevance(s, query) }))
    rated.sort((a, b) =>
      sort === 'recent'
        ? (b.dataMonth ?? '').localeCompare(a.dataMonth ?? '')
        : TIERS[a.relevance.tier].rank - TIERS[b.relevance.tier].rank || (b.dataMonth ?? '').localeCompare(a.dataMonth ?? ''),
    )
    return {
      exact: rated.filter((s) => s.relevance.tier === 'exact'),
      related: rated.filter((s) => s.relevance.tier === 'related'),
      low: rated.filter((s) => s.relevance.tier === 'low'),
    }
  }, [rawResults, query, sort])

  const counts = { exact: grouped.exact.length, related: grouped.related.length, low: grouped.low.length }
  const closeDetail = useCallback(() => setSelected(null), [])
  const closeSave = useCallback(() => setSaving(null), [])
  const sectionProps = { onOpen: setSelected, isSaved, onSave: setSaving }

  function runSearch(text) {
    setInput(text)
    setShowLow(false)
    setQuery(interpretQuery(text))
  }

  const loading = search.status === 'loading'
  const visible = counts.exact + counts.related

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <button
            type="button"
            className="brand"
            onClick={() => {
              setView('search')
              runSearch(DEFAULT_QUERY)
            }}
          >
            <img className="brand-mark" src="/icon-180.png" alt="" aria-hidden="true" />
            <span className="brand-name">
              NOVA <span className="brand-sub">Researcher</span>
            </span>
            <span className="version">v0.3</span>
          </button>
          <nav className="views" aria-label="화면 전환">
            <button type="button" className={`view-tab ${view === 'search' ? 'is-active' : ''}`} onClick={() => setView('search')}>
              검색
            </button>
            <button type="button" className={`view-tab ${view === 'library' ? 'is-active' : ''}`} onClick={() => setView('library')}>
              보관함 <span className="library-count">{store.bookmarks.length}</span>
            </button>
            <button type="button" className={`view-tab ${view === 'dark' ? 'is-active' : ''}`} onClick={() => setView('dark')}>
              다크패턴 검토
            </button>
          </nav>
        </div>
      </header>

      <div className="page">
        {view === 'library' && <Library store={store} onOpen={setSelected} onSave={setSaving} />}

        {/* 탭을 옮겨도 검토 중인 내용이 사라지지 않도록 항상 마운트해 두고 숨겨요 */}
        <div hidden={view !== 'dark'}>
          <DarkPatternInspector isLive={isLive} loginUrl={auth.loginUrl} />
        </div>

        {view === 'search' && (
          <>
            <section className="hero">
              <form
                className="search"
                onSubmit={(e) => {
                  e.preventDefault()
                  runSearch(input)
                }}
              >
                <input
                  className="search-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="대출한도 화면을 찾아줘"
                  aria-label="화면 검색"
                />
                <button className="search-button" type="submit">
                  검색
                </button>
              </form>

              <div className="suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="suggestion" onClick={() => runSearch(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </section>

            <AuthBanner auth={auth} onRetry={checkAuth} />

            {query && (
              <>
                <div className="toolbar">
                  <div className="filters" role="tablist" aria-label="서비스 분야">
                    {DOMAINS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        role="tab"
                        aria-selected={domain === d}
                        className={`filter ${domain === d ? 'is-active' : ''}`}
                        onClick={() => setDomain(d)}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <div className="sorts" aria-label="정렬">
                    {Object.entries(SORTS).map(([key, label]) => (
                      <button key={key} type="button" className={`sort ${sort === key ? 'is-active' : ''}`} onClick={() => setSort(key)}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {query && (
                  <div className="intent">
                    <strong>검색 의도</strong> {query.core}
                    {query.related.length > 0 && <span className="intent-related"> · 확장 검색어: {query.related.join(', ')}</span>}
                  </div>
                )}

                <SearchStatus
                  isLive={isLive}
                  query={query}
                  search={search}
                  counts={counts}
                  onRetry={() => setRetryKey((k) => k + 1)}
                  onSuggest={runSearch}
                />

                <div className={loading ? 'results is-loading' : 'results'}>
                  {sort === 'recent' ? (
                    <ResultSection
                      title="최신순 · 정확히 일치 + 관련 화면"
                      screens={[...grouped.exact, ...grouped.related].sort((a, b) => (b.dataMonth ?? '').localeCompare(a.dataMonth ?? ''))}
                      {...sectionProps}
                    />
                  ) : (
                    <>
                      <ResultSection title={TIERS.exact.label} screens={grouped.exact} {...sectionProps} />
                      <ResultSection title={TIERS.related.label} screens={grouped.related} {...sectionProps} />
                    </>
                  )}

                  {counts.low > 0 && (
                    <div className="low-toggle">
                      <button type="button" className="button" onClick={() => setShowLow((v) => !v)}>
                        관련성 낮은 화면 {counts.low}개 {showLow ? '숨기기' : '보기'}
                      </button>
                    </div>
                  )}
                  {showLow && <ResultSection title={TIERS.low.label} screens={grouped.low} {...sectionProps} />}

                  {query && visible === 0 && counts.low === 0 && !loading && search.status !== 'failed' && !isLive && (
                    <div className="empty">
                      <p className="empty-title">샘플 데이터에 맞는 화면이 없어요</p>
                      <p className="empty-desc">UI Bowl에 로그인하면 실시간으로 더 많은 화면을 찾아요.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {selected && <ScreenDetail screen={selected} onClose={closeDetail} saved={isSaved(selected)} onSave={setSaving} />}
        {saving && <SaveDialog screen={saving} store={store} onClose={closeSave} />}
      </div>
    </>
  )
}
