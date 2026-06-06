"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api-client"
import type { PromptVersion } from "@/lib/types"

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function StatPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 2,
      background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "10px 14px",
      border: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color ?? "var(--text-1)", fontFamily: "var(--font-jetbrains-mono)" }}>{value}</div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function PromptsPage() {
  const [promptNames, setPromptNames] = useState<{ name: string; version_count: number }[]>([])
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [selected, setSelected] = useState<PromptVersion | null>(null)
  const [activeName, setActiveName] = useState<string | null>(null)
  const [newContent, setNewContent] = useState("")
  const [newName, setNewName] = useState("")
  const [saving, setSaving] = useState(false)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    api.prompts.list().then(setPromptNames).catch(() => {})
  }, [])

  const loadVersions = async (name: string) => {
    setActiveName(name)
    setSelected(null)
    const vs = await api.prompts.versions(name)
    setVersions(vs)
    setSelected(vs[0] ?? null)
  }

  const saveNew = async () => {
    if (!newName.trim() || !newContent.trim()) return
    setSaving(true)
    try {
      await api.prompts.create(newName.trim(), newContent.trim())
      const updated = await api.prompts.list()
      setPromptNames(updated)
      setShowNew(false)
      setNewName("")
      setNewContent("")
      await loadVersions(newName.trim())
    } catch { /* ignore */ } finally {
      setSaving(false)
    }
  }

  const selectedStats = selected?.stats
  const passRate = selectedStats
    ? ((selectedStats.passCount / (selectedStats.traceCount || 1)) * 100).toFixed(1)
    : null

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1)", margin: 0, letterSpacing: "-0.02em" }}>Prompt Library</h1>
          <p style={{ fontSize: 13, color: "var(--text-3)", margin: "4px 0 0" }}>
            Version every prompt · track performance · roll back any time
          </p>
        </div>
        <button
          onClick={() => setShowNew(v => !v)}
          style={{
            height: 34, padding: "0 16px", fontSize: 13, fontWeight: 600, borderRadius: 6,
            background: "var(--indigo)", color: "white", border: "none", cursor: "pointer",
            letterSpacing: "-0.01em",
          }}
        >+ New Version</button>
      </div>

      {/* New prompt form */}
      {showNew && (
        <div style={{
          background: "var(--surface)", borderRadius: 10, padding: 20, marginBottom: 20,
          border: "1px solid rgba(108,99,255,0.25)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", marginBottom: 14 }}>Create new prompt version</div>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Prompt name (e.g. nl2sql-system)"
            style={{
              width: "100%", height: 36, padding: "0 12px", fontSize: 13, borderRadius: 6,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)",
              color: "var(--text-1)", outline: "none", marginBottom: 10, boxSizing: "border-box",
            }}
          />
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="You are a helpful SQL assistant…"
            rows={6}
            style={{
              width: "100%", padding: "10px 12px", fontSize: 13, borderRadius: 6,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)",
              color: "var(--text-1)", outline: "none", resize: "vertical", fontFamily: "var(--font-jetbrains-mono)",
              lineHeight: 1.6, boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              onClick={saveNew}
              disabled={saving}
              style={{
                height: 32, padding: "0 16px", fontSize: 13, fontWeight: 600, borderRadius: 6,
                background: "var(--indigo)", color: "white", border: "none", cursor: "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >{saving ? "Saving…" : "Save"}</button>
            <button
              onClick={() => setShowNew(false)}
              style={{
                height: 32, padding: "0 14px", fontSize: 13, fontWeight: 500, borderRadius: 6,
                background: "none", color: "var(--text-2)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer",
              }}
            >Cancel</button>
          </div>
        </div>
      )}

      {promptNames.length === 0 && !showNew ? (
        <div style={{
          textAlign: "center", padding: "64px 0",
          border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 10,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>No prompts tracked yet</div>
          <div style={{ fontSize: 13, color: "var(--text-3)", maxWidth: 360, margin: "0 auto", lineHeight: 1.6 }}>
            Prompts are recorded automatically when the SQL Explorer runs, or you can create one manually above.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, alignItems: "start" }}>
          {/* Left: prompt list + version history */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)", marginBottom: 6, paddingLeft: 2 }}>
              Prompts ({promptNames.length})
            </div>
            {promptNames.map(p => (
              <div key={p.name}>
                <div
                  onClick={() => loadVersions(p.name)}
                  style={{
                    background: activeName === p.name ? "rgba(108,99,255,0.08)" : "var(--surface)",
                    borderRadius: 8, padding: "12px 14px", cursor: "pointer",
                    border: `1px solid ${activeName === p.name ? "rgba(108,99,255,0.3)" : "rgba(255,255,255,0.06)"}`,
                    transition: "border-color 0.12s, background 0.12s",
                  }}
                  onMouseEnter={e => { if (activeName !== p.name) e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)" }}
                  onMouseLeave={e => { if (activeName !== p.name) e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)" }}
                >
                  <div style={{ fontSize: 13, color: activeName === p.name ? "var(--indigo)" : "var(--text-1)", fontWeight: 500 }}>
                    {p.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, color: "var(--indigo)",
                      background: "rgba(108,99,255,0.12)", borderRadius: 3, padding: "1px 6px",
                    }}>
                      {p.version_count} {p.version_count === 1 ? "version" : "versions"}
                    </span>
                  </div>
                </div>

                {/* Version history (shown when this prompt is active) */}
                {activeName === p.name && versions.length > 0 && (
                  <div style={{ paddingLeft: 12, marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                    {versions.map(v => (
                      <div
                        key={v.id}
                        onClick={() => setSelected(v)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "8px 12px", borderRadius: 6, cursor: "pointer",
                          background: selected?.id === v.id ? "rgba(108,99,255,0.10)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${selected?.id === v.id ? "rgba(108,99,255,0.25)" : "rgba(255,255,255,0.05)"}`,
                        }}
                        onMouseEnter={e => { if (selected?.id !== v.id) e.currentTarget.style.background = "rgba(255,255,255,0.04)" }}
                        onMouseLeave={e => { if (selected?.id !== v.id) e.currentTarget.style.background = "rgba(255,255,255,0.02)" }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: selected?.id === v.id ? "var(--indigo)" : "rgba(255,255,255,0.15)", flexShrink: 0 }} />
                        <span style={{
                          fontFamily: "var(--font-jetbrains-mono)", fontSize: 11,
                          background: "rgba(108,99,255,0.12)", color: "var(--indigo)", borderRadius: 3, padding: "1px 5px",
                        }}>v{v.version}</span>
                        <span style={{ fontSize: 11, color: "var(--text-3)", flex: 1 }}>{fmtDate(v.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right: content viewer */}
          {selected ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Meta bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)" }}>{selected.name}</span>
                  <span style={{
                    fontFamily: "var(--font-jetbrains-mono)", fontSize: 12,
                    background: "rgba(108,99,255,0.12)", color: "var(--indigo)", borderRadius: 4, padding: "2px 8px",
                  }}>v{selected.version}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>{fmtDate(selected.createdAt)}</div>
              </div>

              {/* Content */}
              <div style={{
                fontFamily: "var(--font-jetbrains-mono)", fontSize: 13, color: "var(--text-2)",
                background: "#0E0E10", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8, padding: "16px 18px", lineHeight: 1.75,
                whiteSpace: "pre-wrap", minHeight: 180,
              }}>
                {selected.content || <span style={{ color: "var(--text-3)", fontStyle: "italic" }}>Empty prompt</span>}
              </div>

              {/* Stats */}
              {selectedStats && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)", marginBottom: 10 }}>
                    Performance (this version)
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                    <StatPill label="Traces" value={selectedStats.traceCount.toString()} />
                    <StatPill label="Pass Rate" value={`${passRate}%`} color={Number(passRate) > 80 ? "var(--green)" : "var(--amber)"} />
                    <StatPill label="Avg Cost" value={selectedStats.avgCost != null ? `$${selectedStats.avgCost.toFixed(4)}` : "—"} />
                    <StatPill label="Avg Latency" value={selectedStats.avgLatencyMs != null ? `${Math.round(selectedStats.avgLatencyMs)}ms` : "—"} />
                  </div>
                </div>
              )}
            </div>
          ) : activeName ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "var(--text-3)", fontSize: 13 }}>
              Select a version to view its content
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "var(--text-3)", fontSize: 13 }}>
              Select a prompt from the left to view versions
            </div>
          )}
        </div>
      )}
    </div>
  )
}
