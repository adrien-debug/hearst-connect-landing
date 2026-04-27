'use client';

import '@/styles/marketing/hub-font.css';
import '@/styles/marketing/hub.css';
import '@/styles/marketing/intro.css';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { NAV_LINKS, CTA_LINKS, HUB_MAILTO_SALES, HEARST_EMAIL } from '@/config/navigation';

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/** Crossfade premier plan → seconde capture dans la tablette. */
function updateTabletScrollBlend(layers: HTMLElement): void {
  const section2 = document.getElementById('feature-agents');
  if (!section2) return;

  const r = section2.getBoundingClientRect();
  const vh = window.innerHeight;
  
  // Le fondu commence quand l'article "Transparent reporting" entre dans le bas de l'écran (85% vh)
  // Et se termine quand il arrive vers le milieu (45% vh)
  const startFade = vh * 0.85;
  const endFade = vh * 0.45;
  
  let t = (startFade - r.top) / Math.max(startFade - endFade, 1);
  t = Math.max(0, Math.min(1, t));
  
  // Ease-in-out
  const s = t * t * (3 - 2 * t);
  layers.style.setProperty('--tablet-front-opacity', (1 - s).toFixed(4));
}

/** Scroll-driven fade + parallax for `.hub-chapter` nodes (reliable vs CSS view timelines). */
function updateHubChapterStyles(scope: HTMLElement): void {
  const nodes = scope.querySelectorAll<HTMLElement>('.hub-chapter');
  const vh = window.innerHeight;
  const midY = vh * 0.5;
  const falloff = Math.max(vh * 0.48, 280);

  nodes.forEach(el => {
    const r = el.getBoundingClientRect();
    const margin = 48;
    const inFinalCta = el.closest('#beforeyougo') !== null;
    if (r.bottom < -margin || r.top > vh + margin) {
      el.style.setProperty('--hub-ch-opacity', '0');
      el.style.setProperty('--hub-ch-ty', r.bottom < midY ? '-32px' : '40px');
      return;
    }
    const center = r.top + r.height / 2;
    const dist = Math.abs(center - midY);
    const opacity = Math.max(0, Math.min(1, 1 - dist / falloff));
    const ty = (center - midY) * -0.11;
    let tyClamped = Math.max(-44, Math.min(44, ty));
    /* Final CTA: never translate upward; negative ty clips the top under section overflow */
    if (inFinalCta) {
      tyClamped = Math.max(0, tyClamped);
    }
    el.style.setProperty('--hub-ch-opacity', opacity.toFixed(4));
    el.style.setProperty('--hub-ch-ty', `${tyClamped.toFixed(2)}px`);
  });
}


const FEATURE_PILLARS = [
  {
    id: 'feature-unified',
    title: 'Real infrastructure',
    desc: 'USDC exposure to industrial Bitcoin mining: real hashrate, real operations, institutional controls.',
  },
  {
    id: 'feature-agents',
    title: 'Transparent reporting',
    desc: 'Monthly distributions, on-chain proof of reserves, and third-party audits. No black boxes.',
  },
  {
    id: 'feature-orchestration',
    title: 'Institutional controls',
    desc: 'Multi-signature governance, audited contracts, and custody built for serious allocators.',
  },
] as const;

/** HB monogram (matches brand mark in `public/logos/hearst-logo.svg`). */
function HearstMonogram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="572 466 130 144" width={36} height={40} aria-hidden focusable="false">
      <polygon fill="currentColor" points="601.7 466.9 572.6 466.9 572.6 609.7 601.7 609.7 601.7 549.1 633.1 579.4 665.8 579.4 601.7 517.5 601.7 466.9" />
      <polygon fill="currentColor" points="672.7 466.9 672.7 528.1 644.6 500.9 612 500.9 672.7 559.7 672.7 609.7 701.9 609.7 701.9 466.9 672.7 466.9" />
    </svg>
  );
}

