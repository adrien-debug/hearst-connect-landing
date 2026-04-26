'use client'

import { Label } from '@/components/ui/label'
import { PreFlightCheck } from './pre-flight-check'
import { TOKENS, fmtUsd, fmtUsdCompact, CHART_PALETTE } from './constants'
import type { AvailableVault } from './data'
import { fitValue, type SmartFitMode } from './smart-fit'

type Props = {
  vault: AvailableVault
  mode: SmartFitMode
  isLimit: boolean
  amount: string
  onAmountChange: (v: string) => void
  agreed: boolean
  onAgreedChange: (v: boolean) => void
  isValid: boolean
  isReady: boolean
  num: number
  yearlyYield: number
  totalYield: number
  onApprove: () => void
  isApproving: boolean
  onDeposit: () => void
  isDepositing: boolean
  onPreFlightReady?: (ready: boolean) => void
  onBack?: () => void
}

export function SubscriptionComposer({
  vault,
  mode,
  isLimit,
  amount,
  onAmountChange,
  agreed,
  onAgreedChange,
  isValid,
  isReady,
  num,
  yearlyYield,
  totalYield,
  onApprove,
  isApproving,
  onDeposit,
  isDepositing,
  onPreFlightReady,
  onBack,
}: Props) {
  const idAmount = 'subscribe-amount'
  const idAgree = 'subscribe-term-confirm'
  const idAmountHint = 'subscribe-amount-hint'
  const idAmountStatus = 'subscribe-amount-status'
  const idFieldsetTerms = 'subscribe-fieldset-terms'

  const showError = num > 0 && !isValid
  const showValidHint = isValid && num > 0
  const lockMonths = getLockMonths(vault.lockPeriod)

  return (
    <div
      className="flex flex-col flex-1"
      style={{
        gap: fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[2] }),
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: isLimit ? '1fr' : '1fr minmax(320px, 38%)',
        gap: fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[2] }),
        flex: 1,
        minHeight: 0,
      }}>
        {/* LEFT COLUMN: Product Info & Description */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[2] }),
          minHeight: 0,
        }}>
          {/* Product Header - Compact */}
          <div style={{
            background: TOKENS.colors.black,
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
            borderRadius: TOKENS.radius.lg,
            padding: fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[3] }),
          }}>
            {onBack && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: TOKENS.spacing[3],
              }}>
                <button
                  type="button"
                  onClick={onBack}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: TOKENS.spacing[2],
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: TOKENS.colors.accent,
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
                <span style={{
                  fontFamily: TOKENS.fonts.mono,
                  fontSize: TOKENS.fontSizes.micro,
                  color: TOKENS.colors.textGhost,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                }}>
                  {vault.lockPeriod} lock
                </span>
              </div>
            )}
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
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: TOKENS.fontSizes.xs,
                  color: TOKENS.colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: TOKENS.letterSpacing.wide,
                  marginBottom: TOKENS.spacing[1],
                }}>
                  {vault.strategy}
                </div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: fitValue(mode, { normal: TOKENS.fontSizes.xl, tight: TOKENS.fontSizes.lg, limit: TOKENS.fontSizes.md }),
                    fontWeight: TOKENS.fontWeights.black,
                    letterSpacing: TOKENS.letterSpacing.tight,
                    color: TOKENS.colors.textPrimary,
                    lineHeight: 1.2,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {vault.name}
                </h1>
              </div>
            </div>

            {/* Compact Metrics Row */}
            <div style={{
              display: 'flex',
              gap: TOKENS.spacing[6],
              marginTop: TOKENS.spacing[3],
              paddingTop: TOKENS.spacing[3],
              borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
            }}>
              <CompactMetric 
                label="Min Entry" 
                value={fmtUsd(vault.minDeposit)} 
                mode={mode}
              />
              <CompactMetric 
                label="Target" 
                value={vault.target} 
                mode={mode}
                accent
              />
              <CompactMetric 
                label="APY" 
                value={`${vault.apr}%`} 
                mode={mode}
              />
              <CompactMetric 
                label="Lock" 
                value={vault.lockPeriod} 
                mode={mode}
              />
            </div>
          </div>

          {/* Product Description Area — Key Terms + Strategy Pockets + Capital Recovery */}
          <div style={{
            flex: 1,
            background: TOKENS.colors.black,
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
            borderRadius: TOKENS.radius.lg,
            padding: fitValue(mode, { normal: TOKENS.spacing[6], tight: TOKENS.spacing[4], limit: TOKENS.spacing[3] }),
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: TOKENS.spacing[5],
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isLimit ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: TOKENS.spacing[6],
              alignItems: 'stretch',
            }}>
              <KeyTerms vault={vault} lockMonths={lockMonths} />
              <StrategyPockets />
            </div>
            <CapitalRecoveryCallout />
            <DynamicAllocation />
          </div>
        </div>

        {/* RIGHT COLUMN: Order Summary with Amount Input */}
        <div style={{
          background: TOKENS.colors.black,
          border: `1px solid ${TOKENS.colors.borderSubtle}`,
          borderRadius: TOKENS.radius.lg,
          padding: fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[3] }),
          display: 'flex',
          flexDirection: 'column',
        }}>
          <span style={{
            fontFamily: TOKENS.fonts.mono,
            fontSize: TOKENS.fontSizes.micro,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
            color: TOKENS.colors.textSecondary,
            marginBottom: TOKENS.spacing[4],
          }}>
            Order Summary
          </span>

          {/* Amount Input - Pixel Perfect */}
          <div style={{ marginBottom: TOKENS.spacing[4] }}>
            <label
              htmlFor={idAmount}
              id={idAmountHint}
              style={{
                display: 'block',
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.bold,
                textTransform: 'uppercase',
                letterSpacing: TOKENS.letterSpacing.display,
                color: TOKENS.colors.textSecondary,
                marginBottom: TOKENS.spacing[2],
              }}
            >
              Amount to deploy
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: `${TOKENS.borders.thin} solid ${isValid && num > 0 ? TOKENS.colors.accent : TOKENS.colors.borderSubtle}`,
                borderRadius: TOKENS.radius.md,
                padding: `0 ${TOKENS.spacing[3]}px`,
                background: TOKENS.colors.bgTertiary,
                transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
                height: '48px',
                boxShadow: isValid && num > 0 ? `0 0 0 1px ${TOKENS.colors.accent}20` : 'none',
              }}
            >
              <span
                style={{
                  fontSize: TOKENS.fontSizes.xl,
                  fontWeight: TOKENS.fontWeights.black,
                  color: num > 0 ? TOKENS.colors.textPrimary : TOKENS.colors.textGhost,
                  marginRight: TOKENS.spacing[2],
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                $
              </span>
              <input
                id={idAmount}
                name="amount"
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="0.00"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
                autoComplete="off"
                aria-invalid={showError}
                aria-describedby={[idAmountHint, num > 0 ? idAmountStatus : ''].filter(Boolean).join(' ') || undefined}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: 0,
                  background: 'transparent',
                  fontWeight: TOKENS.fontWeights.black,
                  color: TOKENS.colors.textPrimary,
                  outline: 'none',
                  fontSize: TOKENS.fontSizes.xl,
                  fontFamily: TOKENS.fonts.sans,
                  letterSpacing: VALUE_LETTER_SPACING,
                  lineHeight: 1,
                  padding: 0,
                  height: '100%',
                }}
              />
              <span
                style={{
                  fontWeight: TOKENS.fontWeights.bold,
                  color: TOKENS.colors.textGhost,
                  fontSize: TOKENS.fontSizes.xs,
                  marginLeft: TOKENS.spacing[2],
                  flexShrink: 0,
                  lineHeight: 1,
                }}
                aria-hidden
              >
                USDC
              </span>
            </div>
            <div
              id={idAmountStatus}
              role="status"
              aria-live="polite"
              style={{
                marginTop: TOKENS.spacing[2],
                minHeight: `${TOKENS.spacing[4]}px`,
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.bold,
                color: showError ? TOKENS.colors.danger : showValidHint ? TOKENS.colors.accent : 'transparent',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {showError && <span>Minimum: {fmtUsd(vault.minDeposit)}</span>}
              {showValidHint && !showError && <span style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[1] }}><span>✓</span> Valid amount</span>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[2], flex: 1 }}>
            <SpecItem label="Unlock Timeline" value={vault.lockPeriod} />
            <SpecItem label="Risk Profile" value={vault.risk} />
            <SpecItem label="Management Fees" value={vault.fees} />
            
            <div style={{ height: 1, background: TOKENS.colors.borderSubtle, margin: `${TOKENS.spacing[2]}px 0` }} />
            
            <ProjectionLine label="Est. Annual Yield" value={num > 0 ? `+${fmtUsd(yearlyYield)}` : '—'} highlight />
            <ProjectionLine label="Target Yield" value={num > 0 ? `+${fmtUsd(totalYield)}` : '—'} highlight />
            
            <div style={{ height: 1, background: TOKENS.colors.borderSubtle, margin: `${TOKENS.spacing[2]}px 0` }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <span style={{ 
                fontSize: TOKENS.fontSizes.xs, 
                fontWeight: TOKENS.fontWeights.bold,
                color: TOKENS.colors.textPrimary,
                textTransform: 'uppercase',
                letterSpacing: TOKENS.letterSpacing.display,
              }}>
                Total Value
              </span>
              <span style={{ 
                fontSize: TOKENS.fontSizes.lg, 
                fontWeight: TOKENS.fontWeights.black,
                color: TOKENS.colors.textPrimary,
                letterSpacing: VALUE_LETTER_SPACING,
              }}>
                {num > 0 ? fmtUsd(num + totalYield) : '—'}
              </span>
            </div>

            <ScenarioSimulation
              amount={num || vault.minDeposit}
              totalYield={num > 0 ? totalYield : vault.minDeposit * (parseFloat(vault.target.replace('%', '')) || 0) / 100}
              lockMonths={lockMonths}
              target={vault.target}
              mode={mode}
              compact
            />

            {/* Pre-flight Check */}
            <div style={{ marginTop: TOKENS.spacing[2] }}>
              <PreFlightCheck 
                vault={vault} 
                depositAmount={amount}
                onApprove={onApprove}
                isApproving={isApproving}
                onReadyChange={onPreFlightReady}
              />
            </div>

            {/* Checkbox & CTA */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: TOKENS.spacing[3],
              marginTop: TOKENS.spacing[3],
              paddingTop: TOKENS.spacing[3],
              borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
            }}>
              <fieldset id={idFieldsetTerms} className="m-0 border-0 p-0">
                <legend className="sr-only">Terms confirmation</legend>
                <label
                  htmlFor={idAgree}
                  style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[2], cursor: 'pointer' }}
                >
                  <input
                    id={idAgree}
                    name="terms"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => onAgreedChange(e.target.checked)}
                    style={{
                      width: TOKENS.spacing[5],
                      height: TOKENS.spacing[5],
                      accentColor: TOKENS.colors.accent,
                      cursor: 'pointer',
                    }}
                    aria-describedby={`${idAgree}-desc`}
                  />
                  <span
                    id={`${idAgree}-desc`}
                    style={{
                      fontSize: TOKENS.fontSizes.xs,
                      fontWeight: TOKENS.fontWeights.bold,
                      color: TOKENS.colors.textSecondary,
                    }}
                  >
                    I confirm the term sheet and minimum deposit.
                  </span>
                </label>
              </fieldset>
              
              <button
                type="button"
                disabled={!isReady || isDepositing}
                onClick={onDeposit}
                style={{
                  width: '100%',
                  padding: `${TOKENS.spacing[3]}px`,
                  background: isReady ? TOKENS.colors.accent : TOKENS.colors.bgTertiary,
                  color: isReady ? TOKENS.colors.black : TOKENS.colors.textGhost,
                  border: 'none',
                  borderRadius: TOKENS.radius.md,
                  fontSize: TOKENS.fontSizes.sm,
                  fontWeight: TOKENS.fontWeights.black,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                  cursor: isReady && !isDepositing ? 'pointer' : 'not-allowed',
                  transition: 'all var(--transition-fast)',
                  boxShadow: isReady ? `0 ${TOKENS.spacing[1]}px ${TOKENS.spacing[2]}px ${TOKENS.colors.accent}40` : 'none',
                  opacity: isDepositing ? 0.7 : 1,
                }}
                aria-label={isReady ? 'Confirm subscription' : 'Complete form to deploy'}
                aria-disabled={!isReady || isDepositing}
              >
                {isDepositing ? 'Confirming…' : isReady ? 'Deploy Capital' : 'Complete Review'}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

