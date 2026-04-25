'use client'

import { TOKENS } from './constants'
import { fitValue, type SmartFitMode } from './smart-fit'

interface SkeletonProps {
  mode: SmartFitMode
}

/** Placeholder layout while vault detail data loads */
export function Skeleton({ mode }: SkeletonProps) {
  const basePulse = {
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    background: TOKENS.colors.bgTertiary,
    borderRadius: TOKENS.radius.sm,
  }

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <div
        style={{
          background: TOKENS.colors.bgSecondary,
          borderRadius: TOKENS.radius.lg,
          padding: fitValue(mode, {
            normal: TOKENS.spacing[4],
            tight: TOKENS.spacing[3],
            limit: TOKENS.spacing[3],
          }),
          border: `1px solid ${TOKENS.colors.borderSubtle}`,
        }}
      >
        <div style={{ marginBottom: TOKENS.spacing[4], display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ ...basePulse, width: TOKENS.spacing[20], height: TOKENS.spacing[5] }} />
          <div style={{ ...basePulse, width: TOKENS.spacing[16], height: TOKENS.spacing[5] }} />
        </div>
        <div style={{ ...basePulse, width: '70%', height: '40px', marginBottom: TOKENS.spacing[4] }} />
        <div
          style={{
            height: '4px',
            background: TOKENS.colors.black,
            borderRadius: TOKENS.radius.sm,
            marginBottom: TOKENS.spacing[2],
          }}
        >
          <div style={{ ...basePulse, width: '60%', height: '100%' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: TOKENS.spacing[3] }}>
          <div style={{ ...basePulse, width: TOKENS.spacing[16], height: TOKENS.spacing[3] }} />
          <div style={{ ...basePulse, width: TOKENS.spacing[16], height: TOKENS.spacing[3] }} />
        </div>
      </div>
    </>
  )
}
