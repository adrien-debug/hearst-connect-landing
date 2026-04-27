'use client'

import { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { TOKENS, fmtUsdCompact, LINE_HEIGHT, VALUE_LETTER_SPACING, CHART_PALETTE } from './constants'
import { formatVaultName } from './formatting'
import { Modal, TransactionState } from './modal'
import type { ActiveVault, MaturedVault } from './data'
import type { VaultConfig } from '@/types/vault'
import { useSmartFit, useShellPadding, fitValue } from './smart-fit'
import type { SmartFitMode } from './smart-fit'
import { ActionButton } from './action-button'
import { usePositionData } from '@/hooks/usePositionData'
import { useVaultActions } from '@/hooks/useVault'
import { useVaultById } from '@/hooks/useVaultRegistry'
import { useTransaction } from '@/hooks/useTransaction'
import { Skeleton } from './skeleton'
import { WalletNotConnected, VaultNotConfigured, OnChainError } from './empty-states'
import { useLiveActions } from '@/hooks/useLiveActions'
import { useUserData } from '@/hooks/useUserData'

type ModalType = 'claim' | 'manage' | 'exit' | null

export function VaultDetailPanel({
  vault,
  onBack,
}: {
  vault: ActiveVault | MaturedVault
  onBack?: () => void
}) {
  const { address: connectedAddress } = useAccount()
  const { mode } = useSmartFit({
    tightHeight: 880,
    limitHeight: 720,
    tightWidth: 1280,
    limitWidth: 1024,
    reserveHeight: 64,
    reserveWidth: 280,
  })
  const { padding: shellPadding, gap: shellGap } = useShellPadding(mode)

  const vaultConfig = useVaultById(vault.id)

  const {
    data: positionData,
    isLoading,
    error,
    refresh,
    isVaultConfigured,
    isWalletConnected,
    vaultAddress,
  } = usePositionData({
    vaultId: vault.id,
    walletAddress: connectedAddress,
  })

  const { isPending: isActionPending } = useVaultActions(
    isVaultConfigured ? vaultAddress : undefined
  )

  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const transaction = useTransaction()

  // Hooks must run on every render — keep BEFORE the early returns below
  // (Rules of Hooks: order must be stable across renders).
  const { claim: liveClaim, withdraw: liveWithdraw } = useLiveActions(vault.id)
  const { activity: allActivity } = useUserData()
  const [activityFilter, setActivityFilter] = useState<'all' | 'claim' | 'deposit'>('all')
  const vaultActivityRaw = useMemo(
    () => allActivity.filter((a) => a.vaultId === vault.id),
    [allActivity, vault.id],
  )
  const vaultActivity = useMemo(() => {
    const filtered = activityFilter === 'all'
      ? vaultActivityRaw
      : vaultActivityRaw.filter((a) => a.type === activityFilter)
    return filtered.slice(0, 6)
  }, [vaultActivityRaw, activityFilter])

  if (!isVaultConfigured) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: `${shellPadding}px`,
          gap: `${shellGap}px`,
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
        <VaultNotConfigured />
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
          padding: `${shellPadding}px`,
          gap: `${shellGap}px`,
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
        <WalletNotConnected />
      </div>
    )
  }

  const capitalDeployed = positionData?.capitalDeployed ?? 0
  const accruedYield = positionData?.accruedYield ?? 0
  const currentValue = positionData?.positionValue ?? 0
  const daysRemaining = positionData?.unlockTimeline.daysRemaining ?? vaultConfig?.lockPeriodDays ?? 0
  const progressToTarget = positionData?.unlockTimeline.progressPercent ?? 0
  const isMatured = vault.type === 'matured'
  const unlockDays = Math.max(0, daysRemaining)
  const isTargetReached = positionData?.isTargetReached ?? false

  const isPositionReadyForExit = positionData?.canWithdraw ?? false
  const statusLabel = isPositionReadyForExit ? 'Ready for exit' : 'Active'

  const handleClaim = async () => {
    await transaction.execute(
      async () => {
        const result = await liveClaim()
        if (!result.success) {
          throw new Error(result.error || 'Claim failed')
        }
        await new Promise((resolve) => setTimeout(resolve, 2000))
        refresh()
      },
      {
        pending: 'Processing claim...',
        success: `Claimed ${fmtUsdCompact(accruedYield)} successfully!`,
        error: 'Claim failed. Please try again.',
      }
    )
  }

  const handleExit = async () => {
    await transaction.execute(
      async () => {
        const result = await liveWithdraw()
        if (!result.success) {
          throw new Error(result.error || 'Withdraw failed')
        }
        await new Promise((resolve) => setTimeout(resolve, 3000))
        refresh()
      },
      {
        pending: 'Processing exit...',
        success: 'Position exited successfully!',
        error: 'Exit failed. Please contact support.',
      }
    )
  }

  if (error && error.code !== 'WALLET_NOT_CONNECTED' && error.code !== 'VAULT_NOT_FOUND') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: `${shellPadding}px`,
          gap: `${shellGap}px`,
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
        accruedYield={accruedYield}
        statusLabel={statusLabel}
        isReadyForExit={isPositionReadyForExit}
        onBack={onBack}
        onClaim={() => setActiveModal('claim')}
        onManage={() => setActiveModal('manage')}
        onExit={() => setActiveModal('exit')}
        mode={mode}
        shellPadding={shellPadding}
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
          <KpiCell label="Deposited" value={fmtUsdCompact(capitalDeployed)} />
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
          />
          <KpiCell
            label="Yield paid"
            value={fmtUsdCompact(accruedYield)}
            valueAccent={accruedYield > 0}
            subtext="USDC"
          />
          <KpiCell
            label="Matures"
            value={isMatured ? 'Matured' : formatMaturityDate(positionData?.unlockTimeline.maturityDate, unlockDays)}
            subtext={vault.maturity}
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
        />

        {/* 2-column detail layout — 4 enriched cards (About+History, Strategy+Composition, Terms, Activity) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: fitValue(mode, {
              normal: '1.2fr 1fr',
              tight: '1fr 1fr',
              limit: '1fr',
            }),
            gap: shellGap,
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {/* LEFT: Yield paid 12mo → Strategy details */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: shellGap,
            minHeight: 0,
            overflow: 'auto',
          }}>
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

            <DetailCard title="Strategy details">
              <VaultStrategyList vault={vault} vaultConfig={vaultConfig} />
              {vaultConfig?.composition && vaultConfig.composition.length > 0 && (
                <VaultCompositionBars composition={vaultConfig.composition} />
              )}
            </DetailCard>
          </div>

          {/* RIGHT: Capital recovery → Transactions */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: shellGap,
            minHeight: 0,
            overflow: 'auto',
          }}>
            <DetailCard title="Capital recovery status">
              <CapitalRecoveryStatus />
            </DetailCard>
            <DetailCard
              title={`Transactions (${vaultActivityRaw.length})`}
              headerRight={
                <ActivityFilterTabs value={activityFilter} onChange={setActivityFilter} />
              }
            >
              <VaultActivityTimeline activity={vaultActivity} />
            </DetailCard>
          </div>
        </div>
      </div>

      {/* Claim Modal */}
      <Modal
        isOpen={activeModal === 'claim'}
        onClose={() => { setActiveModal(null); transaction.reset() }}
        title="Claim Accrued Yield"
        size="sm"
        mode={mode}
        footer={
          transaction.isIdle && (
            <div style={{ display: 'flex', gap: TOKENS.spacing[3] }}>
              <ActionButton
                label="Cancel"
                variant="secondary"
                onClick={() => setActiveModal(null)}
              />
              <ActionButton
                label="Confirm Claim"
                variant="accent"
                disabled={isActionPending}
                onClick={handleClaim}
              />
            </div>
          )
        }
      >
        {transaction.isIdle && (
          <div style={{ textAlign: 'center', padding: TOKENS.spacing[4] }}>
            <div style={{
              fontSize: TOKENS.fontSizes.xxl,
              fontWeight: TOKENS.fontWeights.black,
              color: TOKENS.colors.accent,
              marginBottom: TOKENS.spacing[3],
            }}>
              {fmtUsdCompact(accruedYield)}
            </div>
            <p style={{ color: TOKENS.colors.textSecondary, margin: 0 }}>
              Available to claim now. This will transfer the accrued yield to your wallet.
            </p>
          </div>
        )}
        {transaction.status !== 'idle' && (
          <TransactionState state={transaction.status} message={transaction.message} />
        )}
      </Modal>

      {/* Manage Modal */}
      <Modal
        isOpen={activeModal === 'manage'}
        onClose={() => setActiveModal(null)}
        title="Manage Position"
        size="md"
        mode={mode}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[4] }}>
          <ManageOption
            title="Add Capital"
            description="Increase your position size to compound returns"
            onClick={() => {}}
          />
          <ManageOption
            title="View History"
            description="See all transactions and yield accruals"
            onClick={() => {}}
          />
          <ManageOption
            title="Download Statement"
            description="Get a PDF summary of your position"
            onClick={() => {}}
          />
          {isPositionReadyForExit && (
            <ManageOption
              title="Exit Position"
              description="Withdraw your capital and accrued yield"
              variant="danger"
              onClick={() => { setActiveModal('exit') }}
            />
          )}
        </div>
      </Modal>

      {/* Exit Modal */}
      <Modal
        isOpen={activeModal === 'exit'}
        onClose={() => { setActiveModal(null); transaction.reset() }}
        title="Exit Position"
        size="sm"
        mode={mode}
        footer={
          transaction.isIdle && (
            <div style={{ display: 'flex', gap: TOKENS.spacing[3] }}>
              <ActionButton
                label="Cancel"
                variant="secondary"
                onClick={() => setActiveModal(null)}
              />
              <ActionButton
                label="Confirm Exit"
                variant="accent"
                disabled={isActionPending}
                onClick={handleExit}
              />
            </div>
          )
        }
      >
        {transaction.isIdle && (
          <div style={{ padding: TOKENS.spacing[4] }}>
            <div style={{
              background: TOKENS.colors.bgSecondary,
              borderRadius: TOKENS.radius.md,
              padding: TOKENS.spacing[4],
              marginBottom: TOKENS.spacing[4],
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: TOKENS.spacing[2],
              }}>
                <span style={{ color: TOKENS.colors.textSecondary }}>Capital to return</span>
                <span style={{ color: TOKENS.colors.textPrimary, fontWeight: TOKENS.fontWeights.bold }}>
                  {fmtUsdCompact(capitalDeployed)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: TOKENS.spacing[2],
              }}>
                <span style={{ color: TOKENS.colors.textSecondary }}>Accrued yield</span>
                <span style={{ color: TOKENS.colors.accent, fontWeight: TOKENS.fontWeights.bold }}>
                  +{fmtUsdCompact(accruedYield)}
                </span>
              </div>
              <div style={{
                borderTop: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
                marginTop: TOKENS.spacing[2],
                paddingTop: TOKENS.spacing[2],
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span style={{ color: TOKENS.colors.textPrimary, fontWeight: TOKENS.fontWeights.black }}>
                  Total payout
                </span>
                <span style={{ color: TOKENS.colors.accent, fontWeight: TOKENS.fontWeights.black }}>
                  {fmtUsdCompact(currentValue)}
                </span>
              </div>
            </div>
            <p style={{ color: TOKENS.colors.textSecondary, fontSize: TOKENS.fontSizes.xs, margin: 0 }}>
              This will close your position and transfer all funds to your wallet.
            </p>
          </div>
        )}
        {transaction.status !== 'idle' && (
          <TransactionState state={transaction.status} message={transaction.message} />
        )}
      </Modal>
    </div>
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
  accruedYield,
  statusLabel,
  isReadyForExit,
  onBack,
  onClaim,
  onManage,
  onExit,
  mode,
  shellPadding,
}: {
  vault: ActiveVault | MaturedVault
  subtitle?: string
  chainName?: string
  accruedYield: number
  statusLabel: string
  isReadyForExit: boolean
  onBack?: () => void
  onClaim: () => void
  onManage: () => void
  onExit: () => void
  mode: SmartFitMode
  shellPadding: number
}) {
  return (
    <div style={{
      padding: fitValue(mode, {
        normal: `${shellPadding}px`,
        tight: `${shellPadding * 0.75}px`,
        limit: `${shellPadding * 0.5}px`,
      }),
      borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
      flexShrink: 0,
      background: TOKENS.colors.black,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: TOKENS.spacing[6],
      flexWrap: mode === 'limit' ? 'wrap' : 'nowrap',
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
        alignItems: 'flex-end',
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
                limit: TOKENS.fontSizes.lg,
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
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              color: TOKENS.colors.textGhost,
            }}>
              APY
            </span>
          </div>
          <span style={{
            fontSize: TOKENS.fontSizes.xs,
            color: TOKENS.colors.textSecondary,
          }}>
            Daily distribution
          </span>
        </div>
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: TOKENS.spacing[2], flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {accruedYield > 0 && (
            <HeaderActionButton label={`Claim ${fmtUsdCompact(accruedYield)}`} onClick={onClaim} variant="accent" />
          )}
          {isReadyForExit ? (
            <HeaderActionButton label="Exit Position" onClick={onExit} variant="danger" />
          ) : (
            <HeaderActionButton label="Manage" onClick={onManage} variant="secondary" />
          )}
        </div>
      </div>
    </div>
  )
}

