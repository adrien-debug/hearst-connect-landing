'use client';

import Link from 'next/link';
import { useEffect, useRef, type RefObject } from 'react';

/** Post-auth destination for users coming from the HUB landing (SaaS dashboard). */
const HUB_LOGIN_HREF = '/login?callbackUrl=/dashboard';

const HUB_MAILTO_SALES =
  'mailto:hello@hearstvault.com?subject=' + encodeURIComponent('Hearst investor inquiry');

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

function useHubCarouselHoverScroll(
  wrapRef: RefObject<HTMLElement | null>,
  trackRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let dir = 0;
    let raf = 0;
    let speedPx = 0;

    const clearHints = (): void => {
      wrap.classList.remove('hub-carousel-wrap--hint-left', 'hub-carousel-wrap--hint-right');
    };

    const tick = (): void => {
      if (dir !== 0 && speedPx > 0) {
        track.scrollLeft += dir * speedPx;
        raf = window.requestAnimationFrame(tick);
      }
    };

    const stop = (): void => {
      dir = 0;
      speedPx = 0;
      clearHints();
      window.cancelAnimationFrame(raf);
      raf = 0;
    };

    const onMove = (e: PointerEvent): void => {
      const r = wrap.getBoundingClientRect();
      const p = r.width > 0 ? (e.clientX - r.left) / r.width : 0.5;
      const edge = 0.26;
      const nextDir = p > 1 - edge ? 1 : p < edge ? -1 : 0;

      clearHints();
      if (nextDir === 1) wrap.classList.add('hub-carousel-wrap--hint-right');
      else if (nextDir === -1) wrap.classList.add('hub-carousel-wrap--hint-left');

      if (nextDir === 0) {
        stop();
        return;
      }

      const intensity = nextDir === 1 ? (p - (1 - edge)) / edge : (edge - p) / edge;
      const nextSpeed = Math.max(0.9, Math.min(8, intensity * 8.5));

      if (nextDir !== dir || Math.abs(nextSpeed - speedPx) > 0.2) {
        dir = nextDir;
        speedPx = nextSpeed;
        window.cancelAnimationFrame(raf);
        raf = 0;
        raf = window.requestAnimationFrame(tick);
      }
    };

    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerleave', stop);
    wrap.addEventListener('pointercancel', stop);
    return () => {
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerleave', stop);
      wrap.removeEventListener('pointercancel', stop);
      stop();
    };
  }, [wrapRef, trackRef]);
}

/** Vertical wheel → horizontal scroll when pointer is over the track (trackpad / mouse). */
function useHubCarouselWheelScroll(trackRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onWheel = (e: WheelEvent): void => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [trackRef]);
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

