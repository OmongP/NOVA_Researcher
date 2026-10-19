// 대기열 방식 처리 도구 (Claude Code 대화에서 사용)
//   대기열 보기:   node server/saveReview.js list
//   분석 시작:     node server/saveReview.js claim <id>          → 웹 화면이 '분석 중'으로 바뀌어요
//   결과 저장:     node server/saveReview.js save <id> <analysis.json>  → '완료'
//   실패 기록:     node server/saveReview.js fail <id> "<사유>"   → '실패' (웹에서 재시도 가능)
// 결과는 앱과 같은 스키마로 검증한 뒤 저장해요.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { completeJob, failJob, readStatus, writeStatus } from './aiReview.js'

const INBOX = new URL('../reviews/inbox/', import.meta.url)
const [command, id, arg] = process.argv.slice(2)
const STATE = { queued: '대기 중', processing: '분석 중', done: '완료', failed: '실패' }

try {
  if (command === 'list') {
    const jobs = existsSync(INBOX) ? readdirSync(INBOX).map((d) => ({ id: d, ...readStatus(d) })) : []
    const open = jobs.filter((j) => j.state === 'queued' || j.state === 'processing')
    if (!open.length) console.log('처리할 검토 요청이 없어요')
    for (const j of open) {
      const req = JSON.parse(readFileSync(new URL(`${j.id}/request.json`, INBOX), 'utf8'))
      console.log(`${j.id}\t[${STATE[j.state]}]\t${fileURLToPath(new URL(`${j.id}/${req.image}`, INBOX))}\n${req.userText}\n`)
    }
  } else if (command === 'claim' && id) {
    writeStatus(id, { state: 'processing', error: '' })
    console.log(`${id}: 분석 중으로 표시했어요`)
  } else if (command === 'save' && id && arg) {
    const analysis = JSON.parse(readFileSync(arg, 'utf8'))
    completeJob(id, analysis, 'Claude Code (대화)')
    console.log(`${id}: 완료로 저장했어요 (규칙 ${analysis.findings.length}개 판정)`)
  } else if (command === 'fail' && id) {
    failJob(id, arg || 'Claude Code에서 처리하지 못했어요')
    console.log(`${id}: 실패로 표시했어요`)
  } else {
    console.log('사용법: node server/saveReview.js list | claim <id> | save <id> <analysis.json> | fail <id> "<사유>"')
    process.exit(1)
  }
} catch (err) {
  console.error(`오류: ${err.message}`)
  process.exit(1)
}
