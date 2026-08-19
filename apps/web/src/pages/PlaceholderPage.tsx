export function PlaceholderPage({ title, detail }: { title: string; detail: string }) {
  return <section>
    <div className="page-heading"><div><p className="eyebrow">Módulo</p><h1>{title}</h1><p className="muted">{detail}</p></div></div>
    <div className="empty-state"><h2>Em preparação</h2><p>Esta área será disponibilizada em uma próxima etapa do ERP.</p></div>
  </section>;
}
