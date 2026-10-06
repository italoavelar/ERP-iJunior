import { useEffect, useState } from 'react'
import { ConfirmDialog, Sheet } from './Overlay'
import { ReplanejarForm } from './ReplanejarForm'
import { ErrorState, Loading, ProgressBar } from './primitives'
import { api } from '../lib/api'
import { BRL, fmtDate, installmentStatus, parseAmount, today } from '../lib/format'
import { nfTone, statusTone } from '../lib/tone'
import type { Installment, InstallmentPatch, Project, ProjectDetail } from '../lib/types'

/**
 * Plano de parcelas de um projeto. Valor pago, quantidade de NFs e o que falta
 * são derivados daqui; nos projetos pagos por sprint, é aqui também que se
 * valida a sprint para liberar a cobrança.
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
  const [editing, setEditing] = useState<{ number: number; field: 'amount' | 'dueDate' | 'paidAt' } | null>(null)
  const [draft, setDraft] = useState('')
  const [replanning, setReplanning] = useState(false)
  const [sprintAsk, setSprintAsk] = useState<number | null>(null)

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

  const fail = (e: unknown) =>
    onToast('Não deu para atualizar', e instanceof Error ? e.message : String(e), 'var(--destructive)')

  const accept = (updated: ProjectDetail) => {
    setDetail(updated)
    onUpdated(updated)
  }

  const apply = async (number: number, data: InstallmentPatch, toast?: [string, string]) => {
    setBusy(number)
    try {
      accept(await api.projects.updateInstallment(projectId, number, data))
      if (toast) onToast(toast[0], toast[1])
    } catch (e) {
      fail(e)
    } finally {
      setBusy(null)
    }
  }

  const startEdit = (i: Installment, field: 'amount' | 'dueDate' | 'paidAt') => {
    setEditing({ number: i.number, field })
    setDraft(
      field === 'amount'
        ? i.amount.toFixed(2).replace('.', ',')
        : ((field === 'dueDate' ? i.dueDate : i.paidAt) ?? today()),
    )
  }

  const commit = async (i: Installment) => {
    if (!editing) return
    const { field } = editing
    setEditing(null)

    if (field === 'amount') {
      const value = parseAmount(draft)
      if (!Number.isFinite(value) || value <= 0) {
        onToast('Valor inválido', 'Informe um número maior que zero.', 'var(--destructive)')
        return
      }
      if (Math.abs(value - i.amount) < 0.005) return
      await apply(i.number, { amount: Number(value.toFixed(2)) }, [
        'Valor da parcela atualizado',
        `Parcela ${i.number} agora é ${BRL(value)}`,
      ])
      return
    }

    const value = draft || null
    if (value === (field === 'dueDate' ? i.dueDate : i.paidAt)) return
    if (field === 'paidAt' && !value) return
    await apply(
      i.number,
      field === 'dueDate' ? { dueDate: value } : { paidAt: value },
      field === 'dueDate'
        ? ['Vencimento atualizado', value ? `Parcela ${i.number} vence em ${fmtDate(value)}` : `Parcela ${i.number} voltou a ser condicionada`]
        : ['Data de pagamento atualizada', `Parcela ${i.number} paga em ${fmtDate(value)}`],
    )
  }

  const confirmSprint = async () => {
    if (!detail || sprintAsk === null) return
    const sprint = detail.sprints.find((s) => s.number === sprintAsk)
    const number = sprintAsk
    setSprintAsk(null)
    if (!sprint) return
    try {
      const updated = await api.projects.setSprint(projectId, number, !sprint.validated)
      accept(updated)
      const freed = updated.installments.filter((i) => i.sprintNumber === number && !i.paid)
      onToast(
        sprint.validated ? `Validação da Sprint ${number} desfeita` : `Sprint ${number} validada`,
        sprint.validated
          ? 'A parcela ligada a ela voltou a aguardar a sprint.'
          : freed.length
            ? `${freed.map((i) => `${i.description} (${BRL(i.amount)})`).join(', ')} já pode ser cobrada.`
            : 'Nenhuma parcela depende desta sprint.',
      )
    } catch (e) {
      fail(e)
    }
  }

  const nfPct = detail ? Math.round((detail.nfCount / Math.max(1, detail.installmentCount)) * 100) : 0
  const askedSprint = detail?.sprints.find((s) => s.number === sprintAsk) ?? null
  const askedInstallments = detail?.installments.filter((i) => i.sprintNumber === sprintAsk && !i.paid) ?? []

  return (
    <Sheet
      open
      onClose={onClose}
      desktop={desktop}
      width={desktop ? 860 : 460}
      title={detail?.name ?? 'Parcelas'}
      subtitle={
        detail
          ? replanning
            ? 'Preço, número de parcelas e quanto já foi pago'
            : [detail.client, detail.product, detail.po && `P.O. ${detail.po}`].filter(Boolean).join(' · ')
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
            accept(updated)
            setReplanning(false)
          }}
        />
      ) : (
        <>
          {detail.notes && (
            <div
              style={{
                fontSize: 13,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--muted)',
                color: 'var(--fg)',
                lineHeight: 1.5,
              }}
            >
              {detail.notes}
            </div>
          )}

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
                flexWrap: 'wrap',
                gap: 8,
                fontSize: 12.5,
                color: 'var(--mutedfg)',
                marginBottom: 8,
              }}
            >
              <span>
                {detail.paidCount} de {detail.installmentCount} parcelas pagas · {nfPct}% das NFs emitidas
              </span>
              <span className="num">{BRL(detail.total)} no contrato</span>
            </div>
            <ProgressBar pct={`${Math.round((detail.paid / Math.max(0.01, detail.total)) * 100)}%`} />
          </div>

          {detail.sprints.length > 0 && (
            <SprintBar detail={detail} onPick={(n) => setSprintAsk(n)} />
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="scroll-x">
              <table className="data" style={{ minWidth: 720 }}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 16 }}>Nº</th>
                    <th>Parcela</th>
                    <th>Vencimento</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                    <th>Situação</th>
                    <th style={{ paddingRight: 16 }}>NF</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.installments.map((i) => {
                    const status = installmentStatus(i)
                    const isNext = detail.nextNumber === i.number
                    const disabled = busy === i.number
                    const editingThis = editing?.number === i.number ? editing.field : null
                    return (
                      <tr
                        key={i.number}
                        style={{
                          background: isNext ? 'color-mix(in oklch,var(--primary) 6%,transparent)' : 'transparent',
                          opacity: disabled ? 0.6 : 1,
                          verticalAlign: 'top',
                        }}
                      >
                        <td style={{ paddingLeft: 16, paddingTop: 13, fontWeight: 600 }}>
                          {i.number}/{detail.installmentCount}
                        </td>
                        <td style={{ paddingTop: 13, maxWidth: 260 }}>
                          <div style={{ fontWeight: 500 }}>{i.description || 'Parcela'}</div>
                          {i.notes && (
                            <div style={{ fontSize: 11.5, color: 'var(--mutedfg)', marginTop: 3, lineHeight: 1.45 }}>
                              {i.notes}
                            </div>
                          )}
                        </td>
                        <td style={{ paddingTop: 8 }}>
                          {editingThis === 'dueDate' ? (
                            <DateInput
                              value={draft}
                              label={`Vencimento da parcela ${i.number}`}
                              onChange={setDraft}
                              onCommit={() => void commit(i)}
                              onCancel={() => setEditing(null)}
                            />
                          ) : (
                            <InlineButton
                              title={i.dueDate ? 'Editar vencimento' : 'Definir vencimento'}
                              onClick={() => startEdit(i, 'dueDate')}
                            >
                              {i.dueDate ? (
                                fmtDate(i.dueDate)
                              ) : (
                                <span style={{ color: 'var(--mutedfg)' }}>
                                  {i.sprintNumber ? `após Sprint ${i.sprintNumber}` : 'a definir'}
                                </span>
                              )}
                            </InlineButton>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', paddingTop: 8 }}>
                          {editingThis === 'amount' ? (
                            <input
                              autoFocus
                              className="field num"
                              value={draft}
                              aria-label={`Valor da parcela ${i.number}`}
                              onChange={(e) => setDraft(e.target.value)}
                              onBlur={() => void commit(i)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.blur()
                                if (e.key === 'Escape') setEditing(null)
                              }}
                              style={{ height: 30, width: 120, textAlign: 'right', fontSize: 13 }}
                            />
                          ) : (
                            <InlineButton
                              title="Editar valor"
                              label={`Editar valor da parcela ${i.number}`}
                              onClick={() => startEdit(i, 'amount')}
                            >
                              <span className="num">{BRL(i.amount)}</span>
                            </InlineButton>
                          )}
                          {i.paidAmount !== null && i.paidAmount !== i.amount && (
                            <div className="num" style={{ fontSize: 11.5, color: 'var(--amber)', marginTop: 2, paddingRight: 7 }}>
                              recebido {BRL(i.paidAmount)}
                            </div>
                          )}
                        </td>
                        <td style={{ paddingTop: 11 }}>
                          <ToggleChip
                            tone={statusTone(status)}
                            disabled={disabled}
                            title={i.paid ? 'Marcar como não paga' : 'Marcar como paga hoje'}
                            onClick={() =>
                              void apply(i.number, { paid: !i.paid }, [
                                i.paid ? 'Pagamento desfeito' : 'Parcela marcada como paga',
                                `Parcela ${i.number} · ${BRL(i.amount)}`,
                              ])
                            }
                          >
                            {status === 'Aguarda sprint' ? `Aguarda Sprint ${i.sprintNumber}` : status}
                          </ToggleChip>
                          {i.paid && (
                            <div style={{ marginTop: 4 }}>
                              {editingThis === 'paidAt' ? (
                                <DateInput
                                  value={draft}
                                  label={`Data de pagamento da parcela ${i.number}`}
                                  onChange={setDraft}
                                  onCommit={() => void commit(i)}
                                  onCancel={() => setEditing(null)}
                                />
                              ) : (
                                <InlineButton title="Editar data de pagamento" onClick={() => startEdit(i, 'paidAt')}>
                                  <span style={{ fontSize: 11.5, color: 'var(--mutedfg)' }}>
                                    {i.paidAt ? `em ${fmtDate(i.paidAt)}` : 'data não registrada'}
                                  </span>
                                </InlineButton>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ paddingRight: 16, paddingTop: 11 }}>
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
            Clique no vencimento, no valor ou na data de pagamento para editar, e nas etiquetas para alternar
            pagamento e NF. Parcelas sem vencimento dependem de um marco — defina a data quando ele ocorrer.
          </p>

          <button className="btn-ghost" onClick={() => setReplanning(true)} style={{ height: 42, fontSize: 13.5 }}>
            Alterar preço, número de parcelas ou vencimentos
          </button>
        </>
      )}

      <ConfirmDialog
        open={askedSprint !== null}
        onClose={() => setSprintAsk(null)}
        title={askedSprint?.validated ? `Desfazer validação da Sprint ${sprintAsk}?` : `Validar a Sprint ${sprintAsk}?`}
        confirmLabel={askedSprint?.validated ? 'Desfazer' : 'Validar sprint'}
        destructive={!!askedSprint?.validated}
        onConfirm={() => void confirmSprint()}
      >
        <p style={{ margin: '12px 0 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--mutedfg)' }}>
          {askedSprint?.validated
            ? 'A sprint volta a ficar pendente e as parcelas que ela tinha liberado voltam a aguardá-la.'
            : askedInstallments.length
              ? `Libera a cobrança de ${askedInstallments
                  .map((i) => `${i.description} (${BRL(i.amount)})`)
                  .join(', ')}, com vencimento hoje.`
              : 'Nenhuma parcela em aberto depende desta sprint; ela só fica registrada como validada.'}
        </p>
      </ConfirmDialog>
    </Sheet>
  )
}

/** Linha de sprints: validadas, a atual (primeira pendente) e as que liberam cobrança. */
function SprintBar({ detail, onPick }: { detail: ProjectDetail; onPick: (n: number) => void }) {
  const current = detail.sprints.find((s) => !s.validated)?.number ?? null
  const charged = new Set(detail.installments.filter((i) => i.sprintNumber).map((i) => i.sprintNumber))

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Sprints</span>
        <span style={{ fontSize: 12, color: 'var(--mutedfg)' }}>
          {detail.lastValidatedSprint
            ? `${detail.lastValidatedSprint} de ${detail.sprintCount} validadas`
            : `nenhuma de ${detail.sprintCount} validada`}
          {detail.nextSprint ? ` · próxima cobrança após a Sprint ${detail.nextSprint}` : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {detail.sprints.map((s) => {
          const isCurrent = s.number === current
          const pays = charged.has(s.number)
          return (
            <button
              key={s.number}
              onClick={() => onPick(s.number)}
              title={
                (s.validated
                  ? `Validada${s.validatedAt ? ` em ${fmtDate(s.validatedAt)}` : ''} — clique para desfazer`
                  : 'Clique para validar') + (pays ? ' · libera pagamento' : '')
              }
              aria-label={`Sprint ${s.number}${s.validated ? ' validada' : ''}`}
              style={{
                minWidth: 38,
                height: 34,
                padding: '0 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                borderRadius: 9,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                border: `1px solid ${
                  s.validated
                    ? 'transparent'
                    : isCurrent
                      ? 'var(--primary)'
                      : pays
                        ? 'color-mix(in oklch,var(--amber) 60%,transparent)'
                        : 'var(--border)'
                }`,
                background: s.validated ? 'var(--primary)' : 'transparent',
                color: s.validated ? '#fff' : pays ? 'var(--amber)' : 'var(--fg)',
              }}
            >
              {s.validated && '✓'}
              {s.number}
              {pays && !s.validated && <span aria-hidden>R$</span>}
            </button>
          )
        })}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--mutedfg)', marginTop: 8 }}>
        Clique numa sprint para validá-la. As marcadas com R$ liberam uma parcela quando validadas.
      </div>
    </div>
  )
}

function DateInput({
  value,
  label,
  onChange,
  onCommit,
  onCancel,
}: {
  value: string
  label: string
  onChange: (v: string) => void
  onCommit: () => void
  onCancel: () => void
}) {
  return (
    <input
      autoFocus
      type="date"
      className="field"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') onCancel()
      }}
      style={{ height: 30, width: 150, fontSize: 12.5, padding: '0 8px' }}
    />
  )
}

function InlineButton({
  children,
  onClick,
  title,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  label?: string
}) {
  return (
    <button
      title={title}
      aria-label={label}
      onClick={onClick}
      style={{
        border: '1px dashed transparent',
        borderRadius: 7,
        background: 'transparent',
        color: 'var(--fg)',
        font: 'inherit',
        padding: '4px 7px',
        cursor: 'text',
        textAlign: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'transparent'
      }}
    >
      {children}
    </button>
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
