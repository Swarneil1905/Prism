"use client"
import { useEffect, useState, useCallback } from "react"
import { api } from "@/lib/api-client"
import type { Trace, Span } from "@/lib/types"

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

function StatusDot({ status }: { status: string }) {
  const ok = status === "ok"
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, fontWeight: 500,
      color: ok ? "var(--green)" : "var(--red)",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", flexShrink: 0, display: "inline-block" }} />
      {ok ? "Pass" : "Fail"}
    </span>
  )
}

function SpanTypeTag({ type }: { type: string }) {
  const colors: Record<string, string> = {
    llm: "rgba(99,102,241,0.15)",
    tool: "rgba(245,158,11,0.15)",
    retrieval: "rgba(59,130,246,0.15)",
  }
  const text: Record<string, string> = {
    llm: "#818CF8",
    tool: "var(--amber)",
    retrieval: "var(--blue)",
  }
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
      background: colors[type] ?? "rgba(255,255,255,0.08)",
      color: text[type] ?? "var(--text-3)",
      borderRadius: 3, padding: "2px 6px",
    }}>{type}</span>
  )
}

// ── Detail panel ───────────────────────────────────────────────────────────
function TraceDetail({ trace, onClose }: { trace: Trace; onClose: () => void }) {
  const spans = trace.spans ?? []
  const maxLatency = Math.max(...spans.map(s => s.latencyMs ?? 0), 100)

  return (
    <div style={{
      position: "fixed", right: 0, top: 0, width: 500, height: "100vh",
      background: "var(--surface)", borderLeft: "1px solid var(--border)",
      display: "flex", flexDirection: "column", zIndex: 50,
      boxShadow: "-24px 0 60px rgba(0,0,0,0.5)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", borderBottom: "1px solid var(--border)",
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Trace detail</div>
          <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 12, color: "var(--indigo)" }}>{trace.id.slice(0, 16)}&#8230;</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.06)", border: "none", color: "var(--text-2)",
            width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >&#10005;</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {/* Input */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)", marginBottom: 8 }}>Input</div>
          <div style={{
            fontFamily: "var(--font-jetbrains-mono)", fontSize: 12, color: "var(--text-2)",
            background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
            borderRadius: 6, padding: "12px 14px", lineHeight: 1.65, whiteSpace: "pre-wrap",
          }}>{trace.input ?? ""}</div>
        </div>

        {/* Output */}
        {trace.output && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)", marginBottom: 8 }}>Output</div>
            <div style={{
              fontFamily: "var(--font-jetbrains-mono)", fontSize: 12, color: "var(--text-2)",
              background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)",
              borderRadius: 6, padding: "12px 14px", lineHeight: 1.65, whiteSpace: "pre-wrap",
            }}>{trace.output}</div>
          </div>
        )}

        {/* Span waterfall */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)", marginBottom: 12 }}>Span Waterfall</div>
          {spans.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>No spans recorded</div>
          )}
          {spans.map((span, i) => {
            const pct = Math.max(4, ((span.latencyMs ?? 0) / maxLatency) * 90)
            const barColor = span.spanType === "llm"
              ? "rgba(99,102,241,0.6)"
              : span.spanType === "tool"
              ? "rgba(245,158,11,0.5)"
              : "rgba(59,130,246,0.5)"
            return (
              <div key={span.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <SpanTypeTag type={span.spanType} />
                    <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "var(--text-2)" }}>{span.name}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "var(--text-3)" }}>
                    {span.latencyMs != null ? `${span.latencyMs}ms` : ""}
                  </span>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${pct}%`, borderRadius: 3,
                    background: barColor,
                    marginLeft: `${i * 3}%`,
                  }} />
                </div>
                {span.model && (
                  <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-jetbrains-mono)" }}>
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

      {/* Footer stats */}
      <div style={{
        padding: "14px 20px",
        borderTop: "1px solid var(--border)",
        display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12,
      }}>
        {[
          { label: "Total Cost", value: trace.totalCost != null ? `$${trace.totalCost.toFixed(4)}` : "n/a" },
          { label: "Latency",    value: trace.totalLatency != null ? `${trace.totalLatency.toLocaleString()}ms` : "n/a" },
          { label: "Status",     value: <StatusDot status={trace.status} /> },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)", marginBottom: 5 }}>{label}</div>
            <div style={{ fontFamily: typeof value === "string" ? "var(--font-jetbrains-mono)" : undefined, fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
type Filter = "all" | "pass" | "fail"

export default function TracesPage() {
  const [traces, setTraces] = useState<Trace[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [selected, setSelected] = useState<Trace | null>(null)
  const [stats, setStats] = useState<{ total_traces: number; avg_cost: number; avg_latency_ms: number; pass_rate: number; traces_today: number } | null>(null)

  useEffect(() => {
    api.metrics.overview().then(setStats).catch(() => {})
    api.traces.list().then(r => setTraces(r.items)).catch(() => {})
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

  const COLS: { key: string; label: string; w: string; align?: string }[] = [
    { key: "id",      label: "Trace ID", w: "110px" },
    { key: "input",   label: "Query",    w: "1fr"   },
    { key: "spans",   label: "Spans",    w: "56px",  align: "right" },
    { key: "cost",    label: "Cost",     w: "84px",  align: "right" },
    { key: "latency", label: "Latency",  w: "88px",  align: "right" },
    { key: "started", label: "Started",  w: "84px"  },
    { key: "status",  label: "Status",   w: "72px"  },
  ]
  const gridTemplate = COLS.map(c => c.w).join(" ")

  return (
    <div style={{ maxWidth: 1100 }}>

      {/* Stat cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Total Traces",    value: stats.total_traces.toLocaleString(), sub: `+${stats.traces_today} today` },
            { label: "Avg Cost",        value: `$${stats.avg_cost.toFixed(4)}`,     mono: true },
            { label: "Avg Latency",     value: `${Math.round(stats.avg_latency_ms).toLocaleString()}ms`, mono: true },
            { label: "Pass Rate",       value: `${(stats.pass_rate * 100).toFixed(1)}%`, accent: stats.pass_rate > 0.9 ? "green" : "amber" },
          ].map(({ label, value, sub, mono, accent }) => (
            <div key={label} style={{
              background: "var(--surface)", borderRadius: 8, padding: "14px 16px",
              border: "1px solid var(--border)",
            }}>
              <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 8 }}>{label}</div>
              <div style={{
                fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em",
                fontFamily: mono ? "var(--font-jetbrains-mono)" : undefined,
                color: accent === "green" ? "var(--green)" : accent === "amber" ? "var(--amber)" : "var(--text-1)",
              }}>{value}</div>
              {sub && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>{sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 0 }}>
          {(["all", "pass", "fail"] as Filter[]).map(f => {
            const label = f === "all" ? `All (${traces.length})` : f === "pass" ? `Pass (${passCount})` : `Fail (${failCount})`
            const active = filter === f
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "0 0 10px",
                  marginRight: 24,
                  fontSize: 13, fontWeight: 500,
                  border: "none",
                  borderBottom: `2px solid ${active ? "var(--indigo)" : "transparent"}`,
                  background: "transparent",
                  color: active ? "var(--text-1)" : "var(--text-3)",
                  cursor: "pointer",
                  transition: "color 0.1s, border-color 0.1s",
                }}
              >{label}</button>
            )
          })}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search traces..."
          style={{
            height: 30, padding: "0 12px", fontSize: 12, borderRadius: 6,
            background: "var(--surface)", border: "1px solid var(--border)",
            color: "var(--text-1)", outline: "none", width: 220,
            marginBottom: 10,
          }}
        />
      </div>

      {/* Table */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: gridTemplate, alignItems: "center", padding: "0 16px", height: 36, background: "var(--surface-raised)", gap: 12 }}>
          {COLS.map(c => (
            <div key={c.key} style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", textAlign: c.align as "right" | undefined }}>{c.label}</div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 && (
          <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
            No traces found. Instrument your code with the Prism SDK to start capturing traces.
          </div>
        )}
        {filtered.map(trace => (
          <div
            key={trace.id}
            onClick={() => setSelected(trace)}
            style={{
              display: "grid", gridTemplateColumns: gridTemplate, alignItems: "center",
              padding: "0 16px", height: 44, gap: 12,
              borderBottom: "1px solid var(--border)",
              cursor: "pointer",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "var(--indigo)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {trace.id.slice(0, 8)}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {trace.input ?? <span style={{ color: "var(--text-3)", fontStyle: "italic" }}>no input</span>}
            </div>
            <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 12, color: "var(--text-2)", textAlign: "right" }}>
              {trace.spans?.length ?? 0}
            </div>
            <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 12, color: "var(--text-2)", textAlign: "right" }}>
              {trace.totalCost != null ? `$${trace.totalCost.toFixed(4)}` : ""}
            </div>
            <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 12, color: "var(--text-2)", textAlign: "right" }}>
              {trace.totalLatency != null ? `${trace.totalLatency.toLocaleString()}ms` : ""}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>
              {timeAgo(trace.startedAt)}
            </div>
            <div><StatusDot status={trace.status} /></div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selected && <TraceDetail trace={selected} onClose={() => setSelected(null)} />}

      {/* Overlay */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 49 }}
        />
      )}
    </div>
  )
}
