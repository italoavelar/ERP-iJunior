import { useState } from 'react'
import { ParcelasSheet } from '../components/ParcelasSheet'
import { nfTone } from '../lib/tone'
import { daysTo, fmtDate } from '../lib/format'
import type { Project } from '../lib/types'

/** Texto e cor do vencimento a partir da distância em dias. */
const due = (iso: string) => {
  const d = daysTo(iso)
  if (d < 0) return { label: `vencido há ${Math.abs(d)} dias`, tone: 'var(--destructive)' }
  if (d === 0) return { label: 'vence hoje', tone: 'var(--amber)' }
  return { label: `em ${d} dias`, tone: d <= 5 ? 'var(--amber)' : 'var(--mutedfg)' }
}

export function NotasFiscais({
  projects,
  desktop,
  onToggle,
  onUpdated,
  onToast,
}: {
  projects: Project[]
  desktop: boolean
  onToggle: (id: string, issued: boolean) => Promise<void>
  onUpdated: (p: Project) => void
  onToast: (title: string, body: string, tone?: string) => void
}) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  // Só projetos em execução têm próximo pagamento a controlar.
  const rows = projects.filter((p) => p.running)
  const semNF = rows.filter((p) => !p.nf).length

  const handle = async (id: string, issued: boolean) => {
    setBusyId(id)
    try {
      await onToggle(id, issued)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h1 className="display" style={{ fontSize: 31 }}>
        Controle de notas fiscais
      </h1>
      <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--mutedfg)' }}>
        {semNF} {semNF === 1 ? 'projeto sem NF emitida' : 'projetos sem NF emitida'} para o próximo
        pagamento · clique num projeto para ver as parcelas
      </p>

      <div className="card" style={{ marginTop: 22, overflow: 'hidden', padding: 0 }}>
        <div className="scroll-x">
          <table className="data" style={{ minWidth: 620 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 18 }}>Projeto</th>
                <th>NF do próximo pagamento</th>
                <th>Próximo pagamento</th>
                <th>NFs emitidas</th>
                <th style={{ paddingRight: 18 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const has = p.nf
                const d = due(p.nextDate!)
                return (
                  <tr
                    key={p.id}
                    onClick={() => setOpenId(p.id)}
                    style={{ cursor: 'pointer' }}
                    title="Ver parcelas"
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--mutedfg)', marginTop: 3 }}>
                        {p.product} · P.O. {p.po}
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span
                        className="chip"
                        style={{
                          padding: '4px 10px',
                          fontSize: 11.5,
                          background: nfTone(has)[0],
                          color: nfTone(has)[1],
                        }}
                      >
                        {has ? 'NF emitida' : 'Sem NF'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <div className="num">{fmtDate(p.nextDate)}</div>
                      <div style={{ fontSize: 12, color: d.tone, marginTop: 3 }}>{d.label}</div>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span className="num" style={{ fontWeight: 600 }}>
                        {p.nfCount}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--mutedfg)' }}>
                        {' '}
                        de {p.installmentCount}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        className="btn-ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          void handle(p.id, !has)
                        }}
                        disabled={busyId === p.id}
                        style={{ height: 32, padding: '0 12px', fontSize: 12.5, borderRadius: 9, whiteSpace: 'nowrap' }}
                      >
                        {has ? 'Marcar sem NF' : 'Marcar emitida'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {openId && (
        <ParcelasSheet
          projectId={openId}
          desktop={desktop}
          onClose={() => setOpenId(null)}
          onUpdated={onUpdated}
          onToast={onToast}
        />
      )}
    </div>
  )
}
