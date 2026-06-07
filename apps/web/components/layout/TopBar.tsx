"use client"
import { usePathname } from "next/navigation"

const META: Record<string, string> = {
  "/traces":   "Traces",
  "/evals":    "Evaluations",
  "/prompts":  "Prompt Library",
  "/explorer": "SQL Explorer",
}

export default function TopBar() {
  const pathname = usePathname()
  const title = META[pathname] ?? pathname.replace("/", "")

  return (
    <header style={{
      height: 52,
      display: "flex",
      alignItems: "center",
      padding: "0 28px",
      borderBottom: "1px solid var(--border)",
      background: "var(--bg)",
      position: "sticky",
      top: 0,
      zIndex: 30,
      flexShrink: 0,
    }}>
      <span style={{
        fontSize: 14,
        fontWeight: 600,
        color: "var(--text-1)",
        letterSpacing: "-0.01em",
      }}>
        {title}
      </span>
    </header>
  )
}
