"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api-client"
import type { Trace } from "@/lib/types"

function StatusBadge({ status }: { status: string }) {
  const isPass = status === "ok"
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, textTransform: "uppercase",
      borderRadius: 4, padding: "3px 8px",
      background: isPass ? "rgba(52,201,122,0.12)" : "rgba(240,74,74,0.12)",
      color: isPass ? "var(--green)" : "var(--red)",
    }}>
      {isPass ? "pass" : "fail"}
    </span>
  )
}

export default function TracesPage() {
  const [traces, setTraces] = useState<Trace[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Trace | null>(null)
  const [stats, setStats] = useState<{ total_traces: number; avg_cost: number; avg_latency_ms: number; pass_rate: number } | null>(null)

  useEffect(() => {
    api.metrics.overview().then(setStats).catch(() => {})
    api.traces.list().then(r => { setTraces(r.items); setTotal(r.total) }).catch(() => {})
  }, [])

  const filtered = traces.filter(t =>
    !search || t.input?.toLowerCase().includes(search.toLowerCase()) || t.id.includes(search)
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-1)", margin: 0 }}>Traces</h1>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by query text or trace ID"
          style={{
            height: 36, padding: "0 12px", fontSize: 13, borderRadius: 6,
            background: "var(--surface)", border: "1px solid var(--line)",
            color: "var(--text-1)", outline: "none", width: 280,
          }}
        />
      </div>

      {/* Stat strip */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Total Traces", value: stats.total_traces.toLocaleString() },
            { label: "Avg Cost", value: `$${stats.avg_cost.toFixed(4)}` },
            { label: "Avg Latency", value: `${stats.avg_latency_ms.toLocaleString()}ms` },
            { label: "Pass Rate", value: `${(stats.pass_rate * 100).toFixed(1)}%` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "var(--surface)", borderRadius: 8, padding: "16px 20px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)", marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: "var(--text-1)" }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "120px 1fr 60px 80px 80px 80px",
          height: 36, alignItems: "center", padding: "0 16px",
          background: "#1A1A1C", gap: 12,
        }}>
          {["Trace ID", "Query", "Spans", "Cost", "Latency", "Status"].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)" }}>{h}</div>
          ))}
        </div>

        {filtered.map(trace => (
          <div
            key={trace.id}
            onClick={() => setSelected(trace)}
            style={{
              display: "grid", gridTemplateColumns: "120px 1fr 60px 80px 80px 80px",
              height: 44, alignItems: "center", padding: "0 16px", gap: 12,
              borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 12, color: "var(--text-2)" }}>{trace.id.slice(0, 8)}</div>
            <div style={{ fontSize: 13, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trace.input}</div>
            <div style={{ fontSize: 12, color: "var(--text-2)", textAlign: "center" }}>{trace.spans?.length ?? "—"}</div>
            <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 12, color: "var(--text-2)" }}>{trace.totalCost != null ? `$${trace.totalCost.toFixed(4)}` : "—"}</div>
            <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 12, color: "var(--text-2)" }}>{trace.totalLatency != null ? `${trace.totalLatency.toLocaleString()}ms` : "—"}</div>
            <div><StatusBadge status={trace.status} /></div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{
          position: "fixed", right: 0, top: 0, width: 480, height: "100vh",
          background: "var(--surface)", borderLeft: "1px solid var(--line)",
          overflowY: "auto", padding: 24, zIndex: 50,
        }}>
          <button onClick={() => setSelected(null)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-2)", fontSize: 18, cursor: "pointer" }}>✕</button>

          <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 13, background: "var(--surface-raised)", padding: 14, borderRadius: 6, marginBottom: 24 }}>
            {selected.input}
          </div>

          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)", marginBottom: 12 }}>Span Waterfall</div>

          {selected.spans?.map(span => (
            <div key={span.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "var(--text-2)" }}>{span.name}</span>
                <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "var(--text-2)" }}>{span.latencyMs}ms</span>
              </div>
              <div style={{ height: 28, background: "rgba(255,255,255,0.03)", borderRadius: 4, position: "relative" }}>
                <div style={{
                  position: "absolute", top: 4, left: "5%", height: 20, borderRadius: 3,
                  width: `${Math.min(90, (span.latencyMs ?? 100) / 20)}%`,
                  background: span.spanType === "llm" ? "rgba(108,99,255,0.5)" : "rgba(74,156,240,0.4)",
                }} />
              </div>
            </div>
          ))}

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>Total cost: ${(selected.totalCost ?? 0).toFixed(4)}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>Total latency: {selected.totalLatency}ms</div>
          </div>
        </div>
      )}
    </div>
  )
}
