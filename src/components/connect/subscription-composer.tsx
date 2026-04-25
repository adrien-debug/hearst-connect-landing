'use client'

import { Label } from '@/components/ui/label'
import { PreFlightCheck } from './pre-flight-check'
import { TOKENS, fmtUsd, fmtUsdCompact } from './constants'
import type { AvailableVault } from './data'
import { fitValue, type SmartFitMode } from './smart-fit'

type Props = {
  vault: AvailableVault
  mode: SmartFitMode
  isLimit: boolean
  isDemo?: boolean
  amount: string
  onAmountChange: (v: string) => void
  agreed: boolean
  onAgreedChange: (v: boolean) => void
  isValid: boolean
  isReady: boolean
  num: number
  monthlyYield: number
  dailyYield: number
  yearlyYield: number
  totalYield: number
  onApprove: () => void
  isApproving: boolean
  onDeposit: () => void
  isDepositing: boolean
}

export function SubscriptionComposer({
  vault,
  mode,
  isLimit,
  isDemo = false,
  amount,
  onAmountChange,
  agreed,
  onAgreedChange,
  isValid,
  isReady,
  num,
  monthlyYield,
  dailyYield,
  yearlyYield,
  totalYield,
  onApprove,
  isApproving,
  onDeposit,
  isDepositing,
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

          {/* Product Description Area */}
          <div style={{
            flex: 1,
            background: TOKENS.colors.black,
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
            borderRadius: TOKENS.radius.lg,
            padding: fitValue(mode, { normal: TOKENS.spacing[6], tight: TOKENS.spacing[4], limit: TOKENS.spacing[3] }),
            overflow: 'auto',
          }}>
            <Label id="product-desc-label" tone="scene" variant="text">
              Product Overview
            </Label>
            
            <div style={{ marginTop: TOKENS.spacing[4], color: TOKENS.colors.textSecondary, lineHeight: 1.6 }}>
              <p style={{ margin: `0 0 ${TOKENS.spacing[3]}px 0` }}>
                This vault deploys capital into {vault.strategy.toLowerCase()} strategies 
                with a {vault.lockPeriod} lock period. Designed for {vault.risk.toLowerCase()} risk appetite.
              </p>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: TOKENS.spacing[3],
                marginTop: TOKENS.spacing[4],
              }}>
                <InfoBlock 
                  title="Strategy" 
                  content={vault.strategy}
                />
                <InfoBlock 
                  title="Risk Level" 
                  content={vault.risk}
                />
                <InfoBlock 
                  title="Lock Period" 
                  content={vault.lockPeriod}
                />
                <InfoBlock 
                  title="Management Fee" 
                  content={vault.fees}
                />
              </div>

              <div style={{ 
                marginTop: TOKENS.spacing[4],
                padding: TOKENS.spacing[3],
                background: TOKENS.colors.bgTertiary,
                borderRadius: TOKENS.radius.md,
                fontSize: TOKENS.fontSizes.xs,
              }}>
                <strong style={{ color: TOKENS.colors.textPrimary }}>Important:</strong>{' '}
                <span style={{ color: TOKENS.colors.textSecondary }}>
                  Capital is locked for the duration. Early withdrawal is not available. 
                  Target yield is cumulative over the lock period.
                </span>
              </div>
            </div>
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

            <LiveSimulationCard
              amount={num}
              dailyYield={dailyYield}
              monthlyYield={monthlyYield}
              totalYield={totalYield}
              totalValue={num + totalYield}
              lockMonths={lockMonths}
            />

            {/* Pre-flight Check */}
            <div style={{ marginTop: TOKENS.spacing[2] }}>
              <PreFlightCheck 
                vault={vault} 
                depositAmount={amount}
                onApprove={onApprove}
                isApproving={isApproving}
              />
            </div>

            {/* Checkbox & CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[3], marginTop: TOKENS.spacing[2] }}>
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

function InfoBlock({ title, content }: { title: string; content: string }) {
  return (
    <div style={{
      padding: TOKENS.spacing[3],
      background: TOKENS.colors.bgTertiary,
      borderRadius: TOKENS.radius.md,
    }}>
      <div style={{
        fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.display,
        color: TOKENS.colors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: TOKENS.spacing[2],
      }}>
        {title}
      </div>
      <div style={{
        fontSize: TOKENS.fontSizes.sm,
        fontWeight: TOKENS.fontWeights.bold,
        color: TOKENS.colors.textPrimary,
      }}>
        {content}
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

function LiveSimulationCard({
  amount,
  dailyYield,
  monthlyYield,
  totalYield,
  totalValue,
  lockMonths,
}: {
  amount: number
  dailyYield: number
  monthlyYield: number
  totalYield: number
  totalValue: number
  lockMonths: number
}) {
  const checkpoints = [
    { label: 'Entry', months: 0, value: amount },
    { label: `${Math.max(1, Math.round(lockMonths / 3))}M`, months: Math.max(1, Math.round(lockMonths / 3)), value: amount + totalYield / 3 },
    { label: `${Math.max(1, Math.round((lockMonths * 2) / 3))}M`, months: Math.max(1, Math.round((lockMonths * 2) / 3)), value: amount + (totalYield * 2) / 3 },
    { label: 'Maturity', months: lockMonths, value: totalValue },
  ]

  return (
    <div
      style={{
        marginTop: TOKENS.spacing[2],
        padding: TOKENS.spacing[3],
        background: TOKENS.colors.bgTertiary,
        border: `${TOKENS.borders.thin} solid ${amount > 0 ? TOKENS.colors.accentSubtle : TOKENS.colors.borderSubtle}`,
        borderRadius: TOKENS.radius.md,
        display: 'flex',
        flexDirection: 'column',
        gap: TOKENS.spacing[3],
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: TOKENS.spacing[2],
        }}
      >
        <span
          style={{
            fontFamily: TOKENS.fonts.mono,
            fontSize: TOKENS.fontSizes.micro,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
            color: TOKENS.colors.textSecondary,
          }}
        >
          Live Simulation
        </span>
        <span
          style={{
            fontSize: TOKENS.fontSizes.micro,
            color: TOKENS.colors.textGhost,
            fontFamily: TOKENS.fonts.mono,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
          }}
        >
          {lockMonths}M Horizon
        </span>
      </div>

      {amount > 0 ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: TOKENS.spacing[2],
            }}
          >
            <SimulationMetric label="Daily" value={`+${fmtUsdCompact(dailyYield)}`} />
            <SimulationMetric label="Monthly" value={`+${fmtUsdCompact(monthlyYield)}`} accent />
            <SimulationMetric label="Maturity" value={fmtUsdCompact(totalValue)} />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: TOKENS.spacing[2],
            }}
          >
            {checkpoints.map((point, index) => (
              <div
                key={`${point.label}-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: TOKENS.spacing[2],
                  flex: index === checkpoints.length - 1 ? '0 0 auto' : 1,
                  minWidth: 0,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[1], minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: TOKENS.fonts.mono,
                      fontSize: TOKENS.fontSizes.micro,
                      fontWeight: TOKENS.fontWeights.bold,
                      letterSpacing: TOKENS.letterSpacing.display,
                      textTransform: 'uppercase',
                      color: index === checkpoints.length - 1 ? TOKENS.colors.accent : TOKENS.colors.textGhost,
                    }}
                  >
                    {point.label}
                  </span>
                  <span
                    style={{
                      fontSize: TOKENS.fontSizes.xs,
                      fontWeight: TOKENS.fontWeights.bold,
                      color: TOKENS.colors.textPrimary,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {fmtUsdCompact(point.value)}
                  </span>
                </div>
                {index < checkpoints.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: '1px',
                      background: TOKENS.colors.accentSubtle,
                      position: 'relative',
                      minWidth: TOKENS.spacing[4],
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '-1.5px',
                        right: 0,
                        width: '4px',
                        height: '4px',
                        borderRadius: TOKENS.radius.full,
                        background: TOKENS.colors.accent,
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: TOKENS.fontSizes.xs,
              color: TOKENS.colors.textSecondary,
              lineHeight: 1.5,
            }}
          >
            Estimated cumulative yield at maturity: <span style={{ color: TOKENS.colors.accent, fontWeight: TOKENS.fontWeights.bold }}>{fmtUsd(totalYield)}</span>
          </div>
        </>
      ) : (
        <div
          style={{
            fontSize: TOKENS.fontSizes.xs,
            color: TOKENS.colors.textGhost,
            lineHeight: 1.5,
          }}
        >
          Enter a deployment amount to generate the investment simulation before subscribing.
        </div>
      )}
    </div>
  )
}

function SimulationMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        padding: TOKENS.spacing[2],
        background: TOKENS.colors.black,
        borderRadius: TOKENS.radius.sm,
        border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
      }}
    >
      <div
        style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.micro,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          color: TOKENS.colors.textGhost,
          marginBottom: TOKENS.spacing[1],
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: TOKENS.fontSizes.sm,
          fontWeight: TOKENS.fontWeights.black,
          color: accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
          letterSpacing: VALUE_LETTER_SPACING,
        }}
      >
        {value}
      </div>
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
