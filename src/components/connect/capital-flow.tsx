'use client'

import { memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useVaultData } from '@/hooks/useVaultData'
import { useUserPosition } from '@/hooks/useUserPosition'
import { useRewards } from '@/hooks/useRewards'

const spring = { type: 'spring' as const, stiffness: 80, damping: 20 }

export const CapitalFlow = memo(function CapitalFlow() {
  const { totalDeposits, annualAPR } = useVaultData()
  const { depositAmount, isConnected } = useUserPosition()
  const { pending } = useRewards()

  const depositNum = parseFloat(depositAmount) || 0
  const totalNum = parseFloat(totalDeposits) || 1
  const pendingNum = parseFloat(pending) || 0

  const userShare = useMemo(
    () => (totalNum > 0 ? Math.min(1, depositNum / totalNum) : 0),
    [depositNum, totalNum],
  )

  return (
    <div
      className="capital-flow"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '180px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      {/* Base layer: total vault */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--dashboard-text-xs)',
            letterSpacing: 'var(--dashboard-letter-spacing-panel-label)',
            color: 'var(--dashboard-text-muted)',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}
        >
          Vault Flow
        </div>

        {/* Total deposits bar */}
        <div
          style={{
            position: 'relative',
            height: '48px',
            background: 'var(--dashboard-surface)',
            borderRadius: 'var(--dashboard-radius-sm)',
            overflow: 'hidden',
            border: '1px solid var(--dashboard-border)',
          }}
        >
          {/* User share layer */}
          <AnimatePresence>
            {isConnected && depositNum > 0 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: userShare }}
                exit={{ scaleX: 0 }}
                transition={spring}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'var(--dashboard-accent-dim)',
                  transformOrigin: 'left',
                  borderRight: '1px solid var(--dashboard-accent)',
                }}
              />
            )}
          </AnimatePresence>

          {/* Reward growth layer (animated pulse) */}
          <AnimatePresence>
            {isConnected && pendingNum > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.04, 0.12, 0.04] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${userShare * 100}%`,
                  background:
                    'linear-gradient(90deg, transparent, var(--dashboard-accent))',
                  pointerEvents: 'none',
                }}
              />
            )}
          </AnimatePresence>

          {/* Value overlay */}
          <div
            style={{
              position: 'relative',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 1rem',
              zIndex: 1,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--dashboard-text-sm)',
                color: 'var(--dashboard-text-primary)',
                fontWeight: 600,
              }}
            >
              ${formatCompact(totalNum)}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--dashboard-text-xs)',
                color: 'var(--dashboard-accent)',
              }}
            >
              {annualAPR.toFixed(1)}% APR
            </span>
          </div>
        </div>
      </div>

      {/* User position layer */}
      <AnimatePresence>
        {isConnected && depositNum > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <Metric label="Your Position" value={`$${formatCompact(depositNum)}`} />
            <Metric
              label="Pending Rewards"
              value={`$${formatCompact(pendingNum)}`}
              accent
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--dashboard-text-xs)',
          letterSpacing: 'var(--dashboard-letter-spacing-panel-label)',
          color: 'var(--dashboard-text-muted)',
          textTransform: 'uppercase',
          marginBottom: '0.25rem',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--dashboard-text-lg)',
          fontWeight: 600,
          color: accent ? 'var(--dashboard-accent)' : 'var(--dashboard-text-primary)',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(2)
}
