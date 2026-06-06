"use client"
import { useEffect, useState, useRef } from "react"
import { api } from "@/lib/api-client"
import type { ExplorerResult } from "@/lib/types"

// ── Types ──────────────────────────────────────────────────────────────────
type SchemaColumn = { name: string; type: string }
type SchemaTable  = { name: string; columns: SchemaColumn[] }
type SchemaInfo   = { tables: SchemaTable[] }

// ── Example queries ────────────────────────────────────────────────────────
const EXAMPLES = [
  "What are the top 5 products by total revenue?",
  "Show me average order value by country",
  "How many orders were placed each month this year?",
  "Which customers have spent more than $500?",
  "What is the total revenue by product category?",
]

// ── Result table ───────────────────────────────────────────────────────────
function ResultTable({ result }: { result: ExplorerResult }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, overflow: "auto", maxHeight: 380 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
        <thead>
          <tr style={{ background: "#16161A", position: "sticky", top: 0 }}>
            {result.columns.map(col => (
              <th key={col} style={{
                fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "var(--text-3)",
                padding: "8px 14px", textAlign: "left", whiteSpace: "nowrap",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, i) => (
            <tr
              key={i}
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)" }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
            >
              {result.columns.map(col => (
                <td key={col} style={{
                  fontSize: 12, color: "var(--text-2)", padding: "9px 14px",
                  whiteSpace: "nowrap", maxWidth: 300,
                  overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {String(row[col] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
          {result.rows.length === 0 && (
            <tr>
              <td colSpan={result.columns.length} style={{ padding: "32px 14px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
                Query returned no results
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Schema browser ─────────────────────────────────────────────────────────
function SchemaBrowser({ schema }: { schema: SchemaInfo | null }) {
  const [openTable, setOpenTable] = useState<string | null>(null)

  if (!schema) {
    return (
      <div style={{ padding: 16, fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>
        Loading schema...
      </div>
    )
  }

  return (
    <div>
      {schema.tables.map(t => (
        <div key={t.name} style={{ marginBottom: 4 }}>
          <div
            onClick={() => setOpenTable(openTable === t.name ? null : t.name)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 12px", borderRadius: 6, cursor: "pointer",
              background: openTable === t.name ? "rgba(108,99,255,0.08)" : "transparent",
              color: openTable === t.name ? "var(--indigo)" : "var(--text-2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
              <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 12 }}>{t.name}</span>
            </div>
            <span style={{ fontSize: 9, color: "var(--text-3)" }}>{t.columns.length} cols</span>
          </div>

          {openTable === t.name && (
            <div style={{ paddingLeft: 12, marginTop: 2 }}>
              {t.columns.map(c => (
                <div key={c.name} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "5px 12px", borderRadius: 4,
                }}>
                  <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "var(--text-2)" }}>
                    {c.name}
                  </span>
                  <span style={{
                    fontSize: 9, color: "var(--text-3)", fontFamily: "var(--font-jetbrains-mono)",
                    background: "rgba(255,255,255,0.04)", padding: "1px 5px", borderRadius: 3,
                  }}>
                    {c.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ExplorerPage() {
  const [question, setQuestion] = useState("")
  const [result, setResult] = useState<ExplorerResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [history, setHistory] = useState<Array<{ question: string; sql: string; created_at: string }>>([])
  const [schema, setSchema]   = useState<SchemaInfo | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.explorer.history().then(r => setHistory(r.items)).catch(() => {})
    api.explorer.schema().then(setSchema).catch(() => {})
  }, [])

  const run = async (q: string) => {
    if (!q.trim() || loading) return
    setQuestion(q)
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const r = await api.explorer.query(q)
      setResult(r)
      const newItem = { question: q, sql: r.sql, created_at: new Date().toISOString() }
      setHistory(prev => [newItem, ...prev.slice(0, 9)])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      const friendly = msg.includes("ANTHROPIC_API_KEY")
        ? "Anthropic API key not configured. Add ANTHROPIC_API_KEY to apps/api/.env and restart."
        : msg
      setError(friendly)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1)", margin: 0, letterSpacing: "-0.02em" }}>
            SQL Explorer
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-3)", margin: "4px 0 0" }}>
            Ask any question about your data in plain English
          </p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, height: 26, padding: "0 10px",
          background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)",
          borderRadius: 20, fontSize: 11, color: "var(--indigo)", fontWeight: 500,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Powered by Claude Haiku
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20 }}>
        {/* Schema sidebar */}
        <div style={{
          background: "var(--surface)", borderRadius: 10, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{
            padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)",
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.08em", color: "var(--text-3)",
          }}>
            Schema &middot; {schema?.tables.length ?? 0} tables
          </div>
          <div style={{ padding: "6px 0", maxHeight: 480, overflowY: "auto" }}>
            <SchemaBrowser schema={schema} />
          </div>
        </div>

        {/* Query area */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Input */}
          <div style={{ position: "relative" }}>
            <input
              ref={inputRef}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") run(question) }}
              placeholder='Ask anything — e.g. "Top 5 products by revenue"'
              style={{
                width: "100%", height: 52, padding: "0 110px 0 16px", fontSize: 14,
                background: "var(--surface)", border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 8, color: "var(--text-1)", outline: "none", boxSizing: "border-box",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(108,99,255,0.4)" }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)" }}
            />
            <button
              onClick={() => run(question)}
              disabled={loading || !question.trim()}
              style={{
                position: "absolute", right: 6, top: 7, height: 38, padding: "0 18px",
                fontSize: 13, fontWeight: 600,
                background: loading ? "rgba(108,99,255,0.5)" : "var(--indigo)",
                color: "white", border: "none", borderRadius: 6, cursor: "pointer",
                opacity: !question.trim() ? 0.5 : 1,
              }}
            >
              {loading ? "Running..." : "Run →"}
            </button>
          </div>

          {/* Example chips */}
          {!result && !loading && !error && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 8 }}>
                Try an example
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => run(ex)}
                    style={{
                      padding: "6px 12px", fontSize: 12, color: "var(--text-2)",
                      background: "var(--surface)", border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 5, cursor: "pointer", textAlign: "left",
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(240,74,74,0.08)", border: "1px solid rgba(240,74,74,0.2)",
              borderRadius: 8, padding: "12px 16px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--red)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Error
              </div>
              <div style={{ fontSize: 13, color: "rgba(240,74,74,0.9)", lineHeight: 1.5 }}>{error}</div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* SQL */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)", marginBottom: 8 }}>
                  Generated SQL
                </div>
                <div style={{
                  background: "#0E0E10", borderRadius: 6, padding: "12px 16px",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <pre style={{
                    fontFamily: "var(--font-jetbrains-mono)", fontSize: 12.5, color: "#9b94ff",
                    lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", overflowX: "auto",
                  }}>
                    {result.sql}
                  </pre>
                </div>
              </div>

              {/* Table */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)" }}>
                    Results &middot; {result.rows.length} row{result.rows.length !== 1 ? "s" : ""}
                  </div>
                  <div style={{ display: "flex", gap: 14, fontSize: 11, fontFamily: "var(--font-jetbrains-mono)", color: "var(--text-3)" }}>
                    <span>trace <span style={{ color: "var(--indigo)" }}>{result.traceId.slice(0, 8)}</span></span>
                    <span>${result.costUsd.toFixed(5)}</span>
                    <span>{result.latencyMs}ms</span>
                  </div>
                </div>
                <ResultTable result={result} />
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", marginBottom: 8 }}>
                Recent queries
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {history.slice(0, 5).map((h, i) => (
                  <div
                    key={i}
                    onClick={() => run(h.question)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                      background: "rgba(255,255,255,0.02)", borderRadius: 6, cursor: "pointer",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)" }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ color: "var(--text-3)", flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span style={{ fontSize: 12, color: "var(--text-2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {h.question}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
