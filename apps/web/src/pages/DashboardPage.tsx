import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.js";
import { PlaceholderPage } from "./PlaceholderPage.js";

export function DashboardPage() { const auth = useAuth(); return <><PlaceholderPage title="ERP iJúnior" detail="Base da aplicação web." /><div className="card"><h2>Olá, {auth.user?.name}</h2><p className="muted">Escolha um módulo no menu para continuar.</p>{auth.hasCapability("FINANCE_READ") ? <Link className="nav-link" to="/finance">Abrir Financeiro</Link> : <p className="muted">Seu perfil não possui capacidade financeira.</p>}</div></>; }
