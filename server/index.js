// 로컬 검색 프록시 서버 (http://localhost:8787)
// 브라우저 앱 → 이 서버 → UI Bowl MCP 순서로 검색해요.
import express from 'express'
import { interpretQuery } from '../src/lib/searchQuery.js'
import { getAuthStatus, finishLogin, callTool } from './uibowl.js'
import { ruleById } from '../src/data/darkPatternRules.js'
import { cancelJob, getJob, getProviders, jobImagePath, recoverInterruptedJobs, retryJob, startReview } from './aiReview.js'

const PORT = 8787
const APP_URL = 'http://localhost:5173'

// UI Bowl에는 '자동차' 분류가 없고 자동차 브랜드·차량 서비스 앱도 '모빌리티'에 들어 있어요.
// 아래 앱은 UI Bowl에 실제로 있는 자동차 앱이에요(2026-10 확인). 이 앱들은 '자동차'로 다시 분류해요.
const AUTO_APPS = ['마이현대', 'Kia', '헤이딜러', '차봇']

// 분야 탭별 검색 범위
//   전체: UI Bowl 전체(분류 제한 없음) / 금융: 금융 분류 / 모빌리티: 모빌리티 분류(자동차 앱 제외)
//   자동차: 자동차 앱 안에서만 검색
const SEARCH_SCOPES = {
  전체: [{}],
  금융: [{ category: '금융' }],
  모빌리티: [{ category: '모빌리티' }],
  자동차: AUTO_APPS.map((app_name) => ({ app_name })),
}
// 분류 제한이 넓은 탭은 2페이지까지 받아 결과를 넉넉하게 보여줘요(페이지당 3개).
const PAGES_BY_DOMAIN = { 전체: 2, 금융: 2, 모빌리티: 2, 자동차: 1 }
// 문구(OCR) 검색은 UI Bowl에서 결과가 수백 건까지 나와서(예: '가격 비교' 157건) 한 페이지(3건)로는 부족해요.
const OCR_PAGES = 3

// 한 앱의 화면이 앞쪽을 모두 차지하지 않도록 앱별로 번갈아 섞어요(같은 앱 안의 순서는 유지).
function interleaveByService(screens) {
  const groups = new Map()
  for (const s of screens) groups.set(s.service, [...(groups.get(s.service) ?? []), s])
  const lists = [...groups.values()]
  const out = []
  for (let i = 0; out.length < screens.length; i++) for (const list of lists) if (list[i]) out.push(list[i])
  return out
}

function classify(appName, category) {
  if (AUTO_APPS.some((name) => appName.includes(name))) return '자동차'
  return category || '기타'
}

// UI Bowl 응답(presentation.groups + results)을 앱 카드 형식으로 바꿔요.
function toScreens(data, sourceTool) {
  const groups = data.presentation?.groups ?? []
  return groups.map((group, i) => {
    const result = data.results?.[i] ?? {}
    const images = group.images ?? []
    return {
      id: `${sourceTool}-${group.id}`,
      service: group.app_name,
      domain: classify(group.app_name, group.category),
      category: group.category,
      pattern: group.pattern,
      variant: group.pattern_variant ?? '',
      title: group.pattern_variant || group.pattern,
      dataMonth: group.data_month,
      screenCount: group.total_screen_count ?? images.length,
      components: result.components ?? [],
      matchedTexts: result.matched_texts ?? [],
      image: images[0]?.url,
      images: images.map((img) => ({ id: img.id, url: img.url, uiUrl: img.ui_url })),
      uiUrl: group.ui_url,
      source: 'UI Bowl',
      sourceTool,
      sourceTools: [sourceTool],
      mau: result.mau ?? null,
    }
  })
}

// 패턴 검색과 문구 검색에서 같은 화면 묶음(앱·패턴·세부 패턴)이 나오면 하나로 합쳐요.
// 이미지는 먼저 들어온 쪽, 화면 문구와 출처 도구는 합집합으로 남겨요.
function mergeScreens(screens) {
  const byKey = new Map()
  for (const s of screens) {
    const key = `${s.service}|${s.pattern}|${s.variant}`
    const prev = byKey.get(key)
    if (!prev) {
      byKey.set(key, s)
      continue
    }
    prev.matchedTexts = [...new Set([...prev.matchedTexts, ...s.matchedTexts])]
    prev.sourceTools = [...new Set([...prev.sourceTools, ...s.sourceTools])]
    prev.components = prev.components.length ? prev.components : s.components
    if (s.sourceTool === 'search_ui_patterns') {
      prev.images = s.images
      prev.image = s.image
      prev.uiUrl = s.uiUrl
    }
  }
  return [...byKey.values()]
}

const app = express()
app.use(express.json({ limit: '25mb' }))

app.get('/api/auth/status', async (_req, res) => {
  res.json(await getAuthStatus())
})

app.get('/api/auth/callback', async (req, res) => {
  const { code, error } = req.query
  if (error || !code) return res.status(400).send(`UI Bowl 로그인 실패: ${error ?? 'code 없음'}`)
  try {
    await finishLogin(String(code))
    res.redirect(APP_URL)
  } catch (err) {
    res.status(500).send(`토큰 교환 실패: ${err.message}`)
  }
})

