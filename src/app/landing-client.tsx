'use client';

import '@/styles/marketing/hub.css';

import { useEffect, useState, useCallback } from 'react';

import { HubHeader } from '@/components/marketing/HubHeader';
import { HubHero } from '@/components/marketing/HubHero';
import { HubTicker } from '@/components/marketing/HubTicker';
import { HubMarquee } from '@/components/marketing/HubMarquee';
import { HubFeatures } from '@/components/marketing/HubFeatures';
import { HubCarousel } from '@/components/marketing/HubCarousel';
import { HubSimulator } from '@/components/marketing/HubSimulator';
import { HubFooter } from '@/components/marketing/HubFooter';
import { PremiumEffects } from '@/components/marketing/PremiumEffects';
import { HubSmoothScroll } from '@/components/marketing/HubSmoothScroll';

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
  const carouselState = useAutoCarousel(2); // 2 slides
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

    $welcome.style.setProperty('--ring-x', '50');
    $welcome.style.setProperty('--ring-y', '50');
    $welcome.style.setProperty('--ring-interactive', '0');

    let cancelled = false;

    const handleMouseMove = (e: MouseEvent): void => {
      if (cancelled) return;
      const rect = $welcome.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      $welcome.style.setProperty('--ring-x', x.toString());
      $welcome.style.setProperty('--ring-y', y.toString());
      $welcome.style.setProperty('--ring-interactive', '1');
    };

    const handleMouseLeave = (): void => {
      if (cancelled) return;
      $welcome.style.setProperty('--ring-x', '50');
      $welcome.style.setProperty('--ring-y', '50');
      $welcome.style.setProperty('--ring-interactive', '0');
    };

    $welcome.addEventListener('mousemove', handleMouseMove);
    $welcome.addEventListener('mouseleave', handleMouseLeave);

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
      $welcome.removeEventListener('mousemove', handleMouseMove);
      $welcome.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="hub-font-scope">
      <HubSmoothScroll />
      <PremiumEffects />
      <HubHeader isHeaderVisible={isHeaderVisible} />
      <HubHero />
      <HubTicker />
      <HubMarquee />
      <HubFeatures />
      <HubSimulator />
      <HubCarousel {...carouselState} />
      <HubFooter />
    </div>
  );
}
