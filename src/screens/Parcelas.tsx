import { useState } from 'react'
import { ParcelasCalendario } from '../components/ParcelasCalendario'
import { ParcelasTabela } from '../components/ParcelasTabela'
import { ParcelasSheet } from '../components/ParcelasSheet'
import { ErrorState, Loading } from '../components/primitives'
import { useAsync } from '../hooks/useAsync'
import { api } from '../lib/api'
import type { InstallmentRow, Project } from '../lib/types'

type View = 'calendario' | 'tabela'

const VIEW_KEY = 'ijunior-parcelas-view'

const readView = (): View => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'tabela' ? 'tabela' : 'calendario'
  } catch {
    return 'calendario'
  }
}

/** Parcelas de todos os projetos, em calendário ou em tabela por projeto. */
export function Parcelas({
  desktop,
  onUpdated,
  onToast,
}: {
  desktop: boolean
  onUpdated: (p: Project) => void
  onToast: (title: string, body: string, tone?: string) => void
}) {
  const installments = useAsync<InstallmentRow[]>(() => api.installments.list())
  const [view, setView] = useState<View>(readView)
  const [openId, setOpenId] = useState<string | null>(null)

  const pick = (v: View) => {
    setView(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      /* sem storage: a escolha vale só nesta visita */
    }
  }

  const rows = installments.data

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <div>
          <h1 className="display" style={{ fontSize: 31 }}>
            Parcelas
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--mutedfg)' }}>
            {view === 'calendario'
              ? 'Vencimentos de todos os projetos, dia a dia'
              : 'Situação das parcelas de cada projeto'}{' '}
            · clique numa parcela ou projeto para editar
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Visualização"
          style={{
            display: 'flex',
            gap: 6,
            padding: 4,
            border: '1px solid var(--border)',
            borderRadius: 12,
            background: 'var(--card)',
          }}
        >
          {(
            [
              ['calendario', 'Calendário'],
              ['tabela', 'Tabela'],
            ] as const
          ).map(([key, label]) => {
            const active = view === key
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                onClick={() => pick(key)}
                style={{
                  height: 36,
                  padding: '0 16px',
                  border: 0,
                  borderRadius: 9,
                  background: active ? 'color-mix(in oklch,var(--primary) 12%,transparent)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--mutedfg)',
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        {installments.error && !rows ? (
          <ErrorState message={installments.error} onRetry={installments.reload} />
        ) : !rows ? (
          <Loading label="Carregando parcelas…" />
        ) : view === 'calendario' ? (
          <ParcelasCalendario rows={rows} desktop={desktop} onOpen={setOpenId} />
        ) : (
          <ParcelasTabela rows={rows} onOpen={setOpenId} />
        )}
      </div>

      {openId && (
        <ParcelasSheet
          projectId={openId}
          desktop={desktop}
          onClose={() => setOpenId(null)}
          onUpdated={(p) => {
            onUpdated(p)
            // As visões cruzam projetos: recarrega a lista depois de cada edição.
            installments.reload()
          }}
          onToast={onToast}
        />
      )}
    </div>
  )
}
