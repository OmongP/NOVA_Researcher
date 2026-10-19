// 공개 데모 사이트용 화면 데이터를 만들어요.
// 실행 전: npm run dev 로 서버를 켜고 UI Bowl에 로그인돼 있어야 해요.
// 실행: node scripts/build-demo-data.js  →  src/data/demoScreens.js
//
// 데모 사이트는 서버 없이 이 파일 안의 화면만 검색해요. 이미지는 UI Bowl 원본 주소를 링크해요.
import { writeFileSync } from 'node:fs'

const API = 'http://localhost:5173/api/search'
const TERMS = [
  '대출한도 화면', '자동차 시세 조회', '본인인증', '차량 등록', '월 납입금', 'Empty 화면',
  '로그인', '회원가입', '결제 완료', '약관 동의', '해지', '송금', '카드 신청', '보험', '알림', '마이페이지', '온보딩', '예약',
  '주소 입력', '한도 조회', '금리', '견적', '시세', '차량 관리', '할부', '신청',
  '명세서', '가격 비교',
]
const DOMAINS = ['금융', '자동차', '모빌리티']
const MAX_IMAGES = 4

const byKey = new Map()
for (const term of TERMS) {
  for (const domain of DOMAINS) {
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q: term, domain }) })
    const data = await res.json()
    if (!res.ok || !data.screens) {
      console.error(`실패: ${term} / ${domain}`, data.error ?? data)
      continue
    }
    for (const s of data.screens) {
      const key = `${s.service}|${s.pattern}|${s.variant}`
      const prev = byKey.get(key)
      // 같은 화면 묶음이 여러 검색어에 걸리면 검색어를 키워드로 모아요(데모 검색이 이 키워드로 찾아요).
      const keywords = [...new Set([...(prev?.keywords ?? []), term.replace(/ 화면$/, ''), data.query.core, ...s.matchedTexts.slice(0, 4)])]
      byKey.set(key, {
        id: prev?.id ?? `demo-${byKey.size + 1}`,
        service: s.service,
        domain: s.domain,
        category: s.category,
        pattern: s.pattern,
        variant: s.variant,
        title: s.title,
        dataMonth: s.dataMonth,
        screenCount: s.screenCount,
        components: s.components,
        matchedTexts: [...new Set([...(prev?.matchedTexts ?? []), ...s.matchedTexts])].slice(0, 8),
        keywords,
        image: s.image,
        images: (prev?.images ?? s.images).slice(0, MAX_IMAGES),
        uiUrl: s.uiUrl,
        source: 'UI Bowl',
        // 화면 상태(빈 화면) 검색으로 찾은 화면은 표시해 둬요. 데모의 적합도 판정이 이 표시를 써요.
        sourceTool: prev?.sourceTool === 'search_components' || s.sourceTool === 'search_components' ? 'search_components' : s.sourceTool,
      })
    }
    console.log(`${term} / ${domain}: ${data.screens.length}개 (누적 ${byKey.size})`)
  }
}

const screens = [...byKey.values()]
const header = `// 공개 데모 사이트용 화면 데이터 (scripts/build-demo-data.js가 만든 파일이에요. 직접 고치지 마세요)
// 출처: UI Bowl (https://uibowl.io) · 생성일 ${new Date().toISOString().slice(0, 10)} · 화면 묶음 ${screens.length}개
`
writeFileSync(
  new URL('../src/data/demoScreens.js', import.meta.url),
  `${header}\nexport const SOURCE_LABEL = 'UI Bowl'\n\nexport const sampleScreens = ${JSON.stringify(screens, null, 2)}\n`,
)
console.log(`완료: src/data/demoScreens.js (${screens.length}개)`)
