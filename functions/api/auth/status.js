import { getAuthStatus } from '../../_lib/uibowl.js'
import { json } from '../../_lib/guard.js'

// 데모 사이트가 실시간 UI Bowl 검색을 쓸 수 있는지 알려줘요. 토큰은 내보내지 않아요.
export async function onRequestGet({ env }) {
  if (!env.UXLENS_AUTH) return json({ connected: false })
  const { connected } = await getAuthStatus(env.UXLENS_AUTH)
  return json({ connected })
}
