'use client';

import { useEffect, useRef, useState } from 'react';

export function ScrubText({ text }: { text: string }) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1);
      return;
    }

    let rafId = 0;

    const handleScroll = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const wh = window.innerHeight;
        const start = wh;
        const end = wh * 0.4;
        const cur = rect.top;
        if (cur > start) setProgress(0);
        else if (cur < end) setProgress(1);
        else setProgress(1 - (cur - end) / (start - end));
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const words = text.split(' ');

  return (
    <p className="intro scrub-text" ref={containerRef}>
      {words.map((word, i) => {
        const wordProgress = words.length <= 1 ? 0 : i / (words.length - 1);
        return (
          <span
            key={i}
            style={{
              opacity: progress >= wordProgress ? 1 : 0.2,
              transition: 'opacity 0.2s ease-out',
            }}
          >
            {word}{' '}
          </span>
        );
      })}
    </p>
  );
}
