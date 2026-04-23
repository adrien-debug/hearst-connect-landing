'use client'

import { Label } from '@/components/ui/label'
import { PreFlightCheck } from './pre-flight-check'
import { TOKENS, fmtUsd } from './constants'
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
}: Props) {
  const idAmount = 'subscribe-amount'
  const idAgree = 'subscribe-term-confirm'
  const idAmountHint = 'subscribe-amount-hint'
  const idAmountStatus = 'subscribe-amount-status'
  const idFieldsetTerms = 'subscribe-fieldset-terms'

  const showError = num > 0 && !isValid
  const showValidHint = isValid && num > 0

  return (
    <div
      className="flex flex-col flex-1"
      style={{
        gap: fitValue(mode, { normal: TOKENS.spacing[6], tight: TOKENS.spacing[4], limit: TOKENS.spacing[3] }),
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: isLimit ? '1fr' : '1fr 380px',
        gap: fitValue(mode, { normal: TOKENS.spacing[6], tight: TOKENS.spacing[4], limit: TOKENS.spacing[3] }),
        flex: 1,
        minHeight: 0,
      }}>
        {/* LEFT COLUMN: Product & Input */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: fitValue(mode, { normal: TOKENS.spacing[6], tight: TOKENS.spacing[4], limit: TOKENS.spacing[3] }),
          minHeight: 0,
        }}>
          {/* Product Header */}
          <div style={{
            background: TOKENS.colors.black,
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
            borderRadius: TOKENS.radius.lg,
            padding: fitValue(mode, { normal: TOKENS.spacing[6], tight: TOKENS.spacing[4], limit: TOKENS.spacing[3] }),
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[4] }}>
              {vault.image && (
                <img
                  src={vault.image}
                  alt={vault.name}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: TOKENS.radius.md,
                    objectFit: 'cover',
                  }}
                />
              )}
              <div>
                <Label id="sub-kicker" tone="scene" variant="text">
                  Subscription
                </Label>
                <h1
                  style={{
                    margin: `${TOKENS.spacing[2]}px 0 0 0`,
                    fontSize: fitValue(mode, { normal: TOKENS.fontSizes.xxl, tight: TOKENS.fontSizes.xl, limit: TOKENS.fontSizes.lg }),
                    fontWeight: TOKENS.fontWeights.black,
                    letterSpacing: TOKENS.letterSpacing.tight,
                    color: TOKENS.colors.textPrimary,
                    lineHeight: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  {vault.name}
                </h1>
                <div style={{
                  fontSize: TOKENS.fontSizes.sm,
                  color: TOKENS.colors.textSecondary,
                  marginTop: TOKENS.spacing[2],
                }}>
                  {vault.strategy}
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div style={{
            flex: 1,
            background: TOKENS.colors.black,
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
            borderRadius: TOKENS.radius.lg,
            padding: fitValue(mode, { normal: TOKENS.spacing[8], tight: TOKENS.spacing[6], limit: TOKENS.spacing[4] }),
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            <fieldset
              className="min-w-0 shrink-0 border-0 p-0"
              style={{ margin: 0 }}
            >
              <legend className="sr-only">Deployment amount in USDC</legend>
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
                  marginBottom: TOKENS.spacing[3],
                }}
              >
                Amount to deploy (USDC)
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  borderBottom: `2px solid ${isValid && num > 0 ? TOKENS.colors.accent : TOKENS.colors.borderSubtle}`,
                  paddingBottom: TOKENS.spacing[3],
                  transition: 'border-color 0.2s ease',
                }}
              >
                <span
                  style={{
                    fontSize: fitValue(mode, { normal: TOKENS.fontSizes.figure, tight: TOKENS.fontSizes.xxxl, limit: TOKENS.fontSizes.xxl }),
                    fontWeight: TOKENS.fontWeights.black,
                    color: num > 0 ? TOKENS.colors.textPrimary : TOKENS.colors.textGhost,
                    marginRight: TOKENS.spacing[2],
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
                    width: '100%',
                    minWidth: 0,
                    border: 0,
                    background: 'transparent',
                    fontWeight: TOKENS.fontWeights.black,
                    color: TOKENS.colors.textPrimary,
                    outline: 'none',
                    fontSize: fitValue(mode, { normal: TOKENS.fontSizes.figure, tight: TOKENS.fontSizes.xxxl, limit: TOKENS.fontSizes.xxl }),
                    fontFamily: TOKENS.fonts.sans,
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}
                />
                <span
                  style={{
                    fontWeight: TOKENS.fontWeights.bold,
                    color: TOKENS.colors.textGhost,
                    fontSize: fitValue(mode, { normal: TOKENS.fontSizes.xl, tight: TOKENS.fontSizes.lg, limit: TOKENS.fontSizes.md }),
                    marginLeft: TOKENS.spacing[3],
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
                  marginTop: TOKENS.spacing[3],
                  minHeight: '20px',
                  fontSize: TOKENS.fontSizes.xs,
                  fontWeight: TOKENS.fontWeights.bold,
                  color: showError ? TOKENS.colors.danger : showValidHint ? TOKENS.colors.accent : 'transparent',
                }}
              >
                {showError && <span>Minimum deposit: {fmtUsd(vault.minDeposit)}</span>}
                {showValidHint && !showError && <span>Deposit amount valid</span>}
              </div>
            </fieldset>
          </div>
        </div>

        {/* RIGHT COLUMN: Order Summary */}
        <div style={{
          background: TOKENS.colors.black,
          border: `1px solid ${TOKENS.colors.borderSubtle}`,
          borderRadius: TOKENS.radius.lg,
          padding: fitValue(mode, { normal: TOKENS.spacing[6], tight: TOKENS.spacing[4], limit: TOKENS.spacing[4] }),
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
            marginBottom: TOKENS.spacing[6],
          }}>
            Order Summary
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[4], flex: 1 }}>
            <SpecItem mode={mode} label="Unlock Timeline" value={vault.lockPeriod} />
            <SpecItem mode={mode} label="Risk Profile" value={vault.risk} />
            <SpecItem mode={mode} label="Management Fees" value={vault.fees} />
            
            <div style={{ height: 1, background: TOKENS.colors.borderSubtle, margin: `${TOKENS.spacing[2]}px 0` }} />
            
            <ProjectionLine mode={mode} label="Est. Annual Yield" value={num > 0 ? `+${fmtUsd(yearlyYield)}` : '—'} highlight />
            <ProjectionLine mode={mode} label="Target Yield" value={num > 0 ? `+${fmtUsd(totalYield)}` : '—'} highlight />
            
            <div style={{ height: 1, background: TOKENS.colors.borderSubtle, margin: `${TOKENS.spacing[2]}px 0`, flex: 1 }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: TOKENS.spacing[6] }}>
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
                fontSize: TOKENS.fontSizes.xl, 
                fontWeight: TOKENS.fontWeights.black,
                color: TOKENS.colors.textPrimary,
                letterSpacing: '-0.02em',
              }}>
                {num > 0 ? fmtUsd(num + totalYield) : '—'}
              </span>
            </div>

            {/* Pre-flight Check */}
            <PreFlightCheck 
              vault={vault} 
              depositAmount={amount}
              onApprove={onApprove}
              isApproving={isApproving}
            />

            {/* Checkbox & CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[4] }}>
              <fieldset id={idFieldsetTerms} className="m-0 border-0 p-0">
                <legend className="sr-only">Terms confirmation</legend>
                <label
                  htmlFor={idAgree}
                  style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[3], cursor: 'pointer' }}
                >
                  <input
                    id={idAgree}
                    name="terms"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => onAgreedChange(e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
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
                  padding: TOKENS.spacing[4],
                  background: isReady ? TOKENS.colors.accent : TOKENS.colors.bgTertiary,
                  color: isReady ? TOKENS.colors.black : TOKENS.colors.textGhost,
                  border: 'none',
                  borderRadius: TOKENS.radius.md,
                  fontSize: TOKENS.fontSizes.md,
                  fontWeight: TOKENS.fontWeights.black,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                  cursor: isReady && !isDepositing ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  boxShadow: isReady ? `0 4px 16px ${TOKENS.colors.accent}40` : 'none',
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

function SpecItem({ label, value, mode }: { label: string; value: string; mode: SmartFitMode }) {
  return (
    <div>
      <div
        style={{
          fontSize: TOKENS.fontSizes.micro,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          color: TOKENS.colors.textSecondary,
          marginBottom: TOKENS.spacing[2],
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: fitValue(mode, { normal: TOKENS.fontSizes.md, tight: TOKENS.fontSizes.sm, limit: TOKENS.fontSizes.sm }),
          fontWeight: 900,
          color: TOKENS.colors.textPrimary,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function ProjectionLine({ label, value, highlight, mode }: { label: string; value: string; highlight?: boolean; mode: SmartFitMode }) {
  return (
    <div
      className="flex items-baseline justify-between gap-4 border-b border-white/10 py-2"
    >
      <span
        style={{
          fontSize: fitValue(mode, { normal: TOKENS.fontSizes.sm, tight: TOKENS.fontSizes.sm, limit: TOKENS.fontSizes.micro }),
          color: TOKENS.colors.textSecondary,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: fitValue(mode, { normal: TOKENS.fontSizes.lg, tight: TOKENS.fontSizes.md, limit: TOKENS.fontSizes.sm }),
          fontWeight: 900,
          color: highlight ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
        }}
      >
        {value}
      </span>
    </div>
  )
}
