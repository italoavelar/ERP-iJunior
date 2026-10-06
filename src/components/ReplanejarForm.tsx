import { useMemo, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { BRL, fmtDate, parseAmount, today } from '../lib/format'
import type { ProjectDetail } from '../lib/types'

/** Soma em centavos para não acumular erro de ponto flutuante. */
const splitPreview = (total: number, count: number) => {
  if (!Number.isFinite(total) || count <= 0) return []
  const cents = Math.round(total * 100)
  const base = Math.floor(cents / count)
  const out = Array.from({ length: count }, () => base)
  out[count - 1] = cents - base * (count - 1)
  return out.map((c) => c / 100)
}

const addMonths = (iso: string, months: number) => {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(Date.UTC(y, m - 1 + months, d)).toISOString().slice(0, 10)
}

/**
 * Preço, número de parcelas e quanto já foi pago. Como total e pago são
 * somados das parcelas, mudar qualquer um deles é refazer o plano.
 */
export function ReplanejarForm({
  detail,
  onDone,
  onCancel,
  onToast,
}: {
  detail: ProjectDetail
  onDone: (p: ProjectDetail) => void
  onCancel: () => void
  onToast: (title: string, body: string, tone?: string) => void
}) {
  const [total, setTotal] = useState(detail.total.toFixed(2).replace('.', ','))
  const [count, setCount] = useState(String(detail.installmentCount))
  const [paidCount, setPaidCount] = useState(
    String(detail.installments.filter((i) => i.paid).length),
  )
  const [firstDueDate, setFirstDueDate] = useState(
    detail.installments[0]?.dueDate ?? today(),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const totalNum = parseAmount(total)
  const countNum = Number(count)
  const paidNum = Number(paidCount)

  const preview = useMemo(() => {
    if (!Number.isFinite(totalNum) || !Number.isInteger(countNum) || countNum < 1) return null
    const amounts = splitPreview(totalNum, countNum)
    const k = Math.min(Math.max(paidNum || 0, 0), countNum)
    const paid = amounts.slice(0, k).reduce((a, v) => a + Math.round(v * 100), 0) / 100
    return {
      first: amounts[0] ?? 0,
      last: amounts[countNum - 1] ?? 0,
      uniform: amounts.every((v) => v === amounts[0]),
      paid,
      remaining: Math.round((totalNum - paid) * 100) / 100,
      lastDue: addMonths(firstDueDate, countNum - 1),
    }
  }, [totalNum, countNum, paidNum, firstDueDate])

  const save = async () => {
    setErrors({})
    setSaving(true)
    try {
      const updated = await api.projects.replan(detail.id, {
        total: Number(totalNum.toFixed(2)),
        count: countNum,
        firstDueDate,
        paidCount: paidNum,
      })
      onToast('Plano atualizado', `${updated.installmentCount} parcelas · ${BRL(updated.total)}`)
      onDone(updated)
    } catch (e) {
      if (e instanceof ApiError && e.issues.length) {
        setErrors(Object.fromEntries(e.issues.map((i) => [i.path, i.message])))
      } else {
        onToast(
          'Não deu para replanejar',
          e instanceof Error ? e.message : String(e),
          'var(--destructive)',
        )
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
        <div>
          <label className="label" htmlFor="rp-total">
            Preço total
          </label>
          <input
            id="rp-total"
            className={`field num ${errors.total ? 'invalid' : ''}`}
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            inputMode="decimal"
          />
          {errors.total && <span className="error-text">{errors.total}</span>}
        </div>

        <div>
          <label className="label" htmlFor="rp-count">
            Número de parcelas
          </label>
          <input
            id="rp-count"
            className={`field num ${errors.count ? 'invalid' : ''}`}
            value={count}
            onChange={(e) => setCount(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
          />
          {errors.count && <span className="error-text">{errors.count}</span>}
        </div>

        <div>
          <label className="label" htmlFor="rp-first">
            Primeiro vencimento
          </label>
          <input
            id="rp-first"
            className={`field ${errors.firstDueDate ? 'invalid' : ''}`}
            type="date"
            value={firstDueDate}
            onChange={(e) => setFirstDueDate(e.target.value)}
          />
          {errors.firstDueDate && <span className="error-text">{errors.firstDueDate}</span>}
        </div>

        <div>
          <label className="label" htmlFor="rp-paid">
            Parcelas já pagas
          </label>
          <input
            id="rp-paid"
            className={`field num ${errors.paidCount ? 'invalid' : ''}`}
            value={paidCount}
            onChange={(e) => setPaidCount(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
          />
          {errors.paidCount && <span className="error-text">{errors.paidCount}</span>}
        </div>
      </div>

      {preview && (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: 'color-mix(in oklch,var(--primary) 7%,transparent)',
            border: '1px solid color-mix(in oklch,var(--primary) 22%,transparent)',
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--mutedfg)' }}>
            Como vai ficar
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
              gap: 12,
              marginTop: 12,
            }}
          >
            <Preview label="Valor da parcela" value={BRL(preview.first)} hint={preview.uniform ? undefined : `última ${BRL(preview.last)}`} />
            <Preview label="Valor pago" value={BRL(preview.paid)} accent />
            <Preview label="Falta pagar" value={BRL(preview.remaining)} />
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--mutedfg)', marginTop: 12 }}>
            {countNum} parcelas mensais, de {fmtDate(firstDueDate)} a {fmtDate(preview.lastDue)}.
          </div>
        </div>
      )}

      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--mutedfg)', lineHeight: 1.5 }}>
        O plano é refeito por inteiro. Descrição, observações e vínculo com sprint são preservados nas
        parcelas de mesmo número.
      </p>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          className="btn-ghost"
          onClick={onCancel}
          disabled={saving}
          style={{ flex: 1, height: 42, fontSize: 13.5 }}
        >
          Cancelar
        </button>
        <button
          className="btn-primary"
          onClick={() => void save()}
          disabled={saving || !preview}
          style={{ flex: 1, height: 42, fontSize: 13.5 }}
        >
          {saving ? 'Salvando…' : 'Aplicar plano'}
        </button>
      </div>
    </>
  )
}

function Preview({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint?: string
  accent?: boolean
}) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: 'var(--mutedfg)' }}>{label}</div>
      <div
        style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 700,
          fontSize: 16,
          marginTop: 4,
          color: accent ? 'var(--primary)' : undefined,
        }}
      >
        {value}
      </div>
      {hint && <div style={{ fontSize: 11, color: 'var(--mutedfg)', marginTop: 2 }}>{hint}</div>}
    </div>
  )
}
