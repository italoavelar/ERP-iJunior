import type { ToastState } from '../hooks/useToast'

export function Toast({ toast, bottom = 20 }: { toast: ToastState | null; bottom?: number }) {
  if (!toast) return null
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        zIndex: 90,
        right: 20,
        bottom,
        maxWidth: 340,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 11,
        padding: '14px 16px',
        borderRadius: 12,
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
        animation: 'pop 180ms ease both',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          flex: 'none',
          marginTop: 6,
          borderRadius: '50%',
          background: toast.tone,
        }}
      />
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{toast.title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--mutedfg)', marginTop: 3 }}>{toast.body}</div>
      </div>
    </div>
  )
}
