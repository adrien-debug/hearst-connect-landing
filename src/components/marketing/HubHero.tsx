'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CTA_LINKS } from '@/config/navigation';

function ScrambleText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

/** Inline Hearst Connect wordmark — bypasses Next.js Image optimization and the
 * embedded <defs><style> pattern in the source SVG that some renderers handle
 * unreliably. Fills are explicit on each path so the logo always renders. */
function HearstConnectWordmark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="572 466 791 268"
      width="400"
      height="135"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Hearst Connect"
      style={{ display: 'block', height: 135, width: 400, maxWidth: '100%' }}
    >
      <g>
        <path fill="#fff" d="M751.5,546.1v47.4h79.4l-7.4,16.3h-100.4v-142.3h119l-9.4,15.7h-81.2v47.4h43l-7.6,15.5h-35.4,0Z" />
        <path fill="#fff" d="M1227.2,473.1h135.1l-19.2,18.8h-34v117.9h-28.7v-117.9h-34.9l-18.3-18.8h0Z" />
        <path fill="#fff" d="M1040.6,531.6h19.2c11.9,0,21.6-9.4,21.6-20.9s-9.7-20.9-21.6-20.9h-41.8v120h-28.7v-142.3h70.6c24.7,0,44.7,19.4,44.7,43.2s-18,41.2-41,43.1l58.8,56.9h-30.6l-51.1-46.5v-32.6h0Z" />
        <path fill="#fff" d="M918.7,467.4h-21.3l-57.7,142.3h29l39.4-97.1,39.4,97.1h29l-57.7-142.3h-.1Z" />
        <path fill="#fff" d="M1226,549.1c-3.2-3.1-7.2-6.1-12-9s-9.3-5.2-13.3-6.9-8.5-3.4-13.5-5.2c-2.2-.8-4.8-1.6-7.8-2.7-5.7-2-10.1-3.6-13-4.7-2.9-1.1-5.9-2.5-8.9-4.1s-5.2-3.2-6.6-4.9c-1.4-1.7-2.3-3.8-2.8-6.1,0-1.1-.2-2.4-.2-3.9s.4-3.1,1.2-5.1c.8-2,1.8-3.8,3.1-5.4,4.9-5.9,13.1-8.9,24.4-8.9s20.3,3.6,28.2,10.8h26.2c-11.8-16.8-30-25.1-54.8-25.1s-13.8.8-19.8,2.5c-6.1,1.6-11.2,3.8-15.3,6.5-4.1,2.7-7.6,5.8-10.6,9.4s-5.1,7.1-6.4,10.6-1.9,6.9-1.9,10.2.3,6.3,1.1,9.2c.7,2.8,1.9,5.5,3.5,7.9s3.2,4.5,4.8,6.4c1.6,1.9,3.7,3.7,6.6,5.5,2.8,1.8,5.2,3.2,7.1,4.3,2,1.1,4.7,2.4,8.1,3.9s6.2,2.5,8.1,3.2,4.7,1.7,8.2,2.9l5.7,1.9c5.6,1.9,9.9,3.4,12.9,4.6,3,1.2,6.2,2.6,9.6,4.2,3.4,1.6,5.9,3.1,7.5,4.5s3,3,4,4.8c1.1,1.8,1.6,3.9,1.6,6.2,0,6.4-2.8,11.6-8.4,15.4-5.6,3.8-12,5.8-19.2,5.8-16.9,0-28.3-4.7-34.5-14.1h-23.1c3.3,8.6,9,15.4,17.1,20.4,9.7,6.1,22,9.2,36.9,9.2s13.8-.7,20.3-2.1c6.5-1.4,12.6-3.5,18.4-6.4,5.7-2.9,10.3-7,13.7-12.2,3.4-5.2,5.1-11.3,5.1-18.1s-1.1-9.6-3.2-14c-2.2-4.4-4.8-8.2-8-11.2h0v-.2h0Z" />
        <polygon fill="#a7fb90" points="601.7 466.9 572.6 466.9 572.6 609.7 601.7 609.7 601.7 549.1 633.1 579.4 665.8 579.4 601.7 517.5 601.7 466.9" />
        <polygon fill="#a7fb90" points="672.7 466.9 672.7 528.1 644.6 500.9 612 500.9 672.7 559.7 672.7 609.7 701.9 609.7 701.9 466.9 672.7 466.9" />
      </g>
      <g>
        <path fill="#a7fb90" d="M887.2,630.1c25.1,0,35.8,15.4,36.4,27.8v1.7h-12.8c-.6-7.6-6.4-17.9-23.4-17.9s-26.9,11-26.9,30.3,9.8,30.3,26.9,30.3,22.8-10.5,23.7-18.4h12.8v1.7c-1,12.8-11.5,28.4-36.7,28.4s-40.7-15.2-40.7-41.9,15.3-41.9,40.7-41.9h0Z" />
        <path fill="#a7fb90" d="M962.5,653.2c18,0,30.6,10.5,30.6,30.3s-12.6,30.3-30.6,30.3-30.5-10.5-30.5-30.3,12.6-30.3,30.5-30.3ZM962.5,703.4c10.3,0,17.1-7,17.1-19.9s-6.8-19.8-17.1-19.8-17,7-17,19.8,6.8,19.9,17,19.9Z" />
        <path fill="#a7fb90" d="M1017.4,654.5v6.4h.9c4-5.4,10.4-7.6,18.3-7.6,13.7,0,22.1,7,22.1,21.2v37.9h-13.3v-36.7c0-8-4.3-11.8-12.2-11.8s-15.4,4.9-15.4,16.1v32.4h-13.3v-57.9h12.9Z" />
        <path fill="#a7fb90" d="M1085.7,654.5v6.4h.9c4-5.4,10.4-7.6,18.3-7.6,13.7,0,22.1,7,22.1,21.2v37.9h-13.3v-36.7c0-8-4.3-11.8-12.2-11.8s-15.4,4.9-15.4,16.1v32.4h-13.3v-57.9h12.9Z" />
        <path fill="#a7fb90" d="M1166.9,653.2c17.4,0,27.5,10.5,27.5,28v5.9h-43.8c.2,9.7,6.2,16.5,16.2,16.5s13.8-5.2,14.7-9.5h11.7v1.7c-1.6,7.6-8.5,18.1-26.2,18.1s-29.1-10.4-29.1-30.3,11.4-30.3,29-30.3h0ZM1181.9,677.2c0-7.9-5.2-14-15.2-14s-15.2,6.2-15.9,14h31.1Z" />
        <path fill="#a7fb90" d="M1232.5,653.2c17.4,0,26.1,10.3,26.9,20.4v1.7h-12.3c-.5-5.4-4.2-11.6-14.2-11.6s-16.8,7.1-16.8,19.8,6.5,19.8,16.8,19.8,13.7-6.2,14.4-12h12.4v1.7c-.9,10.5-9.5,20.8-27.1,20.8s-29.8-10.4-29.8-30.3,12.2-30.3,29.8-30.3h-.1Z" />
        <path fill="#a7fb90" d="M1277.8,654.5v-15.4h13.3v15.4h16.4v10.3h-16.4v35.8l.9.9h15.2v11h-13.4c-10,0-16-5.2-16-15v-32.6h-12.9v-10.3h12.9Z" />
      </g>
    </svg>
  );
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
      <HearstConnectWordmark className="welcome-logo" />

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
