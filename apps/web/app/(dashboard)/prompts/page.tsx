"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api-client"
import type { PromptVersion } from "@/lib/types"

export default function PromptsPage() {
  const [promptNames, setPromptNames] = useState<{ name: string; version_count: number }[]>([])
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [selected, setSelected] = useState<PromptVersion | null>(null)
  const [activeName, setActiveName] = useState<string | null>(null)

  useEffect(() => {
    api.prompts.list().then(setPromptNames).catch(() => {})
  }, [])

  const loadVersions = async (name: string) => {
    setActiveName(name)
    const vs = await api.prompts.versions(name)
    setVersions(vs)
    setSelected(vs[0] ?? null)
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-1)", margin: 0 }}>Prompts</h1>
        <button style={{ height: 36, padding: "0 16px", fontSize: 13, fontWeight: 500, borderRadius: 6, background: "var(--indigo)", color: "white", border: "none", cursor: "pointer" }}>
          New Version
        </button>
      </div>

      {promptNames.length === 0 && (
        <p style={{ color: "var(--text-3)", fontSize: 13 }}>No prompts tracked yet. Prompts are recorded automatically when the NL2SQL engine runs.</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
        {/* Version list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {promptNames.map(p => (
            <div key={p.name} onClick={() => loadVersions(p.name)} style={{ cursor: "pointer" }}>
              <div style={{
                background: "var(--surface)", borderRadius: 8, padding: 16,
                border: `1px solid ${activeName === p.name ? "var(--indigo)" : "var(--line)"}`,
              }}>
                <div style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>{p.version_count} version{p.version_count !== 1 ? "s" : ""}</div>
              </div>
            </div>
          ))}

          {versions.map(v => (
            <div
              key={v.id}
              onClick={() => setSelected(v)}
              style={{
                background: "var(--surface)", borderRadius: 8, padding: 16,
                border: `1px solid ${selected?.id === v.id ? "var(--indigo)" : "var(--line)"}`,
                cursor: "pointer", marginLeft: 12,
              }}
            >
              <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 12, background: "rgba(108,99,255,0.12)", color: "var(--indigo)", borderRadius: 4, padding: "3px 8px" }}>
                v{v.version}
              </span>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>{new Date(v.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div>
          {selected ? (
            <div>
              <div style={{
                fontFamily: "var(--font-jetbrains-mono)", fontSize: 13, color: "var(--text-2)",
                background: "var(--surface-raised)", borderRadius: 6, padding: 16, lineHeight: 1.6,
                border: "1px solid rgba(255,255,255,0.08)", whiteSpace: "pre-wrap",
              }}>
                {selected.content}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
                {selected.stats && (
                  <>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>Pass rate: {((selected.stats.passCount / (selected.stats.traceCount || 1)) * 100).toFixed(1)}%</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>Traces: {selected.stats.traceCount}</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--text-3)", fontSize: 13 }}>Select a prompt to view its content.</p>
          )}
        </div>
      </div>
    </div>
  )
}
