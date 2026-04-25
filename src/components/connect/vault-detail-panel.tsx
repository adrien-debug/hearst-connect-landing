'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Label } from '@/components/ui/label'
import { TOKENS, MONO, fmtUsd, fmtUsdCompact, LINE_HEIGHT, VALUE_LETTER_SPACING } from './constants'
import { formatVaultName } from './formatting'
import { MonthlyGauge } from './monthly-gauge'
import { CompressedMetricsStrip } from './compressed-metrics-strip'
import { PositionCard } from './position-card'
import { Modal, TransactionState } from './modal'
import type { ActiveVault, MaturedVault } from './data'
import { useSmartFit, useShellPadding, fitValue } from './smart-fit'
import type { SmartFitMode } from './smart-fit'
import { CockpitGauge } from './cockpit-gauge'
import { StatCard } from './stat-card'
import { ActionButton } from './action-button'
import { usePositionData } from '@/hooks/usePositionData'
import { useVaultActions } from '@/hooks/useVault'
import { useVaultById } from '@/hooks/useVaultRegistry'
import { useTransaction } from '@/hooks/useTransaction'
import { Skeleton } from './skeleton'
import { WalletNotConnected, VaultNotConfigured, OnChainError } from './empty-states'
import { useLiveActions } from '@/hooks/useLiveActions'

type ModalType = 'claim' | 'manage' | 'exit' | null

