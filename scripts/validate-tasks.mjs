// 대표 화면을 골라 AI(Claude Code) 과업 분류와 규칙 분류를 나란히 만들어요. 검수 페이지는 scripts/build-review-page.mjs 가 만들어요.
//   node scripts/validate-tasks.mjs [개수=40]            새로 고른 대표 화면
//   node scripts/validate-tasks.mjs --ids=<결과.json>    그 파일에 있는 화면을 그대로 다시 분석(프롬프트를 고친 뒤 같은 화면으로 비교할 때)
// 결과: docs/validation/ai-results.json
// 이미지는 UI Bowl 원본 URL에서 받아 메모리로만 분석해요(파일로 저장하지 않아요).
import { createServer } from 'vite'
import { readFileSync, writeFileSync } from 'node:fs'

const idsArg = process.argv.find((a) => a.startsWith('--ids='))?.slice(6)
const N = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 40)
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { sampleScreens } = await vite.ssrLoadModule('/src/data/demoScreens.js')
  const { classify, labelOf } = await vite.ssrLoadModule('/src/lib/benchmark.js')
  const { TASKS } = await vite.ssrLoadModule('/src/data/benchmark/taxonomy.js')
  const { analyzeScreen } = await vite.ssrLoadModule('/server/screenAnalysis.js')

  const all = sampleScreens.filter((s) => s.image && s.uiUrl).map((s) => ({ s, bm: classify(s) }))
  // 핵심 과업(한도·월 납입금·계약 상세·결제 예정액)은 3개까지, 나머지 세부 과업은 서비스가 다른 화면 1개씩, 분류 검토 필요 화면 8개
  const CORE = ['ESTIMATION.LIMIT', 'ESTIMATION.MONTHLY_PAYMENT', 'ASSET_MANAGEMENT.CONTRACT_DETAIL', 'PAYMENT.UPCOMING']
  const picked = []
  const used = new Set()
  const take = (pool, max) => {
    const seen = new Set()
    for (const x of pool) {
      if (seen.has(x.s.service) || seen.size >= max || used.has(x.s.id)) continue
      seen.add(x.s.service)
      used.add(x.s.id)
      picked.push(x)
    }
  }
  // 핵심 과업은 대표 과업이 아니어도 보조 과업으로 걸린 화면과 제목에 단어가 있는 화면까지 후보로 봐요
  for (const id of CORE) take(all.filter((x) => x.bm.taskIds.includes(id)), 3)
  for (const t of TASKS) take(all.filter((x) => x.bm.primaryTaskId === t.id), 1)
  const review = all.filter((x) => x.bm.taskStatus === 'review' && !used.has(x.s.id))
  const step = Math.max(1, Math.floor(review.length / 8))
  const reviewPick = []
  for (let i = 0; i < review.length && reviewPick.length < 8; i += step) reviewPick.push(review[i])
  let sel = [...picked.slice(0, N - reviewPick.length), ...reviewPick]
  if (idsArg) {
    const want = JSON.parse(readFileSync(idsArg, 'utf8')).map((r) => r.id)
    sel = want.map((id) => all.find((x) => x.s.id === id)).filter(Boolean)
  }
  console.log(`선정 ${sel.length}개 (규칙 분류 ${sel.filter((x) => x.bm.taskStatus === 'classified').length} · 검토 필요 ${sel.filter((x) => x.bm.taskStatus === 'review').length})`)

  const out = []
  let idx = 0
  async function worker() {
    while (idx < sel.length) {
      const i = idx++
      const { s, bm } = sel[i]
      const row = { n: i + 1, id: s.id, service: s.service, pattern: s.pattern, variant: s.variant, uiUrl: s.uiUrl, image: s.image, dataMonth: s.dataMonth,
        rule: bm.primaryTaskId, ruleCategory: bm.primaryCategoryId, ruleSecondary: bm.taskIds.slice(1), ruleStatus: bm.taskStatus, ruleConfidence: bm.primaryTaskId ? bm.taskConfidence[bm.primaryTaskId] : null }
      try {
        const res = await fetch(s.image)
        if (!res.ok) throw new Error(`이미지 ${res.status}`)
        const type = res.headers.get('content-type')?.split(';')[0] ?? 'image/png'
        const dataUrl = `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`
        const { analysis } = await analyzeScreen(dataUrl)
        Object.assign(row, { ai: analysis.userTask.id, aiCategory: analysis.userTask.categoryId, aiSecondary: analysis.userTask.secondaryIds, aiNeedsReview: analysis.userTask.needsReview, aiEvidence: analysis.userTask.evidence, aiScreenType: analysis.screenType.id, aiConfidence: analysis.userTask.confidence, aiRelevance: analysis.userTask.relevance, aiStatus: analysis.userTask.status, aiCta: analysis.userTask.primaryCta })
        console.log(`${row.n}/${sel.length} ${s.service} → AI ${row.ai ? labelOf.task(row.ai) : '검토 필요'} / 규칙 ${row.rule ? labelOf.task(row.rule) : '검토 필요'}`)
      } catch (e) {
        row.error = e.message.slice(0, 120)
        console.log(`${row.n} 실패: ${row.error}`)
      }
      out.push(row)
    }
  }
  await Promise.all([worker(), worker()])
  out.sort((a, b) => a.n - b.n)
  writeFileSync('docs/validation/ai-results.json', JSON.stringify(out, null, 2))

  console.log(`\n저장: docs/validation/ai-results.json (${out.length}개)`)
} finally {
  await vite.close()
}
