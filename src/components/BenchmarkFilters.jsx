import { useMemo } from 'react'
import { COMPANIES } from '../data/benchmark/companies'
import { DOMAINS, SCREEN_TYPES, TASKS, UI_PATTERNS, VERIFICATION } from '../data/benchmark/taxonomy'
import { EMPTY_FILTERS, OTHER_COMPANY, facetCounts, hasActiveFilter } from '../lib/benchmark'

// 기업·도메인·과업·화면 유형·UI 패턴·검증 상태 필터. 개수는 다른 필터를 적용한 상태에서 고르면 나오는 수예요.
function Select({ label, value, onChange, options, counts, emptyLabel = '전체' }) {
  return (
    <label className="bm-filter">
      <span className="bm-filter-label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        <option value="">{emptyLabel}</option>
        {options.map((o) => {
          const n = counts[o.id] ?? 0
          return (
            <option key={o.id} value={o.id} disabled={n === 0 && value !== o.id}>
              {o.label} ({n})
            </option>
          )
        })}
      </select>
    </label>
  )
}

export default function BenchmarkFilters({ screens, filters, onChange }) {
  const facets = useMemo(() => facetCounts(screens, filters), [screens, filters])
  const set = (key) => (value) => onChange({ ...filters, [key]: value })
  const companies = useMemo(() => {
    const kr = COMPANIES.filter((c) => c.country === 'KR').map((c) => ({ id: c.id, label: c.name }))
    const global = COMPANIES.filter((c) => c.country !== 'KR').map((c) => ({ id: c.id, label: c.name }))
    return { kr, global }
  }, [])
  const active = hasActiveFilter(filters)
  const companyCounts = facets.company

  return (
    <section className="bm-filters" aria-label="벤치마킹 필터">
      <label className="bm-filter">
        <span className="bm-filter-label">기업</span>
        <select value={filters.company} onChange={(e) => set('company')(e.target.value)} aria-label="기업">
          <option value="">전체</option>
          <optgroup label="국내">
            {companies.kr.map((c) => (
              <option key={c.id} value={c.id} disabled={!companyCounts[c.id] && filters.company !== c.id}>
                {c.label} ({companyCounts[c.id] ?? 0})
              </option>
            ))}
          </optgroup>
          <optgroup label="해외">
            {companies.global.map((c) => (
              <option key={c.id} value={c.id} disabled={!companyCounts[c.id] && filters.company !== c.id}>
                {c.label} ({companyCounts[c.id] ?? 0})
              </option>
            ))}
          </optgroup>
          <option value={OTHER_COMPANY}>기타 서비스 ({companyCounts[OTHER_COMPANY] ?? 0})</option>
        </select>
      </label>
      <Select label="도메인" value={filters.domain} onChange={set('domain')} options={DOMAINS} counts={facets.domain} />
      <Select label="사용자 과업" value={filters.task} onChange={set('task')} options={TASKS} counts={facets.task} />
      <Select label="화면 유형" value={filters.screenType} onChange={set('screenType')} options={SCREEN_TYPES} counts={facets.screenType} />
      <Select label="UI 패턴" value={filters.pattern} onChange={set('pattern')} options={UI_PATTERNS} counts={facets.pattern} />
      <Select label="검증 상태" value={filters.verification} onChange={set('verification')} options={VERIFICATION} counts={facets.verification} />
      {Object.keys(facets.platform).length > 0 && (
        <Select label="웹/앱" value={filters.platform} onChange={set('platform')} options={[{ id: 'app', label: '앱' }, { id: 'web', label: '웹' }]} counts={facets.platform} />
      )}
      <label className="bm-filter bm-check">
        <input type="checkbox" checked={filters.targetOnly} onChange={(e) => set('targetOnly')(e.target.checked)} />
        <span>벤치마킹 대상 기업만</span>
      </label>
      {active && (
        <button type="button" className="button" onClick={() => onChange(EMPTY_FILTERS)}>
          필터 초기화
        </button>
      )}
    </section>
  )
}
