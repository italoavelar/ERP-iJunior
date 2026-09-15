import { useEffect, useState } from 'react'
import { Sheet } from './Overlay'
import { ReplanejarForm } from './ReplanejarForm'
import { ErrorState, Loading, ProgressBar } from './primitives'
import { api } from '../lib/api'
import { BRL, fmtDate, installmentStatus, parseAmount } from '../lib/format'
import { nfTone, statusTone } from '../lib/tone'
import type { Project, ProjectDetail } from '../lib/types'

/**
 * Plano de parcelas: é aqui que valor pago e quantidade de NFs mudam, porque
 * os dois são derivados das parcelas.
 */
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
  const [editing, setEditing] = useState<number | null>(null)
  const [amountDraft, setAmountDraft] = useState('')
  const [replanning, setReplanning] = useState(false)

  const load = () => {
    setError(null)
    setDetail(null)
    setReplanning(false)
    api.projects
      .get(projectId)
      .then(setDetail)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }

  useEffect(load, [projectId])

  const apply = async (
    number: number,
    data: { paid?: boolean; nfIssued?: boolean; amount?: number },
    toast?: [string, string],
  ) => {
    setBusy(number)
    try {
      const updated = await api.projects.updateInstallment(projectId, number, data)
      setDetail(updated)
      onUpdated(updated)
      if (toast) onToast(toast[0], toast[1])
    } catch (e) {
      onToast(
        'Não deu para atualizar',
        e instanceof Error ? e.message : String(e),
        'var(--destructive)',
      )
    } finally {
      setBusy(null)
    }
  }

  const commitAmount = async (number: number, current: number) => {
    const value = parseAmount(amountDraft)
    setEditing(null)
    if (!Number.isFinite(value) || value <= 0) {
      onToast('Valor inválido', 'Informe um número maior que zero.', 'var(--destructive)')
      return
    }
    if (Math.abs(value - current) < 0.005) return
    await apply(number, { amount: Number(value.toFixed(2)) }, [
      'Valor da parcela atualizado',
      `Parcela ${number} agora é ${BRL(value)}`,
    ])
  }

  const paidCount = detail?.installments.filter((i) => i.paid).length ?? 0
  const nfPct = detail
    ? Math.round((detail.nfCount / Math.max(1, detail.installmentCount)) * 100)
    : 0

  return (
    <Sheet
      open
      onClose={onClose}
      desktop={desktop}
      width={desktop ? 700 : 460}
      title={detail?.name ?? 'Parcelas'}
      subtitle={
        detail
          ? replanning
            ? 'Preço, número de parcelas e quanto já foi pago'
            : `${detail.product} · P.O. ${detail.po}`
          : undefined
      }
    >
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !detail ? (
        <Loading label="Carregando parcelas…" />
      ) : replanning ? (
        <ReplanejarForm
          detail={detail}
          onCancel={() => setReplanning(false)}
          onToast={onToast}
          onDone={(updated) => {
            setDetail(updated)
            onUpdated(updated)
            setReplanning(false)
          }}
        />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }}>
            <Box label="Valor pago" value={BRL(detail.paid)} accent />
            <Box label="Falta" value={BRL(detail.total - detail.paid)} />
            <Box label="NFs emitidas" value={`${detail.nfCount} de ${detail.installmentCount}`} />
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
                {paidCount} de {detail.installmentCount} parcelas pagas · {nfPct}% das NFs emitidas
              </span>
              <span className="num">{BRL(detail.total)} no contrato</span>
            </div>
            <ProgressBar
              pct={`${Math.round((detail.paid / Math.max(0.01, detail.total)) * 100)}%`}
            />
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="scroll-x">
              <table className="data" style={{ minWidth: 560 }}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 16 }}>Nº</th>
                    <th>Vencimento</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                    <th>Situação</th>
                    <th style={{ paddingRight: 16 }}>NF</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.installments.map((i) => {
                    const status = installmentStatus(i.paid, i.dueDate)
                    const isNext = detail.nextNumber === i.number
                    const disabled = busy === i.number
                    return (
                      <tr
                        key={i.number}
                        style={{
                          background: isNext
                            ? 'color-mix(in oklch,var(--primary) 6%,transparent)'
                            : 'transparent',
                          opacity: disabled ? 0.6 : 1,
                        }}
                      >
                        <td style={{ paddingLeft: 16, fontWeight: 600 }}>
                          {i.number}/{detail.installmentCount}
                        </td>
                        <td className="num" style={{ color: 'var(--mutedfg)' }}>
                          {fmtDate(i.dueDate)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {editing === i.number ? (
                            <input
                              autoFocus
                              className="field num"
                              value={amountDraft}
                              aria-label={`Valor da parcela ${i.number}`}
                              onChange={(e) => setAmountDraft(e.target.value)}
                              onBlur={() => void commitAmount(i.number, i.amount)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.blur()
                                if (e.key === 'Escape') setEditing(null)
                              }}
                              style={{ height: 30, width: 120, textAlign: 'right', fontSize: 13 }}
                            />
                          ) : (
                            <button
                              className="num"
                              title="Editar valor"
                              aria-label={`Editar valor da parcela ${i.number}`}
                              onClick={() => {
                                setAmountDraft(i.amount.toFixed(2).replace('.', ','))
                                setEditing(i.number)
                              }}
                              style={{
                                border: '1px dashed transparent',
                                borderRadius: 7,
                                background: 'transparent',
                                color: 'var(--fg)',
                                font: 'inherit',
                                padding: '4px 7px',
                                cursor: 'text',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'transparent'
                              }}
                            >
                              {BRL(i.amount)}
                            </button>
                          )}
                        </td>
                        <td>
                          <ToggleChip
                            tone={statusTone(status)}
                            disabled={disabled}
                            title={i.paid ? 'Marcar como não paga' : 'Marcar como paga'}
                            onClick={() =>
                              void apply(i.number, { paid: !i.paid }, [
                                i.paid ? 'Pagamento desfeito' : 'Parcela marcada como paga',
                                `Parcela ${i.number} · ${BRL(i.amount)}`,
                              ])
                            }
                          >
                            {status}
                          </ToggleChip>
                        </td>
                        <td style={{ paddingRight: 16 }}>
                          <ToggleChip
                            tone={nfTone(i.nfIssued)}
                            disabled={disabled}
                            title={i.nfIssued ? 'Desmarcar NF' : 'Marcar NF como emitida'}
                            onClick={() =>
                              void apply(i.number, { nfIssued: !i.nfIssued }, [
                                i.nfIssued ? 'NF desmarcada' : 'NF marcada como emitida',
                                `Parcela ${i.number} de ${detail.name}`,
                              ])
                            }
                          >
                            {i.nfIssued ? 'Emitida' : 'Sem NF'}
                          </ToggleChip>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--mutedfg)', lineHeight: 1.5 }}>
            Clique no valor para editá-lo, e nas etiquetas para alternar pagamento e NF. O total
            contratado e o valor pago são somados a partir daqui.
          </p>

          <button
            className="btn-ghost"
            onClick={() => setReplanning(true)}
            style={{ height: 42, fontSize: 13.5 }}
          >
            Alterar preço, número de parcelas ou vencimentos
          </button>
        </>
      )}
    </Sheet>
  )
}

function ToggleChip({
  tone,
  children,
  onClick,
  disabled,
  title,
}: {
  tone: readonly [string, string]
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  title: string
}) {
  return (
    <button
      className="chip"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: tone[0],
        color: tone[1],
        border: '1px solid transparent',
        cursor: 'pointer',
        font: 'inherit',
        fontSize: 11,
        fontWeight: 600,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = tone[1]
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'transparent'
      }}
    >
      {children}
    </button>
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
