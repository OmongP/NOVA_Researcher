// 로컬 검색 프록시 서버 (http://localhost:8787)
// 브라우저 앱 → 이 서버 → UI Bowl MCP 순서로 검색해요.
import express from 'express'
import { interpretQuery } from '../src/lib/searchQuery.js'
import { getAuthStatus, finishLogin, callTool } from './uibowl.js'
import { ruleById } from '../src/data/darkPatternRules.js'
import { cancelJob, getJob, getProviders, jobImagePath, recoverInterruptedJobs, retryJob, startReview } from './aiReview.js'

const PORT = 8787
const APP_URL = 'http://localhost:5173'

// UI Bowl에는 '자동차' 분류가 없고 자동차 브랜드 앱도 '모빌리티'에 들어 있어요.
// 아래 앱은 '자동차'로 다시 분류해요.
const AUTO_APPS = ['마이현대', '마이기아', '기아', '제네시스', '현대캐피탈', '현대자동차', 'KB차차차', '엔카', '헤이딜러', '케이카', '카눈', '차란차']

const CATEGORIES_BY_DOMAIN = {
  전체: ['금융', '모빌리티'],
  금융: ['금융'],
  자동차: ['모빌리티'],
  모빌리티: ['모빌리티'],
}

function classify(appName, category) {
  if (AUTO_APPS.some((name) => appName.includes(name))) return '자동차'
  return category === '금융' ? '금융' : '모빌리티'
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

  const categories = CATEGORIES_BY_DOMAIN[domain] ?? CATEGORIES_BY_DOMAIN.전체
  const calls = []
  for (const category of categories) {
    const base = { category, country: '한국' }
    if (query.component) {
      calls.push(['search_components', { ...base, component_type: query.component, limit: 8 }])
      continue
    }
    calls.push(['search_ui_patterns', { ...base, query: query.uibowl }])
    // 문구 검색은 '정확히 일치' 화면을 찾는 보조 검색이에요. 섞여 들어온 엉뚱한 화면은 적합도 판정에서 걸러요.
    if (query.ocr) calls.push(['search_by_ocr_text', { ...base, text_query: query.ocr.text, ...(query.ocr.pattern && { pattern: query.ocr.pattern }) }])
  }

  const settled = await Promise.allSettled(calls.map(([tool, args]) => callTool(tool, args).then((d) => toScreens(d, tool))))
  const screens = mergeScreens(settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : [])))
  const errors = settled.filter((r) => r.status === 'rejected').map((r) => r.reason.message)
  const filtered = domain === '전체' ? screens : screens.filter((s) => s.domain === domain)

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
