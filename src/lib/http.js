// 서버가 재시작 중이거나 꺼져 있으면 응답 본문이 비어 있어요. 그때 JSON 파싱 오류 대신 안내를 보여줘요.
export async function readJson(res) {
  const text = await res.text()
  if (!text) {
    throw new Error('검색 서버가 응답하지 않아요. 서버가 다시 시작되는 중일 수 있으니 몇 초 뒤 다시 시도해 주세요 (계속되면 npm run dev 확인)')
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`서버 응답을 읽을 수 없어요 (HTTP ${res.status})`)
  }
}
