import { ROLE_LABEL, type Role } from '../data/mock'

function Row({
  title,
  hint,
  action,
  last,
}: {
  title: string
  hint: string
  action: React.ReactNode
  last?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        padding: '16px 18px',
        borderBottom: last ? undefined : '1px solid var(--border)',
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--mutedfg)', marginTop: 3 }}>{hint}</div>
      </div>
      {action}
    </div>
  )
}

export function Config({
  dark,
  onToggleTheme,
  role,
}: {
  dark: boolean
  onToggleTheme: () => void
  role: Role
}) {
  return (
    <div>
      <h1 className="display" style={{ fontSize: 29 }}>
        Configurações
      </h1>
      <p style={{ margin: '7px 0 0', fontSize: 13.5, color: 'var(--mutedfg)' }}>
        Preferências do módulo financeiro
      </p>
      <div className="card" style={{ marginTop: 20 }}>
        <Row
          title="Tema escuro"
          hint="Preferência salva neste navegador"
          action={
            <button
              className="btn-ghost"
              onClick={onToggleTheme}
              style={{ height: 36, padding: '0 14px', fontSize: 13 }}
            >
              {dark ? 'Voltar ao claro' : 'Ativar escuro'}
            </button>
          }
        />
        <Row
          title="Papel de demonstração"
          hint="Controla as ações visíveis no protótipo"
          action={
            <span
              className="chip"
              style={{
                padding: '5px 11px',
                fontSize: 11.5,
                background: 'color-mix(in oklch,var(--primary) 12%,transparent)',
                color: 'var(--primary)',
              }}
            >
              {ROLE_LABEL[role]}
            </span>
          }
        />
        <Row
          title="Alerta de vencimento"
          hint="Antecedência das notificações de parcela"
          action={<span style={{ fontSize: 13, fontWeight: 600 }}>2 dias</span>}
          last
        />
      </div>
    </div>
  )
}
