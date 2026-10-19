import { useCallback, useState } from 'react'
import { FALSE_POSITIVES, FRAMEWORK, GUIDE, OVERLAPS, RULES, TYPES, VERDICTS, ruleById } from '../data/darkPatternRules'
import { reviewKey, reviewsToMarkdown, useReviews } from '../lib/useReviews'
import PageHeader from './PageHeader'
import ReviewPanel from './ReviewPanel'
import AiReview from './AiReview'
import { REGULATION, regulationOf } from '../data/regulationGuideline'
import { IS_DEMO } from '../lib/demo'
import { readJson } from '../lib/http'

// 자연어 요청("현재 100명이 신청 중 UI 검토해줘")을 가장 가까운 규칙에 연결해요.
function matchRules(text) {
  const q = text.replace(/\s+/g, '')
  if (!q) return []
  const tokens = text.split(/\s+/).filter((t) => t.length >= 2)
  return RULES.map((rule) => {
    let score = 0
    for (const t of rule.triggers) if (q.includes(t.replace(/\s+/g, ''))) score += 3
    if (q.includes(rule.name.replace(/\s+/g, ''))) score += 5
    for (const t of tokens) {
      if (rule.name.includes(t)) score += 2
      if (rule.example.includes(t) || rule.definition.includes(t)) score += 1
    }
    return { rule, score }
  })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

function CandidateCard({ screen, review, onOpen }) {
  return (
    <article className="card">
      <button type="button" className="card-thumb" onClick={() => onOpen(screen)} aria-label={`${screen.service} 검토하기`}>
        {screen.image ? <img src={screen.image} alt="" loading="lazy" /> : <span className="card-thumb-missing">이미지 미확보</span>}
      </button>
      <div className="card-body">
        <div className="card-meta">
          {review?.verdict ? (
            <span className={`chip verdict-chip-${review.verdict}`}>{VERDICTS[review.verdict].label}</span>
          ) : (
            <span className="chip chip-tier-low">미검토</span>
          )}
        </div>
        <h3 className="card-service">{screen.service}</h3>
        <p className="card-title">{screen.title}</p>
        <p className="card-pattern">
          {screen.pattern} · {screen.screenCount}장
        </p>
        <p className="card-reason">
          {screen.triggerHits?.length > 0 ? `검색 단서 일치: ‘${screen.triggerHits.join('’, ‘')}’` : '검색 단서 문구는 확인되지 않았어요'}
        </p>
        <div className="card-footer">
          <span>UI Bowl · 수집월 {screen.dataMonth}</span>
          <button type="button" className="link-button" onClick={() => onOpen(screen)}>
            검토하기
          </button>
        </div>
      </div>
    </article>
  )
}

// 금융위·금감원 가이드라인 원문(src/data/regulationGuideline.js)을 세부 유형별로 보여줘요.
function RegulationText({ reg }) {
  const list = (items) => (
    <ul className="rule-list">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  )
  return (
    <details className="regulation">
      <summary>
        {REGULATION.issuer} 가이드라인 ({REGULATION.date}) {reg.page}쪽 · {reg.name}
      </summary>
      <p>
        <strong>정의</strong> {reg.definition}
      </p>
      {reg.points?.length > 0 && list(reg.points)}
      {reg.examples?.length > 0 && (
        <>
          <p className="regulation-label">원문 예시</p>
          {list(reg.examples)}
        </>
      )}
      {reg.duties?.length > 0 && (
        <>
          <p className="regulation-label">사업자 준수사항</p>
          {list(reg.duties)}
        </>
      )}
      {reg.exceptions?.length > 0 && (
        <>
          <p className="regulation-label">원문이 인정하는 예외</p>
          {list(reg.exceptions)}
        </>
      )}
      {reg.combine && <p className="card-reason">결합 시 유의: {reg.combine}</p>}
      {reg.related?.length > 0 && (
        <>
          <p className="regulation-label">함께 적용될 수 있는 법령·가이드라인</p>
          {list(reg.related)}
        </>
      )}
      {reg.classification && <p className="card-reason">{reg.classification}</p>}
    </details>
  )
}

export default function DarkPatternInspector({ isLive, loginUrl }) {
  const [mode, setMode] = useState('cases')
  const [ruleId, setRuleId] = useState(RULES[0].id)
  const [ask, setAsk] = useState('')
  const [matches, setMatches] = useState(null)
  const [result, setResult] = useState({ status: 'idle', screens: [], errors: [] })
  const [reviewing, setReviewing] = useState(null)
  const [copied, setCopied] = useState(false)
  const { reviews, saveReview, removeReview } = useReviews()

  const rule = ruleById(ruleId)
  const reviewedCount = Object.keys(reviews).length
  const closeReview = useCallback(() => setReviewing(null), [])

  function selectRule(id) {
    setRuleId(id)
    setResult({ status: 'idle', screens: [], errors: [] })
  }

  async function findCases() {
    setResult({ status: 'loading', screens: [], errors: [] })
    try {
      const res = await fetch('/api/dark/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ruleId }) })
      const data = await readJson(res)
      if (!res.ok || (data.calls > 0 && data.failedCalls === data.calls)) {
        setResult({ status: 'failed', screens: [], errors: data.errors?.length ? data.errors : [data.error ?? `HTTP ${res.status}`] })
        return
      }
      const screens = [...data.screens].sort((a, b) => b.triggerHits.length - a.triggerHits.length)
      setResult({ status: 'success', screens, errors: data.errors, searchedAt: data.searchedAt, failedCalls: data.failedCalls, calls: data.calls })
    } catch (err) {
      setResult({ status: 'failed', screens: [], errors: [err.message] })
    }
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(reviewsToMarkdown(reviews))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="inspector">
      <section className="inspector-intro">
        <PageHeader title="Inspect" sub="다크패턴 위험 요소 검토 및 UX 개선 가이드">
          <p className="page-guide">
            {GUIDE.title} {GUIDE.version} 기준으로 사례를 찾고 검토해요.{GUIDE.credit && ` (${GUIDE.credit})`}
          </p>
        </PageHeader>
        <details className="regulation regulation-intro">
          <summary>
            금융당국 원문: {REGULATION.title} ({REGULATION.issuer}, {REGULATION.date})
          </summary>
          <p>{REGULATION.purpose}</p>
          <p className="regulation-label">일반원칙</p>
          <ul className="rule-list">
            {REGULATION.generalPrinciples.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="regulation-label">취약 소비자상 전제</p>
          <p>{REGULATION.consumerModel}</p>
          <p className="regulation-label">적용 대상</p>
          <ul className="rule-list">
            {REGULATION.scope.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="regulation-label">함께 적용되는 법령·가이드라인</p>
          <ul className="rule-list">
            {REGULATION.relatedLaws.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="card-reason">{REGULATION.relation}</p>
        </details>
        <p className="inspector-principle">
          이 도구는 다크패턴 여부를 확정하지 않아요. 판단기준과 예외를 근거로 검토를 돕고, 결과는 검토자가 정해요. {GUIDE.principle}
        </p>
        <ol className="framework">
          {FRAMEWORK.map((f) => (
            <li key={f.key} title={f.check}>
              <span className="framework-step">{f.step}</span> {f.key}
              <span className="framework-q">{f.question}</span>
            </li>
          ))}
        </ol>
        <div className="filters" role="tablist" aria-label="검토 방식">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'cases'}
            className={`filter ${mode === 'cases' ? 'is-active' : ''}`}
            onClick={() => setMode('cases')}
          >
            가이드 기준 사례 찾기
          </button>
          <button type="button" role="tab" aria-selected={mode === 'ai'} className={`filter ${mode === 'ai' ? 'is-active' : ''}`} onClick={() => setMode('ai')}>
            내 UI 검토하기 · AI 1차
          </button>
        </div>
      </section>

      <div hidden={mode !== 'ai'}>
        <AiReview />
      </div>

      {mode === 'cases' && (
        <>
          <form
            className="search"
            onSubmit={(e) => {
              e.preventDefault()
              const m = matchRules(ask)
              setMatches(m)
              if (m[0]) selectRule(m[0].rule.id)
            }}
          >
            <input
              className="search-input"
              value={ask}
              onChange={(e) => setAsk(e.target.value)}
              placeholder="예: 현재 100명이 신청 중 UI, 해지 버튼 찾기 어려운 화면, 마케팅 기본 체크"
              aria-label="검토할 UI 설명"
            />
            <button className="search-button" type="submit">
              규칙 찾기
            </button>
          </form>
          {matches && (
            <div className="status inspector-matches">
              {matches.length > 0 ? (
                <span>
                  가까운 규칙:{' '}
                  {matches.map((m) => (
                    <button
                      key={m.rule.id}
                      type="button"
                      className={`suggestion ${m.rule.id === ruleId ? 'is-active' : ''}`}
                      onClick={() => selectRule(m.rule.id)}
                    >
                      {m.rule.type} · {m.rule.name}
                    </button>
                  ))}
                </span>
              ) : (
                <span>맞는 규칙을 찾지 못했어요. 왼쪽 목록에서 직접 골라 주세요.</span>
              )}
            </div>
          )}

          <div className="library">
            <nav className="library-nav" aria-label="다크패턴 규칙">
              {Object.keys(TYPES).map((type) => (
                <div key={type} className="rule-group">
                  <p className="rule-group-title" title={TYPES[type]}>
                    {type}
                  </p>
                  {RULES.filter((r) => r.type === type).map((r) => (
                    <button key={r.id} type="button" className={`library-item ${r.id === ruleId ? 'is-active' : ''}`} onClick={() => selectRule(r.id)}>
                      <span>{r.name}</span>
                      <span className="library-count">{r.id}</span>
                    </button>
                  ))}
                </div>
              ))}
            </nav>

            <div className="library-main">
              <article className="rule-card">
                <span className="chip chip-tier-related">
                  {rule.id} · {rule.type} · {rule.framework}
                </span>
                <h2 className="detail-title">{rule.name}</h2>
                <p>{rule.definition}</p>
                <dl className="detail-meta">
                  {rule.keyQuestion && (
                    <>
                      <dt>핵심 질문</dt>
                      <dd>{rule.keyQuestion}</dd>
                    </>
                  )}
                  <dt>판단기준</dt>
                  <dd>
                    <ul className="rule-list">
                      {rule.questions.map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                  </dd>
                  {rule.extraQuestions?.length > 0 && (
                    <>
                      <dt>보강 문항</dt>
                      <dd>
                        <ul className="rule-list">
                          {rule.extraQuestions.map((e) => (
                            <li key={e.q}>
                              {e.q} <small>({e.source})</small>
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </>
                  )}
                  <dt>사례</dt>
                  <dd>{rule.example}</dd>
                  <dt>개선</dt>
                  <dd>{rule.improvement}</dd>
                  {rule.exceptions.length > 0 && (
                    <>
                      <dt>예외</dt>
                      <dd>
                        <ul className="rule-list">
                          {rule.exceptions.map((ex) => (
                            <li key={ex}>{ex}</li>
                          ))}
                        </ul>
                      </dd>
                    </>
                  )}
                  {rule.cases?.length > 0 && (
                    <>
                      <dt>정탐 사례</dt>
                      <dd>
                        <ul className="rule-list">
                          {rule.cases.map((c) => (
                            <li key={c.title}>
                              <strong>{c.title}</strong> <small>({c.frame})</small>
                              <br />
                              {c.summary}
                              {c.improvement && (
                                <>
                                  <br />
                                  <em>개선: {c.improvement}</em>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </>
                  )}
                  {rule.applyGuide && (
                    <>
                      <dt>적용 가이드</dt>
                      <dd>
                        <strong>{rule.applyGuide.title}</strong> <small>({rule.applyGuide.frame})</small>
                        <br />
                        {rule.applyGuide.summary}
                        {rule.applyGuide.improvements?.length > 0 && (
                          <ul className="rule-list">
                            {rule.applyGuide.improvements.map((i) => (
                              <li key={i}>{i}</li>
                            ))}
                          </ul>
                        )}
                      </dd>
                    </>
                  )}
                  {regulationOf(rule.id) && (
                    <>
                      <dt>금융당국 원문</dt>
                      <dd>
                        <RegulationText reg={regulationOf(rule.id)} />
                      </dd>
                    </>
                  )}
                  <dt>추가 근거</dt>
                  <dd>{rule.evidence.join(' / ')}</dd>
                  <dt>가이드 근거</dt>
                  <dd>{rule.source.frame}</dd>
                  {rule.typeConflict && (
                    <>
                      <dt>확인 필요</dt>
                      <dd>{rule.typeConflict}</dd>
                    </>
                  )}
                  {rule.notes?.length > 0 && (
                    <>
                      <dt>메모</dt>
                      <dd>
                        <ul className="rule-list">
                          {rule.notes.map((n) => (
                            <li key={n}>{n}</li>
                          ))}
                        </ul>
                      </dd>
                    </>
                  )}
                  {OVERLAPS.some((o) => o.rules.includes(rule.id)) && (
                    <>
                      <dt>헷갈리는 규칙</dt>
                      <dd>
                        <ul className="rule-list">
                          {OVERLAPS.filter((o) => o.rules.includes(rule.id)).map((o) => (
                            <li key={o.rules.join()}>
                              {o.rules
                                .filter((id) => id !== rule.id)
                                .map((id) => ruleById(id).name)
                                .join(', ')}
                              : {o.rule}
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </>
                  )}
                </dl>
                {rule.id === 'DP-M03' && (
                  <details className="false-positives">
                    <summary>다크패턴으로 보기 어려운 사례 {FALSE_POSITIVES.length}개 (오탐 방지)</summary>
                    <ul className="rule-list">
                      {FALSE_POSITIVES.map((fp) => (
                        <li key={fp.title}>
                          <strong>{fp.title}</strong> — {fp.summary} ({fp.source})
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                <div className="detail-actions">
                  {isLive ? (
                    <button type="button" className="button button-primary" onClick={findCases} disabled={result.status === 'loading'}>
                      {result.status === 'loading' ? '사례 찾는 중…' : '사례 찾기'}
                    </button>
                  ) : IS_DEMO ? (
                    <span className="card-reason">데모 사이트에서는 UI Bowl 사례 검색을 쓸 수 없어요. 사내 설치 버전에서 쓸 수 있어요.</span>
                  ) : (
                    <a className="button button-primary" href={loginUrl}>
                      UI Bowl 로그인 후 사례 찾기
                    </a>
                  )}
                </div>
              </article>

              {result.status === 'failed' && <div className="status status-error">사례 검색에 실패했어요: {result.errors.join(' / ')}</div>}
              {result.status === 'success' && (
                <div className="status status-ok">
                  후보 화면 {result.screens.length}개 · 검색 단서 일치 {result.screens.filter((s) => s.triggerHits.length).length}개 · 검토 전에는 위반 여부를
                  판단하지 않아요
                  {result.failedCalls > 0 && ` · 검색 ${result.calls}건 중 ${result.failedCalls}건 실패`}
                </div>
              )}
              {result.status === 'success' && result.screens.length === 0 && (
                <div className="empty">
                  <p className="empty-title">UI Bowl에서 후보 화면을 찾지 못했어요</p>
                  <p className="empty-desc">다른 규칙을 고르거나, 규칙의 검색어(src/data/darkPatternRules.js)를 바꿔 보세요.</p>
                </div>
              )}
              {result.screens.length > 0 && (
                <div className="grid">
                  {result.screens.map((s) => (
                    <CandidateCard key={s.id} screen={s} review={reviews[reviewKey(ruleId, s)]} onOpen={setReviewing} />
                  ))}
                </div>
              )}

              <section className="result-section">
                <div className="library-head">
                  <h2 className="section-title">
                    검토 기록 <span className="section-count">{reviewedCount}</span>
                  </h2>
                  <button type="button" className="button" onClick={copyReport} disabled={reviewedCount === 0}>
                    {copied ? '복사했어요' : '리포트 Markdown 복사'}
                  </button>
                </div>
                {reviewedCount === 0 ? (
                  <p className="empty-desc">후보 화면을 열어 판단기준을 체크하면 여기에 쌓여요.</p>
                ) : (
                  <table className="review-table">
                    <thead>
                      <tr>
                        <th>화면</th>
                        <th>규칙</th>
                        <th>결과</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reviews).map(([key, r]) => (
                        <tr key={key}>
                          <td>
                            <a href={r.screen.uiUrl} target="_blank" rel="noreferrer">
                              {r.screen.service}
                            </a>{' '}
                            · {r.screen.title}
                          </td>
                          <td>{ruleById(r.ruleId)?.name}</td>
                          <td>{r.verdict ? <span className={`chip verdict-chip-${r.verdict}`}>{VERDICTS[r.verdict].label}</span> : '미판정'}</td>
                          <td>
                            <button type="button" className="saved-remove" onClick={() => removeReview(key)}>
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </div>
          </div>
        </>
      )}

      {reviewing && <ReviewPanel rule={rule} screen={reviewing} review={reviews[reviewKey(ruleId, reviewing)]} onSave={saveReview} onClose={closeReview} />}
    </div>
  )
}
