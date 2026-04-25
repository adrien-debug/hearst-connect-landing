'use client'

import { useState } from 'react'
import { TOKENS, fmtUsdCompact, VALUE_LETTER_SPACING } from './constants'
import { formatVaultName } from './formatting'
import { ActionButton } from './action-button'
import type { ActiveVault } from './data'
import type { SmartFitMode } from './smart-fit'

interface VaultCardCompactProps {
  vault: ActiveVault
  index: number
  total: number
  mode: SmartFitMode
  onClick?: () => void
  onClaim?: () => void
  onExit?: () => void
}

const palette = [TOKENS.colors.accent, TOKENS.colors.white, TOKENS.colors.gray500, TOKENS.colors.textGhost]

export function VaultCardCompact({ vault, index, total, mode, onClick, onClaim, onExit }: VaultCardCompactProps) {
  const color = palette[index % palette.length]
  const daysToMaturity = Math.max(0, Math.ceil((new Date(vault.maturity).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  const [isHovered, setIsHovered] = useState(false)
  
  const canClaim = vault.claimable > 0
  const canExit = vault.canWithdraw || daysToMaturity <= 0
  const showActions = isHovered && (canClaim || canExit)

  return (
    <div
      onClick={!showActions ? onClick : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      style={{
        background: isHovered ? TOKENS.colors.bgSurface : TOKENS.colors.bgTertiary,
        borderRadius: TOKENS.radius.md,
        padding: mode === 'limit' ? `${TOKENS.spacing[4]} ${TOKENS.spacing[5]}` : `${TOKENS.spacing[6]} ${TOKENS.spacing[8]}`,
        border: `${TOKENS.borders.thin} solid ${isHovered ? TOKENS.colors.borderStrong : TOKENS.colors.borderSubtle}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 120ms ease-out',
        display: 'flex',
        alignItems: 'center',
        gap: TOKENS.spacing[4],
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Color dot */}
      <div style={{
        width: TOKENS.spacing[3],
        height: TOKENS.spacing[3],
        borderRadius: TOKENS.radius.full,
        background: color,
        flexShrink: 0,
      }} />

      {/* Main content */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: TOKENS.spacing[3],
        opacity: showActions ? 0.3 : 1,
        transition: 'opacity 150ms ease-out',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: TOKENS.spacing[2],
        }}>
          <span style={{
            fontSize: mode === 'limit' ? TOKENS.fontSizes.xs : TOKENS.fontSizes.sm,
            fontWeight: TOKENS.fontWeights.black,
            color: TOKENS.colors.textPrimary,
            textTransform: 'uppercase',
            letterSpacing: VALUE_LETTER_SPACING,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {formatVaultName(vault.name)}
          </span>
          <span style={{
            fontSize: mode === 'limit' ? TOKENS.fontSizes.sm : TOKENS.fontSizes.md,
            fontWeight: TOKENS.fontWeights.black,
            color: TOKENS.colors.textPrimary,
            letterSpacing: VALUE_LETTER_SPACING,
            flexShrink: 0,
          }}>
            {fmtUsdCompact(vault.deposited + vault.claimable)}
          </span>
        </div>

        {/* Progress bar inline */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: TOKENS.spacing[3],
        }}>
          <div style={{
            flex: 1,
            height: '12px',
            background: TOKENS.colors.black,
            borderRadius: TOKENS.borders.thin,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.min(100, vault.progress)}%`,
              height: '100%',
              background: vault.progress >= 100 ? TOKENS.colors.accent : color,
              borderRadius: TOKENS.borders.thin,
            }} />
          </div>
          <span style={{
            fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.bold,
            color: TOKENS.colors.textGhost,
            letterSpacing: TOKENS.letterSpacing.wide,
            flexShrink: 0,
          }}>
            {vault.progress}%
          </span>
          <span style={{
            fontSize: TOKENS.fontSizes.xs,
            color: daysToMaturity < 30 ? TOKENS.colors.accent : TOKENS.colors.textGhost,
            flexShrink: 0,
          }}>
            · {daysToMaturity}d
          </span>
        </div>
      </div>

      {/* Mini yield indicator */}
      <div style={{
        textAlign: 'right',
        flexShrink: 0,
        opacity: showActions ? 0.3 : 1,
        transition: 'opacity 150ms ease-out',
      }}>
        <span style={{
          fontSize: TOKENS.fontSizes.sm,
          fontWeight: TOKENS.fontWeights.bold,
          color: TOKENS.colors.accent,
        }}>
          +{fmtUsdCompact(vault.claimable)}
        </span>
      </div>

      {/* Quick Actions Overlay */}
      {showActions && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: TOKENS.colors.bgApp,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: TOKENS.spacing[2],
            padding: TOKENS.spacing[2],
            animation: 'fadeIn 150ms ease-out',
            backdropFilter: `blur(${TOKENS.spacing[1]})`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {canClaim && (
            <ActionButton
              label="Claim"
              variant="accent"
              onClick={(e) => {
                e.stopPropagation()
                onClaim?.()
              }}
            />
          )}
          <ActionButton
            label="View"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation()
              onClick?.()
            }}
          />
          {canExit && (
            <ActionButton
              label="Exit"
              variant="danger"
              onClick={(e) => {
                e.stopPropagation()
                onExit?.()
              }}
            />
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
