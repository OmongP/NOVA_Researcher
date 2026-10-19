// 다른 사이트가 이 검색 API를 가져다 쓰지 못하게 같은 사이트에서 온 요청만 받아요.
export function sameSite(request) {
  const origin = request.headers.get('origin') ?? request.headers.get('referer')
  if (!origin) return false
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } })
