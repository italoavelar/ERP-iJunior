import { useMemo } from 'react'
import { BRL, daysTo, fmtDate, today } from '../lib/format'
import type { InstallmentRow } from '../lib/types'

interface ProjectStats {
  projectId: string
  name: string
  client: string
  count: number
  paidCount: number
  /** Parcela paga mais recente, pela data de pagamento. */
  lastPaid: InstallmentRow | null
  /** Próxima parcela com vencimento a partir de hoje. */
  next: InstallmentRow | null
  /** Primeira parcela em aberto sem data, mostrada quando não há próxima datada. */
  undated: InstallmentRow | null
  overdue: InstallmentRow[]
  overdueAmount: number
}

const cents = (n: number) => Math.round(n * 100)

function statsFor(rows: InstallmentRow[], now: string): ProjectStats[] {
  const groups = new Map<string, InstallmentRow[]>()
  for (const r of rows) groups.set(r.projectId, [...(groups.get(r.projectId) ?? []), r])

  return [...groups.values()].map((list) => {
    const open = list.filter((r) => !r.paid)
    const paid = list.filter((r) => r.paid)
    const overdue = open.filter((r) => r.dueDate && r.dueDate < now)
    const upcoming = open
      .filter((r) => r.dueDate && r.dueDate >= now)
      .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
    const lastPaid =
      [...paid].sort(
        (a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? '') || b.number - a.number,
      )[0] ?? null

    return {
      projectId: list[0]!.projectId,
      name: list[0]!.projectName,
      client: list[0]!.client,
      count: list.length,
      paidCount: paid.length,
      lastPaid,
      next: upcoming[0] ?? null,
      undated: open.find((r) => !r.dueDate) ?? null,
      overdue,
      overdueAmount: overdue.reduce((a, r) => a + cents(r.amount), 0) / 100,
    }
  })
}

/** Quanto falta até uma data, em texto curto. */
function untilLabel(iso: string) {
  const d = daysTo(iso)
  if (d === 0) return { text: 'hoje', tone: 'var(--amber)' }
  if (d === 1) return { text: 'amanhã', tone: 'var(--amber)' }
  if (d < 31) return { text: `em ${d} dias`, tone: d <= 5 ? 'var(--amber)' : 'var(--mutedfg)' }
  const months = Math.round(d / 30)
  return { text: `em ${d} dias (~${months} ${months === 1 ? 'mês' : 'meses'})`, tone: 'var(--mutedfg)' }
}

