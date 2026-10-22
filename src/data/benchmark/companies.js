// 벤치마킹 대상 기업. 하드코딩된 목록이 아니라 이 데이터를 고쳐서 추가·수정해요.
//   aliases: UI Bowl의 앱 이름에 이 글자가 들어 있으면 그 기업의 서비스로 봐요(영문은 단어 단위, 한글은 포함 여부로 비교해요).
//   모든 기업의 화면이 데이터에 있는 건 아니에요. UI Bowl에 없는 기업은 "데이터 없음"으로 표시해요.
export const COMPANIES = [
  // 국내 금융
  { id: 'toss', name: '토스', domain: 'finance', country: 'KR', officialWebsite: 'https://toss.im', aliases: ['토스'] },
  { id: 'kakaobank', name: '카카오뱅크', domain: 'finance', country: 'KR', officialWebsite: 'https://www.kakaobank.com', aliases: ['카카오뱅크'] },
  { id: 'kbank', name: '케이뱅크', domain: 'finance', country: 'KR', officialWebsite: 'https://www.kbanknow.com', aliases: ['케이뱅크'] },
  { id: 'naverpay', name: '네이버페이', domain: 'finance', country: 'KR', officialWebsite: 'https://pay.naver.com', aliases: ['네이버페이'] },
  { id: 'finda', name: '핀다', domain: 'finance', country: 'KR', officialWebsite: 'https://finda.co.kr', aliases: ['핀다'] },
  { id: 'banksalad', name: '뱅크샐러드', domain: 'finance', country: 'KR', officialWebsite: 'https://www.banksalad.com', aliases: ['뱅크샐러드'] },
  { id: 'kbbank', name: 'KB국민은행', domain: 'finance', country: 'KR', officialWebsite: 'https://www.kbstar.com', aliases: ['KB국민', 'KB스타뱅킹', 'KB Pay', 'KB페이'] },
  { id: 'shinhanbank', name: '신한은행', domain: 'finance', country: 'KR', officialWebsite: 'https://bank.shinhan.com', aliases: ['신한 슈퍼SOL', '신한슈퍼SOL', '신한 SOL뱅크', '신한은행'] },
  { id: 'hyundaicard', name: '현대카드', domain: 'finance', country: 'KR', officialWebsite: 'https://www.hyundaicard.com', aliases: ['현대카드'] },
  { id: 'samsungcard', name: '삼성카드', domain: 'finance', country: 'KR', officialWebsite: 'https://www.samsungcard.com', aliases: ['삼성카드'] },
  { id: 'kbcapital', name: 'KB캐피탈', domain: 'auto-finance', country: 'KR', officialWebsite: 'https://www.kbcapital.co.kr', aliases: ['KB캐피탈'] },
  { id: 'hanacapital', name: '하나캐피탈', domain: 'auto-finance', country: 'KR', officialWebsite: 'https://www.hanacapital.co.kr', aliases: ['하나캐피탈'] },
  // 국내 자동차·모빌리티
  { id: 'hyundai', name: '현대자동차', domain: 'automotive', country: 'KR', officialWebsite: 'https://www.hyundai.com/kr', aliases: ['마이현대', '현대자동차', 'Hyundai'] },
  { id: 'kia', name: '기아', domain: 'automotive', country: 'KR', officialWebsite: 'https://www.kia.com/kr', aliases: ['Kia', '기아'] },
  { id: 'encar', name: '엔카', domain: 'automotive', country: 'KR', officialWebsite: 'https://www.encar.com', aliases: ['엔카', 'Encar'] },
  { id: 'kcar', name: 'K Car', domain: 'automotive', country: 'KR', officialWebsite: 'https://www.kcar.com', aliases: ['K Car', '케이카', 'Kcar'] },
  { id: 'heydealer', name: '헤이딜러', domain: 'automotive', country: 'KR', officialWebsite: 'https://www.heydealer.com', aliases: ['헤이딜러'] },
  { id: 'kbchachacha', name: 'KB차차차', domain: 'automotive', country: 'KR', officialWebsite: 'https://www.kbchachacha.com', aliases: ['KB차차차', '차차차'] },
  { id: 'kakaomobility', name: '카카오모빌리티', domain: 'mobility', country: 'KR', officialWebsite: 'https://www.kakaomobility.com', aliases: ['카카오T', '카카오 T', '카카오모빌리티'] },
  { id: 'socar', name: '쏘카', domain: 'mobility', country: 'KR', officialWebsite: 'https://www.socar.kr', aliases: ['쏘카'] },
  // 해외 금융·자동차
  { id: 'revolut', name: 'Revolut', domain: 'finance', country: 'GB', officialWebsite: 'https://www.revolut.com', aliases: ['Revolut'] },
  { id: 'monzo', name: 'Monzo', domain: 'finance', country: 'GB', officialWebsite: 'https://monzo.com', aliases: ['Monzo'] },
  { id: 'nubank', name: 'Nubank', domain: 'finance', country: 'BR', officialWebsite: 'https://nubank.com.br', aliases: ['Nubank'] },
  { id: 'chase', name: 'Chase', domain: 'finance', country: 'US', officialWebsite: 'https://www.chase.com', aliases: ['Chase'] },
  { id: 'capitalone-auto', name: 'Capital One Auto', domain: 'auto-finance', country: 'US', officialWebsite: 'https://www.capitalone.com/auto', aliases: ['Capital One'] },
  { id: 'mbfs', name: 'Mercedes-Benz Financial Services', domain: 'auto-finance', country: 'DE', officialWebsite: 'https://www.mbfs.com', aliases: ['Mercedes-Benz Financial', 'Mercedes Benz Financial', 'MBFS'] },
  { id: 'bmwfs', name: 'BMW Financial Services', domain: 'auto-finance', country: 'DE', officialWebsite: 'https://www.bmwfs.com', aliases: ['BMW Financial'] },
  { id: 'tesla', name: 'Tesla', domain: 'automotive', country: 'US', officialWebsite: 'https://www.tesla.com', aliases: ['Tesla'] },
  { id: 'carvana', name: 'Carvana', domain: 'automotive', country: 'US', officialWebsite: 'https://www.carvana.com', aliases: ['Carvana'] },
]
