// 벤치마킹 분류 체계(Light). 코드 수정 없이 이 파일만 고쳐서 항목을 추가·수정할 수 있어요.
// Level 1 도메인 → Level 2 사용자 과업 → Level 3 화면 유형 → Level 4 UI 패턴

export const DOMAINS = [
  { id: 'finance', name: 'Finance', label: '금융', description: '은행·카드·간편결제·투자 등 금융 서비스' },
  { id: 'automotive', name: 'Automotive', label: '자동차', description: '자동차 제조사·중고차·차량 관리 서비스' },
  { id: 'auto-finance', name: 'Auto Finance', label: '자동차금융', description: '할부·리스·렌트·자동차 대출 등 자동차 금융' },
  { id: 'mobility', name: 'Mobility', label: '모빌리티', description: '택시·카셰어링·이동 서비스' },
]

// 사용자 과업 Taxonomy. 사용자가 달성하려는 '목적'만 기준으로 해요(화면 유형·UI 패턴과 섞지 않아요).
// 실제 앱 메뉴와 1:1로 연결하지 않아요: 한 메뉴가 여러 과업에 걸칠 수 있고, 같은 과업이 여러 서비스에 나타나요.
// id는 바뀌지 않는 고유값이에요(화면·태그는 id로 연결해요). 이름(label)은 바꿔도 연결이 유지돼요.
// synonyms는 검색어를 표준 과업으로 정규화할 때 써요. 화면이 확보되지 않은 과업도 여기엔 남겨요(검색 결과가 있는 것처럼 보이지 않아요).
export const TASK_GROUPS = [
  { id: 'DISCOVERY', label: '홈·맞춤 탐색' },
  { id: 'VEHICLE_DISCOVERY', label: '차량 탐색·비교' },
  { id: 'ESTIMATION', label: '견적·한도 조회' },
  { id: 'PRODUCT_DISCOVERY', label: '상품 탐색·비교' },
  { id: 'APPLICATION', label: '신청·심사' },
  { id: 'CONTRACT', label: '계약·실행' },
  { id: 'PAYMENT', label: '결제·상환 관리' },
  { id: 'ASSET_MANAGEMENT', label: '계약·자산 관리' },
  { id: 'VEHICLE_MANAGEMENT', label: '차량 관리·처분' },
  { id: 'ACCOUNT_SUPPORT', label: '계정·고객지원' },
]

