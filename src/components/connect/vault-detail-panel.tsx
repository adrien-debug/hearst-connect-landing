'use client'

import { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { TOKENS, fmtUsdCompact, LINE_HEIGHT, VALUE_LETTER_SPACING, CHART_PALETTE } from './constants'
import { formatVaultName } from './formatting'
import type { ActiveVault, MaturedVault } from './data'
import type { VaultConfig, MarketRegime } from '@/types/vault'
import { DEMO_MARKET_REGIME } from '@/lib/demo/demo-data'
import { useSmartFit, useShellPadding, fitValue } from './smart-fit'
import type { SmartFitMode } from './smart-fit'
import { usePositionData } from '@/hooks/usePositionData'
import { useVaultById } from '@/hooks/useVaultRegistry'
import { Skeleton } from './skeleton'
import { WalletNotConnected, VaultNotConfigured, OnChainError } from './empty-states'
import { useUserData } from '@/hooks/useUserData'
import { useConnectWallet } from '@/hooks/useConnectWallet'

export function VaultDetailPanel({
  vault,
  onBack,
  onClaim,
  onExit,
  isClaiming = false,
  isExiting = false,
}: {
  vault: ActiveVault | MaturedVault
  onBack?: () => void
  /** Wired by the parent. The header shows a "Claim $X" CTA only when this
   * callback is provided AND `accruedYield > 0`. One-click action — yield
   * distribution is recurring so we don't gate it behind a confirmation modal
   * (unlike withdraw, which is irreversible). */
  onClaim?: () => void
  /** Wired by the parent when the position is ready for exit. The header
   * surfaces an "Exit position" CTA only when this callback is provided AND
   * `canWithdraw` is true — so an active (still-locked) vault never offers the
   * action. */
  onExit?: () => void
  /** Pending flags so the CTAs can disable themselves while a tx is in flight. */
  isClaiming?: boolean
  isExiting?: boolean
}) {
  const { address: connectedAddress } = useAccount()
  const { connectWallet } = useConnectWallet()
  const { mode } = useSmartFit({
    tightHeight: 880,
    limitHeight: 720,
    tightWidth: 1280,
    limitWidth: 1024,
    reserveHeight: 64,
    reserveWidth: 280,
  })
  const { padding: shellPadding, gap: shellGap } = useShellPadding(mode)

  // ActiveVault.id is the unique cohort/position id (e.g. 'demo-pos-prime-1')
  // while ActiveVault.productId points to the underlying vault config
  // (e.g. 'demo-prime'). Fall back to id for non-cohort vaults (Available).
  const productId = vault.productId ?? vault.id
  const vaultConfig = useVaultById(productId)

  const {
    data: positionData,
    isLoading,
    error,
    isVaultConfigured,
    isWalletConnected,
  } = usePositionData({
    vaultId: productId,
    positionId: vault.productId ? vault.id : undefined,
    walletAddress: connectedAddress,
  })

  // Hooks must run on every render — keep BEFORE the early returns below
  // (Rules of Hooks: order must be stable across renders).
  const { activity: allActivity } = useUserData()
  const [activityFilter, setActivityFilter] = useState<TimelineFilter>('all')
  // Cohort-scoped events (productId + exact vaultName so Prime #1 doesn't bleed
  // Prime #2's deposits) — kept memoized at the cohort level so filter changes
  // don't redo the cohort filter.
  const cohortActivity = useMemo(
    () => allActivity.filter((a) => a.vaultId === productId && a.vaultName === vault.name),
    [allActivity, productId, vault.name],
  )
  // Filtered + grouped timeline for the Transactions card. Filter is applied
  // before grouping so a "Claims" filter still rolls up consecutive claims.
  const vaultTimeline = useMemo(
    () => buildVaultTimeline(applyTimelineFilter(cohortActivity, activityFilter)),
    [cohortActivity, activityFilter],
  )
  const filterCounts = useMemo(() => countByType(cohortActivity), [cohortActivity])

  if (!isVaultConfigured) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: shellPadding,
          gap: shellGap,
        }}
      >
        <div style={{ marginBottom: TOKENS.spacing[4] }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: TOKENS.spacing[2],
              background: 'none',
              border: 'none',
              color: TOKENS.colors.accent,
              fontSize: TOKENS.fontSizes.sm,
              fontWeight: TOKENS.fontWeights.bold,
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            ← Back
          </button>
        </div>
        <VaultNotConfigured onBack={onBack} />
      </div>
    )
  }

  if (!isWalletConnected) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: shellPadding,
          gap: shellGap,
        }}
      >
        <div style={{ marginBottom: TOKENS.spacing[4] }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: TOKENS.spacing[2],
              background: 'none',
              border: 'none',
              color: TOKENS.colors.accent,
              fontSize: TOKENS.fontSizes.sm,
              fontWeight: TOKENS.fontWeights.bold,
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            ← Back
          </button>
        </div>
        <WalletNotConnected onConnect={connectWallet} />
      </div>
    )
  }

  const capitalDeployed = positionData?.capitalDeployed ?? 0
  const accruedYield = positionData?.accruedYield ?? 0
  const cumulativeYieldPaid = positionData?.cumulativeYieldPaid ?? accruedYield
  const currentValue = positionData?.positionValue ?? 0
  const daysRemaining = positionData?.unlockTimeline.daysRemaining ?? vaultConfig?.lockPeriodDays ?? 0
  const progressToTarget = positionData?.unlockTimeline.progressPercent ?? 0
  const isMatured = vault.type === 'matured'
  const unlockDays = Math.max(0, daysRemaining)
  const isTargetReached = positionData?.isTargetReached ?? false

  const isPositionReadyForExit = positionData?.canWithdraw ?? false
  const statusLabel = isPositionReadyForExit ? 'Ready for exit' : 'Active'

  if (error && error.code !== 'WALLET_NOT_CONNECTED' && error.code !== 'VAULT_NOT_FOUND') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: shellPadding,
          gap: shellGap,
        }}
      >
        <div style={{ marginBottom: TOKENS.spacing[4] }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: TOKENS.spacing[2],
              background: 'none',
              border: 'none',
              color: TOKENS.colors.accent,
              fontSize: TOKENS.fontSizes.sm,
              fontWeight: TOKENS.fontWeights.bold,
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            ← Back
          </button>
        </div>
        <OnChainError error={error as unknown as Error} />
      </div>
    )
  }

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
      {/* HEADER — LIVE pill, name, APY */}
      <PositionHeader
        vault={vault}
        subtitle={vault.strategy}
        chainName={vaultConfig?.chain?.name}
        statusLabel={statusLabel}
        isReadyForExit={isPositionReadyForExit}
        onBack={onBack}
        mode={mode}
        feesLabel={vaultConfig?.fees}
        targetLabel={vault.target}
        lockPeriodDays={vaultConfig?.lockPeriodDays}
        explorerUrl={vaultConfig?.chain?.blockExplorers?.default?.url}
        vaultAddress={vaultConfig?.vaultAddress}
        claimableAmount={accruedYield}
        onClaim={onClaim}
        onExit={onExit}
        isClaiming={isClaiming}
        isExiting={isExiting}
      />

      {/* Main content */}
      <div
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
        {/* KPI row — 4 cells: Deposited / Current value / Yield paid / Matures */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: fitValue(mode, {
            normal: 'repeat(4, 1fr)',
            tight: 'repeat(4, 1fr)',
            limit: 'repeat(2, 1fr)',
          }),
          gap: fitValue(mode, {
            normal: TOKENS.spacing[6],
            tight: TOKENS.spacing[4],
            limit: TOKENS.spacing[3],
          }),
          flexShrink: 0,
        }}>
          <KpiCell label="Deposited" value={fmtUsdCompact(capitalDeployed)} mode={mode} />
          <KpiCell
            label="Current value"
            value={fmtUsdCompact(currentValue)}
            subtext={
              currentValue - capitalDeployed > 0
                ? `+${fmtUsdCompact(currentValue - capitalDeployed)}`
                : currentValue - capitalDeployed < 0
                  ? `−${fmtUsdCompact(Math.abs(currentValue - capitalDeployed))}`
                  : '—'
            }
            subtextAccent={currentValue - capitalDeployed > 0}
            mode={mode}
          />
          <KpiCell
            label="Yield paid"
            value={fmtUsdCompact(cumulativeYieldPaid)}
            valueAccent={cumulativeYieldPaid > 0}
            subtext={accruedYield > 0 ? `+${fmtUsdCompact(accruedYield)} pending` : 'USDC'}
            mode={mode}
          />
          <KpiCell
            label="Matures"
            value={isMatured ? 'Matured' : formatMaturityDate(positionData?.unlockTimeline.maturityDate, unlockDays)}
            subtext={vault.maturity}
            mode={mode}
          />
        </div>

        {/* Loading state */}
        {isLoading && <Skeleton mode={mode} />}

        {/* Error state */}
        {error && (
          <span style={{
            fontSize: TOKENS.fontSizes.sm,
            color: TOKENS.colors.danger,
          }}>{error.message}</span>
        )}

        {/* Cumulative target progress */}
        <CumulativeTargetProgress
          progress={progressToTarget}
          targetLabel={vault.target}
          isTargetReached={isTargetReached}
          maturityLabel={vault.maturity}
          mode={mode}
          lockPeriodDays={vaultConfig?.lockPeriodDays ?? 0}
          daysRemaining={unlockDays}
        />

        {/* 2x2 detail grid — paired by visual density:
         *   row 1: compact summaries  (Yield 12m | Capital recovery)
         *   row 2: rich content       (Strategy   | Transactions)
         * On limit (narrow) it collapses to a single column. */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: fitValue(mode, {
              normal: 'repeat(2, minmax(0, 1fr))',
              tight: 'repeat(2, minmax(0, 1fr))',
              limit: '1fr',
            }),
            gridAutoRows: fitValue(mode, {
              normal: 'minmax(0, auto) minmax(0, 1fr)',
              tight: 'minmax(0, auto) minmax(0, 1fr)',
              limit: 'auto',
            }),
            gridTemplateRows: fitValue(mode, {
              normal: 'minmax(0, auto) minmax(0, 1fr)',
              tight: 'minmax(0, auto) minmax(0, 1fr)',
              limit: 'auto',
            }),
            gap: shellGap,
            flex: 1,
            minHeight: 0,
            overflow: mode === 'limit' ? 'auto' : 'hidden',
          }}
        >
          <DetailCard title="Yield paid — last 12 months" accent>
            {vaultConfig?.historicalReturns && vaultConfig.historicalReturns.length > 1 ? (
              <YieldPaidBars
                returns={vaultConfig.historicalReturns}
                capitalDeployed={capitalDeployed}
              />
            ) : (
              <p style={{
                margin: 0,
                fontSize: TOKENS.fontSizes.sm,
                color: TOKENS.colors.textGhost,
              }}>
                No distribution history yet.
              </p>
            )}
          </DetailCard>

          <DetailCard title="Capital recovery status">
            <CapitalRecoveryStatus
              capitalDeployed={capitalDeployed}
              currentValue={currentValue}
              lockPeriodDays={vaultConfig?.lockPeriodDays ?? 0}
              daysRemaining={unlockDays}
              recoveryYears={vaultConfig?.capitalRecoveryYears ?? 2}
            />
          </DetailCard>

          <DetailCard title="Strategy details">
            <StrategyDetailsBody
              vaultConfig={vaultConfig}
              activeRegime={DEMO_MARKET_REGIME}
            />
          </DetailCard>

          <DetailCard title="Transactions">
            <ActivityFilterChips
              value={activityFilter}
              onChange={setActivityFilter}
              counts={filterCounts}
            />
            <VaultActivityTimeline
              timeline={vaultTimeline}
              explorerUrl={vaultConfig?.chain?.blockExplorers?.default?.url}
            />
          </DetailCard>
        </div>
      </div>

    </div>
  )
}


