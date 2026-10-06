import type {
  Activity,
  InstallmentPatch,
  Person,
  Project,
  ProjectDetail,
  ProjectInput,
} from './types'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export interface ApiIssue {
  path: string
  message: string
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly issues: ApiIssue[] = [],
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: init?.body ? { 'content-type': 'application/json' } : undefined,
    })
  } catch {
    // fetch só rejeita por rede/CORS — a API provavelmente não está de pé.
    throw new ApiError(0, 'Não foi possível falar com o servidor. A API está rodando?')
  }

  if (res.status === 204) return undefined as T

  const text = await res.text()
  const data: unknown = text ? JSON.parse(text) : null

  if (!res.ok) {
    const payload = (data ?? {}) as { error?: string; issues?: ApiIssue[] }
    throw new ApiError(res.status, payload.error ?? `Erro ${res.status}`, payload.issues ?? [])
  }

  return data as T
}

export interface ActivityInput {
  title: string
  details: string
  people: string[]
}

export const api = {
  people: () => request<Person[]>('/api/people'),

  activities: {
    list: () => request<Activity[]>('/api/activities'),
    create: (input: ActivityInput) =>
      request<Activity>('/api/activities', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Partial<ActivityInput>) =>
      request<Activity>(`/api/activities/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    toggle: (id: string) => request<Activity>(`/api/activities/${id}/toggle`, { method: 'POST' }),
    remove: (id: string) => request<void>(`/api/activities/${id}`, { method: 'DELETE' }),
  },

  projects: {
    list: () => request<Project[]>('/api/projects'),
    get: (id: string) => request<ProjectDetail>(`/api/projects/${id}`),
    update: (id: string, input: Partial<ProjectInput>) =>
      request<ProjectDetail>(`/api/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    /** Refaz o plano: preço, número de parcelas, primeiro vencimento e pagas. */
    replan: (
      id: string,
      input: { total: number; count: number; firstDueDate: string; paidCount: number },
    ) =>
      request<ProjectDetail>(`/api/projects/${id}/installments`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    updateInstallment: (id: string, number: number, data: InstallmentPatch) =>
      request<ProjectDetail>(`/api/projects/${id}/installments/${number}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    /** Valida a sprint (libera a cobrança das parcelas ligadas) ou desfaz. */
    setSprint: (id: string, number: number, validated: boolean, date?: string) =>
      request<ProjectDetail>(`/api/projects/${id}/sprints/${number}`, {
        method: 'PATCH',
        body: JSON.stringify({ validated, date }),
      }),
  },
}
