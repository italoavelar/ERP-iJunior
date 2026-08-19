import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.js";
import { Button, Input } from "../components/ui.js";
import { HttpError } from "../lib/httpClient.js";

export function LoginPage() {
  const auth = useAuth(); const navigate = useNavigate(); const location = useLocation(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  if (auth.status === "authenticated") return <Navigate to={(location.state as { from?: string } | null)?.from ?? "/"} replace />;
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(null); setBusy(true); try { await auth.login(email, password); navigate("/"); } catch (reason) { setError(reason instanceof HttpError && reason.status === 401 ? "Email ou senha inválidos." : "Não foi possível iniciar a sessão."); } finally { setBusy(false); } };
  return <main className="login-page"><form className="login-card" onSubmit={submit}>
    <div><div className="login-brand"><span className="brand-mark">iJ</span><span>ERP iJúnior</span></div><p className="eyebrow">Acesso seguro</p><h1>Entrar no ERP iJúnior</h1><p className="muted">Use suas credenciais para acessar os módulos da organização.</p></div>
    <label className="field">Email<Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
    <label className="field">Senha<Input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
    {error ? <p className="field-error" role="alert">{error}</p> : null}<Button disabled={busy}>{busy ? "Entrando…" : "Entrar"}</Button>
  </form></main>;
}
