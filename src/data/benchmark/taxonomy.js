// 벤치마킹 분류 체계(Light). 코드 수정 없이 이 파일만 고쳐서 항목을 추가·수정할 수 있어요.
// Level 1 도메인 → Level 2 사용자 과업 → Level 3 화면 유형 → Level 4 UI 패턴

export const DOMAINS = [
  { id: 'finance', name: 'Finance', label: '금융', description: '은행·카드·간편결제·투자 등 금융 서비스' },
  { id: 'automotive', name: 'Automotive', label: '자동차', description: '자동차 제조사·중고차·차량 관리 서비스' },
  { id: 'auto-finance', name: 'Auto Finance', label: '자동차금융', description: '할부·리스·렌트·자동차 대출 등 자동차 금융' },
  { id: 'mobility', name: 'Mobility', label: '모빌리티', description: '택시·카셰어링·이동 서비스' },
]

export const TASKS = [
  { id: 'explore-product', label: '상품 탐색', description: '상품·서비스를 둘러보고 고르는 과정' },
  { id: 'compare-product', label: '상품 비교', description: '여러 상품의 조건을 나란히 비교하는 과정' },
  { id: 'check-limit', label: '한도 조회', description: '대출·카드 한도와 금리를 조회하는 과정' },
  { id: 'verify-identity', label: '본인인증', description: '본인 확인·인증 절차' },
  { id: 'enter-info', label: '정보 입력', description: '신청에 필요한 정보를 입력하는 과정' },
  { id: 'agree-terms', label: '약관 동의', description: '약관·개인정보 동의 과정' },
  { id: 'apply-contract', label: '신청 및 계약', description: '상품 신청, 심사, 계약·가입' },
  { id: 'pay-repay', label: '결제 및 상환', description: '결제, 납부, 상환, 이체, 명세서 확인' },
  { id: 'search-car', label: '차량 검색', description: '차종·매물을 찾고 고르는 과정' },
  { id: 'estimate-car', label: '차량 견적', description: '차량 가격·월 납입금 견적' },
  { id: 'buy-car', label: '차량 구매', description: '차량 구매·계약·출고 과정' },
  { id: 'manage-car', label: '내 차 관리', description: '내 차 정보·정비·보험·세금 관리' },
  { id: 'sell-car', label: '차량 판매', description: '내 차 시세 조회·판매·매입' },
]

export const SCREEN_TYPES = [
  { id: 'home-dashboard', name: 'Home / Dashboard', label: '홈·대시보드', description: '서비스의 시작 화면이나 요약 화면' },
  { id: 'list', name: 'List', label: '목록', description: '항목을 나열해 보여주는 화면' },
  { id: 'detail', name: 'Detail', label: '상세', description: '하나의 대상을 자세히 보여주는 화면' },
  { id: 'form', name: 'Form', label: '입력 폼', description: '정보를 입력·신청하는 화면' },
  { id: 'selection', name: 'Selection', label: '선택', description: '여러 선택지 중 고르는 화면' },
  { id: 'confirmation', name: 'Confirmation', label: '확인', description: '진행 내용을 확인하거나 완료를 알리는 화면' },
  { id: 'result', name: 'Result', label: '결과', description: '조회·계산 결과를 보여주는 화면' },
  { id: 'error-empty', name: 'Error / Empty', label: '오류·빈 화면', description: '오류, 실패, 빈 상태 화면' },
  { id: 'onboarding', name: 'Onboarding', label: '온보딩', description: '처음 쓰는 사용자를 안내하는 화면' },
]

export const UI_PATTERNS = [
  { id: 'card', category: 'Content', name: 'Card', label: '카드', description: '정보를 카드 단위로 묶어 보여줘요' },
  { id: 'list', category: 'Content', name: 'List', label: '리스트', description: '리스트·표로 항목을 나열해요' },
  { id: 'tab', category: 'Navigation', name: 'Tab', label: '탭', description: '탭으로 내용을 나눠요' },
  { id: 'accordion', category: 'Content', name: 'Accordion', label: '아코디언', description: '접고 펼치는 영역' },
  { id: 'bottom-sheet', category: 'Overlay', name: 'Bottom Sheet', label: '바텀시트', description: '아래에서 올라오는 패널' },
  { id: 'modal', category: 'Overlay', name: 'Modal', label: '모달·팝업', description: '화면 위에 뜨는 대화상자나 팝업' },
  { id: 'stepper', category: 'Flow', name: 'Stepper', label: '스테퍼', description: '단계를 나눠 진행해요' },
  { id: 'form-field', category: 'Input', name: 'Form Field', label: '입력 필드', description: '텍스트·선택·날짜 등 입력 요소' },
  { id: 'radio-checkbox', category: 'Input', name: 'Radio / Checkbox', label: '라디오·체크박스', description: '선택형 입력 요소' },
  { id: 'cta', category: 'Action', name: 'CTA', label: 'CTA 버튼', description: '주요 행동을 유도하는 버튼' },
  { id: 'navigation', category: 'Navigation', name: 'Navigation', label: '내비게이션', description: '상단·하단 이동 영역과 메뉴' },
  { id: 'filter-sort', category: 'Input', name: 'Filter / Sort', label: '필터·정렬·검색', description: '조건을 좁히거나 정렬·검색해요' },
  { id: 'progress', category: 'Feedback', name: 'Progress Indicator', label: '진행 표시', description: '진행률·로딩 표시' },
  { id: 'feedback', category: 'Feedback', name: 'Feedback / Toast', label: '피드백·토스트', description: '토스트, 완료·오류 안내, 툴팁' },
]

export const VERIFICATION = [
  { id: 'verified', label: 'UI Bowl 확인', description: '화면 이미지와 원본 출처(UI Bowl 링크)를 수집 시점에 확인했어요' },
  { id: 'unverified', label: '확인 필요', description: '이미지나 출처 중 일부가 없어서 추가 확인이 필요해요' },
  { id: 'unavailable', label: '원본 확인 불가', description: '이미지와 출처를 모두 확인할 수 없어요' },
]

export const PLATFORMS = [
  { id: 'app', label: '앱' },
  { id: 'web', label: '웹' },
]

const index = (list) => Object.fromEntries(list.map((x) => [x.id, x]))
export const DOMAIN_BY_ID = index(DOMAINS)
export const TASK_BY_ID = index(TASKS)
export const SCREEN_TYPE_BY_ID = index(SCREEN_TYPES)
export const PATTERN_BY_ID = index(UI_PATTERNS)
export const VERIFICATION_BY_ID = index(VERIFICATION)
