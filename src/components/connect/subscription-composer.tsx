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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: fitValue(mode, { normal: TOKENS.spacing[6], tight: TOKENS.spacing[4], limit: TOKENS.spacing[3] }),
        minHeight: 0,
        flex: 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: fitValue(mode, { normal: TOKENS.spacing[6], tight: TOKENS.spacing[4], limit: TOKENS.spacing[2] }), flexShrink: 0, flexWrap: isLimit ? 'wrap' : 'nowrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Label id="sub-kicker" tone="scene" variant="text">
            Subscription
          </Label>
          <h2
            style={{
              margin: 0,
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
        <div style={{ textAlign: 'right' }}>
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

      <div style={{ flexShrink: 0 }}>
        <label htmlFor={idAmount} style={{ display: 'block' }}>
        <div
          style={{ fontSize: TOKENS.fontSizes.xs, fontWeight: TOKENS.fontWeights.bold, letterSpacing: TOKENS.letterSpacing.display, textTransform: 'uppercase', color: TOKENS.colors.textSecondary, marginBottom: TOKENS.spacing[2] }}
        >
          Amount to deploy (USDC)
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            paddingBottom: TOKENS.spacing[3],
            borderBottom: `1px solid ${isValid ? TOKENS.colors.accent : TOKENS.colors.borderSubtle}`,
            transition: '120ms ease-out',
          }}
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
            aria-invalid={!isValid && num > 0}
            aria-describedby={num > 0 && !isValid ? `${idAmount}-error` : undefined}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: TOKENS.colors.textPrimary,
              fontSize: fitValue(mode, { normal: TOKENS.fontSizes.figure, tight: TOKENS.fontSizes.xxxl, limit: TOKENS.fontSizes.xl }),
              fontFamily: TOKENS.fonts.sans,
              width: '100%',
              fontWeight: TOKENS.fontWeights.black,
              letterSpacing: '-0.07em',
              lineHeight: 0.85,
            }}
          />
          <span
            style={{
              fontSize: fitValue(mode, { normal: TOKENS.fontSizes.lg, tight: TOKENS.fontSizes.md, limit: TOKENS.fontSizes.sm }),
              fontWeight: TOKENS.fontWeights.black,
              color: TOKENS.colors.textSecondary,
              opacity: 0.5,
            }}
            aria-hidden
          >
            USDC
          </span>
        </div>
        </label>
        <div style={{ marginTop: TOKENS.spacing[4], minHeight: 20 }}>
          {num > 0 && !isValid && (
            <div
              id={`${idAmount}-error`}
              style={{ fontSize: TOKENS.fontSizes.xs, color: TOKENS.colors.danger, fontWeight: TOKENS.fontWeights.bold }}
              role="status"
            >
              Minimum deposit: {fmtUsd(vault.minDeposit)}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isLimit ? '1fr' : 'repeat(3, minmax(0,1fr))',
          gap: fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[2] }),
          borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
          paddingTop: fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[2] }),
          flexShrink: 0,
        }}
      >
        <SpecItem mode={mode} label="Lock" value={vault.lockPeriod} />
        <SpecItem mode={mode} label="Risk" value={vault.risk} />
        <SpecItem mode={mode} label="Fees" value={vault.fees} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isLimit ? '1fr' : 'minmax(0,1fr) minmax(0,280px)',
          gap: fitValue(mode, { normal: TOKENS.spacing[6], tight: TOKENS.spacing[4], limit: TOKENS.spacing[3] }),
          alignItems: 'end',
          marginTop: 'auto',
          paddingTop: fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[2] }),
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: fitValue(mode, { normal: TOKENS.spacing[3], tight: TOKENS.spacing[2], limit: TOKENS.spacing[2] }) }}>
          <ProjectionLine mode={mode} label="Est. annual yield" value={num > 0 ? `+ ${fmtUsd(yearlyYield)}` : '—'} highlight />
          <ProjectionLine
            mode={mode}
            label="Projected yield at target"
            value={num > 0 ? `+ ${fmtUsd(totalYield)}` : '—'}
            highlight
          />
          {!isLimit && (
            <p style={{ fontSize: TOKENS.fontSizes.sm, color: TOKENS.colors.textSecondary, lineHeight: 1.5, maxWidth: 520, margin: 0 }}>
              Capital remains allocated until the term or target is met. Review the term sheet before confirming.
            </p>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: fitValue(mode, { normal: TOKENS.spacing[3], tight: TOKENS.spacing[2], limit: TOKENS.spacing[2] }),
            width: '100%',
          }}
        >
          <div style={{ fontSize: 0 }}>{/* a11y: associate label */}</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: TOKENS.spacing[3],
              cursor: 'pointer',
            }}
          >
            <input
              id={idAgree}
              name="terms"
              type="checkbox"
              checked={agreed}
              onChange={(e) => onAgreedChange(e.target.checked)}
              style={{ width: 20, height: 20, flexShrink: 0, accentColor: TOKENS.colors.accent }}
              aria-describedby={`${idAgree}-desc`}
            />
            <span
              id={`${idAgree}-desc`}
              style={{ fontSize: TOKENS.fontSizes.sm, fontWeight: TOKENS.fontWeights.bold, color: TOKENS.colors.textSecondary }}
            >
              I confirm the term sheet and minimum deposit.
            </span>
          </div>
          <button
            type="button"
            disabled={!isReady}
            style={{
              width: '100%',
              padding: `${fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[3] })} ${fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[2] })}`,
              background: isReady ? TOKENS.colors.textPrimary : TOKENS.colors.borderSubtle,
              color: isReady ? TOKENS.colors.black : TOKENS.colors.textGhost,
              border: 'none',
              fontSize: fitValue(mode, { normal: TOKENS.fontSizes.md, tight: TOKENS.fontSizes.sm, limit: TOKENS.fontSizes.sm }),
              fontWeight: TOKENS.fontWeights.black,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              cursor: isReady ? 'pointer' : 'not-allowed',
            }}
            aria-label={isReady ? 'Confirm subscription' : 'Complete form to deploy'}
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
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: TOKENS.spacing[4],
        padding: `${TOKENS.spacing[2]} 0`,
        borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
      }}
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
