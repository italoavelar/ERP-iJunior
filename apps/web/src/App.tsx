import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthProvider.js";
import { ERPLayout } from "./layout/ERPLayout.js";
import { ContractReceivablesPage } from "./features/finance-contract-receivables/ContractReceivablesPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { PlaceholderPage } from "./pages/PlaceholderPage.js";

function ProtectedRoutes() {
  const auth = useAuth(); const location = useLocation();
  if (auth.status === "loading") return <main className="login-page"><div><h1>ERP iJúnior</h1><p className="muted">Base da aplicação web.</p><p className="muted">Carregando sessão…</p></div></main>;
  if (auth.status === "unauthenticated") return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <ERPLayout />;
}

function FinanceGuard() { const auth = useAuth(); return auth.hasCapability("FINANCE_READ") ? <ContractReceivablesPage /> : <Navigate to="/" replace />; }

export function App() { return <BrowserRouter><AuthProvider><Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoutes />}><Route path="/" element={<DashboardPage />} /><Route path="/finance" element={<FinanceGuard />} /><Route path="/finance/contracts/:contractId" element={<FinanceGuard />} /><Route path="/commercial" element={<PlaceholderPage title="Comercial" detail="Este módulo permanece como placeholder no Bloco 3." />} /><Route path="/projects" element={<PlaceholderPage title="Projetos" detail="Este módulo permanece como placeholder no Bloco 3." />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></AuthProvider></BrowserRouter>; }
