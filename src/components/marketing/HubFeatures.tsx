'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const FEATURE_PILLARS = [
  {
    id: 'feature-real-infrastructure',
    title: 'Real infrastructure',
    subtitle: 'Industrial Bitcoin Mining',
    desc: 'USDC exposure to industrial Bitcoin mining cash flows. Real hashrate, real operations, institutional-grade infrastructure — not synthetic exposure or paper claims.',
    image: '/platform-screenshot.png',
    imageAlt: 'Hearst Connect — vault portfolio overview',
  },
  {
    id: 'feature-transparent-reporting',
    title: 'Transparent reporting',
    subtitle: 'Onchain Proof of Reserves',
    desc: 'Monthly USDC distributions, on-chain proof of reserves, and third-party audits at every step. Every position, every payout — verifiable on Base.',
    image: '/platform-screenshot.png',
    imageAlt: 'Hearst Connect — reporting and analytics',
  },
  {
    id: 'feature-institutional-controls',
    title: 'Institutional controls',
    subtitle: 'Built for Allocators',
    desc: 'Multi-signature governance, audited contracts, KYC/AML compliance, and custody integrations built for serious allocators — Fireblocks, Safe, Ledger Enterprise.',
    image: '/platform-screenshot.png',
    imageAlt: 'Hearst Connect — governance and custody',
  },
  {
    id: 'feature-stable-yield',
    title: 'Stable USDC yield',
    subtitle: 'Daily Distributions',
    desc: 'Mining-backed cashflow streams smooth Bitcoin volatility into predictable daily USDC yield. Track every accrual, claim on demand, redeem at maturity.',
    image: '/platform-screenshot.png',
    imageAlt: 'Hearst Connect — daily yield distributions',
  },
] as const;

export function HubFeatures() {
  const [activeId, setActiveId] = useState<string>(FEATURE_PILLARS[0].id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId((prev) => {
              const next = entry.target.id;
              return prev === next ? prev : next;
            });
          }
        });
      },
      {
        rootMargin: '-30% 0px -30% 0px',
        threshold: 0,
      }
    );

    document.querySelectorAll('.feature-pillar').forEach((el) => {
      observerRef.current?.observe(el);
    });

    const tablet = document.querySelector('.tablet-mockup') as HTMLElement | null;
    let tiltRafId = 0;
    const handleScroll = () => {
      if (!tablet || tiltRafId !== 0) return;
      tiltRafId = window.requestAnimationFrame(() => {
        tiltRafId = 0;
        if (!tablet) return;
        const rect = tablet.getBoundingClientRect();
        const diff = (rect.top + rect.height / 2 - window.innerHeight / 2) * 0.05;
        tablet.style.transform = `perspective(1000px) rotateX(${diff}deg) rotateY(${-diff * 0.5}deg) translateY(${diff}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener('scroll', handleScroll);
      if (tiltRafId !== 0) window.cancelAnimationFrame(tiltRafId);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <section id="features-section" aria-label="Why Hearst Connect, four pillars" lang="en">
      <div id="features">
        <div className="features-text" onMouseMove={handleMouseMove}>
          {FEATURE_PILLARS.map((feature) => {
            const isActive = activeId === feature.id;
            return (
              <article
                key={feature.id}
                id={feature.id}
                className={`feature-block feature-pillar ${isActive ? 'is-active' : ''}`}
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
            );
          })}
        </div>
        <div className="features-tablet" id="features-tablet">
          <div className="tablet-mockup">
            <div className="tablet-mockup-layers">
              <div className="tablet-mockup-stack-inner">
                <video
                  src="/marketing/area.mp4"
                  poster="/marketing/poster-area.jpg"
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
  );
}
