'use client';

import { useEffect, useState } from 'react';

export function PremiumEffects() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setIsVisible(true);

      const target = e.target as HTMLElement;
      const interactive = target.closest(
        'a, button, .magnetic-card, .magnetic-btn, .feature-pillar, input, .hub-carousel-auto'
      );
      setIsHovering(!!interactive);
    };

    const leave = () => setIsVisible(false);

    window.addEventListener('mousemove', move);
    document.addEventListener('mouseleave', leave);

    document.body.classList.add('custom-cursor-enabled');

    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseleave', leave);
      document.body.classList.remove('custom-cursor-enabled');
    };
  }, []);

  return (
    <>
      <div className="cinematic-grain" aria-hidden />
      <div
        className={`custom-cursor ${isHovering ? 'is-hovering' : ''} ${isVisible ? 'is-visible' : ''}`}
        style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
        aria-hidden
      >
        <div className="custom-cursor-dot" />
      </div>
    </>
  );
}
