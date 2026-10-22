// 벤치마킹 화면 분류·필터. 분류 규칙은 src/data/benchmark/*.js 에 있어요.
// 이미지를 보고 판단한 결과가 아니라 UI Bowl 메타데이터 기반 자동 분류이고, 분류마다 근거(evidence)를 남겨요.
import { COMPANIES } from '../data/benchmark/companies'
import {
  AUTO_FINANCE_WORDS,
  CAR_WORDS,
  COMPONENT_UI_PATTERN,
  CONFIRMATION_COMPONENTS,
  ERROR_EMPTY_COMPONENTS,
  PATTERN_SCREEN_TYPE,
  PATTERN_UI_PATTERN,
  TASK_RULES,
} from '../data/benchmark/rules'
import { DOMAIN_BY_ID, PATTERN_BY_ID, SCREEN_TYPE_BY_ID, TASK_BY_ID, TASK_GROUP_BY_ID, TASKS, UI_PATTERNS, VERIFICATION_BY_ID } from '../data/benchmark/taxonomy'
import { squash } from './searchQuery'

const OTHER_COMPANY = '_other'
const COMPANY_BY_ID = Object.fromEntries(COMPANIES.map((c) => [c.id, c]))
const CAR_DOMAINS = ['automotive', 'auto-finance', 'mobility']
const DOMAIN_FROM_UIBOWL = { 금융: 'finance', 자동차: 'automotive', 모빌리티: 'mobility' }

const isAscii = (s) => /^[\x00-\x7f]*$/.test(s)
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// 영문 별칭은 단어 단위로, 한글 별칭은 포함 여부로 비교해요(예: 'Kia'가 'Kiara' 안에서 잡히지 않게요).
function aliasMatches(service, alias) {
  if (isAscii(alias)) return new RegExp(`(^|[^a-z0-9])${escapeRe(alias.toLowerCase())}([^a-z0-9]|$)`).test(service.toLowerCase())
  return squash(service).includes(squash(alias))
}

// 앱 이름으로 벤치마킹 대상 기업을 찾아요. 가장 긴 별칭이 맞는 기업을 골라요.
export function resolveCompany(service) {
  let best = null
  for (const company of COMPANIES) {
    for (const alias of company.aliases) {
      if (aliasMatches(service ?? '', alias) && (!best || alias.length > best.length)) best = { company, length: alias.length }
    }
  }
  return best?.company ?? null
}

const slug = (s) => squash(s).replace(/[^a-z0-9가-힣]/g, '')

const includesWord = (text, word) => squash(text).includes(squash(word))

function classifyTasks(screen, isCarContext) {
  const fields = [
    ['세부 패턴', screen.variant],
    ['제목', screen.title],
  ]
  const texts = screen.matchedTexts ?? []
  const strong = new Map() // 세부 과업 → { evidence, level }
  const weak = new Map()
  const categories = new Map() // 대분류만 알 수 있는 경우 → { evidence, level }
  for (const rule of TASK_RULES) {
    if (rule.carOnly && !isCarContext) continue
    const evidence = []
    let level = null
    if ((rule.patterns ?? []).includes(screen.pattern)) {
      evidence.push(`패턴 ‘${screen.pattern}’`)
      level = 'medium' // UI Bowl 패턴은 범용 분류라서 제목·세부 패턴에 과업 단어가 있는 것보다 약한 근거예요
    }
    for (const [label, value] of fields) {
      const hit = (rule.words ?? []).find((w) => includesWord(value ?? '', w))
      if (hit) {
        evidence.push(`${label}에 ‘${hit}’ 포함`)
        level = 'high'
      }
    }
    if (rule.category) {
      if (level && !categories.has(rule.category)) categories.set(rule.category, { evidence, level })
      continue
    }
    if (!level) {
      const hit = texts.find((t) => (rule.words ?? []).some((w) => includesWord(t, w)))
      if (hit) weak.set(rule.task, [`화면 문구 ‘${hit}’ (근거 약함)`])
      continue
    }
    strong.set(rule.task, { evidence, level })
  }
  for (const id of strong.keys()) weak.delete(id)
  // 대표 과업: 근거가 강한 순서(high → medium), 같으면 규칙 순서. 나머지는 보조 과업이에요.
  const rank = (id) => (strong.get(id).level === 'high' ? 0 : 1)
  const order = TASKS.map((t) => t.id)
  const ids = [...strong.keys()].sort((a, b) => rank(a) - rank(b) || order.indexOf(a) - order.indexOf(b))
  return { strong, weak, ids, categories }
}

