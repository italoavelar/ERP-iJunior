import { useEffect, useMemo, useState } from 'react'
import { Card, Chip, ProgressBar } from '../components/primitives'
import { ConfirmDialog, Sheet } from '../components/Overlay'
import { IconChevronLeft, IconDoc } from '../components/Icons'
import type { Project } from '../data/mock'
import { BRL, parseBRL } from '../lib/format'
import { nfTone, statusTone } from '../lib/tone'

const INSTALLMENTS = 6
const DUE_DATES = ['10/03/2026', '10/04/2026', '10/05/2026', '10/06/2026', '10/09/2026', '10/10/2026']

/** O design referencia uma lista de documentos mas não a define; mock mínimo. */
const DOCS = [
  { name: 'Contrato assinado.pdf', meta: '1,2 MB' },
  { name: 'Proposta comercial.pdf', meta: '840 KB' },
  { name: 'NF parcela 3.pdf', meta: '210 KB' },
]

export function ProjetoDetalhe({
  project,
  desktop,
  canEstornar,
  openRecebInitially,
  onBack,
  onToast,
}: {
  project: Project
  desktop: boolean
  canEstornar: boolean
  openRecebInitially: boolean
  onBack: () => void
  onToast: (title: string, body: string, tone?: string) => void
}) {
  const [nextNF, setNextNF] = useState(false)
  const [receb, setReceb] = useState(openRecebInitially)
  const [estorno, setEstorno] = useState(false)
  const [amount, setAmount] = useState('4.332,02')
  const [amountError, setAmountError] = useState(false)

  useEffect(() => setReceb(openRecebInitially), [openRecebInitially, project.id])

  const per = project.total / INSTALLMENTS
  const paidCount = Math.round(project.paid / per)

  const installments = useMemo(
    () =>
      Array.from({ length: INSTALLMENTS }, (_, i) => {
        const isPaid = i < paidCount
        const isNext = i === paidCount
        const late = project.status === 'Inadimplente' && isNext
        const status = isPaid ? 'Paga' : late ? 'Vencida' : isNext ? 'A vencer' : 'Programada'
        const toneKey =
          status === 'Paga'
            ? 'Concluído'
            : status === 'Vencida'
              ? 'Inadimplente'
              : status === 'A vencer'
                ? 'Em dia'
                : 'Pausado'
        const hasNF = isPaid || (isNext && nextNF)
        return {
          key: i,
          label: `${i + 1}/${INSTALLMENTS}`,
          date: DUE_DATES[i],
          value: BRL(per),
          status,
          tone: statusTone(toneKey),
          nf: hasNF,
          isNext,
          showBaixa: !isPaid,
        }
      }),
    [paidCount, per, project.status, nextNF],
  )

  const pct = Math.round((project.paid / project.total) * 100) + '%'
  const threeCols = desktop ? 'repeat(3,minmax(0,1fr))' : '1fr'
  const detailCols = desktop ? 'minmax(0,1.5fr) minmax(0,1fr)' : '1fr'

  const submitReceb = () => {
    const v = parseBRL(amount)
    if (!v || v <= 0) {
      setAmountError(true)
      return
    }
    setReceb(false)
    setAmountError(false)
    onToast('Recebimento registrado', `${BRL(v)} baixado na parcela 4 · saldo atualizado.`)
  }

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          border: 0,
          background: 'transparent',
          padding: 0,
          marginBottom: 16,
          color: 'var(--mutedfg)',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        <IconChevronLeft />
        Projetos
      </button>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <h1 className="display" style={{ fontSize: 29, lineHeight: 1.2 }}>
              {project.name}
            </h1>
            <Chip tone={statusTone(project.status)}>{project.status}</Chip>
            <span
              style={{
                padding: '5px 10px',
                borderRadius: 7,
                fontSize: 11.5,
                fontWeight: 600,
                background: 'var(--muted)',
                color: 'var(--mutedfg)',
              }}
            >
              {project.product}
            </span>
          </div>
          <p style={{ margin: '9px 0 0', fontSize: 13.5, color: 'var(--mutedfg)' }}>
            {project.client} · paga: {project.payer} · gerente: {project.manager}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canEstornar && (
            <button
              className="btn-ghost"
              onClick={() => setEstorno(true)}
              style={{ height: 40, padding: '0 15px', fontSize: 13.5 }}
            >
              Estornar
            </button>
          )}
          <button
            className="btn-primary"
            onClick={() => setReceb(true)}
            style={{ height: 40, padding: '0 16px', fontSize: 13.5 }}
          >
            Registrar recebimento
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: threeCols, gap: 14, marginTop: 22 }}>
        <Card>
          <div style={{ fontSize: 12.5, color: 'var(--mutedfg)' }}>Total contratado</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 22, marginTop: 7 }}>
            {BRL(project.total)}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 12.5, color: 'var(--mutedfg)' }}>Pago</div>
          <div
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 700,
              fontSize: 22,
              marginTop: 7,
              color: 'var(--primary)',
            }}
          >
            {BRL(project.paid)}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 12.5, color: 'var(--mutedfg)' }}>Restante</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 22, marginTop: 7 }}>
            {BRL(project.total - project.paid)}
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: 14 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12.5,
            color: 'var(--mutedfg)',
          }}
        >
          <span>{pct} pago</span>
          <span>
            {paidCount} de {INSTALLMENTS} parcelas quitadas
          </span>
        </div>
        <div style={{ marginTop: 9 }}>
          <ProgressBar pct={pct} />
        </div>
      </Card>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: detailCols,
          gap: 14,
          marginTop: 14,
          alignItems: 'start',
        }}
      >
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 18px 12px' }}>
            <h2 className="h2">Plano de parcelas</h2>
            <p style={{ margin: '5px 0 0', fontSize: 12.5, color: 'var(--mutedfg)' }}>
              6 parcelas mensais · vencimento todo dia 10
            </p>
          </div>
          <div className="scroll-x">
            <table className="data" style={{ minWidth: 560 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 18 }}>Nº</th>
                  <th>Vencimento</th>
                  <th style={{ textAlign: 'right' }}>Valor</th>
                  <th>Status</th>
                  <th>NF</th>
                  <th style={{ paddingRight: 18 }} />
                </tr>
              </thead>
              <tbody>
                {installments.map((i) => (
                  <tr
                    key={i.key}
                    style={{
                      background: i.isNext
                        ? 'color-mix(in oklch,var(--primary) 6%,transparent)'
                        : 'transparent',
                      boxShadow: i.isNext
                        ? 'inset 0 0 0 1.5px color-mix(in oklch,var(--ring) 55%,transparent)'
                        : 'none',
                    }}
                  >
                    <td style={{ paddingLeft: 18, fontWeight: 600 }}>{i.label}</td>
                    <td style={{ color: 'var(--mutedfg)' }}>{i.date}</td>
                    <td className="num" style={{ textAlign: 'right' }}>
                      {i.value}
                    </td>
                    <td>
                      <Chip tone={i.tone}>{i.status}</Chip>
                    </td>
                    <td>
                      <Chip tone={nfTone(i.nf)}>{i.nf ? 'NF emitida' : 'Sem NF'}</Chip>
                    </td>
                    <td style={{ paddingRight: 18, textAlign: 'right' }}>
                      {i.showBaixa && (
                        <button
                          className="btn-ghost"
                          onClick={() => setReceb(true)}
                          style={{ height: 30, padding: '0 11px', fontSize: 12, borderRadius: 8 }}
                        >
                          Dar baixa
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <h2 className="h2">Notas fiscais</h2>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 22, marginTop: 8 }}>
              {paidCount + (nextNF ? 1 : 0)} de {INSTALLMENTS} NFs emitidas
            </div>
            <div
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 12,
                background: 'color-mix(in oklch,var(--primary) 7%,transparent)',
                border: '1px solid color-mix(in oklch,var(--primary) 22%,transparent)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>
                A NF da próxima parcela já foi emitida?
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 11 }}>
                <span
                  style={{
                    fontFamily: 'Sora, sans-serif',
                    fontWeight: 800,
                    fontSize: 20,
                    color: nextNF ? 'var(--primary)' : 'var(--destructive)',
                  }}
                >
                  {nextNF ? 'Sim' : 'Não'}
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--mutedfg)' }}>
                  parcela {paidCount + 1}/{INSTALLMENTS} ·{' '}
                  {DUE_DATES[Math.min(paidCount, INSTALLMENTS - 1)]}
                </span>
              </div>
              <button
                className="btn-ghost"
                onClick={() => setNextNF((v) => !v)}
                style={{ marginTop: 12, height: 34, padding: '0 13px', fontSize: 12.5, background: 'var(--card)' }}
              >
                {nextNF ? 'Marcar como não emitida' : 'Marcar NF como emitida'}
              </button>
            </div>
          </Card>

          <Card>
            <h2 className="h2" style={{ marginBottom: 12 }}>
              Documentos
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {DOCS.map((d) => (
                <div
                  key={d.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: '9px 11px',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                  }}
                >
                  <span style={{ color: 'var(--primary)', display: 'flex', flex: 'none' }}>
                    <IconDoc />
                  </span>
                  <span className="truncate" style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500 }}>
                    {d.name}
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--mutedfg)', flex: 'none' }}>{d.meta}</span>
                </div>
              ))}
            </div>
          </Card>

          <div
            style={{
              background: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: 18,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '.05em',
                textTransform: 'uppercase',
                color: 'var(--mutedfg)',
              }}
            >
              Somente leitura · módulo Projetos
            </div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17, marginTop: 8 }}>
              Sprint 3 de 5
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--mutedfg)', marginTop: 4 }}>
              Nome, gerente e sprint são mantidos em Projetos.
            </div>
          </div>
        </div>
      </div>

      <Sheet
        open={receb}
        onClose={() => setReceb(false)}
        desktop={desktop}
        width={desktop ? 460 : 440}
        title="Registrar recebimento"
        subtitle={`${project.name} · restante ${BRL(project.total - project.paid)}`}
        footer={
          <>
            <button
              className="btn-ghost"
              onClick={() => setReceb(false)}
              style={{ flex: 1, height: 42, fontSize: 13.5 }}
            >
              Cancelar
            </button>
            <button className="btn-primary" onClick={submitReceb} style={{ flex: 1, height: 42, fontSize: 13.5 }}>
              Registrar
            </button>
          </>
        }
      >
        <div>
          <label className="label" htmlFor="parcela">
            Parcela
          </label>
          <select id="parcela" className="field" style={{ cursor: 'pointer' }}>
            <option>Parcela 4 · vence 10/09/2026 · R$ 4.332,02</option>
            <option>Parcela 5 · vence 10/10/2026 · R$ 4.332,02</option>
            <option>Parcela 6 · vence 10/11/2026 · R$ 4.332,02</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="valor">
            Valor recebido
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: `1px solid ${amountError ? 'var(--destructive)' : 'var(--border)'}`,
              borderRadius: 10,
              overflow: 'hidden',
              background: 'var(--card)',
            }}
          >
            <span
              style={{
                padding: '0 11px',
                fontSize: 13.5,
                color: 'var(--mutedfg)',
                borderRight: '1px solid var(--border)',
                height: 40,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              R$
            </span>
            <input
              id="valor"
              className="num"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setAmountError(false)
              }}
              style={{
                flex: 1,
                height: 40,
                padding: '0 11px',
                border: 0,
                background: 'transparent',
                color: 'var(--fg)',
                fontSize: 13.5,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
            <button
              className="btn-ghost"
              onClick={() => {
                setAmount('4.332,02')
                setAmountError(false)
              }}
              style={{ height: 30, padding: '0 11px', fontSize: 12, borderRadius: 8 }}
            >
              Valor total
            </button>
            <span style={{ fontSize: 12, color: 'var(--mutedfg)' }}>
              ou informe um recebimento parcial
            </span>
          </div>
          {amountError && <span className="error-text">Informe um valor maior que zero.</span>}
        </div>
        <div>
          <label className="label" htmlFor="data">
            Data do recebimento
          </label>
          <input id="data" className="field" type="date" defaultValue="2026-08-21" />
        </div>
        <div>
          <label className="label" htmlFor="obs">
            Observação
          </label>
          <textarea id="obs" className="field" rows={3} placeholder="PIX recebido, comprovante no Drive…" />
        </div>
      </Sheet>

      <ConfirmDialog
        open={estorno}
        onClose={() => setEstorno(false)}
        title="Estornar recebimento?"
        confirmLabel="Estornar"
        onConfirm={() => {
          setEstorno(false)
          onToast(
            'Recebimento estornado',
            'Parcela 3 voltou a aberta. Histórico preservado.',
            'var(--destructive)',
          )
        }}
      >
        <div style={{ marginTop: 14, padding: 13, borderRadius: 11, background: 'var(--muted)' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Parcela 3 · {project.name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--mutedfg)', marginTop: 4 }}>
            R$ 4.332,02 · recebido em 10/08/2026
          </div>
        </div>
        <p style={{ margin: '14px 0 0', fontSize: 13, color: 'var(--mutedfg)', lineHeight: 1.5 }}>
          O saldo do projeto volta a considerar esta parcela como aberta. O histórico do recebimento é
          preservado para auditoria.
        </p>
      </ConfirmDialog>
    </div>
  )
}
