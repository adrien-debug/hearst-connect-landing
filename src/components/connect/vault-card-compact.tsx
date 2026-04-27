'use client'

import { useState } from 'react'
import { TOKENS, fmtUsdCompact, VALUE_LETTER_SPACING, CHART_PALETTE } from './constants'
import { formatVaultName } from './formatting'
import { ActionButton } from './action-button'
import { getDaysToMaturity } from './utils/portfolio-chart-utils'
import type { ActiveVault } from './data'
import type { SmartFitMode } from './smart-fit'
import { riskColor } from './available-vaults-panel'

interface VaultCardCompactProps {
  vault: ActiveVault
  index: number
  total: number
  mode: SmartFitMode
  onClick?: () => void
  onClaim?: () => void
  onExit?: () => void
  /** Most-recent claim event for this vault (used for the "last claim" row). */
  lastClaim?: { amount: number; timestamp: number } | null
}

function relativeTime(ts: number): string {
  const delta = Math.max(0, Date.now() - ts)
  const m = Math.floor(delta / 60_000)
  if (m < 60) return `${Math.max(1, m)}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export function VaultCardCompact({ vault, index, mode, onClick, onClaim, onExit, lastClaim }: VaultCardCompactProps) {
  const color = CHART_PALETTE[index % CHART_PALETTE.length]
  const daysToMaturity = getDaysToMaturity(vault.lockedUntil)
  const [isHovered, setIsHovered] = useState(false)

  const canClaim = vault.claimable > 0
  const canExit = vault.canWithdraw || daysToMaturity <= 0
  const showActions = isHovered && (canClaim || canExit)
  const risk = vault.risk
  const riskBadgeColor = risk ? riskColor(risk) : TOKENS.colors.textGhost

  return (
    <div
      onClick={!showActions ? onClick : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      style={{
        background: isHovered ? TOKENS.colors.bgSurface : TOKENS.colors.bgTertiary,
        borderRadius: TOKENS.radius.md,
        padding: mode === 'limit'
          ? `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`
          : mode === 'tight'
            ? `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`
            : `${TOKENS.spacing[3]} ${TOKENS.spacing[5]}`,
        border: `${TOKENS.borders.thin} solid ${isHovered ? TOKENS.colors.borderStrong : TOKENS.colors.borderSubtle}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: TOKENS.transitions.fast,
        display: 'flex',
        alignItems: 'center',
        gap: TOKENS.spacing[3],
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
        gap: TOKENS.spacing[2],
        opacity: showActions ? 0.3 : 1,
        transition: `opacity ${TOKENS.transitions.durFast}`,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: TOKENS.spacing[2],
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: TOKENS.spacing[2],
            minWidth: 0,
            fontSize: mode === 'limit' ? TOKENS.fontSizes.xs : TOKENS.fontSizes.sm,
            fontWeight: TOKENS.fontWeights.black,
            color: TOKENS.colors.textPrimary,
            textTransform: 'uppercase',
            letterSpacing: VALUE_LETTER_SPACING,
            overflow: 'hidden',
          }}>
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {formatVaultName(vault.name)}
            </span>
            {risk && mode !== 'limit' && (
              <span
                title={`${risk} risk`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: TOKENS.spacing[1],
                  padding: `${TOKENS.spacing.half} ${TOKENS.spacing[2]}`,
                  borderRadius: TOKENS.radius.full,
                  background: 'rgba(var(--brand-accent-rgb), 0.08)',
                  border: `${TOKENS.borders.thin} solid rgba(var(--brand-accent-rgb), 0.25)`,
                  fontFamily: TOKENS.fonts.mono,
                  fontSize: TOKENS.fontSizes.nano,
                  fontWeight: TOKENS.fontWeights.bold,
                  color: riskBadgeColor,
                  letterSpacing: TOKENS.letterSpacing.display,
                  flexShrink: 0,
                }}
              >
                <span style={{ width: 4, height: 4, borderRadius: TOKENS.radius.full, background: riskBadgeColor }} />
                {risk}
              </span>
            )}
          </span>
          <span style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 0,
            flexShrink: 0,
          }}>
            <span style={{
              fontSize: mode === 'limit' ? TOKENS.fontSizes.sm : TOKENS.fontSizes.md,
              fontWeight: TOKENS.fontWeights.black,
              color: TOKENS.colors.textPrimary,
              letterSpacing: VALUE_LETTER_SPACING,
              lineHeight: 1.1,
            }}>
              {fmtUsdCompact(vault.deposited + vault.claimable)}
            </span>
            <span style={{
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.nano,
              fontWeight: TOKENS.fontWeights.bold,
              color: TOKENS.colors.textGhost,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
            }}>
              {vault.apr.toFixed(1)}% APR
            </span>
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
            height: TOKENS.dot.md,
            background: TOKENS.colors.black,
            borderRadius: TOKENS.radius.full,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.min(100, vault.progress)}%`,
              height: '100%',
              background: vault.progress >= 100 ? TOKENS.colors.accent : color,
              borderRadius: TOKENS.radius.full,
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

        {lastClaim && mode !== 'limit' && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            fontFamily: TOKENS.fonts.mono,
            fontSize: TOKENS.fontSizes.nano,
            color: TOKENS.colors.textGhost,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
          }}>
            <span>Last claim · {relativeTime(lastClaim.timestamp)}</span>
            <span style={{ color: TOKENS.colors.accent, fontWeight: TOKENS.fontWeights.bold }}>
              +{fmtUsdCompact(lastClaim.amount)}
            </span>
          </div>
        )}
      </div>

      {/* Mini yield indicator */}
      <div style={{
        textAlign: 'right',
        flexShrink: 0,
        opacity: showActions ? 0.3 : 1,
        transition: `opacity ${TOKENS.transitions.durFast}`,
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
