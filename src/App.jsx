import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { sampleScreens } from './data/sampleScreens'
import { interpretQuery, rateRelevance, searchScreens, TIERS } from './lib/searchQuery'
import ScreenCard from './components/ScreenCard'
import ScreenDetail from './components/ScreenDetail'
import SaveDialog from './components/SaveDialog'
import Library from './components/Library'
import ArchiveBar from './components/ArchiveBar'
import NameDialog from './components/NameDialog'
import DarkPatternInspector from './components/DarkPatternInspector'
import { useCollections } from './lib/useCollections'
import PageHeader from './components/PageHeader'
import { SHOW_AI_REVIEW } from './lib/features'
import { useName } from './lib/identity'
import { useTeamLibrary } from './lib/useTeamLibrary'
import { IS_DEMO } from './lib/demo'
import { readJson } from './lib/http'
import './App.css'

const DOMAINS = ['전체', '금융', '자동차', '모빌리티']
const SORTS = { relevance: '정확도순', recent: '최신순' }
const DEFAULT_QUERY = '한도 조회'
const SUGGESTIONS = ['한도 조회', '약관 동의', '견적 비교', '내 차 팔기', '명세서', '해지', '리스', '챗봇']

const formatTime = (iso) => new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

function AuthBanner({ auth, onRetry }) {
  if (auth.state === 'checking') return <div className="banner">UI Bowl 로그인 상태를 확인하고 있어요…</div>
  if (auth.state === 'connected') {
    // 데모 사이트라도 서버(Cloudflare Function)가 UI Bowl에 연결돼 있으면 실시간으로 검색해요.
    return IS_DEMO ? <div className="banner">UI Bowl에 실시간으로 연결돼 있어요.{SHOW_AI_REVIEW && ' AI 다크패턴 사전 검토는 서버 PC가 연결돼 있을 때만 실제로 분석하고, 아니면 샘플 결과로 보여줘요.'}</div> : null
  }
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
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const [view, setView] = useState('search')
  const [name, setName] = useName()
  const [epoch, setEpoch] = useState(0) // 팀 코드를 새로 입력하는 등 서버 연결 조건이 바뀌면 올려서 보관함을 다시 맞춰요
  const store = useCollections(name, epoch)
  const team = useTeamLibrary(name, epoch)
  const [archiveScope, setArchiveScope] = useState('mine')
  const [askName, setAskName] = useState(null) // 이름 입력창: { next } 이름을 입력한 뒤(또는 건너뛴 뒤) 이어서 할 일
  const nameAsked = useRef(false)
  const isSaved = (screen) => store.collectionsOf(screen).length > 0 || team.collectionsOf(screen).length > 0

  // 이름이 없으면 한 번만 물어본 뒤 하려던 일을 이어서 해요.
  const withName = useCallback(
    (next) => {
      if (name || nameAsked.current) return next()
      nameAsked.current = true
      setAskName({ next })
    },
    [name],
  )
  const openSave = useCallback((screen) => withName(() => setSaving(screen)), [withName])
  const connectTeam = useCallback(async () => {
    if (await team.connect()) setEpoch((e) => e + 1)
  }, [team])
  const [retryKey, setRetryKey] = useState(0)
  const [auth, setAuth] = useState({ state: 'checking' })
  const [search, setSearch] = useState({ status: 'idle', screens: [], errors: [] })

  const isLive = auth.state === 'connected'

  async function checkAuth() {
    if (IS_DEMO) {
      // 우선 샘플 데이터로 보여주고, 실시간 검색 API(Cloudflare Function)가 연결돼 있으면 바꿔요.
      setAuth({ state: 'demo' })
      try {
        const data = await readJson(await fetch('/api/auth/status'))
        if (data.connected) setAuth({ state: 'connected' })
      } catch {
        // 실시간 연결이 없으면 샘플 데이터로 계속해요.
      }
      return
    }
    setAuth({ state: 'checking' })
    try {
      const res = await fetch('/api/auth/status')
      const data = await readJson(res)
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
        const data = await readJson(res)
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
  // 저장 대화상자를 닫을 때 바뀐 내용이 있으면 화면 아래에 잠깐 알려줘요.
  const closeSave = useCallback((summary) => {
    setSaving(null)
    if (typeof summary !== 'string') return
    setToast(summary)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])
  const sectionProps = { onOpen: setSelected, isSaved, onSave: openSave }

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
            <span className="brand-name">UX Lens</span>
            <span className="brand-slogan">Explore UI. Inspect UX.</span>
            <span className="version">v1.0</span>
          </button>
          <nav className="views" aria-label="화면 전환">
            <button type="button" className={`view-tab ${view === 'search' ? 'is-active' : ''}`} onClick={() => setView('search')}>
              Explore
            </button>
            <button type="button" className={`view-tab ${view === 'library' ? 'is-active' : ''}`} onClick={() => withName(() => setView('library'))}>
              Archive <span className="library-count">{store.bookmarks.length}</span>
            </button>
            <button type="button" className={`view-tab ${view === 'dark' ? 'is-active' : ''}`} onClick={() => setView('dark')}>
              Inspect
            </button>
          </nav>
        </div>
      </header>

      <div className="page">
        {view === 'library' && (
          <>
            <PageHeader title="Archive" sub="리서치 자료 및 검토 이력 보관·관리" />
            <ArchiveBar
              scope={archiveScope}
              onScope={setArchiveScope}
              name={name}
              onChangeName={() => setAskName({ next: () => {}, change: true })}
              team={team}
              mineCount={store.bookmarks.length}
              onConnect={connectTeam}
            />
            <Library key={archiveScope} store={archiveScope === 'team' ? team : store} onOpen={setSelected} onSave={openSave} showSavedBy={archiveScope === 'team'} />
          </>
        )}

        {/* 탭을 옮겨도 검토 중인 내용이 사라지지 않도록 항상 마운트해 두고 숨겨요 */}
        <div hidden={view !== 'dark'}>
          <DarkPatternInspector isLive={isLive} loginUrl={auth.loginUrl} />
        </div>

        {view === 'search' && (
          <>
            <PageHeader title="Explore" sub="타사 UI 레퍼런스 탐색 및 수집" />
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
                <span className="suggestions-label">추천검색어 :</span>
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

        {selected && <ScreenDetail screen={selected} onClose={closeDetail} saved={isSaved(selected)} onSave={openSave} />}
        {saving && <SaveDialog screen={saving} store={store} team={team} name={name} onClose={closeSave} />}
        {askName && (
          <NameDialog
            initial={askName.change ? name : ''}
            onClose={() => {
              const { next } = askName
              setAskName(null)
              next()
            }}
            onSubmit={(value) => {
              const { next } = askName
              setName(value)
              setAskName(null)
              next()
            }}
          />
        )}
        <div className="toast-region" role="status" aria-live="polite">
          {toast && (
            <div className="toast" key={toast}>
              ✓ {toast}
              <button type="button" className="toast-action" onClick={() => setView('library')}>
                Archive 보기
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
