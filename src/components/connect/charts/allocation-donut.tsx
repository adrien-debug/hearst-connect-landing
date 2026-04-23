'use client'

import { useMemo, useState } from 'react'
import { TOKENS, fmtUsd, fmtUsdCompact, VALUE_LETTER_SPACING } from '../constants'
import { CHART_PALETTE } from '../constants/theme'
import { fitValue, type SmartFitMode } from '../smart-fit'

type DonutVaultItem = {
  id: string
  name: string
  color: string
  pct: number
  value: number
  claimable: number
}

interface AllocationDonutProps {
  data: DonutVaultItem[]
  total: number
  mode: SmartFitMode
  compact?: boolean
  onSegmentClick?: (vaultId: string) => void
}

export function AllocationDonut({
  data,
  total,
  mode,
  compact = false,
  onSegmentClick,
}: AllocationDonutProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const size = compact
    ? fitValue(mode, { normal: 140, tight: 120, limit: 100 })
    : fitValue(mode, { normal: 200, tight: 160, limit: 140 })
  const strokeWidth = compact
    ? fitValue(mode, { normal: 18, tight: 16, limit: 14 })
    : fitValue(mode, { normal: 24, tight: 20, limit: 16 })
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  // Pre-calculate all segment geometry to avoid math in render
  const segments = useMemo(() => {
    let offsetCursor = 0
    return data.map((vault) => {
      const rawPct = total > 0 ? vault.pct / 100 : 0
      const dash = circumference * rawPct
      const segment = {
        dash,
        gap: circumference - dash,
        offset: -offsetCursor,
        color: vault.color,
        id: vault.id,
        name: vault.name,
        value: vault.value,
        claimable: vault.claimable,
        pct: vault.pct,
      }
      offsetCursor += dash
      return segment
    })
  }, [data, circumference, total])

  const hoveredSegment = hoveredId ? segments.find(s => s.id === hoveredId) : null

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: size,
        height: size,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={TOKENS.colors.bgTertiary}
          strokeWidth={strokeWidth}
        />
        {/* Data segments */}
        {segments.map((segment) => (
          <circle
            key={segment.id}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={hoveredId === segment.id ? strokeWidth + 4 : strokeWidth}
            strokeDasharray={`${segment.dash} ${segment.gap}`}
            strokeDashoffset={segment.offset}
            strokeLinecap="round"
            style={{
              cursor: onSegmentClick ? 'pointer' : 'default',
              transition: 'all 150ms ease-out',
              filter: hoveredId === segment.id ? 'drop-shadow(0 0 8px ' + segment.color + ')' : 'none',
            }}
            onMouseEnter={() => setHoveredId(segment.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onSegmentClick?.(segment.id)}
          />
        ))}
      </svg>

      {/* Center content - value display */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ zIndex: 1 }}
      >
        {hoveredSegment ? (
          <>
            <div
              style={{
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.bold,
                textTransform: 'uppercase',
                color: hoveredSegment.color,
                letterSpacing: '0.05em',
                maxWidth: '80%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {hoveredSegment.name.replace('HashVault ', '')}
            </div>
            <div
              style={{
                fontSize: fitValue(mode, { normal: TOKENS.fontSizes.lg, tight: TOKENS.fontSizes.md, limit: TOKENS.fontSizes.sm }),
                fontWeight: TOKENS.fontWeights.black,
                color: TOKENS.colors.textPrimary,
                letterSpacing: VALUE_LETTER_SPACING,
                marginTop: TOKENS.spacing[2],
              }}
            >
              {fmtUsdCompact(hoveredSegment.value)}
            </div>
            <div
              style={{
                fontSize: TOKENS.fontSizes.micro,
                color: TOKENS.colors.textSecondary,
                marginTop: TOKENS.spacing[2],
              }}
            >
              {hoveredSegment.pct.toFixed(1)}%
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                fontSize: fitValue(mode, { normal: TOKENS.fontSizes.xl, tight: TOKENS.fontSizes.lg, limit: TOKENS.fontSizes.md }),
                fontWeight: TOKENS.fontWeights.black,
                color: TOKENS.colors.textPrimary,
                letterSpacing: VALUE_LETTER_SPACING,
              }}
            >
              {fmtUsdCompact(total)}
            </div>
            <div
              style={{
                fontSize: TOKENS.fontSizes.micro,
                fontWeight: TOKENS.fontWeights.bold,
                textTransform: 'uppercase',
                color: TOKENS.colors.textSecondary,
                letterSpacing: '0.1em',
                marginTop: TOKENS.spacing[2],
              }}
            >
              Total
            </div>
          </>
        )}
      </div>

      {/* Floating tooltip on hover */}
      {hoveredSegment && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: TOKENS.colors.bgTertiary,
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
            borderRadius: TOKENS.radius.md,
            padding: `${TOKENS.spacing[3]}px ${TOKENS.spacing[4]}px`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 10,
            animation: 'fadeIn 150ms ease-out',
            minWidth: TOKENS.spacing[18],
          }}
        >
          <div style={{
            fontSize: TOKENS.fontSizes.micro,
            fontWeight: TOKENS.fontWeights.bold,
            textTransform: 'uppercase',
            color: hoveredSegment.color,
            marginBottom: TOKENS.spacing[2],
          }}>
            {hoveredSegment.name}
          </div>
          <div style={{
            fontSize: TOKENS.fontSizes.sm,
            fontWeight: TOKENS.fontWeights.black,
            color: TOKENS.colors.textPrimary,
            letterSpacing: VALUE_LETTER_SPACING,
          }}>
            {fmtUsd(hoveredSegment.value)}
          </div>
          <div style={{
            fontSize: TOKENS.fontSizes.micro,
            color: TOKENS.colors.textSecondary,
            marginTop: TOKENS.spacing[2],
          }}>
            {hoveredSegment.pct.toFixed(1)}% · Claimable: {fmtUsdCompact(hoveredSegment.claimable)}
          </div>
        </div>
      )}
    </div>
  )
}