/** InfoTooltip — small ⓘ marker rendering a short popover on hover/focus.
 * Uses React state (not CSS :hover) to stay consistent with the rest of the
 * panel's inline-style approach and to keep the popover usable on touch via
 * focus. The popover anchors above the icon by default, falling back below
 * when the icon sits at the top of its scroll container. */
function InfoTooltip({ label, body }: { label: string; body: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        marginLeft: TOKENS.spacing[1],
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={`More info: ${label}`}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 14,
          height: 14,
          padding: 0,
          background: 'transparent',
          border: `${TOKENS.borders.thin} solid ${open ? TOKENS.colors.accent : TOKENS.colors.borderSubtle}`,
          borderRadius: TOKENS.radius.full,
          color: open ? TOKENS.colors.accent : TOKENS.colors.textGhost,
          fontFamily: TOKENS.fonts.mono,
          fontSize: 9,
          fontWeight: TOKENS.fontWeights.black,
          lineHeight: 1,
          cursor: 'help',
          transition: TOKENS.transitions.fast,
        }}
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            width: 220,
            padding: TOKENS.spacing[3],
            background: TOKENS.colors.black,
            border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
            borderRadius: TOKENS.radius.md,
            fontFamily: TOKENS.fonts.sans,
            fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.regular,
            letterSpacing: 0,
            textTransform: 'none',
            color: TOKENS.colors.textSecondary,
            lineHeight: LINE_HEIGHT.body,
            pointerEvents: 'none',
          }}
        >
          <span style={{
            display: 'block',
            marginBottom: TOKENS.spacing[1],
            color: TOKENS.colors.textPrimary,
            fontWeight: TOKENS.fontWeights.bold,
          }}>
            {label}
          </span>
          {body}
        </span>
      )}
    </span>
  )
}

function formatMaturityDate(iso: string | undefined, fallbackDays: number): string {
  if (iso) {
    const date = new Date(iso)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    }
  }
  if (fallbackDays > 0) {
    const projected = new Date(Date.now() + fallbackDays * 86_400_000)
    return projected.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  return '—'
}

