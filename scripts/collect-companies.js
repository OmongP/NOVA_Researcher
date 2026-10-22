// 벤치마킹 대상 기업의 대표 화면을 UI Bowl에서 보충해요(기업당 최대 9묶음). 기존 화면은 그대로 두고 새 화면만 더해요.
// 실행 전 검색 서버를 꺼 주세요(로그인 토큰 공유 충돌 방지). 예) node scripts/collect-companies.js 카카오뱅크:MOBILE KB차차차:PC
import { readFileSync, writeFileSync } from 'node:fs'
import { callTool } from '../server/uibowl.js'
import { toScreens } from '../server/searchCore.js'

const FILE = new URL('../src/data/demoScreens.js', import.meta.url)
const PAGES = 3
const text = readFileSync(FILE, 'utf8')
const screens = JSON.parse(text.slice(text.indexOf('export const sampleScreens = ') + 'export const sampleScreens = '.length))
const keyOf = (s) => `${s.service}|${s.pattern}|${s.variant}`
const known = new Set(screens.map(keyOf))
const today = new Date().toISOString().slice(0, 10)
let added = 0

for (const arg of process.argv.slice(2)) {
  const [app, platform = 'MOBILE'] = arg.split(':')
  let n = 0
  for (let page = 1; page <= PAGES; page++) {
    const data = await callTool('filter_by_app', { app_name: app, platform, ...(page > 1 && { page }) })
    for (const s of toScreens(data, 'filter_by_app')) {
      if (!s.image || !s.uiUrl || known.has(keyOf(s))) continue // 이미지·원본 링크가 있고 중복이 아닌 화면만
      known.add(keyOf(s))
      n++
      added++
      screens.push({
        id: `demo-${screens.length + 1}`,
        service: s.service, domain: s.domain, category: s.category, platform: s.platform ?? (platform === 'PC' ? 'WEB' : 'MOBILE'),
        pattern: s.pattern, variant: s.variant, title: s.title, dataMonth: s.dataMonth, screenCount: s.screenCount,
        components: s.components, matchedTexts: s.matchedTexts.slice(0, 8), keywords: [app],
        image: s.image, images: s.images.slice(0, 4), uiUrl: s.uiUrl, source: 'UI Bowl', sourceTool: s.sourceTool,
        collectedAt: today, collectedFor: `기업:${app}`,
      })
    }
  }
  console.log(`${app} [${platform}]: 새 화면 ${n}개`)
}

const header = text.slice(0, text.indexOf('export const SOURCE_LABEL')).replace(/화면 묶음 \d+개/, `화면 묶음 ${screens.length}개`)
writeFileSync(FILE, `${header}export const SOURCE_LABEL = 'UI Bowl'\n\nexport const sampleScreens = ${JSON.stringify(screens, null, 2)}\n`)
console.log(`완료: ${added}개 추가 → 총 ${screens.length}개`)
