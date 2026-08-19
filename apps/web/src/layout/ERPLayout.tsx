import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.js";
import { Button } from "../components/ui.js";

type IconName = "grid" | "wallet" | "briefcase" | "folder" | "search" | "sun" | "moon";

function Icon({ name }: { name: IconName }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24", "aria-hidden": true };
  if (name === "grid") return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
  if (name === "wallet") return <svg {...common}><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6a2 2 0 0 1-2-2V7.5Z" /><path d="M4 9h15" /><path d="M15 14h.01" /></svg>;
  if (name === "briefcase") return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></svg>;
  if (name === "folder") return <svg {...common}><path d="M21 19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11Z" /></svg>;
  if (name === "search") return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
  if (name === "sun") return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>;
  return <svg {...common}><path d="M20.5 14.1A8.5 8.5 0 1 1 9.9 3.5a6.7 6.7 0 0 0 10.6 10.6Z" /></svg>;
}

const links: Array<{ to: string; label: string; icon: IconName; capability?: "FINANCE_READ" }> = [
  { to: "/", label: "Visão geral", icon: "grid" },
  { to: "/finance", label: "Financeiro", icon: "wallet", capability: "FINANCE_READ" },
  { to: "/commercial", label: "Comercial", icon: "briefcase" },
  { to: "/projects", label: "Projetos", icon: "folder" }
];

export function ERPLayout() {
  const auth = useAuth(); const navigate = useNavigate(); const location = useLocation(); const [darkTheme, setDarkTheme] = useState(() => document.documentElement.classList.contains("dark"));
  const availableLinks = links.filter((link) => !link.capability || auth.hasCapability(link.capability));
  const initials = (auth.user?.name ?? "iJ").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const logout = async () => { await auth.logout(); navigate("/login"); };
  const toggleTheme = () => { const nextDark = !darkTheme; document.documentElement.classList.toggle("dark", nextDark); document.documentElement.classList.toggle("light", !nextDark); window.localStorage.setItem("ijunior_theme", nextDark ? "dark" : "light"); setDarkTheme(nextDark); };
  return <div className="app-frame">
    <aside className="sidebar glass" aria-label="Navegação principal">
      <div className="sidebar-head"><span className="brand-mark">iJ</span><span className="brand-name">ERP iJúnior</span></div>
      <nav>{availableLinks.map((link) => <NavLink key={link.to} title={link.label} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to={link.to}><Icon name={link.icon} /><span>{link.label}</span></NavLink>)}</nav>
    </aside>
    <div className="app-workspace">
      <header className="glass-header">
        <NavLink className="brand" to="/">ERP iJúnior</NavLink>
        <label className="header-search" aria-label="Busca global"><Icon name="search" /><input placeholder="Buscar no ERP…" /></label>
        <div className="header-actions"><span className="user-name">{auth.user?.name}</span><span className="user-avatar" title={auth.user?.name}>{initials}</span><Button variant="ghost" aria-label={darkTheme ? "Usar tema claro" : "Usar tema escuro"} onClick={toggleTheme}><Icon name={darkTheme ? "sun" : "moon"} /></Button><Button variant="ghost" onClick={() => void logout()}>Sair</Button></div>
      </header>
      <main className={location.pathname.startsWith("/finance") ? "main-content main-content-wide" : "main-content"}><Outlet /></main>
    </div>
    <nav className="bottom-nav" aria-label="Navegação móvel">{availableLinks.slice(0, 4).map((link) => <NavLink key={link.to} to={link.to}>{link.label}</NavLink>)}</nav>
  </div>;
}
