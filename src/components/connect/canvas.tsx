'use client'

import { useState, useCallback } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useVaultData } from '@/hooks/useVaultData'
import { useUserPosition } from '@/hooks/useUserPosition'
import { useRewards } from '@/hooks/useRewards'
import { useEpoch } from '@/hooks/useEpoch'
import { useDeposit } from '@/hooks/useDeposit'
import { useWithdraw } from '@/hooks/useWithdraw'

const FONT = "var(--font-sans, 'Satoshi Variable', Inter, -apple-system, sans-serif)"
const MONO = "var(--font-mono, 'IBM Plex Mono', ui-monospace, monospace)"

// ─── Multi-vault types ───────────────────────────────────────────────────

interface VaultLine {
  id: string
  name: string
  deposited: number
  claimable: number
  lockedUntil: number
  apr: number
  canWithdraw: boolean
}

function useVaults(): VaultLine[] {
  const { depositAmount, lockEnd, canWithdraw } = useUserPosition()
  const { pending } = useRewards()
  const { annualAPR } = useVaultData()

  const deposited = parseFloat(depositAmount) || 0
  const claimable = parseFloat(pending) || 0

  if (deposited <= 0) return []

  return [{
    id: 'epoch-v1',
    name: 'Epoch Vault',
    deposited,
    claimable,
    lockedUntil: lockEnd,
    apr: annualAPR,
    canWithdraw,
  }]
}

function aggregateVaults(vaults: VaultLine[]) {
  return {
    totalDeposited: vaults.reduce((s, v) => s + v.deposited, 0),
    totalClaimable: vaults.reduce((s, v) => s + v.claimable, 0),
    avgApr: vaults.length > 0
      ? vaults.reduce((s, v) => s + v.apr * v.deposited, 0) / Math.max(vaults.reduce((s, v) => s + v.deposited, 0), 1)
      : 0,
    anyLocked: vaults.some(v => !v.canWithdraw),
  }
}

// ─── Canvas ──────────────────────────────────────────────────────────────

