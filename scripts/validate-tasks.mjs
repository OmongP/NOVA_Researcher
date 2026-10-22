// 대표 화면 N개를 골라 AI(Claude Code) 과업 분류와 규칙 분류를 나란히 만들고, 디자이너 검수표를 만들어요.
//   node scripts/validate-tasks.mjs [개수=40]
// 결과: docs/validation/task-review.csv · task-review.html (디자이너가 '검수 결과' 칸을 채워요) · ai-results.json
// 이미지는 UI Bowl 원본 URL에서 받아 메모리로만 분석해요(파일로 저장하지 않아요).
import { createServer } from 'vite'
import { writeFileSync } from 'node:fs'

const N = Number(process.argv[2] ?? 40)
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
  const sel = [...picked.slice(0, N - reviewPick.length), ...reviewPick]
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
        Object.assign(row, { ai: analysis.userTask.id, aiCategory: analysis.userTask.categoryId, aiSecondary: analysis.userTask.secondaryIds, aiNeedsReview: analysis.userTask.needsReview, aiEvidence: analysis.userTask.evidence, aiScreenType: analysis.screenType.id, aiConfidence: analysis.confidence })
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

  const L = (id) => (id ? labelOf.task(id) : '분류 검토 필요')
  const csv = ['번호,서비스,UI Bowl 패턴/세부,원본 URL,규칙 분류(대표),규칙 상태,AI 분류(대표),AI 보조,AI 근거,일치,디자이너 검수 결과(올바른 과업),비고']
  for (const r of out) {
    const match = !r.error && (r.ai ?? null) === (r.rule ?? null) ? '일치' : r.error ? '분석 실패' : '불일치'
    csv.push([r.n, r.service, `${r.pattern} / ${r.variant}`, r.uiUrl, L(r.rule), r.ruleStatus, r.error ? '' : L(r.ai), (r.aiSecondary ?? []).map(labelOf.task).join('; '), (r.aiEvidence ?? '').replace(/\n/g, ' '), match, '', ''].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
  }
  writeFileSync('docs/validation/task-review.csv', '﻿' + csv.join('\n'))

  const ok = out.filter((r) => !r.error)
  const same = ok.filter((r) => (r.ai ?? null) === (r.rule ?? null)).length
  const sameGroup = ok.filter((r) => r.ai && r.rule && r.ai.split('.')[0] === r.rule.split('.')[0]).length
  console.log(`\nAI↔규칙 대표 과업 일치 ${same}/${ok.length} (${Math.round((same / ok.length) * 100)}%) · 대분류 일치 ${sameGroup}/${ok.length} · AI 검토 필요 ${ok.filter((r) => !r.ai).length}`)

  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  const options = (sel) => `<option value="">선택</option><option>분류 검토 필요</option>${TASKS.map((t) => `<option${t.label === sel ? ' selected' : ''}>${esc(t.label)}</option>`).join('')}`
  writeFileSync('docs/validation/task-review.html', `<!doctype html><meta charset="utf-8"><title>사용자 과업 분류 검수표</title>
<style>body{font:14px/1.5 -apple-system,'Pretendard',sans-serif;margin:24px;color:#111}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #eee;padding:8px;vertical-align:top;text-align:left}img{height:180px;border-radius:8px}.m{color:#0066ff}.x{color:#d92d20}small{color:#666}</style>
<h1>사용자 과업 분류 검수표</h1><p>각 화면의 이미지를 보고 <b>올바른 대표 과업</b>을 선택해 주세요(원본 링크에서 전체 화면 확인). 선택값은 이 페이지를 닫으면 사라지니 CSV(docs/validation/task-review.csv)에 기록해 주세요.</p>
<table><tr><th>#</th><th>화면</th><th>규칙 분류</th><th>AI 분류</th><th>검수 결과</th></tr>
${out.map((r) => `<tr><td>${r.n}</td><td><a href="${esc(r.uiUrl)}" target="_blank"><img src="${esc(r.image)}" loading="lazy"></a><br><b>${esc(r.service)}</b><br><small>${esc(r.pattern)} / ${esc(r.variant)}</small></td>
<td>${esc(L(r.rule))}<br><small>${esc(r.ruleStatus)} ${r.ruleConfidence ?? ''}</small></td>
<td>${r.error ? `<span class="x">분석 실패</span>` : `${esc(L(r.ai))}${(r.ai ?? null) === (r.rule ?? null) ? ' <span class="m">· 규칙과 일치</span>' : ''}<br><small>${esc(r.aiEvidence)}</small>`}</td>
<td><select>${options(null)}</select></td></tr>`).join('\n')}</table>`)
} finally {
  await vite.close()
}
