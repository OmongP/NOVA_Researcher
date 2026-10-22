import { COMPANIES } from '../data/benchmark/companies'
import { VERIFICATION_BY_ID } from '../data/benchmark/taxonomy'
import { labelOf } from '../lib/benchmark'
import BenchmarkTags from './BenchmarkTags'

// 상세 보기의 벤치마킹 분석 영역. 어떤 근거로 분류했는지 같이 보여줘요.
export default function BenchmarkDetail({ screen }) {
  const bm = screen.bm
  const company = COMPANIES.find((c) => c.id === bm.companyId)
  const ev = bm.evidence
  return (
    <section className="bm-detail" aria-label="벤치마킹 분석">
      <h3 className="review-heading">벤치마킹 분류</h3>
      <BenchmarkTags bm={bm} />
      <p className="card-reason">UI Bowl 메타데이터(패턴·제목·UI 요소·화면 문구)로 자동 분류한 결과예요. 이미지를 AI가 보고 분석한 결과가 아니에요.</p>
      <dl className="detail-meta">
        <dt>기업·서비스</dt>
        <dd>
          {company ? (
            <>
              {company.name} · {screen.service}{' '}
              <a href={company.officialWebsite} target="_blank" rel="noreferrer">
                공식 사이트 ↗
              </a>
            </>
          ) : (
            <>{screen.service} (벤치마킹 대상 기업 목록에 없어요)</>
          )}
        </dd>
        <dt>도메인</dt>
        <dd>
          {labelOf.domain(bm.domainId)}
          {ev.domain.length > 0 && <span className="bm-evidence"> · {ev.domain.join(', ')}</span>}
        </dd>
        <dt>사용자 과업</dt>
        <dd>
          {bm.taskIds.length ? (
            <ul className="rule-list">
              {bm.taskIds.map((id) => (
                <li key={id}>
                  {labelOf.task(id)} <span className="bm-evidence">— {ev.tasks[id]?.join(', ')}</span>
                </li>
              ))}
            </ul>
          ) : (
            '분류된 과업이 없어요(메타데이터에 근거가 없어서 추측하지 않았어요)'
          )}
          {bm.weakTaskIds.length > 0 && (
            <p className="bm-evidence">
              참고(근거 약함, 태그로 쓰지 않아요): {bm.weakTaskIds.map((id) => `${labelOf.task(id)} — ${ev.tasks[id]?.join(', ')}`).join(' / ')}
            </p>
          )}
        </dd>
        <dt>화면 유형</dt>
        <dd>
          {labelOf.screenType(bm.screenTypeId)}
          {ev.screenType.length > 0 && <span className="bm-evidence"> — {ev.screenType.join(', ')}</span>}
        </dd>
        <dt>UI 패턴</dt>
        <dd>
          {bm.patternIds.length ? (
            <ul className="rule-list">
              {bm.patternIds.map((id) => (
                <li key={id}>
                  {labelOf.pattern(id)} <span className="bm-evidence">— {ev.patterns[id]?.join(', ')}</span>
                </li>
              ))}
            </ul>
          ) : (
            '분류된 UI 패턴이 없어요(이 화면의 UI 요소 정보가 없어요)'
          )}
        </dd>
        <dt>웹/앱</dt>
        <dd>{labelOf.platform(bm.platform)}</dd>
        <dt>수집월</dt>
        <dd>{screen.dataMonth ?? '미확인'} (UI Bowl 기준)</dd>
        <dt>검증 상태</dt>
        <dd>
          <strong>{VERIFICATION_BY_ID[bm.verification].label}</strong> — {VERIFICATION_BY_ID[bm.verification].description}
        </dd>
      </dl>
    </section>
  )
}
