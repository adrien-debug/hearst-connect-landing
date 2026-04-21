'use client'

import { memo } from 'react'
import { motion } from 'motion/react'
import { useEpoch } from '@/hooks/useEpoch'

export const TimeAxis = memo(function TimeAxis() {
  const { epoch, progress, countdownFormatted, shouldAdvance } = useEpoch()

  return (
    <div
      className="time-axis"
      style={{
        position: 'relative',
        width: '100%',
        padding: '2rem 0',
      }}
    >
      {/* Epoch label */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '0.75rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--dashboard-text-xs)',
            letterSpacing: 'var(--dashboard-letter-spacing-panel-label)',
            color: 'var(--dashboard-text-muted)',
            textTransform: 'uppercase',
          }}
        >
          Epoch {epoch}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--dashboard-text-xs)',
            color: shouldAdvance
              ? 'var(--dashboard-accent)'
              : 'var(--dashboard-text-ghost)',
          }}
        >
          {shouldAdvance ? 'READY' : countdownFormatted}
        </span>
      </div>

      {/* Track */}
      <div
        style={{
          position: 'relative',
          height: '2px',
          background: 'var(--dashboard-border)',
          borderRadius: '1px',
          overflow: 'hidden',
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--dashboard-accent)',
            transformOrigin: 'left',
          }}
          animate={{ scaleX: progress }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Epoch markers */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '0.5rem',
        }}
      >
        {Array.from({ length: Math.min(epoch + 1, 6) }, (_, i) => {
          const e = Math.max(0, epoch - 5) + i
          const isCurrent = e === epoch
          return (
            <div
              key={e}
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: isCurrent
                  ? 'var(--dashboard-accent)'
                  : 'var(--dashboard-text-ghost)',
                boxShadow: isCurrent
                  ? 'var(--dashboard-glow-accent-medium)'
                  : 'none',
              }}
            />
          )
        })}
      </div>
    </div>
  )
})
