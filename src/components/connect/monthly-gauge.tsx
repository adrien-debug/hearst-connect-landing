'use client'

import { useMonthProgress } from '@/hooks/useMonthProgress'
import { TOKENS, fmtUsd, LINE_HEIGHT } from './constants'
import { fitValue, type SmartFitMode } from './smart-fit'
import { computeMonthlyYield } from './data'

interface MonthlyGaugeProps {
  deposited: number
  apr: number
  label?: string
  mode?: SmartFitMode
}

export function MonthlyGauge({ deposited, apr, label, mode = 'normal' }: MonthlyGaugeProps) {
  const { dayOfMonth, daysInMonth, progress } = useMonthProgress()
  const { monthlyYield, produced, remaining } = computeMonthlyYield(deposited, apr, dayOfMonth, daysInMonth)
  const nowPct = Math.max(2, Math.min(97, progress * 100))
  const rowGap = fitValue(mode, {
    normal: TOKENS.spacing[2],
    tight: TOKENS.spacing[2],
    limit: TOKENS.spacing[0],
  })
  const badgePadding = fitValue(mode, {
    normal: `2px ${TOKENS.spacing[2]}`,
    tight: `2px ${TOKENS.spacing[2]}`,
    limit: `2px ${TOKENS.spacing[2]}`,
  })
  const showSummary = mode !== 'limit'
  const showFirstMetric = mode !== 'limit'
  const showLabels = mode === 'normal'

  const monthLabel = label ?? `Monthly Yield · ${apr.toFixed(1)}% APR`

  return (
    <div>
      {/* Header row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: rowGap,
      }}>
        <div style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase' as const,
          color: TOKENS.colors.textPrimary,
          lineHeight: LINE_HEIGHT.tight,
        }}>
          {monthLabel}
        </div>
        {showSummary && (
          <div style={{
            fontFamily: TOKENS.fonts.mono,
            fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.bold,
            color: TOKENS.colors.textGhost,
            letterSpacing: TOKENS.letterSpacing.wide,
          }}>
            {fmtUsd(monthlyYield)} / month
          </div>
        )}
      </div>

      {/* Gauge track */}
      <div style={{ position: 'relative', marginBottom: rowGap }}>
        {/* DAY badge */}
        <div style={{
          position: 'absolute',
          left: `${nowPct}%`,
          bottom: '100%',
          transform: 'translateX(-50%)',
          marginBottom: rowGap,
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.wide,
          color: TOKENS.colors.textOnDark,
          background: TOKENS.colors.black,
          padding: badgePadding,
          whiteSpace: 'nowrap' as const,
          zIndex: 3,
        }}>
          DAY {String(dayOfMonth).padStart(2, '0')}
        </div>

        {/* Track */}
        <div style={{
          position: 'relative',
          height: mode === 'limit' ? '10px' : '12px',
          background: TOKENS.colors.gray200,
          overflow: 'visible',
        }}>
          {/* Elapsed fill */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${nowPct}%`,
            height: '100%',
            background: TOKENS.colors.accent,
            zIndex: 1,
          }} />
          {/* NOW tick */}
          <div style={{
            position: 'absolute',
            left: `${nowPct}%`,
            top: mode === 'limit' ? '-2px' : '-3px',
            height: mode === 'limit' ? '14px' : '18px',
            width: TOKENS.borders.thick,
            background: TOKENS.colors.black,
            zIndex: 4,
            transform: 'translateX(-1px)',
          }} />
        </div>
      </div>

      {/* Metrics row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: showFirstMetric ? '1fr 1fr 1fr' : '1fr 1fr',
        gap: 0,
      }}>
        {showFirstMetric && <MetricCell showLabel={showLabels} label="01" value={`+${fmtUsd(produced)}`} accent />}
        <MetricCell showLabel={showLabels} label="Today" value={`Day ${dayOfMonth}/${daysInMonth}`} center={!showFirstMetric} />
        {nowPct > 85
          ? <MetricCell showLabel={showLabels} label={String(daysInMonth)} value="Dist. imminent" right={showFirstMetric} />
          : <MetricCell showLabel={showLabels} label={String(daysInMonth)} value={`${fmtUsd(remaining)} left`} right={showFirstMetric} />
        }
      </div>
    </div>
  )
}

function MetricCell({
  label,
  value,
  accent,
  center,
  right,
  showLabel = true,
}: {
  label: string
  value: string
  accent?: boolean
  center?: boolean
  right?: boolean
  showLabel?: boolean
}) {
  return (
    <div style={{ textAlign: right ? 'right' : center ? 'center' : 'left' }}>
      {showLabel && (
        <div style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          color: TOKENS.colors.textGhost,
          letterSpacing: TOKENS.letterSpacing.wide,
          marginBottom: '2px',
          lineHeight: LINE_HEIGHT.tight,
        }}>{label}</div>
      )}
      <div style={{
        fontFamily: TOKENS.fonts.mono,
        fontSize: TOKENS.fontSizes.xs,
        fontWeight: TOKENS.fontWeights.bold,
        color: accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
        lineHeight: LINE_HEIGHT.tight,
      }}>{value}</div>
    </div>
  )
}
