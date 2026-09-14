import type { CSSProperties, ReactNode } from 'react'
import type { Tone } from '../lib/tone'

export function Chip({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className="chip" style={{ background: tone[0], color: tone[1] }}>
      {children}
    </span>
  )
}

export function Avatar({ initials, size = 28 }: { initials: string; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        flex: 'none',
        borderRadius: '50%',
        background: 'var(--muted)',
        color: 'var(--primary)',
        display: 'grid',
        placeItems: 'center',
        fontSize: size <= 24 ? 10 : 11,
        fontWeight: 700,
      }}
    >
      {initials}
    </span>
  )
}

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

export function StatCard({
  label,
  value,
  foot,
  accent,
  highlight,
  style,
}: {
  label: string
  value: string
  foot?: ReactNode
  accent?: boolean
  highlight?: boolean
  style?: CSSProperties
}) {
  const shell: CSSProperties = highlight
    ? {
        borderRadius: 14,
        padding: 18,
        background: 'linear-gradient(135deg,var(--primary),var(--cyan))',
        color: '#fff',
        ...style,
      }
    : { padding: 18, ...style }

  const body = (
    <>
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 500,
          color: highlight ? undefined : 'var(--mutedfg)',
          opacity: highlight ? 0.9 : 1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 700,
          fontSize: 23,
          marginTop: 8,
          color: accent ? 'var(--primary)' : undefined,
        }}
      >
        {value}
      </div>
      {foot !== undefined && (
        <div
          style={{
            fontSize: 12,
            marginTop: 6,
            color: highlight ? undefined : 'var(--mutedfg)',
            opacity: highlight ? 0.9 : 1,
          }}
        >
          {foot}
        </div>
      )}
    </>
  )

  return highlight ? <div style={shell}>{body}</div> : <Card style={shell}>{body}</Card>
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
        <svg
          width={22}
          height={22}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
        >
          <rect x={4} y={4} width={16} height={16} rx={4} />
          <path d="M8.5 12.2l2.6 2.6 4.4-5.4" />
        </svg>
      </span>
      <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: 'var(--mutedfg)', maxWidth: 340 }}>{body}</div>
      {action}
    </Card>
  )
}
