// 공개 데모 사이트(npm run build:demo)인지 여부. 데모에서는 서버 기능(실시간 검색·AI 검토)을 쓰지 않아요.
export const IS_DEMO = import.meta.env.MODE === 'demo'
