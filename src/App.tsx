import { useEffect, useState, type ReactNode } from 'react'
import {
  IconBell,
  IconCheckBox,
  IconDashboard,
  IconDots,
  IconMoon,
  IconProjects,
  IconSettings,
  IconSun,
  IconTasks,
  IconAlert,
} from './components/Icons'
import { Toast } from './components/Toast'
import { Dashboard } from './screens/Dashboard'
import { Projetos } from './screens/Projetos'
import { ProjetoDetalhe } from './screens/ProjetoDetalhe'
import { Tarefas } from './screens/Tarefas'
import { Atividades } from './screens/Atividades'
import { Notificacoes, notifTone } from './screens/Notificacoes'
import { Config } from './screens/Config'
import { NOTIFICATIONS, PROJECTS, ROLE_LABEL, permissionsFor, type Role } from './data/mock'
import { useIsDesktop } from './hooks/useMediaQuery'
import { useTheme } from './hooks/useTheme'
import { useToast } from './hooks/useToast'

type Screen =
  | 'dashboard'
  | 'projetos'
  | 'detalhe'
  | 'tarefas'
  | 'atividades'
  | 'notificacoes'
  | 'config'

const TITLES: Record<Screen, string> = {
  dashboard: 'Dashboard',
  projetos: 'Projetos',
  detalhe: 'Detalhe do projeto',
  tarefas: 'Tarefas (Kanban)',
  atividades: 'Atividades',
  notificacoes: 'Notificações',
  config: 'Configurações',
}

const NAV: { key: Screen; label: string; icon: ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
  { key: 'projetos', label: 'Projetos', icon: <IconProjects /> },
  { key: 'tarefas', label: 'Tarefas', icon: <IconTasks /> },
  { key: 'atividades', label: 'Atividades', icon: <IconCheckBox size={19} /> },
  { key: 'notificacoes', label: 'Notificações', icon: <IconBell /> },
  { key: 'config', label: 'Configurações', icon: <IconSettings /> },
]

export default function App() {
  const desktop = useIsDesktop()
  const { dark, toggle } = useTheme()
  const { toast, show } = useToast()

  const [screen, setScreen] = useState<Screen>('dashboard')
  const [projectId, setProjectId] = useState('swithaus')
  const [role, setRole] = useState<Role>('gerente')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [recebOnOpen, setRecebOnOpen] = useState(false)

  const perms = permissionsFor(role)
  const project = PROJECTS.find((p) => p.id === projectId) ?? PROJECTS[1]
  const activeKey: Screen = screen === 'detalhe' ? 'projetos' : screen

  const go = (s: Screen) => {
    setScreen(s)
    setNotifOpen(false)
    setMoreOpen(false)
    setRecebOnOpen(false)
  }

  const openProject = (id: string, withReceb = false) => {
    setProjectId(id)
    setRecebOnOpen(withReceb)
    setScreen('detalhe')
    setNotifOpen(false)
  }

  // Fecha o popover de notificações ao clicar fora.
  useEffect(() => {
    if (!notifOpen) return
    const close = () => setNotifOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [notifOpen])

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
            const active = activeKey === item.key
            return (
              <button
                key={item.key}
                onClick={() => go(item.key)}
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

          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 6px' }}>
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
                {ROLE_LABEL[role]}
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
            <div
              className="truncate"
              style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15 }}
            >
              {TITLES[screen]}
            </div>
            <div style={{ fontSize: 12, color: 'var(--mutedfg)' }}>Módulo financeiro</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              aria-label="Papel de demonstração"
              style={{
                height: 36,
                padding: '0 10px',
                border: '1px solid var(--border)',
                borderRadius: 10,
                background: 'var(--card)',
                color: 'var(--fg)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <option value="vp">VP</option>
              <option value="gerente">Gerente do financeiro</option>
              <option value="assessor">Assessor</option>
            </select>

            <button
              onClick={(e) => {
                e.stopPropagation()
                setNotifOpen((v) => !v)
              }}
              aria-label="Notificações"
              style={{
                position: 'relative',
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
              <IconBell size={17} />
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 7,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--destructive)',
                  border: '1.5px solid var(--card)',
                }}
              />
            </button>

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
          </div>

          {notifOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: 60,
                right: 24,
                width: 340,
                maxWidth: 'calc(100vw - 32px)',
                background: 'var(--glass)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                boxShadow: 'var(--shadow)',
                overflow: 'hidden',
                animation: 'pop 160ms ease both',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14 }}>
                  Notificações
                </span>
                <button
                  onClick={() => go('notificacoes')}
                  style={{
                    border: 0,
                    background: 'transparent',
                    color: 'var(--primary)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Ver todas
                </button>
              </div>
              {NOTIFICATIONS.slice(0, 3).map((n) => (
                <div
                  key={n.text}
                  style={{
                    display: 'flex',
                    gap: 11,
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      flex: 'none',
                      borderRadius: 9,
                      display: 'grid',
                      placeItems: 'center',
                      ...notifTone(n),
                    }}
                  >
                    <IconAlert size={15} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{n.text}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--mutedfg)', marginTop: 3 }}>
                      {n.project} · {n.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </header>

        <main
          style={{
            padding: desktop ? '32px 24px' : '20px 16px',
            maxWidth: 1152,
            margin: '0 auto',
          }}
        >
          {screen === 'dashboard' && (
            <Dashboard desktop={desktop} onOpenProject={(id) => openProject(id)} />
          )}
          {screen === 'projetos' && (
            <Projetos
              canEdit={perms.edit}
              onOpenProject={(id) => openProject(id)}
              onBaixa={(id) => openProject(id, true)}
              onToast={show}
            />
          )}
          {screen === 'detalhe' && (
            <ProjetoDetalhe
              project={project}
              desktop={desktop}
              canEstornar={perms.estorno}
              openRecebInitially={recebOnOpen}
              onBack={() => go('projetos')}
              onToast={show}
            />
          )}
          {screen === 'tarefas' && (
            <Tarefas desktop={desktop} canCreate={perms.task} onToast={show} />
          )}
          {screen === 'atividades' && <Atividades desktop={desktop} onToast={show} />}
          {screen === 'notificacoes' && <Notificacoes onOpen={() => go('projetos')} />}
          {screen === 'config' && <Config dark={dark} onToggleTheme={toggle} role={role} />}
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
          {NAV.slice(0, 4).map((item) => (
            <button
              key={item.key}
              onClick={() => go(item.key)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '6px 2px',
                border: 0,
                background: 'transparent',
                color: activeKey === item.key ? 'var(--primary)' : 'var(--mutedfg)',
                fontSize: 10.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'flex' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '6px 2px',
              border: 0,
              background: 'transparent',
              color: 'var(--mutedfg)',
              fontSize: 10.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <IconDots size={20} />
            Mais
          </button>
        </nav>
      )}

      {moreOpen && (
        <div
          onClick={() => setMoreOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(8,24,27,.45)',
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              background: 'var(--card)',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 38,
                height: 4,
                borderRadius: 99,
                background: 'var(--border)',
                margin: '0 auto 6px',
              }}
            />
            {NAV.slice(4).map((item) => (
              <button
                key={item.key}
                className="btn-ghost"
                onClick={() => go(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: 13,
                  borderRadius: 11,
                  fontSize: 14,
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <Toast toast={toast} bottom={desktop ? 20 : 92} />
    </div>
  )
}
