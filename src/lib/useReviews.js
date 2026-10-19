// 다크패턴 검토 기록을 브라우저 로컬 저장소에 보관해요.
import { useEffect, useState } from 'react'
import { screenKey } from './useCollections'
import { ruleById, VERDICTS } from '../data/darkPatternRules'

const STORAGE_KEY = 'ux-finder:dp-reviews:v1'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

export const reviewKey = (ruleId, screen) => `${ruleId}::${screenKey(screen)}`

export function useReviews() {
  const [reviews, setReviews] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews))
    } catch {
      // 저장 실패 시에도 화면은 계속 동작해요.
    }
  }, [reviews])

  function saveReview(ruleId, screen, patch) {
    const key = reviewKey(ruleId, screen)
    setReviews((all) => {
      const prev = all[key] ?? { ruleId, answers: {}, exception: '', evidenceNote: '', memo: '', verdict: null }
      const { service, pattern, variant, title, image, uiUrl, dataMonth, source } = screen
      return {
        ...all,
        [key]: { ...prev, ...patch, screen: { service, pattern, variant, title, image, uiUrl, dataMonth, source }, updatedAt: new Date().toISOString() },
      }
    })
  }

  function removeReview(key) {
    setReviews((all) => {
      const next = { ...all }
      delete next[key]
      return next
    })
  }

  return { reviews, saveReview, removeReview }
}

// 검토 결과를 리포트용 Markdown으로 만들어요.
export function reviewsToMarkdown(reviews) {
  const lines = ['# 다크패턴 검토 결과', '', '> 사내 Dark Pattern Guide(26년도) 기준 검토예요. 최종 판단은 검토자 책임이며, 법적 판단이 아니에요.', '']
  for (const [, r] of Object.entries(reviews)) {
    const rule = ruleById(r.ruleId)
    const s = r.screen
    lines.push(`## ${s.service} — ${s.pattern} / ${s.title}`)
    lines.push(`- 적용 규칙: ${rule.id} ${rule.type} · ${rule.name}`)
    lines.push(`- 검토 결과: **${r.verdict ? VERDICTS[r.verdict].label : '미판정'}**`)
    rule.questions.forEach((q, i) => {
      const a = r.answers[i]
      lines.push(`  - ${q} → ${a ?? '미응답'}`)
    })
    if (r.exception) lines.push(`- 예외 해당: ${r.exception}`)
    if (r.evidenceNote) lines.push(`- 추가 확인 근거: ${r.evidenceNote}`)
    if (r.memo) lines.push(`- 메모·개선 방향: ${r.memo}`)
    lines.push(`- 출처: ${s.source ?? 'UI Bowl'} · 수집월 ${s.dataMonth ?? '미확인'} · ${s.uiUrl}`)
    lines.push(`- 가이드 근거: ${rule.source.frame}`)
    lines.push('')
  }
  return lines.join('\n')
}
