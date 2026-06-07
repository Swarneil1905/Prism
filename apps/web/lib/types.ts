export type Trace = {
  id: string
  workflowId: string
  name: string | null
  input: string | null
  output: string | null
  status: "ok" | "error"
  startedAt: string
  endedAt: string | null
  totalCost: number | null
  totalLatency: number | null
  spans?: Span[]
}

export type Span = {
  id: string
  traceId: string
  name: string
  model: string | null
  prompt: string | null
  response: string | null
  inputTokens: number | null
  outputTokens: number | null
  costUsd: number | null
  latencyMs: number | null
  startedAt: string
  spanType: "llm" | "tool" | "retrieval"
}

export type Eval = {
  id: string
  traceId: string
  verdict: "pass" | "fail"
  score: number | null
  reasoning: string | null
  evalType: string
  judgeModel: string | null
  createdAt: string
  humanOverride: "pass" | "fail" | null
  trace?: Trace
}

export type PromptVersion = {
  id: string
  name: string
  version: number
  content: string
  createdAt: string
  stats?: {
    traceCount: number
    passCount: number
    failCount: number
    avgCost: number | null
    avgLatencyMs: number | null
  }
}

export type ExplorerResult = {
  traceId: string
  sql: string
  rows: Record<string, unknown>[]
  columns: string[]
  latencyMs: number
  costUsd: number
}
