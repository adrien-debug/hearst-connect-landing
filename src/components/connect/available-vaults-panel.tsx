'use client'

import { useMemo, useState } from 'react'
import { TOKENS, fmtUsdCompact, LINE_HEIGHT, VALUE_LETTER_SPACING, MONO, CHART_PALETTE } from './constants'
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

type RiskFilter = 'all' | 'very low' | 'low' | 'medium' | 'high'
type SortKey = 'apr' | 'lock' | 'min'

function lockDays(lockPeriod: string): number {
  // Inputs look like "12 months", "30 days", etc — coerce to days for sorting.
  const m = lockPeriod.match(/(\d+(?:\.\d+)?)\s*(day|month|year|d|m|y)/i)
  if (!m) return 0
  const n = parseFloat(m[1])
  const unit = m[2].toLowerCase()
  if (unit.startsWith('y')) return n * 365
  if (unit.startsWith('m')) return n * 30
  return n
}

export function AvailableVaultsPanel({ vaults, onVaultSelect }: AvailableVaultsPanelProps) {
  const { mode, isLimit } = useSmartFit({
    tightHeight: 880,
    limitHeight: 720,
    tightWidth: 1280,
    limitWidth: 1024,
    reserveHeight: 64,
    reserveWidth: 280,
  })
  const { padding: shellPadding, gap: shellGap } = useShellPadding(mode)

  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('apr')

  // Get top 3 vaults for cockpit gauges (sorted by APR)
  const topVaults = useMemo(() => [...vaults].sort((a, b) => b.apr - a.apr).slice(0, 3), [vaults])
  const displayVaults = topVaults.length >= 3 ? topVaults : [...topVaults, ...Array(3 - topVaults.length).fill(null)]

  const filteredSortedVaults = useMemo(() => {
    let list = riskFilter === 'all'
      ? vaults
      : vaults.filter((v) => v.risk.toLowerCase() === riskFilter)
    list = [...list].sort((a, b) => {
      if (sortKey === 'apr') return b.apr - a.apr
      if (sortKey === 'min') return a.minDeposit - b.minDeposit
      return lockDays(a.lockPeriod) - lockDays(b.lockPeriod)
    })
    return list
  }, [vaults, riskFilter, sortKey])

  const riskCounts = useMemo(() => {
    const counts: Record<string, number> = { all: vaults.length, 'very low': 0, low: 0, medium: 0, high: 0 }
    for (const v of vaults) {
      const k = v.risk.toLowerCase()
      if (k in counts) counts[k]++
    }
    return counts
  }, [vaults])

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
          overflow: 'auto',
        }}
      >
        {/* Filter / sort toolbar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: TOKENS.spacing[3],
        }}>
          <FilterPills value={riskFilter} onChange={setRiskFilter} counts={riskCounts} />
          <SortMenu value={sortKey} onChange={setSortKey} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: fitValue(mode, {
            normal: 'repeat(2, 1fr)',
            tight: 'repeat(2, 1fr)',
            limit: '1fr',
          }),
          gap: TOKENS.spacing[4],
        }}>
          {filteredSortedVaults.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              padding: TOKENS.spacing[8],
              textAlign: 'center',
              color: TOKENS.colors.textGhost,
              fontSize: TOKENS.fontSizes.sm,
              fontFamily: TOKENS.fonts.mono,
              border: `1px dashed ${TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radius.lg,
            }}>
              No vaults match the current filter.
            </div>
          ) : (
            filteredSortedVaults.map((vault, index) => (
              <AvailableVaultCard
                key={vault.id}
                vault={vault}
                index={index}
                mode={mode}
                onClick={() => onVaultSelect(vault.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/** Risk filter pills — shows live counts so users see at a glance how the
 * universe slices. Mirrors the AvailableVaultCard risk badge palette. */
function FilterPills({
  value,
  onChange,
  counts,
}: {
  value: RiskFilter
  onChange: (v: RiskFilter) => void
  counts: Record<string, number>
}) {
  const opts: Array<{ id: RiskFilter; label: string; hue?: string }> = [
    { id: 'all', label: 'All' },
    { id: 'very low', label: 'Very Low', hue: CHART_PALETTE[1] },
    { id: 'low', label: 'Low', hue: CHART_PALETTE[0] },
    { id: 'medium', label: 'Medium', hue: CHART_PALETTE[3] },
    { id: 'high', label: 'High', hue: CHART_PALETTE[2] },
  ]
  return (
    <div style={{
      display: 'inline-flex',
      flexWrap: 'wrap',
      gap: TOKENS.spacing[2],
    }}>
      {opts.map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: TOKENS.spacing[2],
              padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[3]}`,
              borderRadius: TOKENS.radius.full,
              border: `1px solid ${active && opt.hue ? opt.hue : active ? TOKENS.colors.accent : TOKENS.colors.borderSubtle}`,
              background: active
                ? (opt.hue ? `${opt.hue}1a` : TOKENS.colors.accentSubtle)
                : TOKENS.colors.bgTertiary,
              color: active && opt.hue ? opt.hue : active ? TOKENS.colors.accent : TOKENS.colors.textSecondary,
              fontFamily: MONO,
              fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: TOKENS.transitions.fast,
            }}
          >
            {opt.hue && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: opt.hue }} />
            )}
            <span>{opt.label}</span>
            <span style={{
              fontSize: TOKENS.fontSizes.nano,
              color: active ? 'currentColor' : TOKENS.colors.textGhost,
              opacity: 0.85,
            }}>
              {counts[opt.id] ?? 0}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Sort menu — dense pill triple (APR / Lock / Min). Stays inline with filters. */
function SortMenu({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const opts: Array<{ id: SortKey; label: string }> = [
    { id: 'apr', label: 'APR' },
    { id: 'lock', label: 'Lock' },
    { id: 'min', label: 'Min deposit' },
  ]
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: TOKENS.spacing[2],
    }}>
      <span style={{
        fontFamily: MONO,
        fontSize: TOKENS.fontSizes.nano,
        fontWeight: TOKENS.fontWeights.bold,
        color: TOKENS.colors.textGhost,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
      }}>
        Sort by
      </span>
      <div style={{
        display: 'inline-flex',
        gap: TOKENS.spacing.half,
        padding: TOKENS.spacing.half,
        background: TOKENS.colors.bgTertiary,
        borderRadius: TOKENS.radius.full,
        border: `1px solid ${TOKENS.colors.borderSubtle}`,
      }}>
        {opts.map((opt) => {
          const active = value === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              style={{
                padding: `${TOKENS.spacing.half} ${TOKENS.spacing[3]}`,
                borderRadius: TOKENS.radius.full,
                border: 'none',
                background: active ? TOKENS.colors.accent : 'transparent',
                color: active ? TOKENS.colors.bgApp : TOKENS.colors.textSecondary,
                fontFamily: MONO,
                fontSize: TOKENS.fontSizes.nano,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: TOKENS.transitions.fast,
              }}
            >
              {opt.label}
            </button>
          )
        })}
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

/** Risk pill color drawn from CHART_PALETTE so the available-vaults grid
 * stays visually consistent with the donut and timeline palettes. Indexes
 * follow the palette spec in constants.ts: 0=accent, 1=sky, 3=amber, 2=fuchsia. */
function riskColor(risk: string): string {
  const r = risk.toLowerCase()
  if (r.includes('very low')) return CHART_PALETTE[1]
  if (r === 'low') return CHART_PALETTE[0]
  if (r === 'medium') return CHART_PALETTE[3]
  if (r === 'high') return CHART_PALETTE[2]
  return TOKENS.colors.textGhost
}

function AvailableVaultCard({ vault, index, mode, onClick }: AvailableVaultCardProps) {
  const accentColor = CHART_PALETTE[index % CHART_PALETTE.length]
  const riskAccent = riskColor(vault.risk)

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
          normal: TOKENS.spacing[5],
          tight: TOKENS.spacing[4],
          limit: TOKENS.spacing[3],
        }),
        border: `1px solid ${TOKENS.colors.borderSubtle}`,
        cursor: 'pointer',
        transition: TOKENS.transitions.base,
        display: 'flex',
        flexDirection: 'column',
        gap: TOKENS.spacing[4],
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accentColor
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = `0 8px 24px ${accentColor}1a`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = TOKENS.colors.borderSubtle
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Top accent bar */}
      <span style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: `linear-gradient(90deg, ${accentColor}, transparent)`,
      }} />

      {/* Header — name + APY */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: TOKENS.spacing[3],
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: TOKENS.fontSizes.md,
            fontWeight: TOKENS.fontWeights.black,
            textTransform: 'uppercase',
            letterSpacing: VALUE_LETTER_SPACING,
            color: TOKENS.colors.textPrimary,
          }}>
            {vault.name}
          </div>
          {/* Risk + Lock pills */}
          <div style={{
            display: 'flex',
            gap: TOKENS.spacing[2],
            marginTop: TOKENS.spacing[2],
            flexWrap: 'wrap',
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: TOKENS.spacing[1],
              padding: `${TOKENS.spacing.half} ${TOKENS.spacing[2]}`,
              borderRadius: TOKENS.radius.full,
              background: `${riskAccent}1f`,
              border: `1px solid ${riskAccent}66`,
              fontFamily: MONO,
              fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              color: riskAccent,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: riskAccent }} />
              {vault.risk} risk
            </span>
            <span style={{
              padding: `${TOKENS.spacing.half} ${TOKENS.spacing[2]}`,
              borderRadius: TOKENS.radius.full,
              background: TOKENS.colors.bgTertiary,
              fontFamily: MONO,
              fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              color: TOKENS.colors.textSecondary,
            }}>
              {vault.lockPeriod}
            </span>
          </div>
        </div>
        {/* APY badge */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 0,
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: fitValue(mode, {
              normal: TOKENS.fontSizes.xxl,
              tight: TOKENS.fontSizes.xl,
              limit: TOKENS.fontSizes.lg,
            }),
            fontWeight: TOKENS.fontWeights.black,
            letterSpacing: VALUE_LETTER_SPACING,
            color: accentColor,
            lineHeight: 1,
          }}>
            {vault.apr}%
          </span>
          <span style={{
            fontFamily: MONO,
            fontSize: TOKENS.fontSizes.micro,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
            color: TOKENS.colors.textGhost,
            marginTop: '2px',
          }}>
            APY · target {vault.target}
          </span>
        </div>
      </div>

      {/* Description */}
      {vault.description && (
        <p style={{
          margin: 0,
          fontSize: TOKENS.fontSizes.xs,
          color: TOKENS.colors.textSecondary,
          lineHeight: LINE_HEIGHT.body,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {vault.description}
        </p>
      )}

      {/* Footer stats — Min deposit + Fees + CTA */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: TOKENS.spacing[3],
        paddingTop: TOKENS.spacing[3],
        borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
        marginTop: 'auto',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing.half, minWidth: 0 }}>
          <span style={{
            fontFamily: MONO,
            fontSize: TOKENS.fontSizes.micro,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
            color: TOKENS.colors.textGhost,
          }}>
            Min · {fmtUsdCompact(vault.minDeposit)}
          </span>
          <span style={{
            fontSize: TOKENS.fontSizes.micro,
            color: TOKENS.colors.textGhost,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {vault.fees}
          </span>
        </div>
        <button style={{
          padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[4]}`,
          background: TOKENS.colors.accent,
          border: 'none',
          borderRadius: TOKENS.radius.md,
          color: TOKENS.colors.black,
          fontFamily: TOKENS.fonts.sans,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.black,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          cursor: 'pointer',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          Subscribe →
        </button>
      </div>
    </div>
  )
}
