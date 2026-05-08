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

/** Crossfade entre 3 captures dans la tablette, piloté par la progression de
 * scroll à travers la section #features-section.
 *
 * Plus la fenêtre est grande (`fadeWindow`), plus la transition est lente. */
function updateTabletScrollBlend(layers: HTMLElement): void {
  const wrapper = document.getElementById('features-section');
  if (!wrapper) return;

  const r = wrapper.getBoundingClientRect();
  const vh = window.innerHeight;

  // progression 0 → 1 sur tout le scroll utile à travers la section
  const total = r.height + vh;
  const raw = (vh - r.top) / total;
  const p = Math.max(0, Math.min(1, raw));

  const easeInOut = (t: number) => t * t * (3 - 2 * t);

  // Centres des deux transitions (espacés également) et largeur de fondu très
  // étalée pour ralentir au maximum le passage d'une image à l'autre.
  const fadeWindow = 0.001; // switch instantané, pas de fondu
  const center12 = 0.36;
  const center23 = 0.54;
  const center34 = 0.72;

  const lerp = (a: number, b: number, t: number) => Math.max(0, Math.min(1, (t - a) / Math.max(b - a, 1e-6)));
  const t12 = lerp(center12 - fadeWindow / 2, center12 + fadeWindow / 2, p);
  const t23 = lerp(center23 - fadeWindow / 2, center23 + fadeWindow / 2, p);
  const t34 = lerp(center34 - fadeWindow / 2, center34 + fadeWindow / 2, p);

  layers.style.setProperty('--tablet-front-opacity', easeInOut(t12).toFixed(4));
  layers.style.setProperty('--tablet-third-opacity', easeInOut(t23).toFixed(4));
  layers.style.setProperty('--tablet-fourth-opacity', easeInOut(t34).toFixed(4));
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
    id: 'feature-smart-input',
    title: 'Smart Input',
    subtitle: 'From Idea to Workflow',
    desc: 'Describe your needs in natural language and instantly generate structured workflows, connecting tools, data, and logic without writing a single line of code.',
    image: '/marketing/captures/1-v4.png',
    imageAlt: 'Smart input prompt interface',
  },
  {
    id: 'feature-live-orchestration',
    title: 'Live Orchestration',
    subtitle: 'Agents in Motion',
    desc: 'Watch your system activate in real time as agents connect services, deploy workflows, and coordinate tasks seamlessly across your entire digital infrastructure.',
    image: '/marketing/captures/2-v3.png',
    imageAlt: 'Live orchestration view',
  },
  {
    id: 'feature-instant-deployment',
    title: 'Instant Deployment',
    subtitle: 'Live From Day One',
    desc: 'Your custom application is generated, configured, and ready to use, with integrations, automations, and insights fully operational from the moment it launches.',
    image: '/marketing/captures/3-v4.png',
    imageAlt: 'Instant deployment configuration',
  },
  {
    id: 'feature-unified-control',
    title: 'Unified Control',
    subtitle: 'One Command Center',
    desc: 'Monitor performance, manage agents, track workflows, and gain real-time insights through a centralized dashboard designed for clarity, speed, and intelligent decision-making.',
    image: '/marketing/captures/4-v3.png',
    imageAlt: 'Unified control dashboard',
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
    id: 'hospitality-travel',
    variant: 'prime' as const,
    productName: 'Hospitality & Travel',
    screenshot: '/marketing/verticals/mamo.png',
    screenshotAlt: 'Mamo Michelangelo — Hospitality AI workspace',
    apy: 'More Yield',
    tagline: 'AI Guest Operations',
    description:
      'Automate guest communication and personalize every interaction in real time.\nSynchronize bookings across all channels while optimizing pricing and revenue.\nCoordinate front desk, housekeeping, and operations within one unified platform.',
  },
  {
    id: 'real-estate-property',
    variant: 'growth' as const,
    productName: 'Premium Real Estate',
    screenshot: '/marketing/verticals/mind.png',
    screenshotAlt: 'MIND — Real Estate AI workspace',
    apy: 'More imput',
    tagline: 'AI Portfolio Management',
    description:
      'Streamline listings, tenant workflows, and CRM pipelines in one place.\nAutomate operations and gain real-time insights across your portfolio.\nMake faster decisions with AI agents managing assets end-to-end.\nScale your portfolio with clarity, control, and confidence.',
  },
] as const;

