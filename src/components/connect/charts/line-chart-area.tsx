'use client'

import { useMemo } from 'react'
import { TOKENS, fmtUsdCompact, VALUE_LETTER_SPACING } from '../constants'
import { fitValue, type SmartFitMode } from '../smart-fit'

interface LineChartAreaProps {
  data: number[]
  portfolioValue: number
  mode: SmartFitMode
}

export function LineChartArea({ data, portfolioValue, mode }: LineChartAreaProps) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const startValue = data[0]
  const change = ((portfolioValue - startValue) / startValue) * 100
  const isPositive = change >= 0

  // Chart dimensions
  const width = 400
  const height = 120
  const padding = { top: 10, right: 10, bottom: 20, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Generate points
  const points = useMemo(() => {
    return data.map((value, i) => ({
      x: padding.left + (i / (data.length - 1)) * chartWidth,
      y: padding.top + chartHeight - ((value - min) / range) * chartHeight,
    }))
  }, [data, min, max, range, chartWidth, chartHeight])

  // Create area path
  const areaPath = useMemo(() => {
    return [
      `M ${points[0].x} ${padding.top + chartHeight}`,
      ...points.map((p) => `L ${p.x} ${p.y}`),
      `L ${points[points.length - 1].x} ${padding.top + chartHeight}`,
      'Z',
    ].join(' ')
  }, [points, chartHeight])

  const linePath = useMemo(() => {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  }, [points])

  // Y-axis labels
  const yLabels = useMemo(() => {
    return [min, (min + max) / 2, max].map((v) => fmtUsdCompact(v))
  }, [min, max])

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: TOKENS.spacing[2],
      }}>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.micro,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          color: TOKENS.colors.textSecondary,
        }}>
          Value Evolution (30D)
        </span>
        <span style={{
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          color: isPositive ? TOKENS.colors.accent : TOKENS.colors.white,
        }}>
          {isPositive ? '+' : ''}{change.toFixed(1)}%
        </span>
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TOKENS.colors.accent} stopOpacity="0.3" />
            <stop offset="100%" stopColor={TOKENS.colors.accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + chartHeight * ratio}
            x2={width - padding.right}
            y2={padding.top + chartHeight * ratio}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
        ))}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((ratio, i) => (
          <text
            key={i}
            x={padding.left - 8}
            y={padding.top + chartHeight * ratio + 4}
            textAnchor="end"
            fill={TOKENS.colors.textGhost}
            fontSize="9"
            fontFamily={TOKENS.fonts.mono}
          >
            {yLabels[i]}
          </text>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={TOKENS.colors.accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Current value dot */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="4"
          fill={TOKENS.colors.accent}
          stroke={TOKENS.colors.black}
          strokeWidth="2"
        />

        {/* X-axis labels */}
        <text x={padding.left} y={height - 5} fill={TOKENS.colors.textGhost} fontSize="9" fontFamily={TOKENS.fonts.mono}>
          30d ago
        </text>
        <text x={width - padding.right} y={height - 5} textAnchor="end" fill={TOKENS.colors.textGhost} fontSize="9" fontFamily={TOKENS.fonts.mono}>
          Today
        </text>
      </svg>
    </div>
  )
}
