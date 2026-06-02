import Link from "next/link"

export default function LandingPage() {
  return (
    <>
      <style>{`
        :root {
          --bg: #0C0C0E; --surface: #141416; --surface-raised: #1C1C1F;
          --indigo: #6C63FF; --indigo-hover: #7B73FF;
          --text-1: #F2F1EE; --text-2: #8A8884; --text-3: #4A4946;
          --line: rgba(255,255,255,0.06); --green: #34C97A; --red: #F04A4A;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); color: var(--text-2); font-family: var(--font-inter, Inter, sans-serif); }
        .fade-in { opacity: 0; transform: translateY(24px); transition: opacity 400ms ease, transform 400ms ease; }
        .fade-in.visible { opacity: 1; transform: translateY(0); }
      `}</style>

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, height: 64, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", background: "rgba(12,12,14,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: "var(--text-1)" }}>Prism</div>
        <div style={{ display: "flex", gap: 32 }}>
          {["Product", "Docs", "GitHub", "Pricing"].map(l => (
            <a key={l} href="#" style={{ fontSize: 14, color: "var(--text-2)", textDecoration: "none" }}>{l}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={{ height: 36, padding: "0 16px", fontSize: 13, fontWeight: 500, borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "none", color: "var(--text-1)", cursor: "pointer" }}>Sign in</button>
          <Link href="/traces" style={{ height: 36, padding: "0 16px", fontSize: 13, fontWeight: 500, borderRadius: 8, background: "var(--indigo)", color: "white", display: "flex", alignItems: "center", textDecoration: "none" }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", paddingTop: 64 }}>
        <video autoPlay muted loop playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.25 }} src="/video1.mp4" />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(108,99,255,0.08) 0%, transparent 60%)" }} />
        <div style={{ position: "relative", textAlign: "center", maxWidth: 680, padding: "0 24px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--indigo)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: 999, padding: "6px 14px", marginBottom: 32 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", display: "inline-block", boxShadow: "0 0 8px var(--green)" }} />
            Open Source · Self-Hostable
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.1, marginBottom: 24 }}>
            LLM calls, finally <span style={{ color: "var(--indigo)" }}>measured</span>
          </h1>
          <p style={{ fontSize: 18, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 40 }}>
            Prism records every LLM call your app makes — cost, latency, quality. Open source, Postgres-backed, one Docker Compose command.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/traces" style={{ height: 48, padding: "0 24px", fontSize: 15, fontWeight: 500, borderRadius: 8, background: "var(--indigo)", color: "white", display: "flex", alignItems: "center", textDecoration: "none" }}>Open Dashboard</Link>
            <a href="https://github.com" style={{ height: 48, padding: "0 24px", fontSize: 15, fontWeight: 500, borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-1)", display: "flex", alignItems: "center", textDecoration: "none" }}>View on GitHub</a>
          </div>
        </div>
      </section>

      {/* Feature 1 — Traces */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "120px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--indigo)", marginBottom: 16 }}>Traces</div>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.2, marginBottom: 20 }}>Every span, visualized</h2>
          <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.7 }}>Wrap any function with <code style={{ fontFamily: "var(--font-jetbrains-mono, monospace)", color: "var(--indigo)" }}>@prism.trace</code> and get a full waterfall breakdown of cost, tokens, and latency per step.</p>
        </div>
        <div style={{ background: "var(--surface)", borderRadius: 12, padding: 24, border: "1px solid rgba(255,255,255,0.08)" }}>
          {[
            { name: "Schema introspection", ms: 180, type: "retrieval", w: "15%", color: "rgba(74,156,240,0.4)" },
            { name: "SQL generation", ms: 980, type: "llm", w: "55%", color: "rgba(108,99,255,0.5)" },
            { name: "SQL validation", ms: 440, type: "llm", w: "30%", color: "rgba(108,99,255,0.3)" },
          ].map(s => (
            <div key={s.name} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-2)" }}>{s.name}</span>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-2)" }}>{s.ms}ms</span>
              </div>
              <div style={{ height: 28, background: "rgba(255,255,255,0.03)", borderRadius: 4, position: "relative" }}>
                <div style={{ position: "absolute", top: 4, left: "5%", height: 20, borderRadius: 3, width: s.w, background: s.color }} />
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>Total cost $0.0071</span>
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>Total time 1,600ms</span>
          </div>
        </div>
      </section>

      {/* Feature 2 — Evals */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px 120px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        <div style={{ background: "var(--surface)", borderRadius: 12, padding: 24, border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4 }}>Pass Rate</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: "var(--green)" }}>89%</div>
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4 }}>Avg Score</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: "var(--text-1)" }}>0.91</div>
            </div>
          </div>
          <svg width="100%" viewBox="0 0 300 80">
            <polyline points="0,67 50,60 100,72 150,37 200,22 250,13 300,11" fill="none" stroke="var(--indigo)" strokeWidth="1.5" />
            {[0,50,100,150,200,250,300].map((x,i) => {
              const ys = [67,60,72,37,22,13,11]
              return <circle key={x} cx={x} cy={ys[i]} r={3} fill="var(--indigo)" />
            })}
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--indigo)", marginBottom: 16 }}>Evals</div>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.2, marginBottom: 20 }}>Automated quality scoring</h2>
          <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.7 }}>claude-haiku judges every output, gives a score and reasoning. Override with one click when the LLM gets it wrong.</p>
        </div>
      </section>

      {/* Feature 3 — SQL Explorer */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px 120px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--indigo)", marginBottom: 16 }}>SQL Explorer</div>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.2, marginBottom: 20 }}>Ask your database anything</h2>
          <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.7 }}>Type a question, get SQL and results back instantly. Every query is traced through Prism so you can see exactly what the LLM did.</p>
        </div>
        <div style={{ borderRadius: 10, overflow: "hidden", position: "relative", height: 380 }}>
          <video autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} src="/video4.mp4" />
        </div>
      </section>

      {/* Closing */}
      <section style={{ position: "relative", height: 480, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <video autoPlay muted loop playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }} src="/video6.mp4" />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(12,12,14,0.4) 0%, rgba(12,12,14,0.9) 100%)" }} />
        <div style={{ position: "relative", textAlign: "center" }}>
          <div style={{ fontSize: 52, fontWeight: 700, color: "var(--text-1)", marginBottom: 16 }}>Prism</div>
          <p style={{ fontSize: 16, color: "var(--text-2)" }}>Open source LLM observability. Self-host in minutes.</p>
          <Link href="/traces" style={{ display: "inline-flex", marginTop: 24, height: 48, padding: "0 24px", fontSize: 15, fontWeight: 500, borderRadius: 8, background: "var(--indigo)", color: "white", alignItems: "center", textDecoration: "none" }}>Open Dashboard →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--line)", padding: "40px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-1)" }}>Prism</div>
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>MIT License · Built with ♥ using Anthropic Claude</div>
      </footer>
    </>
  )
}