export const TASKS = [
  // 홈·맞춤 탐색
  { id: 'DISCOVERY.RECOMMEND', group: 'DISCOVERY', label: '맞춤형 차량·상품 추천 확인', synonyms: ['맞춤 추천', '추천 상품', '맞춤형', '추천 차량'] },
  { id: 'DISCOVERY.CONTENT', group: 'DISCOVERY', label: '관심 콘텐츠 탐색', synonyms: ['콘텐츠', '매거진', '관심 콘텐츠'] },
  { id: 'DISCOVERY.BENEFIT', group: 'DISCOVERY', label: '혜택·이벤트 확인', synonyms: ['혜택', '이벤트', '프로모션'] },
  { id: 'DISCOVERY.RECENT', group: 'DISCOVERY', label: '최근 조회 항목 확인', synonyms: ['최근 본', '최근 조회'] },
  { id: 'DISCOVERY.SHORTCUT', group: 'DISCOVERY', label: '주요 서비스 바로가기', synonyms: ['바로가기', '퀵메뉴', '주요 서비스'] },
  // 차량 탐색·비교
  { id: 'VEHICLE_DISCOVERY.SEARCH', group: 'VEHICLE_DISCOVERY', label: '차량 검색', synonyms: ['차량 검색', '중고차 검색', '매물 검색', '차 찾기', '내 차 찾기'] },
  { id: 'VEHICLE_DISCOVERY.BROWSE', group: 'VEHICLE_DISCOVERY', label: '차종·모델 탐색', synonyms: ['차종', '모델 탐색', '차량 목록', '모델 선택'] },
  { id: 'VEHICLE_DISCOVERY.DETAIL', group: 'VEHICLE_DISCOVERY', label: '차량 상세 정보 확인', synonyms: ['차량 상세', '차량 정보'] },
  { id: 'VEHICLE_DISCOVERY.COMPARE', group: 'VEHICLE_DISCOVERY', label: '모델·트림·옵션 비교', synonyms: ['트림 비교', '옵션 비교', '차량 비교', '모델 비교'] },
  { id: 'VEHICLE_DISCOVERY.SPEC', group: 'VEHICLE_DISCOVERY', label: '차량 가격·제원 확인', synonyms: ['제원', '차량 가격', '사양'] },
  { id: 'VEHICLE_DISCOVERY.FAVORITE', group: 'VEHICLE_DISCOVERY', label: '관심 차량 등록·조회', synonyms: ['관심 차량', '찜', '위시리스트'] },
  // 견적·한도 조회
  { id: 'ESTIMATION.VEHICLE_QUOTE', group: 'ESTIMATION', label: '차량 구매 견적 조회', synonyms: ['구매 견적', '차량 견적', '차량 가격 견적'] },
  { id: 'ESTIMATION.INSTALLMENT_QUOTE', group: 'ESTIMATION', label: '할부 견적 조회', synonyms: ['할부 견적', '할부 조회'] },
  { id: 'ESTIMATION.LEASE_QUOTE', group: 'ESTIMATION', label: '리스 견적 조회', synonyms: ['리스 견적'] },
  { id: 'ESTIMATION.RENT_QUOTE', group: 'ESTIMATION', label: '렌트 견적 조회', synonyms: ['렌트 견적'] },
  { id: 'ESTIMATION.MONTHLY_PAYMENT', group: 'ESTIMATION', label: '월 납입금 계산', synonyms: ['월 납입금', '월 납입액', '매달 내는 돈', '할부 월금액', '월 납입', '월 납부액'] },
  { id: 'ESTIMATION.CONDITION_ADJUST', group: 'ESTIMATION', label: '금융 조건 조정', synonyms: ['선수금', '계약 기간', '조건 조정', '잔존가치'] },
  { id: 'ESTIMATION.LIMIT', group: 'ESTIMATION', label: '대출 한도 조회', synonyms: ['한도 조회', '한도 확인', '대출 가능 금액', '얼마까지 빌릴', '대출 한도', '한도조회', '내 한도'] },
  { id: 'ESTIMATION.RATE', group: 'ESTIMATION', label: '대출 금리 조회', synonyms: ['금리 조회', '금리 확인', '대출 금리', '내 금리'] },
  { id: 'ESTIMATION.QUOTE_RESULT', group: 'ESTIMATION', label: '견적 결과 확인', synonyms: ['견적 결과', '견적서'] },
  // 상품 탐색·비교
  { id: 'PRODUCT_DISCOVERY.EXPLORE', group: 'PRODUCT_DISCOVERY', label: '자동차금융 상품 탐색', synonyms: ['상품 탐색', '금융 상품', '자동차금융 상품'] },
  { id: 'PRODUCT_DISCOVERY.COMPARE', group: 'PRODUCT_DISCOVERY', label: '할부·리스·렌트 상품 비교', synonyms: ['상품 비교', '할부 리스 렌트 비교', '금리 비교'] },
  { id: 'PRODUCT_DISCOVERY.CAR_LOAN', group: 'PRODUCT_DISCOVERY', label: '자동차담보대출 탐색', synonyms: ['자동차담보', '담보대출'] },
  { id: 'PRODUCT_DISCOVERY.OTHER_LOAN', group: 'PRODUCT_DISCOVERY', label: '기타 대출상품 탐색', synonyms: ['신용대출', '주택담보', '주담대'] },
  { id: 'PRODUCT_DISCOVERY.DETAIL', group: 'PRODUCT_DISCOVERY', label: '금융상품 상세 조건 확인', synonyms: ['상품 상세', '상품 조건', '상세 조건'] },
  { id: 'PRODUCT_DISCOVERY.FEE_COMPARE', group: 'PRODUCT_DISCOVERY', label: '금리·수수료·혜택 비교', synonyms: ['수수료 비교', '금리 수수료'] },
  { id: 'PRODUCT_DISCOVERY.ELIGIBILITY', group: 'PRODUCT_DISCOVERY', label: '상품 이용 조건 확인', synonyms: ['이용 조건', '가입 대상'] },
  // 신청·심사
  { id: 'APPLICATION.ELIGIBILITY', group: 'APPLICATION', label: '신청 자격 확인', synonyms: ['신청 자격', '자격 확인', '신청 가능'] },
  { id: 'APPLICATION.TYPE_SELECT', group: 'APPLICATION', label: '신청 유형 선택', synonyms: ['신청 유형', '유형 선택'] },
  { id: 'APPLICATION.IDENTITY', group: 'APPLICATION', label: '본인인증', synonyms: ['본인인증', '본인 인증', '본인 확인', '휴대폰 인증', '간편인증'] },
  { id: 'APPLICATION.PERSONAL_INFO', group: 'APPLICATION', label: '개인정보 입력', synonyms: ['개인정보 입력', '주소 입력', '연락처 입력', '직업 입력', '소득 입력'] },
  { id: 'APPLICATION.APPLICATION_INFO', group: 'APPLICATION', label: '차량·금융 신청 정보 입력', synonyms: ['신청 정보', '신청서', '정보 입력'] },
  { id: 'APPLICATION.DOCUMENTS', group: 'APPLICATION', label: '서류 제출', synonyms: ['서류 제출', '서류', '증빙'] },
  { id: 'APPLICATION.HISTORY', group: 'APPLICATION', label: '신청 내역 확인', synonyms: ['신청 내역', '신청 현황'] },
  { id: 'APPLICATION.STATUS', group: 'APPLICATION', label: '심사 진행 현황 조회', synonyms: ['심사 진행', '심사 현황', '진행 상태'] },
  { id: 'APPLICATION.RESULT', group: 'APPLICATION', label: '심사 결과 확인', synonyms: ['심사 결과', '승인 결과', '승인', '거절'] },
  { id: 'APPLICATION.ERROR', group: 'APPLICATION', label: '신청 오류 및 재시도', synonyms: ['신청 오류', '신청 실패'] },
  // 계약·실행
  { id: 'CONTRACT.TERMS_CHECK', group: 'CONTRACT', label: '계약 조건 확인', synonyms: ['계약 조건'] },
  { id: 'CONTRACT.REVIEW', group: 'CONTRACT', label: '계약 정보 검토', synonyms: ['계약 정보', '계약 내용', '계약서 확인'] },
  { id: 'CONTRACT.TERMS_VIEW', group: 'CONTRACT', label: '약관 확인', synonyms: ['약관 보기', '약관 확인', '동의 항목'] },
  { id: 'CONTRACT.AGREE', group: 'CONTRACT', label: '약관 동의', synonyms: ['약관 동의', '약관', '개인정보 동의'] },
  { id: 'CONTRACT.SIGN', group: 'CONTRACT', label: '전자서명', synonyms: ['전자서명', '서명'] },
  { id: 'CONTRACT.COMPLETE', group: 'CONTRACT', label: '계약 완료 확인', synonyms: ['계약 완료', '가입 완료'] },
  { id: 'CONTRACT.EXECUTION', group: 'CONTRACT', label: '금융 실행·지급 결과 확인', synonyms: ['대출 실행', '금융 실행', '지급 결과', '실행 완료'] },
  // 결제·상환 관리
  { id: 'PAYMENT.UPCOMING', group: 'PAYMENT', label: '결제 예정액 확인', synonyms: ['결제 예정', '납부 예정', '이번 달 납부', '청구 금액'] },
  { id: 'PAYMENT.HISTORY', group: 'PAYMENT', label: '결제·납부 내역 조회', synonyms: ['납부 내역', '결제 내역', '납입 내역'] },
  { id: 'PAYMENT.SCHEDULE', group: 'PAYMENT', label: '상환 일정 조회', synonyms: ['상환 일정', '납부 일정', '상환 스케줄'] },
  { id: 'PAYMENT.DATE_CHANGE', group: 'PAYMENT', label: '결제일 변경', synonyms: ['결제일 변경', '납부일 변경'] },
  { id: 'PAYMENT.ACCOUNT_CHANGE', group: 'PAYMENT', label: '결제 계좌 변경', synonyms: ['결제 계좌', '출금 계좌'] },
  { id: 'PAYMENT.AUTOPAY', group: 'PAYMENT', label: '자동이체 신청·변경', synonyms: ['자동이체'] },
  { id: 'PAYMENT.PAY_NOW', group: 'PAYMENT', label: '즉시 납부', synonyms: ['즉시 납부', '바로 납부', '납부하기'] },
  { id: 'PAYMENT.PREPAY_QUOTE', group: 'PAYMENT', label: '중도상환 금액 조회', synonyms: ['중도상환 금액', '중도상환 조회', '중도상환 수수료'] },
  { id: 'PAYMENT.PREPAY_APPLY', group: 'PAYMENT', label: '중도상환 신청', synonyms: ['중도상환 신청', '중도상환', '상환 신청'] },
  { id: 'PAYMENT.OVERDUE', group: 'PAYMENT', label: '연체 내역·납부 안내 확인', synonyms: ['연체', '미납', '납부 안내'] },
  // 계약·자산 관리
  { id: 'ASSET_MANAGEMENT.CONTRACTS', group: 'ASSET_MANAGEMENT', label: '금융계약 조회', synonyms: ['내 계약', '금융계약', '계약 목록', '내 대출', '대출 현황'] },
  { id: 'ASSET_MANAGEMENT.CONTRACT_DETAIL', group: 'ASSET_MANAGEMENT', label: '계약 상세 조회', synonyms: ['계약 상세', '계약 상세 조회'] },
  { id: 'ASSET_MANAGEMENT.BALANCE', group: 'ASSET_MANAGEMENT', label: '잔여 원금·잔액 확인', synonyms: ['잔여 원금', '잔액', '남은 금액', '대출 잔액'] },
  { id: 'ASSET_MANAGEMENT.CONTRACT_CHANGE', group: 'ASSET_MANAGEMENT', label: '계약 정보 변경', synonyms: ['계약 변경', '계약 정보 변경'] },
  { id: 'ASSET_MANAGEMENT.MATURITY', group: 'ASSET_MANAGEMENT', label: '계약 만기 확인', synonyms: ['만기', '만기일'] },
  { id: 'ASSET_MANAGEMENT.EXTEND_END', group: 'ASSET_MANAGEMENT', label: '계약 연장·종료', synonyms: ['계약 연장', '계약 종료', '해지', '해약', '철회'] },
  { id: 'ASSET_MANAGEMENT.CERTIFICATE', group: 'ASSET_MANAGEMENT', label: '계약 증명서 발급', synonyms: ['증명서', '완납 증명', '확인서 발급'] },
  { id: 'ASSET_MANAGEMENT.MY_CAR', group: 'ASSET_MANAGEMENT', label: '내 차 정보 조회', synonyms: ['내 차 정보', '마이카'] },
  { id: 'ASSET_MANAGEMENT.ASSET_OVERVIEW', group: 'ASSET_MANAGEMENT', label: '자산 현황 확인', synonyms: ['자산 현황', '내 자산'] },
  // 차량 관리·처분
  { id: 'VEHICLE_MANAGEMENT.COST', group: 'VEHICLE_MANAGEMENT', label: '차량 유지비 확인', synonyms: ['유지비', '자동차세', '과태료'] },
  { id: 'VEHICLE_MANAGEMENT.MAINTENANCE', group: 'VEHICLE_MANAGEMENT', label: '차량 정비 정보 확인', synonyms: ['정비', '점검', '소모품'] },
  { id: 'VEHICLE_MANAGEMENT.INSURANCE', group: 'VEHICLE_MANAGEMENT', label: '보험 정보 확인', synonyms: ['자동차 보험', '보험료', '보험'] },
  { id: 'VEHICLE_MANAGEMENT.VALUATION', group: 'VEHICLE_MANAGEMENT', label: '차량 시세 조회', synonyms: ['시세 조회', '차량 시세', '내 차 시세', '시세'] },
  { id: 'VEHICLE_MANAGEMENT.SELL_QUOTE', group: 'VEHICLE_MANAGEMENT', label: '차량 판매 견적 확인', synonyms: ['판매 견적', '매입가', '딜러 견적', '입찰'] },
  { id: 'VEHICLE_MANAGEMENT.SELL_APPLY', group: 'VEHICLE_MANAGEMENT', label: '차량 판매 신청', synonyms: ['내 차 팔기', '판매 신청', '판매 등록', '차량 판매'] },
  { id: 'VEHICLE_MANAGEMENT.RETURN', group: 'VEHICLE_MANAGEMENT', label: '리스·렌트 차량 반납', synonyms: ['차량 반납', '반납'] },
  { id: 'VEHICLE_MANAGEMENT.DISPOSAL_TERMS', group: 'VEHICLE_MANAGEMENT', label: '차량 인수·처분 조건 확인', synonyms: ['인수 조건', '처분 조건', '차량 인수', '폐차'] },
  // 계정·고객지원
  { id: 'ACCOUNT_SUPPORT.LOGIN', group: 'ACCOUNT_SUPPORT', label: '로그인·회원가입', synonyms: ['로그인', '회원가입'] },
  { id: 'ACCOUNT_SUPPORT.PROFILE', group: 'ACCOUNT_SUPPORT', label: '계정·본인정보 관리', synonyms: ['계정 관리', '본인정보', '내 정보'] },
  { id: 'ACCOUNT_SUPPORT.AUTH_METHOD', group: 'ACCOUNT_SUPPORT', label: '인증수단 관리', synonyms: ['인증수단', '생체인증', '간편 비밀번호', '비밀번호'] },
  { id: 'ACCOUNT_SUPPORT.NOTIFICATION', group: 'ACCOUNT_SUPPORT', label: '알림 설정', synonyms: ['알림 설정'] },
  { id: 'ACCOUNT_SUPPORT.CONSULT', group: 'ACCOUNT_SUPPORT', label: '상담 신청', synonyms: ['상담 신청', '상담'] },
  { id: 'ACCOUNT_SUPPORT.INQUIRY', group: 'ACCOUNT_SUPPORT', label: '고객센터 문의', synonyms: ['고객센터', '문의'] },
  { id: 'ACCOUNT_SUPPORT.FAQ', group: 'ACCOUNT_SUPPORT', label: 'FAQ 확인', synonyms: ['FAQ', '자주 묻는', '도움말', '챗봇'] },
  { id: 'ACCOUNT_SUPPORT.TROUBLESHOOT', group: 'ACCOUNT_SUPPORT', label: '오류 해결·재시도', synonyms: ['오류 해결', '재시도'] },
]

