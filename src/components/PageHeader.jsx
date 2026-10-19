// 세 화면(Explore · Archive · Inspect)이 같은 형식으로 보이는 페이지 제목과 부제목이에요.
export default function PageHeader({ title, sub, children }) {
  return (
    <header className="page-header">
      <h2 className="page-title">{title}</h2>
      <p className="page-sub">{sub}</p>
      {children}
    </header>
  )
}
