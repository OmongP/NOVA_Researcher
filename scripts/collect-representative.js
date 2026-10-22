// 과업별로 화면이 부족한 곳을 UI Bowl에서 보충해요(대표 화면만 소량). 기존 화면은 지우지 않고 새 화면만 더해요.
// 실행 전: 검색 서버가 UI Bowl에 로그인돼 있어야 해요. 예) PORT=8799 SERVE_STATIC=1 node server/index.js
// 실행: node scripts/collect-representative.js [API주소]  →  src/data/demoScreens.js 에 추가
// 새 화면에는 수집일(collectedAt)과 어떤 과업을 채우려고 찾았는지(collectedFor)를 남겨요.
import { readFileSync, writeFileSync } from 'node:fs'

const API = process.argv[2] ?? 'http://localhost:8799/api/search'
const FILE = new URL('../src/data/demoScreens.js', import.meta.url)
const PER_TERM = 6
// [채울 과업, 검색어, 분야]
const PLAN = [
  ['한도 조회', '한도 조회', '금융'], ['한도 조회', '대출 한도', '금융'],
  ['상품 비교', '금리 비교', '금융'], ['상품 비교', '상품 비교', '금융'],
  ['정보 입력', '주소 입력', '금융'], ['정보 입력', '직업 소득 입력', '금융'],
  ['본인인증', '본인인증', '금융'],
  ['약관 동의', '약관 동의', '금융'],
  ['차량 검색', '차량 검색', '자동차'], ['차량 검색', '내차 시세 조회', '자동차'],
  ['차량 견적', '견적 비교', '자동차'], ['차량 구매', '차량 구매', '자동차'],
  ['차량 판매', '내 차 팔기', '자동차'], ['내 차 관리', '차량 관리', '자동차'],
]

const text = readFileSync(FILE, 'utf8')
const start = text.indexOf('export const sampleScreens = ') + 'export const sampleScreens = '.length
const screens = JSON.parse(text.slice(start))
const keyOf = (s) => `${s.service}|${s.pattern}|${s.variant}`
const known = new Set(screens.map(keyOf))
const today = new Date().toISOString().slice(0, 10)
let added = 0

for (const [task, term, domain] of PLAN) {
  const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q: term, domain }) })
  const data = await res.json()
  if (!res.ok || !data.screens) {
    console.error(`실패: ${term} / ${domain}`, data.error ?? data)
    continue
  }
  let n = 0
  for (const s of data.screens) {
    if (n >= PER_TERM) break
    if (!s.image || !s.uiUrl || known.has(keyOf(s))) continue // 이미지·원본 링크가 있고 중복이 아닌 화면만
    known.add(keyOf(s))
    n++
    added++
    screens.push({
      id: `demo-${screens.length + 1}`,
      service: s.service, domain: s.domain, category: s.category, platform: s.platform ?? null,
      pattern: s.pattern, variant: s.variant, title: s.title, dataMonth: s.dataMonth, screenCount: s.screenCount,
      components: s.components, matchedTexts: s.matchedTexts.slice(0, 8),
      keywords: [...new Set([term, data.query.core, ...s.matchedTexts.slice(0, 4)])],
      image: s.image, images: s.images.slice(0, 4), uiUrl: s.uiUrl, source: 'UI Bowl', sourceTool: s.sourceTool,
      collectedAt: today, collectedFor: task,
    })
  }
  console.log(`${task} · ${term} / ${domain}: 새 화면 ${n}개 (검색 결과 ${data.screens.length}개)`)
}

const header = text.slice(0, text.indexOf('export const SOURCE_LABEL')).replace(/화면 묶음 \d+개/, `화면 묶음 ${screens.length}개`)
writeFileSync(FILE, `${header}export const SOURCE_LABEL = 'UI Bowl'\n\nexport const sampleScreens = ${JSON.stringify(screens, null, 2)}\n`)
console.log(`완료: ${added}개 추가 → 총 ${screens.length}개`)