const ICONS = [
  { name: 'Gmail', src: 'https://cdn.simpleicons.org/gmail' },
  { name: 'Google Drive', src: 'https://cdn.simpleicons.org/googledrive' },
  { name: 'Notion', src: 'https://cdn.simpleicons.org/notion' },
  { name: 'HubSpot', src: 'https://cdn.simpleicons.org/hubspot' },
  { name: 'Jira', src: 'https://cdn.simpleicons.org/jira' },
  { name: 'GitHub', src: 'https://cdn.simpleicons.org/github' },
  { name: 'Slack', src: '/logos/services/slack.svg' },
  { name: 'Zapier', src: 'https://cdn.simpleicons.org/zapier' },
  { name: 'Stripe', src: 'https://cdn.simpleicons.org/stripe' },
  { name: 'Figma', src: 'https://cdn.simpleicons.org/figma' },
  { name: 'Linear', src: 'https://cdn.simpleicons.org/linear' },
  { name: 'Airtable', src: 'https://cdn.simpleicons.org/airtable' },
  { name: 'Asana', src: 'https://cdn.simpleicons.org/asana' },
  { name: 'Dropbox', src: 'https://cdn.simpleicons.org/dropbox' },
  { name: 'Zoom', src: 'https://cdn.simpleicons.org/zoom' },
  { name: 'Discord', src: 'https://cdn.simpleicons.org/discord' },
  { name: 'Telegram', src: 'https://cdn.simpleicons.org/telegram' },
  { name: 'WhatsApp', src: 'https://cdn.simpleicons.org/whatsapp' },
  { name: 'Shopify', src: 'https://cdn.simpleicons.org/shopify' },
  { name: 'Intercom', src: 'https://cdn.simpleicons.org/intercom' },
  { name: 'Webflow', src: 'https://cdn.simpleicons.org/webflow' },
  { name: 'Zendesk', src: 'https://cdn.simpleicons.org/zendesk' },
  { name: 'Trello', src: 'https://cdn.simpleicons.org/trello' },
  { name: 'Vercel', src: 'https://cdn.simpleicons.org/vercel' },
  { name: 'Supabase', src: 'https://cdn.simpleicons.org/supabase' },
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
      const reducedLayers = scope.querySelector<HTMLElement>('.tablet-mockup-layers');
      reducedLayers?.style.setProperty('--tablet-front-opacity', '1');
      reducedLayers?.style.setProperty('--tablet-third-opacity', '1');
      reducedLayers?.style.setProperty('--tablet-fourth-opacity', '1');
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

    $welcome.style.setProperty('--ring-x', '50');
    $welcome.style.setProperty('--ring-y', '50');
    $welcome.style.setProperty('--ring-interactive', '0');

    let cancelled = false;

    void (async (): Promise<void> => {
      try {
        // Houdini paint worklet (see public/ringparticles.js)
        // @ts-expect-error CSS.paintWorklet is not in TS lib.dom for all targets
        await CSS.paintWorklet.addModule('/ringparticles.js');
      } catch (err) {
        console.warn('[hub] ring-particles paint worklet failed to load', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="hub-font-scope">
      {/* Header */}
      <div className={`header-wrapper ${isHeaderVisible ? 'is-visible' : ''}`}>
        <header>
          <a href="#" className="header-logo-link" aria-label="Hearst AI">
            <Image src="/logos/hearst-ai-black.svg" alt="Hearst AI" width={160} height={54} style={{ height: '54px', width: 'auto', display: 'block' }} priority />
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
        <Image src="/logos/hearst-ai-black.svg" alt="Hearst AI" className="welcome-logo" width={400} height={135} style={{ height: '135px', width: 'auto' }} priority />
        <h1 className="welcome-title hub-chapter">
          One platform. 1000+ services.
          <br />
          <span style={{ color: '#2ECFCE' }}>Seamless execution.</span>
        </h1>
        <Link href={CTA_LINKS.launchApp.href} className="welcome-btn hub-chapter" prefetch>
          <span>{CTA_LINKS.launchApp.label}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ marginLeft: '4px' }}>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

      {/* Intro */}
      <section id="intro" className="theme-light" lang="en">
        <div className="hub-section-lead">
          <h2>
            <span className="typewriter"><span className="hub-lead-accent">Hearst AI</span> orchestrates your entire stack through intelligent agents that automate workflows, streamline operations, and scale execution effortlessly across every sector.</span>
          </h2>
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
                      width={480}
                      height={200}
                      quality={100}
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
                <span className="feature-pillar-subtitle">{feature.subtitle}</span>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
                <div className="feature-pillar-image" aria-hidden>
                  <Image
                    src={feature.image}
                    alt={feature.imageAlt}
                    width={1600}
                    height={1100}
                  />
                </div>
              </article>
            ))}
          </div>
          <div className="features-tablet" id="features-tablet">
            <div className="tablet-mockup">
              <div className="tablet-mockup-layers">
                <div className="tablet-mockup-stack-inner">
                  <Image
                    src="/marketing/captures/1-v4.png"
                    alt="Smart input prompt interface"
                    width={1600}
                    height={1100}
                    className="tablet-layer tablet-layer--back"
                    priority
                  />
                  <Image
                    src="/marketing/captures/2-v3.png"
                    alt="Live orchestration view"
                    width={1600}
                    height={1100}
                    className="tablet-layer tablet-layer--front"
                  />
                  <Image
                    src="/marketing/captures/3-v4.png"
                    alt="Instant deployment configuration"
                    width={1600}
                    height={1100}
                    className="tablet-layer tablet-layer--third"
                  />
                  <Image
                    src="/marketing/captures/4-v3.png"
                    alt="Unified control dashboard"
                    width={1600}
                    height={1100}
                    className="tablet-layer tablet-layer--fourth"
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
          <h2>Execution-focused verticals</h2>
          <p className="intro">
            Pre-configured agent packs, workflows, and integrations tailored for hospitality, real estate, and more — all fully customizable to match your brand identity, including your logo and color palette.
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
                      <h3 className="hub-vault-product-name">{slide.productName}</h3>
                      <p className="hub-vault-product-apy" style={{ color: '#2ECFCE' }}>{slide.apy}</p>
                      <p className="hub-vault-product-tagline">{slide.tagline}</p>
                      <p className="hub-vault-product-desc" style={{ whiteSpace: 'pre-line' }}>{slide.description}</p>
                      <div className="hub-vault-product-cta">
                        <a href={CTA_LINKS.launchApp.href} className="login-btn">
                          Launch App
                        </a>
                      </div>
                    </div>
                    <div className="hub-vault-product-imac-wrapper">
                      <div className="hub-vault-product-imac" aria-hidden>
                        <div className="hub-vault-product-imac-bezel">
                          <div className="hub-vault-product-imac-screen">
                            <Image
                              src={slide.screenshot}
                              alt={slide.screenshotAlt}
                              fill
                              sizes="(max-width: 929px) 90vw, 60vw"
                              className="hub-vault-product-imac-image"
                            />
                          </div>
                        </div>
                        <div className="hub-vault-product-imac-stand" />
                        <div className="hub-vault-product-imac-foot" />
                      </div>
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

        </div>
      </section>

      {/* Before You Go: outer card scroll-driven scale; inner hub-chapter parallax */}
      <section id="beforeyougo" lang="en">
        <div className="card dark hub-final-cta-card">
          <div className="hub-chapter hub-final-cta-content">
            <p>
              <span className="typewriter">Stop switching. Start scaling.</span>
            </p>
            <div className="buttons">
              <Link href={CTA_LINKS.launchApp.href} className="hub-cta-primary">
                {CTA_LINKS.launchApp.label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="hub-footer-slim" id="hub-footer">
        <div className="hub-footer-slim-inner">
          <Image
            src="/logos/hearst-ai-black.svg"
            alt="Hearst AI"
            className="hub-footer-slim-logo"
            width={160}
            height={54}
            style={{ height: '54px', width: 'auto', display: 'block' }}
            loading="lazy"
          />
          <div className="hub-footer-slim-cta">
            <p className="hub-footer-slim-headline">Join the next wave of intelligent operations.</p>
            <EarlyAccessForm />
          </div>
        </div>
        <div className="hub-footer-slim-bottom">
          <span>© {new Date().getFullYear()} Hearst Corporation. All rights reserved.</span>
          <div className="hub-footer-slim-links">
            <a href="/terms">Terms of Service</a>
            <span aria-hidden>·</span>
            <a href="/privacy">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function EarlyAccessForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setMessage(null);
    try {
      const res = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'landing-footer' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setMessage(data?.error === 'Invalid email' ? 'Please enter a valid email.' : 'Something went wrong. Try again.');
        return;
      }
      setStatus('success');
      setMessage(data?.duplicate ? "You're already on the list — we'll be in touch." : "You're on the list. We'll be in touch shortly.");
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Network error. Try again.');
    }
  };

  return (
    <form className="hub-footer-slim-form" onSubmit={handleSubmit} noValidate>
      <input
        type="email"
        placeholder="your@email.com"
        className="hub-footer-slim-input"
        aria-label="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={status === 'loading'}
      />
      <button
        type="submit"
        className="hub-footer-slim-btn"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Submitting…' : 'Get Early Access'}
      </button>
      {message && (
        <p
          role="status"
          className={`hub-footer-slim-form-msg ${status === 'error' ? 'is-error' : 'is-success'}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
