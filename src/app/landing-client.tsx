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
    type: 'video',
    src: '/view-1.mp4',
    imgClass: 'slide-img-1',
    caption: 'Flagship — stable income',
    title: 'Hearst Prime Yield',
    desc: 'Target ~12% annual yield. $250K min, monthly USDC distributions, 3-year lock. Diversified mining income with volatility hedging for predictable returns.',
  },
  {
    type: 'video',
    src: '/view-2.mp4',
    imgClass: 'slide-img-2',
    caption: 'Growth — BTC upside',
    title: 'Hearst Growth',
    desc: 'Target 16–22% annual yield. $250K min, monthly distributions, 3-year lock. Forward BTC mining exposure plus spot price upside with USDC buffer.',
  },
  {
    type: 'video',
    src: '/view-3.mp4',
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

interface UseCarouselReturn {
  trackRef: React.RefObject<HTMLDivElement | null>;
  activeIndex: number;
  scrollProgress: number;
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (index: number) => void;
  isDragging: boolean;
  dragHandlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

function useModernCarousel(itemCount: number): UseCarouselReturn {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragState = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
    velocity: 0,
    lastX: 0,
    lastTime: 0,
  });

  const scrollTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;

    const slides = track.children;
    if (index < 0 || index >= slides.length) return;

    const slide = slides[index] as HTMLElement;
    const trackRect = track.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();

    const scrollLeft = track.scrollLeft + (slideRect.left - trackRect.left) - (trackRect.width - slideRect.width) / 2;

    track.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    setActiveIndex(index);
  }, []);

  const scrollPrev = useCallback(() => {
    const newIndex = activeIndex === 0 ? itemCount - 1 : activeIndex - 1;
    scrollTo(newIndex);
  }, [activeIndex, itemCount, scrollTo]);

  const scrollNext = useCallback(() => {
    const newIndex = activeIndex === itemCount - 1 ? 0 : activeIndex + 1;
    scrollTo(newIndex);
  }, [activeIndex, itemCount, scrollTo]);

  // Update active index and progress based on scroll position
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const updateMetrics = () => {
      const slides = Array.from(track.children) as HTMLElement[];
      if (slides.length === 0) return;

      const trackCenter = track.scrollLeft + track.clientWidth / 2;
      let closestIndex = 0;
      let closestDistance = Infinity;

      slides.forEach((slide, index) => {
        const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
        const distance = Math.abs(trackCenter - slideCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex(closestIndex);

      // Calculate scroll progress (0 to 1)
      const maxScroll = track.scrollWidth - track.clientWidth;
      const progress = maxScroll > 0 ? track.scrollLeft / maxScroll : 0;
      setScrollProgress(progress);
    };

    track.addEventListener('scroll', updateMetrics, { passive: true });
    updateMetrics();

    return () => track.removeEventListener('scroll', updateMetrics);
  }, []);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const track = trackRef.current;
    if (!track) return;

    setIsDragging(true);
    dragState.current = {
      isDragging: true,
      startX: e.pageX - track.offsetLeft,
      scrollLeft: track.scrollLeft,
      velocity: 0,
      lastX: e.pageX,
      lastTime: Date.now(),
    };
    track.style.cursor = 'grabbing';
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const track = trackRef.current;
    if (!track || !dragState.current.isDragging) return;

    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.2;
    track.scrollLeft = dragState.current.scrollLeft - walk;

    // Calculate velocity for momentum
    const now = Date.now();
    const dt = now - dragState.current.lastTime;
    if (dt > 0) {
      dragState.current.velocity = (e.pageX - dragState.current.lastX) / dt;
    }
    dragState.current.lastX = e.pageX;
    dragState.current.lastTime = now;
  }, []);

  const handleMouseUp = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    dragState.current.isDragging = false;
    setIsDragging(false);
    track.style.cursor = 'grab';

    // Snap to nearest slide based on velocity and position
    const velocity = dragState.current.velocity;
    if (Math.abs(velocity) > 0.5) {
      // Momentum scrolling - go to next/prev based on direction
      if (velocity > 0 && activeIndex > 0) {
        scrollTo(activeIndex - 1);
      } else if (velocity < 0 && activeIndex < itemCount - 1) {
        scrollTo(activeIndex + 1);
      }
    }
  }, [activeIndex, itemCount, scrollTo]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const track = trackRef.current;
    if (!track) return;

    dragState.current = {
      isDragging: true,
      startX: e.touches[0].pageX - track.offsetLeft,
      scrollLeft: track.scrollLeft,
      velocity: 0,
      lastX: e.touches[0].pageX,
      lastTime: Date.now(),
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const track = trackRef.current;
    if (!track || !dragState.current.isDragging) return;

    const x = e.touches[0].pageX - track.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.2;
    track.scrollLeft = dragState.current.scrollLeft - walk;

    const now = Date.now();
    const dt = now - dragState.current.lastTime;
    if (dt > 0) {
      dragState.current.velocity = (e.touches[0].pageX - dragState.current.lastX) / dt;
    }
    dragState.current.lastX = e.touches[0].pageX;
    dragState.current.lastTime = now;
  }, []);

  const handleTouchEnd = useCallback(() => {
    dragState.current.isDragging = false;
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') scrollPrev();
      if (e.key === 'ArrowRight') scrollNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollPrev, scrollNext]);

  return {
    trackRef,
    activeIndex,
    scrollProgress,
    scrollPrev,
    scrollNext,
    scrollTo,
    isDragging,
    dragHandlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

export default function HubPageClient() {
  const { trackRef, activeIndex, scrollProgress, scrollPrev, scrollNext, scrollTo, isDragging, dragHandlers } = useModernCarousel(INVESTMENT_STRATEGY_SLIDES.length);

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

        <div className="hub-carousel-modern">
          {/* Progress bar */}
          <div className="hub-carousel-progress" aria-hidden="true">
            <div
              className="hub-carousel-progress-bar"
              style={{ transform: `scaleX(${scrollProgress})` }}
            />
          </div>

          {/* Track */}
          <div
            className={`hub-carousel-track-modern ${isDragging ? 'is-dragging' : ''}`}
            ref={trackRef}
            role="region"
            lang="en"
            aria-label="Vault strategies"
            {...dragHandlers}
          >
            {INVESTMENT_STRATEGY_SLIDES.map((slide, i) => (
              <article
                key={slide.title}
                className={`hub-carousel-slide ${i === activeIndex ? 'is-active' : ''} ${Math.abs(i - activeIndex) === 1 ? 'is-adjacent' : ''}`}
                aria-roledescription="slide"
                aria-current={i === activeIndex}
              >
                <div className="hub-slide-card">
                  <figure className={`hub-slide-media ${slide.imgClass}`}>
                    {slide.type === 'video' ? (
                      <video
                        src={slide.src}
                        autoPlay
                        loop
                        muted
                        playsInline
                        draggable={false}
                      />
                    ) : (
                      <img src={slide.src} alt="" draggable={false} />
                    )}
                    <div className="hub-slide-glow" />
                  </figure>
                  <div className="hub-slide-content">
                    <span className="hub-slide-badge">
                      {slide.caption}
                    </span>
                    <h3 className="hub-slide-title">{slide.title}</h3>
                    <p className="hub-slide-desc">{slide.desc}</p>
                    <a href={CTA_LINKS.viewOffering.href} className="hub-slide-cta">
                      <span>{CTA_LINKS.viewOffering.label}</span>
                      <svg className="hub-slide-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Navigation */}
          <div className="hub-carousel-nav-modern">
            <button
              className="hub-carousel-btn"
              onClick={scrollPrev}
              aria-label="Previous slide"
              type="button"
              disabled={activeIndex === 0}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="hub-carousel-indicators">
              {INVESTMENT_STRATEGY_SLIDES.map((slide, i) => (
                <button
                  key={slide.title}
                  className={`hub-carousel-indicator ${i === activeIndex ? 'is-active' : ''}`}
                  onClick={() => scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}: ${slide.title}`}
                  aria-current={i === activeIndex}
                  type="button"
                >
                  <span className="indicator-dot" />
                  <span className="indicator-label">{slide.caption}</span>
                </button>
              ))}
            </div>

            <button
              className="hub-carousel-btn"
              onClick={scrollNext}
              aria-label="Next slide"
              type="button"
              disabled={activeIndex === INVESTMENT_STRATEGY_SLIDES.length - 1}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Slide counter */}
          <div className="hub-carousel-counter" aria-live="polite" aria-atomic="true">
            <span className="counter-current">{String(activeIndex + 1).padStart(2, '0')}</span>
            <span className="counter-divider" />
            <span className="counter-total">{String(INVESTMENT_STRATEGY_SLIDES.length).padStart(2, '0')}</span>
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
