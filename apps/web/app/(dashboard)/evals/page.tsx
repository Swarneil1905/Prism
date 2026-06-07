"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api-client"
import type { Eval } from "@/lib/types"

const MONO = "var(--font-jetbrains-mono)"

// ── Score bar ─────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number | null }) {
  if (score == null) return <span style={{ color: "var(--text-3)", fontSize: 12 }}>N/A</span>
  const pct = Math.round(score * 100)
  const color = score > 0.8 ? "var(--green)" : score > 0.5 ? "var(--amber)" : "var(--red)"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,.07)", borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontFamily: MONO, fontSize: 11, color, width: 32, textAlign: "right" as const }}>
        {score.toFixed(2)}
      </span>
    </div>
  )
}

// ── 7-day SVG sparkline ───────────────────────────────────────────────────
function PassRateChart({ data }: { data: number[] }) {
  if (!data.length) return null
  const W = 280, H = 80, pad = 8
  const pts = data.map((v, i) => [
    pad + (i / (data.length - 1 || 1)) * (W - 2 * pad),
    H - pad - v * (H - 2 * pad),
  ] as [number, number])
  const fill = ["M", ...pts.map(([x, y], i) => (i === 0 ? `${x},${y}` : `L${x},${y}`)),
    `L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H}Z`].join(" ")
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ")
  const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].slice(0, data.length)
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 18}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#6366F1" stopOpacity=".18" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0"   />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#chart-fill)" />
      <path d={line} fill="none" stroke="var(--indigo)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.5} fill="var(--indigo)" />)}
      {DAYS.map((d, i) => {
        const x = pad + (i / (DAYS.length - 1 || 1)) * (W - 2 * pad)
        return <text key={d} x={x} y={H + 14} fontSize={9} fill="var(--text-3)" textAnchor="middle">{d}</text>
      })}
    </svg>
  )
}

