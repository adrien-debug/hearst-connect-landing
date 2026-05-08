'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CTA_LINKS } from '@/config/navigation';
import { HearstConnectLogo } from './HearstConnectLogo';
import { prefersReducedMotion } from '@/lib/reduced-motion';

function ScrambleText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(text);
      return;
    }

    let intervalId: number | undefined;
    const timeoutId = window.setTimeout(() => {
      let iteration = 0;
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
      intervalId = window.setInterval(() => {
        setDisplay(
          text
            .split('')
            .map((char, index) => {
              if (char === ' ') return ' ';
              if (index < iteration) return char;
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('')
        );
        if (iteration >= text.length) {
          if (intervalId) window.clearInterval(intervalId);
          intervalId = undefined;
          return;
        }
        iteration += 0.5;
      }, 30);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [text, delay]);

  return <span>{display || '\u00A0'}</span>;
}


export function HubHero() {
  const handleMagneticMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  };

  const handleMagneticLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const btn = e.currentTarget;
    btn.style.transform = `translate(0px, 0px)`;
  };

  return (
    <section id="welcome" className="center" lang="en">
      <div className="hero-cyber-grid"></div>
      <HearstConnectLogo className="welcome-logo" style={{ display: 'block', height: 135, width: 400, maxWidth: '100%' }} />

      <h1 className="welcome-title hub-chapter hero-reveal">
        <span className="hero-reveal-line">
          <ScrambleText text="Turning bitcoin mining" delay={100} />
        </span>
        <br />
        <span className="hero-reveal-line" style={{ color: 'var(--dashboard-accent)' }}>
          <ScrambleText text="into structured yield." delay={600} />
        </span>
      </h1>
      <div className="hub-chapter hero-reveal-btn" style={{ display: 'inline-block' }}>
        <Link 
          href={CTA_LINKS.launchApp.href} 
          className="welcome-btn magnetic-btn" 
          prefetch
          onMouseMove={handleMagneticMove}
          onMouseLeave={handleMagneticLeave}
        >
          <span>{CTA_LINKS.launchApp.label}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ marginLeft: '4px' }}>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
