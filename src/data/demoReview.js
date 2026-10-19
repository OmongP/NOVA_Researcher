// 데모 사이트용 AI 1차 검토 샘플. 서버(Claude) 없이 화면 흐름만 체험하도록 미리 만든 결과예요.
// 실제 분석 결과가 아니고, 올린 스크린샷을 분석하지 않아요.
const W = 360
const H = 640

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="sans-serif">
<rect width="${W}" height="${H}" fill="#f4f6fa"/>
<rect y="0" width="${W}" height="56" fill="#fff"/><text x="20" y="35" font-size="17" font-weight="700" fill="#191f28">한도 조회</text>
<rect x="20" y="80" width="320" height="120" rx="12" fill="#fff"/><text x="36" y="116" font-size="14" fill="#6b7684">신청 금액</text><text x="36" y="152" font-size="22" font-weight="700" fill="#191f28">30,000,000원</text>
<rect width="${W}" height="${H}" fill="#000" opacity="0.45"/>
<rect y="330" width="${W}" height="310" rx="20" fill="#fff"/>
<text x="24" y="376" font-size="18" font-weight="700" fill="#191f28">맞춤 견적을 안내받을까요?</text>
<text x="24" y="404" font-size="13" fill="#6b7684">동의하시면 상담사가 연락드려요.</text>
<rect x="24" y="428" width="312" height="52" rx="10" fill="#f4f6fa"/><rect x="36" y="444" width="20" height="20" rx="4" fill="#fff" stroke="#c5cbd3"/><text x="66" y="460" font-size="13" fill="#4e5968">(선택) 마케팅 정보 수신 동의</text>
<rect x="24" y="500" width="312" height="52" rx="10" fill="#3182f6"/><text x="180" y="532" font-size="16" font-weight="700" fill="#fff" text-anchor="middle">네, 받아볼게요</text>
<text x="180" y="598" font-size="14" fill="#8b95a1" text-anchor="middle">다음에</text>
</svg>`

export const DEMO_SAMPLE_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
export const DEMO_SAMPLE_NAME = '샘플 화면 - 선택동의 재권유 바텀시트'

const b = (x, y, w, h) => ({ x: x / W, y: y / H, w: w / W, h: h / H })

export const DEMO_SAMPLE_RUN = {
  state: 'done',
  model: '데모 샘플 (실제 분석 아님)',
  analyzedAt: '2026-01-01T00:00:00.000Z',
  analysis: {
    screen: {
      purpose: '한도 조회 중 선택동의(마케팅 수신)를 권유하는 바텀시트예요.',
      decision: '마케팅 정보 수신(선택동의)에 동의할지 정하는 상황이에요.',
      stage: '동의',
    },
    texts: [
      { id: 'T1', text: '맞춤 견적을 안내받을까요?', role: 'title', box: b(24, 358, 220, 24) },
      { id: 'T2', text: '(선택) 마케팅 정보 수신 동의', role: 'checkbox_label', box: b(66, 446, 200, 18) },
      { id: 'T3', text: '네, 받아볼게요', role: 'primary_button', box: b(130, 516, 100, 22) },
      { id: 'T4', text: '다음에', role: 'text_button', box: b(160, 584, 40, 18) },
    ],
    components: [
      { id: 'C1', type: '체크박스', label: '(선택) 마케팅 정보 수신 동의', state: '체크 안 됨', box: b(24, 428, 312, 52) },
      { id: 'C2', type: '버튼', label: '네, 받아볼게요', state: '강조(Primary)', box: b(24, 500, 312, 52) },
      { id: 'C3', type: '버튼', label: '다음에', state: '약함(Text)', box: b(140, 576, 80, 32) },
    ],
    findings: [
      {
        ruleId: 'DP-M03',
        verdict: 'suspect',
        confidence: 'medium',
        summary: '동의 쪽만 Primary로 강조하고 거절은 텍스트로 약하게 보여 위반 의심으로 검토가 필요해요.',
        reasoning:
          'Decision: 고객은 마케팅 정보 수신(선택동의)에 동의할지 결정해요.\nInformation: 동의하면 상담사 연락과 마케팅 활용이 발생한다는 점이 화면에 안내돼 있어요.\nChoice: 거절(C3 "다음에")은 회색 텍스트로 보이지만 누를 수는 있어요.\nInfluence: 동의(C2)만 파란 Primary 버튼으로 강조되어 사업자에게 유리한 쪽이 두드러져요.\nObstruction: 거절을 어렵게 만드는 추가 단계는 이 화면에서 보이지 않아요.',
        questions: [
          { question: '사업자에게 유리하고 고객에게 추가 부담이나 영향을 주는가(비용, 선택 동의, 개인정보 제공 등)', answer: 'yes', basis: '선택동의(T2)에 동의하면 마케팅 정보 활용이 발생해요.' },
          { question: '특정 선택을 과도하게 강조하거나 반대 선택을 약화·은폐했는가?', answer: 'yes', basis: 'C2는 파란 Primary 버튼, C3(다음에)는 회색 텍스트예요.' },
        ],
        evidence: [{ elementIds: ['C2', 'C3'], box: b(24, 500, 312, 108), description: '강조된 동의 버튼과 약하게 처리된 거절 텍스트' }],
        guideRefs: ['DF_5', 'DF_17'],
        exceptionApplied: '',
        cannotVerify: ['이 화면 앞 단계에서 고객이 이미 거절했는지는 한 장의 화면으로 알 수 없어요.'],
        improvement: '"네, 받아볼게요 / 다음에"를 같은 수준의 두 버튼으로 제공해요.',
      },
      {
        ruleId: 'DP-P02',
        verdict: 'hold',
        confidence: 'low',
        summary: '이미 거절한 뒤의 재제안인지 확인이 필요해 판단을 보류해요.',
        reasoning:
          'Decision: 고객은 같은 선택동의를 다시 받아볼지 결정해요.\nInformation: 이전 단계에서 같은 동의를 거절했는지는 이 화면에서 알 수 없어요.\nChoice: 거절 선택지(C3)는 있어요.\nInfluence: 거절 이력이 있다면 재권유로 반복간섭이 될 수 있어요.\nObstruction: 해당하는 방해 요소는 보이지 않아요.',
        questions: [
          { question: '고객이 이미 거절한 선택을 다시 요구하는가?', answer: 'unknown', basis: '이전 단계의 거절 여부를 알 수 없어요.' },
        ],
        evidence: [{ elementIds: ['T1'], box: b(24, 358, 220, 48), description: '선택동의를 다시 권유하는 문구' }],
        guideRefs: ['DF_7', 'DF_10', 'DF_19'],
        exceptionApplied: '',
        cannotVerify: ['직전 화면에서 같은 선택동의를 거절했는지'],
        improvement: '',
      },
      {
        ruleId: 'DP-M04',
        verdict: 'pass',
        confidence: 'high',
        summary: '선택동의 체크박스가 미리 선택돼 있지 않아 기준을 충족해요.',
        reasoning:
          'Decision: 고객은 마케팅 수신 동의 여부를 선택해요.\nInformation: (선택) 표기가 있어 필수가 아님을 알 수 있어요.\nChoice: 체크박스(C1)가 체크되지 않은 상태로 노출돼요.\nInfluence: 사전 선택으로 동의를 유도하는 구성은 없어요.\nObstruction: 해당 없음.',
        questions: [
          { question: '고객이 선택하기 전에 특정 옵션이 미리 선택되어 있는가?', answer: 'no', basis: 'C1은 체크 안 됨 상태예요.' },
        ],
        evidence: [{ elementIds: ['C1'], box: b(24, 428, 312, 52), description: '체크되지 않은 선택동의 체크박스' }],
        guideRefs: ['DF_5'],
        exceptionApplied: '',
        cannotVerify: [],
        improvement: '',
      },
    ],
    notRelevant: ['DP-O01', 'DP-O03', 'DP-O04', 'DP-F01'],
    overall: {
      summary: '선택동의 바텀시트에서 동의 쪽만 강조된 점이 위반 의심이에요. 재제안 여부는 화면만으로 알 수 없어 보류했어요. 이 결과는 데모용 샘플이에요.',
      nextChecks: ['직전 단계에서 같은 선택동의를 거절했는지 확인해요.', '동의하기를 눌렀을 때 실제로 어떤 정보가 제공되는지 확인해요.'],
    },
  },
}
