# 버전 기록

UX Lens(구 NOVA Researcher)의 변경 이력이에요. 괄호 안은 git 커밋이에요(`git show <커밋>`으로 확인해요).

## v1.0 — 기준 버전 (2026-10-22)

**git 태그 `ux-lens-v1.0-team-archive` = 커밋 `07f92da`.** 이 상태로 돌아가려면 `git checkout ux-lens-v1.0-team-archive`.
사이트: https://nova-lens.pages.dev

이 버전에 들어 있는 것
- **Explore**: UI Bowl 실시간 검색(분야 탭별 범위, 띄어쓰기 유연, 관련도 3단계, 패턴+문구 검색), 추천검색어 8개, 저장(★).
- **Archive**: 내 보관함(이름 기준) + 팀 보관함(서버 PC 공용, 저장자 표시), 컬렉션 드래그 순서 변경, 메모, Markdown 복사.
- **Inspect**: 사내 가이드 15개 규칙 + 금융위·금감원 가이드라인 원문 요약, 사례 찾기, AI 다크패턴 사전 검토(Claude Code), 재검토·샘플 확인.
- **공유**: `npm run share`로 서버 PC를 사이트(Cloudflare)에 연결(터널 자동 재연결, 팀 코드), `npm run serve`로 사내망 공유.
- 디자인: 포인트 컬러 `#0066FF`(호버 `#0046B2`), Radius 4/8/12/16/half, 모바일 레이아웃 정리.

## 2026-10-22 — 버전 표시, AI 검토 숨김

- 화면의 버전 표시와 `package.json`을 **v1.0**으로 맞춤. 태그 `ux-lens-v1.0-team-archive`(`07f92da`)는 이 변경 이전 커밋이라 화면에는 `v0.3`으로 보여요.
- **AI 다크패턴 사전 검토를 화면에서 숨김.** 코드는 그대로 두고 `src/lib/features.js` 스위치로만 가려요. 다시 켜려면 `VITE_SHOW_AI_REVIEW=1 npm run build`(사이트는 `build:demo`)로 빌드해요. 서버 쪽 AI API와 `npm run share`는 그대로예요.

## 2026-10-21 — 팀 보관함, 안내 정리, 모바일

- 이름 기준 **내 보관함**과 **팀 공용 보관함** 추가: 서버 API, Cloudflare 프록시, 화면 (`0c94537`)
- AI 검토 안내 문구를 한 박스로 정리, ⚠️ 표시·문의 담당 표시 (`4c0a80f`, `655d305`)
- `share` 터널 주소 알리기 재시도, 서버가 켜져 있는 동안 Mac 잠자기 방지 (`1be8d46`)
- 모바일: Inspect 규칙 목록을 유형별 칩으로, Archive 상단 줄을 세로로 (`07f92da`)

## 2026-10-20 — 사이트 연결, 보관함 순서, 새 주소

- 사이트의 AI 검토를 내 PC의 Claude Code로 연결(Cloudflare Tunnel), 터널 자동 재연결·상태 확인 (`7bc32ae`)
- Windows에서도 쓸 수 있게 `share` 수정, 자동 시작 스크립트, PC 옮기기 안내 (`545ef72`, `7bc32ae`)
- 보관함 컬렉션 **순서 바꾸기**(드래그, Alt+↑↓), 저장 대화상자에서도 지원 (`30add3a`, `38875b0`)
- Cloudflare Pages 프로젝트를 **`nova-lens`**로 변경(주소 `nova-lens.pages.dev`), `--team-code` 옵션 (`dfa7696`)

## 2026-10-19 — 공개, 검색 고도화, 팀 공유

- 첫 커밋 **NOVA Researcher v0.3** (`55dc141`)
- 분야 탭(전체·금융·자동차·모빌리티)별 UI Bowl 검색 범위 분리 (`4310aa7`)
- 공개 데모 사이트(Cloudflare Pages) 추가, 미리 모은 화면 263개 → 633개로 확장 (`6d12006`, `18e9d13`, `e217345`)
- 검색어 띄어쓰기 유연 처리, 검색 고도화(문구 검색 페이지 확대, 일부 단어 일치는 "관련 화면") (`25ae0ba`, `60f2200`)
- 저장 대화상자 저장 확인 표시 (`0481ee1`)
- 화면 업로드 드래그 앤 드롭 오버레이·그래픽, 규칙 새 필드를 AI 프롬프트와 규칙 카드에 반영 (`581897d`)
- 데모 사이트가 실시간 검색 API가 있으면 UI Bowl 실시간 검색 사용 (`9ec7178`)
- 추천검색어를 실무 키워드 8개로 교체, 기본 검색어 "한도 조회" (`1e13fd2`)
- AI 검토 카드에서 판정·메모 수정 시 바로 재검토 (`05c54df`)
- 버튼·포인트 컬러 `#0066FF`, Radius 토큰 전체 적용, 탭 이름 변경(Explore · Archive · Inspect) (`2fee490`, `d1ac562`, `49ee412`)
- 사례 찾기 관련 문구에서 UI Bowl 표기 제거 (`50cf7cf`)
- 같은 사내망 팀 공유 모드(`npm run serve`) (`507151c`, `8f95544`)

## 저장소 이전 (git 이력 이전의 개발 단계)

- **v0.1** 검색창·필터·결과 카드 UI, UI Bowl MCP 로그인 연결
- **v0.2** 관련도 판정(정확히 일치 / 관련 화면 / 관련성 낮음), 출처·수집월 표시, 화면 상세 보기
- **v0.3** 보관함(컬렉션·메모), 다크패턴 Inspector(가이드 15개 규칙), AI 1차 판정(Claude API / Claude Code CLI / 대화 대기열), 앱 이름·아이콘

## 알려 두는 점

- 사내 가이드 파일(`src/data/darkPatternRules.js`)과 비밀값(`server/.env`, `server/.auth.json`)은 저장소에 없어요.
