import { useState } from 'react'
import { Chip, ProgressBar } from '../components/primitives'
import { Sheet } from '../components/Overlay'
import { IconClose } from '../components/Icons'
import { PROJECTS, nfTone, pctOf, productTone, type Project } from '../data/projects'
import { BRL, fmtDate } from '../lib/format'

type Tab = 'execucao' | 'finalizados'

export function Projetos({ desktop, nf }: { desktop: boolean; nf: Record<string, boolean> }) {
  const [tab, setTab] = useState<Tab>('execucao')
  const [openId, setOpenId] = useState<string | null>(null)

  const running = PROJECTS.filter((p) => p.running)
  const finished = PROJECTS.filter((p) => !p.running)
  const shown = tab === 'execucao' ? running : finished
  const open = PROJECTS.find((p) => p.id === openId) ?? null

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'execucao', label: 'Em execução', count: running.length },
    { key: 'finalizados', label: 'Finalizados', count: finished.length },
  ]

  return (
    <div>
      <h1 className="display" style={{ fontSize: 31 }}>
        Projetos
      </h1>
      <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--mutedfg)' }}>
        {running.length} em execução · {finished.length} finalizados
      </p>

      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: 4,
          border: '1px solid var(--border)',
          borderRadius: 12,
          background: 'var(--card)',
          marginTop: 22,
          width: 'fit-content',
          maxWidth: '100%',
        }}
      >
        {tabs.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                height: 36,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: 0,
                borderRadius: 9,
                background: active ? 'color-mix(in oklch,var(--primary) 12%,transparent)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--mutedfg)',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
              <span
                style={{
                  minWidth: 22,
                  height: 20,
                  padding: '0 6px',
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 99,
                  background: active
                    ? 'color-mix(in oklch,var(--primary) 18%,transparent)'
                    : 'var(--muted)',
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: desktop ? 'repeat(3,minmax(0,1fr))' : '1fr',
          gap: 14,
          marginTop: 16,
        }}
      >
        {shown.map((p) => (
          <button
            key={p.id}
            className="card lift"
            onClick={() => setOpenId(p.id)}
            style={{ textAlign: 'left', padding: 18, cursor: 'pointer', color: 'var(--fg)', font: 'inherit' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, lineHeight: 1.3 }}>
                {p.name}
              </span>
              <span
                className="chip"
                style={{
                  flex: 'none',
                  borderRadius: 7,
                  fontWeight: 700,
                  letterSpacing: '.03em',
                  background: productTone(p.product)[0],
                  color: productTone(p.product)[1],
                }}
              >
                {p.product}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--mutedfg)', marginTop: 8 }}>P.O. {p.po}</div>
            <div style={{ marginTop: 14 }}>
              <ProgressBar pct={pctOf(p)} height={8} />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                marginTop: 9,
              }}
            >
              <span style={{ fontSize: 12.5, color: 'var(--mutedfg)' }}>{pctOf(p)} pago</span>
              <span className="num" style={{ fontSize: 13, fontWeight: 600 }}>
                {BRL(p.total)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {open && <ProjectDetail project={open} desktop={desktop} nf={nf[open.id]} onClose={() => setOpenId(null)} />}
    </div>
  )
}

function ProjectDetail({
  project: p,
  desktop,
  nf,
  onClose,
}: {
  project: Project
  desktop: boolean
  nf: boolean
  onClose: () => void
}) {
  const box = (label: string, value: string, accent?: boolean) => (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 11.5, color: 'var(--mutedfg)' }}>{label}</div>
      <div
        style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 700,
          fontSize: 17,
          marginTop: 6,
          color: accent ? 'var(--primary)' : undefined,
        }}
      >
        {value}
      </div>
    </div>
  )

  return (
    <Sheet open onClose={onClose} desktop={desktop} width={desktop ? 520 : 460} title={p.name} hideHeader>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 9 }}>
            <h2 style={{ margin: 0, fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 22, lineHeight: 1.25 }}>
              {p.name}
            </h2>
            <span
              className="chip"
              style={{
                borderRadius: 7,
                fontWeight: 700,
                letterSpacing: '.03em',
                background: productTone(p.product)[0],
                color: productTone(p.product)[1],
              }}
            >
              {p.product}
            </span>
            <Chip
              tone={
                p.running
                  ? ['color-mix(in oklch,var(--primary) 12%,transparent)', 'var(--primary)']
                  : ['var(--muted)', 'var(--mutedfg)']
              }
            >
              {p.running ? 'Em execução' : 'Finalizado'}
            </Chip>
          </div>
          <div style={{ fontSize: 13, color: 'var(--mutedfg)', marginTop: 8 }}>
            P.O. (gerente): <span style={{ color: 'var(--fg)', fontWeight: 600 }}>{p.po}</span>
          </div>
        </div>
        <button
          className="icon-btn"
          onClick={onClose}
          aria-label="Fechar"
          style={{ width: 32, height: 32, flex: 'none' }}
        >
          <IconClose />
        </button>
      </div>

      <div>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: '.05em',
            textTransform: 'uppercase',
            color: 'var(--mutedfg)',
          }}
        >
          Descrição
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.6, textWrap: 'pretty' }}>
          {p.description}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }}>
        {box('Preço total', BRL(p.total))}
        {box('Já pago', BRL(p.paid), true)}
        {box('Falta', BRL(p.total - p.paid))}
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12.5,
            color: 'var(--mutedfg)',
          }}
        >
          <span>{pctOf(p)} pago</span>
          <span>
            {p.nextDate ? `próximo pagamento em ${fmtDate(p.nextDate)}` : 'contrato quitado'}
          </span>
        </div>
        <div style={{ marginTop: 9 }}>
          <ProgressBar pct={pctOf(p)} />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: 14,
          borderRadius: 12,
          background: 'var(--muted)',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>NF do próximo pagamento</div>
          <div style={{ fontSize: 12.5, color: 'var(--mutedfg)', marginTop: 3 }}>
            {p.nextDate ? `Vencimento em ${fmtDate(p.nextDate)}` : 'Sem pagamentos pendentes'}
          </div>
        </div>
        <span
          className="chip"
          style={{ flex: 'none', padding: '5px 11px', fontSize: 11.5, background: nfTone(nf)[0], color: nfTone(nf)[1] }}
        >
          {nf ? 'NF emitida' : 'Sem NF'}
        </span>
      </div>
    </Sheet>
  )
}
