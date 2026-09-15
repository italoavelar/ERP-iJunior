import { useEffect, type ReactNode } from 'react'
import { IconClose } from './Icons'

/** Fecha no Escape e impede que o clique no painel feche o overlay. */
function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
}

/** Sheet lateral no desktop, modal centralizado no mobile — como no design. */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  desktop,
  children,
  footer,
  width,
  hideHeader = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  desktop: boolean
  children: ReactNode
  footer?: ReactNode
  width?: number
  /** O conteúdo traz o próprio cabeçalho (título + fechar). */
  hideHeader?: boolean
}) {
  useEscape(onClose)
  if (!open) return null

  const w = width ?? (desktop ? 500 : 460)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        background: 'rgba(8,24,27,.45)',
        display: 'flex',
        alignItems: desktop ? 'stretch' : 'center',
        justifyContent: desktop ? 'flex-end' : 'center',
        padding: desktop ? 0 : 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: w,
          maxWidth: '100%',
          maxHeight: '100%',
          overflow: 'auto',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: desktop ? 0 : 16,
          padding: 22,
          boxShadow: 'var(--shadow)',
          animation: desktop ? 'slideIn 220ms ease both' : 'pop 160ms ease both',
        }}
      >
        {!hideHeader && (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 19 }}>
                {title}
              </h2>
              {subtitle && (
                <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--mutedfg)' }}>{subtitle}</p>
              )}
            </div>
            <button
              className="icon-btn"
              onClick={onClose}
              aria-label="Fechar"
              style={{ width: 32, height: 32, flex: 'none' }}
            >
              <IconClose />
            </button>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: hideHeader ? 20 : 16,
            marginTop: hideHeader ? 0 : 20,
          }}
        >
          {children}
        </div>
        {footer && <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>{footer}</div>}
      </div>
    </div>
  )
}

/** Diálogo de confirmação centralizado. */
export function ConfirmDialog({
  open,
  onClose,
  title,
  children,
  confirmLabel,
  onConfirm,
  destructive = true,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  destructive?: boolean
}) {
  useEscape(onClose)
  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(8,24,27,.5)',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 384,
          maxWidth: '100%',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 22,
          boxShadow: 'var(--shadow)',
          animation: 'pop 160ms ease both',
        }}
      >
        <h2 style={{ margin: 0, fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18 }}>
          {title}
        </h2>
        {children}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn-ghost" onClick={onClose} style={{ flex: 1, height: 40, fontSize: 13.5 }}>
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              height: 40,
              border: 0,
              borderRadius: 10,
              background: destructive ? 'var(--destructive)' : 'var(--primary)',
              color: '#fff',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
