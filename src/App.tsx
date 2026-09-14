import { IconMoon, IconSun } from './components/Icons'
import { Toast } from './components/Toast'
import { Atividades } from './screens/Atividades'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useTheme } from './hooks/useTheme'
import { useToast } from './hooks/useToast'

export default function App() {
  const { dark, toggle } = useTheme()
  const { toast, show } = useToast()
  // O sheet do formulário vira painel lateral a partir de 900px.
  const wide = useMediaQuery('(min-width: 900px)')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 24px',
          background: 'var(--glass)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            flex: 'none',
            borderRadius: 9,
            background: 'linear-gradient(135deg,var(--primary),var(--cyan))',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15 }}>
            Atividades
          </div>
          <div style={{ fontSize: 12, color: 'var(--mutedfg)' }}>Financeiro · iJúnior</div>
        </div>
        <button
          onClick={toggle}
          aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
          style={{
            width: 36,
            height: 36,
            display: 'grid',
            placeItems: 'center',
            border: '1px solid var(--border)',
            borderRadius: 10,
            background: 'var(--card)',
            color: 'var(--fg)',
            cursor: 'pointer',
          }}
        >
          {dark ? <IconSun /> : <IconMoon />}
        </button>
      </header>

      <main style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
        <Atividades desktop={wide} onToast={show} />
      </main>

      <Toast toast={toast} />
    </div>
  )
}
