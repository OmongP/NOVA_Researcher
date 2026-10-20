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
  - AI 다크패턴 사전 검토: 스크린샷을 올리면 Claude가 규칙과 대조해 위반 의심·기준 충족·판단 보류·해당 없음으로 분류하고, 근거 영역을 이미지 위에 표시해요.

AI 결과는 참고용 1차 검토예요. 법적 위반을 확정하지 않아요.

## 실행

```bash
npm install
npm run dev
```

`http://localhost:5173`에서 열려요. 화면(Vite)과 검색 서버(`server/index.js`, 8787 포트)가 함께 실행돼요.

### 팀 공유 (같은 사내망)

서버를 켠 PC 하나에서 화면과 검색·AI 서버를 함께 열어, 같은 사내망의 팀원이 브라우저로 접속해요.

```bash
npm run serve   # 화면을 새로 빌드하고 시작 (이미 빌드했다면 npm start)
```

시작할 때 접속 주소가 출력돼요(예: `http://172.30.1.62:8787`). 팀원은 그 주소를 열면 돼요.

- **이 PC가 켜져 있고 서버가 실행 중일 때만** 접속돼요. 회사 방화벽이 8787 포트를 막으면 IT에 열어 달라고 요청해요.
- 로그인이 없어서 사내망에서 주소를 아는 사람은 누구나 써요. 외부 인터넷에는 열지 마세요.
- **UI Bowl 로그인**과 **Claude Code(AI 검토) 로그인**은 서버를 켠 PC의 계정 하나를 팀원이 함께 써요. UI Bowl 로그인은 서버 PC에서 한 번 해 두면 돼요.
- **보관함(Archive)**은 접속한 PC의 IP별로 서버(`server/library/`)에 저장돼요. 같은 IP를 쓰는 사람끼리는 같은 보관함을 봐요.
- 사내 가이드 파일(`src/data/darkPatternRules.js`)은 서버 PC에만 있으면 돼요.
- 이 PC에서만 쓰려면 `HOST=127.0.0.1 npm start`로 시작해요.

### 다른 PC로 옮기기 (Windows 기준)

사이트의 AI 검토를 다른 PC에서 돌리고 싶을 때예요. **한 번에 한 PC에서만** `npm run share`를 켜요(나중에 켠 PC가 사이트의 연결 주소를 덮어써요).

1. **코드 받기**: Node.js(22 이상)를 설치하고 저장소를 받아 `npm install`을 실행해요.
2. **사내 가이드 파일 복사**: `src/data/darkPatternRules.js`는 저장소에 없어요. 기존 PC에서 같은 위치로 직접 복사해요(없으면 예시 규칙으로 켜져요).
3. **Claude Code 설치 후 로그인**: 공식 설치 방법으로 설치하고 `claude auth login`을 해요. `claude-opus-5-5`를 쓰려면 2.1.280 이상이어야 해요. `claude`를 못 찾으면 `server/.env`에 `CLAUDE_BIN=C:\경로\claude.exe`를 적어요(`.cmd` 파일은 지정하지 마세요. 긴 지시문이 잘려요).
4. **터널 프로그램**: PowerShell에서 `winget install Cloudflare.cloudflared`. PATH에서 못 찾으면 `server/.env`에 `CLOUDFLARED_BIN=C:\경로\cloudflared.exe`를 적어요.
5. **비밀키 복사**: 기존 PC의 `server/.env` 에 있는 `AI_PROXY_SECRET=...` 줄을 새 PC의 `server/.env`에 그대로 붙여 넣어요. Cloudflare에 저장된 값과 같아야 해요. **`npm run share -- --setup`을 다시 실행하지 마세요.** 비밀키와 팀 코드가 새로 바뀌어요.
6. **Cloudflare 로그인**: `npx wrangler login` (터널 주소를 사이트에 알릴 때 필요해요).
7. **UI Bowl 로그인**: `npm run share`로 켠 뒤 `http://localhost:8787`에서 상단 "UI Bowl 로그인"을 해요. `server/.auth.json`은 복사하지 마세요(토큰이 갱신될 때마다 바뀌어서 두 PC가 서로 로그아웃시켜요).
8. **실행**: `npm run share` — "터널 연결 완료"가 나오면 사이트에서 AI 검토가 돼요.

> Windows 지원은 Mac에서 만든 스크립트를 고쳐 둔 것이라 아직 Windows에서 직접 실행해 보지는 않았어요. 막히면 터미널에 나온 오류 문구를 알려 주세요.

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
