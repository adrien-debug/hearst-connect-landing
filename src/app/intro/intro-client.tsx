'use client'

import Link from 'next/link'

const PILLARS = [
  'Industrial mining yield',
  'Monthly USDC distributions',
  'Institutional controls',
  'On-chain proof of reserves',
  'Audited smart contracts',
]

export function IntroClient() {
  return (
    <div className="intro-shell" data-theme="dark">

      {/* ── Header — back link only ── */}
      <header className="intro-header">
        <Link href="/" className="intro-back">← Back to Home</Link>
      </header>

      {/* ── Split ── */}
      <main className="intro-main">

        {/* LEFT — wordmark + bullets + CTA */}
        <div className="intro-left">
          <img
            src="/logos/hearst-connect-blackbg.svg"
            alt="Hearst Connect"
            className="intro-wordmark"
          />

          <ul className="intro-pillars">
            {PILLARS.map((label) => (
              <li key={label} className="intro-pillar">
                <span className="intro-pillar-dot" aria-hidden />
                <strong className="intro-pillar-label">{label}</strong>
              </li>
            ))}
          </ul>

          <div className="intro-cta-group">
            <Link href="/app" className="intro-cta-primary">
              <span>Enter Platform</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* RIGHT — video card */}
        <div className="intro-right">
          <div className="intro-video-card">
            <video
              className="intro-video"
              src="/intro-bg.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
            {/* subtle inner vignette so edges blend */}
            <div className="intro-video-vignette" aria-hidden />
          </div>
        </div>

      </main>

      {/* ── Footer ── */}
      <footer className="intro-footer">
        <p>© 2026 Hearst · Audited smart contracts on Base</p>
      </footer>
    </div>
  )
}
