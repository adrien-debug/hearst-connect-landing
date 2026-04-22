'use client'

import { Label } from '@/components/ui/label'
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
      className="flex min-h-0 flex-1 flex-col"
      style={{
        gap: fitValue(mode, { normal: TOKENS.spacing[6], tight: TOKENS.spacing[4], limit: TOKENS.spacing[3] }),
      }}
    >
      <div
        className="flex shrink-0 flex-wrap items-end justify-between"
        style={{ gap: fitValue(mode, { normal: TOKENS.spacing[6], tight: TOKENS.spacing[4], limit: TOKENS.spacing[2] }) }}
      >
        <div className="min-w-0 flex-1">
          <Label id="sub-kicker" tone="scene" variant="text">
            Subscription
          </Label>
          <h2
            className="m-0"
            style={{
              fontSize: fitValue(mode, { normal: TOKENS.fontSizes.xl, tight: TOKENS.fontSizes.lg, limit: TOKENS.fontSizes.md }),
              fontWeight: TOKENS.fontWeights.black,
              letterSpacing: TOKENS.letterSpacing.tight,
              color: TOKENS.colors.textPrimary,
              lineHeight: 0.95,
            }}
          >
            {vault.name}
          </h2>
        </div>
        <div className="text-right" role="group" aria-label="Target annual yield">
          <div
            style={{
              fontSize: fitValue(mode, { normal: TOKENS.fontSizes.xl, tight: TOKENS.fontSizes.lg, limit: TOKENS.fontSizes.md }),
              fontWeight: TOKENS.fontWeights.black,
              color: TOKENS.colors.textPrimary,
              lineHeight: 1,
            }}
            aria-label={`Target yield ${vault.apr} percent per year`}
          >
            {vault.apr}%
          </div>
          <div
            style={{
              fontSize: TOKENS.fontSizes.xs,
              fontWeight: TOKENS.fontWeights.bold,
              color: TOKENS.colors.textSecondary,
              letterSpacing: TOKENS.letterSpacing.display,
              marginTop: TOKENS.spacing[2],
              textTransform: 'uppercase',
            }}
          >
            APY
          </div>
        </div>
      </div>

      <fieldset
        className="min-w-0 shrink-0 border-0 p-0"
        style={{ margin: 0 }}
      >
        <legend className="sr-only">Deployment amount in USDC</legend>
        <label
          htmlFor={idAmount}
          id={idAmountHint}
          className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.2em] text-white/55"
        >
          Amount to deploy (USDC)
        </label>
        <div
          className="flex items-baseline border-b border-white/10 pb-3 transition-colors"
          style={{ borderBottomColor: isValid && num > 0 ? TOKENS.colors.accent : undefined }}
        >
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
            className="w-full min-w-0 border-0 bg-transparent font-bold text-white/90 outline-none"
            style={{
              fontSize: fitValue(mode, { normal: TOKENS.fontSizes.figure, tight: TOKENS.fontSizes.xxxl, limit: TOKENS.fontSizes.xl }),
              fontFamily: TOKENS.fonts.sans,
              letterSpacing: '-0.07em',
              lineHeight: 0.85,
            }}
          />
          <span
            className="font-bold text-white/50"
            style={{
              fontSize: fitValue(mode, { normal: TOKENS.fontSizes.lg, tight: TOKENS.fontSizes.md, limit: TOKENS.fontSizes.sm }),
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
          className="mt-4 min-h-[20px] text-xs font-bold"
          style={{ color: showError ? TOKENS.colors.danger : showValidHint ? TOKENS.colors.accent : 'transparent' }}
        >
          {showError && <span>Minimum deposit: {fmtUsd(vault.minDeposit)}</span>}
          {showValidHint && !showError && <span>Deposit amount valid</span>}
        </div>
      </fieldset>

      <div
        className="grid shrink-0 border-0 border-t border-white/10 pt-4"
        style={{
          gridTemplateColumns: isLimit ? '1fr' : 'repeat(3, minmax(0,1fr))',
          gap: fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[2] }),
        }}
      >
        <SpecItem mode={mode} label="Lock" value={vault.lockPeriod} />
        <SpecItem mode={mode} label="Risk" value={vault.risk} />
        <SpecItem mode={mode} label="Fees" value={vault.fees} />
      </div>

      <div
        className="mt-auto grid items-end"
        style={{
          gridTemplateColumns: isLimit ? '1fr' : 'minmax(0,1fr) minmax(0,280px)',
          gap: fitValue(mode, { normal: TOKENS.spacing[6], tight: TOKENS.spacing[4], limit: TOKENS.spacing[3] }),
          paddingTop: fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[2] }),
        }}
      >
        <div
          className="flex flex-col"
          style={{ gap: fitValue(mode, { normal: TOKENS.spacing[3], tight: TOKENS.spacing[2], limit: TOKENS.spacing[2] }) }}
        >
          <ProjectionLine mode={mode} label="Est. annual yield" value={num > 0 ? `+ ${fmtUsd(yearlyYield)}` : '—'} highlight />
          <ProjectionLine
            mode={mode}
            label="Projected yield at target"
            value={num > 0 ? `+ ${fmtUsd(totalYield)}` : '—'}
            highlight
          />
          {!isLimit && (
            <p className="m-0 max-w-[520px] text-sm leading-normal text-white/55">
              Capital remains allocated until the term or target is met. Review the term sheet before confirming.
            </p>
          )}
        </div>

        <div
          className="flex w-full flex-col"
          style={{ gap: fitValue(mode, { normal: TOKENS.spacing[3], tight: TOKENS.spacing[2], limit: TOKENS.spacing[2] }) }}
        >
          <fieldset id={idFieldsetTerms} className="m-0 border-0 p-0">
            <legend className="sr-only">Terms confirmation</legend>
            <label
              htmlFor={idAgree}
              className="flex cursor-pointer items-center gap-3"
            >
              <input
                id={idAgree}
                name="terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => onAgreedChange(e.target.checked)}
                className="h-5 w-5 shrink-0"
                style={{ accentColor: TOKENS.colors.accent }}
                aria-describedby={`${idAgree}-desc`}
              />
              <span
                id={`${idAgree}-desc`}
                className="text-sm font-bold text-white/55"
              >
                I confirm the term sheet and minimum deposit.
              </span>
            </label>
          </fieldset>
          <button
            type="button"
            disabled={!isReady}
            className="w-full font-black uppercase"
            style={{
              padding: `${fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[3] })} ${fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[2] })}`,
              background: isReady ? TOKENS.colors.textPrimary : 'rgba(255,255,255,0.08)',
              color: isReady ? TOKENS.colors.black : TOKENS.colors.textGhost,
              border: 'none',
              fontSize: fitValue(mode, { normal: TOKENS.fontSizes.md, tight: TOKENS.fontSizes.sm, limit: TOKENS.fontSizes.sm }),
              fontWeight: TOKENS.fontWeights.black,
              letterSpacing: TOKENS.letterSpacing.display,
              cursor: isReady ? 'pointer' : 'not-allowed',
            }}
            aria-label={isReady ? 'Confirm subscription' : 'Complete form to deploy'}
            aria-disabled={!isReady}
          >
            {isReady ? 'Deploy capital' : 'Complete review'}
          </button>
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
