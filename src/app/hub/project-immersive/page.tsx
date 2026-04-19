'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { SmoothScrollProvider } from '@/components/marketing/smooth-scroll';

export default function ProjectImmersivePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const titleScale = useTransform(scrollYProgress, [0, 0.1], [1, 0.2]);
  const titleY = useTransform(scrollYProgress, [0, 0.1], ['0vh', '-45vh']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.05, 0.1], [1, 0.8, 0]);

  const pillOpacity = useTransform(scrollYProgress, [0.08, 0.12], [0, 1]);
  const pillWidth = useTransform(scrollYProgress, [0.1, 0.2], ['200px', '400px']);

  const auraScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.5]);
  const auraOpacity = useTransform(scrollYProgress, [0, 0.2], [0.8, 0.2]);

  const contentOpacity = useTransform(scrollYProgress, [0.15, 0.25], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.15, 0.25], [100, 0]);

  return (
    <SmoothScrollProvider>
      <div
        ref={containerRef}
        className="relative min-h-[300vh] overflow-hidden bg-[var(--dashboard-page)] text-[var(--dashboard-text-bright)] selection:bg-[var(--dashboard-overlay-10)]"
      >
        <motion.div
          className="fixed left-1/2 top-8 z-50 flex h-12 -translate-x-1/2 items-center justify-center overflow-hidden rounded-full border border-[var(--dashboard-border)]/40 bg-[var(--dashboard-overlay-05)] shadow-[var(--dashboard-shadow-lg)] backdrop-blur-xl"
          style={{
            opacity: pillOpacity,
            width: pillWidth,
          }}
        >
          <div className="flex w-full items-center justify-between px-6 text-sm font-medium tracking-wide">
            <span className="text-[var(--dashboard-text-muted)]">Project Alpha</span>
            <div className="flex items-center gap-2">
              <div className="size-2 animate-pulse rounded-full bg-[var(--dashboard-success)]" />
              <span className="text-[var(--dashboard-success)]">Active</span>
            </div>
          </div>
        </motion.div>

        <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden">
          <motion.div
            className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
            style={{ scale: auraScale, opacity: auraOpacity }}
          >
            <div className="h-[800px] w-[800px] rounded-full bg-gradient-to-tr from-[var(--dashboard-accent)]/30 via-[var(--dashboard-info)]/20 to-[var(--dashboard-success)]/30 blur-[120px] mix-blend-screen" />
          </motion.div>

          <motion.div
            className="relative z-10 flex flex-col items-center justify-center"
            style={{
              scale: titleScale,
              y: titleY,
              opacity: titleOpacity,
            }}
          >
            <h1 className="bg-gradient-to-b from-[var(--dashboard-text-bright)] to-[var(--dashboard-text-muted)] bg-clip-text text-center text-[12vw] font-black leading-none tracking-tighter text-transparent">
              PROJECT
              <br />
              <span className="bg-gradient-to-r from-[var(--dashboard-info)] to-[var(--dashboard-success)] bg-clip-text text-transparent">
                ALPHA
              </span>
            </h1>
            <p className="mt-8 text-xl font-medium uppercase tracking-widest text-[var(--dashboard-text-ghost)]">
              Scroll to explore
            </p>
          </motion.div>

          <motion.div
            className="absolute top-[30vh] z-20 w-full max-w-5xl px-8"
            style={{
              opacity: contentOpacity,
              y: contentY,
            }}
          >
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="flex h-64 flex-col justify-between rounded-3xl border border-[var(--dashboard-border)]/40 bg-[var(--dashboard-overlay-05)] p-6 backdrop-blur-md transition-colors duration-500 hover:bg-[var(--dashboard-overlay-08)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--dashboard-overlay-10)]">
                    <div className="size-4 rounded-full bg-[var(--dashboard-text-muted)]/50" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-[var(--dashboard-text-primary)]/90">
                      Metric {i}
                    </h3>
                    <p className="text-4xl font-light tracking-tight text-[var(--dashboard-text-bright)]">
                      {(Math.random() * 100).toFixed(1)}
                      <span className="text-2xl text-[var(--dashboard-text-muted)]">%</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-24 h-[60vh] rounded-[2.5rem] border border-[var(--dashboard-border)]/40 bg-gradient-to-b from-[var(--dashboard-overlay-05)] to-transparent p-12 backdrop-blur-sm">
              <h2 className="mb-4 text-3xl font-semibold text-[var(--dashboard-text-bright)]">
                Agent Network
              </h2>
              <p className="max-w-xl text-lg leading-relaxed text-[var(--dashboard-text-ghost)]">
                The neural pathways of your project are fully active. Data is being processed in
                real-time across 4 distinct nodes.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </SmoothScrollProvider>
  );
}
