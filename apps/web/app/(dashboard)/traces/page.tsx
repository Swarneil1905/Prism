"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api-client"
import type { Trace } from "@/lib/types"

// ── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Span type badge ───────────────────────────────────────────────────────
function SpanTypeTag({ type }: { type: string }) {
  const bg: Record<string, string>   = { llm: "rgba(99,102,241,.14)", tool: "rgba(245,158,11,.14)", retrieval: "rgba(59,130,246,.14)" }
  const fg: Record<string, string>   = { llm: "#818CF8",              tool: "#F59E0B",              retrieval: "#3B82F6"              }
  return (
    <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
      background: bg[type] ?? "rgba(255,255,255,.08)", color: fg[type] ?? "var(--text-3)",
      borderRadius: 3, padding: "2px 6px" }}>{type}</span>
  )
}

// ── Skeleton row ───────────────────────────────────────────────────────────
const GRID = "110px 1fr 56px 84px 88px 84px 72px"

function SkeletonRow() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: GRID, height: 44, alignItems: "center",
      padding: "0 16px", gap: 12, borderBottom: "1px solid var(--border)" }}>
      {[72, 200, 24, 48, 56, 48, 36].map((w, i) => (
        <div key={i} className="skeleton" style={{ height: 11, width: w, maxWidth: "100%" }} />
      ))}
    </div>
  )
}

