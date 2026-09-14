import { Card, Chip, ProgressBar, StatCard } from '../components/primitives'
import { PENDING_NF, PROJECTS, UPCOMING } from '../data/mock'
import { BRL } from '../lib/format'
import { nfTone, statusTone } from '../lib/tone'

export function Dashboard({
  desktop,
  onOpenProject,
}: {
  desktop: boolean
  onOpenProject: (id: string) => void
}) {
  const late = PROJECTS.filter((p) => p.status === 'Atrasado' || p.status === 'Inadimplente')

  const kpiCols = desktop ? 'repeat(4,minmax(0,1fr))' : 'repeat(2,minmax(0,1fr))'
  const twoCols = desktop ? 'minmax(0,1.15fr) minmax(0,1fr)' : '1fr'
  const threeCols = desktop ? 'repeat(3,minmax(0,1fr))' : '1fr'

  return (
    <div>
      <div style={{ animation: 'fadeUp 480ms ease both' }}>
        <h1 className="display gradient-text" style={{ fontSize: 32 }}>
          Olá, Felipe
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--mutedfg)' }}>
          Sexta, 21 de agosto de 2026 · 4 parcelas vencem nos próximos 30 dias
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: kpiCols, gap: 14, marginTop: 26 }}>
        <StatCard
          label="Total contratado"
          value="R$ 251.742,36"
          foot="9 projetos ativos"
          style={{ animation: 'fadeUp 480ms 80ms ease both' }}
        />
        <Card style={{ animation: 'fadeUp 480ms 160ms ease both' }}>
          <div style={{ fontSize: 12.5, color: 'var(--mutedfg)', fontWeight: 500 }}>Recebido</div>
          <div
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 700,
              fontSize: 23,
              marginTop: 8,
              color: 'var(--primary)',
            }}
          >
            R$ 192.749,22
          </div>
          <div style={{ marginTop: 12 }}>
            <ProgressBar pct="76.6%" height={6} />
          </div>
        </Card>
        <StatCard
          label="A receber"
          value="R$ 58.993,14"
          foot="em 17 parcelas"
          style={{ animation: 'fadeUp 480ms 240ms ease both' }}
        />
        <StatCard
          label="Previsão do mês"
          value="R$ 21.328,58"
          foot="agosto · 6 parcelas previstas"
          highlight
          style={{ animation: 'fadeUp 480ms 240ms ease both' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: twoCols, gap: 14, marginTop: 14 }}>
        <Card style={{ padding: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <h2 className="h2">Próximos vencimentos</h2>
            <span style={{ fontSize: 12, color: 'var(--mutedfg)' }}>30 dias</span>
          </div>
          {UPCOMING.map((u) => (
            <div
              key={u.project}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="truncate" style={{ fontSize: 13.5, fontWeight: 600 }}>
                  {u.project}
                </div>
                <div style={{ fontSize: 12, color: 'var(--mutedfg)', marginTop: 2 }}>
                  vence {u.date}
                </div>
              </div>
              <div className="num" style={{ fontSize: 13.5, fontWeight: 600 }}>
                {BRL(u.value)}
              </div>
              <Chip tone={nfTone(u.nf)}>{u.nf ? 'NF emitida' : 'Sem NF'}</Chip>
            </div>
          ))}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 className="h2">Parcelas vencidas</h2>
              <Chip tone={statusTone('Inadimplente')}>Inadimplente</Chip>
            </div>
            <div
              style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 700,
                fontSize: 26,
                marginTop: 12,
                color: 'var(--destructive)',
              }}
            >
              R$ 9.612,50
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--mutedfg)', marginTop: 4 }}>
              3 parcelas · 2 projetos
            </div>
          </Card>

          <Card style={{ padding: 20 }}>
            <h2 className="h2">NFs pendentes de emissão</h2>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 26 }}>5</span>
              <span style={{ fontSize: 12.5, color: 'var(--mutedfg)' }}>notas a emitir</span>
            </div>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PENDING_NF.map((p) => (
                <div
                  key={p.project}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    fontSize: 12.5,
                  }}
                >
                  <span className="truncate">{p.project}</span>
                  <span className="num" style={{ color: 'var(--mutedfg)', flex: 'none' }}>
                    {BRL(p.value)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <h2 className="h2" style={{ margin: '26px 0 12px' }}>
        Projetos inadimplentes ou atrasados
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: threeCols, gap: 14 }}>
        {late.map((p) => (
          <button
            key={p.id}
            className="card lift"
            onClick={() => onOpenProject(p.id)}
            style={{
              textAlign: 'left',
              padding: 18,
              cursor: 'pointer',
              color: 'var(--fg)',
              font: 'inherit',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span className="truncate" style={{ fontSize: 14, fontWeight: 600 }}>
                {p.name}
              </span>
              <Chip tone={statusTone(p.status)}>{p.status}</Chip>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--mutedfg)', marginTop: 8 }}>
              {p.status === 'Inadimplente'
                ? '2 parcelas vencidas · sem contato há 12 dias'
                : '1 parcela em atraso · cobrança enviada'}
            </div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, marginTop: 10 }}>
              {BRL(p.total - p.paid)}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
