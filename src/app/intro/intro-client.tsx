'use client'

import Link from 'next/link'
import { PatternBackground } from '@/components/ui/pattern-background'

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Secure Vaults',
    desc: 'Audited smart contracts with institutional-grade multi-sig controls.',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    title: 'Real Yield',
    desc: 'Sustainable USDC returns sourced directly from industrial Bitcoin mining.',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    title: 'Transparent',
    desc: 'On-chain proof of reserves paired with independent monthly audits.',
  },
]

export function IntroClient() {
  return (
    <PatternBackground 
      className="text-(--color-text-primary) font-sans selection:bg-(--color-accent-subtle) selection:text-(--color-accent)" 
      data-theme="dark"
    >
      {/* Background radial glow using design system accent color */}
      <div 
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] blur-[120px] rounded-full pointer-events-none -z-10" 
        style={{ background: 'var(--color-accent-dim)' }}
      />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-(--color-border-subtle) backdrop-blur-xl sticky top-0 z-(--z-sticky)">
        <Link href="/" className="flex items-center group transition-opacity hover:opacity-80">
          <img src="/logos/hearst.svg" alt="Hearst" className="h-7 w-auto" />
        </Link>
        <Link 
          href="/" 
          className="text-(--color-text-secondary) text-sm font-medium hover:text-(--color-text-primary) transition-[color] duration-(--transition-base)"
        >
          ← Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24 w-full max-w-6xl mx-auto gap-16 relative z-(--z-base)">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center">
          <img 
            src="/logos/hearst-connect-blackbg.svg" 
            alt="Hearst Connect" 
            className="h-20 md:h-28 w-auto mb-6 drop-shadow-md"
          />

          <p 
            className="text-lg md:text-xl mb-10 max-w-2xl font-light"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}
          >
            Access real yield from industrial Bitcoin mining operations. <br className="hidden md:block"/>
            USDC vaults on Base with institutional-grade controls.
          </p>

          <div className="flex flex-col items-center gap-4">
            <Link
              href="/app"
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-md font-semibold uppercase text-sm transition-all overflow-hidden"
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-accent-text)',
                boxShadow: 'var(--shadow-glow)',
                letterSpacing: 'var(--tracking-wide)',
                transitionDuration: 'var(--transition-base)'
              }}
            >
              {/* Hover effect overlay */}
              <div 
                className="absolute inset-0 translate-y-full group-hover:translate-y-0 ease-out" 
                style={{ background: 'rgba(255,255,255,0.2)', transitionDuration: 'var(--transition-base)' }}
              />
              
              <span className="relative z-10">Enter Platform</span>
              <svg
                className="w-4 h-4 relative z-10 group-hover:translate-x-1"
                style={{ transitionDuration: 'var(--transition-base)' }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <p 
              className="text-xs"
              style={{ color: 'var(--color-text-tertiary)', letterSpacing: 'var(--tracking-normal)' }}
            >
              Connect your wallet to view available vaults
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-12 relative z-10">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className="group relative p-8 rounded-2xl flex flex-col gap-6 overflow-hidden backdrop-blur-xl hover:-translate-y-1"
              style={{
                background: 'linear-gradient(180deg, rgba(20, 20, 20, 0.6) 0%, rgba(5, 5, 5, 0.8) 100%)',
                border: '1px solid var(--color-border-subtle)',
                boxShadow: 'var(--shadow-md)',
                transition: 'all var(--transition-slow)',
              }}
            >
              {/* Animated top border glow on hover */}
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ 
                  background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)', 
                  transitionDuration: 'var(--transition-slow)' 
                }}
              />

              {/* Radial spotlight inside the card on hover */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
                style={{
                  background: 'radial-gradient(circle at 50% 0%, var(--color-accent-dim), transparent 70%)',
                  transitionDuration: 'var(--transition-slow)'
                }}
              />

              <div 
                className="p-4 rounded-xl w-fit relative z-10 shadow-inner"
                style={{
                  color: 'var(--color-accent)',
                  background: 'linear-gradient(135deg, rgba(167, 251, 144, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <div className="group-hover:scale-110 group-hover:rotate-6 transition-transform" style={{ transitionDuration: 'var(--transition-base)' }}>
                  {feature.icon}
                </div>
              </div>
              
              <div className="flex flex-col gap-3 relative z-10 mt-2">
                <h3 
                  className="text-base font-bold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {feature.title}
                </h3>
                <p 
                  className="text-sm font-light"
                  style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)' }}
                >
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t backdrop-blur-md text-center mt-auto relative z-(--z-base)"
              style={{ borderColor: 'var(--color-border-subtle)', background: 'color-mix(in srgb, var(--color-bg-primary) 50%, transparent)' }}>
        <p 
          className="text-xs"
          style={{ color: 'var(--color-text-tertiary)', letterSpacing: 'var(--tracking-normal)' }}
        >
          © 2026 Hearst. Audited smart contracts on Base.
        </p>
      </footer>
    </PatternBackground>
  )
}
