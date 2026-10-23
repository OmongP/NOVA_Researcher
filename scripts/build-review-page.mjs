// 디자이너 검수 페이지(docs/validation/task-review.html)를 만들어요. 데이터가 파일 안에 들어 있어서 파일 하나만 전달하면 돼요.
//   node scripts/build-review-page.mjs [결과.json=docs/validation/ai-results.json]
import { createServer } from 'vite'
import { readFileSync, writeFileSync } from 'node:fs'

const input = process.argv[2] ?? 'docs/validation/ai-results.json'
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { TASKS, TASK_GROUPS } = await vite.ssrLoadModule('/src/data/benchmark/taxonomy.js')
  const items = JSON.parse(readFileSync(input, 'utf8'))
  const data = { items, groups: TASK_GROUPS, tasks: TASKS, builtAt: new Date().toISOString() }
  const html = readFileSync('scripts/review-template.html', 'utf8').replace('/*__DATA__*/null', () => JSON.stringify(data).replace(/</g, '\\u003c'))
  writeFileSync('docs/validation/task-review.html', html)
  console.log(`검수 페이지 생성: docs/validation/task-review.html (${items.length}개)`)
} finally {
  await vite.close()
}
