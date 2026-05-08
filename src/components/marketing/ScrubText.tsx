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

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const start = windowHeight;
      const end = windowHeight * 0.4;

      const current = rect.top;

      if (current > start) {
        setProgress(0);
      } else if (current < end) {
        setProgress(1);
      } else {
        setProgress(1 - (current - end) / (start - end));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const words = text.split(' ');

  return (
    <p className="intro scrub-text" ref={containerRef}>
      {words.map((word, i) => {
        const wordProgress = words.length <= 1 ? 0 : i / (words.length - 1);
        const isVisible = progress >= wordProgress;
        return (
          <span
            key={i}
            style={{
              opacity: isVisible ? 1 : 0.2,
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
