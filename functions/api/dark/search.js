// 사내 규칙 파일(src/data/darkPatternRules.js)의 검색 계획을 써요. 이 파일은 저장소에 없고 로컬에서 배포할 때만 번들에 들어가요.
import { ruleById } from '../../../src/data/darkPatternRules.js'
import { runDarkSearch } from '../../../server/searchCore.js'
import { createCallTool } from '../../_lib/uibowl.js'
import { json, sameSite } from '../../_lib/guard.js'

export async function onRequestPost({ request, env }) {
  if (!sameSite(request)) return json({ error: '허용되지 않은 요청이에요' }, 403)
  const { ruleId } = await request.json().catch(() => ({}))
  const rule = ruleById(ruleId)
  if (!rule) return json({ error: '규칙을 찾을 수 없어요' }, 400)
  try {
    const callTool = await createCallTool(env.UXLENS_AUTH)
    return json(await runDarkSearch(rule, callTool))
  } catch (err) {
    return json({ error: err.message }, 502)
  }
}
