import { useMemo } from 'react'
import { COMPANIES } from '../data/benchmark/companies'
import { SCREEN_TYPES, TASKS, UI_PATTERNS } from '../data/benchmark/taxonomy'
import { EMPTY_FILTERS, FACETS, OTHER_COMPANY, activeFilterCount, facetCounts, facetOptions, filterLabel, hasActiveFilter } from '../lib/benchmark'

const GROUPS = [
  { key: 'task', label: '사용자 과업' },
  { key: 'screenType', label: '화면 유형' },
  { key: 'pattern', label: 'UI 패턴' },
  { key: 'company', label: '기업' },
]

// 기업 필터는 화면이 충분히 쌓인 기업이 3곳 이상일 때만 보여줘요(화면이 1~2개뿐인 기업을 고르는 건 의미가 없어서요).
const MIN_COMPANY_SCREENS = 5
const MIN_COMPANIES = 3

// 분류 체계 순서대로 정렬한 선택지 전체(데이터에 있는 것만 골라 써요)
const ORDER = {
  company: [...COMPANIES.map((c) => c.id), OTHER_COMPANY],
  task: TASKS.map((t) => t.id), // 과업 미분류 같은 내부 관리 항목은 사용자에게 보여주지 않아요
  screenType: SCREEN_TYPES.map((t) => t.id),
  pattern: UI_PATTERNS.map((p) => p.id),
}

const toggle = (list, id) => (list.includes(id) ? list.filter((v) => v !== id) : [...list, id])

// 상세 필터. 기본은 닫혀 있고, 버튼을 누르면 결과 위에 가로로 펼쳐져요. 선택지는 지금 검색 가능한 화면에 실제로 있는 값만 나와요.
// 개수는 다른 필터를 적용한 상태에서 고르면 나오는 수예요(0이면 고를 수 없어요).
export function useFilterGroups(screens, filters) {
  const counts = useMemo(() => facetCounts(screens, filters), [screens, filters])
  const present = useMemo(() => facetOptions(screens), [screens])
  const totals = useMemo(() => facetCounts(screens, EMPTY_FILTERS), [screens]) // 필터와 상관없는 전체 개수
  const groups = GROUPS.map(({ key, label }) => {
    let ids = ORDER[key].filter((id) => present[key].has(id))
    if (key === 'company') {
      // 기업 필터는 화면이 충분히 쌓인 기업이 3곳 이상일 때만 보여줘요(화면이 1~2개뿐인 기업을 고르는 건 의미가 없어서요).
      const enough = ids.filter((id) => id !== OTHER_COMPANY && totals.company[id] >= MIN_COMPANY_SCREENS)
      if (enough.length < MIN_COMPANIES && filters.company.length === 0) return null
      ids = ids.filter((id) => id === OTHER_COMPANY || totals.company[id] >= MIN_COMPANY_SCREENS || filters.company.includes(id))
    }
    // 고를 수 있는 값이 하나뿐이면 필터가 의미 없어서 숨겨요.
    return ids.length < 2 && filters[key].length === 0 ? null : { key, label, ids }
  }).filter(Boolean)
  return { groups, counts, selected: activeFilterCount(filters) }
}

export function FilterButton({ fg, open, onToggle }) {
  // 나눠 볼 분류가 없으면 버튼 자체를 보여주지 않아요.
  if (fg.groups.length === 0 && fg.selected === 0) return null
  return (
    <button type="button" className="button filter-toggle" aria-expanded={open} onClick={onToggle}>
      상세 필터
      {fg.selected > 0 && <span className="filter-toggle-count">{fg.selected}</span>}
    </button>
  )
}

export default function BenchmarkFilters({ fg, filters, onChange }) {
  return (
    <div className="bm-panel" role="group" aria-label="상세 필터">
      {fg.groups.map(({ key, label, ids }) => (
        <div key={key} className="bm-group" role="group" aria-label={label}>
          <span className="bm-group-label">{label}</span>
          <div className="bm-options">
            {ids.map((id) => {
              const on = filters[key].includes(id)
              const n = fg.counts[key][id] ?? 0
              return (
                <label key={id} className={`bm-option ${on ? 'is-on' : ''} ${n === 0 && !on ? 'is-disabled' : ''}`}>
                  <input type="checkbox" checked={on} disabled={n === 0 && !on} onChange={() => onChange({ ...filters, [key]: toggle(filters[key], id) })} />
                  <span>{filterLabel(key, id)}</span>
                  <span className="bm-option-count">{n}</span>
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
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
