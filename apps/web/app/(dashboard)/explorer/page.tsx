"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api-client"
import type { ExplorerResult } from "@/lib/types"

export default function ExplorerPage() {
  const [question, setQuestion] = useState("")
  const [result, setResult] = useState<ExplorerResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<{ question: string; sql: string }[]>([])
  const [schema, setSchema] = useState<{ tables: { name: string; columns: { name: string; type: string }[] }[] } | null>(null)

  useEffect(() => {
    api.explorer.history().then(r => setHistory(r.items)).catch(() => {})
    api.explorer.schema().then(setSchema).catch(() => {})
  }, [])

  const run = async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    try {
      const r = await api.explorer.query(q)
      setResult(r)
      setHistory(prev => [{ question: q, sql: r.sql }, ...prev.slice(0, 9)])
    } catch {
      // error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-1)", margin: 0 }}>SQL Explorer</h1>
      </div>

      {/* Query input */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === "Enter" && run(question)}
          placeholder="Ask anything about the data..."
          style={{
            flex: 1, height: 52, padding: "0 16px", fontSize: 15,
            background: "var(--surface)", border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 8, color: "var(--text-1)", outline: "none",
          }}
        />
        <button
          onClick={() => run(question)}
          disabled={loading}
          style={{
            height: 52, width: 80, fontSize: 14, fontWeight: 500,
            background: "var(--indigo)", color: "white", border: "none",
            borderRadius: 6, cursor: "pointer",
          }}
        >
          {loading ? "…" : "Run"}
        </button>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 24 }}>
        demo.db · {schema?.tables.length ?? 0} tables
      </div>

      {/* Results */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* SQL */}
          <div style={{ background: "var(--bg)", borderRadius: 6, padding: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>Generated SQL</div>
            <pre style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
              {result.sql}
            </pre>
          </div>

          {/* Table */}
          <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#1A1A1C" }}>
                  {result.columns.map(col => (
                    <th key={col} style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "var(--text-3)", padding: "8px 12px", textAlign: "left" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                    {result.columns.map(col => (
                      <td key={col} style={{ fontSize: 12, color: "var(--text-2)", padding: "8px 12px" }}>{String(row[col] ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Trace summary */}
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--text-2)" }}>
            <span>Trace: <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>{result.traceId.slice(0, 8)}</span></span>
            <span>Cost: ${result.costUsd.toFixed(4)}</span>
            <span>Latency: {result.latencyMs}ms</span>
          </div>
        </div>
      )}

      {/* History chips */}
      {history.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }}>
          {history.map((h, i) => (
            <button
              key={i}
              onClick={() => { setQuestion(h.question); run(h.question) }}
              style={{
                background: "var(--surface)", borderRadius: 4, padding: "6px 10px",
                fontSize: 12, color: "var(--text-2)", border: "1px solid var(--line)",
                cursor: "pointer", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {h.question.slice(0, 30)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