// ── Detail panel ───────────────────────────────────────────────────────────
function TraceDetail({ trace, onClose }: { trace: Trace; onClose: () => void }) {
  const spans = trace.spans ?? []
  const maxLatency = Math.max(...spans.map(s => s.latencyMs ?? 0), 100)

  return (
    <div style={{ position: "fixed", right: 0, top: 0, width: 500, height: "100vh",
      background: "var(--surface)", borderLeft: "1px solid var(--border)",
      display: "flex", flexDirection: "column", zIndex: 50,
      boxShadow: "-32px 0 64px rgba(0,0,0,0.6)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-3)", marginBottom: 4 }}>Trace</div>
          <span style={{ fontSize: 12, color: "var(--text-1)", fontFamily: "var(--font-jetbrains-mono)" }}>
            {trace.id.slice(0, 16)}&#8230;
          </span>
        </div>
        <button onClick={onClose} aria-label="Close detail panel"
          style={{ background: "rgba(255,255,255,.06)", border: "none", color: "var(--text-2)",
            width: 28, height: 28, borderRadius: 6, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>&#10005;</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {/* Input */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-3)", marginBottom: 8 }}>Input</div>
          <pre style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 12, color: "var(--text-2)",
            background: "rgba(255,255,255,.03)", border: "1px solid var(--border)",
            borderRadius: 6, padding: "12px 14px", lineHeight: 1.65, whiteSpace: "pre-wrap",
            margin: 0, overflowWrap: "break-word" }}>{trace.input ?? ""}</pre>
        </div>

        {/* Output */}
        {trace.output && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-3)", marginBottom: 8 }}>Output</div>
            <pre style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 12, color: "var(--text-2)",
              background: "rgba(16,185,129,.04)", border: "1px solid rgba(16,185,129,.15)",
              borderRadius: 6, padding: "12px 14px", lineHeight: 1.65, whiteSpace: "pre-wrap",
              margin: 0, overflowWrap: "break-word" }}>{trace.output}</pre>
          </div>
        )}

        {/* Span waterfall */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-3)", marginBottom: 12 }}>Span waterfall</div>
          {spans.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0 }}>No spans recorded.</p>
          )}
          {spans.map((span, i) => {
            const pct = Math.max(4, ((span.latencyMs ?? 0) / maxLatency) * 90)
            const barColor = { llm: "rgba(99,102,241,.6)", tool: "rgba(245,158,11,.5)", retrieval: "rgba(59,130,246,.5)" }[span.spanType] ?? "rgba(255,255,255,.2)"
            return (
              <div key={span.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <SpanTypeTag type={span.spanType} />
                    <span style={{ fontSize: 11, color: "var(--text-2)", fontFamily: "var(--font-jetbrains-mono)" }}>{span.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-jetbrains-mono)" }}>
                    {span.latencyMs != null ? `${span.latencyMs}ms` : ""}
                  </span>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,.05)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, borderRadius: 3, background: barColor, marginLeft: `${i * 3}%` }} />
                </div>
                {span.model && (
                  <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-jetbrains-mono)" }}>
                    <span>{span.model}</span>
                    {span.inputTokens != null && <span>{span.inputTokens} / {span.outputTokens ?? 0} tok</span>}
                    {span.costUsd != null && <span>${span.costUsd.toFixed(5)}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)",
        display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { label: "Total cost",  value: trace.totalCost != null ? `$${trace.totalCost.toFixed(4)}` : "n/a", mono: true },
          { label: "Latency",     value: trace.totalLatency != null ? `${trace.totalLatency.toLocaleString()}ms` : "n/a", mono: true },
          { label: "Status",      value: trace.status === "ok" ? "Pass" : "Fail",
            color: trace.status === "ok" ? "var(--green)" : "var(--red)" },
        ].map(({ label, value, mono, color }) => (
          <div key={label}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-3)", marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: mono ? "var(--font-jetbrains-mono)" : undefined,
              fontSize: 13, fontWeight: 500, color: color ?? "var(--text-1)" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
type Filter = "all" | "pass" | "fail"
type Stats  = { total_traces: number; avg_cost: number; avg_latency_ms: number; pass_rate: number; traces_today: number }

export default function TracesPage() {
  const [traces, setTraces]   = useState<Trace[]>([])
  const [stats, setStats]     = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState("")
  const [filter, setFilter]   = useState<Filter>("all")
  const [selected, setSelected] = useState<Trace | null>(null)

  useEffect(() => {
    Promise.all([
      api.metrics.overview().catch(() => null),
      api.traces.list().catch(() => ({ items: [] as Trace[] })),
    ]).then(([s, r]) => {
      setStats(s)
      setTraces(r.items)
      setLoading(false)
    })
  }, [])

  const filtered = traces.filter(t => {
    if (filter === "pass" && t.status !== "ok") return false
    if (filter === "fail" && t.status === "ok") return false
    if (search) {
      const q = search.toLowerCase()
      return t.input?.toLowerCase().includes(q) || t.id.includes(q)
    }
    return true
  })

  const passCount = traces.filter(t => t.status === "ok").length
  const failCount = traces.length - passCount

  // ── Column config ─────────────────────────────────────────────────────────
  const COLS: { label: string; w: string; align?: "right" }[] = [
    { label: "Trace ID",  w: "110px" },
    { label: "Query",     w: "1fr"   },
    { label: "Spans",     w: "56px",  align: "right" },
    { label: "Cost",      w: "84px",  align: "right" },
    { label: "Latency",   w: "88px",  align: "right" },
    { label: "When",      w: "84px"  },
    { label: "Status",    w: "72px"  },
  ]

  return (
    <div style={{ maxWidth: 1200 }}>

      {/* ── Metrics bar ─────────────────────────────────────────────────── */}
      {(stats || loading) && (
        <div style={{ display: "flex", gap: 0, marginBottom: 28,
          borderBottom: "1px solid var(--border)", paddingBottom: 24 }}>
          {loading
            ? [90, 80, 96, 72].map((w, i) => (
                <div key={i} style={{ flex: 1, paddingLeft: i > 0 ? 24 : 0,
                  borderLeft: i > 0 ? "1px solid var(--border)" : "none",
                  marginLeft: i > 0 ? 24 : 0 }}>
                  <div className="skeleton" style={{ height: 11, width: 64, marginBottom: 10 }} />
                  <div className="skeleton" style={{ height: 26, width: w }} />
                </div>
              ))
            : ([
                { label: "Traces",      value: stats!.total_traces.toLocaleString(), sub: `+${stats!.traces_today} today` },
                { label: "Avg cost",    value: `$${stats!.avg_cost.toFixed(4)}`,     mono: true },
                { label: "Avg latency", value: `${Math.round(stats!.avg_latency_ms).toLocaleString()}ms`, mono: true },
                { label: "Pass rate",   value: `${(stats!.pass_rate * 100).toFixed(1)}%`,
                  color: stats!.pass_rate > 0.9 ? "var(--green)" : "var(--amber)" },
              ] as { label: string; value: string; sub?: string; mono?: boolean; color?: string }[]).map(({ label, value, sub, mono, color }, i) => (
                <div key={label} style={{ flex: 1, paddingLeft: i > 0 ? 24 : 0,
                  borderLeft: i > 0 ? "1px solid var(--border)" : "none",
                  marginLeft: i > 0 ? 24 : 0 }}>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.025em",
                    color: color ?? "var(--text-1)",
                    fontFamily: mono ? "var(--font-jetbrains-mono)" : undefined }}>
                    {value}
                  </div>
                  {sub && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>{sub}</div>}
                </div>
              ))}
        </div>
      )}

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
        <div style={{ display: "flex" }} role="tablist" aria-label="Filter traces">
          {(["all", "pass", "fail"] as Filter[]).map(f => {
            const labels = { all: `All (${traces.length})`, pass: `Pass (${passCount})`, fail: `Fail (${failCount})` }
            const active = filter === f
            return (
              <button key={f} role="tab" aria-selected={active} onClick={() => setFilter(f)}
                style={{ padding: "0 0 10px", marginRight: 24, fontSize: 13, fontWeight: 500,
                  border: "none", borderBottom: `2px solid ${active ? "var(--indigo)" : "transparent"}`,
                  background: "transparent", color: active ? "var(--text-1)" : "var(--text-3)",
                  cursor: "pointer", transition: "color .1s, border-color .1s" }}>
                {labels[f]}
              </button>
            )
          })}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search traces..." aria-label="Search traces"
          style={{ height: 30, padding: "0 12px", fontSize: 12, borderRadius: 6, marginBottom: 10,
            background: "var(--surface)", border: "1px solid var(--border)",
            color: "var(--text-1)", width: 220 }} />
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div role="table" aria-label="Traces" style={{ borderRadius: 8, overflow: "hidden",
        border: "1px solid var(--border)" }}>

        {/* Header */}
        <div role="row" style={{ display: "grid", gridTemplateColumns: GRID,
          alignItems: "center", padding: "0 16px", height: 36,
          background: "var(--surface-raised)", gap: 12 }}>
          {COLS.map(c => (
            <div key={c.label} role="columnheader"
              style={{ fontSize: 12, fontWeight: 500, color: "var(--text-3)", textAlign: c.align }}>
              {c.label}
            </div>
          ))}
        </div>

        {/* Skeleton rows */}
        {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div role="row" style={{ padding: "56px 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12, lineHeight: 1 }}>&#128202;</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)", marginBottom: 6 }}>
              No traces yet
            </div>
            <div style={{ fontSize: 13, color: "var(--text-3)", maxWidth: 320, margin: "0 auto", lineHeight: 1.6 }}>
              Instrument your app with the Prism SDK to start capturing LLM calls and workflow runs.
            </div>
          </div>
        )}

        {/* Data rows */}
        {!loading && filtered.map(trace => (
          <div key={trace.id} role="row" onClick={() => setSelected(trace)}
            style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "center",
              padding: "0 16px", height: 44, gap: 12,
              borderBottom: "1px solid var(--border)", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.025)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

            {/* ID */}
            <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11,
              color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {trace.id.slice(0, 8)}
            </span>

            {/* Query */}
            <span style={{ fontSize: 12, color: "var(--text-2)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {trace.input ?? <span style={{ color: "var(--text-4)", fontStyle: "italic" }}>—</span>}
            </span>

            {/* Spans */}
            <span style={{ fontSize: 12, color: "var(--text-3)",
              textAlign: "right" as const, fontFamily: "var(--font-jetbrains-mono)" }}>
              {trace.spans?.length ?? 0}
            </span>

            {/* Cost */}
            <span style={{ fontSize: 12, color: "var(--text-2)",
              textAlign: "right" as const, fontFamily: "var(--font-jetbrains-mono)" }}>
              {trace.totalCost != null ? `$${trace.totalCost.toFixed(4)}` : "—"}
            </span>

            {/* Latency */}
            <span style={{ fontSize: 12, color: "var(--text-2)",
              textAlign: "right" as const, fontFamily: "var(--font-jetbrains-mono)" }}>
              {trace.totalLatency != null ? `${trace.totalLatency.toLocaleString()}ms` : "—"}
            </span>

            {/* When */}
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>
              {timeAgo(trace.startedAt)}
            </span>

            {/* Status */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500,
              color: trace.status === "ok" ? "var(--green)" : "var(--red)" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor",
                flexShrink: 0, display: "inline-block" }} />
              {trace.status === "ok" ? "Pass" : "Fail"}
            </div>
          </div>
        ))}
      </div>

      {/* ── Detail panel ───────────────────────────────────────────────────── */}
      {selected && <TraceDetail trace={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
