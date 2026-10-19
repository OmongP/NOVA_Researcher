// 다크패턴 규칙 DB — 공개용 예시
//
// 이 파일은 저장소에 함께 올라가는 예시 규칙이에요. 실제 조직 가이드는 담지 않았어요.
// 앱은 src/data/darkPatternRules.js 를 읽어요. 그 파일이 없으면 `npm run dev`·`npm run build`가
// 이 예시를 복사해 만들어 줘요(scripts/ensure-rules.js). 사내 가이드는 darkPatternRules.js에
// 같은 구조로 작성하면 되고, 그 파일은 .gitignore에 있어 저장소에 올라가지 않아요.
//
// 이 도구는 다크패턴 여부를 확정하지 않아요. 규칙의 판단기준을 근거로
// "위반 의심 / 기준 충족 / 판단 보류 / 해당 없음" 검토를 돕고, 최종 판단은 검토자가 해요.

export const GUIDE = {
  title: '예시 다크패턴 가이드',
  version: 'sample',
  credit: '',
  figmaUrl: '',
  purpose: '화면의 모양이나 강조만으로 판단하지 않고, 고객의 선택에 미치는 영향을 기준으로 검토해요.',
  principle: '규칙에 적힌 정의·판단기준 범위에서만 판단하고, 비슷해 보인다는 이유로 넓혀 적용하지 않아요.',
}

export const FRAMEWORK = [
  { step: '01', key: 'Purpose', question: '이 화면에서 고객은 무엇을 결정하는가?', check: '화면의 목적과 고객의 실제 의사결정을 먼저 확인' },
  { step: '02', key: 'Information', question: '판단에 필요한 정보가 충분한가?', check: '비용·조건·불이익이 결정 시점에 보이는지 확인' },
  { step: '03', key: 'Choice', question: '거절·취소를 쉽게 고를 수 있는가?', check: '대안이 잘 보이고 불이익 없이 선택 가능한지 확인' },
]

export const TYPES = {
  오도형: '사실과 다르거나 오해하기 쉬운 화면·문구로 착각을 유도',
  방해형: '해지·취소처럼 고객이 원하는 행동을 어렵게 만듦',
  압박형: '심리적 압박으로 원하지 않는 결정을 유도',
}

export const VERDICTS = {
  suspect: { label: '위반 의심', desc: '판단기준에 해당하는 근거가 화면에서 확인돼요' },
  pass: { label: '기준 충족', desc: '기준을 충족하거나 예외에 해당해요' },
  hold: { label: '판단 보류', desc: '화면만으로는 판단할 수 없어 추가 정보가 필요해요' },
  na: { label: '해당 없음', desc: '이 규칙이 다루는 상황이 아니에요' },
}

// 필드 설명은 사내용 규칙 파일과 같아요.
// questions: 판단기준 / exceptions: 예외 / evidence: 화면만으로 확인할 수 없는 근거
// triggers: 화면 문구 단서 / searches: UI Bowl 검색 계획 / source.frame: 가이드 근거 표기
export const RULES = [
  {
    id: 'EX-01',
    type: '오도형',
    name: '선택 항목 기본 체크',
    framework: 'Choice',
    definition: '고객에게 부담이 생기는 선택 항목을 미리 체크해 두어 그대로 수용하게 하는 구성',
    questions: ['고객이 고르기 전에 선택 항목이 이미 체크돼 있는가?', '그대로 진행하면 의도하지 않은 동의·가입·비용이 생기는가?'],
    example: '마케팅 수신 동의가 기본으로 체크된 약관 화면',
    improvement: '선택 항목은 기본 체크를 해제해요',
    exceptions: [],
    evidence: ['화면 진입 시점의 초기 체크 상태'],
    triggers: ['(선택)', '마케팅'],
    searches: [{ tool: 'search_by_ocr_text', args: { text_query: '마케팅', component: '체크박스' } }],
    source: { frame: '예시 규칙', nodeId: '' },
  },
  {
    id: 'EX-02',
    type: '방해형',
    name: '해지 절차 방해',
    framework: 'Choice',
    definition: '가입보다 해지·탈퇴를 훨씬 어렵게 만들어 포기하게 하는 구성',
    questions: ['해지에 가입보다 과도한 단계가 필요한가?', '앱에서 가입했는데 해지는 상담으로만 가능한가?'],
    example: '해지 메뉴 없이 상담원 연결만 제공',
    improvement: '가입과 비슷한 수준으로 해지할 수 있게 해요',
    exceptions: ['고객 보호를 위한 확인 절차'],
    evidence: ['가입·해지 단계 수 비교'],
    triggers: ['해지', '탈퇴'],
    searches: [{ tool: 'search_ui_patterns', args: { query: '해지' } }],
    source: { frame: '예시 규칙', nodeId: '' },
  },
  {
    id: 'EX-03',
    type: '압박형',
    name: '다른 소비자 활동 알림',
    framework: 'Information',
    definition: '다른 고객의 조회·신청 수를 보여줘 조급함을 유도하는 구성',
    questions: ['다른 고객의 행동 정보로 서두르게 하는가?', '표시된 수치가 사실에 근거하고 검증 가능한가?'],
    example: '"지금 100명이 신청 중이에요"',
    improvement: '검증 가능한 실제 수치만 기준과 함께 보여줘요',
    exceptions: ['집계 기준과 시점을 함께 표시한 실제 통계'],
    evidence: ['수치의 실제 데이터 여부와 갱신 방식'],
    triggers: ['명이', '조회중', '신청 중'],
    searches: [{ tool: 'search_by_ocr_text', args: { text_query: '명이 신청' } }],
    source: { frame: '예시 규칙', nodeId: '' },
  },
]

export const FALSE_POSITIVES = [
  { title: '화면 목적과 일치하는 주요 버튼 강조', summary: '현재 과업의 핵심 행동을 강조하고 새 부담이 없으면 다크패턴으로 보지 않아요', source: '예시' },
]

export const OVERLAPS = []

export const ruleById = (id) => RULES.find((r) => r.id === id)
