"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

// ── Icons ─────────────────────────────────────────────────────────────────
const IconActivity = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)
const IconCheckCircle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)
const IconFileText = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)
const IconDatabase = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
)

// ── Logo mark ──────────────────────────────────────────────────────────────
const PrismMark = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <defs>
      <linearGradient id="prism-grad" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    <polygon points="10,1 19,17 1,17" fill="url(#prism-grad)" />
    <polygon points="10,5.5 16,16 4,16" fill="#09090B" opacity="0.55" />
  </svg>
)

// ── Nav config ─────────────────────────────────────────────────────────────
const NAV = [
  { label: "Traces",       href: "/traces",   Icon: IconActivity    },
  { label: "Evals",        href: "/evals",    Icon: IconCheckCircle },
  { label: "Prompts",      href: "/prompts",  Icon: IconFileText    },
  { label: "SQL Explorer", href: "/explorer", Icon: IconDatabase    },
]

// ── Component ──────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: "var(--sidebar-w)",
      height: "100vh",
      position: "fixed",
      left: 0,
      top: 0,
      background: "var(--surface)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "18px 16px",
        borderBottom: "1px solid var(--border)",
      }}>
        <PrismMark />
        <span style={{
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: "-0.025em",
          color: "var(--text-1)",
        }}>Prism</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 8px" }}>
        <div style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: "var(--text-4)",
          padding: "10px 10px 6px",
        }}>Observability</div>
        {NAV.map(({ label, href, Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 36,
                padding: "0 10px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                textDecoration: "none",
                color: active ? "var(--text-1)" : "var(--text-3)",
                background: active ? "rgba(255,255,255,0.07)" : "transparent",
                marginBottom: 1,
                transition: "background 0.1s, color 0.1s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)"
                  e.currentTarget.style.color = "var(--text-2)"
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "var(--text-3)"
                }
              }}
            >
              <span style={{ color: active ? "var(--indigo)" : "currentColor", flexShrink: 0 }}>
                <Icon />
              </span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--green)",
            display: "inline-block",
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 400 }}>demo.db</span>
          <span style={{ fontSize: 10, color: "var(--text-4)", fontFamily: "var(--font-jetbrains-mono)", marginLeft: "auto" }}>v0.1.0</span>
        </div>
      </div>
    </aside>
  )
}