const VAULT_PRODUCT_SLIDES = [
  {
    id: 'hashvault-prime',
    brandLine: 'Hearst Premier',
    variant: 'prime' as const,
    productName: 'HashVault Prime',
    bgVideo: '/videos/bg-prime.mp4',
    apy: '12% APY',
    tagline: 'Stable yield, engineered for consistency.',
    description:
      'Mining-backed cashflow, stablecoin income, and hedged BTC exposure combine to smooth volatility and deliver daily yield until 36% target or maturity.',
    lock: '3 years',
    minDeposit: '$500,000',
    risk: 'Moderate',
  },
  {
    id: 'hashvault-growth',
    brandLine: 'Hearst Growth',
    variant: 'growth' as const,
    productName: 'HashVault Growth',
    bgVideo: '/videos/bg-growth.mp4',
    apy: '15% APY',
    tagline: 'Bitcoin upside, supported by mining yield.',
    description:
      'Spot BTC captures upside while mining cashflow cushions drawdowns, with dynamic allocation and daily yield until 45% target or maturity.',
    lock: '3 years',
    minDeposit: '$250,000',
    risk: 'Growth',
  },
] as const;

const ICONS = [
  { name: 'Bitcoin', src: '/icons/crypto/btc.png' },
  { name: 'Ethereum', src: '/icons/crypto/eth.png' },
  { name: 'Tether', src: '/icons/crypto/usdt.png' },
  { name: 'BNB', src: '/icons/crypto/bnb.png' },
  { name: 'Solana', src: '/icons/crypto/sol.png' },
  { name: 'XRP', src: '/icons/crypto/xrp.png' },
  { name: 'USDC', src: '/icons/crypto/usdc.png' },
  { name: 'Cardano', src: '/icons/crypto/ada.png' },
  { name: 'Avalanche', src: '/icons/crypto/avax.png' },
  { name: 'Dogecoin', src: '/icons/crypto/doge.png' },
  { name: 'TRON', src: '/icons/crypto/trx.png' },
  { name: 'Chainlink', src: '/icons/crypto/link.png' },
  { name: 'Polygon', src: '/icons/crypto/matic.png' },
  { name: 'Polkadot', src: '/icons/crypto/dot.png' },
] as const;

function useAutoCarousel(itemCount: number, intervalMs = 5000) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const scrollNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % itemCount);
  }, [itemCount]);

  const scrollPrev = useCallback(() => {
    setActiveIndex((current) => (current === 0 ? itemCount - 1 : current - 1));
  }, [itemCount]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(scrollNext, intervalMs);
    return () => clearInterval(timer);
  }, [isPaused, intervalMs, scrollNext]);

  return { activeIndex, setActiveIndex, isPaused, setIsPaused, scrollNext, scrollPrev };
}

