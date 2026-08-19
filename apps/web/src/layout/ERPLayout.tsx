import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.js";
import { Button } from "../components/ui.js";

const links = [{ to: "/", label: "Visão geral" }, { to: "/finance", label: "Financeiro", capability: "FINANCE_READ" }, { to: "/commercial", label: "Comercial" }, { to: "/projects", label: "Projetos" }];

export function ERPLayout() {
  const auth = useAuth(); const navigate = useNavigate(); const [lightTheme, setLightTheme] = useState(() => window.localStorage.getItem("ijunior_theme") === "light");
  const logout = async () => { await auth.logout(); navigate("/login"); };
  const toggleTheme = () => { const nextLight = !lightTheme; setLightTheme(nextLight); document.documentElement.classList.toggle("light", nextLight); document.documentElement.classList.toggle("dark", !nextLight); window.localStorage.setItem("ijunior_theme", nextLight ? "light" : "dark"); };
  return <div className="app-frame"><header className="glass-header"><NavLink className="brand" to="/">ERP iJúnior</NavLink><div><span className="muted">{auth.user?.name}</span><Button variant="ghost" aria-label={lightTheme ? "Usar tema escuro" : "Usar tema claro"} onClick={toggleTheme}>{lightTheme ? "Escuro" : "Claro"}</Button><Button variant="ghost" onClick={() => void logout()}>Sair</Button></div></header><div className="shell-content"><aside className="sidebar"><nav aria-label="Navegação principal">{links.filter((link) => !link.capability || auth.hasCapability(link.capability)).map((link) => <NavLink key={link.to} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to={link.to}>{link.label}</NavLink>)}</nav></aside><main className="main-content"><Outlet /></main></div><nav className="bottom-nav" aria-label="Navegação móvel">{links.filter((link) => !link.capability || auth.hasCapability(link.capability)).slice(0, 4).map((link) => <NavLink key={link.to} to={link.to}>{link.label}</NavLink>)}</nav></div>;
}
