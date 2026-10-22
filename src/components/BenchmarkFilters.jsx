import { useEffect, useMemo, useRef, useState } from 'react'
import { COMPANIES } from '../data/benchmark/companies'
import { SCREEN_TYPES, TASKS, TASK_GROUPS, UI_PATTERNS } from '../data/benchmark/taxonomy'
import { EMPTY_FILTERS, OTHER_COMPANY, activeFilterCount, facetCounts, facetOptions, filterLabel, hasActiveFilter } from '../lib/benchmark'

const SECTIONS = [
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
  task: TASKS.map((t) => t.id),
  screenType: SCREEN_TYPES.map((t) => t.id),
  pattern: UI_PATTERNS.map((p) => p.id),
  company: [...COMPANIES.map((c) => c.id), OTHER_COMPANY],
}
const GROUP_OF = Object.fromEntries(TASKS.map((t) => [t.id, t.group]))

const toggle = (list, id) => (list.includes(id) ? list.filter((v) => v !== id) : [...list, id])

// 상세 필터 버튼 + Popover. 기본은 닫혀 있고 선택 상태는 닫아도 유지돼요(상태는 위에서 들고 있어요).
// 사용자 과업은 좌측 대분류 → 우측 세부 과업이에요. 대분류를 눌러도 선택되지 않고 우측 목록만 바뀌어요.
// 지금 검색 결과에 화면이 있는 과업만 나오고, 개수는 다른 필터를 적용한 상태에서 고르면 나오는 수예요(0이면 고를 수 없어요).
export default function BenchmarkFilters({ screens, filters, onChange }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('task')
  const [group, setGroup] = useState(null)
  const root = useRef(null)

  const present = useMemo(() => facetOptions(screens, filters), [screens, filters])
  const counts = useMemo(() => facetCounts(screens, filters), [screens, filters])
  const totals = useMemo(() => facetCounts(screens, { ...EMPTY_FILTERS, secondary: filters.secondary }), [screens, filters.secondary])
  const hasSecondary = useMemo(() => screens.some((s) => s.bm.taskIds.length > 1), [screens])
  const selected = activeFilterCount(filters)

  useEffect(() => {
    if (!open) return
    const close = (e) => (e.type === 'keydown' ? e.key === 'Escape' && setOpen(false) : !root.current?.contains(e.target) && setOpen(false))
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  // 선택지가 있는 섹션만 보여줘요(고를 값이 하나뿐인 항목은 숨겨요).
  const taskIds = ORDER.task.filter((id) => present.task.has(id))
  const sections = SECTIONS.filter(({ key }) => {
    if (key === 'task') return taskIds.length >= 1
    let ids = ORDER[key].filter((id) => present[key].has(id))
    if (key === 'company') {
      const enough = ids.filter((id) => id !== OTHER_COMPANY && totals.company[id] >= MIN_COMPANY_SCREENS)
      if (enough.length < MIN_COMPANIES && filters.company.length === 0) return false
    }
    return ids.length >= 2 || filters[key].length > 0
  })
  if (sections.length === 0 && selected === 0) return null

  const groups = TASK_GROUPS.filter((g) => taskIds.some((id) => GROUP_OF[id] === g.id))
  const activeGroup = groups.find((g) => g.id === group) ?? groups.find((g) => taskIds.some((id) => GROUP_OF[id] === g.id && filters.task.includes(id))) ?? groups[0]
  const activeTab = sections.some((s) => s.key === tab) ? tab : sections[0]?.key
  const set = (key, list) => onChange({ ...filters, [key]: list })

  const row = (key, id, label) => {
    const on = filters[key].includes(id)
    const n = counts[key][id] ?? 0
    return (
      <label key={id} className={`bm-row ${on ? 'is-on' : ''} ${n === 0 && !on ? 'is-disabled' : ''}`}>
        <input type="checkbox" checked={on} disabled={n === 0 && !on} onChange={() => set(key, toggle(filters[key], id))} />
        <span className="bm-check" aria-hidden="true" />
        <span className="bm-row-label">{label}</span>
        <span className="bm-option-count">{n}</span>
      </label>
    )
  }

  return (
    <div className="bm-pop" ref={root}>
      <button type="button" className="button filter-toggle" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((v) => !v)}>
        상세 필터
        {selected > 0 && <span className="filter-toggle-count">{selected}</span>}
      </button>
      {open && (
        <div className="bm-panel" role="dialog" aria-label="상세 필터">
          {sections.length > 1 && (
            <div className="bm-tabs" role="tablist">
              {sections.map(({ key, label }) => (
                <button key={key} type="button" role="tab" aria-selected={activeTab === key} className={`bm-tab ${activeTab === key ? 'is-active' : ''}`} onClick={() => setTab(key)}>
                  {label}
                  {filters[key].length > 0 && <span className="bm-tab-count">{filters[key].length}</span>}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'task' && activeGroup && (
            <>
              <div className="bm-split">
                <ul className="bm-master" aria-label="대분류">
                  {groups.map((g) => {
                    const n = filters.task.filter((id) => GROUP_OF[id] === g.id).length
                    return (
                      <li key={g.id}>
                        <button type="button" className={`bm-master-item ${activeGroup.id === g.id ? 'is-active' : ''}`} onClick={() => setGroup(g.id)}>
                          <span>{g.label}</span>
                          {n > 0 && <span className="bm-tab-count">{n}</span>}
                          <span className="bm-chevron" aria-hidden="true">›</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                <div className="bm-detail-list" role="group" aria-label={`${activeGroup.label} 세부 과업`}>
                  {taskIds.filter((id) => GROUP_OF[id] === activeGroup.id).map((id) => row('task', id, filterLabel('task', id)))}
                </div>
              </div>
              {hasSecondary && (
                <label className="bm-secondary">
                  <input type="checkbox" checked={filters.secondary} onChange={(e) => onChange({ ...filters, secondary: e.target.checked })} />
                  <span>보조 과업이 일치하는 화면도 포함</span>
                </label>
              )}
            </>
          )}

          {activeTab !== 'task' && activeTab && (
            <div className="bm-options bm-simple">
              {ORDER[activeTab]
                .filter((id) => present[activeTab].has(id))
                .filter((id) => activeTab !== 'company' || id === OTHER_COMPANY || totals.company[id] >= MIN_COMPANY_SCREENS || filters.company.includes(id))
                .map((id) => {
                  const on = filters[activeTab].includes(id)
                  const n = counts[activeTab][id] ?? 0
                  return (
                    <label key={id} className={`bm-option ${on ? 'is-on' : ''} ${n === 0 && !on ? 'is-disabled' : ''}`}>
                      <input type="checkbox" checked={on} disabled={n === 0 && !on} onChange={() => set(activeTab, toggle(filters[activeTab], id))} />
                      <span>{filterLabel(activeTab, id)}</span>
                      <span className="bm-option-count">{n}</span>
                    </label>
                  )
                })}
            </div>
          )}

          {selected > 0 && (
            <div className="bm-panel-foot">
              <button type="button" className="link-button" onClick={() => onChange({ ...EMPTY_FILTERS, secondary: filters.secondary })}>
                전체 초기화
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 선택한 필터를 칩으로 보여주고 하나씩 뺄 수 있게 해요.
export function FilterChips({ filters, onChange }) {
  if (!hasActiveFilter(filters)) return null
  return (
    <div className="bm-chips" aria-label="선택한 필터">
      {SECTIONS.flatMap(({ key, label }) =>
        filters[key].map((id) => (
          <button key={`${key}:${id}`} type="button" className="bm-selected" onClick={() => onChange({ ...filters, [key]: filters[key].filter((v) => v !== id) })} aria-label={`${label} ${filterLabel(key, id)} 해제`}>
            <span className="bm-selected-group">{label}</span> {filterLabel(key, id)} <span aria-hidden="true">×</span>
          </button>
        )),
      )}
      <button type="button" className="link-button" onClick={() => onChange({ ...EMPTY_FILTERS, secondary: filters.secondary })}>
        초기화
      </button>
    </div>
  )
}
