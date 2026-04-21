'use client'

import { useMonthProgress } from '@/hooks/useMonthProgress'
import { MONO, fmtUsd } from './constants'
import { computeMonthlyYield } from './data'

interface MonthlyGaugeProps {
  deposited: number
  apr: number
  label?: string
}

export function MonthlyGauge({ deposited, apr, label }: MonthlyGaugeProps) {
  const { dayOfMonth, daysInMonth, progress } = useMonthProgress()
  const { produced, remaining } = computeMonthlyYield(deposited, apr, dayOfMonth, daysInMonth)
  const nowPct = Math.max(2, Math.min(98, progress * 100))
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div style={{
        fontFamily: MONO,
        fontSize: '9px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--dashboard-text-ghost)',
        marginBottom: '10px',
      }}>
        {label ?? monthName} · {apr.toFixed(1)}% APR
      </div>

      {/* Gauge bar */}
      <div style={{
        position: 'relative',
        height: '220px',
        border: '1px solid var(--dashboard-border)',
        background: 'var(--dashboard-surface)',
        overflow: 'hidden',
        marginBottom: '6px',
      }}>
        {/* Fill */}
        <div style={{
          position: 'absolute',
          inset: 0,
          width: `${nowPct}%`,
          background: 'linear-gradient(90deg, var(--dashboard-accent-dim), var(--dashboard-accent-muted))',
          transition: 'width 1s ease',
        }} />

        {/* NOW marker */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${nowPct}%`,
          width: '2px',
          background: 'var(--dashboard-accent)',
          boxShadow: '0 0 8px var(--dashboard-accent-shadow)',
          zIndex: 2,
        }} />

        {/* Produced (left) */}
        <div style={{
          position: 'absolute',
          left: '24px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontFamily: MONO,
          fontSize: '28px',
          fontWeight: 700,
          color: 'var(--dashboard-accent)',
          zIndex: 3,
          whiteSpace: 'nowrap',
          letterSpacing: '-0.02em',
        }}>
          {fmtUsd(produced)}
        </div>

        {/* ~Remaining (right, discret) */}
        {remaining > 0 && nowPct < 85 && (
          <div style={{
            position: 'absolute',
            right: '24px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontFamily: MONO,
            fontSize: '14px',
            color: 'var(--dashboard-text-ghost)',
            zIndex: 3,
            whiteSpace: 'nowrap',
            opacity: 0.6,
          }}>
            ~{fmtUsd(remaining)}
          </div>
        )}
      </div>

      {/* Day markers */}
      <div style={{ position: 'relative', height: '14px' }}>
        <span style={{ position: 'absolute', left: 0, fontFamily: MONO, fontSize: '8px', letterSpacing: '0.08em', color: 'var(--dashboard-text-ghost)' }}>
          Day 1
        </span>
        <span style={{
          position: 'absolute',
          left: `${nowPct}%`,
          transform: 'translateX(-50%)',
          fontFamily: MONO,
          fontSize: '8px',
          letterSpacing: '0.08em',
          color: 'var(--dashboard-accent)',
        }}>
          Day {dayOfMonth}
        </span>
        <span style={{ position: 'absolute', right: 0, fontFamily: MONO, fontSize: '8px', letterSpacing: '0.08em', color: 'var(--dashboard-text-ghost)' }}>
          Day {daysInMonth}
        </span>
      </div>
    </div>
  )
}
