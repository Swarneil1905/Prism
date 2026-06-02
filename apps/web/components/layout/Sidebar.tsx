"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV = [
  { label: "Traces", href: "/traces" },
  { label: "Evals", href: "/evals" },
  { label: "Prompts", href: "/prompts" },
  { label: "SQL Explorer", href: "/explorer" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      style={{
        width: 220,
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        background: "var(--surface)",
        borderRight: "1px solid var(--line)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "24px 20px", fontFamily: "var(--font-inter)", fontWeight: 700, fontSize: 17, color: "var(--text-1)" }}>
        Prism
      </div>

      <nav style={{ flex: 1, padding: "0 8px" }}>
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                height: 40,
                padding: "0 12px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                color: active ? "var(--indigo)" : "var(--text-2)",
                background: active ? "rgba(108,99,255,0.12)" : "transparent",
                marginBottom: 2,
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: "16px 20px", fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
        demo.db connected
      </div>
    </aside>
  )
}
