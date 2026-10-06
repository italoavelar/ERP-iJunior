import { useMemo, useState } from 'react'
import { IconChevron } from './Icons'
import { BRL, fmtDate, installmentStatus, today, type InstallmentStatus } from '../lib/format'
import { statusTone } from '../lib/tone'
import type { InstallmentRow } from '../lib/types'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const pad = (n: number) => String(n).padStart(2, '0')
const isoOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

/** Onde a parcela aparece: no vencimento; se não tem, na data em que foi paga. */
const placedOn = (i: InstallmentRow) => i.dueDate ?? (i.paid ? i.paidAt : null)

const sumCents = (list: InstallmentRow[], f: (i: InstallmentRow) => number) =>
  list.reduce((acc, i) => acc + Math.round(f(i) * 100), 0) / 100

/** Calendário mensal com as parcelas no dia do vencimento. */
export function ParcelasCalendario({
  rows,
  desktop,
  onOpen,
}: {
  rows: InstallmentRow[]
  desktop: boolean
  onOpen: (projectId: string) => void
}) {
  const now = today()
  const [ym, setYm] = useState(() => ({ y: Number(now.slice(0, 4)), m: Number(now.slice(5, 7)) - 1 }))

  const shift = (delta: number) =>
    setYm(({ y, m }) => {
      const t = m + delta
      return { y: y + Math.floor(t / 12), m: ((t % 12) + 12) % 12 }
    })

  const byDay = useMemo(() => {
    const map = new Map<string, InstallmentRow[]>()
    for (const r of rows) {
      const d = placedOn(r)
      if (!d) continue
      map.set(d, [...(map.get(d) ?? []), r])
    }
    return map
  }, [rows])

  const undated = rows.filter((r) => !placedOn(r))
  const monthKey = `${ym.y}-${pad(ym.m + 1)}`
  const inMonth = rows.filter((r) => placedOn(r)?.startsWith(monthKey))
  const statusOf = (r: InstallmentRow) => installmentStatus(r)
  const monthPaid = inMonth.filter((r) => r.paid)
  const monthOpen = inMonth.filter((r) => !r.paid && statusOf(r) !== 'Vencida')
  const monthLate = inMonth.filter((r) => statusOf(r) === 'Vencida')
  const allLate = rows.filter((r) => statusOf(r) === 'Vencida')

  const label = new Date(ym.y, ym.m, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const firstWeekday = new Date(ym.y, ym.m, 1).getDay()
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, k) => k + 1),
  ]
  while (cells.length % 7) cells.push(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="btn-ghost" aria-label="Mês anterior" onClick={() => shift(-1)} style={navBtn}>
            <IconChevron dir="left" />
          </button>
          <button className="btn-ghost" aria-label="Próximo mês" onClick={() => shift(1)} style={navBtn}>
            <IconChevron />
          </button>
          <h2
            className="h2"
            style={{ marginLeft: 6, textTransform: 'capitalize', minWidth: 170 }}
            aria-live="polite"
          >
            {label}
          </h2>
        </div>
        <button
          className="btn-ghost"
          onClick={() => setYm({ y: Number(now.slice(0, 4)), m: Number(now.slice(5, 7)) - 1 })}
          style={{ height: 34, padding: '0 14px', fontSize: 13 }}
        >
          Hoje
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: desktop ? 'repeat(3,minmax(0,1fr))' : '1fr', gap: 10 }}>
        <Stat label="Pagas no mês" value={BRL(sumCents(monthPaid, (r) => r.paidAmount ?? r.amount))} hint={plural(monthPaid.length)} tone="var(--blue)" />
        <Stat label="A vencer no mês" value={BRL(sumCents(monthOpen, (r) => r.amount))} hint={plural(monthOpen.length)} tone="var(--primary)" />
        <Stat
          label="Vencidas no mês"
          value={BRL(sumCents(monthLate, (r) => r.amount))}
          hint={`${plural(monthLate.length)}${allLate.length > monthLate.length ? ` · ${allLate.length} no total` : ''}`}
          tone="var(--destructive)"
        />
      </div>

      {desktop ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', background: 'var(--muted)' }}>
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                style={{
                  padding: '9px 10px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  letterSpacing: '.04em',
                  textTransform: 'uppercase',
                  color: 'var(--mutedfg)',
                }}
              >
                {w}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))' }}>
            {cells.map((day, idx) => {
              const iso = day ? isoOf(ym.y, ym.m, day) : null
              const items = iso ? (byDay.get(iso) ?? []) : []
              const isToday = iso === now
              return (
                <div
                  key={idx}
                  style={{
                    minHeight: 104,
                    padding: 6,
                    borderTop: '1px solid var(--border)',
                    borderLeft: idx % 7 ? '1px solid var(--border)' : undefined,
                    background: day ? undefined : 'color-mix(in oklch,var(--muted) 45%,transparent)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    minWidth: 0,
                  }}
                >
                  {day && (
                    <span
                      style={{
                        alignSelf: 'flex-start',
                        minWidth: 24,
                        height: 24,
                        padding: '0 6px',
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 99,
                        fontSize: 12,
                        fontWeight: isToday ? 700 : 500,
                        background: isToday ? 'var(--primary)' : undefined,
                        color: isToday ? '#fff' : 'var(--mutedfg)',
                      }}
                    >
                      {day}
                    </span>
                  )}
                  {items.slice(0, 3).map((r) => (
                    <Entry key={`${r.projectId}-${r.number}`} r={r} status={statusOf(r)} onOpen={onOpen} compact />
                  ))}
                  {items.length > 3 && (
                    <span style={{ fontSize: 11, color: 'var(--mutedfg)', paddingLeft: 4 }} title={items.slice(3).map((r) => r.projectName).join(', ')}>
                      +{items.length - 3} mais
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <Agenda days={cells.filter((d): d is number => d !== null).map((d) => isoOf(ym.y, ym.m, d))} byDay={byDay} now={now} statusOf={statusOf} onOpen={onOpen} />
      )}

      <Legend />

      {undated.length > 0 && (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Sem data definida ({undated.length})</div>
          <div style={{ fontSize: 12, color: 'var(--mutedfg)', marginTop: 3 }}>
            Dependem de um marco — sprint, entrega ou assinatura. Aparecem no calendário quando ganham vencimento.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: desktop ? 'repeat(2,minmax(0,1fr))' : '1fr', gap: 6, marginTop: 12 }}>
            {undated.map((r) => (
              <Entry key={`${r.projectId}-${r.number}`} r={r} status={statusOf(r)} onOpen={onOpen} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const navBtn = { width: 34, height: 34, display: 'grid', placeItems: 'center', padding: 0 } as const

const plural = (n: number) => (n === 1 ? '1 parcela' : `${n} parcelas`)

/** Uma parcela no calendário. Clicar abre o plano do projeto. */
function Entry({
  r,
  status,
  onOpen,
  compact,
}: {
  r: InstallmentRow
  status: InstallmentStatus
  onOpen: (projectId: string) => void
  compact?: boolean
}) {
  const [bg, fg] = statusTone(status)
  const when = r.dueDate ? `vence ${fmtDate(r.dueDate)}` : r.paidAt ? `paga ${fmtDate(r.paidAt)}` : r.sprintNumber ? `após a Sprint ${r.sprintNumber}` : 'data a definir'
  return (
    <button
      onClick={() => onOpen(r.projectId)}
      title={`${r.projectName} — parcela ${r.number}/${r.count}${r.description ? ` (${r.description})` : ''} · ${BRL(r.amount)} · ${status} · ${when}`}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        border: 0,
        borderLeft: `3px solid ${fg}`,
        borderRadius: 6,
        background: bg,
        color: 'var(--fg)',
        padding: compact ? '3px 6px' : '7px 10px',
        cursor: 'pointer',
        font: 'inherit',
        minWidth: 0,
      }}
    >
      <div className="truncate" style={{ fontSize: compact ? 11.5 : 13, fontWeight: 600 }}>
        {r.projectName}
        {!compact && (
          <span style={{ fontWeight: 400, color: 'var(--mutedfg)' }}>
            {' '}
            · {r.number}/{r.count}
            {r.description ? ` · ${r.description}` : ''}
          </span>
        )}
      </div>
      <div className="num truncate" style={{ fontSize: compact ? 11 : 12, color: fg, fontWeight: 600 }}>
        {BRL(r.amount)}
        {!compact && <span style={{ fontWeight: 400, color: 'var(--mutedfg)' }}> · {when}</span>}
      </div>
    </button>
  )
}

/** No celular a grade não cabe: lista só os dias com parcela. */
function Agenda({
  days,
  byDay,
  now,
  statusOf,
  onOpen,
}: {
  days: string[]
  byDay: Map<string, InstallmentRow[]>
  now: string
  statusOf: (r: InstallmentRow) => InstallmentStatus
  onOpen: (projectId: string) => void
}) {
  const withItems = days.filter((d) => byDay.has(d))
  if (!withItems.length) {
    return (
      <div className="card" style={{ padding: 20, fontSize: 13.5, color: 'var(--mutedfg)', textAlign: 'center' }}>
        Nenhuma parcela neste mês.
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {withItems.map((d) => (
        <div key={d} className="card" style={{ padding: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: d === now ? 'var(--primary)' : 'var(--mutedfg)', marginBottom: 8 }}>
            {new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {d === now && ' · hoje'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {byDay.get(d)!.map((r) => (
              <Entry key={`${r.projectId}-${r.number}`} r={r} status={statusOf(r)} onOpen={onOpen} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Legend() {
  const items: InstallmentStatus[] = ['Paga', 'A vencer', 'Vencida', 'Aguarda sprint', 'Condicionada']
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, color: 'var(--mutedfg)' }}>
      {items.map((s) => (
        <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: statusTone(s)[1] }} />
          {s}
        </span>
      ))}
    </div>
  )
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: string }) {
  return (
    <div className="card" style={{ padding: 14, borderLeft: `3px solid ${tone}` }}>
      <div style={{ fontSize: 12, color: 'var(--mutedfg)' }}>{label}</div>
      <div className="num" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, marginTop: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--mutedfg)', marginTop: 2 }}>{hint}</div>
    </div>
  )
}
