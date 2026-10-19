import { interpretQuery } from '../../src/lib/searchQuery.js'
import { runSearch } from '../../server/searchCore.js'
import { createCallTool } from '../_lib/uibowl.js'
import { json, sameSite } from '../_lib/guard.js'

export async function onRequestPost({ request, env }) {
  if (!sameSite(request)) return json({ error: '허용되지 않은 요청이에요' }, 403)
  const { q, domain = '전체' } = await request.json().catch(() => ({}))
  if (!interpretQuery(q ?? '')) return json({ error: '검색어가 비어 있어요' }, 400)
  try {
    const callTool = await createCallTool(env.UXLENS_AUTH)
    return json(await runSearch(q, domain, callTool))
  } catch (err) {
    return json({ error: err.message }, 502)
  }
}
