import { useEffect, useMemo, useRef, useState } from 'react'
import { COMPANIES } from '../data/benchmark/companies'
import { SCREEN_TYPES, TASKS, TASK_GROUPS, UI_PATTERNS } from '../data/benchmark/taxonomy'
import { EMPTY_FILTERS, OTHER_COMPANY, activeFilterCount, applyFilters, facetCounts, facetOptions, filterLabel, hasActiveFilter } from '../lib/benchmark'

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
// 기업은 분야별로 묶어 보여줘요. 자동차금융은 데이터가 없어도 칸을 두고 '아직 없어요'라고 알려요(빈 칸을 숨기면 원래 없는 건지 알 수 없어서요).
const COMPANY_GROUPS = [
  { domain: 'finance', label: '금융' },
  { domain: 'auto-finance', label: '자동차금융', alwaysShow: true },
  { domain: 'automotive', label: '자동차' },
  { domain: 'mobility', label: '모빌리티' },
]
const DOMAIN_OF_COMPANY = Object.fromEntries(COMPANIES.map((c) => [c.id, c.domain]))
const ZERO_HINT = '지금 검색 조건에서는 결과가 없어요'

const toggle = (list, id) => (list.includes(id) ? list.filter((v) => v !== id) : [...list, id])
const MOBILE = '(max-width: 640px)'

