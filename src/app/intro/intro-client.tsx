'use client'

import Link from 'next/link'

export function IntroClient() {
  return (
    <div className="intro-shell" data-theme="dark">
      {/* ── Video background ── */}
      <video
        className="intro-video-bg"
        src="/intro-bg.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* ── Dark scrim over video ── */}
      <div className="intro-scrim" aria-hidden />

      {/* ── Header ── */}
      <header className="intro-header">
        <Link href="/" className="intro-logo-link">
          <img src="/logos/hearst.svg" alt="Hearst" className="intro-logo" />
        </Link>
        <Link href="/" className="intro-back">
          ← Back to Home
        </Link>
      </header>

      {/* ── Hero ── */}
      <main className="intro-main">
        <img
          src="/logos/hearst-connect-blackbg.svg"
          alt="Hearst Connect"
          className="intro-wordmark"
        />

        <p className="intro-subtitle">
          Access real yield from industrial Bitcoin mining operations.<br />
          USDC vaults on Base with institutional-grade controls.
        </p>

        <div className="intro-cta-group">
          <Link href="/app" className="intro-cta-primary">
            <span>Enter Platform</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <p className="intro-cta-hint">Connect your wallet to view available vaults</p>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="intro-footer">
        <p>© 2026 Hearst. Audited smart contracts on Base.</p>
      </footer>
    </div>
  )
}