// ── Skeleton row ──────────────────────────────────────────────────────────
const EVAL_GRID = "100px 1fr 140px 120px"
function SkeletonEvalRow() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: EVAL_GRID, height: 44, alignItems: "center",
      padding: "0 16px", gap: 12, borderBottom: "1px solid var(--border)" }}>
      {[64, 120, 48, 80].map((w, i) => (
        <div key={i} className="skeleton" style={{ height: 11, width: w }} />
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
type Stats = { pass_rate_7d: number[]; overall_pass_rate: number; avg_score: number; pending_human_review: number }

export default function EvalsPage() {
  const [evals, setEvals]       = useState<Eval[]>([])
  const [stats, setStats]       = useState<Stats | null>(null)
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [overriding, setOverriding] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.evals.list().catch(() => ({ items: [] as Eval[] })),
      api.evals.stats().catch(() => null),
    ]).then(([r, s]) => {
      setEvals(r.items)
      setStats(s)
      setLoading(false)
    })
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
    <div style={{ maxWidth: 1200 }}>

      {/* ── Metrics bar ─────────────────────────────────────────────────── */}
      {(stats || loading) && (
        <div style={{ display: "flex", marginBottom: 28,
          borderBottom: "1px solid var(--border)", paddingBottom: 24 }}>
          {loading
            ? [64, 80, 80, 90].map((w, i) => (
                <div key={i} style={{ flex: 1, paddingLeft: i > 0 ? 24 : 0,
                  borderLeft: i > 0 ? "1px solid var(--border)" : "none",
                  marginLeft: i > 0 ? 24 : 0 }}>
                  <div className="skeleton" style={{ height: 11, width: 64, marginBottom: 10 }} />
                  <div className="skeleton" style={{ height: 26, width: w }} />
                </div>
              ))
            : ([
                { label: "Evaluated",      value: evals.length.toString(),                                  mono: false },
                { label: "Pass rate",      value: `${(stats!.overall_pass_rate * 100).toFixed(1)}%`,        color: stats!.overall_pass_rate > 0.8 ? "var(--green)" : "var(--amber)" },
                { label: "Avg score",      value: stats!.avg_score.toFixed(2),                              mono: true  },
                { label: "Pending review", value: stats!.pending_human_review.toString(),                   color: stats!.pending_human_review > 0 ? "var(--amber)" : undefined },
              ] as { label: string; value: string; mono?: boolean; color?: string }[]).map(({ label, value, mono, color }, i) => (
                <div key={label} style={{ flex: 1, paddingLeft: i > 0 ? 24 : 0,
                  borderLeft: i > 0 ? "1px solid var(--border)" : "none",
                  marginLeft: i > 0 ? 24 : 0 }}>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.025em",
                    color: color ?? "var(--text-1)",
                    fontFamily: mono ? MONO : undefined }}>
                    {value}
                  </div>
                </div>
              ))}
        </div>
      )}

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 296px", gap: 20 }}>

        {/* Eval list */}
        <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: EVAL_GRID, height: 36,
            alignItems: "center", padding: "0 16px", gap: 12, background: "var(--surface-raised)" }}>
            {["Trace", "Score", "Verdict", "Actions"].map(h => (
              <div key={h} style={{ fontSize: 12, fontWeight: 500, color: "var(--text-3)" }}>{h}</div>
            ))}
          </div>

          {/* Skeleton */}
          {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonEvalRow key={i} />)}

          {/* Empty state */}
          {!loading && evals.length === 0 && (
            <div style={{ padding: "56px 0", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>&#9989;</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)", marginBottom: 6 }}>No evals yet</div>
              <div style={{ fontSize: 13, color: "var(--text-3)", maxWidth: 280, margin: "0 auto", lineHeight: 1.6 }}>
                Run evals from the Traces page or instrument your app with the Prism SDK.
              </div>
            </div>
          )}

          {/* Data rows */}
          {!loading && evals.map(ev => {
            const effective = ev.humanOverride ?? ev.verdict
            const pass = effective === "pass"
            return (
              <div key={ev.id}>
                <div onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
                  style={{ display: "grid", gridTemplateColumns: EVAL_GRID, minHeight: 44,
                    alignItems: "center", padding: "8px 16px", gap: 12,
                    borderBottom: expanded === ev.id ? "none" : "1px solid var(--border)",
                    cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.025)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                  {/* Trace ID */}
                  <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--text-2)" }}>
                    {ev.traceId.slice(0, 8)}
                  </span>

                  <ScoreBar score={ev.score} />

                  {/* Verdict */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12,
                    fontWeight: 500, color: pass ? "var(--green)" : "var(--red)" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor",
                      flexShrink: 0, display: "inline-block" }} />
                    {pass ? "Pass" : "Fail"}
                    {ev.humanOverride && (
                      <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 400 }}>(override)</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                    {(["pass", "fail"] as const).map(v => (
                      <button key={v} onClick={() => handleOverride(ev.id, v)}
                        disabled={overriding === ev.id}
                        aria-label={`Override verdict to ${v}`}
                        style={{ height: 24, padding: "0 8px", fontSize: 11, fontWeight: 500, borderRadius: 4,
                          border: `1px solid ${v === "pass" ? "rgba(16,185,129,.35)" : "rgba(239,68,68,.35)"}`,
                          color: v === "pass" ? "var(--green)" : "var(--red)", background: "none",
                          cursor: "pointer", opacity: overriding === ev.id ? 0.5 : 1 }}>
                        {v === "pass" ? "Pass" : "Fail"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expanded reasoning */}
                {expanded === ev.id && (
                  <div style={{ padding: "0 16px 16px", borderBottom: "1px solid var(--border)",
                    background: "rgba(255,255,255,.01)" }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-3)", marginBottom: 8 }}>
                      Judge reasoning
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7,
                      borderLeft: "2px solid var(--border-strong)", paddingLeft: 12 }}>
                      {ev.reasoning ?? <em style={{ color: "var(--text-3)" }}>No reasoning provided.</em>}
                    </div>
                    {ev.judgeModel && (
                      <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 10, fontFamily: MONO }}>
                        judge: {ev.judgeModel} &middot; type: {ev.evalType}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* 7-day chart */}
          {(stats || loading) && (
            <div style={{ background: "var(--surface)", borderRadius: 8, padding: 16,
              border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-3)", marginBottom: 14 }}>
                7-day pass rate
              </div>
              {loading
                ? <div className="skeleton" style={{ height: 80, width: "100%", borderRadius: 4 }} />
                : <PassRateChart data={stats!.pass_rate_7d} />}
            </div>
          )}

          {/* Distribution */}
          {(evals.length > 0 || loading) && (
            <div style={{ background: "var(--surface)", borderRadius: 8, padding: 16,
              border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-3)", marginBottom: 12 }}>
                Distribution
              </div>
              {loading
                ? <div className="skeleton" style={{ height: 6, width: "100%", borderRadius: 3, marginBottom: 10 }} />
                : (
                  <>
                    <div style={{ display: "flex", gap: 2, height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
                      <div style={{ flex: passCount, background: "var(--green)" }} />
                      <div style={{ flex: failCount, background: "var(--red)" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "var(--green)", fontWeight: 600 }}>
                        {passCount}{" "}<span style={{ color: "var(--text-3)", fontWeight: 400 }}>pass</span>
                      </span>
                      <span style={{ color: "var(--red)", fontWeight: 600 }}>
                        {failCount}{" "}<span style={{ color: "var(--text-3)", fontWeight: 400 }}>fail</span>
                      </span>
                    </div>
                  </>
                )}
            </div>
          )}

          {/* Info */}
          <div style={{ background: "var(--indigo-muted)", borderRadius: 8, padding: "14px 16px",
            border: "1px solid rgba(99,102,241,.2)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--indigo)", marginBottom: 6 }}>How evals work</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.65 }}>
              Claude Haiku scores each trace 0&#8211;1. You can override any verdict. Human overrides are final.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
