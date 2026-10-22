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

// 사용자 과업 규칙(메타데이터 기반 1차 분류). 이미지를 직접 본 판단이 아니라서 보수적으로 써요.
// - task: 세부 과업 id. words가 세부 패턴·제목에 있으면 근거 high, UI Bowl 패턴만 맞으면 medium.
//   화면 문구(OCR)에만 단어가 있으면 low라서 확정하지 않고 '분류 검토 필요'로 둬요.
// - category: 세부 과업은 못 정하고 대분류만 알 수 있을 때(예: 패턴 '신청하기'). 상위 과업만 지정하고 '분류 검토 필요'로 표시해요.
// - carOnly: 자동차·모빌리티·자동차금융 화면에서만 적용해요(금융 화면의 '견적' 등이 차량 과업으로 오분류되지 않게요).
// 순서가 앞선 규칙이 같은 근거 수준일 때 대표 과업으로 우선해요. 유사 과업은 한쪽으로 단정하지 않아요
// (예: '한도'=금융 이용 가능 금액, '견적'=선택한 조건의 예상 비용, '월 납입'=월 납입금 계산).
export const TASK_RULES = [
  // 견적·한도 조회
  { task: 'ESTIMATION.LIMIT', words: ['한도', '내한도', '대출조회', '대출 조회', '대출 가능'] },
  { task: 'ESTIMATION.RATE', words: ['금리 조회', '금리조회', '내 금리'] },
  { task: 'ESTIMATION.MONTHLY_PAYMENT', words: ['월 납입', '월납입', '월 납부', '월 요금'] },
  { task: 'ESTIMATION.INSTALLMENT_QUOTE', words: ['할부 견적'] },
  { task: 'ESTIMATION.LEASE_QUOTE', words: ['리스 견적'] },
  { task: 'ESTIMATION.RENT_QUOTE', words: ['렌트 견적'] },
  { task: 'ESTIMATION.QUOTE_RESULT', words: ['견적 결과', '견적서'] },
  { task: 'ESTIMATION.VEHICLE_QUOTE', carOnly: true, words: ['견적'] },
  // 상품 탐색·비교
  { task: 'PRODUCT_DISCOVERY.COMPARE', words: ['상품 비교', '금리 비교', '조건 비교'] },
  { task: 'PRODUCT_DISCOVERY.EXPLORE', words: ['상품 소개', '상품소개'] },
  { task: 'PRODUCT_DISCOVERY.CAR_LOAN', words: ['자동차담보', '담보대출'] },
  { task: 'PRODUCT_DISCOVERY.OTHER_LOAN', words: ['신용대출', '주택담보', '주담대'] },
  { category: 'PRODUCT_DISCOVERY', patterns: ['비교하기'] },
  // 홈·맞춤 탐색
  { task: 'DISCOVERY.BENEFIT', patterns: ['혜택', '기획전·이벤트', '쿠폰', '포인트'], words: ['혜택', '이벤트', '프로모션'] },
  { task: 'DISCOVERY.RECENT', words: ['최근 본', '최근 조회'] },
  { category: 'DISCOVERY', patterns: ['메인', '추천', '탐색'] },
  // 차량 탐색·비교
  { task: 'VEHICLE_DISCOVERY.COMPARE', carOnly: true, words: ['트림 비교', '옵션 비교', '차량 비교', '모델 비교'] },
  { task: 'VEHICLE_DISCOVERY.SEARCH', carOnly: true, words: ['차량 검색', '매물', '차량 조회', '내 차 찾기', '중고차'] },
  { task: 'VEHICLE_DISCOVERY.BROWSE', carOnly: true, words: ['차종', '모델 선택', '트림'] },
  { task: 'VEHICLE_DISCOVERY.SPEC', carOnly: true, words: ['제원', '사양', '옵션'] },
  { task: 'VEHICLE_DISCOVERY.DETAIL', carOnly: true, patterns: ['상세정보 (PDP)'], words: ['차량 상세', '차량 정보'] },
  { task: 'VEHICLE_DISCOVERY.FAVORITE', carOnly: true, patterns: ['북마크·위시리스트'], words: ['관심 차량', '찜'] },
  { category: 'VEHICLE_DISCOVERY', carOnly: true, patterns: ['목록 (PLP)', '검색'] },
  // 신청·심사
  { task: 'APPLICATION.ELIGIBILITY', words: ['자격', '신청 가능', '가입 조건'] },
  { task: 'APPLICATION.IDENTITY', patterns: ['인증하기'], words: ['본인인증', '본인 확인', '본인확인', '휴대폰 인증', '간편인증', '인증번호', '통신사'] },
  { task: 'APPLICATION.PERSONAL_INFO', words: ['개인정보 입력', '주소 입력', '주소입력', '직업', '소득', '연락처', '이름 입력'] },
  { task: 'APPLICATION.APPLICATION_INFO', words: ['신청 정보', '신청서', '정보 입력', '정보입력'] },
  { task: 'APPLICATION.DOCUMENTS', words: ['서류', '증빙'] },
  { task: 'APPLICATION.HISTORY', words: ['신청 내역', '신청 현황'] },
  { task: 'APPLICATION.STATUS', words: ['심사 진행', '진행 현황', '심사 현황'] },
  { task: 'APPLICATION.RESULT', words: ['심사 결과', '승인 결과', '승인', '거절'] },
  { category: 'APPLICATION', patterns: ['신청하기'], words: ['신청', '심사'] },
  // 계약·실행
  { task: 'CONTRACT.AGREE', patterns: ['약관동의'], words: ['약관', '개인정보', '동의'] },
  { task: 'CONTRACT.SIGN', words: ['전자서명', '서명'] },
  { task: 'CONTRACT.COMPLETE', words: ['계약 완료', '가입 완료'] },
  { task: 'CONTRACT.EXECUTION', words: ['대출 실행', '금융 실행', '지급 결과'] },
  { task: 'CONTRACT.TERMS_CHECK', words: ['계약 조건'] },
  { task: 'CONTRACT.REVIEW', words: ['계약 정보', '계약 내용', '계약서'] },
  { category: 'CONTRACT', words: ['계약'] },
  // 결제·상환 관리
  { task: 'PAYMENT.PREPAY_QUOTE', words: ['중도상환 금액', '중도상환 수수료', '중도상환 조회'] },
  { task: 'PAYMENT.PREPAY_APPLY', words: ['중도상환', '상환 신청'] },
  { task: 'PAYMENT.UPCOMING', words: ['결제 예정', '납부 예정', '청구 금액'] },
  { task: 'PAYMENT.HISTORY', words: ['납부 내역', '결제 내역', '납입 내역'] },
  { task: 'PAYMENT.SCHEDULE', words: ['상환 일정', '납부 일정'] },
  { task: 'PAYMENT.DATE_CHANGE', words: ['결제일'] },
  { task: 'PAYMENT.ACCOUNT_CHANGE', words: ['결제 계좌', '출금 계좌'] },
  { task: 'PAYMENT.AUTOPAY', words: ['자동이체'] },
  { task: 'PAYMENT.PAY_NOW', words: ['즉시 납부', '납부하기'] },
  { task: 'PAYMENT.OVERDUE', words: ['연체', '미납'] },
  { category: 'PAYMENT', patterns: ['예약·결제', '간편결제'], words: ['결제', '상환', '납부', '납입', '명세서', '청구', '이체'] },
  // 계약·자산 관리
  { task: 'ASSET_MANAGEMENT.CONTRACT_DETAIL', words: ['계약 상세'] },
  { task: 'ASSET_MANAGEMENT.CONTRACTS', words: ['내 계약', '계약 조회', '대출 현황', '내 대출', '금융계약'] },
  { task: 'ASSET_MANAGEMENT.BALANCE', words: ['잔여 원금', '잔액'] },
  { task: 'ASSET_MANAGEMENT.CONTRACT_CHANGE', words: ['계약 변경'] },
  { task: 'ASSET_MANAGEMENT.MATURITY', words: ['만기'] },
  { task: 'ASSET_MANAGEMENT.EXTEND_END', words: ['연장', '해지', '해약', '철회'] },
  { task: 'ASSET_MANAGEMENT.CERTIFICATE', words: ['증명서', '완납', '확인서'] },
  { task: 'ASSET_MANAGEMENT.MY_CAR', carOnly: true, words: ['내 차 정보', '마이카'] },
  { task: 'ASSET_MANAGEMENT.ASSET_OVERVIEW', words: ['자산 현황'] },
  { category: 'ASSET_MANAGEMENT', patterns: ['계좌', '내역', '취소하기'] },
  // 차량 관리·처분
  { task: 'VEHICLE_MANAGEMENT.COST', carOnly: true, words: ['유지비', '자동차세', '과태료', '주유', '충전'] },
  { task: 'VEHICLE_MANAGEMENT.MAINTENANCE', carOnly: true, words: ['정비', '점검', '소모품', '수리'] },
  { task: 'VEHICLE_MANAGEMENT.INSURANCE', carOnly: true, words: ['보험'] },
  { task: 'VEHICLE_MANAGEMENT.SELL_QUOTE', carOnly: true, words: ['판매 견적', '매입가', '딜러', '입찰', '경매'] },
  { task: 'VEHICLE_MANAGEMENT.SELL_APPLY', carOnly: true, words: ['판매', '팔기'] },
  { task: 'VEHICLE_MANAGEMENT.VALUATION', carOnly: true, words: ['시세'] },
  { task: 'VEHICLE_MANAGEMENT.RETURN', carOnly: true, words: ['반납'] },
  { task: 'VEHICLE_MANAGEMENT.DISPOSAL_TERMS', carOnly: true, words: ['처분', '폐차', '차량 인수'] },
  // 계정·고객지원
  { task: 'ACCOUNT_SUPPORT.LOGIN', patterns: ['로그인·회원가입'], words: ['로그인', '회원가입'] },
  { task: 'ACCOUNT_SUPPORT.AUTH_METHOD', words: ['인증수단', '비밀번호', '생체'] },
  { task: 'ACCOUNT_SUPPORT.NOTIFICATION', words: ['알림 설정'] },
  { task: 'ACCOUNT_SUPPORT.CONSULT', words: ['상담'] },
  { task: 'ACCOUNT_SUPPORT.FAQ', patterns: ['고객센터·FAQ'], words: ['FAQ', '챗봇', '도움말'] },
  { task: 'ACCOUNT_SUPPORT.INQUIRY', patterns: ['문의하기'], words: ['문의', '고객센터'] },
  { task: 'ACCOUNT_SUPPORT.PROFILE', words: ['계정', '내 정보', '본인정보'] },
  { category: 'ACCOUNT_SUPPORT', patterns: ['설정'] },
]

// 자동차금융 도메인 판정: 금융·자동차 화면에 이 단어와 차량 단어가 함께 있을 때
export const AUTO_FINANCE_WORDS = ['할부', '리스', '렌트', '오토론', '자동차 대출', '자동차대출', '자동차금융', '월 납입', '월납입', '캐피탈']
export const CAR_WORDS = ['차량', '자동차', '오토', '내 차', '내차']