export const SCREEN_TYPES = [
  { id: 'home-dashboard', name: 'Home / Dashboard', label: '홈·대시보드', description: '서비스의 시작 화면이나 요약 화면' },
  { id: 'list', name: 'List', label: '목록', description: '항목을 나열해 보여주는 화면' },
  { id: 'detail', name: 'Detail', label: '상세', description: '하나의 대상을 자세히 보여주는 화면' },
  { id: 'form', name: 'Form', label: '입력', description: '정보를 입력·신청하는 화면' },
  { id: 'selection', name: 'Selection', label: '선택', description: '여러 선택지 중 고르는 화면' },
  { id: 'confirmation', name: 'Confirmation', label: '확인', description: '진행 내용을 확인하거나 완료를 알리는 화면' },
  { id: 'result', name: 'Result', label: '결과', description: '조회·계산 결과를 보여주는 화면' },
  { id: 'error-empty', name: 'Error / Empty', label: '오류·빈 상태', description: '오류, 실패, 빈 상태 화면' },
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
export const TASK_GROUP_BY_ID = index(TASK_GROUPS)
export const SCREEN_TYPE_BY_ID = index(SCREEN_TYPES)
export const PATTERN_BY_ID = index(UI_PATTERNS)
export const VERIFICATION_BY_ID = index(VERIFICATION)