app.post('/api/search', async (req, res) => {
  const { q, domain = '전체' } = req.body ?? {}
  const query = interpretQuery(q ?? '')
  if (!query) return res.status(400).json({ error: '검색어가 비어 있어요' })

  const status = await getAuthStatus()
  if (!status.connected) return res.status(401).json(status)

  const scopes = SEARCH_SCOPES[domain] ?? SEARCH_SCOPES.전체
  const pages = PAGES_BY_DOMAIN[domain] ?? 1
  const calls = []
  for (const scope of scopes) {
    // 앱을 지정한 검색은 국가 제한을 걸지 않아요(Kia처럼 글로벌로 분류된 앱이 있어요).
    const base = scope.app_name ? { ...scope } : { ...scope, country: '한국' }
    if (query.component) {
      calls.push(['search_components', { ...base, component_type: query.component, limit: 8 }])
      continue
    }
    // UI Bowl 패턴 검색은 띄어쓰기에 민감해서("본인인증" 29건, "본인 인증" 32건) 붙인 형태·띄운 형태를 모두 검색하고,
    // 마지막에 앞 단어("주소 입력" → "주소")로 넓혀 찾아요. 어떤 결과가 얼마나 맞는지는 화면의 적합도 판정이 정해요.
    const patternQueries = [...new Set([query.uibowl, ...query.phrases, query.head].filter(Boolean))].slice(0, 5)
    patternQueries.forEach((q, i) => {
      const pagesFor = i === 0 ? pages : 1
      for (let page = 1; page <= pagesFor; page++) calls.push(['search_ui_patterns', { ...base, query: q, ...(page > 1 && { page }) }])
    })
    // 문구 검색은 '정확히 일치' 화면을 찾는 보조 검색이에요. 섞여 들어온 엉뚱한 화면은 적합도 판정에서 걸러요.
    // 사전에 정해 둔 문구가 없으면 여러 단어로 된 입력("주소 입력")에 한해 입력한 구절을 화면 속 문구로 찾아요.
    const ocrCall = (args, first) => {
      for (let page = 1; page <= (first ? OCR_PAGES : 1); page++) calls.push(['search_by_ocr_text', { ...base, ...args, ...(page > 1 && { page }) }])
    }
    if (query.ocr) ocrCall({ text_query: query.ocr.text, ...(query.ocr.pattern && { pattern: query.ocr.pattern }) }, true)
    else if (query.head) {
      // 입력 순서와 상관없이 같은 결과가 나오도록 띄어 쓴 형태를 먼저 써요.
      const ordered = [...query.phrases].sort((x, y) => Number(/\s/.test(y)) - Number(/\s/.test(x)))
      const ocrPhrases = scopes.length > 1 ? ordered.slice(0, 1) : ordered.slice(0, 2)
      ocrPhrases.forEach((text_query, i) => ocrCall({ text_query }, i === 0))
    }
  }

  const settled = await Promise.allSettled(calls.map(([tool, args]) => callTool(tool, args).then((d) => toScreens(d, tool))))
  const screens = mergeScreens(settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : [])))
  const errors = settled.filter((r) => r.status === 'rejected').map((r) => r.reason.message)
  const filtered = interleaveByService(domain === '전체' ? screens : screens.filter((s) => s.domain === domain))

  res.json({
    query,
    screens: filtered,
    dropped: screens.length - filtered.length,
    calls: calls.length,
    failedCalls: errors.length,
    errors,
    searchedAt: new Date().toISOString(),
  })
})

// 다크패턴 사례 검색: 규칙의 검색 계획대로 UI Bowl에서 후보 화면을 찾아요.
// UI Bowl에는 규칙의 검색어만 보내고, 사내 가이드 내용은 보내지 않아요.
app.post('/api/dark/search', async (req, res) => {
  const rule = ruleById(req.body?.ruleId)
  if (!rule) return res.status(400).json({ error: '규칙을 찾을 수 없어요' })

  const status = await getAuthStatus()
  if (!status.connected) return res.status(401).json(status)

  const calls = rule.searches.flatMap(({ tool, args }) => {
    const categories = args.category ? [args.category] : ['금융', '모빌리티']
    return categories.map((category) => [tool, { ...args, category, country: '한국', ...(tool === 'search_components' && { limit: 8 }) }])
  })

  const settled = await Promise.allSettled(calls.map(([tool, args]) => callTool(tool, args).then((d) => toScreens(d, tool))))
  const screens = mergeScreens(settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))).map((s) => {
    const text = [...s.matchedTexts, s.title, s.pattern].join(' ')
    return { ...s, triggerHits: rule.triggers.filter((t) => text.includes(t)) }
  })
  const errors = settled.filter((r) => r.status === 'rejected').map((r) => r.reason.message)

  res.json({
    ruleId: rule.id,
    screens,
    searches: calls.map(([tool, args]) => ({ tool, args })),
    calls: calls.length,
    failedCalls: errors.length,
    errors,
    searchedAt: new Date().toISOString(),
  })
})

// AI 1차 검토: 스크린샷과 가이드 규칙을 Claude API로 보내 참고용 판정을 받아요.
app.get('/api/ai/status', (_req, res) => {
  res.json(getProviders())
})

// 검토 요청: 작업을 만들고 바로 id·상태를 돌려줘요. 진행 상황은 /api/ai/jobs/:id로 확인해요.
app.post('/api/ai/analyze', (req, res) => {
  try {
    res.json(startReview(req.body ?? {}))
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/api/ai/jobs/:id', (req, res) => {
  try {
    res.json(getJob(req.params.id))
  } catch (err) {
    res.status(400).json({ state: 'failed', error: err.message })
  }
})

app.get('/api/ai/jobs/:id/image', (req, res) => {
  try {
    res.sendFile(jobImagePath(req.params.id))
  } catch {
    res.status(404).end()
  }
})

app.post('/api/ai/jobs/:id/retry', (req, res) => {
  try {
    res.json(retryJob(req.params.id))
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.delete('/api/ai/jobs/:id', (req, res) => {
  try {
    res.json(cancelJob(req.params.id))
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

recoverInterruptedJobs()

app.listen(PORT, () => {
  console.log(`[ux-finder] search proxy on http://localhost:${PORT}`)
})
