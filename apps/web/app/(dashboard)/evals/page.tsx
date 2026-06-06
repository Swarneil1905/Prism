"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api-client"
import type { Eval } from "@/lib/types"

// ── Helpers ────────────────────────────────────────────────────────────────
function VerdictBadge({ verdict, override }: { verdict: string; override?: string | null }) {
  const effective = override ?? verdict
  const pass = effective === "pass"
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
      color: pass ? "var(--green)" : "var(--red)",
      background: pass ? "rgba(52,201,122,0.10)" : "rgba(240,74,74,0.10)",
      borderRadius: 4, padding: "3px 9px",
    }}>
      {pass ? "✓" : "✗"} {effective}
      {override && <span style={{ opacity: 0.6, fontWeight: 400, fontSize: 9 }}> (override)</span>}
    </span>
  )
}

function ScoreBar({ score }: { score: number | null }) {
  if (score == null) return <span style={{ color: "var(--text-3)", fontSize: 12 }}>—</span>
  const pct = Math.round(score * 100)
  const color = score > 0.8 ? "var(--green)" : score > 0.5 ? "var(--amber)" : "var(--red)"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color, width: 32, textAlign: "right" }}>
        {score.toFixed(2)}
      </span>
    </div>
  )
}

// ── 7-day SVG chart ────────────────────────────────────────────────────────
function PassRateChart({ data }: { data: number[] }) {
  if (!data.length) return null
  const W = 280, H = 100, pad = 10
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (W - 2 * pad)
    const y = H - pad - v * (H - 2 * pad)
    return [x, y] as [number, number]
  })
  const fill = ["M", ...points.map(([x, y], i) => (i === 0 ? `${x},${y}` : `L${x},${y}`)), `L${points[points.length - 1][0]},${H} L${points[0][0]},${H}Z`].join(" ")
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ")
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].slice(0, data.length)

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6C63FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#chart-fill)" />
      <path d={line} fill="none" stroke="var(--indigo)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill="var(--indigo)" />
      ))}
      {DAYS.map((d, i) => {
        const x = pad + (i / (DAYS.length - 1 || 1)) * (W - 2 * pad)
        return <text key={d} x={x} y={H + 16} fontSize={9} fill="var(--text-3)" textAnchor="middle">{d}</text>
      })}
    </svg>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function EvalsPage() {
  const [evals, setEvals] = useState<Eval[]>([])
  const [stats, setStats] = useState<{ pass_rate_7d: number[]; overall_pass_rate: number; avg_score: number; pending_human_review: number } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [overriding, setOverriding] = useState<string | null>(null)

  useEffect(() => {
    api.evals.list().then(r => setEvals(r.items)).catch(() => {})
    api.evals.stats().then(setStats).catch(() => {})
  }, [])

  const handleOverride = async (evalId: string, verdict: string) => {
    setOverriding(evalId)
    try {
      await api.evals.override(evalId, verdict)
      setEvals(prev => prev.map(e => e.id === evalId ? { ...e, humanOverride: verdict as "pass" | "fail" } : e))
    } finally {
      setOverriding(null)
    }
  }

  const passCount = evals.filter(e => (e.humanOverride ?? e.verdict) === "pass").length
  const failCount = evals.length - passCount

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1)", margin: 0, letterSpacing: "-0.02em" }}>Evals</h1>
        <p style={{ fontSize: 13, color: "var(--text-3)", margin: "4px 0 0" }}>
          Claude Haiku as judge · human override always wins
        </p>
      </div>

      {/* Stat cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Total Evaluated", value: evals.length.toString() },
            { label: "Pass Rate", value: `${(stats.overall_pass_rate * 100).toFixed(1)}%`, accent: stats.overall_pass_rate > 0.8 ? "green" : "amber" },
            { label: "Avg Score", value: stats.avg_score.toFixed(2), mono: true },
            { label: "Pending Review", value: stats.pending_human_review.toString(), accent: stats.pending_human_review > 0 ? "amber" : undefined },
          ].map(({ label, value, mono, accent }) => (
            <div key={label} style={{
              background: "var(--surface)", borderRadius: 10, padding: "16px 18px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)", marginBottom: 10 }}>{label}</div>
              <div style={{
                fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em",
                fontFamily: mono ? "var(--font-jetbrains-mono)" : undefined,
                color: accent === "green" ? "var(--green)" : accent === "amber" ? "var(--amber)" : "var(--text-1)",
              }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main content: list + chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>

        {/* Eval list */}
        <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{
            display: "grid", gridTemplateColumns: "100px 1fr 140px 120px",
            height: 34, alignItems: "center", padding: "0 16px", gap: 12,
            background: "#16161A",
          }}>
            {["Trace", "Score", "Verdict", "Actions"].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)" }}>{h}</div>
            ))}
          </div>

          {evals.length === 0 && (
            <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
              No evals yet. Run evals from the Traces page or use the SDK.
            </div>
          )}

          {evals.map(ev => (
            <div key={ev.id}>
              {/* Row */}
              <div
                onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
                style={{
                  display: "grid", gridTemplateColumns: "100px 1fr 140px 120px",
                  minHeight: 42, alignItems: "center", padding: "8px 16px", gap: 12,
                  borderBottom: expanded === ev.id ? "none" : "1px solid rgba(255,255,255,0.04)",
                  cursor: "pointer",
                  borderLeft: `2px solid ${(ev.humanOverride ?? ev.verdict) === "fail" ? "var(--red)" : "transparent"}`,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "var(--indigo)" }}>
                  {ev.traceId.slice(0, 8)}
                </div>
                <ScoreBar score={ev.score} />
                <VerdictBadge verdict={ev.verdict} override={ev.humanOverride} />
                <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleOverride(ev.id, "pass")}
                    disabled={overriding === ev.id}
                    style={{
                      height: 24, padding: "0 8px", fontSize: 10, fontWeight: 600, borderRadius: 4,
                      border: "1px solid rgba(52,201,122,0.3)", color: "var(--green)", background: "none",
                      cursor: "pointer", opacity: overriding === ev.id ? 0.5 : 1,
                    }}
                  >Pass</button>
                  <button
                    onClick={() => handleOverride(ev.id, "fail")}
                    disabled={overriding === ev.id}
                    style={{
                      height: 24, padding: "0 8px", fontSize: 10, fontWeight: 600, borderRadius: 4,
                      border: "1px solid rgba(240,74,74,0.3)", color: "var(--red)", background: "none",
                      cursor: "pointer", opacity: overriding === ev.id ? 0.5 : 1,
                    }}
                  >Fail</button>
                </div>
              </div>

              {/* Expanded reasoning */}
              {expanded === ev.id && (
                <div style={{
                  padding: "0 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)",
                  background: "rgba(255,255,255,0.01)",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 6 }}>
                    Judge Reasoning
                  </div>
                  <div style={{
                    fontSize: 13, color: "var(--text-2)", lineHeight: 1.6,
                    borderLeft: "2px solid rgba(255,255,255,0.08)", paddingLeft: 12,
                  }}>
                    {ev.reasoning ?? <span style={{ fontStyle: "italic", color: "var(--text-3)" }}>No reasoning provided</span>}
                  </div>
                  {ev.judgeModel && (
                    <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 8, fontFamily: "var(--font-jetbrains-mono)" }}>
                      judge: {ev.judgeModel} · type: {ev.evalType}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 7-day chart */}
          {stats && (
            <div style={{
              background: "var(--surface)", borderRadius: 10, padding: "16px 18px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)", marginBottom: 12 }}>
                7-Day Pass Rate
              </div>
              <PassRateChart data={stats.pass_rate_7d} />
            </div>
          )}

          {/* Distribution */}
          <div style={{
            background: "var(--surface)", borderRadius: 10, padding: "16px 18px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)", marginBottom: 14 }}>
              Distribution
            </div>
            <div style={{ display: "flex", gap: 2, height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ flex: passCount, background: "var(--green)" }} />
              <div style={{ flex: failCount, background: "var(--red)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 12, color: "var(--green)" }}>
                <span style={{ fontWeight: 700 }}>{passCount}</span> <span style={{ color: "var(--text-3)" }}>pass</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--red)" }}>
                <span style={{ fontWeight: 700 }}>{failCount}</span> <span style={{ color: "var(--text-3)" }}>fail</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div style={{
            background: "rgba(108,99,255,0.06)", borderRadius: 10, padding: "14px 16px",
            border: "1px solid rgba(108,99,255,0.15)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--indigo)", marginBottom: 6 }}>How evals work</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>
              Claude Haiku scores each trace 0–1. You can override any verdict. Human overrides are final.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
