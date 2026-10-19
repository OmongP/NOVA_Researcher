// 자연어 검색어 → 검색 계획(UI Bowl 검색어) + 적합도 판정 규칙으로 바꾸는 규칙 기반 변환기예요.
// ux-screen-search 스킬의 도메인 사전과 같은 내용을 유지해요.

const FILLER = /(화면|검색|찾아줘|찾아|보여줘|관련|UI|ui|플로우|페이지)/g

// 다른 목적의 금융 서비스(가상자산·투자)는 단어가 겹쳐도 관련성 낮음으로 보내요.
const CRYPTO_INVEST = ['코인', '렌딩', '가상자산', '코빗', '업비트', '빗썸', '코인원', 'Bybit', '바이낸스', '모의투자', '주식', '증권', '부동산']

// match: 이 단어가 검색어에 있으면 이 항목을 써요.
// uibowl: UI Bowl 패턴 검색어. 짧은 명사 하나가 가장 잘 맞아요.
// ocr: 화면 문구 보조 검색. "정확히 일치" 화면을 찾는 데 써요.
// component: 화면 상태 검색(search_components)으로 보낼 때 사용해요.
// exact: 이 단어가 화면 정보·문구에 있으면 "정확히 일치"
// journey: 같은 사용자 여정이면 "관련 화면"
// exclude: 단어는 비슷해도 목적이 다르면 "관련성 낮음"
const DICTIONARY = [
  {
    match: ['대출', '한도'],
    core: '대출 한도',
    uibowl: '대출',
    ocr: { text: '한도', pattern: '대출' },
    exact: ['한도', '대출 가능', '가능 금액'],
    journey: ['대출', '금리', '신청', '비교', '심사', '조회'],
    exclude: CRYPTO_INVEST,
    related: ['대출 가능 금액', '예상 한도', '한도 조회 결과', '대출 비교', '대출 금리', '대출 심사'],
  },
  {
    match: ['시세'],
    core: '자동차 시세',
    uibowl: '시세',
    ocr: { text: '시세' },
    exact: ['시세', '내 차 팔기', '매입'],
    journey: ['차량', '중고차', '견적'],
    exclude: CRYPTO_INVEST,
    related: ['내 차 시세', '중고차 시세', '차량 가치', '매입 견적'],
  },
  {
    match: ['차량', '내 차', '내차'],
    core: '차량 등록',
    uibowl: '차량',
    ocr: { text: '차량번호' },
    exact: ['차량번호', '차량 번호', '차량 등록', '내 차 등록', '차량등록'],
    journey: ['차량', '내 차', '인증'],
    exclude: [],
    related: ['내 차 등록', '차량번호', '차량 정보', '차량 관리'],
  },
  {
    match: ['납입', '할부', '리스', '렌트', '구독'],
    core: '월 납입금',
    uibowl: '할부',
    ocr: { text: '월 납입' },
    exact: ['납입', '할부', '리스', '렌트', '월 '],
    journey: ['견적', '구독', '요금', '차량'],
    exclude: CRYPTO_INVEST,
    related: ['할부', '리스', '렌트', '견적', '월 납입', '구독'],
  },
  {
    match: ['인증'],
    core: '본인인증',
    uibowl: '인증',
    ocr: { text: '본인인증' },
    exact: ['본인인증', '본인 인증', '인증서', '휴대폰 인증', '신분증'],
    journey: ['인증', '로그인', '가입'],
    exclude: [],
    related: ['휴대폰 인증', '인증서', '신분증 촬영', '간편인증'],
  },
  {
    match: ['상환', '연체', '납부'],
    core: '상환',
    uibowl: '상환',
    ocr: { text: '상환' },
    exact: ['상환', '납부', '연체'],
    journey: ['대출', '내역'],
    exclude: CRYPTO_INVEST,
    related: ['중도상환', '상환 일정', '납부', '연체'],
  },
  {
    match: ['empty', '빈 화면', '엠티'],
    core: '빈 화면',
    component: '빈 화면',
    exact: [],
    journey: [],
    exclude: [],
    related: ['Empty', '내역 없음', '데이터 없음'],
  },
]