export default function HubPageClient() {
  const { activeIndex, setActiveIndex, isPaused, setIsPaused, scrollNext, scrollPrev } = useAutoCarousel(VAULT_PRODUCT_SLIDES.length);

  const [isHeaderVisible, setIsHeaderVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show header once scrolled past the hero section (~60% of viewport)
      setIsHeaderVisible(window.scrollY > window.innerHeight * 0.6);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Force dark mode on landing — toggle désactivé sur cette page uniquement
  useEffect(() => {
    const root = document.documentElement
    const previous = root.getAttribute('data-theme')
    root.setAttribute('data-theme', 'dark')
    root.classList.add('dark')
    return () => {
      if (previous) root.setAttribute('data-theme', previous)
      else root.removeAttribute('data-theme')
    }
  }, [])

  useEffect(() => {
    const nav = document.getElementById('hub-site-nav');
    const menuToggle = document.getElementById('menu-checkbox') as HTMLInputElement | null;
    if (!nav || !menuToggle) return;
    const anchors = nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
    const closeMenu = (): void => {
      menuToggle.checked = false;
    };
    anchors.forEach(a => a.addEventListener('click', closeMenu));
    return () => anchors.forEach(a => a.removeEventListener('click', closeMenu));
  }, []);

  useEffect(() => {
    const scope = document.querySelector<HTMLElement>('.hub-font-scope');
    if (!scope) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      scope.querySelectorAll<HTMLElement>('.hub-chapter').forEach(el => {
        el.style.setProperty('--hub-ch-opacity', '1');
        el.style.setProperty('--hub-ch-ty', '0px');
      });
      scope.querySelector<HTMLElement>('.tablet-mockup-layers')?.style.setProperty('--tablet-front-opacity', '1');
    } else {
      let rafId = 0;
      const schedule = (): void => {
        if (rafId !== 0) return;
        rafId = window.requestAnimationFrame(() => {
          rafId = 0;
          updateHubChapterStyles(scope);
          const layers = scope.querySelector<HTMLElement>('.tablet-mockup-layers');
          if (layers) updateTabletScrollBlend(layers);
        });
      };
      updateHubChapterStyles(scope);
      const layers0 = scope.querySelector<HTMLElement>('.tablet-mockup-layers');
      if (layers0) updateTabletScrollBlend(layers0);
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      return () => {
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
        if (rafId !== 0) window.cancelAnimationFrame(rafId);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('paintWorklet' in CSS)) return;

    const $welcome = document.querySelector('#welcome') as HTMLElement | null;
    if (!$welcome) return;

    let isInteractive = false;
    let listenersBound = false;

    const onPointerMove = (e: PointerEvent): void => {
      if (!isInteractive) {
        $welcome.classList.add('interactive');
        isInteractive = true;
      }
      $welcome.style.setProperty('--ring-x', String((e.clientX / window.innerWidth) * 100));
      $welcome.style.setProperty('--ring-y', String((e.clientY / window.innerHeight) * 100));
      $welcome.style.setProperty('--ring-interactive', '1');
    };

    const onPointerLeave = (): void => {
      $welcome.classList.remove('interactive');
      isInteractive = false;
      $welcome.style.setProperty('--ring-x', '50');
      $welcome.style.setProperty('--ring-y', '50');
      $welcome.style.setProperty('--ring-interactive', '0');
    };

    let cancelled = false;

    void (async (): Promise<void> => {
      try {
        // Houdini paint worklet (see public/ringparticles.js)
        // @ts-expect-error CSS.paintWorklet is not in TS lib.dom for all targets
        await CSS.paintWorklet.addModule('/ringparticles.js');
      } catch (err) {
        console.warn('[hub] ring-particles paint worklet failed to load', err);
        return;
      }
      if (cancelled) return;
      $welcome.addEventListener('pointermove', onPointerMove);
      $welcome.addEventListener('pointerleave', onPointerLeave);
      listenersBound = true;
    })();

    return () => {
      cancelled = true;
      if (listenersBound) {
        $welcome.removeEventListener('pointermove', onPointerMove);
        $welcome.removeEventListener('pointerleave', onPointerLeave);
      }
    };
  }, []);

  return (
    <div className="hub-font-scope">
      {/* Header */}
      <div className={`header-wrapper ${isHeaderVisible ? 'is-visible' : ''}`}>
        <header>
          <a href="#" className="header-logo-link" aria-label="Hearst Connect">
            <Image src="/logos/hearst-connect.svg" alt="Hearst Connect" className="header-logo" width={160} height={42} style={{ height: 'auto' }} priority />
          </a>
          <input
            className="menu-checkbox"
            type="checkbox"
            id="menu-checkbox"
            aria-controls="hub-site-nav"
          />
          <label className="menu-button" htmlFor="menu-checkbox" lang="fr">
            <span className="not-sr-only" data-show-when="closed">
              <MenuIcon />
            </span>
            <span className="not-sr-only" data-show-when="open">
              <CloseIcon />
            </span>
            <span className="sr-only">Ouvrir ou fermer le menu de navigation</span>
          </label>

          <nav id="hub-site-nav" aria-label="Navigation principale" lang="fr">
            <ul>
              {NAV_LINKS.map(link => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <Link href={CTA_LINKS.launchApp.href} className="login-btn" prefetch>
            <span>{CTA_LINKS.launchApp.label}</span>
          </Link>
        </header>
      </div>

      {/* Welcome */}
      <section id="welcome" className="center" lang="en">
        <Image src="/logos/hearst-connect.svg" alt="Hearst Connect" className="welcome-logo" width={416} height={110} style={{ height: 'auto' }} priority />
        <h1 className="welcome-title hub-chapter">
          Turning bitcoin mining
          <br />
          into structured yield.
        </h1>
        <div className="hub-chapter" style={{ display: 'inline-flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href={CTA_LINKS.launchApp.href} className="welcome-btn" prefetch>
            <span>{CTA_LINKS.launchApp.label}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ marginLeft: '4px' }}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href={CTA_LINKS.viewDemo.href}
            className="welcome-btn"
            prefetch
            style={{
              background: 'transparent',
              border: '1px solid currentColor',
            }}
          >
            <span>{CTA_LINKS.viewDemo.label}</span>
          </Link>
        </div>
      </section>

      {/* Intro */}
      <section id="intro" className="theme-light" lang="en">
        <div className="hub-section-lead">
          <h2 className="typewriter">
            <span className="hub-lead-accent">Hearst</span> — Institutional Mining Yield
          </h2>
          <p className="hub-lead-subtitle">
            Qualified investors gain direct exposure to industrial mining cash flows.
            USDC vaults backed by regulated infrastructure and clear reporting.
          </p>
        </div>

        <div className="icons">
          {/* icons-marquee-strip : conteneur animé, 3 copies pour boucle seamless */}
          <div className="icons-marquee-strip">
            {[0, 1, 2].map((copy) => (
              <div key={copy} className="icons-track" aria-hidden={copy > 0}>
                {ICONS.map((icon, i) => (
                  <div key={`${icon.name}-${copy}-${i}`} className="icon">
                    <Image
                      src={icon.src}
                      alt={copy === 0 ? icon.name : ''}
                      className="icon-img"
                      width={56}
                      height={56}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features-section" aria-label="Why Hearst, three pillars" lang="en">
        <div id="features">
          <div className="features-text">
            {FEATURE_PILLARS.map(feature => (
              <article
                key={feature.id}
                id={feature.id}
                className="feature-block feature-pillar"
              >
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </article>
            ))}
          </div>
          <div className="features-tablet">
            <div className="tablet-mockup">
              <div className="tablet-mockup-layers">
                <div className="tablet-mockup-stack-inner">
                  <video
                    src="/marketing/area.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="tablet-layer tablet-layer--video"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section id="developers" className="theme-light">
        <div className="hub-section-head" lang="en">
          <h2>Investment strategies</h2>
          <p className="intro">
            Two vault profiles. Pick the risk and return fit.
          </p>
        </div>

        <div
          className="hub-carousel-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <div
            className="hub-carousel-auto-track"
            style={{ transform: `translateX(calc(-${activeIndex} * (var(--slide-width) + var(--slide-gap))))` }}
          >
            {VAULT_PRODUCT_SLIDES.map((slide, i) => (
              <article
                key={slide.id}
                className={`hub-carousel-auto-slide ${i === activeIndex ? 'is-active' : ''}`}
                aria-hidden={i !== activeIndex}
              >
                <div className="hub-slide-card">
                  <div className={`hub-vault-product-card hub-vault-product-card--${slide.variant}`}>
                    <div className="hub-vault-product-inner">
                      <div className="hub-vault-product-emblem" aria-hidden>
                        <span className="hub-vault-product-monogram">
                          <HearstMonogram />
                        </span>
                        <span className="hub-vault-product-line">{slide.brandLine}</span>
                      </div>
                      <h3 className="hub-vault-product-name">{slide.productName}</h3>
                      <p className="hub-vault-product-apy">{slide.apy}</p>
                      <p className="hub-vault-product-tagline">{slide.tagline}</p>
                      <p className="hub-vault-product-desc">{slide.description}</p>
                      <dl className="hub-vault-product-specs">
                        <div>
                          <dt>Lock</dt>
                          <dd>{slide.lock}</dd>
                        </div>
                        <div>
                          <dt>Min deposit</dt>
                          <dd>{slide.minDeposit}</dd>
                        </div>
                        <div>
                          <dt>Risk</dt>
                          <dd>{slide.risk}</dd>
                        </div>
                      </dl>
                      <a href={CTA_LINKS.viewOffering.href} className="hub-slide-cta hub-vault-product-cta">
                        <span>{CTA_LINKS.viewOffering.label}</span>
                        <svg className="hub-slide-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </a>
                    </div>
                    <div className="hub-vault-product-video-wrapper">
                      <video
                        src={slide.bgVideo}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="hub-vault-product-bg-video"
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            className="hub-carousel-arrow hub-carousel-arrow-prev"
            onClick={scrollPrev}
            aria-label="Previous slide"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            className="hub-carousel-arrow hub-carousel-arrow-next"
            onClick={scrollNext}
            aria-label="Next slide"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <div className="hub-carousel-auto-indicators">
            {VAULT_PRODUCT_SLIDES.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                className={`hub-carousel-auto-indicator ${i === activeIndex ? 'is-active' : ''}`}
                onClick={() => setActiveIndex(i)}
                aria-label={`${slide.productName}, slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Before You Go: outer card scroll-driven scale; inner hub-chapter parallax */}
      <section id="beforeyougo" lang="en">
        <div className="card dark hub-final-cta-card">
          <div className="hub-chapter hub-final-cta-content">
            <p>
              <span className="typewriter">Ready to allocate?</span>
            </p>
            <div className="buttons">
              <Link href={CTA_LINKS.launchApp.href} className="hub-cta-primary">
                {CTA_LINKS.launchApp.label}
              </Link>
              <a href={CTA_LINKS.contactSales.href} className="hub-cta-secondary">
                {CTA_LINKS.contactSales.label}
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="hub-footer" id="hub-footer" lang="fr">
        <div className="hub-footer-accent" aria-hidden />
        <div className="hub-footer-inner">
          <div className="hub-footer-brand">
            <Image
              src="/logos/hearst-connect.svg"
              alt="Hearst Connect"
              className="hub-footer-logo"
              width={120}
              height={32}
              style={{ height: 'auto' }}
              loading="lazy"
            />
            <p className="hub-footer-tagline" lang="en">
              Onchain access to industrial Bitcoin mining cash flows. Institutional controls,
              transparent reporting.
            </p>
          </div>
          <div className="hub-footer-grid">
            <div className="hub-footer-col">
              <p className="hub-footer-heading">Produit</p>
              <ul className="hub-footer-links">
                {NAV_LINKS.map(link => (
                  <li key={link.href}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hub-footer-col">
              <p className="hub-footer-heading">Accès</p>
              <ul className="hub-footer-links">
                <li>
                  <Link href={CTA_LINKS.launchApp.href} prefetch>
                    {CTA_LINKS.launchApp.label}
                  </Link>
                </li>
                <li>
                  <a href={CTA_LINKS.viewOffering.href}>Offre</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="hub-footer-bottom">
          <span className="hub-footer-copy">© {new Date().getFullYear()} Hearst</span>
          <a href={`mailto:${HEARST_EMAIL}`} className="hub-footer-mail">
            {HEARST_EMAIL}
          </a>
        </div>
      </footer>
    </div>
  );
}
