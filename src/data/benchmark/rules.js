// UI Bowl 메타데이터(패턴·세부 패턴·제목·UI 요소·화면 문구)로 화면을 분류하는 규칙이에요.
// 이미지를 직접 보고 판단한 결과가 아니라 "메타데이터 기반 자동 분류"예요. 분류마다 근거를 같이 남겨요.
// 규칙을 고치면 분류가 바로 바뀌어요(src/lib/benchmark.js 가 이 규칙을 읽어요).

// UI Bowl 패턴 → 화면 유형. 여기에 없는 패턴은 화면 유형을 추측하지 않고 '분류 안 됨'으로 둬요.
export const PATTERN_SCREEN_TYPE = {
  '메인': 'home-dashboard',
  '마이페이지': 'home-dashboard',
  '통계·리포트': 'home-dashboard',
  '계좌': 'home-dashboard',
  '내역': 'list',
  '목록 (PLP)': 'list',
  '검색': 'list',
  '설정': 'list',
  '공지사항': 'list',
  '고객센터·FAQ': 'list',
  '알림': 'list',
  '푸시알림': 'list',
  '북마크·위시리스트': 'list',
  '포인트': 'list',
  '혜택': 'list',
  '메뉴': 'list',
  '랭킹': 'list',
  '기획전·이벤트': 'list',
  '리뷰': 'list',
  '지도뷰·내주변': 'list',
  '쿠폰': 'list',
  '상세정보 (PDP)': 'detail',
  '멤버십·요금제': 'detail',
  '신청하기': 'form',
  '생성하기': 'form',
  '인증하기': 'form',
  '로그인·회원가입': 'form',
  '문의하기': 'form',
  '편집·수정하기': 'form',
  '글쓰기': 'form',
  '예약·결제': 'form',
  '약관동의': 'selection',
  '필터': 'selection',
  '비교하기': 'selection',
  '탐색': 'selection',
  '추천': 'selection',
  '간편결제': 'confirmation',
  '취소하기': 'confirmation',
  '조회하기': 'result',
  '온보딩': 'onboarding',
  '튜토리얼': 'onboarding',
}

// 이 UI 요소가 있으면 화면 유형을 덮어써요(오류·빈 화면이 가장 강한 신호, 완료 안내가 그다음).
export const ERROR_EMPTY_COMPONENTS = ['에러&실패', '빈 화면']
export const CONFIRMATION_COMPONENTS = ['완료&성공']

// UI Bowl UI 요소 → UI 패턴. 여기에 없는 요소(그래픽·배지·아이콘 등)는 패턴으로 보지 않아요.
export const COMPONENT_UI_PATTERN = {
  '카드': 'card',
  '캐러셀': 'card',
  '리스트': 'list',
  '테이블': 'list',
  '페이지네이션': 'list',
  '탭': 'tab',
  '아코디언': 'accordion',
  '바텀시트': 'bottom-sheet',
  '모달': 'modal',
  '팝업': 'modal',
  '스텝퍼': 'stepper',
  '타임라인': 'stepper',
  '텍스트 필드': 'form-field',
  '드롭다운': 'form-field',
  '날짜 피커': 'form-field',
  '시간 피커': 'form-field',
  '슬라이더': 'form-field',
  '토글&스위치': 'form-field',
  '라디오 버튼': 'radio-checkbox',
  '체크박스': 'radio-checkbox',
  '버튼': 'cta',
  '플로팅 버튼': 'cta',
  '상단 네비게이션': 'navigation',
  '하단 네비게이션': 'navigation',
  '메뉴': 'navigation',
  '검색 바': 'filter-sort',
  '칩': 'filter-sort',
  '프로그레스 인디케이터': 'progress',
  '로딩': 'progress',
  '스켈레톤': 'progress',
  '토스트&스낵바': 'feedback',
  '완료&성공': 'feedback',
  '에러&실패': 'feedback',
  '툴팁': 'feedback',
}

// UI Bowl 패턴 자체가 UI 패턴을 뜻하는 경우
export const PATTERN_UI_PATTERN = {
  '필터': 'filter-sort',
  '검색': 'filter-sort',
}

// 사용자 과업 규칙. patterns: UI Bowl 패턴이 일치하면 근거가 강해요(high).
// words: 세부 패턴·제목에 있으면 medium, 화면 문구(OCR)에만 있으면 low(참고용, 확정 태그로 쓰지 않아요).
// carOnly: 자동차·모빌리티·자동차금융 화면에서만 적용해요(금융 화면의 '견적' 등이 차량 견적으로 오분류되지 않게요).
export const TASK_RULES = [
  { task: 'check-limit', patterns: [], words: ['한도', '내한도', '대출조회', '대출 조회', '금리 조회', '금리조회', '내 대출'] },
  { task: 'compare-product', patterns: ['비교하기'], words: ['비교'] },
  { task: 'explore-product', patterns: ['탐색', '추천', '목록 (PLP)', '기획전·이벤트', '스토어'], words: ['상품 소개', '상품소개', '둘러보기'] },
  { task: 'verify-identity', patterns: ['인증하기'], words: ['본인인증', '본인 확인', '본인확인', '휴대폰 인증', '간편인증', '인증번호', '통신사'] },
  { task: 'enter-info', patterns: [], words: ['정보 입력', '정보입력', '주소 입력', '주소입력', '직업', '소득', '연락처', '이름 입력'] },
  { task: 'agree-terms', patterns: ['약관동의'], words: ['약관', '개인정보', '동의'] },
  { task: 'apply-contract', patterns: ['신청하기'], words: ['신청', '계약', '가입', '전자서명', '심사', '서명'] },
  { task: 'pay-repay', patterns: ['예약·결제', '간편결제'], words: ['결제', '상환', '납부', '납입', '이체', '명세서', '청구', '자동이체', '중도상환'] },
  { task: 'search-car', carOnly: true, patterns: [], words: ['차량 검색', '차종', '매물', '차량 조회', '차량 선택', '모델 선택', '트림', '내 차 찾기'] },
  { task: 'estimate-car', carOnly: true, patterns: [], words: ['견적', '월 납입', '리스', '렌트', '할부', '구독'] },
  { task: 'buy-car', carOnly: true, patterns: [], words: ['구매', '출고', '인수', '탁송', '계약서'] },
  { task: 'manage-car', carOnly: true, patterns: [], words: ['내 차', '마이카', '차량 관리', '정비', '자동차세', '보험', '주행', '충전', '연료'] },
  { task: 'sell-car', carOnly: true, patterns: [], words: ['판매', '팔기', '시세', '매입', '경매', '딜러', '입찰'] },
]

// 자동차금융 도메인 판정: 금융·자동차 화면에 이 단어와 차량 단어가 함께 있을 때
export const AUTO_FINANCE_WORDS = ['할부', '리스', '렌트', '오토론', '자동차 대출', '자동차대출', '자동차금융', '월 납입', '월납입', '캐피탈']
export const CAR_WORDS = ['차량', '자동차', '오토', '내 차', '내차']
