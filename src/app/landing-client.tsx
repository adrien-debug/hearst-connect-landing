'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { useEffect, useRef, useState, useCallback } from 'react';
import { NAV_LINKS, CTA_LINKS, HUB_MAILTO_SALES, HEARST_EMAIL } from '@/config/navigation';

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

const INVESTMENT_STRATEGY_SLIDES = [
  {
    img: '/platform-screenshot.svg',
    imgClass: 'slide-img-1',
    caption: 'Flagship — stable income',
    title: 'Hearst Prime Yield',
    desc: 'Target ~12% annual yield. $250K min, monthly USDC distributions, 3-year lock. Diversified mining income with volatility hedging for predictable returns.',
  },
  {
    img: '/platform-screenshot.svg',
    imgClass: 'slide-img-2',
    caption: 'Growth — BTC upside',
    title: 'Hearst Growth',
    desc: 'Target 16–22% annual yield. $250K min, monthly distributions, 3-year lock. Forward BTC mining exposure plus spot price upside with USDC buffer.',
  },
  {
    img: '/platform-screenshot.svg',
    imgClass: 'slide-img-3',
    caption: 'Yield mechanics',
    title: 'How yield is generated',
    desc: 'USDC is deployed into industrial mining operations. BTC rewards are converted via OTC desks. Net yield is distributed monthly, auditable end to end.',
  },
] as const;

/** Top ~14 crypto by market cap (typical ranking). Icons: spothq/cryptocurrency-icons via jsDelivr. */
const CRYPTO_ICON_BASE =
  'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@0.18.1/128/color';

const ICONS = [
  { name: 'Bitcoin', src: `${CRYPTO_ICON_BASE}/btc.png` },
  { name: 'Ethereum', src: `${CRYPTO_ICON_BASE}/eth.png` },
  { name: 'Tether', src: `${CRYPTO_ICON_BASE}/usdt.png` },
  { name: 'BNB', src: `${CRYPTO_ICON_BASE}/bnb.png` },
  { name: 'Solana', src: `${CRYPTO_ICON_BASE}/sol.png` },
  { name: 'XRP', src: `${CRYPTO_ICON_BASE}/xrp.png` },
  { name: 'USDC', src: `${CRYPTO_ICON_BASE}/usdc.png` },
  { name: 'Cardano', src: `${CRYPTO_ICON_BASE}/ada.png` },
  { name: 'Avalanche', src: `${CRYPTO_ICON_BASE}/avax.png` },
  { name: 'Dogecoin', src: `${CRYPTO_ICON_BASE}/doge.png` },
  { name: 'TRON', src: `${CRYPTO_ICON_BASE}/trx.png` },
  { name: 'Chainlink', src: `${CRYPTO_ICON_BASE}/link.png` },
  { name: 'Polygon', src: `${CRYPTO_ICON_BASE}/matic.png` },
  { name: 'Polkadot', src: `${CRYPTO_ICON_BASE}/dot.png` },
] as const;

function useInfiniteCarousel(itemCount: number) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const rafRef = useRef<number>(0);
  const scrollPosRef = useRef(0);

  const totalSlides = itemCount * 3; // Original + 2 clones for infinite loop

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const slideWidth = track.scrollWidth / 3;
    // Start in the middle set
    track.scrollLeft = slideWidth;
    scrollPosRef.current = slideWidth;

    let lastTime = performance.now();
    const speed = 0.6; // pixels per frame - smoother

    const tick = (time: number): void => {
      const delta = time - lastTime;
      lastTime = time;

      if (!isPaused && track.scrollWidth > track.clientWidth) {
        scrollPosRef.current += speed * (delta / 16);

        // Infinite loop logic
        const maxScroll = slideWidth * 2;
        const minScroll = slideWidth;

        if (scrollPosRef.current >= maxScroll - 1) {
          scrollPosRef.current = minScroll;
        }

        track.scrollLeft = scrollPosRef.current;

        // Update active index based on position
        const currentSlide = Math.floor((scrollPosRef.current - slideWidth) / (track.scrollWidth / totalSlides));
        setActiveIndex(currentSlide % itemCount);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    const onEnter = () => setIsPaused(true);
    const onLeave = () => setIsPaused(false);
    const onScroll = () => {
      scrollPosRef.current = track.scrollLeft;
    };

    track.addEventListener('pointerenter', onEnter);
    track.addEventListener('pointerleave', onLeave);
    track.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      track.removeEventListener('pointerenter', onEnter);
      track.removeEventListener('pointerleave', onLeave);
      track.removeEventListener('scroll', onScroll);
    };
  }, [itemCount, isPaused, totalSlides]);

  const scrollTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;

    const slideWidth = track.scrollWidth / totalSlides;
    const targetScroll = slideWidth * (itemCount + index);

    track.scrollTo({ left: targetScroll, behavior: 'smooth' });
    setActiveIndex(index);
  }, [itemCount, totalSlides]);

  const scrollPrev = useCallback(() => {
    const newIndex = activeIndex === 0 ? itemCount - 1 : activeIndex - 1;
    scrollTo(newIndex);
  }, [activeIndex, itemCount, scrollTo]);

  const scrollNext = useCallback(() => {
    const newIndex = activeIndex === itemCount - 1 ? 0 : activeIndex + 1;
    scrollTo(newIndex);
  }, [activeIndex, itemCount, scrollTo]);

  return { trackRef, activeIndex, isPaused, scrollPrev, scrollNext, scrollTo, totalSlides };
}