// 상세 필터: '상세 필터' 버튼으로 여는 팝오버(모바일은 바텀시트)예요.
// - 안에서 고른 내용은 초안(draft)이에요. '결과 보기'를 눌러야 적용되고, 바깥을 누르거나 Esc로 닫으면 취소돼요.
// - 사용자 과업은 왼쪽 대분류 → 오른쪽 세부 과업 2단이에요. 대분류를 눌러도 선택되지 않고 오른쪽 목록만 바뀌어요.
// - 건수는 결과 수와 같은 기준(screens)으로 세요. 다른 그룹의 조건은 적용하고, 같은 그룹은 여러 개를 고를 수 있으니(OR) 빼고 세요.
// - 선택지는 벤치마킹 DB(universe)에 있는 값만 보여줘요. DB에 있지만 지금 조건에서 0개인 항목은 흐리게 두고 고를 수 없게 해요.
export default function BenchmarkFilters({ screens, universe, filters, onChange }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(filters)
  const [tab, setTab] = useState('task')
  const [group, setGroup] = useState(null)
  const button = useRef(null)
  const panel = useRef(null)

  const present = useMemo(() => facetOptions(universe, { ...EMPTY_FILTERS, secondary: draft.secondary }), [universe, draft.secondary])
  const counts = useMemo(() => facetCounts(screens, draft), [screens, draft])
  const totals = useMemo(() => facetCounts(universe, { ...EMPTY_FILTERS, secondary: draft.secondary }), [universe, draft.secondary])
  const resultCount = useMemo(() => applyFilters(screens, draft).length, [screens, draft])
  const hasSecondary = useMemo(() => universe.some((s) => s.bm.taskIds.length > 1), [universe])
  const applied = activeFilterCount(filters)
  const picked = activeFilterCount(draft)

  const openPanel = () => {
    setDraft(filters)
    setOpen(true)
  }
  const cancel = () => setOpen(false)
  const apply = () => {
    onChange(draft)
    setOpen(false)
  }

  // 바깥 클릭·Esc는 '취소'예요. 적용하지 않은 선택은 버려져요.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => !panel.current?.contains(e.target) && !button.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    // 모바일 바텀시트가 열려 있는 동안 뒤 화면이 스크롤되지 않게 해요.
    const lock = window.matchMedia(MOBILE).matches
    if (lock) document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      if (lock) document.body.style.overflow = ''
    }
  }, [open])

  // 선택지가 있는 그룹만 보여줘요(고를 값이 하나뿐인 항목은 숨겨요).
  const taskIds = ORDER.task.filter((id) => present.task.has(id))
  const optionsOf = (key) =>
    ORDER[key]
      .filter((id) => present[key].has(id))
      .filter((id) => key !== 'company' || id === OTHER_COMPANY || (totals.company[id] ?? 0) >= MIN_COMPANY_SCREENS || draft.company.includes(id))
  const sections = SECTIONS.filter(({ key }) => {
    if (key === 'task') return taskIds.length >= 1
    if (key === 'company') {
      const enough = ORDER.company.filter((id) => id !== OTHER_COMPANY && (totals.company[id] ?? 0) >= MIN_COMPANY_SCREENS)
      if (enough.length < MIN_COMPANIES && filters.company.length === 0) return false
    }
    return optionsOf(key).length >= 2 || filters[key].length > 0
  })
  if (sections.length === 0 && applied === 0) return null

  // 데이터가 하나도 없는 대분류는 숨겨요.
  const groups = TASK_GROUPS.filter((g) => taskIds.some((id) => GROUP_OF[id] === g.id))
  const groupCount = (g) => applyFilters(screens, { ...draft, task: taskIds.filter((id) => GROUP_OF[id] === g.id) }).length
  const activeGroup = groups.find((g) => g.id === group) ?? groups.find((g) => draft.task.some((id) => GROUP_OF[id] === g.id)) ?? groups[0]
  const activeTab = sections.some((s) => s.key === tab) ? tab : sections[0]?.key
  const setKey = (key, list) => setDraft((d) => ({ ...d, [key]: list }))

  const row = (key, id) => {
    const on = draft[key].includes(id)
    const n = counts[key][id] ?? 0
    const off = n === 0 && !on // 0개 항목은 고를 수 없어요(고르면 결과가 0이 돼요). 이미 고른 건 뺄 수 있게 둬요.
    return (
      <label key={id} className={`bm-row ${on ? 'is-on' : ''} ${off ? 'is-disabled' : ''}`} title={off ? ZERO_HINT : undefined}>
        <input type="checkbox" checked={on} disabled={off} onChange={() => setKey(key, toggle(draft[key], id))} />
        <span className="bm-check" aria-hidden="true" />
        <span className="bm-row-label">{filterLabel(key, id)}</span>
        <span className="bm-row-count">{n}</span>
      </label>
    )
  }

  return (
    <div className="bm-pop">
      <button
        ref={button}
        type="button"
        className={`button filter-toggle ${applied > 0 ? 'is-active' : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => (open ? cancel() : openPanel())}
      >
        <span>상세 필터</span>
        {applied > 0 && (
          <span className="filter-toggle-count" aria-label={`적용된 조건 ${applied}개`}>
            {applied}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="bm-backdrop" aria-hidden="true" />
          <div className="bm-panel" role="dialog" aria-label="상세 필터" ref={panel}>
            <div className="bm-sheet-head">
              <strong>상세 필터</strong>
              <button type="button" className="bm-close" aria-label="닫기" onClick={cancel}>
                ×
              </button>
            </div>

            {sections.length > 1 && (
              <div className="bm-seg" role="tablist" aria-label="필터 그룹">
                {sections.map(({ key, label }) => (
                  <button key={key} type="button" role="tab" aria-selected={activeTab === key} className={`bm-seg-item ${activeTab === key ? 'is-active' : ''}`} onClick={() => setTab(key)}>
                    {label}
                    {draft[key].length > 0 && <span className="bm-seg-count">{draft[key].length}</span>}
                  </button>
                ))}
              </div>
            )}

            <div className="bm-body">
              {activeTab === 'task' && activeGroup && (
                <div className="bm-split">
                  <ul className="bm-master" aria-label="대분류">
                    {groups.map((g) => {
                      const n = draft.task.filter((id) => GROUP_OF[id] === g.id).length
                      const total = groupCount(g)
                      const empty = total === 0 && n === 0
                      return (
                        <li key={g.id}>
                          <button
                            type="button"
                            className={`bm-master-item ${activeGroup.id === g.id ? 'is-active' : ''} ${empty ? 'is-empty' : ''}`}
                            title={empty ? ZERO_HINT : undefined}
                            onClick={() => setGroup(g.id)}
                          >
                            <span className="bm-master-label">{g.label}</span>
                            {n > 0 ? <span className="bm-master-picked">{n}</span> : <span className="bm-row-count">{total}</span>}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="bm-sub" role="group" aria-label={`${activeGroup.label} 세부 과업`}>
                    {taskIds.filter((id) => GROUP_OF[id] === activeGroup.id).map((id) => row('task', id))}
                  </div>
                </div>
              )}
              {activeTab === 'company' && (
                <div className="bm-list">
                  {COMPANY_GROUPS.map((g) => {
                    const ids = optionsOf('company').filter((id) => DOMAIN_OF_COMPANY[id] === g.domain)
                    if (ids.length === 0 && !g.alwaysShow) return null
                    return (
                      <div key={g.domain} className="bm-list-group" role="group" aria-label={g.label}>
                        <p className="bm-list-head">{g.label}</p>
                        {ids.length > 0 ? ids.map((id) => row('company', id)) : <p className="bm-list-empty">UI Bowl에 수집된 {g.label} 기업 화면이 아직 없어요</p>}
                      </div>
                    )
                  })}
                  {optionsOf('company').includes(OTHER_COMPANY) && (
                    <div className="bm-list-group" role="group" aria-label="기타">
                      <p className="bm-list-head">기타</p>
                      {row('company', OTHER_COMPANY)}
                    </div>
                  )}
                </div>
              )}
              {activeTab !== 'task' && activeTab !== 'company' && activeTab && <div className="bm-list">{optionsOf(activeTab).map((id) => row(activeTab, id))}</div>}
            </div>

            <div className="bm-panel-foot">
              {activeTab === 'task' && hasSecondary && (
                <label className="bm-secondary">
                  <input type="checkbox" checked={draft.secondary} onChange={(e) => setDraft((d) => ({ ...d, secondary: e.target.checked }))} />
                  <span>보조 과업 포함</span>
                </label>
              )}
              <button type="button" className="link-button bm-reset" disabled={picked === 0} onClick={() => setDraft({ ...EMPTY_FILTERS, secondary: draft.secondary })}>
                초기화
              </button>
              <button type="button" className="button button-primary bm-apply" onClick={apply}>
                결과 {resultCount}개 보기
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// 적용된 필터를 결과 위에 칩으로 보여주고, 하나씩 빼면 바로 결과에 반영돼요.
export function FilterChips({ filters, onChange }) {
  if (!hasActiveFilter(filters)) return null
  return (
    <div className="bm-applied" aria-label="적용된 필터">
      {SECTIONS.flatMap(({ key, label }) =>
        filters[key].map((id) => (
          <button
            key={`${key}:${id}`}
            type="button"
            className="bm-applied-chip"
            onClick={() => onChange({ ...filters, [key]: filters[key].filter((v) => v !== id) })}
            aria-label={`${label} ${filterLabel(key, id)} 해제`}
          >
            <span className="bm-applied-group">{label}</span>
            {filterLabel(key, id)}
            <span className="bm-applied-x" aria-hidden="true">
              ×
            </span>
          </button>
        )),
      )}
      <button type="button" className="link-button bm-applied-reset" onClick={() => onChange({ ...EMPTY_FILTERS, secondary: filters.secondary })}>
        모두 지우기
      </button>
    </div>
  )
}
