// 디자이너 검수 결과(CSV)로 분류 정확도를 계산해요. AI와 규칙의 '일치율'이 아니라 디자이너가 정한 정답 기준 정확도예요.
//   node scripts/score-review.mjs <task-review-result.csv> [ai-results.json=docs/validation/ai-results.json]
// 결과: 콘솔 + docs/validation/report.md
import { createServer } from 'vite'
import { readFileSync, writeFileSync } from 'node:fs'

const csvPath = process.argv[2]
if (!csvPath) {
  console.error('사용법: node scripts/score-review.mjs <task-review-result.csv> [ai-results.json]')
  process.exit(1)
}

function parseCsv(text) {
  const rows = []
  let row = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') (cur += '"'), i++
      else if (c === '"') quoted = false
      else cur += c
    } else if (c === '"') quoted = true
    else if (c === ',') (row.push(cur), (cur = ''))
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cur)
      cur = ''
      if (row.some((v) => v !== '')) rows.push(row)
      row = []
    } else cur += c
  }
  if (cur !== '' || row.length) (row.push(cur), rows.push(row))
  const [head, ...body] = rows
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.replace(/^﻿/, ''), r[i] ?? ''])))
}

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { TASKS, TASK_GROUPS } = await vite.ssrLoadModule('/src/data/benchmark/taxonomy.js')
  const T = Object.fromEntries(TASKS.map((t) => [t.id, t]))
  const G = Object.fromEntries(TASK_GROUPS.map((g) => [g.id, g.label]))
  const label = (id) => (id ? T[id]?.label ?? id : '분류 검토 필요')
  const groupOf = (id) => (id ? T[id]?.group ?? null : null)
  const ai = Object.fromEntries(JSON.parse(readFileSync(process.argv[3] ?? 'docs/validation/ai-results.json', 'utf8')).map((r) => [r.id, r]))

  const rows = parseCsv(readFileSync(csvPath, 'utf8')).map((r) => {
    const src = ai[r.id] ?? {}
    const answerState = r['정답 상태']
    return {
      n: r['번호'], id: r.id, service: r['서비스'],
      aiId: r['AI 대표 과업 id'] || null, ruleId: r['규칙 대표 과업 id'] || null,
      aiCategory: groupOf(r['AI 대표 과업 id']) ?? src.aiCategory ?? null, ruleCategory: groupOf(r['규칙 대표 과업 id']) ?? src.ruleCategory ?? null,
      aiStatus: r['AI 상태'], aiRelevance: r['AI 관련성'],
      verdict: r['검수 판정'], answerState, answerId: r['정답 과업 id'] || null,
      relevance: r['디자이너 관련성'] || r['AI 관련성'] || null, // 비워두면 AI 판정을 따른 것으로 봐요
    }
  })
  const judged = rows.filter((r) => r.answerState === 'task' || r.answerState === 'unclassifiable')
  const pending = rows.length - judged.length - rows.filter((r) => r.answerState === 'hold').length
  const hold = rows.filter((r) => r.answerState === 'hold').length
  // 정확도는 분류 범위 안(직접 관련·공통 UX 참고)으로 디자이너가 본 화면만 대상으로 해요.
  const inScope = judged.filter((r) => r.relevance !== 'out_of_scope')
  const pct = (a, b) => (b ? `${a}/${b} (${Math.round((a / b) * 100)}%)` : '-')
  const correct = (who) => (r) => (r.answerState === 'unclassifiable' ? !r[who === 'ai' ? 'aiId' : 'ruleId'] : r[who === 'ai' ? 'aiId' : 'ruleId'] === r.answerId)

  const aiOk = inScope.filter(correct('ai')).length
  const ruleOk = inScope.filter(correct('rule')).length
  const withCat = inScope.filter((r) => r.answerState === 'task')
  const aiCat = withCat.filter((r) => r.aiCategory && r.aiCategory === groupOf(r.answerId)).length
  const ruleCat = withCat.filter((r) => r.ruleCategory && r.ruleCategory === groupOf(r.answerId)).length

  // 범위 밖 판정: 디자이너가 관련성을 고른 화면만 비교(비워둔 화면은 AI를 따른 것이라 제외해요)
  const relExplicit = parseCsv(readFileSync(csvPath, 'utf8')).filter((r) => r['디자이너 관련성'])
  const relAcc = relExplicit.filter((r) => r['디자이너 관련성'] === r['AI 관련성']).length
  const oosTruth = relExplicit.filter((r) => r['디자이너 관련성'] === 'out_of_scope')
  const oosPred = rows.filter((r) => r.aiRelevance === 'out_of_scope' && relExplicit.some((x) => x.id === r.id))
  const oosHit = oosTruth.filter((r) => r['AI 관련성'] === 'out_of_scope').length
  const oosPrecise = oosPred.filter((r) => relExplicit.find((x) => x.id === r.id)['디자이너 관련성'] === 'out_of_scope').length

  // 검토 필요 판정의 적절성
  const flagged = (who) => (r) => (who === 'ai' ? ['needs_review', 'insufficient_evidence'].includes(r.aiStatus) : !r.ruleId)
  const review = (who) => {
    const f = inScope.filter(flagged(who))
    const appropriate = f.filter((r) => r.answerState === 'unclassifiable').length
    const unclassifiable = inScope.filter((r) => r.answerState === 'unclassifiable')
    const caught = unclassifiable.filter(flagged(who)).length
    return { flagged: f.length, appropriate, unclassifiable: unclassifiable.length, caught }
  }
  const rvAi = review('ai')
  const rvRule = review('rule')

  const byTask = {}
  for (const r of inScope.filter((x) => x.answerState === 'task')) {
    const e = (byTask[r.answerId] ??= { ai: [], rule: [] })
    if (r.aiId !== r.answerId) e.ai.push(`#${r.n} ${r.service} → ${label(r.aiId)}`)
    if (r.ruleId !== r.answerId) e.rule.push(`#${r.n} ${r.service} → ${label(r.ruleId)}`)
  }

  const lines = []
  const out = (s = '') => lines.push(s)
  out(`# 사용자 과업 분류 검증 결과`)
  out()
  out(`검수 파일: ${csvPath} · 검수 완료 ${judged.length}개 · 판단 보류 ${hold}개 · 미검수 ${pending}개`)
  out(`※ 아래 정확도는 디자이너가 정한 정답 기준이에요(AI·규칙의 단순 일치율이 아니에요). 분류 범위 밖으로 판정된 화면(${judged.length - inScope.length}개)은 과업 정확도에서 제외했어요.`)
  out()
  out(`## 대표 과업 정확도 (범위 안 ${inScope.length}개)`)
  out(`- AI: ${pct(aiOk, inScope.length)}`)
  out(`- 규칙 기반: ${pct(ruleOk, inScope.length)}`)
  out(`## 대분류 정확도 (정답이 세부 과업인 ${withCat.length}개)`)
  out(`- AI: ${pct(aiCat, withCat.length)}`)
  out(`- 규칙 기반: ${pct(ruleCat, withCat.length)}`)
  out(`## 분류 범위 밖 판정 (디자이너가 관련성을 직접 고른 ${relExplicit.length}개)`)
  out(`- 관련성 3분류 정확도: ${pct(relAcc, relExplicit.length)}`)
  out(`- 범위 밖 재현율(디자이너가 범위 밖이라 한 화면 중 AI도 범위 밖): ${pct(oosHit, oosTruth.length)}`)
  out(`- 범위 밖 정밀도(AI가 범위 밖이라 한 화면 중 디자이너도 범위 밖): ${pct(oosPrecise, oosPred.length)}`)
  out(`## 검토 필요 판정의 적절성`)
  out(`- AI: 검토 필요로 둔 ${rvAi.flagged}개 중 디자이너도 분류 불가 ${pct(rvAi.appropriate, rvAi.flagged)} · 분류 불가 ${rvAi.unclassifiable}개 중 AI가 걸러냄 ${pct(rvAi.caught, rvAi.unclassifiable)}`)
  out(`- 규칙: 검토 필요로 둔 ${rvRule.flagged}개 중 디자이너도 분류 불가 ${pct(rvRule.appropriate, rvRule.flagged)} · 분류 불가 ${rvRule.unclassifiable}개 중 규칙이 걸러냄 ${pct(rvRule.caught, rvRule.unclassifiable)}`)
  out(`## 과업별 오분류 사례 (정답 과업 기준)`)
  for (const [id, e] of Object.entries(byTask).sort((a, b) => b[1].ai.length + b[1].rule.length - a[1].ai.length - a[1].rule.length)) {
    if (!e.ai.length && !e.rule.length) continue
    out(`### ${label(id)} (${G[groupOf(id)]})`)
    if (e.ai.length) out(`- AI 오분류: ${e.ai.join(' / ')}`)
    if (e.rule.length) out(`- 규칙 오분류: ${e.rule.join(' / ')}`)
  }
  writeFileSync('docs/validation/report.md', lines.join('\n') + '\n')
  console.log(lines.join('\n'))
} finally {
  await vite.close()
}
