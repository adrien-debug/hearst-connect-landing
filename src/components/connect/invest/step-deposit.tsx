'use client'

import { useState } from 'react'
import { TOKENS, fmtUsd, fmtUsdCompact, VALUE_LETTER_SPACING, LINE_HEIGHT } from '../constants'
import type { AvailableVault } from '../data'
import type { VaultConfig, MarketRegime } from '@/types/vault'
import { TimeToTargetChart } from './time-to-target-chart'
import { PreFlightCheck } from '../pre-flight-check'

interface StepDepositProps {
  vault: AvailableVault
  vaultConfig: VaultConfig | null
  amount: string
  onAmountChange: (v: string) => void
  agreed: boolean
  onAgreedChange: (v: boolean) => void
  isReady: boolean
  isDepositing: boolean
  isApproving: boolean
  onApprove: () => void
  onDeposit: () => void
  onBack: () => void
  shellGap: string
}

const SCENARIO_TITLES: Record<MarketRegime, string> = {
  bull: 'Accelerate growth',
  sideways: 'Baseline mix',
  bear: 'Protect capital',
}

/** Step 3 — Deposit. Amount input + Summary side panel + Time-to-target chart
 * + Dynamic allocation cards. Validates min deposit, term-sheet, then enables
 * the Confirm deposit CTA. */
