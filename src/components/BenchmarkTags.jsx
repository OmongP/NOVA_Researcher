import { labelOf } from '../lib/benchmark'

// 카드에 보이는 분류 태그. 근거가 약한 과업(weakTaskIds)은 확정 태그로 보여주지 않아요.
export default function BenchmarkTags({ bm, compact = false }) {
  const tasks = compact ? bm.taskIds.slice(0, 2) : bm.taskIds
  const patterns = compact ? bm.patternIds.slice(0, 3) : bm.patternIds
  const hidden = compact ? Math.max(bm.taskIds.length - 2, 0) + Math.max(bm.patternIds.length - 3, 0) : 0
  const none = !bm.taskIds.length && !bm.screenTypeId && !bm.patternIds.length
  return (
    <div className="bm-tags" aria-label="분류 태그">
      {bm.companyName && <span className="chip bm-chip bm-company">{bm.companyName}</span>}
      {tasks.map((id) => (
        <span key={id} className="chip bm-chip bm-task">
          {labelOf.task(id)}
        </span>
      ))}
      {bm.screenTypeId && <span className="chip bm-chip bm-type">{labelOf.screenType(bm.screenTypeId)}</span>}
      {patterns.map((id) => (
        <span key={id} className="chip bm-chip bm-pattern">
          {labelOf.pattern(id)}
        </span>
      ))}
      {hidden > 0 && <span className="chip bm-chip bm-more">+{hidden}</span>}
      {none && <span className="chip bm-chip bm-none">분류 정보 부족</span>}
    </div>
  )
}
