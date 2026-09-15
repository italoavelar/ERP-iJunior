import { useEffect, useState } from 'react'
import { Sheet } from './Overlay'
import { Chip, ErrorState, Loading, ProgressBar } from './primitives'
import { api } from '../lib/api'
import { BRL, fmtDate, installmentStatus } from '../lib/format'
import { nfTone, statusTone } from '../lib/tone'
import type { Project, ProjectDetail } from '../lib/types'

/** Plano de parcelas de um projeto, com a NF editável parcela a parcela. */
export function ParcelasSheet({
  projectId,
  desktop,
  onClose,
  onUpdated,
  onToast,
}: {
  projectId: string
  desktop: boolean
  onClose: () => void
  onUpdated: (p: Project) => void
  onToast: (title: string, body: string, tone?: string) => void
}) {
  const [detail, setDetail] = useState<ProjectDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<number | null>(null)

  const load = () => {
    setError(null)
    setDetail(null)
    api.projects
      .get(projectId)
      .then(setDetail)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }

  useEffect(load, [projectId])

  const toggleNF = async (number: number, issued: boolean) => {
    setBusy(number)
    try {
      const updated = await api.projects.setInstallmentNF(projectId, number, issued)
      setDetail(updated)
      onUpdated(updated)
      onToast(
        issued ? 'NF marcada como emitida' : 'NF desmarcada',
        `Parcela ${number} de ${updated.name}`,
      )
    } catch (e) {
      onToast('Não deu para atualizar', e instanceof Error ? e.message : String(e), 'var(--destructive)')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      desktop={desktop}
      width={desktop ? 620 : 460}
      title={detail?.name ?? 'Parcelas'}
      subtitle={detail ? `${detail.product} · P.O. ${detail.po}` : undefined}
    >
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !detail ? (
        <Loading label="Carregando parcelas…" />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }}>
            <Box label="NFs emitidas" value={`${detail.nfCount} de ${detail.installmentCount}`} accent />
            <Box label="Parcelas pagas" value={`${detail.installments.filter((i) => i.paid).length} de ${detail.installmentCount}`} />
            <Box
              label="Próximo vencimento"
              value={detail.nextDate ? fmtDate(detail.nextDate) : '—'}
            />
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12.5,
                color: 'var(--mutedfg)',
                marginBottom: 8,
              }}
            >
              <span>
                {Math.round((detail.nfCount / Math.max(1, detail.installmentCount)) * 100)}% das NFs
                emitidas
              </span>
              <span className="num">{BRL(detail.total)} no contrato</span>
            </div>
            <ProgressBar
              pct={`${Math.round((detail.nfCount / Math.max(1, detail.installmentCount)) * 100)}%`}
            />
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="scroll-x">
              <table className="data" style={{ minWidth: 520 }}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 16 }}>Nº</th>
                    <th>Vencimento</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                    <th>Situação</th>
                    <th>NF</th>
                    <th style={{ paddingRight: 16 }} />
                  </tr>
                </thead>
                <tbody>
                  {detail.installments.map((i) => {
                    const status = installmentStatus(i.paid, i.dueDate)
                    const isNext = detail.nextNumber === i.number
                    return (
                      <tr
                        key={i.number}
                        style={{
                          background: isNext
                            ? 'color-mix(in oklch,var(--primary) 6%,transparent)'
                            : 'transparent',
                        }}
                      >
                        <td style={{ paddingLeft: 16, fontWeight: 600 }}>
                          {i.number}/{detail.installmentCount}
                        </td>
                        <td className="num" style={{ color: 'var(--mutedfg)' }}>
                          {fmtDate(i.dueDate)}
                        </td>
                        <td className="num" style={{ textAlign: 'right' }}>
                          {BRL(i.amount)}
                        </td>
                        <td>
                          <Chip tone={statusTone(status)}>{status}</Chip>
                        </td>
                        <td>
                          <Chip tone={nfTone(i.nfIssued)}>{i.nfIssued ? 'Emitida' : 'Sem NF'}</Chip>
                        </td>
                        <td style={{ paddingRight: 16, textAlign: 'right' }}>
                          <button
                            className="btn-ghost"
                            disabled={busy === i.number}
                            onClick={() => void toggleNF(i.number, !i.nfIssued)}
                            style={{
                              height: 30,
                              padding: '0 11px',
                              fontSize: 12,
                              borderRadius: 8,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {i.nfIssued ? 'Desmarcar' : 'Marcar NF'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Sheet>
  )
}

function Box({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
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
}
