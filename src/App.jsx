import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import { sampleScreens } from './data/sampleScreens'
import { interpretQuery, rateRelevance, searchScreens, squash, TIERS } from './lib/searchQuery'
import ScreenCard from './components/ScreenCard'
import ScreenDetail from './components/ScreenDetail'
import SaveDialog from './components/SaveDialog'
import Library from './components/Library'
import ArchiveBar from './components/ArchiveBar'
import NameDialog from './components/NameDialog'
import { useCollections } from './lib/useCollections'
import PageHeader from './components/PageHeader'
import { IS_LITE, SHOW_AI_REVIEW, SHOW_INSPECT } from './lib/features'
import { EMPTY_FILTERS, applyFilters, enrich, hasActiveFilter } from './lib/benchmark'
import ScreenAnalyzer from './components/ScreenAnalyzer'
import BenchmarkFilters, { FilterButton, FilterChips, useFilterGroups } from './components/BenchmarkFilters'
import { useName } from './lib/identity'
import { useTeamLibrary } from './lib/useTeamLibrary'
import { IS_DEMO } from './lib/demo'
import { readJson } from './lib/http'
import './App.css'

const DOMAINS = ['전체', '금융', '자동차', '모빌리티']
const SORTS = { relevance: '관련도순', recent: '최신순' } // 최신순 기준은 UI Bowl 수집월이에요(원본 앱 게시일이 아니에요)
// Inspect(다크패턴 검토)는 필요할 때만 불러와요. Light 빌드에서는 이 코드와 사내 가이드 데이터가 번들에 아예 들어가지 않아요.
// (조건을 import.meta.env로 직접 써야 번들러가 빌드할 때 통째로 걷어내요)
const DarkPatternInspector = import.meta.env.VITE_LITE === '1' ? null : lazy(() => import('./components/DarkPatternInspector'))

const DEFAULT_QUERY = IS_LITE ? '' : '한도 조회'
const PAGE = 24 // Light: 검색어 없이 둘러볼 때 한 번에 보여주는 화면 수
const SUGGESTIONS = ['한도 조회', '약관 동의', '견적 비교', '내 차 팔기', '명세서', '해지', '리스', '챗봇']

const formatTime = (iso) => new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

