'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Label } from '@/components/ui/label'
import { TOKENS, fmtUsdCompact, LINE_HEIGHT, VALUE_LETTER_SPACING } from './constants'
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

  const { isPending: isActionPending } = useVaultActions(
    isVaultConfigured ? vaultAddress : undefined
  )

  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [openStrategy, setOpenStrategy] = useState(false)
  const [openTerms, setOpenTerms] = useState(false)
  const [openTransactions, setOpenTransactions] = useState(false)
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

  const { claim: liveClaim, withdraw: liveWithdraw } = useLiveActions(vault.id)

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
        description={vaultConfig?.description}
        chainName={vaultConfig?.chain?.name}
        accruedYield={accruedYield}
        statusLabel={statusLabel}
        isReadyForExit={isPositionReadyForExit}
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
        {/* KPI row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: fitValue(mode, {
            normal: 'repeat(4, 1fr)',
            tight: 'repeat(2, 1fr)',
            limit: '1fr 1fr',
          }),
          gap: TOKENS.spacing[6],
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

        {/* Strategy details (collapsible) */}
        <CollapsibleSection
          title="Strategy details"
          isOpen={openStrategy}
          onToggle={() => setOpenStrategy((v) => !v)}
          mode={mode}
        >
          <StrategyDetailsBody
            vault={vault}
            risk={vaultConfig?.risk}
          />
        </CollapsibleSection>

        {/* Terms (collapsible) */}
        <CollapsibleSection
          title="Terms"
          isOpen={openTerms}
          onToggle={() => setOpenTerms((v) => !v)}
          mode={mode}
        >
          <TermsBody
            vault={vault}
            vaultConfig={vaultConfig}
            maturityDate={positionData?.unlockTimeline.maturityDate}
            unlockDays={unlockDays}
          />
        </CollapsibleSection>

        {/* Transactions (collapsible) */}
        <CollapsibleSection
          title="Transactions"
          isOpen={openTransactions}
          onToggle={() => setOpenTransactions((v) => !v)}
          mode={mode}
        >
          <TransactionsBody />
        </CollapsibleSection>
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
  description,
  chainName,
  accruedYield,
  statusLabel,
  isReadyForExit,
  onClaim,
  onManage,
  onExit,
  mode,
  shellPadding,
}: {
  vault: ActiveVault | MaturedVault
  description?: string
  chainName?: string
  accruedYield: number
  statusLabel: string
  isReadyForExit: boolean
  onClaim: () => void
  onManage: () => void
  onExit: () => void
  mode: SmartFitMode
  shellPadding: number
}) {
  const subtitle = description ?? vault.strategy
  return (
    <div style={{
      padding: fitValue(mode, {
        normal: `${shellPadding}px`,
        tight: `${shellPadding * 0.75}px`,
        limit: `${shellPadding * 0.5}px`,
      }),
      borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
      flexShrink: 0,
      background: TOKENS.colors.bgApp,
      display: 'flex',
      alignItems: 'flex-start',
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
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: TOKENS.spacing[2],
            color: TOKENS.colors.accent,
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: TOKENS.radius.full,
              background: TOKENS.colors.accent,
              boxShadow: `0 0 6px ${TOKENS.colors.accentGlow}`,
            }} />
            {isReadyForExit ? statusLabel : 'Live'}
          </span>
          {chainName && (
            <span style={{ color: TOKENS.colors.textGhost }}>· {chainName}</span>
          )}
        </div>
        <h2 style={{
          margin: 0,
          fontSize: fitValue(mode, {
            normal: TOKENS.fontSizes.xxl,
            tight: TOKENS.fontSizes.xl,
            limit: TOKENS.fontSizes.lg,
          }),
          fontWeight: TOKENS.fontWeights.black,
          letterSpacing: TOKENS.letterSpacing.tight,
          color: TOKENS.colors.textPrimary,
          lineHeight: LINE_HEIGHT.tight,
        }}>
          {formatVaultName(vault.name)}
        </h2>
        {subtitle && (
          <div style={{
            fontSize: TOKENS.fontSizes.sm,
            color: TOKENS.colors.textSecondary,
            lineHeight: LINE_HEIGHT.body,
          }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Right: APY + actions */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: TOKENS.spacing[3],
        flexShrink: 0,
      }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: TOKENS.spacing[2],
            justifyContent: 'flex-end',
          }}>
            <span style={{
              fontSize: fitValue(mode, {
                normal: TOKENS.fontSizes.xxl,
                tight: TOKENS.fontSizes.xl,
                limit: TOKENS.fontSizes.lg,
              }),
              fontWeight: TOKENS.fontWeights.black,
              letterSpacing: VALUE_LETTER_SPACING,
              color: TOKENS.colors.textPrimary,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: LINE_HEIGHT.tight,
            }}>
              {vault.apr}%
            </span>
            <span style={{
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.xs,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              color: TOKENS.colors.textSecondary,
            }}>
              APY
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: TOKENS.spacing[2], flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {accruedYield > 0 && (
            <HeaderActionPill label="Claim" onClick={onClaim} accent />
          )}
          {isReadyForExit ? (
            <HeaderActionPill label="Exit" onClick={onExit} />
          ) : (
            <HeaderActionPill label="Manage" onClick={onManage} />
          )}
        </div>
      </div>
    </div>
  )
}