function PositionHeader({
  vault,
  subtitle,
  chainName,
  statusLabel,
  isReadyForExit,
  onBack,
  mode,
  feesLabel,
  targetLabel,
  lockPeriodDays,
  explorerUrl,
  vaultAddress,
  claimableAmount,
  onClaim,
  onExit,
  isClaiming,
  isExiting,
}: {
  vault: ActiveVault | MaturedVault
  subtitle?: string
  chainName?: string
  statusLabel: string
  isReadyForExit: boolean
  onBack?: () => void
  mode: SmartFitMode
  feesLabel?: string
  targetLabel?: string
  lockPeriodDays?: number
  explorerUrl?: string
  vaultAddress?: string
  claimableAmount: number
  onClaim?: () => void
  onExit?: () => void
  isClaiming?: boolean
  isExiting?: boolean
}) {
  const showClaim = !!onClaim && claimableAmount > 0
  const showExit = !!onExit && isReadyForExit
  const showExplorer = !!(explorerUrl && vaultAddress)
  const hasActionRow = showClaim || showExit || showExplorer
  const apyContext = (() => {
    const parts: string[] = []
    if (feesLabel) parts.push(`Net of ${feesLabel}`)
    if (targetLabel && lockPeriodDays) parts.push(`Target ${targetLabel} in ${lockPeriodDays}d`)
    else if (targetLabel) parts.push(`Target ${targetLabel}`)
    return parts.join(' · ')
  })()
  return (
    <div style={{
      padding: fitValue(mode, {
        normal: 'var(--space-6)',
        tight: 'var(--space-4)',
        limit: 'var(--space-3)',
      }),
      borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
      flexShrink: 0,
      background: TOKENS.colors.black,
      display: 'flex',
      alignItems: mode === 'limit' ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      gap: fitValue(mode, {
        normal: TOKENS.spacing[6],
        tight: TOKENS.spacing[4],
        limit: TOKENS.spacing[3],
      }),
      flexWrap: 'wrap',
    }}>
      {/* Left: LIVE pill + name + subtitle */}
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[2] }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: TOKENS.spacing[3],
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.micro,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
        }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: TOKENS.spacing[2],
                background: 'transparent',
                border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
                borderRadius: TOKENS.radius.sm,
                padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[2]}`,
                color: TOKENS.colors.textSecondary,
                fontFamily: 'inherit',
                fontSize: 'inherit',
                fontWeight: 'inherit',
                letterSpacing: 'inherit',
                textTransform: 'inherit',
                cursor: 'pointer',
                transition: TOKENS.transitions.fast,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = TOKENS.colors.accent
                e.currentTarget.style.borderColor = TOKENS.colors.accent
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = TOKENS.colors.textSecondary
                e.currentTarget.style.borderColor = TOKENS.colors.borderSubtle
              }}
              onFocus={(e) => {
                e.currentTarget.style.color = TOKENS.colors.accent
                e.currentTarget.style.borderColor = TOKENS.colors.accent
              }}
              onBlur={(e) => {
                e.currentTarget.style.color = TOKENS.colors.textSecondary
                e.currentTarget.style.borderColor = TOKENS.colors.borderSubtle
              }}
              aria-label="Back to portfolio"
            >
              ← Portfolio
            </button>
          )}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: TOKENS.spacing[2],
            color: TOKENS.colors.accent,
          }}>
            <span style={{
              width: TOKENS.dot.xs,
              height: TOKENS.dot.xs,
              borderRadius: TOKENS.radius.full,
              background: TOKENS.colors.accent,
            }} />
            {isReadyForExit ? statusLabel : 'Live'}
          </span>
          {chainName && (
            <span style={{ color: TOKENS.colors.textGhost }}>· {chainName}</span>
          )}
        </div>
        <h1 style={{
          margin: 0,
          fontSize: fitValue(mode, {
            normal: TOKENS.fontSizes.xl,
            tight: TOKENS.fontSizes.lg,
            limit: TOKENS.fontSizes.md,
          }),
          fontWeight: TOKENS.fontWeights.semibold,
          letterSpacing: TOKENS.letterSpacing.normal,
          color: TOKENS.colors.textPrimary,
          lineHeight: LINE_HEIGHT.tight,
        }}>
          {formatVaultName(vault.name)}
        </h1>
        {subtitle && (
          <div style={{
            fontSize: TOKENS.fontSizes.sm,
            color: TOKENS.colors.textSecondary,
            lineHeight: LINE_HEIGHT.tight,
          }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Right: APY card + actions */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: mode === 'limit' ? 'flex-start' : 'flex-end',
        gap: TOKENS.spacing[3],
        flexShrink: 0,
      }}>
        {/* APY — flat, cockpit gauge style + 'Daily distribution' caption */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: TOKENS.spacing[1],
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: TOKENS.spacing[2],
          }}>
            <span style={{
              fontSize: fitValue(mode, {
                normal: TOKENS.fontSizes.xxl,
                tight: TOKENS.fontSizes.xl,
                limit: TOKENS.fontSizes.xl,
              }),
              fontWeight: TOKENS.fontWeights.black,
              letterSpacing: VALUE_LETTER_SPACING,
              color: TOKENS.colors.accent,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: LINE_HEIGHT.tight,
            }}>
              {vault.apr}%
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              color: TOKENS.colors.textGhost,
            }}>
              APY
              <InfoTooltip
                label="Annual percentage yield"
                body="Net annualized return after management and performance fees, distributed daily in USDC. Past performance is not a guarantee of future results."
              />
            </span>
          </div>
          <span style={{
            fontSize: TOKENS.fontSizes.xs,
            color: TOKENS.colors.textSecondary,
            textAlign: mode === 'limit' ? 'left' : 'right',
            maxWidth: '100%',
          }}>
            Daily distribution{apyContext ? ` · ${apyContext}` : ''}
          </span>
        </div>

        {/* Action row — explorer link + claim/exit CTAs.
         * Order of priority: Claim (most common, primary accent) > Exit (rare,
         * irreversible — visually de-emphasized as outline) > Explorer (link). */}
        {hasActionRow && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: TOKENS.spacing[3],
            flexWrap: 'wrap',
            justifyContent: mode === 'limit' ? 'flex-start' : 'flex-end',
          }}>
            {showExplorer && (
              <a
                href={`${explorerUrl!.replace(/\/$/, '')}/address/${vaultAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: TOKENS.fonts.mono,
                  fontSize: TOKENS.fontSizes.micro,
                  fontWeight: TOKENS.fontWeights.bold,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                  color: TOKENS.colors.textSecondary,
                  textDecoration: 'underline',
                  textDecorationColor: TOKENS.colors.borderSubtle,
                  textUnderlineOffset: '3px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = TOKENS.colors.accent
                  e.currentTarget.style.textDecorationColor = TOKENS.colors.accent
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = TOKENS.colors.textSecondary
                  e.currentTarget.style.textDecorationColor = TOKENS.colors.borderSubtle
                }}
                onFocus={(e) => {
                  e.currentTarget.style.color = TOKENS.colors.accent
                  e.currentTarget.style.textDecorationColor = TOKENS.colors.accent
                }}
                onBlur={(e) => {
                  e.currentTarget.style.color = TOKENS.colors.textSecondary
                  e.currentTarget.style.textDecorationColor = TOKENS.colors.borderSubtle
                }}
              >
                View on {chainName ? `${chainName} explorer` : 'explorer'} ↗
              </a>
            )}
            {showExit && (
              <button
                type="button"
                onClick={onExit}
                disabled={isExiting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: TOKENS.spacing[2],
                  padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[4]}`,
                  background: 'transparent',
                  color: TOKENS.colors.textSecondary,
                  border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
                  borderRadius: TOKENS.radius.sm,
                  fontFamily: TOKENS.fonts.mono,
                  fontSize: TOKENS.fontSizes.xs,
                  fontWeight: TOKENS.fontWeights.bold,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                  cursor: isExiting ? 'wait' : 'pointer',
                  opacity: isExiting ? 0.5 : 1,
                  transition: TOKENS.transitions.fast,
                }}
              >
                {isExiting ? 'Exiting…' : 'Exit position →'}
              </button>
            )}
            {showClaim && (
              <button
                type="button"
                onClick={onClaim}
                disabled={isClaiming}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: TOKENS.spacing[2],
                  padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[4]}`,
                  background: TOKENS.colors.accent,
                  color: TOKENS.colors.black,
                  border: `${TOKENS.borders.thin} solid ${TOKENS.colors.accent}`,
                  borderRadius: TOKENS.radius.sm,
                  fontFamily: TOKENS.fonts.mono,
                  fontSize: TOKENS.fontSizes.xs,
                  fontWeight: TOKENS.fontWeights.black,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                  cursor: isClaiming ? 'wait' : 'pointer',
                  opacity: isClaiming ? 0.6 : 1,
                  transition: TOKENS.transitions.fast,
                }}
              >
                {isClaiming ? 'Claiming…' : `Claim ${fmtUsdCompact(claimableAmount)} →`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCell({
  label,
  value,
  subtext,
  valueAccent = false,
  subtextAccent = false,
  mode,
}: {
  label: string
  value: string
  subtext?: string
  valueAccent?: boolean
  subtextAccent?: boolean
  mode: SmartFitMode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[2], minWidth: 0 }}>
      <div style={{
        fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        fontFamily: TOKENS.fonts.mono,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        color: TOKENS.colors.textSecondary,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: fitValue(mode, {
          normal: TOKENS.fontSizes.xl,
          tight: TOKENS.fontSizes.lg,
          limit: TOKENS.fontSizes.md,
        }),
        fontWeight: TOKENS.fontWeights.black,
        letterSpacing: VALUE_LETTER_SPACING,
        color: valueAccent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: LINE_HEIGHT.tight,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {value}
      </div>
      {subtext && (
        <div style={{
          fontSize: TOKENS.fontSizes.xs,
          color: subtextAccent ? TOKENS.colors.accent : TOKENS.colors.textGhost,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: TOKENS.fonts.mono,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {subtext}
        </div>
      )}
    </div>
  )
}

function CumulativeTargetProgress({
  progress,
  targetLabel,
  isTargetReached,
  maturityLabel,
  mode: _mode,
  lockPeriodDays,
  daysRemaining,
}: {
  progress: number
  targetLabel: string
  isTargetReached: boolean
  maturityLabel: string
  mode: SmartFitMode
  lockPeriodDays: number
  daysRemaining: number
}) {
  const targetPct = parseFloat(targetLabel) || 36
  const yieldFillPct = Math.min(100, (progress / targetPct) * 100)
  const elapsedDays = Math.max(0, lockPeriodDays - daysRemaining)
  const timeFillPct = lockPeriodDays > 0 ? Math.min(100, (elapsedDays / lockPeriodDays) * 100) : 0
  const isAheadOfSchedule = yieldFillPct > timeFillPct + 1
  const paceLabel = isTargetReached
    ? 'Target reached'
    : isAheadOfSchedule
      ? 'Ahead of schedule'
      : yieldFillPct < timeFillPct - 1
        ? 'Behind schedule'
        : 'On pace'

  // Linear-pace projection: extrapolate the current daily yield rate to the
  // full lock period to surface "where will we land at maturity?". Only
  // meaningful once a few days have elapsed and only while still locked.
  const projection = (() => {
    if (isTargetReached || elapsedDays < 7 || lockPeriodDays <= 0) return null
    const projectedPct = (progress / elapsedDays) * lockPeriodDays
    const variance = projectedPct - targetPct
    return {
      projectedPct: Math.round(projectedPct),
      variance: Math.round(variance),
    }
  })()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[3], flexShrink: 0 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: TOKENS.fontSizes.sm,
          fontWeight: TOKENS.fontWeights.black,
          color: TOKENS.colors.textPrimary,
          letterSpacing: TOKENS.letterSpacing.normal,
        }}>
          Cumulative target progress
          <InfoTooltip
            label="Cumulative target"
            body={`Capital unlocks the moment cumulative net yield reaches ${targetLabel}, even if maturity hasn't been reached. The bar shows yield-to-target; the vertical tick shows time elapsed for the same window.`}
          />
        </span>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          color: isTargetReached ? TOKENS.colors.accent : TOKENS.colors.textSecondary,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {progress}% of {targetLabel}{isTargetReached ? ' · reached' : ` · ${paceLabel.toLowerCase()}`}
        </span>
      </div>

      {/* Yield progress bar with time-elapsed marker */}
      <div style={{
        position: 'relative',
        height: TOKENS.bar.thin,
        background: TOKENS.colors.bgTertiary,
        borderRadius: TOKENS.radius.full,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${yieldFillPct}%`,
          background: TOKENS.colors.accent,
          borderRadius: TOKENS.radius.full,
          transition: `width ${TOKENS.transitions.durSlow} ease`,
        }} />
        {/* Time-elapsed marker — vertical tick showing where we should be */}
        {timeFillPct > 0 && timeFillPct < 100 && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: -2,
              bottom: -2,
              left: `${timeFillPct}%`,
              width: 2,
              background: TOKENS.colors.textPrimary,
              transform: 'translateX(-1px)',
            }}
          />
        )}
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: `${TOKENS.spacing[1]} ${TOKENS.spacing[3]}`,
        fontSize: TOKENS.fontSizes.xs,
        color: TOKENS.colors.textSecondary,
        lineHeight: LINE_HEIGHT.body,
      }}>
        <span style={{ flex: '1 1 240px', minWidth: 0 }}>
          Capital unlocks when the {targetLabel} target is reached or at {maturityLabel}, whichever comes first.
        </span>
        <span style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: TOKENS.spacing[3],
          fontFamily: TOKENS.fonts.mono,
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}>
          {projection && (
            <span style={{
              whiteSpace: 'nowrap',
              color: TOKENS.colors.textSecondary,
            }}>
              Projected{' '}
              <span style={{
                color: projection.variance >= 0 ? TOKENS.colors.accent : TOKENS.colors.warning,
                fontWeight: TOKENS.fontWeights.bold,
              }}>
                {projection.projectedPct}%
              </span>
              {' '}at maturity
              {projection.variance !== 0 && (
                <span style={{ color: TOKENS.colors.textGhost }}>
                  {' '}({projection.variance > 0 ? '+' : ''}{projection.variance}%)
                </span>
              )}
            </span>
          )}
          <span style={{
            color: TOKENS.colors.textGhost,
            whiteSpace: 'nowrap',
          }}>
            Day {elapsedDays} / {lockPeriodDays}
          </span>
        </span>
      </div>
    </div>
  )
}


/** DetailCard — Container for the 2-col grid sections of vault detail page. */
function DetailCard({
  title,
  accent = false,
  headerRight,
  children,
}: {
  title: string
  accent?: boolean
  headerRight?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: TOKENS.colors.black,
        border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
        borderRadius: TOKENS.radius.lg,
        padding: TOKENS.spacing[5],
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        flex: 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: TOKENS.spacing[2],
          marginBottom: TOKENS.spacing[3],
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[2], minWidth: 0 }}>
          <span
            style={{
              width: 3,
              height: 14,
              background: accent ? TOKENS.colors.accent : TOKENS.colors.borderStrong,
              borderRadius: TOKENS.radius.full,
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <h3
            style={{
              margin: 0,
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.xs,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              color: TOKENS.colors.textSecondary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </h3>
        </div>
        {headerRight && <div style={{ flexShrink: 0 }}>{headerRight}</div>}
      </div>
      <div style={{ minHeight: 0, overflow: 'auto', flex: 1 }} className="hide-scrollbar">
        {children}
      </div>
    </div>
  )
}

/** YieldPaidBars — vertical bar chart of monthly yield distributions in USD,
 * derived from historical yield % × current capital deployed. Includes a
 * 12-month total and per-bar peak label so the chart isn't decorative. */
function YieldPaidBars({
  returns,
  capitalDeployed,
}: {
  returns: Array<{ month: string; yieldPct: number }>
  capitalDeployed: number
}) {
  const monthly = returns.map((r) => (r.yieldPct / 100 / 12) * capitalDeployed)
  const max = Math.max(1, ...monthly)
  const total = monthly.reduce((s, v) => s + v, 0)
  const avg = monthly.length > 0 ? total / monthly.length : 0
  const maxIndex = monthly.indexOf(Math.max(...monthly))

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: TOKENS.spacing[3],
      width: '100%',
      minWidth: 0,
    }}>
      {/* Summary header: 12-mo total + monthly average */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: `${TOKENS.spacing[1]} ${TOKENS.spacing[3]}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: TOKENS.spacing[2], minWidth: 0 }}>
          <span style={{
            fontFamily: TOKENS.fonts.mono,
            fontSize: TOKENS.fontSizes.lg,
            fontWeight: TOKENS.fontWeights.black,
            color: TOKENS.colors.accent,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: LINE_HEIGHT.tight,
          }}>
            {fmtUsdCompact(total)}
          </span>
          <span style={{
            fontFamily: TOKENS.fonts.mono,
            fontSize: TOKENS.fontSizes.micro,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
            color: TOKENS.colors.textGhost,
            whiteSpace: 'nowrap',
          }}>
            12-mo total
          </span>
        </div>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.xs,
          color: TOKENS.colors.textSecondary,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}>
          Avg {fmtUsdCompact(avg)} / mo
        </span>
      </div>

      {/* Bars */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: TOKENS.spacing[1],
        height: 96,
      }}>
        {monthly.map((v, i) => {
          const isPeak = i === maxIndex
          return (
            <div
              key={i}
              style={{
                position: 'relative',
                flex: 1,
                height: `${(v / max) * 100}%`,
                minHeight: 4,
                background: isPeak ? TOKENS.colors.accent : TOKENS.colors.borderStrong,
                borderTopLeftRadius: TOKENS.radius.xs,
                borderTopRightRadius: TOKENS.radius.xs,
              }}
              title={`M${i + 1} · ${fmtUsdCompact(v)}`}
            >
              {isPeak && (
                <span style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: TOKENS.spacing[1],
                  fontFamily: TOKENS.fonts.mono,
                  fontSize: TOKENS.fontSizes.nano,
                  fontWeight: TOKENS.fontWeights.bold,
                  color: TOKENS.colors.accent,
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}>
                  {fmtUsdCompact(v)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Month labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: TOKENS.spacing[1],
        fontFamily: TOKENS.fonts.mono,
        fontSize: TOKENS.fontSizes.nano,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        color: TOKENS.colors.textGhost,
      }}>
        {monthly.map((_, i) => (
          <span key={i} style={{ flex: 1, textAlign: 'center' }}>M{i + 1}</span>
        ))}
      </div>
    </div>
  )
}

/** CapitalRecoveryStatus — live safeguard summary. Shows current cushion vs
 * deposit, the maturity → recovery-extension timeline, and the explanatory copy. */
function CapitalRecoveryStatus({
  capitalDeployed,
  currentValue,
  lockPeriodDays,
  daysRemaining,
  recoveryYears,
}: {
  capitalDeployed: number
  currentValue: number
  lockPeriodDays: number
  daysRemaining: number
  recoveryYears: number
}) {
  const cushion = currentValue - capitalDeployed
  const isAboveDeposit = cushion >= 0
  const elapsedDays = Math.max(0, lockPeriodDays - daysRemaining)
  const lockProgress = lockPeriodDays > 0 ? Math.min(100, (elapsedDays / lockPeriodDays) * 100) : 0
  const recoveryDays = recoveryYears * 365
  const totalDays = lockPeriodDays + recoveryDays
  const lockShare = totalDays > 0 ? (lockPeriodDays / totalDays) * 100 : 100

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: TOKENS.spacing[4],
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: TOKENS.spacing[3],
      }}>
        <span style={{
          fontSize: TOKENS.fontSizes.sm,
          fontWeight: TOKENS.fontWeights.black,
          color: isAboveDeposit ? TOKENS.colors.accent : TOKENS.colors.warning,
          display: 'inline-flex',
          alignItems: 'center',
          gap: TOKENS.spacing[2],
        }}>
          <span aria-hidden>{isAboveDeposit ? '✓' : '!'}</span>
          {isAboveDeposit ? 'Safeguard active — not triggered' : 'Below deposit — extension would activate'}
          <InfoTooltip
            label="Capital recovery safeguard"
            body={`If position value ends below your initial deposit at maturity, mining infrastructure keeps operating up to ${recoveryYears} additional ${recoveryYears === 1 ? 'year' : 'years'} with all output routed to recovering principal.`}
          />
        </span>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.nano,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          color: TOKENS.colors.textGhost,
          padding: `${TOKENS.spacing.half} ${TOKENS.spacing[2]}`,
          background: TOKENS.colors.bgTertiary,
          border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
          borderRadius: TOKENS.radius.full,
        }}>
          auto
        </span>
      </div>

      {/* Current cushion */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: TOKENS.spacing[3],
        paddingBottom: TOKENS.spacing[3],
        borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
      }}>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.micro,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          color: TOKENS.colors.textGhost,
        }}>
          {isAboveDeposit ? 'Above deposit' : 'Shortfall'}
        </span>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.md,
          fontWeight: TOKENS.fontWeights.black,
          color: isAboveDeposit ? TOKENS.colors.accent : TOKENS.colors.warning,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {isAboveDeposit ? '+' : '−'}{fmtUsdCompact(Math.abs(cushion))}
        </span>
      </div>

      {/* Lock + recovery timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[2], minWidth: 0 }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: `${TOKENS.spacing[1]} ${TOKENS.spacing[2]}`,
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.nano,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          color: TOKENS.colors.textGhost,
        }}>
          <span style={{ whiteSpace: 'nowrap' }}>Lock · {lockPeriodDays}d</span>
          <span style={{ whiteSpace: 'nowrap' }}>Recovery · +{recoveryYears}y</span>
        </div>
        <div style={{
          position: 'relative',
          display: 'flex',
          height: TOKENS.bar.thin,
          borderRadius: TOKENS.radius.full,
          overflow: 'hidden',
          background: TOKENS.colors.bgTertiary,
        }}>
          <div style={{
            width: `${lockShare}%`,
            background: TOKENS.colors.borderStrong,
            position: 'relative',
          }}>
            <div style={{
              height: '100%',
              width: `${lockProgress}%`,
              background: TOKENS.colors.accent,
            }} />
          </div>
          <div style={{
            flex: 1,
            background: TOKENS.colors.bgTertiary,
            borderLeft: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
          }} />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: TOKENS.spacing[2],
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.nano,
          color: TOKENS.colors.textSecondary,
          fontVariantNumeric: 'tabular-nums',
        }}>
          <span style={{ whiteSpace: 'nowrap' }}>Day {elapsedDays}</span>
          <span style={{ whiteSpace: 'nowrap', color: TOKENS.colors.textGhost }}>Maturity</span>
          <span style={{ whiteSpace: 'nowrap' }}>+{recoveryDays}d</span>
        </div>
      </div>

      <p style={{
        margin: 0,
        fontSize: TOKENS.fontSizes.xs,
        color: TOKENS.colors.textSecondary,
        lineHeight: LINE_HEIGHT.body,
      }}>
        If principal is below initial deposit at maturity, mining infrastructure
        continues operating up to {recoveryYears} additional {recoveryYears === 1 ? 'year' : 'years'},
        output directed exclusively to capital recovery.
      </p>
    </div>
  )
}

/** RegimeIndicator — 3-segment dot strip making the active market regime
 * glanceable. The active segment is filled with its semantic color (green for
 * bull, ghost for sideways, danger for bear), the others are outlined. */
function RegimeIndicator({ activeRegime }: { activeRegime: MarketRegime }) {
  const order: MarketRegime[] = ['bear', 'sideways', 'bull']
  const activeColor: Record<MarketRegime, string> = {
    bull: TOKENS.colors.accent,
    sideways: TOKENS.colors.textSecondary,
    bear: TOKENS.colors.danger,
  }
  const labels: Record<MarketRegime, string> = {
    bull: 'Bull',
    sideways: 'Sideways',
    bear: 'Bear',
  }
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: TOKENS.spacing[2],
    }}>
      {order.map((regime, i) => {
        const isActive = regime === activeRegime
        return (
          <span
            key={regime}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: TOKENS.spacing[2],
              flex: 1,
              minWidth: 0,
            }}
          >
            <span style={{
              width: TOKENS.dot.md,
              height: TOKENS.dot.md,
              borderRadius: TOKENS.radius.full,
              background: isActive ? activeColor[regime] : 'transparent',
              border: `${TOKENS.borders.thin} solid ${isActive ? activeColor[regime] : TOKENS.colors.borderSubtle}`,
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.nano,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              color: isActive ? TOKENS.colors.textPrimary : TOKENS.colors.textGhost,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {labels[regime]}
            </span>
            {i < order.length - 1 && (
              <span aria-hidden style={{
                flex: 1,
                height: TOKENS.borders.thin,
                background: TOKENS.colors.borderSubtle,
                minWidth: TOKENS.spacing[3],
              }} />
            )}
          </span>
        )
      })}
    </div>
  )
}

