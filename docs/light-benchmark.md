# UX Lens Light — 벤치마킹 (Phase 1)

금융·자동차 UX 벤치마킹에 특화한 버전이에요. 다크패턴 관련 기능(Inspect, AI 다크패턴 사전 검토)은 Light 화면과 번들에서 모두 빠져요.
사이트: https://nova-lens-lite.pages.dev (기존 `nova-lens`와 같은 코드에서 빌드 스위치로 갈라져요)

## 빌드·배포

```bash
npm run deploy:lite          # Light 빌드(VITE_LITE=1) 후 nova-lens-lite에 배포 — 배포는 승인 후에만
VITE_LITE=1 npm run build:demo   # 배포 없이 빌드만
npm run check:benchmark      # 수집된 화면의 분류 결과·분포 점검
```

Light 번들에는 사내 다크패턴 가이드 데이터가 들어가지 않아요(`VITE_LITE=1`이면 Inspect 화면 코드를 빌드에서 제외해요).
Cloudflare Functions(`functions/api/dark/search.js`)는 두 사이트가 공유해서 배포는 되지만, Light 화면에서는 호출하지 않아요.

## 데이터 구조 (Phase 1)

화면은 UI Bowl의 실제 화면 묶음이에요. 이미지는 **UI Bowl 원본 링크를 그대로 참조**하고 저장·복제하지 않아요. 별도 DB 서비스(D1·R2·Vectorize)는 아직 쓰지 않아요.

| 개체 | 위치 | 설명 |
|---|---|---|
| Company | `src/data/benchmark/companies.js` | 벤치마킹 대상 29개사(id, name, domain, country, officialWebsite, aliases). 목록은 이 파일만 고치면 돼요. |
| Service | 파생 | UI Bowl 앱 이름 → `기업id:앱이름`. `classify()`가 `serviceId`로 만들어요. |
| Pattern / Task / ScreenType / Domain | `src/data/benchmark/taxonomy.js` | UI 패턴 14, 사용자 과업 13, 화면 유형 9, 도메인 4 |
| Screen | `src/lib/benchmark.js` `toBenchmarkRecord()` | id, serviceId, imageUrl, sourceUrl, captureDate(UI Bowl 수집월), verificationStatus, screenType, taskIds, patternIds, analysis |
| ScreenTask | `bm.taskIds` | 화면 하나에 과업·패턴 여러 개(다대다) |

## 자동 분류 (메타데이터 기반)

`src/data/benchmark/rules.js`의 규칙으로 UI Bowl 메타데이터(패턴, 세부 패턴, 제목, UI 요소, 화면 문구)를 분류해요.
**이미지를 AI가 본 결과가 아니에요**(그건 Phase 2). 분류마다 근거(evidence)를 상세 보기에 같이 보여줘요.

- **사용자 과업**: 패턴이 맞으면 근거 강함, 세부 패턴·제목에 단어가 있으면 보통. **화면 문구에만 있는 단어는 근거 약함**이라 태그로 쓰지 않고 상세 보기에 "참고"로만 보여줘요. 차량 과업은 자동차·모빌리티·자동차금융 화면에서만 적용해요.
- **화면 유형**: 패턴 → 유형 표. 오류·빈 화면, 완료 안내 UI 요소가 있으면 그 유형이 우선이에요. 표에 없는 패턴은 추측하지 않고 "분류 안 됨"이에요.
- **UI 패턴**: UI Bowl UI 요소 → 패턴 표. UI 요소 정보가 없는 화면(수집 데이터의 약 70%)은 패턴이 비어 있어요. 이건 Phase 2의 이미지 분석으로 채워요.
- **도메인**: UI Bowl 분류 + 자동차 금융 문구(할부·리스·렌트 + 차량)면 자동차금융.
- **검증 상태**: 이미지와 UI Bowl 원본 링크가 모두 있으면 "UI Bowl 확인", 하나만 있으면 "확인 필요", 둘 다 없으면 "원본 확인 불가". 이 기준으로만 표시하고 그 이상을 주장하지 않아요.
- **웹/앱**: UI Bowl의 platform(MOBILE/WEB) 값을 써요. 아래 "남은 일" 참고.

## 현재 데이터 (633개 화면 묶음)

- 대상 29개사 중 **13개사**의 화면이 있어요(현대자동차 66, 헤이딜러 39, 기아 37, 토스 31, 신한은행 21, 카카오모빌리티 21, 쏘카 18, 네이버페이 14, 케이뱅크 6, 뱅크샐러드 5, 현대카드 3 등). 카카오뱅크·핀다·KB국민은행·삼성카드·캐피탈·엔카·K Car·KB차차차와 **해외 9개사는 아직 데이터가 없어요.** 필터의 기업 목록에 `(0)`으로 그대로 보여주고, 없는 화면을 만들어 보여주지 않아요.
- 이 수는 우리가 가진 수집본 기준이에요. UI Bowl에 더 있을 수 있어서 재수집이 필요해요(로그인 필요).
- 과업이 분류된 화면 약 43%. 나머지는 설정·알림·마이페이지처럼 특정 과업에 속하지 않는 화면이 많아요.

## Explore (Phase 1에서 구현)

- 필터: 기업(국내·해외·기타), 도메인, 사용자 과업, 화면 유형, UI 패턴, 검증 상태, 웹/앱(데이터가 있을 때), "벤치마킹 대상 기업만". 항목별 개수는 다른 필터를 적용한 상태 기준이에요.
- 검색어 없이 필터만으로 DB 둘러보기(24개씩 더 보기), 검색어 + 필터 조합.
- 카드: 실제 이미지, 기업, 과업·화면 유형·UI 패턴 태그, 수집월, 웹/앱, 검증 상태, 원본 링크. 상세 보기에 분류 근거.
- 빈 결과: "수집된 실제 화면이 없다는 뜻이에요"라고 알리고 대체 이미지를 만들지 않아요.
- 기존 UI Bowl 실시간 검색·저장(Archive)은 그대로예요.

## 남은 일 (이후 Phase)

- **웹/앱 구분 수집**: 서버가 UI Bowl platform 값을 가져오도록 고쳤어요(`server/searchCore.js`). 이미 모은 633개에는 값이 없어서 `node scripts/build-demo-data.js`로 **재수집**해야 채워져요(UI Bowl 로그인 필요).
- Phase 2 Analyze(이미지 AI 분석·태그 수정), Phase 3 Find Similar(시각 유사도는 별도 결정), Phase 4 Compare.
