import { IconAlert } from '../components/Icons'
import { NOTIFICATIONS, type Notification } from '../data/mock'

export const notifTone = (n: Notification) =>
  n.kind === 'bad'
    ? {
        background: 'color-mix(in oklch,var(--destructive) 12%,transparent)',
        color: 'var(--destructive)',
      }
    : {
        background: 'color-mix(in oklch,var(--amber) 16%,transparent)',
        color: 'var(--amber)',
      }

export function Notificacoes({ onOpen }: { onOpen: () => void }) {
  return (
    <div>
      <h1 className="display" style={{ fontSize: 29 }}>
        Notificações
      </h1>
      <p style={{ margin: '7px 0 0', fontSize: 13.5, color: 'var(--mutedfg)' }}>
        Vencimentos, inadimplência e notas fiscais pendentes
      </p>
      <div className="card" style={{ marginTop: 20, overflow: 'hidden' }}>
        {NOTIFICATIONS.map((n) => (
          <div
            key={n.text}
            style={{
              display: 'flex',
              gap: 13,
              padding: '16px 18px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                flex: 'none',
                borderRadius: 10,
                display: 'grid',
                placeItems: 'center',
                ...notifTone(n),
              }}
            >
              <IconAlert />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{n.text}</div>
              <div style={{ fontSize: 12, color: 'var(--mutedfg)', marginTop: 4 }}>
                {n.project} · {n.time}
              </div>
            </div>
            <button
              className="btn-ghost"
              onClick={onOpen}
              style={{ alignSelf: 'center', height: 32, padding: '0 12px', flex: 'none', fontSize: 12.5 }}
            >
              Abrir
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