export function VaultDetailPanel({
  vault,
  onBack,
}: {
  vault: ActiveVault | MaturedVault
  onBack?: () => void
}) {
  const { address: connectedAddress, isConnected } = useAccount()
  const { mode, isLimit } = useSmartFit({
    tightHeight: 760,
    limitHeight: 680,
    tightWidth: 1100,
    limitWidth: 1200,
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

  const { claim, withdraw, isPending: isActionPending } = useVaultActions(
    isVaultConfigured ? vaultAddress : undefined
  )

  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const transaction = useTransaction()

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

  const totalTargetYield = capitalDeployed * (parseFloat(vault.target) / 100)
  const remainingToTarget = Math.max(0, totalTargetYield - accruedYield)

  // Use live actions for claim/withdraw with backend persistence
  const { claim: liveClaim, withdraw: liveWithdraw } = useLiveActions(vault.id)

  const handleClaim = async () => {
    // Both demo and live modes now use liveClaim which handles both on-chain and backend
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
    // Both demo and live modes now use liveWithdraw which handles both on-chain and backend
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
            {statusLabel}
          </div>
        </div>

        {/* Main cockpit gauges — Capital / Yield / Progress */}
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
          <CockpitGauge
            label="Capital Deployed"
            value={fmtUsd(capitalDeployed)}
            valueCompact={fmtUsdCompact(capitalDeployed)}
            subtext={formatVaultName(vault.name)}
            mode={mode}
            primary
            align="center"
          />
          <CockpitGauge
            label="Accrued Yield"
            value={`+${fmtUsd(accruedYield)}`}
            valueCompact={`+${fmtUsdCompact(accruedYield)}`}
            subtext={`${vault.apr}% APY`}
            mode={mode}
            accent
            align="center"
          />
          <CockpitGauge
            label="Target Progress"
            value={`${progressToTarget}%`}
            valueCompact={`${progressToTarget}%`}
            subtext={isTargetReached ? 'Target reached' : `${fmtUsdCompact(remainingToTarget)} remaining`}
            mode={mode}
            align="center"
          />
        </div>
      </div>

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
        {/* Primary metrics strip */}
        <CompressedMetricsStrip
          mode={mode}
          items={[
            { id: 'p', label: 'Capital Deployed', value: fmtUsdCompact(capitalDeployed) },
            { id: 'y', label: 'Accrued Yield', value: fmtUsdCompact(accruedYield), accent: true },
            { id: 't', label: 'Target', value: vault.target },
            { id: 'm', label: 'Maturity', value: vault.maturity },
          ]}
        />

        {/* Secondary metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: fitValue(mode, {
            normal: 'repeat(4, 1fr)',
            tight: 'repeat(2, 1fr)',
            limit: '1fr',
          }),
          gap: TOKENS.spacing[2],
          flexShrink: 0,
        }}>
          <StatCard
            label="Target Yield"
            value={fmtUsdCompact(totalTargetYield)}
            subtext={`${vault.target} of deployed capital`}
            mode={mode}
          />
          <StatCard
            label="Remaining to Target"
            value={fmtUsdCompact(remainingToTarget)}
            subtext={`${progressToTarget}% progress`}
            mode={mode}
            accent
          />
          <StatCard
            label="APY"
            value={`${vault.apr}%`}
            subtext="Annual yield"
            mode={mode}
          />
          <StatCard
            label={isMatured ? 'Status' : 'Unlock Timeline'}
            value={isMatured ? 'Matured' : `${unlockDays} days`}
            subtext={isMatured ? 'Position ready for exit' : 'Until capital unlock'}
            mode={mode}
          />
        </div>

        {/* Position Card */}
        {positionData && !isLoading && (
          <PositionCard data={positionData} mode={mode} />
        )}

        {/* Loading state */}
        {isLoading && <Skeleton mode={mode} />}

        {/* Error state */}
        {error && (
          <div style={{
            background: TOKENS.colors.bgSecondary,
            borderRadius: TOKENS.radius.lg,
            padding: TOKENS.spacing[4],
            border: `1px solid color-mix(in srgb, ${TOKENS.colors.danger} 30%, transparent)`,
          }}>
            <span style={{
              fontSize: TOKENS.fontSizes.sm,
              color: TOKENS.colors.danger,
            }}>{error.message}</span>
          </div>
        )}

        {/* Target progress */}
        <div style={{
          background: TOKENS.colors.bgSecondary,
          borderRadius: TOKENS.radius.lg,
          padding: fitValue(mode, {
            normal: TOKENS.spacing[4],
            tight: TOKENS.spacing[3],
            limit: TOKENS.spacing[3],
          }),
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: TOKENS.spacing[2],
            alignItems: 'baseline',
          }}>
            <Label id="tp-label" tone="scene" variant="text">
              Target progress
            </Label>
            <span
              style={{
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                color: TOKENS.colors.textSecondary,
              }}
              aria-label={`${progressToTarget} percent of ${vault.target} target`}
            >
              {progressToTarget}% of {vault.target}
            </span>
          </div>
          <div
            style={{
              height: 12,
              background: TOKENS.colors.black,
              borderRadius: TOKENS.radius.sm,
              overflow: 'hidden',
              marginBottom: TOKENS.spacing[2],
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, progressToTarget)}%`,
                background: isTargetReached ? TOKENS.colors.accent : TOKENS.colors.gray700,
                borderRadius: TOKENS.radius.sm,
                transition: 'width 1s ease',
              }}
            />
          </div>
          <div
            style={{
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.xs,
              color: TOKENS.colors.textSecondary,
              lineHeight: LINE_HEIGHT.body,
            }}
          >
            Capital unlocks when {vault.target} cumulative target is reached or at maturity.
            {remainingToTarget > 0 && (
              <span> {fmtUsdCompact(remainingToTarget)} remaining to reach target.</span>
            )}
          </div>
        </div>

        {/* Month distribution */}
        <div style={{
          background: TOKENS.colors.bgSecondary,
          borderRadius: TOKENS.radius.lg,
          padding: fitValue(mode, {
            normal: TOKENS.spacing[4],
            tight: TOKENS.spacing[3],
            limit: TOKENS.spacing[3],
          }),
          flexShrink: 0,
        }}>
          <Label id="mo-label" tone="scene" variant="text">
            Month distribution
          </Label>
          <div style={{ marginTop: TOKENS.spacing[3] }}>
            <MonthlyGauge deposited={capitalDeployed} apr={vault.apr} mode={mode} />
          </div>
        </div>

        {/* Capital Protection Gauge */}
        <CapitalProtectionGauge
          deposited={capitalDeployed}
          currentValue={currentValue}
          mode={mode}
        />

        {/* Performance History Chart */}
        <PerformanceHistoryChart
          deposited={capitalDeployed}
          claimable={accruedYield}
          apr={vault.apr}
          daysRemaining={unlockDays}
          mode={mode}
        />

        {/* Narrative Blocks */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isLimit ? '1fr' : '1fr 1fr',
          gap: shellGap,
          flexShrink: 0,
        }}>
          <NarrativeBlock
            kicker="Capital Protection"
            body="Safeguard active — not triggered. If principal falls below the initial deposit at maturity, the infrastructure layer can extend the recovery window."
            mode={mode}
          />
          <NarrativeBlock
            kicker="Strategy"
            body={!isLimit ? vault.strategy : `${vault.apr}% APY · ${progressToTarget}% progress · ${vault.target} target`}
            mode={mode}
            isMono={isLimit}
          />
        </div>

        {/* Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: fitValue(mode, {
            normal: 'repeat(3, 1fr)',
            tight: 'repeat(3, 1fr)',
            limit: '1fr',
          }),
          gap: TOKENS.spacing[3],
          flexShrink: 0,
          paddingTop: TOKENS.spacing[2],
        }}>
          {accruedYield > 0 && (
            <ActionButton
              label="Claim Yield"
              variant="primary"
              onClick={() => setActiveModal('claim')}
            />
          )}
          <ActionButton
            label="Manage"
            variant="secondary"
            onClick={() => setActiveModal('manage')}
          />
          {isPositionReadyForExit && (
            <ActionButton
              label="Exit Position"
              variant="accent"
              onClick={() => setActiveModal('exit')}
            />
          )}
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
                borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
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

function CapitalProtectionGauge({
  deposited,
  currentValue,
  mode,
}: {
  deposited: number
  currentValue: number
  mode: SmartFitMode
}) {
  const protectionLevel = deposited > 0 ? Math.min(100, (currentValue / deposited) * 100) : 0
  const isProtected = currentValue >= deposited

  return (
    <div style={{
      background: TOKENS.colors.black,
      borderRadius: TOKENS.radius.lg,
      padding: fitValue(mode, {
        normal: TOKENS.spacing[4],
        tight: TOKENS.spacing[3],
        limit: TOKENS.spacing[3],
      }),
      border: `1px solid ${TOKENS.colors.borderSubtle}`,
      flexShrink: 0,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: TOKENS.spacing[3],
      }}>
        <Label id="capital-protection" tone="scene" variant="text">
          Capital Protection
        </Label>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          color: isProtected ? TOKENS.colors.accent : TOKENS.colors.white,
          textTransform: 'uppercase',
        }}>
          {isProtected ? 'Protected' : 'At Risk'}
        </span>
      </div>

      <div style={{
        display: 'flex',
        height: '32px',
        borderRadius: TOKENS.radius.sm,
        overflow: 'hidden',
        background: TOKENS.colors.bgSecondary,
        position: 'relative',
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          background: isProtected
            ? `linear-gradient(90deg, ${TOKENS.colors.accentGlow} 0%, ${TOKENS.colors.accentDim} 100%)`
            : `linear-gradient(90deg, ${TOKENS.colors.surfaceActive} 0%, ${TOKENS.colors.surfaceHover} 100%)`,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            left: `${Math.min(100, protectionLevel)}%`,
            top: 0,
            bottom: 0,
            width: '2px',
            background: isProtected ? TOKENS.colors.accent : TOKENS.colors.white,
            transform: 'translateX(-50%)',
          }} />
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: TOKENS.spacing[2],
        fontFamily: TOKENS.fonts.mono,
        fontSize: TOKENS.fontSizes.micro,
        color: TOKENS.colors.textGhost,
      }}>
        <span>Principal: {fmtUsdCompact(deposited)}</span>
        <span style={{ color: isProtected ? TOKENS.colors.accent : TOKENS.colors.white }}>
          Current: {fmtUsdCompact(currentValue)} ({protectionLevel.toFixed(1)}%)
        </span>
      </div>
    </div>
  )
}

function PerformanceHistoryChart({
  deposited,
  claimable,
  apr,
  daysRemaining,
  mode,
}: {
  deposited: number
  claimable: number
  apr: number
  daysRemaining: number
  mode: SmartFitMode
}) {
  const months = 6
  const monthlyYield = (deposited * (apr / 100)) / 12
  const data = Array.from({ length: months }, (_, i) => {
    const month = i + 1
    const projectedYield = Math.min(claimable + (monthlyYield * month), deposited * 0.5)
    return {
      month,
      value: deposited + projectedYield,
      yield: projectedYield,
    }
  })

  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = deposited * 0.98

  return (
    <div style={{
      background: TOKENS.colors.black,
      borderRadius: TOKENS.radius.lg,
      padding: fitValue(mode, {
        normal: TOKENS.spacing[4],
        tight: TOKENS.spacing[3],
        limit: TOKENS.spacing[3],
      }),
      border: `1px solid ${TOKENS.colors.borderSubtle}`,
      flexShrink: 0,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: TOKENS.spacing[3],
      }}>
        <Label id="performance-chart" tone="scene" variant="text">
          Value Projection
        </Label>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.micro,
          color: TOKENS.colors.textGhost,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
        }}>
          {daysRemaining}d remaining
        </span>
      </div>

      <div style={{
        height: '120px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: TOKENS.spacing[2],
        paddingBottom: TOKENS.spacing[4],
        borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
      }}>
        {data.map((point, index) => {
          const height = ((point.value - minValue) / (maxValue - minValue)) * 100
          const isCurrent = index === 0

          return (
            <div key={point.month} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: TOKENS.spacing[2],
              flex: 1,
            }}>
              <div style={{
                width: '100%',
                height: `${Math.max(10, height)}%`,
                background: isCurrent
                  ? TOKENS.colors.accent
                  : TOKENS.colors.textGhost,
                borderRadius: `${TOKENS.radius.sm} ${TOKENS.radius.sm} 0 0`,
                minHeight: '4px',
              }} />
              <div style={{
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.micro,
                color: TOKENS.colors.textGhost,
              }}>
                M{point.month}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: TOKENS.spacing[3],
        fontSize: TOKENS.fontSizes.xs,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: TOKENS.spacing[2],
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: TOKENS.colors.accent,
            borderRadius: TOKENS.radius.sm,
          }} />
          <span style={{ color: TOKENS.colors.textSecondary }}>
            Current: {fmtUsdCompact(deposited + claimable)}
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: TOKENS.spacing[2],
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: TOKENS.colors.gray500,
            borderRadius: TOKENS.radius.sm,
          }} />
          <span style={{ color: TOKENS.colors.textSecondary }}>
            Projected (6M): {fmtUsdCompact(data[data.length - 1].value)}
          </span>
        </div>
      </div>
    </div>
  )
}

function NarrativeBlock({ kicker, body, mode, isMono = false }: {
  kicker: string
  body: string
  mode: SmartFitMode
  isMono?: boolean
}) {
  return (
    <div style={{
      minWidth: 0,
      background: TOKENS.colors.bgSecondary,
      borderRadius: TOKENS.radius.lg,
      padding: fitValue(mode, {
        normal: TOKENS.spacing[4],
        tight: TOKENS.spacing[3],
        limit: TOKENS.spacing[3],
      }),
      flexShrink: 0,
    }}>
      <Label id={`narrative-${kicker.toLowerCase().replace(/\s+/g, '-')}`} tone="scene">
        {kicker}
      </Label>
      <p style={{
        margin: `${TOKENS.spacing[2]} 0 0 0`,
        fontSize: isMono ? TOKENS.fontSizes.xs : TOKENS.fontSizes.sm,
        lineHeight: LINE_HEIGHT.body,
        color: TOKENS.colors.textSecondary,
        fontFamily: isMono ? TOKENS.fonts.mono : TOKENS.fonts.sans,
      }}>
        {body}
      </p>
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
        border: `1px solid ${TOKENS.colors.borderSubtle}`,
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