export function StepDeposit({
  vault,
  vaultConfig,
  amount,
  onAmountChange,
  agreed,
  onAgreedChange,
  isReady,
  isDepositing,
  isApproving,
  onApprove,
  onDeposit,
  onBack,
}: StepDepositProps) {
  const num = parseFloat(amount) || 0
  const cumulativeTarget = vaultConfig?.cumulativeTarget ?? (parseFloat(vault.target.replace('%', '')) || 0)
  const lockMonths = Math.round((vaultConfig?.lockPeriodDays ?? 365) / 30)
  const yearlyYield = num * (vault.apr / 100)
  const totalYield = num * (cumulativeTarget / 100)
  const minDeposit = vault.minDeposit
  const isAmountValid = num >= minDeposit
  // Defer the min-deposit error message until the input loses focus so the
  // user isn't yelled at while still typing a valid amount.
  const [touched, setTouched] = useState(false)
  const showError = touched && num > 0 && !isAmountValid
  const rebalance = vaultConfig?.rebalanceWeights
  // Pre-flight check (wallet/network/allowance/epoch) gates the Confirm CTA.
  const [preFlightReady, setPreFlightReady] = useState(false)
  const isReadyToDeposit = isReady && preFlightReady

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[4] }}>
      {/* Top section — Title + 2-col (Deposit form left / Summary right) */}
      <div style={{
        background: TOKENS.colors.black,
        border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
        borderRadius: TOKENS.radius.lg,
        padding: TOKENS.spacing[6],
        display: 'flex',
        flexDirection: 'column',
        gap: TOKENS.spacing[4],
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: TOKENS.spacing[3], flexWrap: 'wrap' }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: TOKENS.fontSizes.xl,
              fontWeight: TOKENS.fontWeights.black,
              color: TOKENS.colors.textPrimary,
              letterSpacing: TOKENS.letterSpacing.tight,
            }}>
              {vault.name}
            </h2>
            <p style={{
              margin: `${TOKENS.spacing[1]} 0 0 0`,
              fontSize: TOKENS.fontSizes.sm,
              color: TOKENS.colors.textSecondary,
            }}>
              Deposit USDC on {vaultConfig?.chain?.name ?? 'Base'}. Minimum ${formatPlainDollar(minDeposit)}.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: TOKENS.spacing[2] }}>
            <span style={{
              fontSize: TOKENS.fontSizes.xxl,
              fontWeight: TOKENS.fontWeights.black,
              color: TOKENS.colors.accent,
              letterSpacing: VALUE_LETTER_SPACING,
              lineHeight: LINE_HEIGHT.tight,
            }}>
              {vault.apr}
            </span>
            <span style={{
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              color: TOKENS.colors.textGhost,
            }}>
              % APY
            </span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: TOKENS.spacing[6],
          marginTop: TOKENS.spacing[2],
          paddingTop: TOKENS.spacing[4],
          borderTop: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
        }}>
          {/* LEFT — amount input + checkbox + Confirm button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[4] }}>
            <SectionLabel>Amount (USDC)</SectionLabel>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: `${TOKENS.borders.thin} solid ${isAmountValid ? TOKENS.colors.accent : TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radius.md,
              padding: `0 ${TOKENS.spacing[4]}`,
              background: isAmountValid ? TOKENS.colors.accentSubtle : TOKENS.colors.bgTertiary,
              height: TOKENS.control.heightLg,
            }}>
              <span style={{
                fontSize: TOKENS.fontSizes.xxl,
                fontWeight: TOKENS.fontWeights.black,
                color: num > 0 ? TOKENS.colors.accent : TOKENS.colors.textGhost,
                marginRight: TOKENS.spacing[1],
                lineHeight: 1,
                flexShrink: 0,
              }}>$</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="0.00"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
                onBlur={() => setTouched(true)}
                aria-invalid={showError}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: 0,
                  background: 'transparent',
                  fontWeight: TOKENS.fontWeights.black,
                  color: TOKENS.colors.textPrimary,
                  outline: 'none',
                  fontSize: TOKENS.fontSizes.xxl,
                  fontFamily: TOKENS.fonts.sans,
                  letterSpacing: VALUE_LETTER_SPACING,
                  lineHeight: 1,
                  padding: 0,
                  height: '100%',
                }}
              />
              <span style={{
                fontFamily: TOKENS.fonts.mono,
                fontWeight: TOKENS.fontWeights.bold,
                color: TOKENS.colors.textGhost,
                fontSize: TOKENS.fontSizes.xs,
                marginLeft: TOKENS.spacing[2],
                flexShrink: 0,
                letterSpacing: TOKENS.letterSpacing.display,
              }}>
                USDC
              </span>
            </div>
            <div style={{ minHeight: TOKENS.spacing[4], fontSize: TOKENS.fontSizes.xs, fontWeight: TOKENS.fontWeights.bold }}>
              {showError ? (
                <span style={{ color: TOKENS.colors.danger }}>Minimum deposit: {fmtUsd(minDeposit)}</span>
              ) : isAmountValid ? (
                <span style={{ color: TOKENS.colors.accent }}>✓ Minimum reached</span>
              ) : (
                <span style={{ color: 'transparent' }}>·</span>
              )}
            </div>

            <label style={{
              display: 'flex',
              gap: TOKENS.spacing[2],
              alignItems: 'flex-start',
              fontSize: TOKENS.fontSizes.xs,
              color: TOKENS.colors.textSecondary,
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => onAgreedChange(e.target.checked)}
                style={{ marginTop: TOKENS.spacing.half, accentColor: TOKENS.colors.accent }}
              />
              I have read and accept the <a href="#" style={{ color: TOKENS.colors.accent, textDecoration: 'underline' }}>term sheet</a>.
            </label>

            <div style={{ display: 'flex', gap: TOKENS.spacing[3], flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={onBack}
                style={{
                  padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
                  background: 'transparent',
                  color: TOKENS.colors.textSecondary,
                  border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderStrong}`,
                  borderRadius: TOKENS.radius.md,
                  fontFamily: TOKENS.fonts.mono,
                  fontSize: TOKENS.fontSizes.xs,
                  fontWeight: TOKENS.fontWeights.bold,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={!isReadyToDeposit || isDepositing}
                onClick={onDeposit}
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[5]}`,
                  background: isReadyToDeposit ? TOKENS.colors.accentSubtle : TOKENS.colors.bgTertiary,
                  color: isReadyToDeposit ? TOKENS.colors.accent : TOKENS.colors.textGhost,
                  border: `${TOKENS.borders.thin} solid ${isReadyToDeposit ? TOKENS.colors.accent : TOKENS.colors.borderSubtle}`,
                  borderRadius: TOKENS.radius.md,
                  fontFamily: TOKENS.fonts.mono,
                  fontSize: TOKENS.fontSizes.sm,
                  fontWeight: TOKENS.fontWeights.black,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                  cursor: isReadyToDeposit && !isDepositing ? 'pointer' : 'not-allowed',
                  opacity: isDepositing ? 0.7 : 1,
                }}
              >
                {isDepositing
                  ? 'Confirming…'
                  : !isReady
                    ? 'Enter amount to confirm'
                    : !preFlightReady
                      ? 'Complete pre-flight check'
                      : `Confirm deposit · ${fmtUsdCompact(num)} →`}
              </button>
            </div>
          </div>

          {/* RIGHT — Summary + Pre-flight */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[4] }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[3] }}>
              <SectionLabel>Summary</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[2] }}>
                <SumRow label="You deposit"             value={`${fmtUsd(num)} USDC`} />
                <SumRow label="Target APY"              value={`${vault.apr}%`} accent />
                <SumRow label="Est. yearly yield"       value={`${fmtUsd(yearlyYield)} USDC`} />
                <SumRow label="Total yield at close"    value={`${fmtUsd(totalYield)} USDC`} accent />
                <SumRow label="Capital unlocks"         value={`when target is hit · max ${lockMonths} months`} />
                <SumRow label="Fees"                    value={vault.fees ?? '—'} />
              </div>
            </div>
            <PreFlightCheck
              vault={vault}
              depositAmount={amount}
              onApprove={onApprove}
              isApproving={isApproving}
              onReadyChange={setPreFlightReady}
            />
          </div>
        </div>
      </div>

      {/* Time-to-target chart */}
      {num > 0 && (
        <div style={{
          background: TOKENS.colors.black,
          border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
          borderRadius: TOKENS.radius.lg,
          padding: TOKENS.spacing[6],
          display: 'flex',
          flexDirection: 'column',
          gap: TOKENS.spacing[3],
        }}>
          <TimeToTargetChart
            principal={num}
            cumulativeTargetPct={cumulativeTarget}
            lockMonths={lockMonths}
          />
        </div>
      )}

      {/* Dynamic allocation — 3 cards Bull/Sideways/Bear */}
      {rebalance && (
        <div style={{
          background: TOKENS.colors.black,
          border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
          borderRadius: TOKENS.radius.lg,
          padding: TOKENS.spacing[6],
          display: 'flex',
          flexDirection: 'column',
          gap: TOKENS.spacing[3],
        }}>
          <div>
            <SectionLabel>Dynamic allocation · rebalancing by market condition</SectionLabel>
            <p style={{
              margin: `${TOKENS.spacing[2]} 0 0 0`,
              fontSize: TOKENS.fontSizes.xs,
              color: TOKENS.colors.textSecondary,
            }}>
              Automated portfolio controls continuously rebalance exposures, tighten volatility
              thresholds, and shift capital toward more defensive strategies during downturns.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: TOKENS.spacing[3],
            marginTop: TOKENS.spacing[2],
          }}>
            {(['bull', 'sideways', 'bear'] as const).map((regime) => {
              const slices = rebalance[regime]
              const dotColor: Record<MarketRegime, string> = {
                bull: TOKENS.colors.accent,
                sideways: TOKENS.colors.textGhost,
                bear: TOKENS.colors.danger,
              }
              return (
                <div key={regime} style={{
                  background: TOKENS.colors.bgTertiary,
                  border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
                  borderRadius: TOKENS.radius.md,
                  padding: TOKENS.spacing[3],
                  display: 'flex',
                  flexDirection: 'column',
                  gap: TOKENS.spacing[2],
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: TOKENS.spacing[2],
                    fontFamily: TOKENS.fonts.mono,
                    fontSize: TOKENS.fontSizes.micro,
                    fontWeight: TOKENS.fontWeights.bold,
                    letterSpacing: TOKENS.letterSpacing.display,
                    textTransform: 'uppercase',
                    color: TOKENS.colors.textSecondary,
                    width: 'fit-content',
                  }}>
                    <span style={{
                      width: TOKENS.dot.sm,
                      height: TOKENS.dot.sm,
                      borderRadius: TOKENS.radius.full,
                      background: dotColor[regime],
                    }} />
                    {regime}
                  </span>
                  <div style={{
                    fontSize: TOKENS.fontSizes.sm,
                    fontWeight: TOKENS.fontWeights.black,
                    color: TOKENS.colors.textPrimary,
                  }}>
                    {SCENARIO_TITLES[regime]}
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: TOKENS.fontSizes.xs,
                    color: TOKENS.colors.textSecondary,
                    lineHeight: LINE_HEIGHT.body,
                  }}>
                    {slices[0]?.pitch ?? ''}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p style={{
        margin: 0,
        fontSize: TOKENS.fontSizes.xs,
        color: TOKENS.colors.textGhost,
        textAlign: 'right',
      }}>
        Deposits are settled on {vaultConfig?.chain?.name ?? 'Base'}. Network fee ≈ $0.02.
      </p>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: TOKENS.fonts.mono,
      fontSize: TOKENS.fontSizes.micro,
      fontWeight: TOKENS.fontWeights.bold,
      letterSpacing: TOKENS.letterSpacing.display,
      textTransform: 'uppercase',
      color: TOKENS.colors.textGhost,
      borderLeft: `var(--dashboard-card-border-accent-width) solid ${TOKENS.colors.borderStrong}`,
      paddingLeft: TOKENS.spacing[3],
    }}>
      {children}
    </span>
  )
}

function SumRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: TOKENS.spacing[3],
      paddingBlock: TOKENS.spacing[1],
      borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
    }}>
      <span style={{ fontSize: TOKENS.fontSizes.xs, color: TOKENS.colors.textSecondary }}>{label}</span>
      <span style={{
        fontSize: TOKENS.fontSizes.sm,
        fontWeight: TOKENS.fontWeights.bold,
        color: accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
        fontFamily: TOKENS.fonts.sans,
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </span>
    </div>
  )
}

function formatPlainDollar(n: number): string {
  return n.toLocaleString('en-US')
}
