'use client'

import { Label } from '@/components/ui/label'
import { TOKENS, fmtUsdCompact, LINE_HEIGHT, VALUE_LETTER_SPACING, MONO } from './constants'
import { formatVaultName } from './formatting'
import type { AvailableVault } from './data'
import { useSmartFit, useShellPadding, fitValue } from './smart-fit'
import type { SmartFitMode } from './smart-fit'
import { CockpitGauge } from './cockpit-gauge'

interface AvailableVaultsPanelProps {
  vaults: AvailableVault[]
  onVaultSelect: (vaultId: string) => void
  onBack?: () => void
}

export function AvailableVaultsPanel({ vaults, onVaultSelect }: AvailableVaultsPanelProps) {
  const { mode, isLimit } = useSmartFit({
    tightHeight: 740,
    limitHeight: 660,
    tightWidth: 940,
    limitWidth: 820,
    reserveHeight: 64,
    reserveWidth: 280,
  })
  const { padding: shellPadding, gap: shellGap } = useShellPadding(mode)

  // Get top 3 vaults for cockpit gauges (sorted by APR)
  const topVaults = [...vaults].sort((a, b) => b.apr - a.apr).slice(0, 3)
  const displayVaults = topVaults.length >= 3 ? topVaults : [...topVaults, ...Array(3 - topVaults.length).fill(null)]

  return (
    <div
      className="flex-1"
      suppressHydrationWarning
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'transparent',
        overflow: 'hidden',
        fontFamily: TOKENS.fonts.sans,
        height: '100%',
        color: TOKENS.colors.textPrimary,
      }}
    >
      {/* COCKPIT HEADER — Same structure as dashboard */}
      <div
        style={{
          padding: fitValue(mode, {
            normal: `${shellPadding}px`,
            tight: `${shellPadding * 0.75}px`,
            limit: `${shellPadding * 0.5}px`,
          }),
          borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
          flexShrink: 0,
          background: TOKENS.colors.bgApp,
        }}
      >
        {/* Top row — Context */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginBottom: TOKENS.spacing[3],
        }}>
          <div style={{
            fontFamily: MONO,
            fontSize: TOKENS.fontSizes.micro,
            color: TOKENS.colors.textGhost,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
          }}>
            {vaults.length} Available
          </div>
        </div>

        {/* Main cockpit gauges — Top 3 vaults */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: fitValue(mode, {
            normal: 'repeat(3, 1fr)',
            tight: 'repeat(3, 1fr)',
            limit: '1fr',
          }),
          gap: fitValue(mode, {
            normal: TOKENS.spacing[6],
            tight: TOKENS.spacing[4],
            limit: TOKENS.spacing[3],
          }),
        }}>
          {displayVaults.map((vault, index) => (
            <CockpitGauge
              key={vault?.id || `empty-${index}`}
              label={vault ? formatVaultName(vault.name) : '—'}
              value={vault ? `${vault.apr}%` : '—'}
              valueCompact={vault ? `${vault.apr}%` : '—'}
              subtext={vault ? `${vault.target} target · ${vault.lockPeriod}` : 'No vault'}
              mode={mode}
              primary={index === 0}
              accent={index === 0}
              onClick={vault ? () => onVaultSelect(vault.id) : undefined}
              align="center"
            />
          ))}
        </div>
      </div>

      {/* Vault Cards Grid */}
      <div
        className="hide-scrollbar"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: shellPadding,
          gap: shellGap,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: fitValue(mode, {
            normal: 'repeat(2, 1fr)',
            tight: 'repeat(2, 1fr)',
            limit: '1fr',
          }),
          gap: TOKENS.spacing[4],
        }}>
          {vaults.map((vault, index) => (
            <AvailableVaultCard
              key={vault.id}
              vault={vault}
              index={index}
              mode={mode}
              onClick={() => onVaultSelect(vault.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface AvailableVaultCardProps {
  vault: AvailableVault
  index: number
  mode: SmartFitMode
  onClick: () => void
}

const palette = [TOKENS.colors.accent, TOKENS.colors.white]

function AvailableVaultCard({ vault, index, mode, onClick }: AvailableVaultCardProps) {
  const accentColor = palette[index % palette.length]
  const targetPct = parseFloat(vault.target.replace('%', '')) || 0

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      style={{
        background: TOKENS.colors.black,
        borderRadius: TOKENS.radius.lg,
        padding: fitValue(mode, {
          normal: TOKENS.spacing[6],
          tight: TOKENS.spacing[4],
          limit: TOKENS.spacing[3],
        }),
        border: `1px solid ${TOKENS.colors.borderSubtle}`,
        cursor: 'pointer',
        transition: 'all 200ms ease-out',
        display: 'flex',
        flexDirection: 'column',
        gap: TOKENS.spacing[4],
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = TOKENS.colors.accent
        e.currentTarget.style.background = TOKENS.colors.bgSecondary
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = TOKENS.colors.borderSubtle
        e.currentTarget.style.background = TOKENS.colors.black
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[3] }}>
          {vault.image && (
            <img
              src={vault.image}
              alt={vault.name}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: TOKENS.radius.md,
                objectFit: 'cover',
              }}
            />
          )}
          <div>
            <div style={{
              fontSize: TOKENS.fontSizes.md,
              fontWeight: TOKENS.fontWeights.black,
              textTransform: 'uppercase',
              letterSpacing: VALUE_LETTER_SPACING,
              color: TOKENS.colors.textPrimary,
            }}>
              {vault.name}
            </div>
            <div style={{
              fontSize: TOKENS.fontSizes.xs,
              color: TOKENS.colors.textSecondary,
              marginTop: '2px',
            }}>
              {vault.strategy}
            </div>
          </div>
        </div>
        <div style={{
          fontSize: fitValue(mode, {
            normal: TOKENS.fontSizes.xl,
            tight: TOKENS.fontSizes.lg,
            limit: TOKENS.fontSizes.md,
          }),
          fontWeight: TOKENS.fontWeights.black,
          letterSpacing: VALUE_LETTER_SPACING,
          color: accentColor,
        }}>
          {vault.apr}%
        </div>
      </div>

      {/* Key Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: TOKENS.spacing[3],
      }}>
        <StatItem label="Target" value={vault.target} />
        <StatItem label="Lock Period" value={vault.lockPeriod} />
        <StatItem label="Min Deposit" value={fmtUsdCompact(vault.minDeposit)} />
        <StatItem label="Risk" value={vault.risk} />
      </div>

      {/* Target Progress Preview */}
      <div style={{
        background: TOKENS.colors.bgSecondary,
        borderRadius: TOKENS.radius.md,
        padding: TOKENS.spacing[3],
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: TOKENS.spacing[2],
        }}>
          <span style={{
            fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
            color: TOKENS.colors.textSecondary,
          }}>
            Target Yield
          </span>
          <span style={{
            fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.black,
            color: accentColor,
          }}>
            {vault.target}
          </span>
        </div>
        <div style={{
          height: '4px',
          background: TOKENS.colors.black,
          borderRadius: TOKENS.radius.sm,
          overflow: 'hidden',
        }}>
          <div style={{
            width: '0%',
            height: '100%',
            background: accentColor,
            borderRadius: TOKENS.radius.sm,
          }} />
        </div>
        <div style={{
          marginTop: TOKENS.spacing[2],
          fontSize: TOKENS.fontSizes.micro,
          color: TOKENS.colors.textGhost,
        }}>
          Potential return: ~{targetPct}% cumulative over {vault.lockPeriod.toLowerCase()}
        </div>
      </div>

      {/* Fees & CTA */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: TOKENS.spacing[3],
        borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
      }}>
        <span style={{
          fontSize: TOKENS.fontSizes.xs,
          color: TOKENS.colors.textGhost,
        }}>
          {vault.fees}
        </span>
        <button style={{
          padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[4]}`,
          background: TOKENS.colors.accent,
          border: 'none',
          borderRadius: TOKENS.radius.md,
          color: TOKENS.colors.black,
          fontSize: TOKENS.fontSizes.sm,
          fontWeight: TOKENS.fontWeights.black,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}>
          Subscribe
        </button>
      </div>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{
        fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        fontFamily: MONO,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        color: TOKENS.colors.textSecondary,
        marginBottom: TOKENS.spacing[2],
      }}>
        {label}
      </div>
      <div style={{
        fontSize: TOKENS.fontSizes.sm,
        fontWeight: TOKENS.fontWeights.black,
        letterSpacing: VALUE_LETTER_SPACING,
        color: TOKENS.colors.textPrimary,
      }}>
        {value}
      </div>
    </div>
  )
}

