import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthProvider.js";
import { ERPLayout } from "./layout/ERPLayout.js";
import { ContractPortfolioPage } from "./features/portfolio/ContractPortfolioPage.js";
import { ContractWizardPage } from "./features/portfolio/ContractWizardPage.js";
import { ClientsPage } from "./features/portfolio/ClientsPage.js";
import { Contract360Page } from "./features/portfolio/Contract360Page.js";
import { ProjectDetailPage } from "./features/portfolio/ProjectDetailPage.js";
import { ProjectFormPage } from "./features/portfolio/ProjectFormPage.js";
import { ProjectsPage } from "./features/portfolio/ProjectsPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { PlaceholderPage } from "./pages/PlaceholderPage.js";

function ProtectedRoutes() {
  const auth = useAuth(); const location = useLocation();
  if (auth.status === "loading") return <main className="login-page"><div><h1>ERP iJúnior</h1><p className="muted">Base da aplicação web.</p><p className="muted">Carregando sessão…</p></div></main>;
  if (auth.status === "unauthenticated") return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <ERPLayout />;
}

function FinanceGuard({ children }: { children: React.ReactNode }) { const auth = useAuth(); return auth.hasCapability("FINANCE_READ") ? children : <Navigate to="/" replace />; }

export function App() { return <BrowserRouter><AuthProvider><Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoutes />}><Route path="/" element={<DashboardPage />} /><Route path="/finance" element={<FinanceGuard><ContractPortfolioPage /></FinanceGuard>} /><Route path="/finance/clients" element={<FinanceGuard><ClientsPage /></FinanceGuard>} /><Route path="/finance/contracts/new" element={<FinanceGuard><ContractWizardPage /></FinanceGuard>} /><Route path="/finance/contracts/:contractId" element={<FinanceGuard><Contract360Page /></FinanceGuard>} /><Route path="/commercial" element={<PlaceholderPage title="Comercial" detail="A gestão comercial será conectada ao ciclo canônico de contratos." />} /><Route path="/projects" element={<ProjectsPage />} /><Route path="/projects/new" element={<ProjectFormPage />} /><Route path="/projects/:projectId" element={<ProjectDetailPage />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></AuthProvider></BrowserRouter>; }
