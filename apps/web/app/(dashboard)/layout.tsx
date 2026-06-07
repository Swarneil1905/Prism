import Sidebar from "@/components/layout/Sidebar"
import TopBar from "@/components/layout/TopBar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: "var(--sidebar-w)", flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <TopBar />
        <main style={{ flex: 1, background: "var(--bg)", padding: "24px 28px" }}>
          {children}
        </main>
      </div>
    </div>
  )
}
