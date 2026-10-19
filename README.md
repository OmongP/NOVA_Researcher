# UX Lens

> Explore UI. Inspect UX. — UI를 탐색하고, 사용자 경험을 검증하다.

타사 UI 레퍼런스를 탐색하고, UX 문제와 다크패턴을 분석하는 서비스예요. 다양한 서비스의 UI 화면을 수집·관리하고, 다크패턴 위험 요소를 검토해 더 나은 사용자 경험을 설계할 수 있도록 지원해요.

| 메뉴 | 역할 |
| --- | --- |
| **Explore** | 타사 UI 레퍼런스 탐색 및 수집 |
| **Archive** | 리서치 자료 및 검토 이력 보관·관리 |
| **Inspect** | 다크패턴 위험 요소 검토 및 UX 개선 가이드 |

탐색(Explore) → 검토(Inspect) → 자산화(Archive) 업무 흐름을 지원해요.

## 주요 기능

- **실제 UI 검색**: 자연어로 검색하면 [UI Bowl](https://uibowl.io) MCP에서 국내 금융·자동차·모빌리티 서비스의 실제 화면을 찾아요. 결과는 정확히 일치·관련 화면·관련성 낮음으로 나누고, 출처와 수집월을 함께 보여줘요.
- **Archive(보관함)**: 화면을 주제별 컬렉션에 저장하고 메모를 남겨, Markdown으로 내보낼 수 있어요. (브라우저에 저장)
- **Inspect(다크패턴 검토)**
  - 가이드 기준 사례 찾기: 규칙별로 UI Bowl에서 후보 화면을 찾고 판단기준 체크리스트로 검토해요.
  - 내 UI 검토하기 · AI 1차: 스크린샷을 올리면 Claude가 규칙과 대조해 위반 의심·기준 충족·판단 보류·해당 없음으로 분류하고, 근거 영역을 이미지 위에 표시해요.

AI 결과는 참고용 1차 검토예요. 법적 위반을 확정하지 않아요.

## 실행

```bash
npm install
npm run dev
```

`http://localhost:5173`에서 열려요. 화면(Vite)과 검색 서버(`server/index.js`, 8787 포트)가 함께 실행돼요.

### UI Bowl 연결

처음 실행하면 화면 상단의 "UI Bowl 로그인"으로 로그인해요. 토큰은 `server/.auth.json`에만 저장되고 저장소에는 올라가지 않아요. 로그인 전에는 샘플 화면으로 검색해요.

### AI 1차 검토 연결

서버가 다음 순서로 사용할 수 있는 방식을 자동으로 골라요. 인증 정보는 서버에만 있고 브라우저로 보내지 않아요.

| 순서 | 방식 | 설정 |
|---|---|---|
| 1 | Claude API | `server/.env`에 `ANTHROPIC_API_KEY` |
| 2 | Claude Code CLI | 터미널에서 `claude auth login` (필요하면 `CLAUDE_BIN`, `CLAUDE_REVIEW_MODEL` 지정) |
| 3 | Claude Code 대화 대기열 | 설정 없음. Claude Code 대화에서 `node server/saveReview.js`로 처리 |

설정 예시는 `server/.env.example`을 참고해요.

## 다크패턴 규칙

규칙은 `src/data/darkPatternRules.js`에서 읽어요.

- 저장소에는 공개용 예시 규칙(`darkPatternRules.example.js`)만 있어요.
- 처음 실행할 때 `darkPatternRules.js`가 없으면 예시를 복사해 만들어요.
- 조직의 실제 가이드는 같은 구조로 `darkPatternRules.js`에 작성하면 돼요. 이 파일은 `.gitignore`에 있어 공개 저장소에 올라가지 않아요.

## 저장소에 올리지 않는 파일

- `server/.auth.json`: UI Bowl 로그인 토큰
- `server/.env`: API 키·CLI 설정
- `reviews/`: AI 검토에 올린 화면과 결과
- `src/data/darkPatternRules.js`, `docs/rule-verification.md`: 조직 내부 가이드

## 기술 구성

React + Vite, Express, [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk), [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript), Zod
