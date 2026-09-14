import { useEffect, useMemo, useState } from 'react'
import { Chip } from '../components/primitives'
import { IconDots, IconPlus, IconSearch } from '../components/Icons'
import { PROJECTS } from '../data/mock'
import { BRL } from '../lib/format'
import { nfTone, statusTone } from '../lib/tone'

export function Projetos({
  canEdit,
  onOpenProject,
  onBaixa,
  onToast,
}: {
  canEdit: boolean
  onOpenProject: (id: string) => void
  onBaixa: (id: string) => void
  onToast: (title: string, body: string) => void
}) {
  const [search, setSearch] = useState('')
  const [menu, setMenu] = useState<string | null>(null)

  // Um clique em qualquer lugar fecha o menu de linha aberto.
  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menu])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return PROJECTS
    return PROJECTS.filter((p) => (p.name + p.client + p.manager).toLowerCase().includes(q))
  }, [search])

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--mutedfg)',
              display: 'flex',
            }}
          >
            <IconSearch />
          </span>
          <input
            className="field"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar projeto, cliente ou gerente"
            aria-label="Buscar projeto, cliente ou gerente"
            style={{ paddingLeft: 36 }}
          />
        </div>
        {canEdit && (
          <button
            className="btn-primary"
            onClick={() =>
              onToast('Novo projeto', 'Projetos são criados no módulo Projetos e aparecem aqui.')
            }
            style={{ height: 40, padding: '0 16px', fontSize: 13.5 }}
          >
            <IconPlus />
            Novo projeto
          </button>
        )}
      </div>

      <div className="card" style={{ marginTop: 16, overflow: 'hidden' }}>
        <div className="scroll-x">
          <table className="data" style={{ minWidth: 940 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>Projeto</th>
                <th>Cliente</th>
                <th>Gerente</th>
                <th>Produto</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Pago</th>
                <th style={{ textAlign: 'right' }}>Restante</th>
                <th>Estado</th>
                <th>NF</th>
                <th style={{ paddingRight: 16 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td style={{ paddingLeft: 16, fontWeight: 600 }}>
                    <button
                      onClick={() => onOpenProject(r.id)}
                      style={{
                        border: 0,
                        background: 'transparent',
                        padding: 0,
                        color: 'var(--fg)',
                        font: 'inherit',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {r.name}
                    </button>
                  </td>
                  <td style={{ color: 'var(--mutedfg)' }}>{r.client}</td>
                  <td style={{ color: 'var(--mutedfg)' }}>{r.manager}</td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: 'var(--muted)',
                        color: 'var(--mutedfg)',
                      }}
                    >
                      {r.product}
                    </span>
                  </td>
                  <td className="num" style={{ textAlign: 'right' }}>
                    {BRL(r.total)}
                  </td>
                  <td
                    className="num"
                    style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 600 }}
                  >
                    {BRL(r.paid)}
                  </td>
                  <td className="num" style={{ textAlign: 'right' }}>
                    {BRL(r.total - r.paid)}
                  </td>
                  <td>
                    <Chip tone={statusTone(r.status)}>{r.status}</Chip>
                  </td>
                  <td>
                    <Chip tone={nfTone(r.nf)}>{r.nf ? 'NF emitida' : 'Sem NF'}</Chip>
                  </td>
                  <td style={{ paddingRight: 16, textAlign: 'right', position: 'relative' }}>
                    <button
                      className="icon-btn"
                      aria-label={`Ações de ${r.name}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenu(menu === r.id ? null : r.id)
                      }}
                      style={{ width: 30, height: 30, borderRadius: 8 }}
                    >
                      <IconDots />
                    </button>
                    {menu === r.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          right: 14,
                          top: 40,
                          zIndex: 20,
                          width: 170,
                          padding: 6,
                          background: 'var(--glass)',
                          backdropFilter: 'blur(14px)',
                          border: '1px solid var(--border)',
                          borderRadius: 11,
                          boxShadow: 'var(--shadow)',
                          textAlign: 'left',
                        }}
                      >
                        <MenuItem onClick={() => onOpenProject(r.id)}>Ver projeto</MenuItem>
                        <MenuItem
                          disabled={!canEdit}
                          onClick={() =>
                            onToast(
                              'Edição de projeto',
                              'Nome, gerente e sprint vêm do módulo Projetos.',
                            )
                          }
                        >
                          Editar projeto
                        </MenuItem>
                        <MenuItem onClick={() => onBaixa(r.id)}>Dar baixa em pagamento</MenuItem>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <span style={{ fontSize: 12.5, color: 'var(--mutedfg)' }}>
            {filtered.length} de {PROJECTS.length} projetos
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" style={{ height: 32, padding: '0 12px', fontSize: 12.5, color: 'var(--mutedfg)' }}>
              Anterior
            </button>
            <button className="btn-ghost" style={{ height: 32, padding: '0 12px', fontSize: 12.5, background: 'var(--card)' }}>
              1
            </button>
            <button className="btn-ghost" style={{ height: 32, padding: '0 12px', fontSize: 12.5, color: 'var(--mutedfg)' }}>
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MenuItem({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        padding: '8px 10px',
        border: 0,
        borderRadius: 8,
        background: 'transparent',
        color: disabled ? 'var(--mutedfg)' : 'var(--fg)',
        fontSize: 13,
        textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}
