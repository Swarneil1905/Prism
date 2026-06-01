"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api-client"
import type { Eval } from "@/lib/types"

export default function EvalsPage() {
  const [evals, setEvals] = useState<Eval[]>([])
  const [stats, setStats] = useState<{ pass_rate_7d: number[]; overall_pass_rate: number; avg_score: number; pending_human_review: number } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    api.evals.list().then(r => setEvals(r.items)).catch(() => {})
    api.evals.stats().then(setStats).catch(() => {})
  }, [])

  const handleOverride = async (evalId: string, verdict: string) => {
    await api.evals.override(evalId, verdict)
    setEvals(prev => prev.map(e => e.id === evalId ? { ...e, humanOverride: verdict as "pass" | "fail" } : e))
  }

  // SVG pass rate chart
  const chartPoints = stats?.pass_rate_7d.map((v, i) => `${i * 50},${180 - v * 160}`) ?? []
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-1)", margin: 0 }}>Evals</h1>
      </div>

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Total Evaluated", value: evals.length },
            { label: "Pass Rate", value: `${(stats.overall_pass_rate * 100).toFixed(1)}%` },
            { label: "Avg Score", value: stats.avg_score.toFixed(2) },
            { label: "Pending Review", value: stats.pending_human_review },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "var(--surface)", borderRadius: 8, padding: "16px 20px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)", marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: "var(--text-1)" }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "60% 40%", gap: 24 }}>
        {/* Eval list */}
        <div>
          {evals.map(ev => (
            <div
              key={ev.id}
              style={{
                borderBottom: "1px solid var(--line)",
                borderLeft: ev.verdict === "fail" ? "3px solid var(--red)" : "3px solid transparent",
              }}
            >
              <div
                onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}
              >
                <span style={{ flex: 1, fontSize: 13, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ev.traceId.slice(0, 8)}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 600, textTransform: "uppercase", borderRadius: 4, padding: "3px 8px",
                  background: ev.verdict === "pass" ? "rgba(52,201,122,0.12)" : "rgba(240,74,74,0.12)",
                  color: ev.verdict === "pass" ? "var(--green)" : "var(--red)",
                }}>{ev.verdict}</span>
                <span style={{ fontSize: 12, fontFamily: "var(--font-jetbrains-mono)", color: ev.score && ev.score > 0.8 ? "var(--green)" : "var(--red)" }}>
                  {ev.score?.toFixed(2) ?? "—"}
                </span>
              </div>

              {expanded === ev.id && (
                <div style={{ padding: "0 16px 16px" }}>
                  <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4 }}>Judge reasoning</div>
                  <div style={{ fontSize: 13, color: "var(--text-2)", padding: "8px 12px", borderLeft: "2px solid var(--line)", marginBottom: 12 }}>
                    {ev.reasoning}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleOverride(ev.id, "fail")}
                      style={{ height: 28, padding: "0 12px", fontSize: 11, fontWeight: 500, borderRadius: 5, border: "1px solid rgba(240,74,74,0.4)", color: "var(--red)", background: "none", cursor: "pointer" }}
                    >Confirm Fail</button>
                    <button
                      onClick={() => handleOverride(ev.id, "pass")}
                      style={{ height: 28, padding: "0 12px", fontSize: 11, fontWeight: 500, borderRadius: 5, border: "1px solid var(--line)", color: "var(--text-2)", background: "none", cursor: "pointer" }}
                    >Override Pass</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pass rate chart */}
        <div style={{ background: "var(--surface)", borderRadius: 8, padding: 20, border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>7-Day Pass Rate</div>
          <svg width="100%" viewBox="0 0 300 200" style={{ overflow: "visible" }}>
            {chartPoints.length > 1 && (
              <polyline
                points={chartPoints.join(" ")}
                fill="none"
                stroke="var(--indigo)"
                strokeWidth="1.5"
              />
            )}
            {chartPoints.map((pt, i) => {
              const [x, y] = pt.split(",").map(Number)
              return <circle key={i} cx={x} cy={y} r={3} fill="var(--indigo)" />
            })}
            {DAYS.map((d, i) => (
              <text key={d} x={i * 50} y={195} fontSize={10} fill="var(--text-3)" textAnchor="middle">{d}</text>
            ))}
          </svg>
        </div>
      </div>
    </div>
  )
}
