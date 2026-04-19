'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * SmoothScrollProvider
 *
 * Lenis drives a virtualised, RAF-based scroll. GSAP ScrollTrigger reads from
 * Lenis's scroll position so every pinned section / scrubbed timeline gets
 * butter-smooth interpolation for free.
 *
 * Tuning notes:
 *  - `lerp: 0.1` gives a tight, responsive feel on trackpads (≈ "butter").
 *    Lower (0.06) → silkier but more lag. Higher (0.15) → snappier.
 *  - `lagSmoothing(0)` is mandatory: GSAP must NOT batch frames when Lenis
 *    is owning the scroll, otherwise scrubbed timelines stutter on fast wheel.
 */
let lenisSingleton: Lenis | null = null;

export function getLenis(): Lenis | null {
  return lenisSingleton;
}

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    const isTouchLikeDevice =
      window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
      navigator.maxTouchPoints > 0;

    // iPhone/iPad touch scrolling is more reliable with native scroll.
    // Lenis + pinned ScrollTrigger sections can trap the horizontal cinema rail
    // on iOS even though desktop wheel scrolling works correctly.
    if (isTouchLikeDevice) {
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      lerp: 0.12,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      syncTouch: false,
    });

    lenisSingleton = lenis;

    /** Official Lenis ↔ GSAP integration (lenis.dev docs). NO scrollerProxy:
     *  Lenis still drives `window.scrollY` via `setScroll`, so ScrollTrigger
     *  can read the native scroll directly. Adding a proxy on top desyncs
     *  pinned/scrubbed sections (cinema horizontal track) and was causing
     *  half-shifted "split" frames on the Live Projects rail. */
    const handleScroll = () => ScrollTrigger.update();
    lenis.on('scroll', handleScroll);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    return () => {
      lenis.off('scroll', handleScroll);
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      if (lenisSingleton === lenis) lenisSingleton = null;
    };
  }, []);

  return <>{children}</>;
}
