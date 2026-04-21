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

type ScreenState = 'disconnected' | 'connected-empty' | 'active' | 'locked' | 'claimable'

function useScreenState(): ScreenState {
  const { isConnected } = useAccount()
  const { depositAmount } = useUserPosition()
  if (!isConnected) return 'disconnected'
  const depositNum = parseFloat(depositAmount) || 0
  if (depositNum === 0) return 'connected-empty'
  return 'active'
}

// ─── Shared typographic constants (Satoshi = --font-sans, mono = --font-mono) ─

const FONT = "var(--font-sans, 'Satoshi Variable', Inter, -apple-system, sans-serif)"
const MONO = "var(--font-mono, 'IBM Plex Mono', ui-monospace, monospace)"

// ─── Canvas ──────────────────────────────────────────────────────────────

export function Canvas() {
  const state = useScreenState()

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
      {state === 'disconnected' ? <DisconnectedView /> : <ActiveView state={state} />}
    </div>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────

function Header() {
  const { isConnected } = useAccount()
  const { annualAPR } = useVaultData()

  const statusLine = annualAPR > 0 ? 'Yielding at target' : 'Vault active'

  return (
    <header
      className="flex items-center justify-between shrink-0 select-none"
      style={{
        height: '48px',
        padding: '0 clamp(1rem, 4vw, 2rem)',
        borderBottom: '1px solid var(--dashboard-border)',
        background: 'color-mix(in srgb, var(--dashboard-page) 85%, transparent)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex items-center" style={{ gap: '0.5rem' }}>
        <span
          style={{
            fontFamily: FONT,
            fontSize: '0.95rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--dashboard-text-primary)',
          }}
        >
          Hearst
        </span>
        <span
          style={{
            fontFamily: FONT,
            fontSize: '0.8rem',
            fontWeight: 400,
            color: 'var(--dashboard-text-ghost)',
          }}
        >
          Connect
        </span>
      </div>

      <div className="flex items-center" style={{ gap: '1rem' }}>
        {isConnected && (
          <span
            style={{
              fontFamily: MONO,
              fontSize: '10px',
              letterSpacing: '0.08em',
              color: 'var(--dashboard-accent)',
            }}
          >
            {statusLine}
          </span>
        )}
        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
            if (!mounted) return null
            if (!account) {
              return (
                <button
                  onClick={openConnectModal}
                  style={{
                    fontFamily: FONT,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--dashboard-text-secondary)',
                    background: 'none',
                    border: '1px solid var(--dashboard-border)',
                    padding: '6px 16px',
                    borderRadius: '9999px',
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
                  Connect
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
      </div>
    </header>
  )
}

// ─── Disconnected ────────────────────────────────────────────────────────

function DisconnectedView() {
  return (
    <div className="flex-1 flex items-center" style={{ padding: '0 clamp(1.5rem, 5vw, 3rem)' }}>
      <div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: '10px',
            letterSpacing: '0.14em',
            color: 'var(--dashboard-text-ghost)',
            textTransform: 'uppercase' as const,
            marginBottom: '16px',
          }}
        >
          Vault · EpochVault
        </div>
        <h1
          style={{
            fontFamily: FONT,
            fontSize: 'clamp(1.65rem, 3.6vw, 2.65rem)',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            lineHeight: 1.12,
            color: 'var(--dashboard-text-primary)',
            maxWidth: '420px',
            margin: '0 0 12px',
          }}
        >
          Turn Bitcoin Mining
          <br />
          Into Structured Yield
        </h1>
        <p
          style={{
            fontFamily: FONT,
            fontSize: 'clamp(0.95rem, 1.3vw, 1.1rem)',
            fontWeight: 400,
            lineHeight: 1.55,
            color: 'var(--dashboard-text-secondary)',
            maxWidth: '380px',
            margin: '0 0 32px',
          }}
        >
          Institutional-grade yield from real mining infrastructure, packaged into transparent onchain vaults.
        </p>
        <ConnectButton.Custom>
          {({ openConnectModal, mounted }) => {
            if (!mounted) return null
            return (
              <button
                onClick={openConnectModal}
                style={{
                  fontFamily: FONT,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: 'var(--dashboard-page)',
                  background: 'var(--dashboard-accent)',
                  border: 'none',
                  padding: '0.65rem 1.75rem',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(167,251,144,0.2)',
                  transition: 'background 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--dashboard-accent-hover)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(167,251,144,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--dashboard-accent)'
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(167,251,144,0.2)'
                }}
              >
                Connect Wallet
              </button>
            )
          }}
        </ConnectButton.Custom>
      </div>
    </div>
  )
}

// ─── Active View (two-column) ────────────────────────────────────────────

function ActiveView({ state }: { state: ScreenState }) {
  return (
    <div className="flex-1 flex min-h-0">
      <Ledger state={state} />
      <div style={{ width: '1px', background: 'var(--dashboard-border)', flexShrink: 0 }} />
      <TemporalField />
    </div>
  )
}

// ─── Left Ledger ─────────────────────────────────────────────────────────

function Ledger({ state }: { state: ScreenState }) {
  const hasVault = state !== 'connected-empty'

  return (
    <div
      className="flex flex-col justify-between shrink-0"
      style={{ width: '400px', padding: '36px clamp(1.25rem, 3vw, 2rem) 28px', overflow: 'auto' }}
    >
      {hasVault ? <LedgerActive /> : <LedgerEmpty />}
    </div>
  )
}

function LedgerEmpty() {
  return (
    <div className="flex-1 flex flex-col justify-center">
      <SectionLabel>No Position</SectionLabel>
      <p
        style={{
          fontFamily: FONT,
          fontSize: '0.95rem',
          fontWeight: 400,
          color: 'var(--dashboard-text-secondary)',
          lineHeight: 1.55,
          marginTop: '8px',
          maxWidth: '300px',
        }}
      >
        Connect a wallet with an active vault position to view your ledger.
      </p>
    </div>
  )
}

function LedgerActive() {
  const [depositAmount, setDepositAmount] = useState('')
  const { depositAmount: userDeposit, canWithdraw, lockEnd } = useUserPosition()
  const { pending, claim, isClaiming } = useRewards()
  const { annualAPR } = useVaultData()
  const depositFlow = useDeposit()
  const withdrawFlow = useWithdraw()

  const currentValue = parseFloat(userDeposit) + parseFloat(pending)
  const claimableNum = parseFloat(pending) || 0

  const handleDeposit = useCallback(() => {
    if (!depositAmount) return
    depositFlow.execute(depositAmount)
  }, [depositAmount, depositFlow])

  const handleClaim = useCallback(() => {
    claim()
  }, [claim])

  const handleWithdraw = useCallback(() => {
    if (!canWithdraw || !userDeposit) return
    withdrawFlow.withdraw(userDeposit)
  }, [canWithdraw, userDeposit, withdrawFlow])

  const lockStatus = canWithdraw ? 'Unlocked' : 'Locked'
  const nextUnlock = lockEnd > 0 
    ? new Date(lockEnd * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Not set'

  const isProcessing = 
    depositFlow.isApproving || 
    depositFlow.isDepositing || 
    depositFlow.isConfirming ||
    isClaiming ||
    withdrawFlow.isPending ||
    withdrawFlow.isConfirming

  return (
    <>
      {/* Primary figure */}
      <div>
        <SectionLabel>Current Value</SectionLabel>
        <BigNumber value={currentValue} />

        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <LedgerLine label="Total Deposited" value={fmt(parseFloat(userDeposit))} />
          <LedgerLine label="Claimable" value={fmt(claimableNum)} accent />
          <LedgerLine label="APR" value={`${annualAPR.toFixed(1)}%`} />

          <div style={{ height: '1px', background: 'var(--dashboard-border)', margin: '6px 0' }} />

          <LedgerLine label="Lock Status" value={lockStatus} />
          <LedgerLine label="Next Unlock" value={nextUnlock} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: '44px', display: 'flex', flexDirection: 'column', gap: '0' }}>
        {/* Deposit input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid var(--dashboard-border)',
            paddingBottom: '10px',
            marginBottom: '18px',
            gap: '8px',
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
              flex: 1,
              fontFamily: MONO,
              fontSize: '15px',
              fontWeight: 500,
              color: 'var(--dashboard-text-primary)',
              background: 'none',
              border: 'none',
              outline: 'none',
              padding: 0,
              opacity: isProcessing ? 0.5 : 1,
            }}
          />
          <span
            style={{
              fontFamily: MONO,
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: 'var(--dashboard-text-ghost)',
            }}
          >
            USDC
          </span>
        </div>

        <ActionButton 
          label={depositFlow.isApproving ? 'Approving...' : depositFlow.isDepositing ? 'Depositing...' : depositFlow.isConfirming ? 'Confirming...' : 'Deposit'} 
          onClick={handleDeposit} 
          disabled={!depositAmount || isProcessing} 
        />
        <Divider />
        <ActionButton 
          label={isClaiming ? 'Claiming...' : `Claim — ${fmt(claimableNum)}`} 
          onClick={handleClaim} 
          accent 
          disabled={claimableNum === 0 || isProcessing}
        />
        <Divider />
        <ActionButton 
          label={withdrawFlow.isPending ? 'Withdrawing...' : withdrawFlow.isConfirming ? 'Confirming...' : 'Withdraw'} 
          onClick={handleWithdraw} 
          disabled={!canWithdraw || isProcessing} 
          muted={!canWithdraw}
        />
      </div>
    </>
  )
}

// ─── Right Temporal Field ────────────────────────────────────────────────

function TemporalField() {
  const { epoch, progress } = useEpoch()
  const { pending } = useRewards()
  const { annualAPR } = useVaultData()

  const claimableNum = parseFloat(pending) || 0
  const nowY = `${progress * 100}%`

  return (
    <div className="flex-1 relative" style={{ overflow: 'hidden' }}>
      {/* Subtle grid lines */}
      <div className="absolute inset-0" style={{ opacity: 0.25 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0"
            style={{
              top: `${((i + 1) / 11) * 100}%`,
              height: '1px',
              background: 'var(--dashboard-border)',
            }}
          />
        ))}
      </div>

      {/* Past region — slightly raised surface */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: nowY,
          background: 'var(--dashboard-overlay-02)',
        }}
      />

      {/* NOW line */}
      <div className="absolute left-0 right-0 z-10" style={{ top: nowY }}>
        <div style={{ height: '1px', background: 'var(--dashboard-accent)', opacity: 0.5 }} />
        <div className="flex items-center justify-between" style={{ padding: '8px clamp(1rem, 3vw, 2rem) 0' }}>
          <span
            style={{
              fontFamily: FONT,
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
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
              letterSpacing: '0.06em',
              color: 'var(--dashboard-text-ghost)',
            }}
          >
            {Math.round(progress * 100)}%
          </span>
        </div>
      </div>

      {/* Future region — projected gradient */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          top: nowY,
          background: 'linear-gradient(to bottom, transparent, var(--dashboard-accent-soft))',
        }}
      />

      {/* Epoch annotation — top left */}
      <div className="absolute" style={{ top: '28px', left: 'clamp(1rem, 3vw, 2rem)' }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: '9px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            color: 'var(--dashboard-text-ghost)',
            marginBottom: '6px',
          }}
        >
          Epoch
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: '36px',
            fontWeight: 300,
            letterSpacing: '-0.03em',
            color: 'var(--dashboard-text-muted)',
            lineHeight: 1,
          }}
        >
          {String(epoch).padStart(2, '0')}
        </div>
      </div>

      {/* Projected yield — right of NOW */}
      <div
        className="absolute z-10"
        style={{
          top: nowY,
          right: 'clamp(1rem, 3vw, 2rem)',
          transform: 'translateY(-100%)',
          paddingBottom: '10px',
          textAlign: 'right',
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase' as const,
            color: 'var(--dashboard-text-ghost)',
            marginBottom: '3px',
          }}
        >
          Projected
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--dashboard-text-secondary)',
            letterSpacing: '0.01em',
          }}
        >
          +${claimableNum.toFixed(2)}
        </div>
      </div>

      {/* Bottom left — next epoch */}
      <div className="absolute" style={{ bottom: '28px', left: 'clamp(1rem, 3vw, 2rem)' }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: '9px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            color: 'var(--dashboard-text-ghost)',
          }}
        >
          Epoch {String(epoch + 1).padStart(2, '0')}
        </div>
      </div>

      {/* Bottom right — target APR */}
      <div className="absolute" style={{ bottom: '28px', right: 'clamp(1rem, 3vw, 2rem)', textAlign: 'right' }}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase' as const,
            color: 'var(--dashboard-text-ghost)',
            marginBottom: '3px',
          }}
        >
          Target APR
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--dashboard-text-muted)',
          }}
        >
          {annualAPR.toFixed(1)}%
        </div>
      </div>
    </div>
  )
}

// ─── Primitives ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
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

function LedgerLine({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span
        style={{
          fontFamily: FONT,
          fontSize: '0.8rem',
          fontWeight: 500,
          letterSpacing: '0.01em',
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

function ActionButton({
  label,
  onClick,
  disabled = false,
  accent = false,
  muted = false,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  accent?: boolean
  muted?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: FONT,
        fontSize: '0.8rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        textAlign: 'left',
        padding: '11px 0',
        background: 'none',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        color: disabled
          ? 'var(--dashboard-text-ghost)'
          : accent
            ? 'var(--dashboard-accent)'
            : 'var(--dashboard-text-secondary)',
        opacity: disabled && muted ? 0.3 : 1,
        transition: 'color 0.15s ease',
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

function Divider() {
  return <div style={{ height: '1px', background: 'var(--dashboard-border)', margin: '2px 0' }} />
}

function fmt(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
