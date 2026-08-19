import { useEffect, useState } from "react";

export function Button({ variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "destructive" | "ghost" }) { return <button className={`ui-button ui-button-${variant}`} {...props} />; }
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input className="ui-input" {...props} />; }
export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "success" | "warning" | "danger"; children: React.ReactNode }) { return <span className={`ui-badge ui-badge-${tone}`}>{children}</span>; }
export function Skeleton({ className = "" }: { className?: string }) { return <span aria-label="Carregando" className={`ui-skeleton ${className}`} />; }
export function EmptyState({ title, detail }: { title: string; detail: string }) { return <section className="empty-state"><h2>{title}</h2><p>{detail}</p></section>; }
export function Dialog({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) { if (!open) return null; return <div className="ui-dialog-backdrop" role="presentation"><section className="ui-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">{title}</h2>{children}<Button variant="ghost" onClick={onClose}>Fechar</Button></section></div>; }
export function Toast({ message, tone = "success", onDismiss }: { message: string; tone?: "success" | "danger"; onDismiss: () => void }) { useEffect(() => { const timer = window.setTimeout(onDismiss, 4500); return () => window.clearTimeout(timer); }, [onDismiss]); return <div role="status" className={`ui-toast ui-toast-${tone}`}>{message}</div>; }
export function useToast() { const [message, setMessage] = useState<string | null>(null); return { message, show: setMessage, dismiss: () => setMessage(null) }; }
