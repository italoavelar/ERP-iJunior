import { Avatar, Card } from '../components/primitives'
import { IconPlus } from '../components/Icons'
import { KANBAN_COLUMNS, KANBAN_TASKS, type KanbanTask } from '../data/mock'
import { PRIO_TONE } from '../lib/tone'

const projectTone = (project: string): readonly [string, string] =>
  project === 'Tarefa avulsa'
    ? ['var(--muted)', 'var(--mutedfg)']
    : ['color-mix(in oklch,var(--primary) 10%,transparent)', 'var(--primary)']

const tag = (tone: readonly [string, string]) => ({
  padding: '3px 8px',
  borderRadius: 6,
  fontSize: 10.5,
  fontWeight: 600,
  background: tone[0],
  color: tone[1],
})

export function Tarefas({
  desktop,
  canCreate,
  onToast,
}: {
  desktop: boolean
  canCreate: boolean
  onToast: (title: string, body: string) => void
}) {
  const mine = KANBAN_TASKS.filter((t) => t.mine)
  const threeCols = desktop ? 'repeat(3,minmax(0,1fr))' : '1fr'
  const kanbanCols = desktop ? 'repeat(4,minmax(0,1fr))' : '1fr'

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <h1 className="display" style={{ fontSize: 29 }}>
            Tarefas do financeiro
          </h1>
          <p style={{ margin: '7px 0 0', fontSize: 13.5, color: 'var(--mutedfg)' }}>
            Tarefas ligadas a projeto ou avulsas
          </p>
        </div>
        {canCreate && (
          <button
            className="btn-primary"
            onClick={() =>
              onToast('Nova tarefa', 'Formulário de criação de tarefa aberto para o gerente.')
            }
            style={{ height: 40, padding: '0 16px', fontSize: 13.5 }}
          >
            <IconPlus />
            Nova tarefa
          </button>
        )}
      </div>

      <Card style={{ marginTop: 20 }}>
        <h2 className="h2" style={{ marginBottom: 12 }}>
          Minhas tarefas
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: threeCols, gap: 10 }}>
          {mine.map((t) => (
            <div key={t.title} style={{ border: '1px solid var(--border)', borderRadius: 11, padding: 13 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35 }}>{t.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10 }}>
                <span style={tag(['var(--muted)', 'var(--mutedfg)'])}>{t.project}</span>
                <span style={tag(PRIO_TONE[t.prio])}>{t.prio}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: kanbanCols,
          gap: 12,
          marginTop: 14,
          alignItems: 'start',
        }}
      >
        {KANBAN_COLUMNS.map((title, ci) => {
          const tasks = KANBAN_TASKS.filter((t) => t.col === ci)
          return (
            <div
              key={title}
              style={{
                background: 'var(--muted)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '2px 4px 10px',
                }}
              >
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14 }}>
                  {title}
                </span>
                <span
                  style={{
                    minWidth: 22,
                    height: 22,
                    padding: '0 6px',
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 99,
                    background: 'var(--card)',
                    color: 'var(--mutedfg)',
                    fontSize: 11.5,
                    fontWeight: 600,
                  }}
                >
                  {tasks.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tasks.map((t) => (
                  <TaskCard key={t.title} task={t} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TaskCard({ task }: { task: KanbanTask }) {
  return (
    <div className="card lift" style={{ borderRadius: 11, padding: 13, cursor: 'pointer' }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35 }}>{task.title}</div>
      <span style={{ display: 'inline-block', marginTop: 9, ...tag(projectTone(task.project)) }}>
        {task.project}
      </span>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginTop: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Avatar initials={task.initials} size={24} />
          <span style={{ fontSize: 11.5, color: 'var(--mutedfg)' }}>{task.owner}</span>
        </div>
        <span style={tag(PRIO_TONE[task.prio])}>{task.prio}</span>
      </div>
    </div>
  )
}
