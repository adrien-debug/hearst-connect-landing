'use client';

import { useState, useEffect, useRef, useMemo, useId } from 'react';

// Internal SVG padding (px) — applied inside the dynamically-measured viewport
const PAD = 12;

export function HubSimulator() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `hsg-${uid}`;
  const glowId = `hsgw-${uid}`;

  const [investment, setInvestment] = useState(500_000);
  const [product, setProduct] = useState<'prime' | 'growth'>('prime');
  const apy = product === 'prime' ? 0.12 : 0.15;

  // Real pixel dimensions of the chart container, kept in state so any resize
  // triggers a re-render and the SVG redraws without distortion.
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 800, h: 240 });
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setDims({ w: Math.round(width), h: Math.round(height) });
    });

    observer.observe(el);

    // Seed with current size immediately
    const rect = el.getBoundingClientRect();
    setDims({ w: Math.round(rect.width), h: Math.round(rect.height) });

    return () => observer.disconnect();
  }, []);

  const { w, h } = dims;

  // Derived inner dimensions after padding
  const iw = Math.max(w - PAD * 2, 1);
  const ih = Math.max(h - PAD * 2, 1);
  const rightX = PAD + iw;
  const bottomY = PAD + ih;

  const { pathD, areaD, endX, endY, finalValue } = useMemo(() => {
    // Y scale anchored to 15% Growth ceiling so Prime vs Growth stay comparable
    const maxVal = investment * Math.pow(1.15, 3);
    const minVal = investment;
    const range = maxVal - minVal || 1;

    const coords: string[] = [];
    let ex = PAD;
    let ey = bottomY;

    for (let m = 0; m <= 36; m++) {
      const val = investment * Math.pow(1 + apy, m / 12);
      const x = PAD + (m / 36) * iw;
      const y = PAD + ih - ((val - minVal) / range) * ih;
      coords.push(`${m === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
      if (m === 36) { ex = x; ey = y; }
    }

    const pathStr = coords.join(' ');
    const areaStr = `${pathStr} L${rightX},${bottomY} L${PAD},${bottomY} Z`;
    const finalVal = investment * Math.pow(1 + apy, 3);

    return { pathD: pathStr, areaD: areaStr, endX: ex, endY: ey, finalValue: finalVal };
  }, [investment, apy, iw, ih, bottomY, rightX]);

  const profit = finalValue - investment;

  // Horizontal reference lines at 25 / 50 / 75% of inner height
  const refLines = [0.25, 0.5, 0.75].map((t) => PAD + ih * (1 - t));

  return (
    <section id="simulator" className="hub-simulator-section">
      <div className="hub-simulator-container">
        <div className="hub-simulator-header">
          <h2>Project your yield</h2>
          <p>Interactive 3-year forecast (illustrative; not a guarantee of future results).</p>
        </div>

        <div className="hub-simulator-grid">
          <div className="hub-simulator-controls">
            <div className="hub-simulator-toggle" role="group" aria-label="Product strategy">
              <button
                type="button"
                className={product === 'prime' ? 'active' : ''}
                onClick={() => setProduct('prime')}
                aria-pressed={product === 'prime'}
              >
                HashVault Prime (12%)
              </button>
              <button
                type="button"
                className={product === 'growth' ? 'active' : ''}
                onClick={() => setProduct('growth')}
                aria-pressed={product === 'growth'}
              >
                HashVault Growth (15%)
              </button>
            </div>

            <div className="hub-simulator-slider-container">
              <label htmlFor="hub-sim-allocation">Initial allocation</label>
              <div className="hub-simulator-value" aria-live="polite">
                ${investment.toLocaleString('en-US')}
              </div>
              <input
                id="hub-sim-allocation"
                type="range"
                min={250_000}
                max={5_000_000}
                step={50_000}
                value={investment}
                onChange={(e) => setInvestment(Number(e.target.value))}
                className="hub-simulator-slider"
              />
              <div className="hub-simulator-slider-labels">
                <span>$250k</span>
                <span>$5M+</span>
              </div>
            </div>

            <div className="hub-simulator-stats">
              <div className="stat-box">
                <span>Projected return (3Y)</span>
                <strong style={{ color: 'var(--dashboard-accent)' }}>
                  +${Math.round(profit).toLocaleString('en-US')}
                </strong>
              </div>
              <div className="stat-box">
                <span>Total value</span>
                <strong>${Math.round(finalValue).toLocaleString('en-US')}</strong>
              </div>
            </div>
          </div>

          {/* ResizeObserver target — SVG fills it exactly, no distortion */}
          <div className="hub-simulator-chart" ref={chartRef}>
            <svg
              viewBox={`0 0 ${w} ${h}`}
              width="100%"
              height="100%"
              aria-hidden
            >
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--dashboard-accent)" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="var(--dashboard-accent)" stopOpacity="0" />
                </linearGradient>
                {/* filterUnits="userSpaceOnUse" with generous bounds prevents glow clipping */}
                <filter
                  id={glowId}
                  filterUnits="userSpaceOnUse"
                  x={-PAD}
                  y={-PAD}
                  width={w + PAD * 2}
                  height={h + PAD * 2}
                >
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Dashed reference lines */}
              {refLines.map((y) => (
                <line
                  key={y}
                  x1={PAD}
                  y1={y}
                  x2={rightX}
                  y2={y}
                  stroke="var(--dashboard-border)"
                  strokeWidth="1"
                  strokeDasharray="5 7"
                />
              ))}

              {/* Solid baseline */}
              <line
                x1={PAD}
                y1={bottomY}
                x2={rightX}
                y2={bottomY}
                stroke="var(--dashboard-border-mid)"
                strokeWidth="1"
              />

              {/* Area fill */}
              <path d={areaD} fill={`url(#${gradId})`} />

              {/* Glowing line — keyed on product so animation replays on product switch */}
              <path
                key={product}
                d={pathD}
                fill="none"
                stroke="var(--dashboard-accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter={`url(#${glowId})`}
                className="chart-line-anim"
              />

              {/* Endpoint dot */}
              <circle
                cx={endX}
                cy={endY}
                r="6"
                fill="var(--dashboard-page)"
                stroke="var(--dashboard-accent)"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
