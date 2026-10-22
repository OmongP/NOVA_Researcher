import { useMemo } from 'react'
import { COMPANIES } from '../data/benchmark/companies'
import { SCREEN_TYPES, TASKS, UI_PATTERNS } from '../data/benchmark/taxonomy'
import { EMPTY_FILTERS, FACETS, OTHER_COMPANY, facetCounts, facetOptions, filterLabel, hasActiveFilter } from '../lib/benchmark'

const GROUPS = [
  { key: 'company', label: '기업' },
  { key: 'task', label: '사용자 과업' },
  { key: 'screenType', label: '화면 유형' },
  { key: 'pattern', label: 'UI 패턴' },
]

// 분류 체계 순서대로 정렬한 선택지 전체(데이터에 있는 것만 골라 써요)
const ORDER = {
  company: [...COMPANIES.map((c) => c.id), OTHER_COMPANY],
  task: TASKS.map((t) => t.id),
  screenType: SCREEN_TYPES.map((t) => t.id),
  pattern: UI_PATTERNS.map((p) => p.id),
}

const toggle = (list, id) => (list.includes(id) ? list.filter((v) => v !== id) : [...list, id])

// 상세 필터 패널. 선택지는 지금 검색 가능한 화면에 실제로 있는 값만 나오고, 개수는 다른 필터를 적용한 상태에서 고르면 나오는 수예요.
export default function BenchmarkFilters({ screens, filters, onChange }) {
  const counts = useMemo(() => facetCounts(screens, filters), [screens, filters])
  const present = useMemo(() => facetOptions(screens), [screens])

  return (
    <section className="bm-panel" aria-label="상세 필터">
      {GROUPS.map(({ key, label }) => {
        const ids = ORDER[key].filter((id) => present[key].has(id))
        // 고를 수 있는 값이 하나뿐이면 필터가 의미 없어서 숨겨요.
        if (ids.length < 2 && filters[key].length === 0) return null
        return (
          <fieldset key={key} className="bm-group">
            <legend className="bm-group-label">{label}</legend>
            <div className="bm-options">
              {ids.map((id) => {
                const on = filters[key].includes(id)
                const n = counts[key][id] ?? 0
                return (
                  <label key={id} className={`bm-option ${on ? 'is-on' : ''} ${n === 0 && !on ? 'is-disabled' : ''}`}>
                    <input type="checkbox" checked={on} disabled={n === 0 && !on} onChange={() => onChange({ ...filters, [key]: toggle(filters[key], id) })} />
                    <span>{filterLabel(key, id)}</span>
                    <span className="bm-option-count">{n}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        )
      })}
      {FACETS.every((k) => present[k].size < 2) && <p className="bm-panel-empty">이 범위에는 나눠 볼 수 있는 분류가 아직 부족해요.</p>}
    </section>
  )
}

// 선택한 필터를 칩으로 보여주고 하나씩 뺄 수 있게 해요.
export function FilterChips({ filters, onChange }) {
  if (!hasActiveFilter(filters)) return null
  return (
    <div className="bm-chips" aria-label="선택한 필터">
      {GROUPS.flatMap(({ key, label }) =>
        filters[key].map((id) => (
          <button key={`${key}:${id}`} type="button" className="bm-selected" onClick={() => onChange({ ...filters, [key]: filters[key].filter((v) => v !== id) })} aria-label={`${label} ${filterLabel(key, id)} 해제`}>
            <span className="bm-selected-group">{label}</span> {filterLabel(key, id)} <span aria-hidden="true">×</span>
          </button>
        )),
      )}
      <button type="button" className="link-button" onClick={() => onChange(EMPTY_FILTERS)}>
        초기화
      </button>
    </div>
  )
}