export default function HubPageClient() {
  const { trackRef, activeIndex, scrollPrev, scrollNext, scrollTo } = useInfiniteCarousel(INVESTMENT_STRATEGY_SLIDES.length);

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
    } else {
      let rafId = 0;
      const schedule = (): void => {
        if (rafId !== 0) return;
        rafId = window.requestAnimationFrame(() => {
          rafId = 0;
          updateHubChapterStyles(scope);
        });
      };
      updateHubChapterStyles(scope);
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
      <div className="header-wrapper">
        <header>
          <input
            className="menu-checkbox"
            type="checkbox"
            id="menu-checkbox"
            aria-controls="hub-site-nav"
          />
          <label className="menu-button" htmlFor="menu-checkbox" lang="fr">
            <span className="material-symbols-outlined not-sr-only" data-show-when="closed">
              dehaze
            </span>
            <span className="material-symbols-outlined not-sr-only" data-show-when="open">
              close
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ThemeToggle variant="minimal" size="sm" />
          <Link href={CTA_LINKS.launchApp.href} className="login-btn" prefetch>
            <span>{CTA_LINKS.launchApp.label}</span>
          </Link>
        </div>
        </header>
      </div>

      {/* Welcome */}
      <section id="welcome" className="center" lang="en">
        <img src="/logos/hearst-connect.svg" alt="Hearst Connect" className="welcome-logo" />
        <h1 className="welcome-title hub-chapter">
          Turn Bitcoin Mining
          <br />
          Into Structured Yield
          <br />
          <span className="text-accent">
            Access institutional-grade yield from real mining infrastructure,
            packaged into transparent onchain vaults.
          </span>
        </h1>
        <div
          style={{
            display: 'flex',
            gap: 'var(--hub-space-md)',
            marginTop: 'var(--hub-space-md)',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Link href={CTA_LINKS.launchApp.href} className="welcome-btn hub-chapter">
            {CTA_LINKS.launchApp.label}
          </Link>
          <a href={CTA_LINKS.viewOffering.href} className="hub-cta-secondary hub-chapter">
            {CTA_LINKS.viewOffering.label}
          </a>
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
          <div className="icons-track" aria-hidden="false">
            {ICONS.map((icon, i) => (
              <div key={`${icon.name}-${i}`} className="icon">
                <img
                  src={icon.src}
                  alt={i < ICONS.length ? icon.name : ''}
                  className="icon-img"
                  width={40}
                  height={40}
                  loading="lazy"
                  decoding="async"
                />
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
              <img src="/platform-screenshot.svg" alt="Hearst vault strategies preview" />
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

        <div className="hub-carousel-wrapper">
          <div
            className="hub-strategy-strip"
            ref={trackRef}
            role="region"
            lang="en"
            aria-label="Vault strategies"
          >
            {/* 3 sets for infinite scroll: prev + current + next */}
            {[...INVESTMENT_STRATEGY_SLIDES, ...INVESTMENT_STRATEGY_SLIDES, ...INVESTMENT_STRATEGY_SLIDES].map((slide, i) => (
              <article key={`${slide.title}-clone-${i}`} className="hub-strategy-slide" aria-roledescription="slide">
                <figure className={slide.imgClass}>
                  <img src={slide.img} alt="" draggable={false} />
                  <figcaption className="hub-strategy-caption">{slide.caption}</figcaption>
                </figure>
                <h3>{slide.title}</h3>
                <p>{slide.desc}</p>
                <a href={CTA_LINKS.viewOffering.href}>{CTA_LINKS.viewOffering.label}</a>
              </article>
            ))}
          </div>

          {/* Navigation controls */}
          <div className="hub-carousel-controls">
            <button
              className="hub-carousel-nav-btn"
              onClick={scrollPrev}
              aria-label="Previous slide"
              type="button"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>

            <div className="hub-carousel-dots" role="tablist" aria-label="Slide navigation">
              {INVESTMENT_STRATEGY_SLIDES.map((slide, i) => (
                <button
                  key={slide.title}
                  className={`hub-carousel-dot ${i === activeIndex ? 'active' : ''}`}
                  onClick={() => scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}: ${slide.title}`}
                  aria-selected={i === activeIndex}
                  role="tab"
                  type="button"
                />
              ))}
            </div>

            <button
              className="hub-carousel-nav-btn"
              onClick={scrollNext}
              aria-label="Next slide"
              type="button"
            >
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

      {/* Who */}
      <section id="who" className="center" lang="en">
        <div>
          <h3>
            Qualified investors
            <br />
            <span>Onchain access with institutional minimums</span>
          </h3>
          <a href={CTA_LINKS.viewOffering.href} className="hub-cta-primary">
            {CTA_LINKS.viewOffering.label}
          </a>
        </div>
        <div>
          <h3>
            Institutions
            <br />
            <span>Due diligence, reporting, and custody aligned to your mandate</span>
          </h3>
          <a href={CTA_LINKS.contactSales.href} className="hub-cta-secondary">
            {CTA_LINKS.contactSales.label}
          </a>
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
            <img
              src="/logos/hearst-connect.svg"
              alt="Hearst Connect"
              className="hub-footer-logo"
              width={120}
              height={32}
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
