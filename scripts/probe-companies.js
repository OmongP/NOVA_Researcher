// UI Bowl에 벤치마킹 대상 기업의 화면이 있는지 확인해요(읽기 전용). 실행 전 검색 서버(8787/8799)를 꺼 주세요(로그인 토큰 공유 충돌 방지).
import { callTool } from '../server/uibowl.js'
import { toScreens } from '../server/searchCore.js'

const NAMES = process.argv.slice(2)
for (const name of NAMES) {
  for (const platform of ['MOBILE', 'PC']) {
    try {
      const data = await callTool('filter_by_app', { app_name: name, platform })
      const screens = toScreens(data, 'filter_by_app')
      console.log(`${name} [${platform}]: ${screens.length}개 · ${[...new Set(screens.map((s) => s.service))].join(', ') || '-'} · 총 ${data.total_count ?? '?'}`)
    } catch (e) {
      console.log(`${name} [${platform}]: 오류 ${e.message.slice(0, 80)}`)
    }
  }
}