export default function HubPageClient() {
  const hubCarouselWrapRef = useRef<HTMLDivElement>(null);
  const hubCarouselTrackRef = useRef<HTMLDivElement>(null);
  useHubCarouselHoverScroll(hubCarouselWrapRef, hubCarouselTrackRef);
  useHubCarouselWheelScroll(hubCarouselTrackRef);

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
              <li>
                <a href="#intro">Intégrations</a>
              </li>
              <li>
                <a href="#feature-unified">Plateforme</a>
              </li>
              <li>
                <a href="#developers">Solutions</a>
              </li>
              <li>
                <a href="#who">Contact</a>
              </li>
            </ul>
          </nav>

          <Link href={HUB_LOGIN_HREF} className="login-btn" prefetch>
            <span>Connexion</span>
          </Link>
        </header>
      </div>

      {/* Welcome */}
      <section id="welcome" className="center" lang="en">
        <img src="/logos/hearst-connect.svg" alt="Hearst Connect" className="welcome-logo" />
        <h1 className="welcome-title hub-chapter">
          Onchain access to industrial Bitcoin
          <br />
          mining cash flows
          <br />
          <span className="text-accent">USDC vaults, Base, transparent reporting</span>
        </h1>
        <a href="#beforeyougo" className="welcome-btn hub-chapter">
          View offering
        </a>
      </section>

      {/* Intro */}
      <section id="intro" className="theme-light" lang="en">
        <div className="hub-section-lead hub-chapter">
          <h2>
            <span className="typewriter">
              <span className="hub-lead-accent">Hearst</span> offers qualified investors direct
              exposure to industrial mining cash flows. USDC vaults backed by regulated infrastructure
              and clear reporting.
            </span>
          </h2>
        </div>

        <div className="icons">
          {ICONS.map(icon => (
            <div key={icon.name} className="icon">
              <img
                src={icon.src}
                alt={icon.name}
                className="icon-img"
                width={40}
                height={40}
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
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
                className="feature-block feature-pillar hub-chapter"
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
        <div className="hub-section-head hub-chapter" lang="en">
          <h2>Investment strategies</h2>
          <p className="intro">
            Two vault profiles. Pick the risk and return fit. Hover the strip edges or scroll to browse.
          </p>
        </div>

        <div
          className="hub-carousel-wrap"
          ref={hubCarouselWrapRef}
          role="region"
          lang="en"
          aria-label="Vault strategies. Hover near edges or scroll wheel to move horizontally"
        >
          <div className="carousel hub-carousel-track" ref={hubCarouselTrackRef}>
            {[
              {
                img: '/platform-screenshot.svg',
                caption: 'Flagship, medium high risk',
                title: 'Hearst Prime Yield',
                desc: 'Target near 12%. $250K min, monthly distributions, 3Y lock. Diversified mining income with volatility protection.',
              },
              {
                img: '/platform-screenshot.svg',
                caption: 'Advanced, medium high risk',
                title: 'Hearst Growth',
                desc: 'Target 16% to 22%. $250K min, monthly, 3Y lock. BTC forward mining plus spot upside with USDC buffer.',
              },
              {
                img: '/platform-screenshot.svg',
                caption: 'Yield mechanics',
                title: 'How yield is generated',
                desc: 'USDC deployed into industrial mining; BTC rewards converted via OTC; net yield monthly. Auditable end to end.',
              },
            ].map(dev => (
              <div key={dev.title} className="developer">
                <figure>
                  <img src={dev.img} alt={dev.title} />
                  <figcaption className="carousel-caption">{dev.caption}</figcaption>
                </figure>
                <h3>{dev.title}</h3>
                <p>{dev.desc}</p>
                <a href="#beforeyougo">View offering</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who */}
      <section id="who" className="center" lang="en">
        <div className="hub-chapter">
          <h3>
            Qualified investors
            <br />
            <span>Onchain access with institutional minimums</span>
          </h3>
          <a href="#beforeyougo" className="hub-cta-primary">
            View offering
          </a>
        </div>
        <div className="hub-chapter">
          <h3>
            Institutions
            <br />
            <span>Due diligence, reporting, and custody aligned to your mandate</span>
          </h3>
          <a href={HUB_MAILTO_SALES} className="hub-cta-secondary">
            Contact
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
              <a href="#beforeyougo" className="hub-cta-primary">
                View offering
              </a>
              <a href={HUB_MAILTO_SALES} className="hub-cta-secondary">
                Contact
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
                <li>
                  <a href="#intro">Intégrations</a>
                </li>
                <li>
                  <a href="#feature-unified">Plateforme</a>
                </li>
                <li>
                  <a href="#developers">Solutions</a>
                </li>
                <li>
                  <a href="#who">Contact</a>
                </li>
              </ul>
            </div>
            <div className="hub-footer-col">
              <p className="hub-footer-heading">Accès</p>
              <ul className="hub-footer-links">
                <li>
                  <Link href={HUB_LOGIN_HREF} prefetch>
                    Connexion
                  </Link>
                </li>
                <li>
                  <a href="#beforeyougo">Offre</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="hub-footer-bottom">
          <span className="hub-footer-copy">© {new Date().getFullYear()} Hearst</span>
          <a href="mailto:hello@hearstvault.com" className="hub-footer-mail">
            hello@hearstvault.com
          </a>
        </div>
      </footer>
    </div>
  );
}