/** HeaderActionButton — Solid button used in PositionHeader. Replaces the
 *  text-only HeaderActionPill which was hard to spot at a glance. */
function HeaderActionButton({
  label,
  onClick,
  variant,
}: {
  label: string
  onClick: () => void
  variant: 'accent' | 'secondary' | 'danger'
}) {
  const palette = {
    accent: { bg: TOKENS.colors.accentSubtle, fg: TOKENS.colors.accent, border: TOKENS.colors.accent },
    secondary: { bg: 'transparent', fg: TOKENS.colors.textPrimary, border: TOKENS.colors.borderStrong },
    danger: { bg: 'transparent', fg: TOKENS.colors.danger, border: TOKENS.colors.danger },
  }[variant]
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: TOKENS.spacing[2],
        padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[4]}`,
        background: palette.bg,
        color: palette.fg,
        border: `${TOKENS.borders.thin} solid ${palette.border}`,
        borderRadius: TOKENS.radius.md,
        fontFamily: TOKENS.fonts.sans,
        fontSize: TOKENS.fontSizes.xs,
        fontWeight: TOKENS.fontWeights.black,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: TOKENS.transitions.fast,
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        if (variant === 'accent') e.currentTarget.style.filter = 'brightness(1.08)'
        else e.currentTarget.style.background = TOKENS.colors.bgTertiary
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = 'none'
        e.currentTarget.style.background = palette.bg
      }}
    >
      {label}
    </button>
  )
}

function KpiCell({
  label,
  value,
  subtext,
  valueAccent = false,
  subtextAccent = false,
}: {
  label: string
  value: string
  subtext?: string
  valueAccent?: boolean
  subtextAccent?: boolean
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
      }}>
        {label}
      </div>
      <div style={{
        fontSize: TOKENS.fontSizes.xl,
        fontWeight: TOKENS.fontWeights.black,
        letterSpacing: VALUE_LETTER_SPACING,
        color: valueAccent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: LINE_HEIGHT.tight,
      }}>
        {value}
      </div>
      {subtext && (
        <div style={{
          fontSize: TOKENS.fontSizes.xs,
          color: subtextAccent ? TOKENS.colors.accent : TOKENS.colors.textGhost,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: TOKENS.fonts.mono,
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
}: {
  progress: number
  targetLabel: string
  isTargetReached: boolean
  maturityLabel: string
  mode: SmartFitMode
}) {
  const targetPct = parseFloat(targetLabel) || 36
  const fillPct = Math.min(100, (progress / targetPct) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[3], flexShrink: 0 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
      }}>
        <span style={{
          fontSize: TOKENS.fontSizes.sm,
          fontWeight: TOKENS.fontWeights.black,
          color: TOKENS.colors.textPrimary,
          letterSpacing: TOKENS.letterSpacing.normal,
        }}>
          Cumulative target progress
        </span>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          color: isTargetReached ? TOKENS.colors.accent : TOKENS.colors.textSecondary,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {progress}% of {targetLabel}{isTargetReached ? ' · reached' : ''}
        </span>
      </div>

      <div style={{
        height: TOKENS.bar.thin,
        background: TOKENS.colors.bgTertiary,
        borderRadius: TOKENS.radius.full,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${fillPct}%`,
          background: TOKENS.colors.accent,
          borderRadius: TOKENS.radius.full,
          transition: `width ${TOKENS.transitions.durSlow} ease`,
        }} />
      </div>

      <p style={{
        margin: 0,
        fontSize: TOKENS.fontSizes.xs,
        color: TOKENS.colors.textSecondary,
        lineHeight: LINE_HEIGHT.body,
      }}>
        Capital unlocks when the {targetLabel} target is reached or at {maturityLabel}, whichever comes first.
      </p>
    </div>
  )
}


function MetaRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: TOKENS.spacing[3],
      fontSize: TOKENS.fontSizes.xs,
    }}>
      <span style={{
        fontFamily: TOKENS.fonts.mono,
        color: TOKENS.colors.textGhost,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: mono ? TOKENS.fonts.mono : TOKENS.fonts.sans,
        color: TOKENS.colors.textPrimary,
        textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  )
}

function ManageOption({
  title,
  description,
  variant = 'default',
  onClick,
}: {
  title: string
  description: string
  variant?: 'default' | 'danger'
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: TOKENS.spacing[2],
        padding: TOKENS.spacing[4],
        background: TOKENS.colors.bgTertiary,
        border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
        borderRadius: TOKENS.radius.md,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
      }}
    >
      <span style={{
        fontSize: TOKENS.fontSizes.sm,
        fontWeight: TOKENS.fontWeights.black,
        color: variant === 'danger' ? TOKENS.colors.danger : TOKENS.colors.textPrimary,
        textTransform: 'uppercase',
        letterSpacing: TOKENS.letterSpacing.tight,
      }}>
        {title}
      </span>
      <span style={{
        fontSize: TOKENS.fontSizes.xs,
        color: TOKENS.colors.textSecondary,
      }}>
        {description}
      </span>
    </button>
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

