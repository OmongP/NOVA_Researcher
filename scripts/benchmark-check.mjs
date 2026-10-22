// 벤치마킹 분류 결과 점검: 수집된 화면(demoScreens)을 분류하고 분포와 샘플을 보여줘요.
//   node scripts/benchmark-check.mjs
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { sampleScreens } = await vite.ssrLoadModule('/src/data/demoScreens.js')
  const { classify, labelOf } = await vite.ssrLoadModule('/src/lib/benchmark.js')
  const S = sampleScreens.map((s) => ({ ...s, bm: classify(s) }))
  const count = (pick) =>
    Object.entries(
      S.reduce((acc, s) => {
        for (let k of [].concat(pick(s))) {
          k ??= '(없음)'
          acc[k] = (acc[k] ?? 0) + 1
        }
        return acc
      }, {}),
    ).sort((a, b) => b[1] - a[1])
  const line = (title, rows) => console.log(`${title}: ${rows.map(([k, v]) => `${k} ${v}`).join(' | ')}`)

  console.log(`화면 묶음 ${S.length}개 · 벤치마킹 대상 기업 화면 ${S.filter((s) => s.bm.isTarget).length}개`)
  line('기업', count((s) => s.bm.companyId).slice(0, 14))
  line('도메인', count((s) => labelOf.domain(s.bm.domainId)))
  line('과업', count((s) => (s.bm.taskIds.length ? s.bm.taskIds.map(labelOf.task) : '(과업 없음)')))
  line('화면 유형', count((s) => labelOf.screenType(s.bm.screenTypeId)))
  line('UI 패턴', count((s) => (s.bm.patternIds.length ? s.bm.patternIds.map(labelOf.pattern) : '(없음)')))
  line('검증', count((s) => labelOf.verification(s.bm.verification)))
  line('웹/앱', count((s) => labelOf.platform(s.bm.platform)))
  const noTask = S.filter((s) => !s.bm.taskIds.length).length
  console.log(`과업이 분류된 화면 ${S.length - noTask}개 (${Math.round(((S.length - noTask) / S.length) * 100)}%) · 화면 유형 분류 ${S.filter((s) => s.bm.screenTypeId).length}개`)

  if (process.argv.includes('--samples')) {
    for (const s of S.filter((x) => x.bm.isTarget).slice(0, 12)) {
      console.log(`\n[${s.service}] ${s.pattern} / ${s.variant}`)
      console.log(`  도메인 ${labelOf.domain(s.bm.domainId)} · 과업 ${s.bm.taskIds.map(labelOf.task).join(', ') || '-'} · 화면 유형 ${labelOf.screenType(s.bm.screenTypeId)} · 패턴 ${s.bm.patternIds.map(labelOf.pattern).join(', ') || '-'}`)
      console.log(`  근거: ${JSON.stringify(s.bm.evidence.tasks)}`)
    }
  }
} finally {
  await vite.close()
}
