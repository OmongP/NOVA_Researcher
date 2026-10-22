// 기능 켜기/끄기. 가리는 기능은 코드를 지우지 않고 이 스위치로만 가려요.
//
// 빌드 종류
//   기본(nova-lens)      Explore · Archive · Inspect, AI 다크패턴 사전 검토 보임
//   VITE_HIDE_AI_REVIEW=1  AI 다크패턴 사전 검토만 숨김
//   VITE_LITE=1           Light(nova-lens-lite): 다크패턴 관련 화면(Inspect, AI 사전 검토)을 모두 숨기고 벤치마킹 기능만 보여줘요
//   예) VITE_LITE=1 npm run build:demo
export const IS_LITE = import.meta.env.VITE_LITE === '1'
export const SHOW_INSPECT = !IS_LITE
export const SHOW_AI_REVIEW = !IS_LITE && import.meta.env.VITE_HIDE_AI_REVIEW !== '1'
