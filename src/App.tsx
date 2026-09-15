import { useState, type ReactNode } from 'react'
import { IconCheckBox, IconMoon, IconNF, IconProjects, IconSun } from './components/Icons'
import { Toast } from './components/Toast'
import { Atividades } from './screens/Atividades'
import { Projetos } from './screens/Projetos'
import { NotasFiscais } from './screens/NotasFiscais'
import { PROJECTS } from './data/projects'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useTheme } from './hooks/useTheme'
import { useToast } from './hooks/useToast'

type Screen = 'atividades' | 'projetos' | 'notas'

const TITLES: Record<Screen, string> = {
  atividades: 'Atividades',
  projetos: 'Projetos',
  notas: 'Notas fiscais',
}

const NAV: { key: Screen; label: string; icon: ReactNode }[] = [
  { key: 'atividades', label: 'Dashboard', icon: <IconCheckBox size={19} /> },
  { key: 'projetos', label: 'Projetos', icon: <IconProjects /> },
  { key: 'notas', label: 'Notas fiscais', icon: <IconNF /> },
]

const initialNF = () =>
  PROJECTS.reduce<Record<string, boolean>>((acc, p) => ((acc[p.id] = p.nf), acc), {})

export default function App() {
  const desktop = useMediaQuery('(min-width: 900px)')
  const { dark, toggle } = useTheme()
  const { toast, show } = useToast()

  const [screen, setScreen] = useState<Screen>('atividades')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Estado de NF partilhado: a tabela alterna, o detalhe do projeto lê.
  const [nf, setNf] = useState(initialNF)

  const toggleNF = (id: string) => {
    const wasEmitted = nf[id]
    setNf((s) => ({ ...s, [id]: !s[id] }))
    const project = PROJECTS.find((p) => p.id === id)
    show(wasEmitted ? 'NF desmarcada' : 'NF marcada como emitida', project?.name ?? '')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)', display: 'flex' }}>
      {desktop && (
        <nav
          onMouseEnter={() => setSidebarOpen(true)}
          onMouseLeave={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: '14px 10px',
            width: sidebarOpen ? 240 : 64,
            background: 'var(--glass)',
            backdropFilter: 'blur(14px)',
            borderRight: '1px solid var(--border)',
            transition: 'width 220ms ease',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 6px 18px' }}>
            <div
              style={{
                width: 28,
                height: 28,
                flex: 'none',
                borderRadius: 9,
                background: 'linear-gradient(135deg,var(--primary),var(--cyan))',
              }}
            />
            <span
              style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 800,
                fontSize: 17,
                whiteSpace: 'nowrap',
                opacity: sidebarOpen ? 1 : 0,
                transition: 'opacity 180ms',
              }}
            >
              iJúnior
            </span>
          </div>

          {NAV.map((item) => {
            const active = screen === item.key
            return (
              <button
                key={item.key}
                onClick={() => setScreen(item.key)}
                title={item.label}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  width: '100%',
                  padding: '11px 10px',
                  border: 0,
                  borderRadius: 11,
                  cursor: 'pointer',
                  background: active
                    ? 'color-mix(in oklch,var(--primary) 10%,transparent)'
                    : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--mutedfg)',
                  fontSize: 14,
                  fontWeight: 600,
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: -10,
                    top: 8,
                    bottom: 8,
                    width: 3,
                    borderRadius: '0 3px 3px 0',
                    background: 'linear-gradient(to bottom,var(--primary),var(--cyan))',
                    opacity: active ? 1 : 0,
                  }}
                />
                <span style={{ flex: 'none', display: 'flex' }}>{item.icon}</span>
                <span style={{ opacity: sidebarOpen ? 1 : 0, transition: 'opacity 180ms' }}>
                  {item.label}
                </span>
              </button>
            )
          })}

          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 6px',
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                flex: 'none',
                borderRadius: '50%',
                background: 'var(--muted)',
                color: 'var(--primary)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              FS
            </div>
            <div style={{ minWidth: 0, opacity: sidebarOpen ? 1 : 0, transition: 'opacity 180ms' }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Felipe Souza</div>
              <div style={{ fontSize: 11, color: 'var(--mutedfg)', whiteSpace: 'nowrap' }}>
                Financeiro
              </div>
            </div>
          </div>
        </nav>
      )}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          marginLeft: desktop ? 64 : 0,
          paddingBottom: desktop ? 0 : 76,
        }}
      >
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15 }}>
              {TITLES[screen]}
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

        <main
          style={{
            padding: desktop ? '32px 24px' : '20px 16px',
            maxWidth: 1000,
            margin: '0 auto',
          }}
        >
          {screen === 'atividades' && <Atividades desktop={desktop} onToast={show} />}
          {screen === 'projetos' && <Projetos desktop={desktop} nf={nf} />}
          {screen === 'notas' && <NotasFiscais nf={nf} onToggle={toggleNF} />}
        </main>
      </div>

      {!desktop && (
        <nav
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            display: 'flex',
            background: 'var(--glass)',
            backdropFilter: 'blur(14px)',
            borderTop: '1px solid var(--border)',
            padding: '6px 4px 8px',
          }}
        >
          {NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => setScreen(item.key)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '6px 2px',
                border: 0,
                background: 'transparent',
                color: screen === item.key ? 'var(--primary)' : 'var(--mutedfg)',
                fontSize: 10.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'flex' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      )}

      <Toast toast={toast} bottom={desktop ? 20 : 92} />
    </div>
  )
}
