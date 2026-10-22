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
- **Archive(보관함)**: 화면을 주제별 컬렉션에 저장하고 메모를 남겨, Markdown으로 내보낼 수 있어요. 컬렉션은 끌어서 순서를 바꿀 수 있어요.
  - **내 보관함**: 처음 접속할 때 입력한 이름 기준으로 서버 PC에 저장돼요. 이름은 로그인이 아니라 표시용이에요(같은 이름이면 같은 보관함이 열려요).
  - **팀 보관함**: 팀 모두가 함께 저장하고 메모를 고치는 공용 보관함이에요. 저장한 사람의 이름이 표시되고, 20초마다 최신 내용을 받아와요.
  - 이름이 없으면 예전처럼 접속 IP 기준 내 보관함만 써요. 사이트(Cloudflare)에서는 팀 코드를 입력하면 서버 PC의 보관함을 써요.
- **Inspect(다크패턴 검토)**
  - 가이드 기준 사례 찾기: 규칙별로 UI Bowl에서 후보 화면을 찾고 판단기준 체크리스트로 검토해요.
  - AI 다크패턴 사전 검토 (**지금은 화면에서 숨김**. 다시 켜려면 `VITE_SHOW_AI_REVIEW=1 npm run build`): 스크린샷을 올리면 Claude가 규칙과 대조해 위반 의심·기준 충족·판단 보류·해당 없음으로 분류하고, 근거 영역을 이미지 위에 표시해요.

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
- **보관함(Archive)**은 서버(`server/library/`)에 저장돼요. 내 보관함은 이름 기준(`u-…json`, 이름이 없으면 접속 IP 기준), 팀 보관함은 `_team.json` 하나예요. 팀 보관함은 여러 명이 동시에 저장해도 서로의 변경이 사라지지 않게 서버가 하나씩 순서대로 반영해요. 로그인이 없어서 이름만 알면 누구나 그 이름의 내 보관함을 열 수 있어요.
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

### 항상 켜 두기 (서버 PC로 쓰기)

사이트의 AI 검토는 `npm run share`가 켜진 PC에서 돌아요. 그 PC를 서버처럼 24시간 켜 두려면 이렇게 해요.

- **잠자기를 꺼요.** 전원에 연결된 상태에서 잠자기·최대 절전이 없어야 해요.
- **자동 재연결**: 터널이 끊기거나 응답이 없으면(1분마다 확인, 연속 3번 실패) 스스로 다시 연결하고 새 주소를 사이트에 알려요. 서버가 종료되면 프로그램 전체가 종료돼요.
- **Windows 자동 시작**: 프로젝트 폴더에서 PowerShell로 한 번 등록하면 로그인할 때마다 자동으로 켜져요.

```powershell
.\scripts\windows-autostart.ps1          # 등록 (잠자기도 꺼요. 건드리지 않으려면 -KeepSleepSettings)
Start-ScheduledTask -TaskName UX-Lens-Share   # 지금 바로 켜기
.\scripts\windows-autostart.ps1 -Remove   # 해제
```

로그는 프로젝트 폴더의 `share.log`에 쌓여요. 이 PC에서 `npm run dev`는 함께 켜지 마세요(같은 8787 포트를 써서 서버가 꺼져요).
처음 한 번은 직접 `npm run share`로 켜서 `http://localhost:8787`에서 UI Bowl 로그인을 해 두세요.

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