export function interpretQuery(raw) {
  const text = raw.trim()
  if (!text) return null

  const lower = text.toLowerCase()
  const entry = DICTIONARY.find((d) => d.match.some((m) => lower.includes(m)))
  const cleaned = text.replace(FILLER, ' ').replace(/\s+/g, ' ').trim()
  const first = cleaned.split(' ')[0]

  const core = entry ? entry.core : cleaned || text
  const related = entry ? entry.related : []
  const terms = [...new Set([core, ...related, ...cleaned.split(' ')].filter(Boolean))]

  return {
    raw: text,
    core,
    related,
    terms,
    uibowl: entry?.uibowl || first || text,
    component: entry?.component ?? null,
    ocr: entry?.ocr ?? null,
    exact: entry?.exact ?? (first ? [first] : []),
    journey: entry?.journey ?? [],
    exclude: entry?.exclude ?? [],
  }
}

export const TIERS = {
  exact: { label: '정확히 일치', rank: 0 },
  related: { label: '관련 화면', rank: 1 },
  low: { label: '관련성 낮음', rank: 2 },
}

const hit = (haystack, words) => words.find((w) => haystack.includes(w.toLowerCase()))

// 화면 하나가 검색 의도와 얼마나 맞는지 판정하고, 판정 근거를 함께 돌려줘요.
export function rateRelevance(screen, query) {
  if (!query) return { tier: 'related', reason: '' }

  const info = [screen.service, screen.pattern, screen.variant, screen.title, ...(screen.components ?? []), ...(screen.keywords ?? [])]
    .join(' ')
    .toLowerCase()
  const texts = (screen.matchedTexts ?? []).join(' ').toLowerCase()

  const excluded = hit(`${info} ${texts}`, query.exclude)
  if (excluded) return { tier: 'low', reason: `‘${excluded}’ 관련 서비스라 목적이 달라요` }

  if (query.component && screen.sourceTool === 'search_components') {
    return { tier: 'exact', reason: `UI Bowl에서 ‘${query.component}’ 상태로 분류된 화면이에요` }
  }

  const exactInInfo = hit(info, query.exact)
  if (exactInInfo) return { tier: 'exact', reason: `화면 정보에 ‘${exactInInfo}’가 있어요` }
  // 문구에만 단어가 있으면(메뉴·FAQ 등) 화면 목적이 다를 수 있어요.
  // 화면 흐름(패턴)도 같은 여정일 때만 "정확히 일치"로 올려요.
  const exactInText = hit(texts, query.exact)
  const journeyInInfo = hit(info, query.journey)
  if (exactInText && journeyInInfo) {
    return { tier: 'exact', reason: `‘${journeyInInfo}’ 흐름이고 화면 문구에서 ‘${exactInText}’를 확인했어요` }
  }
  if (exactInText) return { tier: 'related', reason: `화면 문구에 ‘${exactInText}’가 있지만 화면 목적은 다를 수 있어요` }

  if (journeyInInfo) return { tier: 'related', reason: `‘${journeyInInfo}’ 여정에 속한 화면이에요` }

  return { tier: 'low', reason: '검색 의도와 직접 연결되는 정보가 없어요' }
}

function scoreScreen(screen, terms) {
  const haystack = [screen.service, screen.pattern, screen.variant, screen.title, ...screen.keywords]
    .join(' ')
    .toLowerCase()
  return terms.reduce((score, term) => {
    const words = term.toLowerCase().split(' ')
    return score + (words.every((w) => haystack.includes(w)) ? words.length : 0)
  }, 0)
}

// 샘플 데이터(로그인 전) 전용 검색이에요.
export function searchScreens(screens, query, domain) {
  const inDomain = domain === '전체' ? screens : screens.filter((s) => s.domain === domain)
  if (!query) return inDomain

  return inDomain
    .map((s) => ({ ...s, score: scoreScreen(s, query.terms) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
}
