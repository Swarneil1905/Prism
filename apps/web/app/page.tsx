"use client"
import { useEffect } from "react"

const CSS = `
:root{
  --bg:#0C0C0E;--surface:#141416;--surface-raised:#1C1C1F;
  --indigo:#6C63FF;--indigo-hover:#7B73FF;
  --text-1:#F2F1EE;--text-2:#8A8884;--text-3:#4A4946;
  --line:rgba(255,255,255,0.06);--green:#34C97A;--red:#F04A4A;
}
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--text-1);-webkit-font-smoothing:antialiased;overflow-x:hidden;line-height:1.5;}
a{color:inherit;text-decoration:none;}
button{font-family:inherit;cursor:pointer;border:none;background:none;}
ul{list-style:none;}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace;}
.nav{position:fixed;top:0;left:0;right:0;z-index:100;height:64px;padding:0 48px;display:flex;align-items:center;justify-content:space-between;background:transparent;border-bottom:1px solid transparent;transition:background 300ms ease,border-color 300ms ease;}
.nav.scrolled{background:rgba(12,12,14,0.92);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--line);}
.wordmark{font-size:17px;font-weight:700;color:#fff;letter-spacing:-0.01em;}
.nav-links{display:flex;align-items:center;gap:30px;position:absolute;left:50%;transform:translateX(-50%);}
.nav-links a{font-size:14px;color:var(--text-2);transition:color 200ms ease;}
.nav-links a:hover{color:var(--text-1);}
.nav-actions{display:flex;align-items:center;gap:12px;}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:500;white-space:nowrap;transition:background 200ms ease,border-color 200ms ease,color 200ms ease;}
.btn-google{height:36px;padding:0 16px;font-size:13px;border-radius:999px;border:1px solid rgba(255,255,255,0.15);color:#fff;background:transparent;}
.btn-google:hover{border-color:rgba(255,255,255,0.30);}
.btn-getstarted{height:36px;padding:0 20px;font-size:13px;border-radius:999px;background:var(--indigo);color:#fff;}
.btn-getstarted:hover{background:var(--indigo-hover);}
.hero{position:relative;min-height:100vh;overflow:hidden;}
.hero-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;}
.hero-tint{position:absolute;inset:0;z-index:1;background:rgba(12,12,14,0.75);}
.hero-bloom{position:absolute;inset:0;z-index:1;background:radial-gradient(ellipse 1000px 600px at 50% 35%,rgba(108,99,255,0.08) 0%,transparent 70%);}
.hero-inner{position:relative;z-index:2;text-align:center;padding:180px 24px 80px;display:flex;flex-direction:column;align-items:center;}
.badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);border-radius:999px;padding:6px 14px;font-size:11px;font-weight:500;color:var(--text-2);}
.badge .dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:pulse 1.8s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
.hero h1{font-size:clamp(40px,5.5vw,68px);font-weight:700;letter-spacing:-0.025em;line-height:1.12;color:var(--text-1);max-width:800px;margin:24px auto 0;}
.hero h1 .accent{color:var(--indigo);}
.hero-sub{font-weight:300;font-size:18px;line-height:1.7;color:var(--text-2);max-width:520px;margin:20px auto 0;}
.cta-row{display:flex;justify-content:center;gap:12px;margin-top:40px;}
.btn-primary{height:48px;padding:0 28px;font-size:15px;border-radius:8px;background:var(--indigo);color:#fff;}
.btn-primary:hover{background:var(--indigo-hover);}
.btn-secondary{height:48px;padding:0 28px;font-size:15px;border-radius:8px;background:transparent;color:var(--text-1);border:1px solid rgba(255,255,255,0.15);}
.btn-secondary:hover{background:rgba(255,255,255,0.05);}
.cta-fine{font-size:12px;color:var(--text-3);margin-top:16px;}
.showcase{max-width:960px;margin:80px auto 0;padding:0 24px;position:relative;z-index:2;}
.window{background:var(--surface);border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;box-shadow:0 0 80px rgba(108,99,255,0.08),0 32px 64px rgba(0,0,0,0.6);}
.win-bar{height:36px;background:var(--surface-raised);display:flex;align-items:center;padding:0 12px;gap:12px;}
.win-dots{display:flex;gap:8px;}
.win-dots span{width:10px;height:10px;border-radius:50%;display:block;}
.d-r{background:#FF5F57;}.d-y{background:#FEBC2E;}.d-g{background:#28C840;}
.win-url{width:200px;height:18px;border-radius:4px;background:rgba(255,255,255,0.06);margin:0 auto;}
.t-header,.t-row{display:grid;grid-template-columns:120px 1fr 60px 80px 80px 80px;align-items:center;padding:0 20px;}
.t-header{height:36px;background:#1A1A1C;}
.t-header span{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-3);}
.t-row{height:44px;border-bottom:1px solid rgba(255,255,255,0.04);transition:background 150ms ease;opacity:0;transform:translateY(8px);}
.t-row:hover{background:rgba(255,255,255,0.02);}
.t-row.in{opacity:1;transform:translateY(0);transition:opacity 280ms ease-out,transform 280ms ease-out;}
.c-id{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-2);}
.c-query{font-size:13px;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:12px;}
.c-spans{font-size:12px;font-weight:500;color:var(--text-2);text-align:center;}
.c-cost,.c-lat{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-2);}
.status{display:inline-flex;align-items:center;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase;padding:3px 8px;justify-self:start;}
.status.pass{background:rgba(52,201,122,0.12);color:var(--green);}
.status.fail{background:rgba(240,74,74,0.12);color:var(--red);}
.feature{padding:100px 48px;}
.feature-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;gap:80px;}
.feature-inner.reverse{flex-direction:row-reverse;}
.col{flex:1;min-width:0;}
.eyebrow{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--indigo);margin-bottom:16px;}
.feature h2{font-size:32px;font-weight:600;color:var(--text-1);line-height:1.25;margin-bottom:16px;letter-spacing:-0.01em;}
.feature .body{font-size:16px;line-height:1.7;color:var(--text-2);max-width:440px;margin-bottom:24px;}
.points{display:flex;flex-direction:column;gap:10px;}
.points li{display:flex;align-items:center;gap:10px;font-size:14px;color:var(--text-2);}
.points li::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--indigo);flex-shrink:0;}
.mock{background:var(--surface);border:1px solid rgba(255,255,255,0.08);border-radius:10px;overflow:hidden;}
.mock.reveal{opacity:0;transform:translateY(32px);transition:opacity 500ms ease,transform 500ms ease;}
.mock.reveal.in{opacity:1;transform:translateY(0);}
.video-mock{position:relative;height:380px;}
.video-mock video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}
.video-mock-overlay{position:absolute;inset:0;background:rgba(12,12,14,0.15);}
.waterfall{height:460px;padding:28px 24px;display:flex;flex-direction:column;}
.wf-title{font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-3);margin-bottom:24px;}
.wf-rows{display:flex;flex-direction:column;gap:22px;flex:1;}
.wf-row{display:grid;grid-template-columns:1fr;gap:8px;}
.wf-meta{display:flex;align-items:center;justify-content:space-between;}
.wf-label{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-2);}
.wf-dur{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-2);}
.wf-track{position:relative;height:28px;background:rgba(255,255,255,0.03);border-radius:4px;}
.wf-bar{position:absolute;top:0;height:28px;border-radius:4px;}
.wf-stats{display:flex;gap:12px;margin-top:24px;}
.chip{background:var(--surface-raised);border-radius:6px;padding:8px 14px;}
.chip .label{font-size:11px;color:var(--text-2);}
.chip .value{font-size:13px;font-weight:500;color:#fff;}
.eval{height:420px;padding:24px;display:flex;flex-direction:column;}
.eval-stats{display:flex;gap:48px;margin-bottom:24px;}
.eval-stat .label{font-size:11px;color:var(--text-2);margin-bottom:4px;}
.eval-stat .num{font-size:40px;font-weight:700;line-height:1;}
.eval-stat .num.green{color:var(--green);}
.eval-stat .num.white{color:var(--text-1);}
.eval-chart{margin-bottom:8px;}
.eval-chart svg{display:block;width:100%;height:80px;}
.chart-x{display:flex;justify-content:space-between;font-size:10px;color:var(--text-3);margin-bottom:20px;}
.eval-fail{background:rgba(240,74,74,0.06);border-left:3px solid var(--red);border-radius:4px;padding:12px 14px;}
.eval-fail .q{font-size:13px;color:var(--text-1);}
.eval-fail .note{font-size:12px;color:var(--text-2);margin-top:6px;line-height:1.5;}
.eval-fail .acts{display:flex;gap:8px;margin-top:12px;}
.eval-fail .acts button{height:28px;padding:0 12px;font-size:11px;font-weight:500;border-radius:5px;}
.btn-fail{background:transparent;border:1px solid rgba(240,74,74,0.4);color:var(--red);}
.btn-override{background:transparent;border:1px solid rgba(255,255,255,0.15);color:var(--text-2);}
.closing{position:relative;height:480px;overflow:hidden;display:flex;align-items:center;justify-content:center;}
.closing-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;}
.closing-overlay{position:absolute;inset:0;z-index:1;background:radial-gradient(ellipse at center,rgba(12,12,14,0.3) 0%,rgba(12,12,14,0.88) 100%);}
.closing-content{position:relative;z-index:2;text-align:center;display:flex;flex-direction:column;align-items:center;}
.closing-content .mark{font-size:52px;font-weight:700;color:#fff;letter-spacing:-0.02em;}
.closing-content .tag{font-size:20px;font-weight:300;color:rgba(242,241,238,0.65);margin-top:14px;}
.closing-content .cta-row{margin-top:32px;}
.footer{background:#0A0A0C;border-top:1px solid var(--line);padding:60px 48px 40px;}
.footer-cols{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:40px;}
.footer-col h4{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-1);margin-bottom:16px;}
.footer-col a{display:block;font-size:14px;color:var(--text-2);line-height:2;transition:color 200ms ease;}
.footer-col a:hover{color:var(--text-1);}
.footer-bottom{max-width:1200px;margin:40px auto 0;padding-top:32px;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;}
.footer-bottom .mark{font-size:14px;font-weight:700;color:#fff;}
.footer-bottom .colophon{font-size:12px;color:var(--text-3);}
.fade-in{opacity:0;transform:translateY(24px);transition:opacity 400ms ease,transform 400ms ease;}
.fade-in.in{opacity:1;transform:translateY(0);}
@media(max-width:1024px){.nav-links{display:none;}}
@media(max-width:900px){.nav{padding:0 24px;}.feature{padding:72px 24px;}.feature-inner,.feature-inner.reverse{flex-direction:column;gap:40px;}.footer-cols{grid-template-columns:repeat(2,1fr);}.footer-bottom{flex-direction:column;gap:14px;align-items:flex-start;}}
@media(max-width:560px){.nav-actions .btn-google{display:none;}.cta-row{flex-direction:column;width:100%;max-width:280px;}.cta-row .btn{width:100%;}}
`

