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

const palette = [TOKENS.colors.accent, TOKENS.colors.white, 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0.35)']

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
        background: TOKENS.colors.black,
        borderRadius: TOKENS.radius.md,
        padding: mode === 'limit' ? `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}` : `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
        border: `1px solid ${isHovered ? TOKENS.colors.borderStrong : TOKENS.colors.borderSubtle}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 120ms ease-out',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Color dot */}
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }} />

      {/* Main content */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        opacity: showActions ? 0.3 : 1,
        transition: 'opacity 150ms ease-out',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{
            fontSize: mode === 'limit' ? '11px' : '12px',
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
            fontSize: '12px',
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
          gap: '8px',
        }}>
          <div style={{
            flex: 1,
            height: '2px',
            background: TOKENS.colors.bgTertiary,
            borderRadius: '1px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.min(100, vault.progress)}%`,
              height: '100%',
              background: vault.progress >= 100 ? TOKENS.colors.accent : color,
              borderRadius: '1px',
            }} />
          </div>
          <span style={{
            fontSize: '10px',
            fontWeight: TOKENS.fontWeights.bold,
            color: TOKENS.colors.textGhost,
            letterSpacing: '0.1em',
            flexShrink: 0,
          }}>
            {vault.progress}%
          </span>
          <span style={{
            fontSize: '10px',
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
          fontSize: '10px',
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
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: TOKENS.spacing[2],
            padding: TOKENS.spacing[2],
            animation: 'fadeIn 150ms ease-out',
            backdropFilter: 'blur(2px)',
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