export function Canvas() {
  const { isConnected } = useAccount()
  const vaults = useVaults()
  const hasPosition = isConnected && vaults.length > 0
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null)

  const selectedVault = selectedVaultId
    ? vaults.find(v => v.id === selectedVaultId) ?? null
    : null

  const activeVault = selectedVault ?? (vaults.length === 1 ? vaults[0] : null)
  const agg = aggregateVaults(vaults)

  return (
    <div
      className="hub-font-scope fixed inset-0 flex flex-col"
      style={{
        background: 'var(--dashboard-page)',
        color: 'var(--dashboard-text-primary)',
        fontFamily: FONT,
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <Header />
      <main className="flex-1 flex min-h-0">
        <Ledger
          hasPosition={hasPosition}
          isConnected={isConnected}
          selectedVault={selectedVault}
          aggregate={agg}
        />
        <div style={{ width: '1px', background: 'var(--dashboard-border)', flexShrink: 0 }} />
        <TemporalFlow
          hasPosition={hasPosition}
          isConnected={isConnected}
          vaults={vaults}
          selectedVaultId={selectedVaultId}
          onSelectVault={setSelectedVaultId}
          activeVault={activeVault}
          aggregate={agg}
        />
      </main>
    </div>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────

function Header() {
  return (
    <header
      className="flex items-center justify-between shrink-0 select-none"
      style={{
        height: '48px',
        padding: '0 clamp(1rem, 4vw, 2rem)',
        borderBottom: '1px solid var(--dashboard-border)',
      }}
    >
      <span
        style={{
          fontFamily: FONT,
          fontSize: '0.85rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          color: 'var(--dashboard-text-primary)',
        }}
      >
        Connect
      </span>

      <nav className="flex items-center" style={{ gap: '2rem' }}>
        <span
          style={{
            fontFamily: FONT,
            fontSize: '0.75rem',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
            color: 'var(--dashboard-text-primary)',
          }}
        >
          Dashboard
        </span>
        {(['Products', 'Vaults'] as const).map((item) => (
          <span
            key={item}
            style={{
              fontFamily: FONT,
              fontSize: '0.75rem',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              color: 'var(--dashboard-text-ghost)',
              cursor: 'default',
            }}
          >
            {item}
          </span>
        ))}
      </nav>

      <ConnectButton.Custom>
        {({ account, openAccountModal, openConnectModal, mounted }) => {
          if (!mounted) return null
          if (!account) {
            return (
              <button
                onClick={openConnectModal}
                style={{
                  fontFamily: MONO,
                  fontSize: '11px',
                  letterSpacing: '0.06em',
                  color: 'var(--dashboard-text-secondary)',
                  background: 'none',
                  border: '1px solid var(--dashboard-border)',
                  padding: '5px 14px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--dashboard-accent)'
                  e.currentTarget.style.color = 'var(--dashboard-text-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--dashboard-border)'
                  e.currentTarget.style.color = 'var(--dashboard-text-secondary)'
                }}
              >
                Connect Wallet
              </button>
            )
          }
          return (
            <button
              onClick={openAccountModal}
              style={{
                fontFamily: MONO,
                fontSize: '11px',
                letterSpacing: '0.04em',
                color: 'var(--dashboard-text-ghost)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              {account.displayName}
            </button>
          )
        }}
      </ConnectButton.Custom>
    </header>
  )
}

// ─── Left Ledger ─────────────────────────────────────────────────────────

function Ledger({
  hasPosition,
  isConnected,
  selectedVault,
  aggregate,
}: {
  hasPosition: boolean
  isConnected: boolean
  selectedVault: VaultLine | null
  aggregate: ReturnType<typeof aggregateVaults>
}) {
  return (
    <aside
      className="flex flex-col justify-between shrink-0"
      style={{
        width: '380px',
        padding: '36px clamp(1.25rem, 3vw, 2rem) 28px',
        overflow: 'auto',
      }}
    >
      {hasPosition
        ? <LedgerActive selectedVault={selectedVault} aggregate={aggregate} />
        : <LedgerZero isConnected={isConnected} />}
    </aside>
  )
}

function LedgerZero({ isConnected }: { isConnected: boolean }) {
  const { annualAPR, totalDeposits } = useVaultData()
  const tvl = parseFloat(totalDeposits) || 0

  return (
    <>
      <div>
        <Label>Current Value</Label>
        <BigNumber value={0} />

        <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Row label="Claimable" value="$0.00" />
          <Row label="Status" value={isConnected ? 'No position' : 'Not connected'} />
          <Row label="APR" value={annualAPR > 0 ? `${annualAPR.toFixed(1)}%` : '—'} />
          <Sep />
          <Row label="Vault TVL" value={fmtUsd(tvl)} />
        </div>
      </div>

      <div style={{ marginTop: '48px' }}>
        <p
          style={{
            fontFamily: FONT,
            fontSize: '0.82rem',
            fontWeight: 400,
            lineHeight: 1.55,
            color: 'var(--dashboard-text-muted)',
            maxWidth: '300px',
          }}
        >
          {isConnected
            ? 'Deposit into a vault to start generating yield.'
            : 'Connect your wallet to access structured yield from Bitcoin mining.'}
        </p>
      </div>
    </>
  )
}

function LedgerActive({
  selectedVault,
  aggregate,
}: {
  selectedVault: VaultLine | null
  aggregate: ReturnType<typeof aggregateVaults>
}) {
  const { claim, isClaiming } = useRewards()
  const { totalDeposits } = useVaultData()
  const tvl = parseFloat(totalDeposits) || 0

  const deposited = selectedVault ? selectedVault.deposited : aggregate.totalDeposited
  const claimableNum = selectedVault ? selectedVault.claimable : aggregate.totalClaimable
  const apr = selectedVault ? selectedVault.apr : aggregate.avgApr
  const currentValue = deposited + claimableNum
  const locked = selectedVault ? !selectedVault.canWithdraw : aggregate.anyLocked
  const lockStatus = locked ? 'Locked' : 'Unlocked'
  const lockTs = selectedVault ? selectedVault.lockedUntil : 0
  const nextUnlock = lockTs > 0
    ? new Date(lockTs * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—'

  return (
    <>
      <div>
        <Label>{selectedVault ? selectedVault.name : 'All Vaults'}</Label>
        <BigNumber value={currentValue} />

        <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Row label="Deposited" value={fmtUsd(deposited)} />
          <div className="flex items-baseline justify-between">
            <span style={{ fontFamily: FONT, fontSize: '0.8rem', fontWeight: 500, color: 'var(--dashboard-text-muted)' }}>
              Claimable
            </span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 500, color: 'var(--dashboard-accent)', letterSpacing: '0.02em' }}>
                {fmtUsd(claimableNum)}
              </span>
              {claimableNum > 0 && (
                <button
                  onClick={() => claim()}
                  disabled={isClaiming}
                  style={{
                    fontFamily: FONT,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: isClaiming ? 'var(--dashboard-text-ghost)' : 'var(--dashboard-accent)',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid var(--dashboard-accent)',
                    padding: 0,
                    cursor: isClaiming ? 'default' : 'pointer',
                    opacity: isClaiming ? 0.5 : 0.8,
                    transition: 'opacity 0.15s ease',
                  }}
                  onMouseEnter={(e) => { if (!isClaiming) e.currentTarget.style.opacity = '1' }}
                  onMouseLeave={(e) => { if (!isClaiming) e.currentTarget.style.opacity = '0.8' }}
                >
                  {isClaiming ? 'Claiming…' : 'Claim'}
                </button>
              )}
            </span>
          </div>
          <Row label="APR" value={`${apr.toFixed(1)}%`} />
          <Sep />
          <Row label="Status" value={lockStatus} />
          <Row label="Next Unlock" value={nextUnlock} />
          <Sep />
          <Row label="Vault TVL" value={fmtUsd(tvl)} />
        </div>
      </div>
    </>
  )
}

// ─── Right Temporal Flow (horizontal) ────────────────────────────────────

/** Vertical gap between stacked vault timelines (readability on dark UI). */
const VAULT_LINE_SPACING = 20
/** Never dim non-selected vault lines below this (avoids “invisible” multi-vault). */
const MIN_VAULT_LINE_OPACITY = 0.3
const DASH_PATTERN =
  'repeating-linear-gradient(to right, var(--dashboard-text-muted) 0, var(--dashboard-text-muted) 6px, transparent 6px, transparent 14px)'

function FlowLine({
  vault,
  index,
  nowPct,
  isSelected,
  isFaded,
  onSelect,
}: {
  vault: VaultLine
  index: number
  nowPct: number
  isSelected: boolean
  isFaded: boolean
  onSelect: (id: string | null) => void
}) {
  const offset = index * VAULT_LINE_SPACING
  const baseOpacity = Math.max(
    MIN_VAULT_LINE_OPACITY,
    index === 0 ? 0.78 : 0.42 + index * 0.06,
  )
  const lineOpacity = isFaded
    ? MIN_VAULT_LINE_OPACITY
    : isSelected
      ? 1
      : baseOpacity
  const pastHeightPx = isSelected ? 3.5 : index === 0 ? 2.5 : 2
  const futureHeightPx = isSelected ? 2 : 1.5
  const dashOpacity = Math.max(0.36, lineOpacity * 0.88)

  return (
    <div
      className="absolute left-0 right-0"
      style={{
        top: `calc(50% + ${offset}px)`,
        cursor: 'pointer',
        zIndex: isSelected ? 14 : 10,
        transition: 'opacity 0.2s ease',
      }}
      onClick={() => onSelect(isSelected ? null : vault.id)}
    >
      {/* Past segment — solid */}
      <div
        className="absolute left-0"
        style={{
          width: `${nowPct}%`,
          height: `${pastHeightPx}px`,
          background: 'var(--dashboard-text-muted)',
          opacity: lineOpacity,
          marginTop: `${-pastHeightPx / 2}px`,
          transition: 'opacity 0.2s ease',
        }}
      />
      {/* Future segment — dashed */}
      <div
        className="absolute right-0"
        style={{
          left: `${nowPct}%`,
          height: `${futureHeightPx}px`,
          backgroundImage: DASH_PATTERN,
          opacity: dashOpacity,
          marginTop: `${-futureHeightPx / 2}px`,
          transition: 'opacity 0.2s ease',
        }}
      />
      {/* Vault name label — visible on hover/select, right side of past */}
      {isSelected && (
        <div
          className="absolute select-none"
          style={{
            right: `${100 - nowPct + 1}%`,
            top: '-18px',
            whiteSpace: 'nowrap',
            zIndex: 16,
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '0.14em',
              color: 'var(--dashboard-text-primary)',
              textTransform: 'uppercase' as const,
              opacity: 0.95,
            }}
          >
            {vault.name}
          </span>
        </div>
      )}
    </div>
  )
}

function TemporalFlow({
  hasPosition,
  isConnected,
  vaults,
  selectedVaultId,
  onSelectVault,
  activeVault,
  aggregate,
}: {
  hasPosition: boolean
  isConnected: boolean
  vaults: VaultLine[]
  selectedVaultId: string | null
  onSelectVault: (id: string | null) => void
  activeVault: VaultLine | null
  aggregate: ReturnType<typeof aggregateVaults>
}) {
  const { epoch, progress, countdownFormatted } = useEpoch()
  const { claim, isClaiming } = useRewards()
  const { annualAPR } = useVaultData()
  const { usdcBalance } = useUserPosition()
  const depositFlow = useDeposit()
  const withdrawFlow = useWithdraw()
  const [withdrawConfirm, setWithdrawConfirm] = useState(false)

  const nowPct = Math.max(20, Math.min(80, progress * 100))

  /** Vertical center of stacked vault lines so NOW copy/actions align with the band. */
  const vaultStackOffsetPx =
    vaults.length > 0 ? ((vaults.length - 1) * VAULT_LINE_SPACING) / 2 : 0
  const nowBlockPadTop =
    20 + Math.max(0, vaults.length - 1) * VAULT_LINE_SPACING
  const nowActionsPadTop =
    52 + Math.max(0, vaults.length - 1) * VAULT_LINE_SPACING

  const claimableNum = activeVault ? activeVault.claimable : aggregate.totalClaimable
  const depositedNum = activeVault ? activeVault.deposited : aggregate.totalDeposited
  const activeApr = activeVault ? activeVault.apr : (annualAPR || aggregate.avgApr)
  const canWithdraw = activeVault ? activeVault.canWithdraw : !aggregate.anyLocked

  const projectedMonthly = depositedNum > 0 && activeApr > 0
    ? (depositedNum * activeApr) / 100 / 12
    : 0

  const [localDepositAmt, setLocalDepositAmt] = useState('')

  const handleDeposit = useCallback(() => {
    if (!localDepositAmt) return
    depositFlow.execute(localDepositAmt)
  }, [localDepositAmt, depositFlow])

  const handleClaim = useCallback(() => { claim() }, [claim])

  const handleWithdraw = useCallback(() => {
    if (!canWithdraw || depositedNum <= 0) return
    if (!withdrawConfirm) {
      setWithdrawConfirm(true)
      return
    }
    withdrawFlow.withdraw(String(depositedNum))
    setWithdrawConfirm(false)
  }, [canWithdraw, depositedNum, withdrawFlow, withdrawConfirm])

  const isProcessing =
    depositFlow.isApproving ||
    depositFlow.isDepositing ||
    depositFlow.isConfirming ||
    isClaiming ||
    withdrawFlow.isPending ||
    withdrawFlow.isConfirming

  const lockTs = activeVault?.lockedUntil ?? 0
  const lockDateStr = lockTs > 0
    ? new Date(lockTs * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : ''

  const statusText = !hasPosition
    ? 'No active yield'
    : !canWithdraw
      ? `Locked until ${lockDateStr} · Yield accumulating`
      : `Yielding at ${activeApr.toFixed(1)}% APR · ${fmtUsd(claimableNum)} available`

  return (
    <div className="flex-1 relative flex flex-col" style={{ overflow: 'hidden' }}>
      <div className="flex-1 relative" style={{ padding: '36px 0 0' }}>

        {/* Epoch context — top-left */}
        <div
          className="absolute z-10 select-none"
          style={{ top: '36px', left: 'clamp(1.25rem, 3vw, 2rem)' }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: 'var(--dashboard-text-ghost)',
            }}
          >
            Epoch {String(epoch).padStart(2, '0')} · {countdownFormatted}
          </div>
        </div>

        {/* Target APR — top-right */}
        <div
          className="absolute z-10 select-none"
          style={{ top: '36px', right: 'clamp(1.25rem, 3vw, 2rem)', textAlign: 'right' }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              color: 'var(--dashboard-text-ghost)',
            }}
          >
            {activeApr > 0 ? `${activeApr.toFixed(1)}%` : '—'} APR
          </div>
        </div>

        {/* Past region overlay */}
        <div
          className="absolute inset-y-0 left-0 z-1"
          style={{ width: `${nowPct}%`, background: 'var(--dashboard-overlay-02)' }}
        />

        {/* Vault flow lines — multi-line rendering */}
        {vaults.length > 0 ? (
          vaults.map((vault, i) => (
            <FlowLine
              key={vault.id}
              vault={vault}
              index={i}
              nowPct={nowPct}
              isSelected={selectedVaultId === vault.id}
              isFaded={selectedVaultId !== null && selectedVaultId !== vault.id}
              onSelect={onSelectVault}
            />
          ))
        ) : (
          /* Zero state — single neutral line */
          <div
            className="absolute left-0 right-0 z-8"
            style={{ top: `calc(50% + ${vaultStackOffsetPx}px)` }}
          >
            <div
              className="absolute left-0 right-0"
              style={{
                height: '2px',
                backgroundImage: DASH_PATTERN,
                opacity: 0.58,
                marginTop: '-1px',
              }}
            />
          </div>
        )}

        {/* NOW — vertical line (subtle; vault lines sit above via z-index) */}
        <div
          className="absolute inset-y-0 z-6 pointer-events-none"
          style={{
            left: `${nowPct}%`,
            width: '1px',
            background: 'var(--dashboard-accent)',
            opacity: 0.24,
          }}
        />

        {/* NOW label + progress */}
        <div
          className="absolute z-30 select-none"
          style={{
            left: `${nowPct}%`,
            top: `calc(50% + ${vaultStackOffsetPx}px)`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div style={{ textAlign: 'center', paddingBottom: '18px' }}>
            <span
              style={{
                fontFamily: FONT,
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color: 'var(--dashboard-accent)',
              }}
            >
              Now
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: '10px',
                color: 'var(--dashboard-text-ghost)',
                marginLeft: '8px',
              }}
            >
              {Math.round(progress * 100)}%
            </span>
          </div>
        </div>

        {/* Status layer */}
        <div
          className="absolute z-30 select-none"
          style={{
            left: `${nowPct}%`,
            top: `calc(50% + ${vaultStackOffsetPx}px)`,
            transform: 'translateX(-50%)',
            paddingTop: `${nowBlockPadTop}px`,
            textAlign: 'center',
            maxWidth: '320px',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: '10px',
              letterSpacing: '0.04em',
              color: hasPosition ? 'var(--dashboard-text-muted)' : 'var(--dashboard-text-ghost)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block',
            }}
          >
            {statusText}
          </span>
        </div>

        {/* Zero-state onboarding */}
        {!hasPosition && !isConnected && (
          <div
            className="absolute z-30 select-none"
            style={{
              left: `${nowPct}%`,
              top: `calc(50% + ${vaultStackOffsetPx}px)`,
              transform: 'translate(-50%, 56px)',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontFamily: FONT,
                fontSize: '0.82rem',
                fontWeight: 500,
                letterSpacing: '0.04em',
                color: 'var(--dashboard-text-ghost)',
              }}
            >
              Connect → Deposit → Earn
            </span>
          </div>
        )}

        {/* Action anchor — below status, slightly right of NOW */}
        <div
          className="absolute z-30"
          style={{
            left: `${nowPct}%`,
            top: `calc(50% + ${vaultStackOffsetPx}px)`,
            transform: 'translateX(10px)',
            paddingTop: `${nowActionsPadTop}px`,
            maxWidth: '420px',
            width: 'max-content',
          }}
        >
          <NowActions
            hasPosition={hasPosition}
            isConnected={isConnected}
            claimableNum={claimableNum}
            canWithdraw={canWithdraw}
            isProcessing={isProcessing}
            isClaiming={isClaiming}
            depositAmount={localDepositAmt}
            setDepositAmount={setLocalDepositAmt}
            onDeposit={handleDeposit}
            onClaim={handleClaim}
            onWithdraw={handleWithdraw}
            depositFlow={depositFlow}
            withdrawFlow={withdrawFlow}
            usdcBalance={usdcBalance}
            withdrawConfirm={withdrawConfirm}
            onCancelWithdraw={() => setWithdrawConfirm(false)}
            vaultName={activeVault?.name}
          />
        </div>

        {/* Accumulated — left of NOW */}
        <div
          className="absolute z-30 select-none"
          style={{
            right: `${100 - nowPct + 3}%`,
            top: `calc(50% + ${vaultStackOffsetPx}px)`,
            transform: 'translateY(-50%)',
            textAlign: 'right',
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: '9px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              color: 'var(--dashboard-text-ghost)',
              marginBottom: '4px',
            }}
          >
            Accumulated
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: '14px',
              fontWeight: 500,
              color: hasPosition ? 'var(--dashboard-text-secondary)' : 'var(--dashboard-text-ghost)',
            }}
          >
            {hasPosition ? `+${fmtUsd(claimableNum)}` : '$0.00'}
          </div>
        </div>

        {/* Projected — right of NOW */}
        <div
          className="absolute z-30 select-none"
          style={{
            left: `${nowPct + 3}%`,
            top: `calc(50% + ${vaultStackOffsetPx}px)`,
            transform: 'translateY(-50%)',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: '9px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              color: 'var(--dashboard-text-ghost)',
              marginBottom: '4px',
            }}
          >
            Projected
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: '14px',
              fontWeight: 500,
              color: hasPosition ? 'var(--dashboard-text-muted)' : 'var(--dashboard-text-ghost)',
            }}
          >
            {hasPosition ? `+${fmtUsd(projectedMonthly)}/mo` : '—'}
          </div>
        </div>

        {/* Bottom axis */}
        <div
          className="absolute left-0 right-0 bottom-0 flex items-center justify-between select-none"
          style={{
            height: '28px',
            padding: '0 clamp(1.25rem, 3vw, 2rem)',
            borderTop: '1px solid var(--dashboard-border)',
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: '8px', letterSpacing: '0.1em', color: 'var(--dashboard-text-ghost)', textTransform: 'uppercase' as const }}>
            Epoch start
          </span>
          <span style={{ fontFamily: MONO, fontSize: '8px', letterSpacing: '0.1em', color: 'var(--dashboard-text-ghost)', textTransform: 'uppercase' as const }}>
            Epoch {String(epoch + 1).padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── NOW Actions ─────────────────────────────────────────────────────────

function NowActions({
  hasPosition,
  isConnected,
  claimableNum,
  canWithdraw,
  isProcessing,
  isClaiming,
  depositAmount,
  setDepositAmount,
  onDeposit,
  onClaim,
  onWithdraw,
  depositFlow,
  withdrawFlow,
  usdcBalance,
  withdrawConfirm,
  onCancelWithdraw,
  vaultName,
}: {
  hasPosition: boolean
  isConnected: boolean
  claimableNum: number
  canWithdraw: boolean
  isProcessing: boolean
  isClaiming: boolean
  depositAmount: string
  setDepositAmount: (v: string) => void
  onDeposit: () => void
  onClaim: () => void
  onWithdraw: () => void
  depositFlow: ReturnType<typeof useDeposit>
  withdrawFlow: ReturnType<typeof useWithdraw>
  usdcBalance: string
  withdrawConfirm: boolean
  onCancelWithdraw: () => void
  vaultName?: string
}) {
  if (!isConnected) {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal, mounted }) => {
          if (!mounted) return null
          return (
            <button
              onClick={openConnectModal}
              style={{
                fontFamily: FONT,
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
                padding: '6px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--dashboard-text-secondary)',
                transition: 'color 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--dashboard-text-primary)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--dashboard-text-secondary)' }}
            >
              Connect Wallet →
            </button>
          )
        }}
      </ConnectButton.Custom>
    )
  }

  const depositLabel = depositFlow.isApproving
    ? 'Approving…'
    : depositFlow.isDepositing
      ? 'Depositing…'
      : depositFlow.isConfirming
        ? 'Confirming…'
        : 'Deposit'

  const withdrawLabel = withdrawFlow.isPending
    ? 'Withdrawing…'
    : withdrawFlow.isConfirming
      ? 'Confirming…'
      : withdrawConfirm
        ? 'Confirm Withdraw'
        : 'Withdraw'

  const balanceNum = parseFloat(usdcBalance) || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0' }}>
      {/* Vault context */}
      {vaultName && (
        <div
          style={{
            fontFamily: MONO,
            fontSize: '8px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            color: 'var(--dashboard-text-ghost)',
            marginBottom: '4px',
          }}
        >
          {vaultName}
        </div>
      )}

      {/* Claim — prominent when available */}
      {hasPosition && claimableNum > 0 && (
        <NowAction
          label={isClaiming ? 'Claiming…' : `Claim ${fmtUsd(claimableNum)}`}
          onClick={onClaim}
          accent
          underline
          disabled={isProcessing}
        />
      )}

      {/* Balance context */}
      <div
        style={{
          fontFamily: MONO,
          fontSize: '9px',
          letterSpacing: '0.06em',
          color: 'var(--dashboard-text-ghost)',
          marginTop: hasPosition && claimableNum > 0 ? '8px' : '0',
          marginBottom: '4px',
        }}
      >
        Balance: {balanceNum > 0 ? fmtUsd(balanceNum) : '—'} USDC
      </div>

      {/* Deposit — inline input + text action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          borderBottom: '1px solid var(--dashboard-border)',
          paddingBottom: '6px',
          marginBottom: '4px',
        }}
      >
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value.replace(/[^0-9.]/g, ''))}
          disabled={isProcessing}
          style={{
            minWidth: '96px',
            width: '96px',
            fontFamily: MONO,
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--dashboard-text-primary)',
            background: 'none',
            border: 'none',
            outline: 'none',
            padding: 0,
            opacity: isProcessing ? 0.4 : 1,
          }}
        />
        <span style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.08em', color: 'var(--dashboard-text-ghost)' }}>
          USDC
        </span>
      </div>

      <NowAction
        label={depositLabel}
        onClick={onDeposit}
        disabled={!depositAmount || isProcessing}
      />

      {hasPosition && canWithdraw && (
        <>
          <NowAction
            label={withdrawLabel}
            onClick={onWithdraw}
            disabled={isProcessing && !withdrawConfirm}
            accent={withdrawConfirm}
          />
          {withdrawConfirm && (
            <NowAction
              label="Cancel"
              onClick={onCancelWithdraw}
            />
          )}
        </>
      )}
    </div>
  )
}

function NowAction({
  label,
  onClick,
  disabled = false,
  accent = false,
  underline = false,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  accent?: boolean
  underline?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: FONT,
        fontSize: '0.75rem',
        fontWeight: accent ? 700 : 600,
        letterSpacing: '0.02em',
        padding: '6px 0',
        background: 'none',
        border: 'none',
        borderBottom: underline ? '1px solid var(--dashboard-accent)' : 'none',
        cursor: disabled ? 'default' : 'pointer',
        color: disabled
          ? 'var(--dashboard-text-ghost)'
          : accent
            ? 'var(--dashboard-accent)'
            : 'var(--dashboard-text-secondary)',
        opacity: disabled ? 0.4 : 1,
        transition: 'color 0.15s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.color = 'var(--dashboard-text-primary)'
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.color = accent
            ? 'var(--dashboard-accent)'
            : 'var(--dashboard-text-secondary)'
        }
      }}
    >
      {label}
    </button>
  )
}

// ─── Primitives ──────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontSize: '9px',
        letterSpacing: '0.14em',
        textTransform: 'uppercase' as const,
        color: 'var(--dashboard-text-ghost)',
        marginBottom: '8px',
      }}
    >
      {children}
    </div>
  )
}

function BigNumber({ value }: { value: number }) {
  const [whole, decimal] = value.toFixed(2).split('.')
  const formatted = Number(whole).toLocaleString('en-US')

  return (
    <div style={{ fontFamily: FONT, fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1 }}>
      <span style={{ fontSize: 'clamp(2rem, 4vw, 2.65rem)', color: 'var(--dashboard-text-primary)' }}>
        ${formatted}
      </span>
      <span style={{ fontSize: 'clamp(1.2rem, 2.4vw, 1.5rem)', color: 'var(--dashboard-text-ghost)' }}>
        .{decimal}
      </span>
    </div>
  )
}

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span
        style={{
          fontFamily: FONT,
          fontSize: '0.8rem',
          fontWeight: 500,
          color: 'var(--dashboard-text-muted)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: '13px',
          fontWeight: 500,
          color: accent ? 'var(--dashboard-accent)' : 'var(--dashboard-text-primary)',
          letterSpacing: '0.02em',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function Sep() {
  return <div style={{ height: '1px', background: 'var(--dashboard-border)', margin: '2px 0' }} />
}

function fmtUsd(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