export default function LandingPage() {
  useEffect(() => {
    // Nav scroll
    const nav = document.getElementById("nav")!
    const update = () => nav.classList.toggle("scrolled", window.scrollY > 60)
    window.addEventListener("scroll", update, { passive: true })
    update()

    // Trace table rows
    const body = document.getElementById("traceBody")!
    const rows: [string, string, string, string, string, boolean][] = [
      ["3fa8c2e1","What was avg delivery time in Q1?","3","$0.0041","1,240ms",true],
      ["7b12d9a4","Show top 10 customers by revenue","2","$0.0029","890ms",true],
      ["1e94f733","Monthly active users last 6 months","4","$0.0078","2,110ms",false],
      ["9c3a1b52","Orders placed after 9pm by region","3","$0.0044","1,380ms",true],
      ["4d87e290","Products with less than 5 in stock","2","$0.0031","760ms",true],
      ["2f61c8da","Revenue breakdown by category YTD","5","$0.0093","2,840ms",true],
      ["8a45b1f7","Churn rate by acquisition channel","3","$0.0057","1,620ms",false],
      ["6e20d4c3","Average order value this quarter","2","$0.0036","950ms",true],
    ]
    const freshPool: [string, string, string, string, string, boolean][] = [
      ["b4f29e01","Refund volume by week this quarter","3","$0.0048","1,120ms",true],
      ["a91c7d35","Top regions by signups yesterday","2","$0.0027","840ms",true],
      ["c52e8a90","Cart abandonment rate by device","4","$0.0066","1,910ms",false],
      ["d18b3f74","Net revenue retention by cohort","5","$0.0102","2,480ms",true],
      ["e73a0c12","Support tickets per active user","2","$0.0033","780ms",true],
      ["f29d6b48","Avg session length by plan tier","3","$0.0051","1,340ms",true],
    ]

    function rowEl(d: [string, string, string, string, string, boolean]) {
      const el = document.createElement("div")
      el.className = "t-row"
      el.innerHTML = `<span class="c-id">${d[0]}</span><span class="c-query">${d[1]}</span><span class="c-spans">${d[2]}</span><span class="c-cost">${d[3]}</span><span class="c-lat">${d[4]}</span><span><span class="status ${d[5]?"pass":"fail"}">${d[5]?"pass":"fail"}</span></span>`
      return el
    }

    rows.forEach((d, i) => {
      const el = rowEl(d)
      body.appendChild(el)
      setTimeout(() => el.classList.add("in"), i * 120)
    })

    let fi = 0
    const liveUpdate = () => {
      const d = freshPool[fi % freshPool.length]; fi++
      const el = rowEl(d)
      body.insertBefore(el, body.firstChild)
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("in")))
      while (body.children.length > 8) body.removeChild(body.lastChild!)
    }
    const liveTimer = setTimeout(() => { liveUpdate(); const iv = setInterval(liveUpdate, 4000); return () => clearInterval(iv) }, rows.length * 120 + 3000)

    // Reveal mocks
    const moIO = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); moIO.unobserve(e.target) } })
    }, { threshold: 0.2 })
    document.querySelectorAll(".mock.reveal").forEach((m) => moIO.observe(m))

    // Fade-ins
    const fiIO = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); fiIO.unobserve(e.target) } })
    }, { threshold: 0.15 })
    document.querySelectorAll(".fade-in").forEach((f) => fiIO.observe(f))

    return () => {
      window.removeEventListener("scroll", update)
      clearTimeout(liveTimer)
      moIO.disconnect()
      fiIO.disconnect()
    }
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <nav className="nav" id="nav">
        <a className="wordmark" href="#">Prism</a>
        <div className="nav-links">
          <a href="#traces">Product</a>
          <a href="#">Docs</a>
          <a href="#">GitHub</a>
          <a href="#">Pricing</a>
        </div>
        <div className="nav-actions">
          <button className="btn btn-google">
            <svg width="16" height="16" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.95 10.7a5.4 5.4 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.07l2.99-2.33z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l2.99 2.32C4.66 5.17 6.65 3.58 9 3.58z"/>
            </svg>
            Sign in with Google
          </button>
          <button className="btn btn-getstarted">Get Started</button>
        </div>
      </nav>

      <header className="hero">
        <video className="hero-video" src="/video1.mp4" autoPlay muted loop playsInline />
        <div className="hero-tint" />
        <div className="hero-bloom" />
        <div className="hero-inner">
          <div className="badge"><span className="dot" />Open source · Self-hostable</div>
          <h1>Every LLM call,<br /><span className="accent">measured</span> and understood.</h1>
          <p className="hero-sub">Prism traces every LLM call inside your application, groups them into workflows, scores them with an AI judge, and shows you exactly what went wrong — and what it cost.</p>
          <div className="cta-row">
            <button className="btn btn-primary">Start for free</button>
            <button className="btn btn-secondary">View on GitHub</button>
          </div>
          <p className="cta-fine">No credit card required. Docker Compose setup in under 5 minutes.</p>
        </div>
        <div className="showcase">
          <div className="window">
            <div className="win-bar">
              <div className="win-dots"><span className="d-r" /><span className="d-y" /><span className="d-g" /></div>
              <div className="win-url" />
            </div>
            <div className="t-header">
              <span>Trace ID</span><span>Query</span><span style={{textAlign:"center"}}>Spans</span><span>Cost</span><span>Latency</span><span>Status</span>
            </div>
            <div id="traceBody" />
          </div>
        </div>
      </header>

      <section className="feature" id="traces">
        <div className="feature-inner">
          <div className="col">
            <p className="eyebrow fade-in">Traces</p>
            <h2 className="fade-in">See what actually happened.</h2>
            <p className="body fade-in">Every workflow trace shows you the full span waterfall — which step was slow, which LLM call was expensive, and how many retries your agent took.</p>
            <ul className="points fade-in">
              <li>Span waterfall grouped by workflow</li>
              <li>Cost breakdown per model and per step</li>
              <li>Retry count and failure chain visibility</li>
            </ul>
          </div>
          <div className="col">
            <div className="mock reveal">
              <div className="waterfall">
                <div className="wf-title">Span waterfall</div>
                <div className="wf-rows">
                  <div className="wf-row">
                    <div className="wf-meta"><span className="wf-label">Schema introspection</span><span className="wf-dur">180ms</span></div>
                    <div className="wf-track"><span className="wf-bar" style={{left:0,width:"15%",background:"rgba(74,156,240,0.4)"}} /></div>
                  </div>
                  <div className="wf-row">
                    <div className="wf-meta"><span className="wf-label">SQL generation (claude-haiku)</span><span className="wf-dur">980ms</span></div>
                    <div className="wf-track"><span className="wf-bar" style={{left:"15%",width:"55%",background:"rgba(108,99,255,0.5)"}} /></div>
                  </div>
                  <div className="wf-row">
                    <div className="wf-meta"><span className="wf-label">SQL validation + retry</span><span className="wf-dur">440ms</span></div>
                    <div className="wf-track"><span className="wf-bar" style={{left:"70%",width:"30%",background:"rgba(108,99,255,0.3)"}} /></div>
                  </div>
                </div>
                <div className="wf-stats">
                  <div className="chip"><div className="label">Total cost</div><div className="value">$0.0071</div></div>
                  <div className="chip"><div className="label">Total time</div><div className="value">1,600ms</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="feature">
        <div className="feature-inner reverse">
          <div className="col">
            <p className="eyebrow fade-in">Evals</p>
            <h2 className="fade-in">Know if it actually worked.</h2>
            <p className="body fade-in">A judge model scores every query result automatically. Pass rate trends over time, failure cluster analysis, and human override — all without manual review.</p>
            <ul className="points fade-in">
              <li>Automated LLM-as-judge scoring</li>
              <li>Pass rate trend over 7 days</li>
              <li>Human label override per query</li>
            </ul>
          </div>
          <div className="col">
            <div className="mock reveal">
              <div className="eval">
                <div className="eval-stats">
                  <div className="eval-stat"><div className="label">Pass Rate</div><div className="num green">89%</div></div>
                  <div className="eval-stat"><div className="label">Avg Score</div><div className="num white">0.91</div></div>
                </div>
                <div className="eval-chart">
                  <svg viewBox="0 0 320 80" preserveAspectRatio="none">
                    <polyline points="10,59.2 60,48.96 110,66.88 160,31.04 210,23.36 260,18.24 310,13.12" fill="none" stroke="#6C63FF" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                    {[[10,59.2],[60,48.96],[110,66.88],[160,31.04],[210,23.36],[260,18.24],[310,13.12]].map(([cx,cy],i) => (
                      <circle key={i} cx={cx} cy={cy} r={3} fill="#6C63FF" />
                    ))}
                  </svg>
                </div>
                <div className="chart-x"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
                <div className="eval-fail">
                  <div className="q">Churn rate by acquisition channel</div>
                  <div className="note">SQL joins acquisition_source incorrectly — missing WHERE clause filter.</div>
                  <div className="acts">
                    <button className="btn-fail">Confirm Fail</button>
                    <button className="btn-override">Override Pass</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="feature">
        <div className="feature-inner">
          <div className="col">
            <p className="eyebrow fade-in">SQL Explorer</p>
            <h2 className="fade-in">Ask your data anything.</h2>
            <p className="body fade-in">Prism ships with a built-in NL2SQL interface over your database. Every query you run is traced, scored, and visible in the dashboard automatically.</p>
            <ul className="points fade-in">
              <li>Natural language to SQL in one step</li>
              <li>Generated SQL shown with syntax highlighting</li>
              <li>Every query traced and scored automatically</li>
            </ul>
          </div>
          <div className="col">
            <div className="mock reveal video-mock">
              <video src="/video4.mp4" autoPlay muted loop playsInline />
              <div className="video-mock-overlay" />
            </div>
          </div>
        </div>
      </section>

      <section className="closing">
        <video className="closing-video" src="/video6.mp4" autoPlay muted loop playsInline />
        <div className="closing-overlay" />
        <div className="closing-content">
          <div className="mark">Prism</div>
          <div className="tag">Every LLM call, measured and understood.</div>
          <div className="cta-row">
            <button className="btn btn-primary">Start for free</button>
            <button className="btn btn-secondary">View on GitHub</button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-cols">
          <div className="footer-col fade-in"><h4>Product</h4><a href="#">Traces</a><a href="#">Evals</a><a href="#">Prompts</a><a href="#">SQL Explorer</a><a href="#">Docs</a></div>
          <div className="footer-col fade-in"><h4>Company</h4><a href="#">About</a><a href="#">GitHub</a><a href="#">Changelog</a><a href="#">Roadmap</a></div>
          <div className="footer-col fade-in"><h4>Resources</h4><a href="#">Self-hosting guide</a><a href="#">SDK reference</a><a href="#">Architecture</a><a href="#">Contributing</a></div>
          <div className="footer-col fade-in"><h4>Legal</h4><a href="#">MIT License</a><a href="#">Privacy</a><a href="#">Terms</a></div>
        </div>
        <div className="footer-bottom">
          <span className="mark">Prism</span>
          <span className="colophon">Built with Postgres, FastAPI, and Next.js. Open source under MIT.</span>
        </div>
      </footer>
    </>
  )
}
