import type { Trace, Span, Eval, PromptVersion, ExplorerResult } from "./types"

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json() as Promise<T>
}

export const api = {
  traces: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : ""
      return request<{ items: Trace[]; total: number; page: number }>(`/api/v1/traces${qs}`)
    },
    get: (id: string) => request<Trace>(`/api/v1/traces/${id}`),
    create: (body: object) =>
      request<{ id: string }>("/api/v1/traces", { method: "POST", body: JSON.stringify(body) }),
  },
  evals: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : ""
      return request<{ items: Eval[]; total: number }>(`/api/v1/evals${qs}`)
    },
    stats: () => request<{ pass_rate_7d: number[]; overall_pass_rate: number; avg_score: number; pending_human_review: number }>("/api/v1/evals/stats"),
    run: (traceId: string) =>
      request<{ id: string; verdict: string; score: number }>(`/api/v1/evals/run/${traceId}`, { method: "POST" }),
    override: (evalId: string, verdict: string) =>
      request<{ id: string }>(`/api/v1/evals/${evalId}/override`, { method: "PATCH", body: JSON.stringify({ verdict }) }),
  },
  prompts: {
    list: () => request<{ name: string; version_count: number }[]>("/api/v1/prompts"),
    versions: (name: string) => request<PromptVersion[]>(`/api/v1/prompts/${name}/versions`),
    create: (name: string, content: string) =>
      request<{ id: string; version: number }>(`/api/v1/prompts/${name}/versions`, { method: "POST", body: JSON.stringify({ content }) }),
  },
  explorer: {
    query: (question: string, database_url?: string) =>
      request<ExplorerResult>("/api/v1/explorer/query", { method: "POST", body: JSON.stringify({ question, database_url }) }),
    schema: () => request<{ tables: { name: string; columns: { name: string; type: string }[]; rowCount?: number }[] }>("/api/v1/explorer/schema"),
    history: () => request<{ items: { question: string; sql: string; created_at: string }[] }>("/api/v1/explorer/history"),
  },
  metrics: {
    overview: () => request<{ total_traces: number; avg_cost: number; avg_latency_ms: number; pass_rate: number; traces_today: number }>("/api/v1/metrics/overview"),
  },
}