/** YieldPaidBars — compact vertical bar sparkline of monthly yield distributions
 * in USD, derived from historical yield % × current capital deployed. */
function YieldPaidBars({
  returns,
  capitalDeployed,
}: {
  returns: Array<{ month: string; yieldPct: number }>
  capitalDeployed: number
}) {
  const monthly = returns.map((r) => (r.yieldPct / 100 / 12) * capitalDeployed)
  const max = Math.max(1, ...monthly)
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: TOKENS.spacing[2],
      width: '100%',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: TOKENS.spacing.half,
        height: 72,
      }}>
        {monthly.map((v, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${(v / max) * 100}%`,
              minHeight: 2,
              background: TOKENS.colors.accentDim,
              borderTop: `${TOKENS.borders.thin} solid ${TOKENS.colors.accent}`,
              borderTopLeftRadius: TOKENS.radius.xs,
              borderTopRightRadius: TOKENS.radius.xs,
            }}
            title={`M${i + 1} · ${fmtUsdCompact(v)}`}
          />
        ))}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: TOKENS.spacing.half,
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

/** CapitalRecoveryStatus — static safeguard message + auto badge. */
function CapitalRecoveryStatus() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: TOKENS.spacing[3],
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
          color: TOKENS.colors.accent,
          display: 'inline-flex',
          alignItems: 'center',
          gap: TOKENS.spacing[2],
        }}>
          <span aria-hidden>✓</span>
          Safeguard active — not triggered
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
      <p style={{
        margin: 0,
        fontSize: TOKENS.fontSizes.xs,
        color: TOKENS.colors.textSecondary,
        lineHeight: LINE_HEIGHT.body,
      }}>
        If principal is below initial deposit at maturity, mining infrastructure
        continues operating up to 2 additional years, output directed exclusively
        to capital recovery.
      </p>
    </div>
  )
}

/** VaultStrategyList — Structured Strategy section: type / cadence / hedging /
 * underlying / risk envelope. Reads from vault.strategy text plus optional
 * envelope fields on VaultMeta (drawdown, vol, sharpe). */
function VaultStrategyList({
  vault,
  vaultConfig,
}: {
  vault: ActiveVault | MaturedVault
  vaultConfig: VaultConfig | null
}) {
  // Strategy text is delimited by " · " — split into tagged rows so the
  // unstructured field still produces a structured display.
  const parts = (vault.strategy || '').split('·').map((s) => s.trim()).filter(Boolean)
  const cadence = parts[1] ?? '—'
  const hedging = parts[2] ?? parts[0] ?? '—'
  const underlying = parts[0] ?? '—'

  const rows: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: 'Strategy', value: underlying },
    { label: 'Distribution', value: cadence, mono: true },
    { label: 'Hedging', value: hedging },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      columnGap: TOKENS.spacing[6],
      rowGap: TOKENS.spacing[3],
    }}>
      {rows.map((r) => <MetaRow key={r.label} label={r.label} value={r.value} mono={r.mono} />)}
      {vaultConfig?.maxDrawdown != null && (
        <MetaRow label="Max drawdown" value={`${vaultConfig.maxDrawdown.toFixed(1)}%`} mono />
      )}
      {vaultConfig?.volatility != null && (
        <MetaRow label="Volatility" value={`${vaultConfig.volatility.toFixed(1)}%`} mono />
      )}
      {vaultConfig?.sharpe != null && (
        <MetaRow label="Sharpe" value={vaultConfig.sharpe.toFixed(2)} mono />
      )}
    </div>
  )
}

/** VaultCompositionBars — Horizontal bars for sub-allocation breakdown.
 * Color rotates through CHART_PALETTE so it visually rhymes with the donut. */
function VaultCompositionBars({
  composition,
}: {
  composition: Array<{ label: string; pct: number; color?: string }>
}) {
  const total = composition.reduce((s, c) => s + c.pct, 0) || 1
  return (
    <div style={{
      marginTop: TOKENS.spacing[4],
      paddingTop: TOKENS.spacing[3],
      borderTop: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
    }}>
      <div style={{
        fontFamily: TOKENS.fonts.mono,
        fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        color: TOKENS.colors.textGhost,
        marginBottom: TOKENS.spacing[3],
      }}>
        Composition
      </div>
      {/* Stacked bar */}
      <div style={{
        display: 'flex',
        height: TOKENS.bar.thin,
        borderRadius: TOKENS.radius.full,
        overflow: 'hidden',
        marginBottom: TOKENS.spacing[3],
        background: TOKENS.colors.bgTertiary,
      }}>
        {composition.map((slice, i) => (
          <div
            key={slice.label}
            style={{
              flex: slice.pct / total,
              background: slice.color ?? CHART_PALETTE[i % CHART_PALETTE.length],
            }}
          />
        ))}
      </div>
      {/* Legend rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[2] }}>
        {composition.map((slice, i) => (
          <div
            key={slice.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: TOKENS.spacing[3],
              fontSize: TOKENS.fontSizes.xs,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[2], minWidth: 0 }}>
              <span style={{
                width: TOKENS.dot.sm,
                height: TOKENS.dot.sm,
                borderRadius: TOKENS.radius.full,
                background: slice.color ?? CHART_PALETTE[i % CHART_PALETTE.length],
                flexShrink: 0,
              }} />
              <span style={{
                color: TOKENS.colors.textPrimary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {slice.label}
              </span>
            </span>
            <span style={{
              fontFamily: TOKENS.fonts.mono,
              fontWeight: TOKENS.fontWeights.bold,
              color: TOKENS.colors.textSecondary,
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}>
              {slice.pct.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** ActivityFilterTabs — Tri-state pill (All / Claims / Deposits) above the
 * VaultActivityTimeline so users can isolate cashflow events. */
function ActivityFilterTabs({
  value,
  onChange,
}: {
  value: 'all' | 'claim' | 'deposit'
  onChange: (v: 'all' | 'claim' | 'deposit') => void
}) {
  const opts: Array<{ id: typeof value; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'claim', label: 'Claims' },
    { id: 'deposit', label: 'Deposits' },
  ]
  return (
    <div style={{
      display: 'inline-flex',
      gap: TOKENS.spacing.half,
      padding: TOKENS.spacing.half,
      background: TOKENS.colors.bgTertiary,
      borderRadius: TOKENS.radius.full,
      border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
    }}>
      {opts.map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            style={{
              padding: `${TOKENS.spacing.half} ${TOKENS.spacing[2]}`,
              borderRadius: TOKENS.radius.full,
              border: 'none',
              background: active ? TOKENS.colors.accent : 'transparent',
              color: active ? TOKENS.colors.bgApp : TOKENS.colors.textSecondary,
              fontFamily: TOKENS.fonts.mono,
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
  )
}

/** VaultActivityTimeline — Compact list of recent events for this vault. */
function VaultActivityTimeline({
  activity,
}: {
  activity: Array<{
    id: string
    type: 'deposit' | 'claim' | 'withdraw'
    amount: number
    timestamp: number
  }>
}) {
  if (activity.length === 0) {
    return (
      <div
        style={{
          padding: `${TOKENS.spacing[4]} 0`,
          textAlign: 'center',
          fontSize: TOKENS.fontSizes.xs,
          color: TOKENS.colors.textGhost,
        }}
      >
        No activity recorded yet
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {activity.map((event, i) => {
        const isWithdraw = event.type === 'withdraw'
        const accent = isWithdraw ? TOKENS.colors.danger : TOKENS.colors.accent
        const accentBg = isWithdraw ? TOKENS.colors.dangerSubtle : TOKENS.colors.accentSubtle
        const label = event.type === 'claim' ? 'Yield claimed'
          : event.type === 'withdraw' ? 'Position withdrawn'
          : 'Capital deposited'
        return (
          <div
            key={event.id}
            style={{
              display: 'grid',
              gridTemplateColumns: `${TOKENS.spacing[5]} 1fr auto`,
              alignItems: 'center',
              gap: TOKENS.spacing[3],
              padding: `${TOKENS.spacing[3]} 0`,
              borderBottom: i < activity.length - 1 ? `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}` : 'none',
            }}
          >
            <span
              style={{
                width: TOKENS.dot.sm,
                height: TOKENS.dot.sm,
                borderRadius: TOKENS.radius.full,
                background: accentBg,
                border: `${TOKENS.borders.thin} solid ${accent}`,
                justifySelf: 'center',
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.bold,
                color: TOKENS.colors.textPrimary,
              }}>
                {label}
              </div>
              <div style={{
                fontSize: TOKENS.fontSizes.micro,
                color: TOKENS.colors.textGhost,
                fontFamily: TOKENS.fonts.mono,
              }}>
                {formatAgo(event.timestamp)}
              </div>
            </div>
            <span
              style={{
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.black,
                color: accent,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {isWithdraw ? '-' : '+'}{fmtUsdCompact(event.amount)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function formatAgo(timestamp: number): string {
  const delta = Math.max(0, Date.now() - timestamp)
  const minutes = Math.floor(delta / 60_000)
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}


