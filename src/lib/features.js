// 기능 켜기/끄기. 숨긴 기능은 코드를 지우지 않고 이 스위치로만 가려요.
// AI 다크패턴 사전 검토: 지금은 숨김. 다시 켜려면 빌드할 때 VITE_SHOW_AI_REVIEW=1 을 붙여요.
//   예) VITE_SHOW_AI_REVIEW=1 npm run build        (로컬 서버 화면)
//       VITE_SHOW_AI_REVIEW=1 npm run build:demo   (사이트 배포용)
export const SHOW_AI_REVIEW = import.meta.env.VITE_SHOW_AI_REVIEW === '1'