/** StrategyDetailsBody — Renders the active market regime, the segmented
 * allocation bar with legend, and the 3 scenario cards (Bull / Sideways / Bear).
 * The currently-active scenario is highlighted with the accent border. */
function StrategyDetailsBody({
  vaultConfig,
  activeRegime,
}: {
  vaultConfig: VaultConfig | null
  activeRegime: MarketRegime
}) {
  const weights = vaultConfig?.rebalanceWeights
  if (!weights) {
    return (
      <p style={{ margin: 0, fontSize: TOKENS.fontSizes.sm, color: TOKENS.colors.textGhost }}>
        Strategy data not available.
      </p>
    )
  }

  const regimeLabel: Record<MarketRegime, string> = {
    bull: 'Bull — accelerate growth',
    sideways: 'Sideways — baseline mix',
    bear: 'Bear — protect capital',
  }
  const scenarioTitle: Record<MarketRegime, string> = {
    bull: 'Accelerate growth',
    sideways: 'Baseline mix',
    bear: 'Protect capital',
  }
  const activeWeights = weights[activeRegime]
  const total = activeWeights.reduce((s, w) => s + w.pct, 0) || 1

  const riskMetrics: Array<{ label: string; value: string }> = []
  if (vaultConfig?.risk) riskMetrics.push({ label: 'Risk', value: vaultConfig.risk })
  if (typeof vaultConfig?.volatility === 'number') riskMetrics.push({ label: 'σ', value: `${vaultConfig.volatility.toFixed(1)}%` })
  if (typeof vaultConfig?.maxDrawdown === 'number') riskMetrics.push({ label: 'Max DD', value: `${vaultConfig.maxDrawdown.toFixed(1)}%` })
  if (typeof vaultConfig?.sharpe === 'number') riskMetrics.push({ label: 'Sharpe', value: vaultConfig.sharpe.toFixed(2) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[4] }}>
      {/* Risk metrics row — only renders if at least one metric is configured */}
      {riskMetrics.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: `${TOKENS.spacing[1]} ${TOKENS.spacing[4]}`,
          paddingBottom: TOKENS.spacing[3],
          borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
        }}>
          {riskMetrics.map((m) => (
            <span key={m.label} style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: TOKENS.spacing[2],
              minWidth: 0,
            }}>
              <span style={{
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.nano,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
                color: TOKENS.colors.textGhost,
              }}>
                {m.label}
              </span>
              <span style={{
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.black,
                color: TOKENS.colors.textPrimary,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {m.value}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Active regime — text label + 3-segment visual indicator (bear ◯—●—◯ bull) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: TOKENS.spacing[3],
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: TOKENS.spacing[2],
          flexWrap: 'wrap',
          fontSize: TOKENS.fontSizes.sm,
          color: TOKENS.colors.textSecondary,
        }}>
          <span>Current market regime:</span>
          <span style={{ color: TOKENS.colors.textPrimary, fontWeight: TOKENS.fontWeights.black }}>
            {regimeLabel[activeRegime]}
          </span>
        </div>
        <RegimeIndicator activeRegime={activeRegime} />
      </div>

      {/* Segmented allocation bar */}
      <div style={{
        display: 'flex',
        height: TOKENS.bar.thin,
        borderRadius: TOKENS.radius.full,
        overflow: 'hidden',
        background: TOKENS.colors.bgTertiary,
      }}>
        {activeWeights.map((slice, i) => (
          <div
            key={slice.label}
            style={{
              flex: slice.pct / total,
              background: CHART_PALETTE[i % CHART_PALETTE.length],
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: TOKENS.spacing[4],
        fontSize: TOKENS.fontSizes.xs,
      }}>
        {activeWeights.map((slice, i) => (
          <span key={slice.label} style={{ display: 'inline-flex', alignItems: 'center', gap: TOKENS.spacing[2] }}>
            <span style={{
              width: TOKENS.dot.sm,
              height: TOKENS.dot.sm,
              borderRadius: TOKENS.radius.full,
              background: CHART_PALETTE[i % CHART_PALETTE.length],
              flexShrink: 0,
            }} />
            <span style={{ color: TOKENS.colors.textSecondary }}>{slice.label}</span>
            <span style={{
              fontFamily: TOKENS.fonts.mono,
              fontWeight: TOKENS.fontWeights.bold,
              color: TOKENS.colors.textPrimary,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {slice.pct}%
            </span>
          </span>
        ))}
      </div>

      {/* Dynamic allocation copy — single compact paragraph, no separate header */}
      <p style={{
        margin: 0,
        paddingTop: TOKENS.spacing[3],
        borderTop: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
        fontSize: TOKENS.fontSizes.xs,
        color: TOKENS.colors.textSecondary,
        lineHeight: LINE_HEIGHT.body,
      }}>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          color: TOKENS.colors.textGhost,
          marginRight: TOKENS.spacing[2],
        }}>
          Dynamic allocation
        </span>
        Automated controls rebalance pocket weights, tighten volatility thresholds,
        and shift rewards toward defensive strategies in downturns.
      </p>

      {/* 3 scenario cards — compact (regime pill + title + 2-line pitch + mini bar). */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: TOKENS.spacing[2],
      }}>
        {(['bull', 'sideways', 'bear'] as const).map((regime) => {
          const isActive = regime === activeRegime
          const sliceWeights = weights[regime]
          const sliceTotal = sliceWeights.reduce((s, w) => s + w.pct, 0) || 1
          const dotColor: Record<MarketRegime, string> = {
            bull: TOKENS.colors.accent,
            sideways: TOKENS.colors.textGhost,
            bear: TOKENS.colors.danger,
          }
          const pitch = sliceWeights[0]?.pitch ?? ''

          return (
            <div
              key={regime}
              style={{
                background: isActive ? TOKENS.colors.accentSubtle : TOKENS.colors.bgTertiary,
                border: `${TOKENS.borders.thin} solid ${isActive ? TOKENS.colors.accent : TOKENS.colors.borderSubtle}`,
                borderRadius: TOKENS.radius.md,
                padding: TOKENS.spacing[3],
                display: 'flex',
                flexDirection: 'column',
                gap: TOKENS.spacing[2],
                minWidth: 0,
              }}
            >
              {/* Scenario label */}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: TOKENS.spacing[2],
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.nano,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
                color: isActive ? TOKENS.colors.accent : TOKENS.colors.textSecondary,
                width: 'fit-content',
                padding: `${TOKENS.spacing.half} ${TOKENS.spacing[2]}`,
                background: TOKENS.colors.black,
                border: `${TOKENS.borders.thin} solid ${isActive ? TOKENS.colors.accent : TOKENS.colors.borderSubtle}`,
                borderRadius: TOKENS.radius.full,
              }}>
                <span style={{
                  width: TOKENS.dot.sm,
                  height: TOKENS.dot.sm,
                  borderRadius: TOKENS.radius.full,
                  background: dotColor[regime],
                  flexShrink: 0,
                }} />
                {regime}{isActive ? ' · active' : ''}
              </span>
              <div style={{
                fontSize: TOKENS.fontSizes.sm,
                fontWeight: TOKENS.fontWeights.black,
                color: TOKENS.colors.textPrimary,
              }}>
                {scenarioTitle[regime]}
              </div>
              <p style={{
                margin: 0,
                fontSize: TOKENS.fontSizes.xs,
                color: TOKENS.colors.textSecondary,
                lineHeight: LINE_HEIGHT.body,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {pitch}
              </p>
              {/* Mini allocation bar for this scenario */}
              <div style={{
                marginTop: 'auto',
                display: 'flex',
                height: TOKENS.bar.thin,
                borderRadius: TOKENS.radius.full,
                overflow: 'hidden',
                background: TOKENS.colors.bgTertiary,
              }}>
                {sliceWeights.map((slice, i) => (
                  <div
                    key={slice.label}
                    style={{
                      flex: slice.pct / sliceTotal,
                      background: CHART_PALETTE[i % CHART_PALETTE.length],
                    }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type ActivityEvent = {
  id: string
  type: 'deposit' | 'claim' | 'withdraw' | 'fee'
  amount: number
  timestamp: number
  txHash?: string
}

type TimelineRow =
  | { kind: 'event'; event: ActivityEvent }
  | { kind: 'group'; id: string; count: number; total: number; latestTimestamp: number; earliestTimestamp: number }

type TimelineFilter = 'all' | 'claim' | 'fee' | 'deposit'

function applyTimelineFilter(events: ActivityEvent[], filter: TimelineFilter): ActivityEvent[] {
  if (filter === 'all') return events
  // Withdrawals fold into the deposit chip — they're principal-side movements
  // from the user's standpoint. Claims and fees stay isolated.
  if (filter === 'deposit') return events.filter((e) => e.type === 'deposit' || e.type === 'withdraw')
  return events.filter((e) => e.type === filter)
}

function countByType(events: ActivityEvent[]): Record<TimelineFilter, number> {
  return {
    all: events.length,
    claim: events.filter((e) => e.type === 'claim').length,
    fee: events.filter((e) => e.type === 'fee').length,
    deposit: events.filter((e) => e.type === 'deposit' || e.type === 'withdraw').length,
  }
}

function ActivityFilterChips({
  value,
  onChange,
  counts,
}: {
  value: TimelineFilter
  onChange: (next: TimelineFilter) => void
  counts: Record<TimelineFilter, number>
}) {
  const chips: Array<{ id: TimelineFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'claim', label: 'Claims' },
    { id: 'fee', label: 'Fees' },
    { id: 'deposit', label: 'Deposits' },
  ]
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: TOKENS.spacing[2],
      marginBottom: TOKENS.spacing[3],
    }}>
      {chips.map((c) => {
        const isActive = c.id === value
        const count = counts[c.id]
        const isDisabled = c.id !== 'all' && count === 0
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => !isDisabled && onChange(c.id)}
            disabled={isDisabled}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: TOKENS.spacing[2],
              padding: `${TOKENS.spacing.half} ${TOKENS.spacing[2]}`,
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.nano,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              color: isActive ? TOKENS.colors.accent : isDisabled ? TOKENS.colors.textGhost : TOKENS.colors.textSecondary,
              background: isActive ? TOKENS.colors.accentSubtle : TOKENS.colors.bgTertiary,
              border: `${TOKENS.borders.thin} solid ${isActive ? TOKENS.colors.accent : TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radius.full,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.5 : 1,
              transition: TOKENS.transitions.fast,
            }}
          >
            <span>{c.label}</span>
            <span style={{
              color: isActive ? TOKENS.colors.accent : TOKENS.colors.textGhost,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

const MAX_TIMELINE_ROWS = 5

/** buildVaultTimeline — collapses runs of consecutive daily 'claim' events
 * (sorted desc by timestamp) into a single rolled-up "Daily distributions"
 * row, then truncates to MAX_TIMELINE_ROWS so the card never needs to scroll. */
function buildVaultTimeline(activity: ActivityEvent[]): TimelineRow[] {
  const sorted = [...activity].sort((a, b) => b.timestamp - a.timestamp)
  const rows: TimelineRow[] = []
  let i = 0
  while (i < sorted.length) {
    const current = sorted[i]
    if (current.type !== 'claim') {
      rows.push({ kind: 'event', event: current })
      i += 1
      continue
    }
    let j = i + 1
    let total = current.amount
    let earliest = current.timestamp
    while (j < sorted.length && sorted[j].type === 'claim') {
      total += sorted[j].amount
      earliest = sorted[j].timestamp
      j += 1
    }
    if (j - i === 1) {
      rows.push({ kind: 'event', event: current })
    } else {
      rows.push({
        kind: 'group',
        id: `group-${current.id}`,
        count: j - i,
        total,
        latestTimestamp: current.timestamp,
        earliestTimestamp: earliest,
      })
    }
    i = j
  }
  return rows.slice(0, MAX_TIMELINE_ROWS)
}

/** TxHashLink — Renders a tx hash as a link to the chain's block explorer when
 * the hash looks real (full `0x` hex, no demo ellipsis). Falls back to plain
 * text when either the hash is a demo placeholder or no explorer is configured. */
function TxHashLink({ hash, explorerUrl }: { hash: string; explorerUrl?: string }) {
  const isFullHash = /^0x[0-9a-fA-F]{64}$/.test(hash)
  const display = isFullHash ? `${hash.slice(0, 6)}…${hash.slice(-4)}` : hash
  if (!isFullHash || !explorerUrl) {
    return <span>{display}</span>
  }
  return (
    <a
      href={`${explorerUrl.replace(/\/$/, '')}/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: TOKENS.colors.textSecondary,
        textDecoration: 'underline',
        textDecorationColor: TOKENS.colors.borderSubtle,
        textUnderlineOffset: '3px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = TOKENS.colors.accent
        e.currentTarget.style.textDecorationColor = TOKENS.colors.accent
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = TOKENS.colors.textSecondary
        e.currentTarget.style.textDecorationColor = TOKENS.colors.borderSubtle
      }}
      onFocus={(e) => {
        e.currentTarget.style.color = TOKENS.colors.accent
        e.currentTarget.style.textDecorationColor = TOKENS.colors.accent
      }}
      onBlur={(e) => {
        e.currentTarget.style.color = TOKENS.colors.textSecondary
        e.currentTarget.style.textDecorationColor = TOKENS.colors.borderSubtle
      }}
    >
      {display}
    </a>
  )
}

/** VaultActivityTimeline — Compact list of recent events for this vault.
 * Mirrors the mockup: bold title, "DD MMM YYYY · tx 0x…" sub-line, amount and
 * cadence label aligned right. Consecutive daily claims are rolled up into a
 * single grouped row so deposits and fees stay visible. When a real tx hash is
 * available (no truncation ellipsis) and the chain exposes an explorer URL,
 * the hash renders as a link to that explorer. */
function VaultActivityTimeline({
  timeline,
  explorerUrl,
}: {
  timeline: TimelineRow[]
  explorerUrl?: string
}) {
  if (timeline.length === 0) {
    return (
      <div style={{
        padding: `${TOKENS.spacing[4]} 0`,
        textAlign: 'center',
        fontSize: TOKENS.fontSizes.xs,
        color: TOKENS.colors.textGhost,
      }}>
        No activity recorded yet
      </div>
    )
  }

  const eventStyle = (type: ActivityEvent['type']): {
    label: string
    cadence: string
    amountColor: string
    sign: '+' | '−'
    glyph: string
    glyphColor: string
  } => {
    switch (type) {
      case 'claim':
        return { label: 'Yield distribution', cadence: 'daily',   amountColor: TOKENS.colors.accent,         sign: '+', glyph: '↓', glyphColor: TOKENS.colors.accent }
      case 'fee':
        return { label: 'Performance fee',     cadence: 'monthly', amountColor: TOKENS.colors.danger,         sign: '−', glyph: '−', glyphColor: TOKENS.colors.danger }
      case 'deposit':
        return { label: 'Initial deposit',     cadence: 'deposit', amountColor: TOKENS.colors.textPrimary,    sign: '+', glyph: '+', glyphColor: TOKENS.colors.textSecondary }
      case 'withdraw':
        return { label: 'Position withdrawn',  cadence: 'exit',    amountColor: TOKENS.colors.danger,         sign: '−', glyph: '↑', glyphColor: TOKENS.colors.danger }
    }
  }

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {timeline.map((row, i) => {
        const isLast = i === timeline.length - 1
        const borderBottom = isLast ? 'none' : `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`
        if (row.kind === 'group') {
          return (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: `${TOKENS.spacing[6]} 1fr auto`,
                alignItems: 'center',
                gap: TOKENS.spacing[3],
                padding: `${TOKENS.spacing[3]} 0`,
                borderBottom,
                flexShrink: 0,
              }}
            >
              <span style={{
                width: TOKENS.spacing[6],
                height: TOKENS.spacing[6],
                borderRadius: TOKENS.radius.full,
                background: TOKENS.colors.bgTertiary,
                border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: TOKENS.colors.accent,
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.black,
              }}>
                ↓
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: TOKENS.fontSizes.xs,
                  fontWeight: TOKENS.fontWeights.bold,
                  color: TOKENS.colors.textPrimary,
                }}>
                  Daily yield · {row.count} distributions
                </div>
                <div style={{
                  fontSize: TOKENS.fontSizes.micro,
                  color: TOKENS.colors.textGhost,
                  fontFamily: TOKENS.fonts.mono,
                }}>
                  {formatDate(row.earliestTimestamp)} → {formatDate(row.latestTimestamp)}
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: TOKENS.spacing[2],
              }}>
                <span style={{
                  fontFamily: TOKENS.fonts.mono,
                  fontSize: TOKENS.fontSizes.xs,
                  fontWeight: TOKENS.fontWeights.black,
                  color: TOKENS.colors.accent,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  +{fmtUsdCompact(row.total)} USDC
                </span>
                <span style={{
                  fontFamily: TOKENS.fonts.mono,
                  fontSize: TOKENS.fontSizes.micro,
                  color: TOKENS.colors.textGhost,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                }}>
                  total
                </span>
              </div>
            </div>
          )
        }

        const event = row.event
        const cfg = eventStyle(event.type)
        return (
          <div
            key={event.id}
            style={{
              display: 'grid',
              gridTemplateColumns: `${TOKENS.spacing[6]} 1fr auto`,
              alignItems: 'center',
              gap: TOKENS.spacing[3],
              padding: `${TOKENS.spacing[3]} 0`,
              borderBottom,
              flexShrink: 0,
            }}
          >
            <span style={{
              width: TOKENS.spacing[6],
              height: TOKENS.spacing[6],
              borderRadius: TOKENS.radius.full,
              background: TOKENS.colors.bgTertiary,
              border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: cfg.glyphColor,
              fontSize: TOKENS.fontSizes.xs,
              fontWeight: TOKENS.fontWeights.black,
            }}>
              {cfg.glyph}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.bold,
                color: TOKENS.colors.textPrimary,
              }}>
                {cfg.label}
              </div>
              <div style={{
                fontSize: TOKENS.fontSizes.micro,
                color: TOKENS.colors.textGhost,
                fontFamily: TOKENS.fonts.mono,
              }}>
                {formatDate(event.timestamp)}
                {event.txHash && (
                  <>
                    {' · tx '}
                    <TxHashLink hash={event.txHash} explorerUrl={explorerUrl} />
                  </>
                )}
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: TOKENS.spacing[2],
            }}>
              <span style={{
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.black,
                color: cfg.amountColor,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {cfg.sign}{fmtUsdCompact(event.amount)} USDC
              </span>
              <span style={{
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.micro,
                color: TOKENS.colors.textGhost,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
              }}>
                {cfg.cadence}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}


