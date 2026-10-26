# 이어서 작업하기 (2026-10-26 기준)

다른 PC나 새 Claude 대화에서 이어갈 때 먼저 읽는 문서예요. Claude에게 "docs/HANDOFF.md 읽고 이어서 하자"라고 하면 돼요.

## 지금 상태

- 사이트: https://nova-lens-lite.pages.dev (Light, 다크패턴 기능 없음) — 마지막 배포 커밋 `3a24a91`
- 서비스명: 자동차•금융 UX 벤치마킹

| 커밋 | 내용 |
| --- | --- |
| `ccfb667` | Explore 상세 필터를 480px 팝오버(모바일 바텀시트)로. 과업은 대분류 10개 → 세부 과업 2단 체크 행. 패널 안 선택은 '결과 N개 보기'로 적용, Esc·바깥 클릭은 취소. 적용 조건은 결과 위 칩. 건수는 결과 수와 같은 기준 |
| `bd4ef51` | 사이트에서 화면 분석(Analyze)을 서버 PC로 연결(`functions/api/analyze.js`, 팀 코드 필요) |
| `3a24a91` | 기업 필터를 금융 / 자동차금융 / 자동차 / 모빌리티 / 기타로 묶음, 주요 앱 13곳 추가(기타 380 → 208개) |

## 사이트가 동작하려면

- **AI 기능(화면 분석·AI 검토·팀 보관함)**: 서버 PC(사용자 Mac)에서 `npm run share`가 켜져 있어야 해요.
- **UI Bowl 실시간 검색**: Cloudflare KV의 클라우드 로그인을 써요. 사이트가 "샘플 화면으로 검색해요"로 돌아가면 `node scripts/cloud-auth.js`로 다시 로그인해요(브라우저는 자동으로 안 열려요. 10분 안에 로그인해야 해요).
- 검색어 없이 처음 보이는 화면은 미리 모아 둔 681개(`src/data/demoScreens.js`)예요. UI Bowl에는 전체 목록을 받는 기능이 없어요.

## 작업 규칙

- 배포는 매번 승인 후: `npm run deploy:lite` (기본 사이트는 `npm run deploy`)
- **배포 중(1~2분)에는 커밋하지 않아요.** 배포 스크립트가 `wrangler.jsonc`의 name을 잠깐 바꿔서 커밋에 섞여요.
- `npm run dev`와 `npm run share`는 같은 8787 포트라 동시에 켜지 않아요. 화면만 볼 땐 `VITE_LITE=1 npx vite --mode demo --port 5174`.

## 남은 할 일 후보

1. 681개 데모 데이터를 최신 UI Bowl로 다시 모으기(`node scripts/build-demo-data.js`, 로컬 UI Bowl 로그인 필요)
2. 자동차금융: UI Bowl에 캐피탈사 앱이 없어서 기업 기준으로는 비어 있어요. 화면 기준(예: 자동차담보대출 화면)으로 보여줄지 정하기
3. 기타 서비스 208개 중 더 넣을 기업 정하기(가상자산 앱은 일부러 뺐어요)

## 관련 프로젝트

`../ux-research-agent` — 같은 데이터로 회사별 화면 검색·화면 분석을 하는 Claude Agent SDK 에이전트(커밋 `202c660`). 아직 GitHub에 올리지 않았어요(GitHub Desktop에서 Publish 필요). 화면 분석 분류 체계는 이 저장소의 `src/data/benchmark/taxonomy.js`를 복사해 쓰고 있어서, 고칠 땐 양쪽을 같이 고쳐요.
