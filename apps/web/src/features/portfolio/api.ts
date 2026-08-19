import { httpRequest, stableIntentKey } from "../../lib/httpClient.js";

export type Client = { id: string; name: string; type: "PERSON" | "COMPANY"; documentNumber: string | null; email: string | null; phone: string | null; financialContactName: string | null; financialContactEmail: string | null; financialContactPhone: string | null; notes: string | null; };
export type Link = { id: string; type: string; label: string; url: string; description: string | null; createdAt: string };
export type FinanceSummary = { hasPlan: boolean; planStatus: "DRAFT" | "ACTIVE" | null; received: string; outstanding: string; overdue: string; nextDue: string | null; installments: number };
export type ContractDetail = { id: string; name: string; origin: string; status: string; product: string; customProductName: string | null; contractValue: string; signatureDate: string | null; startDate: string | null; expectedEndDate: string | null; executionTermMonths: number | null; description: string | null; internalNotes: string | null; sharedProject: boolean; partnerName: string | null; transferRule: string | null; client: Client; project: { id: string; name: string } | null; links: Link[]; finance: FinanceSummary; createdAt: string; updatedAt: string };
export type ContractRow = { id: string; name: string; client: { id: string; name: string }; product: string; customProductName: string | null; status: string; value: string; received: string; outstanding: string; overdue: string; installments: number; nextDue: string | null; hasPlan: boolean; planStatus: string | null; project: { id: string; name: string } | null };
export type Member = { id: string; name: string };
export type Project = { id: string; name: string; status: string; startDate: string | null; expectedEndDate: string | null; description: string | null; internalNotes: string | null; client: { id: string; name: string }; contract: { id: string; name: string } | null; manager: Member | null; links?: Link[]; finance?: { value: string; received: string; outstanding: string; overdue: string; nextDue: string | null } | null };
export type Dashboard = { contracts: { active: number; completed: number }; projects: { active: number; delayed: number }; finance: { contracted: string; received: string; outstanding: string; overdue: string; forecastThisMonth: string }; upcomingInstallments: Array<{ contractId: string; contract: string; client: string; dueDate: string; outstanding: string }>; attentionItems: Array<{ kind: string; label: string; contractId?: string; projectId?: string }>; activeProjects: Project[] };

export const portfolioApi = {
  clients: (q = "") => httpRequest<{ items: Client[] }>(`/api/portfolio/clients${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  createClient: (payload: Record<string, unknown>) => httpRequest<Client>("/api/portfolio/clients", { method: "POST", headers: { "Idempotency-Key": stableIntentKey() }, body: JSON.stringify(payload) }),
  updateClient: (id: string, payload: Record<string, unknown>) => httpRequest<Client>(`/api/portfolio/clients/${id}`, { method: "PATCH", headers: { "Idempotency-Key": stableIntentKey() }, body: JSON.stringify(payload) }),
  contracts: (query = "") => httpRequest<{ items: ContractRow[] }>(`/api/portfolio/contracts${query ? `?${query}` : ""}`),
  contract: (id: string) => httpRequest<ContractDetail>(`/api/portfolio/contracts/${id}`),
  contractHistory: (id: string) => httpRequest<{ items: Array<{ id: string; action: string; aggregateType: string; aggregateId: string; occurredAt: string; reason: string | null; context: unknown }> }>(`/api/portfolio/contracts/${id}/history`),
  createContract: (payload: Record<string, unknown>) => httpRequest<ContractDetail>("/api/portfolio/contracts", { method: "POST", headers: { "Idempotency-Key": stableIntentKey() }, body: JSON.stringify(payload) }),
  updateContract: (id: string, payload: Record<string, unknown>) => httpRequest<ContractDetail>(`/api/portfolio/contracts/${id}`, { method: "PATCH", headers: { "Idempotency-Key": stableIntentKey() }, body: JSON.stringify(payload) }),
  addContractLink: (id: string, payload: Record<string, unknown>) => httpRequest<Link>(`/api/portfolio/contracts/${id}/links`, { method: "POST", headers: { "Idempotency-Key": stableIntentKey() }, body: JSON.stringify(payload) }),
  updateLink: (id: string, payload: Record<string, unknown>) => httpRequest<Link>(`/api/portfolio/links/${id}`, { method: "PATCH", headers: { "Idempotency-Key": stableIntentKey() }, body: JSON.stringify(payload) }),
  deleteLink: (id: string) => httpRequest(`/api/portfolio/links/${id}`, { method: "DELETE", headers: { "Idempotency-Key": stableIntentKey() } }),
  members: () => httpRequest<{ items: Member[] }>("/api/portfolio/members"),
  projects: (query = "") => httpRequest<{ items: Project[] }>(`/api/portfolio/projects${query ? `?${query}` : ""}`),
  project: (id: string) => httpRequest<Project>(`/api/portfolio/projects/${id}`),
  createProject: (payload: Record<string, unknown>) => httpRequest<Project>("/api/portfolio/projects", { method: "POST", headers: { "Idempotency-Key": stableIntentKey() }, body: JSON.stringify(payload) }),
  updateProject: (id: string, payload: Record<string, unknown>) => httpRequest<Project>(`/api/portfolio/projects/${id}`, { method: "PATCH", headers: { "Idempotency-Key": stableIntentKey() }, body: JSON.stringify(payload) }),
  addProjectLink: (id: string, payload: Record<string, unknown>) => httpRequest<Link>(`/api/portfolio/projects/${id}/links`, { method: "POST", headers: { "Idempotency-Key": stableIntentKey() }, body: JSON.stringify(payload) }),
  dashboard: () => httpRequest<Dashboard>("/api/dashboard")
};

export function brl(value: string) { const [whole = "0", cents = "00"] = value.split("."); const digits = whole.replace(/^0+(?=\d)/, "") || "0"; return `R$ ${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${cents.padEnd(2, "0").slice(0, 2)}`; }
export function dateBR(value: string | null) { return value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "—"; }
