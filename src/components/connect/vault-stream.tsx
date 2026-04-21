'use client'

import { memo } from 'react'
import { motion } from 'motion/react'
import { useUserPosition } from '@/hooks/useUserPosition'
import { useEpoch } from '@/hooks/useEpoch'

export const VaultStream = memo(function VaultStream() {
  const { lockEnd, lockTimeRemaining, canWithdraw, depositAmount, isConnected } =
    useUserPosition()
  const { epoch } = useEpoch()

  const depositNum = parseFloat(depositAmount) || 0
  if (!isConnected || depositNum === 0) return null

  const lockProgress = lockEnd > 0
    ? Math.max(0, 1 - lockTimeRemaining / (4 * 365 * 24 * 3600))
    : 0

  return (
    <div
      className="vault-stream"
      style={{
        position: 'relative',
        width: '100%',
        padding: '1.5rem 0',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--dashboard-text-xs)',
          letterSpacing: 'var(--dashboard-letter-spacing-panel-label)',
          color: 'var(--dashboard-text-muted)',
          textTransform: 'uppercase',
          marginBottom: '0.75rem',
        }}
      >
        Lock Constraint
      </div>

      {/* Lock visualization */}
      <div
        style={{
          position: 'relative',
          height: '6px',
          background: 'var(--dashboard-surface)',
          borderRadius: '3px',
          overflow: 'hidden',
          border: '1px solid var(--dashboard-border)',
        }}
      >
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: lockProgress }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: 'left',
            background: canWithdraw
              ? 'var(--dashboard-accent)'
              : 'var(--dashboard-warning)',
            borderRadius: '3px',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '0.5rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--dashboard-text-xs)',
            color: 'var(--dashboard-text-ghost)',
          }}
        >
          Epoch {epoch}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--dashboard-text-xs)',
            color: canWithdraw
              ? 'var(--dashboard-accent)'
              : 'var(--dashboard-warning)',
          }}
        >
          {canWithdraw ? 'UNLOCKED' : formatLockRemaining(lockTimeRemaining)}
        </span>
      </div>
    </div>
  )
})

function formatLockRemaining(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  if (days > 365) {
    const years = (days / 365).toFixed(1)
    return `${years}y locked`
  }
  if (days > 30) {
    const months = Math.floor(days / 30)
    return `${months}mo locked`
  }
  return `${days}d locked`
}
