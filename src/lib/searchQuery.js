// 자연어 검색어 → 검색 계획(UI Bowl 검색어) + 적합도 판정 규칙으로 바꾸는 규칙 기반 변환기예요.
// ux-screen-search 스킬의 도메인 사전과 같은 내용을 유지해요.

const FILLER = /(화면|검색|찾아줘|찾아|보여줘|관련|UI|ui|플로우|페이지)/g

// 띄어쓰기는 비교할 때 무시해요 ("본인 인증" = "본인인증").
export const squash = (s) => String(s ?? '').replace(/\s+/g, '').toLowerCase()

// 붙여 쓴 말 끝의 행동 단어를 떼어 띄어 쓴 형태를 만들어요 ("주소입력" → "주소 입력").
// UI Bowl 패턴 검색은 띄어쓰기에 민감해서 붙인 형태와 띄운 형태를 모두 검색해요.
const ACTION_WORDS = [
  '납입금', '입력', '등록', '조회', '신청', '인증', '완료', '변경', '설정', '확인', '선택', '검색', '결제', '해지', '가입', '납입', '수정', '삭제', '추가',
  '연결', '동의', '발급', '비교', '계산', '견적', '예약', '취소', '안내', '알림', '내역', '관리', '실패', '오류',
]
function splitCompound(word) {
  if (word.length < 4 || /\s/.test(word)) return null
  const suffix = ACTION_WORDS.find((w) => word.endsWith(w) && word.length - w.length >= 2)
  return suffix ? `${word.slice(0, -suffix.length)} ${suffix}` : null
}

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
    exact: ['납입', '할부', '리스', '렌트', '월납입', '월요금', '월이용료'],
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

  const sq = squash(text)
  const entry = DICTIONARY.find((d) => d.match.some((m) => sq.includes(squash(m))))
  const cleaned = text.replace(FILLER, ' ').replace(/\s+/g, ' ').trim()
  const words = cleaned.split(' ').filter(Boolean)
  const first = words[0]

  // 입력한 그대로, 붙인 형태, 띄운 형태. 띄어쓰기를 어떻게 써도 같은 결과를 찾게 해요.
  const joined = words.join('')
  const split = words.length === 1 ? splitCompound(words[0]) : null
  const phrases = [...new Set([cleaned, joined, split].filter(Boolean))]
  // 전체 구절로 안 나올 때 넓혀 찾는 앞 단어 ("주소 입력" → "주소")
  const head = words.length > 1 ? words[0] : split ? split.split(' ')[0] : null

  const core = entry ? entry.core : cleaned || text
  const related = entry ? entry.related : []
  // 단어를 따로 떼어 찾지 않아요. 띄어 쓴 입력이 붙여 쓴 입력보다 넓게 걸리지 않게 하려는 거예요.
  const terms = [...new Set([core, ...related, ...phrases].filter(Boolean))]

  return {
    raw: text,
    core,
    related,
    terms,
    uibowl: entry?.uibowl || phrases[0] || text,
    phrases,
    head: head && head.length >= 2 ? head : null,
    component: entry?.component ?? null,
    ocr: entry?.ocr ?? null,
    exact: entry?.exact ?? (phrases.length ? phrases : first ? [first] : []),
    journey: entry?.journey ?? (head && head.length >= 2 ? [head] : []),
    exclude: entry?.exclude ?? [],
  }
}

export const TIERS = {
  exact: { label: '정확히 일치', rank: 0 },
  related: { label: '관련 화면', rank: 1 },
  low: { label: '관련성 낮음', rank: 2 },
}

const hit = (haystack, words) => words.find((w) => squash(w) && haystack.includes(squash(w)))
// 여러 단어로 된 구절("주소 입력")은 단어가 모두 들어 있으면 일치로 봐요. 문구 검색 결과는 단어 조각으로 돌아와요.
const hitAllWords = (haystack, words) =>
  words.find((w) => {
    const parts = w.split(/\s+/).filter(Boolean)
    return parts.length > 1 && parts.every((x) => haystack.includes(squash(x)))
  })

// 화면 하나가 검색 의도와 얼마나 맞는지 판정하고, 판정 근거를 함께 돌려줘요.
export function rateRelevance(screen, query) {
  if (!query) return { tier: 'related', reason: '' }

  // 필드 사이에 '|'를 넣어 서로 다른 필드의 글자가 이어져 매칭되지 않게 해요.
  const info = squash([screen.service, screen.pattern, screen.variant, screen.title, ...(screen.components ?? []), ...(screen.keywords ?? [])].join('|'))
  const texts = squash((screen.matchedTexts ?? []).join('|'))

  const excluded = hit(`${info} ${texts}`, query.exclude)
  if (excluded) return { tier: 'low', reason: `‘${excluded}’ 관련 서비스라 목적이 달라요` }

  if (query.component && screen.sourceTool === 'search_components') {
    return { tier: 'exact', reason: `UI Bowl에서 ‘${query.component}’ 상태로 분류된 화면이에요` }
  }

  const exactInInfo = hit(info, query.exact) ?? hitAllWords(info, query.exact)
  if (exactInInfo) return { tier: 'exact', reason: `화면 정보에 ‘${exactInInfo}’ 표기가 있어요` }
  // 문구에만 단어가 있으면(메뉴·FAQ 등) 화면 목적이 다를 수 있어요.
  // 화면 흐름(패턴)도 같은 여정일 때만 "정확히 일치"로 올려요.
  const exactInText = hit(texts, query.exact) ?? hitAllWords(texts, query.exact)
  const journeyInInfo = hit(info, query.journey)
  if (exactInText && journeyInInfo) {
    return { tier: 'exact', reason: `‘${journeyInInfo}’ 흐름이고 화면 문구에서 ‘${exactInText}’ 표기를 확인했어요` }
  }
  if (exactInText) return { tier: 'related', reason: `화면 문구에 ‘${exactInText}’ 표기가 있지만 화면 목적은 다를 수 있어요` }

  if (journeyInInfo) return { tier: 'related', reason: `‘${journeyInInfo}’ 여정에 속한 화면이에요` }

  // 검색어 전체는 아니어도 일부 단어(앞 단어 포함)가 화면 정보나 문구에 있으면 "관련 화면"으로 보여줘요.
  const words = [...new Set([query.head, ...String(query.core ?? '').split(/\s+/)].filter((w) => w && squash(w).length >= 2))]
  const partial = hit(info, words) ?? hit(texts, words)
  if (partial) return { tier: 'related', reason: `검색어 일부인 ‘${partial}’ 표기가 있어요. 화면 목적은 다를 수 있어요` }

  return { tier: 'low', reason: '검색 의도와 직접 연결되는 정보가 없어요' }
}

function scoreScreen(screen, terms) {
  const haystack = squash([screen.service, screen.pattern, screen.variant, screen.title, ...screen.keywords].join('|'))
  return terms.reduce((score, term) => {
    const words = term.split(' ').filter(Boolean)
    // 띄어쓰기를 무시한 구절 일치, 또는 모든 단어가 들어 있으면 일치
    const matched = haystack.includes(squash(term)) || words.every((w) => haystack.includes(squash(w)))
    return score + (matched ? words.length : 0)
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
