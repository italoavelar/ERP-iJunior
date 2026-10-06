import { useState } from 'react'
import { ParcelasSheet } from '../components/ParcelasSheet'
import { nfTone } from '../lib/tone'
import { dueLabel, fmtDate } from '../lib/format'
import type { Project } from '../lib/types'

/** Ordem de cobrança: com data primeiro (as vencidas no topo), depois as que
 *  dependem de marco, e por último os contratos já quitados. */
const urgency = (p: Project) =>
  p.nextNumber === null ? '3' : p.nextDate ? `1${p.nextDate}` : `2${p.name}`

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
  const rows = projects
    .filter((p) => p.running)
    .sort((a, b) => urgency(a).localeCompare(urgency(b)))
  const semNF = rows.filter((p) => p.nextNumber !== null && !p.nf).length
  const overdue = rows.filter((p) => p.nextDate && dueLabel(p.nextDate).tone === 'var(--destructive)')

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
        pagamento
        {overdue.length > 0 && (
          <>
            {' · '}
            <span style={{ color: 'var(--destructive)', fontWeight: 600 }}>
              {overdue.length} com pagamento vencido
            </span>
          </>
        )}
        {' · '}clique num projeto para ver as parcelas
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
                const d = p.nextDate ? dueLabel(p.nextDate) : null
                const settled = p.nextNumber === null
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
                        {[p.client, p.product].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      {settled ? (
                        <span style={{ fontSize: 12.5, color: 'var(--mutedfg)' }}>—</span>
                      ) : (
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
                      )}
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      {settled ? (
                        <div style={{ color: 'var(--primary)', fontWeight: 600 }}>Quitado</div>
                      ) : d ? (
                        <>
                          <div className="num">{fmtDate(p.nextDate)}</div>
                          <div style={{ fontSize: 12, color: d.tone, marginTop: 3 }}>{d.label}</div>
                        </>
                      ) : (
                        <>
                          <div style={{ color: p.nextSprint ? 'var(--amber)' : 'var(--mutedfg)' }}>
                            {p.nextSprint ? `Após a Sprint ${p.nextSprint}` : 'A definir'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--mutedfg)', marginTop: 3 }}>
                            {p.nextSprint
                              ? p.lastValidatedSprint
                                ? `Sprint ${p.lastValidatedSprint} validada`
                                : 'nenhuma sprint validada'
                              : p.nextDescription || 'condicionada'}
                          </div>
                        </>
                      )}
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
                      {!settled && (
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
                      )}
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
