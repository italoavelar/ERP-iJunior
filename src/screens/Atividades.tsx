import { useMemo, useState } from 'react'
import { Card, EmptyState, ProgressBar } from '../components/primitives'
import { ConfirmDialog, Sheet } from '../components/Overlay'
import { IconCheck, IconEdit, IconPlus, IconTrash } from '../components/Icons'
import { ACTIVITIES, PEOPLE, type Activity } from '../data/mock'
import { fmtDate, today } from '../lib/format'

type Tab = 'pendentes' | 'concluidas'

interface Draft {
  title: string
  details: string
  people: string[]
}

const EMPTY_DRAFT: Draft = { title: '', details: '', people: [] }

export function Atividades({
  desktop,
  onToast,
}: {
  desktop: boolean
  onToast: (title: string, body: string, tone?: string) => void
}) {
  const [tasks, setTasks] = useState<Activity[]>(ACTIVITIES)
  const [tab, setTab] = useState<Tab>('pendentes')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [titleError, setTitleError] = useState(false)
  const [peopleError, setPeopleError] = useState(false)

  const pend = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)
  const doneTab = tab === 'concluidas'
  const list = doneTab ? done : pend

  const balance = useMemo(() => {
    const counts = PEOPLE.map((p) => ({
      ...p,
      n: done.filter((t) => t.people.includes(p.id)).length,
    }))
    const max = Math.max(1, ...counts.map((c) => c.n))
    return counts
      .sort((a, b) => b.n - a.n)
      .map((c) => ({
        name: c.name,
        initials: c.initials,
        pct: Math.round((c.n / max) * 100) + '%',
        label: c.n === 1 ? '1 atividade' : `${c.n} atividades`,
      }))
  }, [done])

  const openNew = () => {
    setEditingId(null)
    setDraft(EMPTY_DRAFT)
    setTitleError(false)
    setPeopleError(false)
    setFormOpen(true)
  }

  const openEdit = (t: Activity) => {
    setEditingId(t.id)
    setDraft({ title: t.title, details: t.details, people: [...t.people] })
    setTitleError(false)
    setPeopleError(false)
    setFormOpen(true)
  }

  const toggle = (id: number) =>
    setTasks((ts) =>
      ts.map((x) => (x.id === id ? { ...x, done: !x.done, doneAt: !x.done ? today() : null } : x)),
    )

  const save = () => {
    const title = draft.title.trim()
    if (!title) {
      setTitleError(true)
      return
    }
    if (draft.people.length === 0) {
      setPeopleError(true)
      return
    }
    if (editingId !== null) {
      setTasks((ts) =>
        ts.map((t) =>
          t.id === editingId ? { ...t, title, details: draft.details, people: [...draft.people] } : t,
        ),
      )
      onToast('Atividade atualizada', title)
    } else {
      setTasks((ts) => [
        { id: Date.now(), title, details: draft.details, people: [...draft.people], done: false, doneAt: null },
        ...ts,
      ])
      setTab('pendentes')
      onToast(
        'Atividade criada',
        draft.people.length > 1
          ? `${draft.people.length} responsáveis atribuídos.`
          : '1 responsável atribuído.',
      )
    }
    setFormOpen(false)
  }

  const remove = () => {
    setTasks((ts) => ts.filter((t) => t.id !== confirmId))
    setConfirmId(null)
    onToast('Atividade excluída', 'O item foi removido do painel.', 'var(--destructive)')
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'pendentes', label: 'Em aberto', count: pend.length },
    { key: 'concluidas', label: 'Concluídas', count: done.length },
  ]

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 14,
          animation: 'fadeUp 420ms ease both',
        }}
      >
        <div>
          <h1 className="display gradient-text" style={{ fontSize: 31 }}>
            Atividades do time
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--mutedfg)' }}>
            {pend.length} em aberto · {done.length} concluídas
          </p>
        </div>
        <button className="btn-primary" onClick={openNew} style={{ height: 42, padding: '0 17px', fontSize: 14, borderRadius: 11 }}>
          <IconPlus />
          Nova atividade
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: 4,
          border: '1px solid var(--border)',
          borderRadius: 12,
          background: 'var(--card)',
          marginTop: 24,
          width: 'fit-content',
          maxWidth: '100%',
        }}
      >
        {tabs.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                height: 36,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: 0,
                borderRadius: 9,
                background: active ? 'color-mix(in oklch,var(--primary) 12%,transparent)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--mutedfg)',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
              <span
                style={{
                  minWidth: 22,
                  height: 20,
                  padding: '0 6px',
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 99,
                  background: active
                    ? 'color-mix(in oklch,var(--primary) 18%,transparent)'
                    : 'var(--muted)',
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      {doneTab && done.length > 0 && (
        <Card style={{ padding: 20, marginTop: 16 }}>
          <h2 className="h2">Quanto cada um entregou</h2>
          <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--mutedfg)' }}>
            Atividades concluídas por pessoa
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {balance.map((b) => (
              <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    flex: 'none',
                    borderRadius: '50%',
                    background: 'var(--muted)',
                    color: 'var(--primary)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {b.initials}
                </span>
                <span className="truncate" style={{ width: 120, flex: 'none', fontSize: 13, fontWeight: 500 }}>
                  {b.name}
                </span>
                <span style={{ flex: 1, minWidth: 40 }}>
                  <ProgressBar pct={b.pct} height={9} />
                </span>
                <span
                  className="num"
                  style={{ width: 76, flex: 'none', textAlign: 'right', fontSize: 12.5, color: 'var(--mutedfg)' }}
                >
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {list.map((t) => (
          <Card key={t.id}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <button
                onClick={() => toggle(t.id)}
                title={t.done ? 'Reabrir atividade' : 'Marcar como concluída'}
                aria-label={t.done ? 'Reabrir atividade' : 'Marcar como concluída'}
                style={{
                  width: 22,
                  height: 22,
                  flex: 'none',
                  marginTop: 2,
                  display: 'grid',
                  placeItems: 'center',
                  border: `2px solid ${t.done ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: t.done ? '50%' : 7,
                  background: t.done ? 'var(--primary)' : 'transparent',
                  cursor: 'pointer',
                  color: '#fff',
                }}
              >
                {t.done && <IconCheck />}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    lineHeight: 1.35,
                    textDecoration: t.done ? 'line-through' : 'none',
                    color: t.done ? 'var(--mutedfg)' : 'var(--fg)',
                  }}
                >
                  {t.title}
                </div>
                <p
                  style={{
                    margin: '8px 0 0',
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    color: 'var(--mutedfg)',
                    textWrap: 'pretty',
                  }}
                >
                  {t.details}
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 13,
                  }}
                >
                  {t.people
                    .map((id) => PEOPLE.find((p) => p.id === id))
                    .filter((p): p is (typeof PEOPLE)[number] => Boolean(p))
                    .map((a) => (
                      <span
                        key={a.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7,
                          padding: '4px 10px 4px 4px',
                          borderRadius: 99,
                          background: 'var(--muted)',
                        }}
                      >
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: 'var(--card)',
                            color: 'var(--primary)',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {a.initials}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)' }}>{a.name}</span>
                      </span>
                    ))}
                  <span style={{ fontSize: 12, color: 'var(--mutedfg)', marginLeft: 4 }}>
                    {t.done ? `concluída em ${fmtDate(t.doneAt)}` : 'em aberto'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flex: 'none' }}>
                <button className="icon-btn" title="Editar" aria-label="Editar" onClick={() => openEdit(t)} style={{ width: 32, height: 32 }}>
                  <IconEdit />
                </button>
                <button
                  className="icon-btn danger"
                  title="Excluir"
                  aria-label="Excluir"
                  onClick={() => setConfirmId(t.id)}
                  style={{ width: 32, height: 32 }}
                >
                  <IconTrash />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {list.length === 0 && (
        <div style={{ marginTop: 16 }}>
          <EmptyState
            title={doneTab ? 'Nada concluído ainda' : 'Nenhuma atividade em aberto'}
            body={
              doneTab
                ? 'Quando o time marcar atividades como feitas, elas aparecem aqui com quem participou.'
                : 'Tudo em dia. Crie uma nova atividade quando surgir demanda.'
            }
            action={
              !doneTab ? (
                <button
                  className="btn-primary"
                  onClick={openNew}
                  style={{ marginTop: 6, height: 40, padding: '0 16px', fontSize: 13.5 }}
                >
                  Criar atividade
                </button>
              ) : undefined
            }
          />
        </div>
      )}

      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        desktop={desktop}
        title={editingId !== null ? 'Editar atividade' : 'Nova atividade'}
        subtitle="Título, detalhes e quem fica responsável."
        footer={
          <>
            <button className="btn-ghost" onClick={() => setFormOpen(false)} style={{ flex: 1, height: 42, fontSize: 13.5 }}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={save} style={{ flex: 1, height: 42, fontSize: 13.5 }}>
              {editingId !== null ? 'Salvar alterações' : 'Criar atividade'}
            </button>
          </>
        }
      >
        <div>
          <label className="label" htmlFor="at-title">
            Título
          </label>
          <input
            id="at-title"
            className={`field ${titleError ? 'invalid' : ''}`}
            value={draft.title}
            onChange={(e) => {
              setDraft((d) => ({ ...d, title: e.target.value }))
              setTitleError(false)
            }}
            placeholder="Ex.: Conferir extrato de setembro"
          />
          {titleError && <span className="error-text">Dê um título à atividade.</span>}
        </div>

        <div>
          <label className="label" htmlFor="at-details">
            Detalhes
          </label>
          <textarea
            id="at-details"
            className="field"
            rows={4}
            value={draft.details}
            onChange={(e) => setDraft((d) => ({ ...d, details: e.target.value }))}
            placeholder="Contexto, links, o que precisa ser entregue…"
          />
        </div>

        <div>
          <span className="label">Responsáveis</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PEOPLE.map((p) => {
              const on = draft.people.includes(p.id)
              return (
                <button
                  key={p.id}
                  aria-pressed={on}
                  onClick={() => {
                    setPeopleError(false)
                    setDraft((d) => ({
                      ...d,
                      people: d.people.includes(p.id)
                        ? d.people.filter((x) => x !== p.id)
                        : [...d.people, p.id],
                    }))
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 12px 5px 5px',
                    border: `1px solid ${on ? 'color-mix(in oklch,var(--primary) 40%,transparent)' : 'var(--border)'}`,
                    borderRadius: 99,
                    background: on ? 'color-mix(in oklch,var(--primary) 12%,transparent)' : 'transparent',
                    color: on ? 'var(--primary)' : 'var(--mutedfg)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'var(--card)',
                      color: 'var(--primary)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {p.initials}
                  </span>
                  {p.name}
                </button>
              )
            })}
          </div>
          {peopleError && <span className="error-text">Escolha ao menos um responsável.</span>}
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        title="Excluir atividade?"
        confirmLabel="Excluir"
        onConfirm={remove}
      >
        <p style={{ margin: '12px 0 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--mutedfg)' }}>
          “{tasks.find((t) => t.id === confirmId)?.title ?? ''}” será removida do painel. Esta ação não
          pode ser desfeita.
        </p>
      </ConfirmDialog>
    </div>
  )
}