function classifyScreenType(screen) {
  const comps = screen.components ?? []
  const err = ERROR_EMPTY_COMPONENTS.find((c) => comps.includes(c))
  if (err) return { id: 'error-empty', evidence: [`UI 요소 ‘${err}’`] }
  const done = CONFIRMATION_COMPONENTS.find((c) => comps.includes(c))
  if (done) return { id: 'confirmation', evidence: [`UI 요소 ‘${done}’`] }
  const id = PATTERN_SCREEN_TYPE[screen.pattern]
  return id ? { id, evidence: [`패턴 ‘${screen.pattern}’`] } : { id: null, evidence: [] }
}

function classifyPatterns(screen) {
  const found = new Map()
  const add = (id, why) => found.set(id, [...(found.get(id) ?? []), why])
  for (const comp of screen.components ?? []) {
    const id = COMPONENT_UI_PATTERN[comp]
    if (id) add(id, `UI 요소 ‘${comp}’`)
  }
  const byPattern = PATTERN_UI_PATTERN[screen.pattern]
  if (byPattern) add(byPattern, `패턴 ‘${screen.pattern}’`)
  const order = UI_PATTERNS.map((p) => p.id)
  return [...found.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
}

function classifyPlatform(raw) {
  if (!raw) return null
  if (/web|desktop|pc/i.test(raw)) return 'web'
  if (/mobile|app|ios|android/i.test(raw)) return 'app'
  return null
}

// 검증 상태: 이미지와 원본 출처(UI Bowl 링크)가 모두 있으면 확인, 하나만 있으면 확인 필요, 둘 다 없으면 확인 불가
function verificationOf(screen) {
  const hasImage = Boolean(screen.image || screen.images?.length)
  const hasSource = Boolean(screen.uiUrl)
  if (hasImage && hasSource) return 'verified'
  return hasImage || hasSource ? 'unverified' : 'unavailable'
}

const cache = new WeakMap()

// 화면 하나를 분류해요. 같은 화면 객체는 한 번만 계산해요.
export function classify(screen) {
  const hit = cache.get(screen)
  if (hit) return hit

  const company = resolveCompany(screen.service)
  const haystack = [screen.pattern, screen.variant, screen.title, ...(screen.matchedTexts ?? [])].join(' ')
  const baseDomain = company && company.domain !== 'finance' && company.domain !== 'automotive' ? company.domain : DOMAIN_FROM_UIBOWL[screen.domain] ?? company?.domain ?? null
  let domainId = baseDomain
  const domainEvidence = [screen.domain ? `UI Bowl 분류 ‘${screen.domain}’` : '']
  if (company?.domain === 'auto-finance') {
    domainId = 'auto-finance'
    domainEvidence.push(`기업 ‘${company.name}’`)
  } else if ((baseDomain === 'finance' || baseDomain === 'automotive') && AUTO_FINANCE_WORDS.some((w) => includesWord(haystack, w)) && CAR_WORDS.some((w) => includesWord(haystack, w))) {
    domainId = 'auto-finance'
    domainEvidence.push('자동차 금융 관련 문구')
  }

  const tasks = classifyTasks(screen, CAR_DOMAINS.includes(domainId))
  const screenType = classifyScreenType(screen)
  const patterns = classifyPatterns(screen)

  const bm = {
    companyId: company?.id ?? OTHER_COMPANY,
    companyName: company?.name ?? null,
    isTarget: Boolean(company),
    serviceId: `${company?.id ?? 'other'}:${slug(screen.service)}`,
    domainId,
    taskIds: tasks.ids, // 앞이 대표 과업, 뒤는 보조 과업
    primaryTaskId: tasks.ids[0] ?? null,
    taskGroupIds: [...new Set(tasks.ids.map((id) => TASK_BY_ID[id].group))],
    // 대분류: 세부 과업이 있으면 그 대분류, 없으면 대분류만 알 수 있는 근거(있을 때)로 지정해요.
    primaryCategoryId: tasks.ids[0] ? TASK_BY_ID[tasks.ids[0]].group : [...tasks.categories.keys()][0] ?? null,
    classificationConfidence: tasks.ids[0] ? tasks.strong.get(tasks.ids[0]).level : 'low',
    taskConfidence: Object.fromEntries(tasks.ids.map((id) => [id, tasks.strong.get(id).level])),
    // 근거가 없거나 약하면 확정하지 않고 '분류 검토 필요'로 둬요(사용자 필터에는 나오지 않는 내부 검수 대상이에요).
    taskStatus: tasks.ids.length ? 'classified' : 'review', // 세부 과업을 확정하지 못하면 '분류 검토 필요'(내부 검수 상태)
    tagSource: 'metadata',
    weakTaskIds: TASKS.map((t) => t.id).filter((id) => tasks.weak.has(id)),
    screenTypeId: screenType.id,
    patternIds: patterns.map(([id]) => id),
    platform: classifyPlatform(screen.platform),
    verification: verificationOf(screen),
    evidence: {
      domain: domainEvidence.filter(Boolean),
      tasks: Object.fromEntries([...[...tasks.strong].map(([id, v]) => [id, v.evidence]), ...tasks.weak]),
      categories: Object.fromEntries([...tasks.categories].map(([id, v]) => [id, v.evidence])),
      screenType: screenType.evidence,
      patterns: Object.fromEntries(patterns),
    },
  }
  cache.set(screen, bm)
  return bm
}

export const enrich = (screen) => ({ ...screen, bm: screen.bm ?? classify(screen) })

// 요구사항의 Screen 개체 모양으로 바꿔요(내보내기·문서화용).
export function toBenchmarkRecord(screen) {
  const bm = screen.bm ?? classify(screen)
  return {
    id: screen.id,
    serviceId: bm.serviceId,
    imageUrl: screen.image ?? null,
    sourceUrl: screen.uiUrl ?? null,
    captureDate: screen.dataMonth ?? null, // UI Bowl 수집월
    verificationStatus: bm.verification,
    screenType: bm.screenTypeId,
    taskIds: bm.taskIds,
    primaryTaskId: bm.primaryTaskId,
    taskStatus: bm.taskStatus,
    patternIds: bm.patternIds,
    analysis: { source: bm.tagSource, evidence: bm.evidence },
  }
}

// ── 라벨 ──
export const labelOf = {
  domain: (id) => DOMAIN_BY_ID[id]?.label ?? '분류 안 됨',
  task: (id) => TASK_BY_ID[id]?.label ?? id,
  taskGroup: (id) => TASK_GROUP_BY_ID[id]?.label ?? id,
  screenType: (id) => SCREEN_TYPE_BY_ID[id]?.label ?? '분류 안 됨',
  pattern: (id) => PATTERN_BY_ID[id]?.label ?? id,
  verification: (id) => VERIFICATION_BY_ID[id]?.label ?? id,
  platform: (id) => ({ app: '앱', web: '웹' })[id] ?? '확인 필요',
}

// ── 검색어 → 사용자 과업 정규화 ──
// '한도 조회', '대출 가능 금액 확인'처럼 표현이 달라도 같은 과업으로 묶어요. 가장 긴 동의어가 맞는 과업을 골라요.
export function taskFromQuery(raw) {
  const q = squash(raw ?? '')
  if (q.length < 2) return null
  let best = 0
  let hits = []
  for (const task of TASKS) {
    for (const word of [task.label, ...task.synonyms]) {
      const w = squash(word)
      if (w.length < 2 || !q.includes(w)) continue
      if (w.length > best) {
        best = w.length
        hits = [task.id]
      } else if (w.length === best && !hits.includes(task.id)) hits.push(task.id)
    }
  }
  return hits.length ? { taskIds: hits, groupIds: [...new Set(hits.map((id) => TASK_BY_ID[id].group))] } : null
}

// 화면이 검색어의 과업과 어떤 관계인지: same(같은 과업) / related(같은 대분류의 다른 과업, 확장 결과) / null
export function taskRelation(bm, match) {
  if (!match) return null
  if (bm.taskIds.some((id) => match.taskIds.includes(id))) return 'same'
  return bm.taskGroupIds.some((g) => match.groupIds.includes(g)) ? 'related' : null
}

// ── 필터 ──
// 사용자에게 보이는 상세 필터: 사용자 과업(세부 과업)·화면 유형·UI 패턴·기업. 같은 항목 안에서는 OR, 항목끼리는 AND예요.
// 과업은 기본적으로 '대표 과업'만 검색 대상이고, secondary를 켜면 보조 과업까지 포함해요.
// 도메인은 분야 탭이 맡고, 검증 상태·과업 미분류는 내부 관리용이라 사용자 필터에 나오지 않아요.
export const FACETS = ['task', 'screenType', 'pattern', 'company']
export const EMPTY_FILTERS = { task: [], screenType: [], pattern: [], company: [], secondary: false }

// 화면이 가진 값들(항목 하나에 값이 여러 개일 수 있어요)
const VALUES = {
  task: (bm, filters) => (filters.secondary ? bm.taskIds : bm.taskIds.slice(0, 1)),
  screenType: (bm) => (bm.screenTypeId ? [bm.screenTypeId] : []),
  pattern: (bm) => bm.patternIds,
  company: (bm) => [bm.companyId],
}

function passes(screen, filters, skip) {
  return FACETS.every((key) => {
    const picked = filters[key]
    return key === skip || picked.length === 0 || VALUES[key](screen.bm, filters).some((v) => picked.includes(v))
  })
}

export const applyFilters = (screens, filters) => screens.filter((s) => passes(s, filters))
export const activeFilterCount = (filters) => FACETS.reduce((n, key) => n + filters[key].length, 0)
export const hasActiveFilter = (filters) => activeFilterCount(filters) > 0

// 항목별 개수. 다른 항목의 필터는 모두 적용하고, 이 항목을 고르면 몇 개가 나오는지 보여줘요.
export function facetCounts(screens, filters) {
  const out = Object.fromEntries(FACETS.map((key) => [key, {}]))
  for (const s of screens) {
    for (const key of FACETS) {
      if (!passes(s, filters, key)) continue
      for (const v of VALUES[key](s.bm, filters)) out[key][v] = (out[key][v] ?? 0) + 1
    }
  }
  return out
}

// 데이터에 실제로 있는 선택지만 만들어요(필터와 상관없이 전체 기준). 화면이 없는 과업은 Taxonomy에만 있고 필터에는 나오지 않아요.
export function facetOptions(screens, filters = EMPTY_FILTERS) {
  const out = Object.fromEntries(FACETS.map((key) => [key, new Set()]))
  for (const s of screens) for (const key of FACETS) VALUES[key](s.bm, filters).forEach((v) => out[key].add(v))
  return out
}

export function filterLabel(facet, id) {
  if (facet === 'company') return id === OTHER_COMPANY ? '기타 서비스' : COMPANY_BY_ID[id]?.name ?? id
  return labelOf[facet](id)
}

export { OTHER_COMPANY }
