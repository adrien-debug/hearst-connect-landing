'use client';

import { useEffect, useRef } from 'react';

export function PremiumEffects() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const el = cursorRef.current;
    if (!el) return;

    let rafId = 0;
    let x = -100;
    let y = -100;

    const move = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;

      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        el.classList.add('is-visible');

        const target = e.target as HTMLElement;
        el.classList.toggle(
          'is-hovering',
          !!target.closest('a, button, .magnetic-card, .magnetic-btn, .feature-pillar, input, .hub-carousel-auto'),
        );
      });
    };

    const leave = () => {
      el.classList.remove('is-visible');
    };

    window.addEventListener('mousemove', move);
    document.addEventListener('mouseleave', leave);
    document.body.classList.add('custom-cursor-enabled');

    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseleave', leave);
      document.body.classList.remove('custom-cursor-enabled');
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div className="cinematic-grain" aria-hidden />
      <div
        ref={cursorRef}
        className="custom-cursor"
        style={{ transform: 'translate3d(-100px, -100px, 0)' }}
        aria-hidden
      >
        <div className="custom-cursor-dot" />
      </div>
    </>
  );
}