function AuthBanner({ auth, onRetry }) {
  if (auth.state === 'checking') return <div className="banner">UI Bowl 로그인 상태를 확인하고 있어요…</div>
  if (auth.state === 'connected') {
    // 데모 사이트라도 서버(Cloudflare Function)가 UI Bowl에 연결돼 있으면 실시간으로 검색해요.
    // Light: 연결 상태는 평소에 알리지 않아요. 문제가 있을 때만 배너로 알려요.
    if (IS_LITE) return null
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
function SearchStatus({ lite, isLive, query, search, counts, onRetry, onSuggest }) {
  if (lite && (!isLive || !query || search.status === 'loading' || search.status === 'idle')) return null // Light: 정상 상태는 알리지 않고, 결과 수는 결과 위에 따로 보여줘요
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
  // 검색 시각·호출 수 같은 기술 정보는 화면 대신 개발자 콘솔에 남겨요.
  if (lite) console.debug('[UX Lens] UI Bowl 검색', { calls: search.calls, failedCalls: search.failedCalls, searchedAt: search.searchedAt, counts })
  return (
    <>
      {!lite && <div className="status status-ok">
        UI Bowl 실시간 검색 성공 · {formatTime(search.searchedAt)} · {total}개 화면 묶음 (정확히 일치 {counts.exact} · 관련 {counts.related}{' '}
        · 관련성 낮음 {counts.low})
      </div>}
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
      {title && (
        <h2 className="section-title">
          {title} <span className="section-count">{screens.length}</span>
        </h2>
      )}
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
  const [sort, setSort] = useState(DEFAULT_QUERY ? 'relevance' : 'recent')
  const [showLow, setShowLow] = useState(false)
  const [bmFilters, setBmFilters] = useState(EMPTY_FILTERS) // Light: 기업·과업·화면 유형·UI 패턴 필터
  const [limit, setLimit] = useState(PAGE)
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
    if (IS_LITE) document.title = 'UX Lens Light'
    if (IS_LITE) document.querySelector('meta[name="description"]')?.setAttribute('content', 'UX Lens Light — 자동차금융 UX 벤치마킹. 실제 서비스 화면을 사용자 과업 기준으로 탐색해요.')
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

  // Light: 모든 화면에 벤치마킹 분류(bm)를 붙이고, 필터를 적용해요.
  const enriched = useMemo(() => (IS_LITE ? rawResults.map(enrich) : rawResults), [rawResults])
  const filtered = useMemo(() => (IS_LITE ? applyFilters(enriched, bmFilters) : enriched), [enriched, bmFilters])
  const browsing = IS_LITE && !query // 검색어 없이 벤치마킹 DB를 둘러보는 중

  const grouped = useMemo(() => {
    const rated = filtered.map((s) => ({ ...s, relevance: rateRelevance(s, query) }))
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
  }, [filtered, query, sort])

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
    setLimit(PAGE)
    const next = interpretQuery(text)
    setSort(next ? 'relevance' : 'recent') // 검색어가 있으면 관련도순, 없으면 최신순이 기본이에요
    setQuery(next)
  }

  const loading = search.status === 'loading'
  const visible = counts.exact + counts.related
  const total = visible + counts.low // 필터까지 적용한 뒤 실제로 보여줄 수 있는 화면 묶음 수
  // 화면 위에 보여주는 결과 수: 관련성 낮은 화면은 펼쳤을 때만 포함해요.
  const resultCount = browsing ? total : visible + (showLow ? counts.low : 0)
  const [showFilters, setShowFilters] = useState(false)
  const fg = useFilterGroups(enriched, bmFilters)
  const changeFilters = (f) => {
    setBmFilters(f)
    setLimit(PAGE)
  }

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
            <span className="brand-slogan">{IS_LITE ? '자동차금융 UX 벤치마킹' : 'Explore UI. Inspect UX.'}</span>
            <span className="version">{IS_LITE ? 'v1.0 Light' : 'v1.0'}</span>
          </button>
          <nav className="views" aria-label="화면 전환">
            <button type="button" className={`view-tab ${view === 'search' ? 'is-active' : ''}`} onClick={() => setView('search')}>
              Explore
            </button>
            {IS_LITE && (
              <button type="button" className={`view-tab ${view === 'analyze' ? 'is-active' : ''}`} onClick={() => setView('analyze')}>
                Analyze
              </button>
            )}
            <button type="button" className={`view-tab ${view === 'library' ? 'is-active' : ''}`} onClick={() => withName(() => setView('library'))}>
              Archive <span className="library-count">{store.bookmarks.length}</span>
            </button>
            {SHOW_INSPECT && (
              <button type="button" className={`view-tab ${view === 'dark' ? 'is-active' : ''}`} onClick={() => setView('dark')}>
                Inspect
              </button>
            )}
          </nav>
        </div>
      </header>

      <div className="page">
        {IS_LITE && view === 'analyze' && (
          <>
            <PageHeader title="Analyze" sub="화면 이미지를 AI로 분석해 과업·화면 유형·UI 패턴 태그 만들기" />
            <ScreenAnalyzer />
          </>
        )}

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
        {SHOW_INSPECT && (
          <div hidden={view !== 'dark'}>
            <Suspense fallback={null}>
              <DarkPatternInspector isLive={isLive} loginUrl={auth.loginUrl} />
            </Suspense>
          </div>
        )}

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
                  placeholder={IS_LITE ? '예: 한도 조회, 약관 동의 같은 자동차금융 화면을 찾아보세요' : '대출한도 화면을 찾아줘'}
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

            {(query || IS_LITE) && (
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
                  {!IS_LITE && (
                    <div className="toolbar-right">
                      <div className="sorts" aria-label="정렬" title="최신순은 UI Bowl 수집월 기준이에요">
                        {Object.entries(SORTS).map(([key, label]) => (
                          <button key={key} type="button" className={`sort ${sort === key ? 'is-active' : ''}`} onClick={() => setSort(key)}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {IS_LITE && (
                  <>
                    <div className="result-bar">
                      <p className="result-summary">{loading ? '검색 중…' : <>검색 결과 <strong>{resultCount}개</strong></>}</p>
                      <div className="toolbar-right">
                        <FilterButton fg={fg} open={showFilters} onToggle={() => setShowFilters((v) => !v)} />
                        {/* 결과가 1개 이하이거나 검색어 없이 둘러볼 때는 정렬을 고를 의미가 없어서 숨겨요 */}
                        {!browsing && resultCount > 1 && (
                          <div className="sorts" aria-label="정렬" title="최신순은 UI Bowl 수집월 기준이에요">
                            {Object.entries(SORTS).map(([key, label]) => (
                              <button key={key} type="button" className={`sort ${sort === key ? 'is-active' : ''}`} onClick={() => setSort(key)}>
                                {label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {showFilters && <BenchmarkFilters fg={fg} filters={bmFilters} onChange={changeFilters} />}
                    <FilterChips filters={bmFilters} onChange={changeFilters} />
                  </>
                )}

                {query && !IS_LITE && (
                  <div className="intent">
                    <strong>검색 의도</strong>{' '}
                    {squash(query.raw) === squash(query.core) ? query.core : `‘${query.raw}’ → ${query.core} 관련 화면으로 넓혀 찾아요`}
                    {query.related.length > 0 && <span className="intent-related"> · 확장 검색어: {query.related.join(', ')}</span>}
                  </div>
                )}

                {!browsing && (
                <SearchStatus
                  lite={IS_LITE}
                  isLive={isLive}
                  query={query}
                  search={search}
                  counts={counts}
                  onRetry={() => setRetryKey((k) => k + 1)}
                  onSuggest={runSearch}
                />
                )}

                <div className={loading ? 'results is-loading' : 'results'}>
                  {browsing ? (
                    <>
                      <ResultSection
                        title=""
                        screens={[...grouped.exact, ...grouped.related, ...grouped.low].sort((a, b) => (b.dataMonth ?? '').localeCompare(a.dataMonth ?? '')).slice(0, limit)}
                        {...sectionProps}
                      />
                      {visible + counts.low > limit && (
                        <div className="bm-more-wrap">
                          <button type="button" className="button" onClick={() => setLimit((n) => n + PAGE)}>
                            더 보기 ({Math.min(limit, visible + counts.low)} / {visible + counts.low})
                          </button>
                        </div>
                      )}
                    </>
                  ) : sort === 'recent' ? (
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

                  {!browsing && counts.low > 0 && (
                    <div className="low-toggle">
                      <button type="button" className="button" onClick={() => setShowLow((v) => !v)}>
                        관련성 낮은 화면 {counts.low}개 {showLow ? '숨기기' : '보기'}
                      </button>
                    </div>
                  )}
                  {!browsing && showLow && <ResultSection title={TIERS.low.label} screens={grouped.low} {...sectionProps} />}

                  {IS_LITE && total === 0 && !loading && search.status !== 'failed' && (
                    <div className="empty">
                      <p className="empty-title">
                        {enriched.length === 0 && !hasActiveFilter(bmFilters)
                          ? query
                            ? `‘${query.core}’에 맞는 화면을 찾지 못했어요`
                            : '저장된 화면이 아직 없어요'
                          : '선택한 조건에 맞는 화면이 없어요'}
                      </p>
                      <p className="empty-desc">
                        {hasActiveFilter(bmFilters)
                          ? `필터를 적용하기 전에는 ${enriched.length}개 화면이 있어요. 조건을 줄이거나 초기화해 보세요.`
                          : '수집된 실제 화면이 없다는 뜻이에요. 비슷한 화면을 만들어 보여주지 않아요.'}
                        {hasActiveFilter(bmFilters) && (
                          <>
                            {' '}
                            <button type="button" className="link-button" onClick={() => setBmFilters(EMPTY_FILTERS)}>
                              필터 초기화
                            </button>
                          </>
                        )}
                        {!hasActiveFilter(bmFilters) && domain !== '전체' && (
                          <>
                            {' '}
                            <button type="button" className="link-button" onClick={() => setDomain('전체')}>
                              전체 분야 보기
                            </button>
                          </>
                        )}
                      </p>
                    </div>
                  )}
                  {!IS_LITE && query && visible === 0 && counts.low === 0 && !loading && search.status !== 'failed' && !isLive && (
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
