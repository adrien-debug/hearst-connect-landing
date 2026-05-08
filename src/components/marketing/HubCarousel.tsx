'use client';

import { useState, useCallback, useEffect } from 'react';
import { CTA_LINKS } from '@/config/navigation';
import { Odometer } from './Odometer';
import { ScrubText } from './ScrubText';

const VAULT_PRODUCT_SLIDES = [
  {
    id: 'hashvault-prime',
    variant: 'prime' as const,
    productName: 'HashVault Prime',
    video: '/videos/bg-prime.mp4',
    poster: '/videos/poster-prime.jpg',
    videoAlt: 'HashVault Prime — animated background',
    apyValue: 12,
    tagline: 'Stable yield, engineered for consistency.',
    description:
      'Mining-backed cashflow combined with stablecoin income and hedged BTC exposure.\nDaily USDC distributions until 36% target or maturity.\nMin allocation $500,000 · 3-year lock · moderate risk profile.\nBuilt for capital preservation with institutional-grade reporting.',
  },
  {
    id: 'hashvault-growth',
    variant: 'growth' as const,
    productName: 'HashVault Growth',
    video: '/videos/bg-growth.mp4',
    poster: '/videos/poster-growth.jpg',
    videoAlt: 'HashVault Growth — animated background',
    apyValue: 15,
    tagline: 'Bitcoin upside, supported by mining yield.',
    description:
      'Spot BTC captures upside while mining cashflow cushions drawdowns.\nDynamic allocation, daily USDC yield until 45% target or maturity.\nMin allocation $250,000 · 3-year lock · growth risk profile.\nFor allocators seeking BTC exposure with a yield floor.',
  },
] as const;

const INTERVAL_MS = 5000;

export function HubCarousel() {
  const count = VAULT_PRODUCT_SLIDES.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const scrollNext = useCallback(() => setActiveIndex(i => (i + 1) % count), [count]);
  const scrollPrev = useCallback(() => setActiveIndex(i => (i === 0 ? count - 1 : i - 1)), [count]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(scrollNext, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPaused, scrollNext]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, isActive: boolean) => {
    if (!isActive) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    card.style.transform = `perspective(1200px) rotateX(${((y - cy) / cy) * -8}deg) rotateY(${((x - cx) / cx) * 8}deg) scale3d(1.02, 1.02, 1.02)`;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  return (
    <section id="developers" className="theme-light">
      <div className="hub-section-head" lang="en">
        <h2>The HashVault product family</h2>
        <ScrubText text="Two structured strategies built on the same industrial mining infrastructure. HashVault Prime targets stable USDC yield with capital preservation. HashVault Growth adds Bitcoin upside with a mining-backed yield floor. Both deliver daily distributions, on-chain reporting, and 3-year horizons." />
      </div>

      <div
        className="hub-carousel-auto"
        aria-roledescription="carousel"
        aria-live={isPaused ? 'polite' : 'off'}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div
          className="hub-carousel-auto-track"
          style={{ transform: `translateX(calc(-${activeIndex} * (var(--slide-width) + var(--slide-gap))))` }}
        >
          {VAULT_PRODUCT_SLIDES.map((slide, i) => {
            const isActive = i === activeIndex;
            return (
              <article
                key={slide.id}
                className={`hub-carousel-auto-slide ${isActive ? 'is-active' : ''}`}
                aria-hidden={!isActive}
                tabIndex={isActive ? 0 : -1}
              >
                <div className="hub-slide-card">
                  <div
                    className={`hub-vault-product-card hub-vault-product-card--${slide.variant} magnetic-card`}
                    onMouseMove={(e) => handleMouseMove(e, isActive)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="hub-carousel-progress-wrapper">
                      <div
                        className="hub-carousel-progress-bar"
                        style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
                      />
                    </div>
                    <div className="hub-vault-product-inner">
                      <h3 className="hub-vault-product-name">{slide.productName}</h3>
                      <p className="hub-vault-product-apy">
                        {isActive ? <Odometer value={slide.apyValue} suffix="% APY" /> : `${slide.apyValue}% APY`}
                      </p>
                      <p className="hub-vault-product-tagline">{slide.tagline}</p>
                      <p className="hub-vault-product-desc" style={{ whiteSpace: 'pre-line' }}>{slide.description}</p>
                      <div className="hub-vault-product-cta">
                        <a href={CTA_LINKS.launchApp.href} className="login-btn" tabIndex={isActive ? 0 : -1}>
                          Launch App
                        </a>
                      </div>
                    </div>
                    <div className="hub-vault-product-media">
                      <video
                        src={slide.video}
                        poster={slide.poster}
                        aria-label={slide.videoAlt}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
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
  );
}