function CompactMetric({ label, value, accent, mode }: { label: string; value: string; accent?: boolean; mode: SmartFitMode }) {
  return (
    <div>
      <div
        style={{
          fontSize: TOKENS.fontSizes.micro,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          color: TOKENS.colors.textSecondary,
          textTransform: 'uppercase',
          marginBottom: TOKENS.spacing[1],
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: fitValue(mode, { normal: TOKENS.fontSizes.sm, tight: TOKENS.fontSizes.xs, limit: TOKENS.fontSizes.xs }),
          fontWeight: TOKENS.fontWeights.bold,
          color: accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
          letterSpacing: VALUE_LETTER_SPACING,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span
        style={{
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          color: TOKENS.colors.textSecondary,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: TOKENS.fontSizes.sm,
          fontWeight: TOKENS.fontWeights.bold,
          color: TOKENS.colors.textPrimary,
        }}
      >
        {value}
      </span>
    </div>
  )
}

function ProjectionLine({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${TOKENS.spacing[1]}px 0`,
        borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
      }}
    >
      <span
        style={{
          fontSize: TOKENS.fontSizes.xs,
          color: TOKENS.colors.textSecondary,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: TOKENS.fontSizes.md,
          fontWeight: TOKENS.fontWeights.black,
          color: highlight ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
          letterSpacing: VALUE_LETTER_SPACING,
        }}
      >
        {value}
      </span>
    </div>
  )
}


function getLockMonths(lockPeriod: string) {
  const value = Number.parseInt(lockPeriod, 10)
  if (!Number.isFinite(value) || value <= 0) return 12
  if (lockPeriod.toLowerCase().includes('year')) return value * 12
  if (lockPeriod.toLowerCase().includes('day')) return Math.max(1, Math.round(value / 30))
  return value
}

const VALUE_LETTER_SPACING = '-0.02em'

/* ─── KEY TERMS ─────────────────────────────────────────────────────────── */
function KeyTerms({ vault, lockMonths }: { vault: AvailableVault; lockMonths: number }) {
  const years = lockMonths / 12
  const lockLabel = lockMonths >= 12
    ? `${lockMonths} months (${years % 1 === 0 ? years : years.toFixed(1)} years)`
    : `${lockMonths} months`
  const targetPct = vault.target

  const rows: Array<[string, string]> = [
    ['Target APY', `${vault.apr}%`],
    ['Lock period', lockLabel],
    ['Minimum deposit', fmtUsd(vault.minDeposit)],
    ['Deposit token', vault.token || 'USDC'],
    ['Network', 'Base (Ethereum L2)'],
    ['Yield distribution', 'Daily'],
    ['Withdraw condition', `${targetPct} target or ${years % 1 === 0 ? years : years.toFixed(1)}-year maturity`],
    ['Custody', 'Audited — institutional'],
    ['Fees', vault.fees],
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Label id="key-terms-label" tone="scene" variant="text">
        Key terms
      </Label>
      <div style={{ marginTop: TOKENS.spacing[4], display: 'flex', flexDirection: 'column' }}>
        {rows.map(([label, value], i) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: `${TOKENS.spacing[3]} 0`,
              borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${TOKENS.colors.borderSubtle}`,
              gap: TOKENS.spacing[3],
              minWidth: 0,
            }}
          >
            <span style={{
              fontSize: TOKENS.fontSizes.xs,
              color: TOKENS.colors.textSecondary,
              flexShrink: 0,
            }}>
              {label}
            </span>
            <span
              style={{
                fontSize: TOKENS.fontSizes.sm,
                fontWeight: TOKENS.fontWeights.bold,
                color: TOKENS.colors.textPrimary,
                textAlign: 'right',
                letterSpacing: VALUE_LETTER_SPACING,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── STRATEGY POCKETS (donut) ──────────────────────────────────────────── */
function StrategyPockets() {
  const pockets = [
    { label: 'BTC Spot', percent: 70, color: CHART_PALETTE[0] },
    { label: 'Collateral Mining', percent: 30, color: CHART_PALETTE[1] || TOKENS.colors.textSecondary },
  ]
  const size = 160
  const stroke = 22
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  let cursor = 0
  const segments = pockets.map((p) => {
    const dash = (p.percent / 100) * circumference
    const seg = { dash, gap: circumference - dash, offset: -cursor, color: p.color }
    cursor += dash
    return seg
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Label id="strategy-pockets-label" tone="scene" variant="text">
        Strategy pockets
      </Label>
      <div style={{
        marginTop: TOKENS.spacing[4],
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: TOKENS.spacing[4],
      }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          style={{ width: size, height: size, transform: 'rotate(-90deg)', flexShrink: 0 }}
          aria-label={`Allocation: ${pockets.map(p => `${p.label} ${p.percent}%`).join(', ')}`}
        >
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={TOKENS.colors.bgTertiary} strokeWidth={stroke} />
          {segments.map((s, i) => (
            <circle
              key={i}
              cx={size/2}
              cy={size/2}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={s.offset}
            />
          ))}
        </svg>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: TOKENS.spacing[2],
          width: '100%',
          maxWidth: 280,
        }}>
          {pockets.map((p) => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[2] }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <span style={{ fontSize: TOKENS.fontSizes.xs, color: TOKENS.colors.textSecondary, flex: 1 }}>
                {p.label}
              </span>
              <span style={{
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.bold,
                color: TOKENS.colors.textPrimary,
                letterSpacing: VALUE_LETTER_SPACING,
              }}>
                {p.percent}%
              </span>
            </div>
          ))}
        </div>
        <p style={{
          fontSize: TOKENS.fontSizes.xs,
          color: TOKENS.colors.textSecondary,
          lineHeight: 1.5,
          margin: 0,
          marginTop: 'auto',
          textAlign: 'center',
        }}>
          These are the <strong style={{ color: TOKENS.colors.textPrimary }}>baseline weights</strong>. Automated controls continuously rebalance exposures and tilt toward defensive strategies during downturns.
        </p>
      </div>
    </div>
  )
}

/* ─── CAPITAL RECOVERY CALLOUT ──────────────────────────────────────────── */
function CapitalRecoveryCallout() {
  return (
    <div style={{
      padding: TOKENS.spacing[4],
      background: `${TOKENS.colors.accent}14`,
      border: `1px solid ${TOKENS.colors.accent}40`,
      borderRadius: TOKENS.radius.md,
      display: 'flex',
      flexDirection: 'column',
      gap: TOKENS.spacing[2],
    }}>
      <span style={{
        fontFamily: TOKENS.fonts.mono,
        fontSize: TOKENS.fontSizes.xs,
        fontWeight: TOKENS.fontWeights.bold,
        textTransform: 'uppercase',
        letterSpacing: TOKENS.letterSpacing.display,
        color: TOKENS.colors.accent,
      }}>
        Capital recovery mechanism
      </span>
      <p style={{
        margin: 0,
        fontSize: TOKENS.fontSizes.xs,
        color: TOKENS.colors.textSecondary,
        lineHeight: 1.6,
      }}>
        If the vault's principal is below the initial deposit at maturity, mining infrastructure continues to operate on behalf of the vault for up to two additional years, with output directed exclusively toward restoring the original capital base.
      </p>
    </div>
  )
}

/** Compact axis label: $1.2M / $680K / $500. Avoids label clipping at any amount. */
function fmtUsdAxis(n: number): string {
  if (!isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
  if (abs >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${Math.round(n)}`
}

/* ─── TIME TO TARGET · SCENARIO SIMULATION (multi-line chart) ───────────── */
function ScenarioSimulation({
  amount,
  totalYield,
  lockMonths,
  target,
  mode,
  compact = false,
}: {
  amount: number
  totalYield: number
  lockMonths: number
  target: string
  mode: SmartFitMode
  compact?: boolean
}) {
  const targetValue = amount + totalYield
  // Each scenario closes at a different month; same end value (target hit)
  const scenarios = [
    { id: 'bull', label: 'Bull', closesAt: Math.max(1, Math.round(lockMonths / 3)), color: CHART_PALETTE[0] },
    { id: 'sideways', label: 'Sideways', closesAt: Math.max(2, Math.round(lockMonths * 0.72)), color: TOKENS.colors.textSecondary },
    { id: 'bear', label: 'Bear', closesAt: lockMonths, color: CHART_PALETTE[2] || TOKENS.colors.warning || TOKENS.colors.danger },
  ]

  const width = compact ? 480 : 800
  const height = compact ? 220 : 280
  const padding = compact
    ? { top: 16, right: 12, bottom: 32, left: 56 }
    : { top: 24, right: 24, bottom: 40, left: 72 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const minVal = amount
  const maxVal = targetValue
  const xRatio = (m: number) => Math.min(1, m / lockMonths)
  const yRatio = (v: number) => (maxVal > minVal ? (v - minVal) / (maxVal - minVal) : 0)
  const xPos = (m: number) => padding.left + xRatio(m) * chartW
  const yPos = (v: number) => padding.top + chartH - yRatio(v) * chartH

  const buildPath = (closesAt: number) => {
    // Scenario goes from (0, amount) to (closesAt, targetValue), then flat at targetValue until lockMonths
    const pts: { x: number; y: number }[] = [
      { x: xPos(0), y: yPos(amount) },
      { x: xPos(closesAt), y: yPos(targetValue) },
      { x: xPos(lockMonths), y: yPos(targetValue) },
    ]
    return pts.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ')
  }

  const yTickValues = [0, 0.25, 0.5, 0.75, 1].map((r) => minVal + r * (maxVal - minVal))
  // Evenly-spaced X ticks anchored at M0 and M{lockMonths} for symmetry
  const xTickCount = lockMonths >= 24 ? 7 : lockMonths >= 12 ? 5 : 4
  const xTickMonths = Array.from({ length: xTickCount }, (_, i) =>
    Math.round((i / (xTickCount - 1)) * lockMonths),
  )

  const compactPad = `${TOKENS.spacing[3]} 0 0 0`
  const fullPad = fitValue(mode, { normal: TOKENS.spacing[6], tight: TOKENS.spacing[4], limit: TOKENS.spacing[3] })
  return (
    <div style={{
      marginTop: TOKENS.spacing[2],
      padding: compact ? compactPad : fullPad,
      borderTop: compact ? `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}` : 'none',
      background: compact ? 'transparent' : TOKENS.colors.black,
      border: compact ? undefined : `1px solid ${TOKENS.colors.borderSubtle}`,
      borderRadius: compact ? 0 : TOKENS.radius.lg,
      display: 'flex',
      flexDirection: 'column',
      gap: compact ? TOKENS.spacing[3] : TOKENS.spacing[4],
      minWidth: 0,
    }}>
      <div>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.micro,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          color: TOKENS.colors.textSecondary,
        }}>
          {compact ? 'Time to target · scenarios' : 'Time to target · scenario simulation'}
        </span>
        {!compact && (
          <p style={{
            margin: `${TOKENS.spacing[2]}px 0 0 0`,
            fontSize: TOKENS.fontSizes.xs,
            color: TOKENS.colors.textSecondary,
            lineHeight: 1.5,
          }}>
            Deposit of <strong style={{ color: TOKENS.colors.textPrimary }}>{fmtUsd(amount)}</strong>. The vault closes and your capital unlocks as soon as the cumulative target <strong style={{ color: TOKENS.colors.textPrimary }}>{target}</strong> is reached — same end value, only the time to get there changes.
          </p>
        )}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {yTickValues.map((v, i) => {
          const y = yPos(v)
          return (
            <g key={`y-${i}`}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={TOKENS.colors.borderSubtle} strokeWidth="0.5" strokeDasharray="3,4" />
              <text x={padding.left - 12} y={y + 4} textAnchor="end" fill={TOKENS.colors.textGhost} fontSize="11" fontFamily={TOKENS.fonts.mono}>
                {fmtUsdAxis(v)}
              </text>
            </g>
          )
        })}

        {/* Target horizontal line */}
        <line
          x1={padding.left}
          y1={yPos(targetValue)}
          x2={width - padding.right}
          y2={yPos(targetValue)}
          stroke={TOKENS.colors.accent}
          strokeWidth="1"
          strokeDasharray="2,4"
          opacity="0.5"
        />

        {scenarios.map((s) => (
          <g key={s.id}>
            {/* Vertical guide from target line down to x-axis baseline (subtle) */}
            <line
              x1={xPos(s.closesAt)}
              y1={yPos(targetValue)}
              x2={xPos(s.closesAt)}
              y2={padding.top + chartH}
              stroke={s.color}
              strokeWidth="1"
              strokeDasharray="2,3"
              opacity="0.25"
            />
            <path d={buildPath(s.closesAt)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={xPos(s.closesAt)} cy={yPos(targetValue)} r="5" fill={s.color} stroke={TOKENS.colors.black} strokeWidth="2" />
          </g>
        ))}

        {xTickMonths.map((m, i) => (
          <text
            key={`x-${i}`}
            x={xPos(m)}
            y={height - padding.bottom + 18}
            textAnchor="middle"
            fill={TOKENS.colors.textGhost}
            fontSize="11"
            fontFamily={TOKENS.fonts.mono}
          >
            M{m}
          </text>
        ))}
      </svg>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${scenarios.length}, minmax(0, 1fr))`,
        gap: compact ? TOKENS.spacing[2] : TOKENS.spacing[3],
      }}>
        {scenarios.map((s) => (
          <div key={s.id} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: TOKENS.spacing[1],
            minWidth: 0,
          }}>
            <span style={{
              width: compact ? 6 : 10,
              height: compact ? 6 : 10,
              borderRadius: '50%',
              background: s.color,
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: compact ? TOKENS.fontSizes.micro : TOKENS.fontSizes.xs,
              color: TOKENS.colors.textSecondary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {compact ? `${s.label} · M${s.closesAt}` : `${s.label} · closes at M${s.closesAt}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── DYNAMIC ALLOCATION CARDS (3 scenarios) ────────────────────────────── */
function DynamicAllocation() {
  const cards = [
    {
      tag: 'BULL',
      tagColor: CHART_PALETTE[0],
      title: 'Accelerate growth',
      description: 'Rising BTC + mining cashflow accelerate value. Full BTC exposure maintained.',
      btcSpot: 80,
    },
    {
      tag: 'SIDEWAYS',
      tagColor: TOKENS.colors.textSecondary,
      title: 'Baseline mix',
      description: 'Stable mining keeps generating yield while BTC trades flat. Default weights.',
      btcSpot: 70,
    },
    {
      tag: 'BEAR',
      tagColor: CHART_PALETTE[2] || TOKENS.colors.danger,
      title: 'Protect capital',
      description: 'Mining weight rises to cushion BTC drawdowns. Distribution prioritises preservation.',
      btcSpot: 40,
    },
  ]

  return (
    <div style={{
      paddingTop: TOKENS.spacing[4],
      borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
      display: 'flex',
      flexDirection: 'column',
      gap: TOKENS.spacing[4],
    }}>
      <div>
        <Label id="dyn-alloc-label" tone="scene" variant="text">
          Dynamic allocation · rebalancing by market condition
        </Label>
        <p style={{
          margin: `${TOKENS.spacing[2]} 0 0 0`,
          fontSize: TOKENS.fontSizes.xs,
          color: TOKENS.colors.textSecondary,
          lineHeight: 1.5,
        }}>
          Automated portfolio controls continuously rebalance exposures, tighten volatility thresholds, and shift capital toward more defensive strategies during downturns.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: TOKENS.spacing[4],
        alignItems: 'stretch',
      }}>
        {cards.map((c) => (
          <div
            key={c.tag}
            style={{
              padding: TOKENS.spacing[4],
              background: TOKENS.colors.bgTertiary,
              border: `1px solid ${TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radius.md,
              display: 'flex',
              flexDirection: 'column',
              gap: TOKENS.spacing[3],
              minWidth: 0,
            }}
          >
            <span
              style={{
                alignSelf: 'flex-start',
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.micro,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
                color: c.tagColor,
                padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[2]}`,
                background: `${c.tagColor}1A`,
                border: `1px solid ${c.tagColor}40`,
                borderRadius: TOKENS.radius.full,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: TOKENS.spacing[2],
                minWidth: 92,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.tagColor, flexShrink: 0 }} />
              {c.tag}
            </span>
            <h4 style={{
              margin: 0,
              fontSize: TOKENS.fontSizes.sm,
              fontWeight: TOKENS.fontWeights.bold,
              color: TOKENS.colors.textPrimary,
            }}>
              {c.title}
            </h4>
            <p style={{
              margin: 0,
              fontSize: TOKENS.fontSizes.xs,
              color: TOKENS.colors.textSecondary,
              lineHeight: 1.5,
              flex: 1,
            }}>
              {c.description}
            </p>
            <div style={{
              display: 'flex',
              height: 6,
              borderRadius: TOKENS.radius.full,
              overflow: 'hidden',
              background: TOKENS.colors.black,
            }}>
              <div style={{ width: `${c.btcSpot}%`, background: CHART_PALETTE[0] }} />
              <div style={{ width: `${100 - c.btcSpot}%`, background: CHART_PALETTE[1] || TOKENS.colors.textSecondary }} />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.micro,
              color: TOKENS.colors.textGhost,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
            }}>
              <span>BTC Spot {c.btcSpot}%</span>
              <span>Mining {100 - c.btcSpot}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
