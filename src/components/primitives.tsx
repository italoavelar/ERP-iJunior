import type { CSSProperties, ReactNode } from 'react'
import { IconCheckBox } from './Icons'

export function Card({
  children,
  style,
  className = '',
}: {
  children: ReactNode
  style?: CSSProperties
  className?: string
}) {
  return (
    <div className={`card ${className}`} style={{ padding: 18, ...style }}>
      {children}
    </div>
  )
}

export function ProgressBar({ pct, height = 9 }: { pct: string; height?: number }) {
  return (
    <span
      style={{
        display: 'block',
        height,
        borderRadius: 99,
        background: 'var(--muted)',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          display: 'block',
          width: pct,
          height: '100%',
          borderRadius: 99,
          background: 'linear-gradient(to right,var(--primary),var(--cyan))',
        }}
      />
    </span>
  )
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <Card
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 10,
        padding: '46px 24px',
      }}
    >
      <span
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--muted)',
          color: 'var(--primary)',
        }}
      >
        <IconCheckBox size={22} />
      </span>
      <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: 'var(--mutedfg)', maxWidth: 340 }}>{body}</div>
      {action}
    </Card>
  )
}