function HeaderActionPill({ label, onClick, accent = false }: { label: string; onClick: () => void; accent?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: 0,
        background: 'transparent',
        color: accent ? TOKENS.colors.accent : TOKENS.colors.textSecondary,
        border: 'none',
        fontFamily: TOKENS.fonts.sans,
        fontSize: TOKENS.fontSizes.xs,
        fontWeight: TOKENS.fontWeights.black,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'color 120ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = accent ? TOKENS.colors.accent : TOKENS.colors.textSecondary
      }}
    >
      {label} →
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
          color: TOKENS.colors.textSecondary,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {progress}% of {targetLabel}
        </span>
      </div>

      <div style={{
        height: 6,
        background: TOKENS.colors.bgTertiary,
        borderRadius: TOKENS.radius.full,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${fillPct}%`,
          background: TOKENS.colors.accent,
          borderRadius: TOKENS.radius.full,
          boxShadow: `0 0 12px ${TOKENS.colors.accentGlow}`,
          transition: 'width 1s ease',
        }} />
      </div>

      <p style={{
        margin: 0,
        fontSize: TOKENS.fontSizes.xs,
        color: TOKENS.colors.textSecondary,
        lineHeight: LINE_HEIGHT.body,
      }}>
        Capital unlocks when the {targetLabel} cumulative target is reached or at {maturityLabel},
        whichever comes first.
        {isTargetReached && (
          <span style={{ color: TOKENS.colors.accent }}> Target reached.</span>
        )}
      </p>
    </div>
  )
}


function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  mode,
  children,
}: {
  title: string
  isOpen: boolean
  onToggle: () => void
  mode: SmartFitMode
  children: React.ReactNode
}) {
  const verticalPadding = fitValue(mode, {
    normal: TOKENS.spacing[3],
    tight: TOKENS.spacing[3],
    limit: TOKENS.spacing[2],
  })
  return (
    <div style={{
      flexShrink: 0,
      borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
    }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: `${verticalPadding} 0`,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: TOKENS.colors.textPrimary,
          fontSize: TOKENS.fontSizes.sm,
          fontWeight: TOKENS.fontWeights.black,
          textAlign: 'left',
          letterSpacing: TOKENS.letterSpacing.normal,
        }}
      >
        <span>{title}</span>
        <ChevronGlyph open={isOpen} />
      </button>
      {isOpen && (
        <div style={{ paddingBottom: verticalPadding }}>
          {children}
        </div>
      )}
    </div>
  )
}

function ChevronGlyph({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={TOKENS.colors.textSecondary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{
        transition: 'transform 200ms ease',
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}


function StrategyDetailsBody({
  vault,
  risk,
}: {
  vault: ActiveVault | MaturedVault
  risk?: string
}) {
  const resolvedRisk = risk ?? (vault.type === 'active' ? vault.risk : undefined)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[3] }}>
      <p style={{
        margin: 0,
        fontSize: TOKENS.fontSizes.sm,
        color: TOKENS.colors.textSecondary,
        lineHeight: LINE_HEIGHT.body,
      }}>
        {vault.strategy}
      </p>
      {resolvedRisk && <MetaRow label="Risk" value={resolvedRisk} />}
    </div>
  )
}

function TermsBody({
  vault,
  vaultConfig,
  maturityDate,
  unlockDays,
}: {
  vault: ActiveVault | MaturedVault
  vaultConfig: VaultConfig | null
  maturityDate: string | undefined
  unlockDays: number
}) {
  const lockPeriod = vaultConfig?.lockPeriodDays
    ? `${vaultConfig.lockPeriodDays} days`
    : vault.maturity
  const formattedMaturity = formatMaturityDate(maturityDate, unlockDays)
  const minDeposit = vaultConfig?.minDeposit != null ? fmtUsdCompact(vaultConfig.minDeposit) : undefined
  const truncatedVault = vaultConfig?.vaultAddress
    ? `${vaultConfig.vaultAddress.slice(0, 6)}…${vaultConfig.vaultAddress.slice(-4)}`
    : undefined

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      columnGap: TOKENS.spacing[6],
      rowGap: TOKENS.spacing[3],
    }}>
      <MetaRow label="Lock period" value={lockPeriod} />
      <MetaRow label="Maturity" value={formattedMaturity} />
      <MetaRow label="Target unlock" value={vault.target} />
      {minDeposit && <MetaRow label="Min deposit" value={minDeposit} />}
      {vaultConfig?.fees && <MetaRow label="Fees" value={vaultConfig.fees} />}
      {vaultConfig?.chain?.name && <MetaRow label="Chain" value={vaultConfig.chain.name} />}
      {truncatedVault && <MetaRow label="Vault" value={truncatedVault} mono />}
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

function TransactionsBody() {
  return (
    <div style={{
      padding: `${TOKENS.spacing[3]} 0`,
      fontSize: TOKENS.fontSizes.xs,
      color: TOKENS.colors.textGhost,
      fontFamily: TOKENS.fonts.mono,
      letterSpacing: TOKENS.letterSpacing.display,
      textTransform: 'uppercase',
    }}>
      No transactions yet
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


