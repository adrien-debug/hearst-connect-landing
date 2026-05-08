'use client';

import { useState, useMemo, useId } from 'react';

export function HubSimulator() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const chartGradientId = `hub-sim-grad-${uid}`;
  const chartGlowId = `hub-sim-glow-${uid}`;

  const [investment, setInvestment] = useState(500000);
  const [product, setProduct] = useState<'prime' | 'growth'>('prime');

  const apy = product === 'prime' ? 0.12 : 0.15;
  const years = 3;

  const points = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= years * 12; i++) {
      const t = i / 12;
      pts.push(investment * Math.pow(1 + apy, t));
    }
    return pts;
  }, [investment, apy]);

  const finalValue = points[points.length - 1];
  const profit = finalValue - investment;

  const chartWidth = 800;
  const chartHeight = 200;
  const minVal = investment;
  const maxVal = investment * Math.pow(1 + 0.15, years);
  const denom = maxVal - minVal || 1;

  const pathD = useMemo(() => {
    const last = points.length - 1;
    return points
      .map((val, i) => {
        const x = last === 0 ? 0 : (i / last) * chartWidth;
        const y =
          chartHeight - ((val - minVal) / denom) * chartHeight * 0.8 - 20;
        const safeY = Number.isFinite(y) ? y : chartHeight - 20;
        return `${i === 0 ? 'M' : 'L'} ${x} ${safeY}`;
      })
      .join(' ');
  }, [points, minVal, denom, chartWidth, chartHeight]);

  const areaD = `${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  const endCy =
    chartHeight -
    ((finalValue - minVal) / denom) * chartHeight * 0.8 -
    20;

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
                min={250000}
                max={5000000}
                step={50000}
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

          <div className="hub-simulator-chart">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id={chartGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--dashboard-accent)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--dashboard-accent)" stopOpacity="0" />
                </linearGradient>
                <filter id={chartGlowId}>
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <line
                x1="0"
                y1={chartHeight}
                x2={chartWidth}
                y2={chartHeight}
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1={chartHeight / 2}
                x2={chartWidth}
                y2={chartHeight / 2}
                stroke="rgba(0,0,0,0.06)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />

              <path d={areaD} fill={`url(#${chartGradientId})`} />

              <path
                key={`${product}-${investment}`}
                d={pathD}
                fill="none"
                stroke="var(--dashboard-accent)"
                strokeWidth="3"
                filter={`url(#${chartGlowId})`}
                className="chart-line-anim"
              />

              <circle
                cx={chartWidth}
                cy={Number.isFinite(endCy) ? endCy : chartHeight - 20}
                r="6"
                fill="#fff"
                stroke="var(--dashboard-accent)"
                strokeWidth="3"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