/** Uma linha por projeto: total de parcelas, última paga, próxima e atrasos. */
export function ParcelasTabela({
  rows,
  onOpen,
}: {
  rows: InstallmentRow[]
  onOpen: (projectId: string) => void
}) {
  const now = today()
  const stats = useMemo(
    () =>
      statsFor(rows, now).sort(
        (a, b) =>
          b.overdue.length - a.overdue.length ||
          (a.next?.dueDate ?? '9999').localeCompare(b.next?.dueDate ?? '9999') ||
          a.name.localeCompare(b.name),
      ),
    [rows, now],
  )

  const totals = stats.reduce(
    (acc, s) => ({
      count: acc.count + s.count,
      paid: acc.paid + s.paidCount,
      overdue: acc.overdue + s.overdue.length,
      overdueAmount: acc.overdueAmount + cents(s.overdueAmount),
    }),
    { count: 0, paid: 0, overdue: 0, overdueAmount: 0 },
  )

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="scroll-x">
        <table className="data" style={{ minWidth: 820 }}>
          <thead>
            <tr>
              <th style={{ paddingLeft: 18 }}>Projeto</th>
              <th style={{ textAlign: 'right' }}>Parcelas</th>
              <th>Última parcela paga</th>
              <th>Próxima parcela</th>
              <th style={{ paddingRight: 18, textAlign: 'right' }}>Em atraso</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => {
              const settled = s.paidCount === s.count
              const until = s.next ? untilLabel(s.next.dueDate!) : null
              const oldest = s.overdue.reduce<string | null>(
                (min, r) => (min === null || r.dueDate! < min ? r.dueDate! : min),
                null,
              )
              return (
                <tr key={s.projectId} onClick={() => onOpen(s.projectId)} style={{ cursor: 'pointer' }} title="Ver parcelas">
                  <td style={{ padding: '13px 12px 13px 18px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{s.name}</div>
                    {s.client && (
                      <div className="truncate" style={{ fontSize: 12, color: 'var(--mutedfg)', marginTop: 2, maxWidth: 220 }}>
                        {s.client}
                      </div>
                    )}
                  </td>
                  <td className="num" style={{ textAlign: 'right', padding: '13px 12px' }}>
                    <span style={{ fontWeight: 600 }}>{s.count}</span>
                    <div style={{ fontSize: 12, color: 'var(--mutedfg)', marginTop: 2 }}>
                      {s.paidCount} {s.paidCount === 1 ? 'paga' : 'pagas'}
                    </div>
                  </td>
                  <td style={{ padding: '13px 12px' }}>
                    {s.lastPaid ? (
                      <>
                        <div>
                          {s.lastPaid.number}/{s.count}
                          {s.lastPaid.description && (
                            <span style={{ color: 'var(--mutedfg)' }}> · {s.lastPaid.description}</span>
                          )}
                        </div>
                        <div className="num" style={{ fontSize: 12, color: 'var(--mutedfg)', marginTop: 2 }}>
                          {s.lastPaid.paidAt ? `paga em ${fmtDate(s.lastPaid.paidAt)}` : 'data não registrada'}
                        </div>
                      </>
                    ) : (
                      <span style={{ color: 'var(--mutedfg)' }}>nenhuma ainda</span>
                    )}
                  </td>
                  <td style={{ padding: '13px 12px' }}>
                    {settled ? (
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Quitado</span>
                    ) : s.next ? (
                      <>
                        <div className="num">
                          {fmtDate(s.next.dueDate)} · {BRL(s.next.amount)}
                        </div>
                        <div style={{ fontSize: 12, color: until!.tone, marginTop: 2, fontWeight: 600 }}>{until!.text}</div>
                      </>
                    ) : s.undated ? (
                      <>
                        <div style={{ color: s.undated.sprintNumber ? 'var(--amber)' : 'var(--fg)' }}>
                          {s.undated.sprintNumber ? `Após a Sprint ${s.undated.sprintNumber}` : 'Data a definir'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--mutedfg)', marginTop: 2 }}>
                          {s.undated.description || 'parcela'} · {BRL(s.undated.amount)}
                        </div>
                      </>
                    ) : (
                      <span style={{ color: 'var(--mutedfg)' }}>só parcelas em atraso</span>
                    )}
                  </td>
                  <td style={{ padding: '13px 18px 13px 12px', textAlign: 'right' }}>
                    {s.overdue.length ? (
                      <>
                        <span
                          className="chip"
                          style={{
                            background: 'color-mix(in oklch,var(--destructive) 12%,transparent)',
                            color: 'var(--destructive)',
                          }}
                        >
                          {s.overdue.length} {s.overdue.length === 1 ? 'parcela' : 'parcelas'}
                        </span>
                        <div className="num" style={{ fontSize: 12, color: 'var(--destructive)', marginTop: 5 }}>
                          {BRL(s.overdueAmount)}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--mutedfg)', marginTop: 1 }}>
                          desde {fmtDate(oldest)} ({Math.abs(daysTo(oldest!))} dias)
                        </div>
                      </>
                    ) : (
                      <span style={{ color: 'var(--mutedfg)' }}>—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--muted)', fontWeight: 600 }}>
              <td style={{ padding: '12px 12px 12px 18px' }}>Total · {stats.length} projetos</td>
              <td className="num" style={{ textAlign: 'right', padding: 12 }}>
                {totals.count}
                <div style={{ fontSize: 12, color: 'var(--mutedfg)', fontWeight: 400 }}>{totals.paid} pagas</div>
              </td>
              <td />
              <td />
              <td className="num" style={{ textAlign: 'right', padding: '12px 18px 12px 12px', color: totals.overdue ? 'var(--destructive)' : undefined }}>
                {totals.overdue} {totals.overdue === 1 ? 'parcela' : 'parcelas'}
                <div style={{ fontSize: 12, fontWeight: 400 }}>{BRL(totals.overdueAmount / 100)}</div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
