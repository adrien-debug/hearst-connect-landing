'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { PreFlightCheck } from './pre-flight-check'
import { TOKENS, fmtUsd, fmtUsdCompact, VALUE_LETTER_SPACING } from './constants'
import type { AvailableVault } from './data'
import type { VaultConfig } from '@/types/vault'
import { fitValue, type SmartFitMode } from './smart-fit'

/** Layout constants — single source of truth for component-local magic values. */
const LAYOUT = {
  /** Order Summary panel min-width inside the 2-column grid. */
  rightColMinWidth: '320px',
  /** Order Summary panel preferred width as % of available row. */
  rightColPreferred: '38%',
  /** Empty-state message max width. */
  emptyMessageMaxWidth: '32ch',
  /** Total-Value highlight strip width. */
  highlightStripWidth: '3px',
} as const

/** Chart geometry — scenario simulation. */
const CHART = {
  compact: { width: 480, height: 220, padTop: 16, padRight: 12, padBottom: 32, padLeft: 56 },
  full:    { width: 800, height: 280, padTop: 24, padRight: 24, padBottom: 40, padLeft: 72 },
  /** Bull scenario closes at lockMonths / BULL_FRACTION_DENOM. */
  bullFractionDenom: 3,
  /** Sideways scenario closes at lockMonths × SIDEWAYS_FRACTION. */
  sidewaysFraction: 0.72,
  /** Floor to keep scenarios visible on very short locks. */
  bullMinMonths: 1,
  sidewaysMinMonths: 2,
  yTickCount: 5,
  /** Tick density thresholds. */
  xTickCountLong: 7,
  xTickCountMid: 5,
  xTickCountShort: 4,
  /** Label/dash styling. */
  axisFontSize: '11',
  axisLabelOffset: 12,
  axisLabelDy: 4,
  xLabelOffset: 18,
  scenarioStrokeWidth: '2.5',
  scenarioMarkerRadius: '5',
  scenarioMarkerStroke: '2',
  guideStrokeWidth: '1',
  guideOpacity: 0.25,
  targetLineOpacity: 0.5,
  gridStrokeWidth: '0.5',
  gridDash: '3,4',
  guideDash: '2,3',
  targetDash: '2,4',
} as const

/** Amount preset multipliers (relative to vault min deposit). */
const AMOUNT_PRESET_MULTIPLIERS = [1, 2, 10, 20] as const

/** Vault detail tabs — progressive disclosure of secondary content. */
type VaultTab = 'strategy' | 'terms'
const VAULT_TABS: ReadonlyArray<{ id: VaultTab; label: string }> = [
  { id: 'strategy', label: 'Strategy' },
  { id: 'terms', label: 'Terms' },
]

type Props = {
  vault: AvailableVault
  vaultConfig: VaultConfig | null
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
  vaultConfig,
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
      className="flex flex-col flex-1 min-h-0"
      style={{
        gap: fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[2] }),
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: isLimit ? '1fr' : `1fr minmax(${LAYOUT.rightColMinWidth}, ${LAYOUT.rightColPreferred})`,
        gap: fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[2] }),
        flex: 1,
        minHeight: 0,
      }}>
        {/* LEFT COLUMN: hero + tabs */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: fitValue(mode, { normal: TOKENS.spacing[5], tight: TOKENS.spacing[4], limit: TOKENS.spacing[3] }),
          minHeight: 0,
        }}>
          <VaultHero vault={vault} mode={mode} onBack={onBack} />

          <VaultTabs
            vault={vault}
            vaultConfig={vaultConfig}
            mode={mode}
          />
        </div>

        {/* RIGHT COLUMN: Order Summary — fits viewport, internal scroll if needed. */}
        <div style={{
          background: TOKENS.colors.black,
          border: `1px solid ${TOKENS.colors.borderSubtle}`,
          borderRadius: TOKENS.radius.lg,
          padding: fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[3] }),
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'auto',
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
                height: TOKENS.control.heightLg,
                boxShadow: isValid && num > 0 ? `0 0 0 1px var(--hc-accent-glow)` : 'none',
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

            {/* Amount presets — quick allocation choices */}
            <AmountPresets
              minDeposit={vault.minDeposit}
              currentAmount={num}
              onSelect={(v) => onAmountChange(String(v))}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[3], flex: 1 }}>
            {num > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <ProjectionLine label="Est. annual yield" value={`+${fmtUsd(yearlyYield)}`} highlight />
                <ProjectionLine label="Target yield" value={`+${fmtUsd(totalYield)}`} highlight />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  paddingTop: TOKENS.spacing[3],
                  marginTop: TOKENS.spacing[1],
                  borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
                }}>
                  <span style={{
                    fontFamily: TOKENS.fonts.mono,
                    fontSize: TOKENS.fontSizes.micro,
                    fontWeight: TOKENS.fontWeights.bold,
                    letterSpacing: TOKENS.letterSpacing.display,
                    textTransform: 'uppercase',
                    color: TOKENS.colors.textSecondary,
                  }}>
                    Total at maturity
                  </span>
                  <span style={{
                    fontSize: TOKENS.fontSizes.xl,
                    fontWeight: TOKENS.fontWeights.black,
                    color: TOKENS.colors.accent,
                    letterSpacing: VALUE_LETTER_SPACING,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {fmtUsd(num + totalYield)}
                  </span>
                </div>
              </div>
            )}

            {/* Pre-flight Check — collapsible */}
            <CollapsiblePreFlight
              vault={vault}
              depositAmount={amount}
              onApprove={onApprove}
              isApproving={isApproving}
              onPreFlightReady={onPreFlightReady}
            />

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
                  height: TOKENS.control.heightXl,
                  padding: `0 ${TOKENS.spacing[5]}`,
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
                  opacity: isDepositing ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: TOKENS.spacing[2],
                }}
                aria-label={isReady ? `Deploy ${fmtUsd(num)}` : 'Complete form to deploy'}
                aria-disabled={!isReady || isDepositing}
              >
                {isDepositing
                  ? 'Confirming…'
                  : isReady
                    ? <>Deploy capital · <span style={{ letterSpacing: VALUE_LETTER_SPACING }}>{fmtUsd(num)}</span></>
                    : num > 0
                      ? 'Complete Review'
                      : 'Enter amount to continue'}
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
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.micro,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          color: TOKENS.colors.textGhost,
          textTransform: 'uppercase',
          marginBottom: TOKENS.spacing[2],
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: fitValue(mode, { normal: TOKENS.fontSizes.xl, tight: TOKENS.fontSizes.lg, limit: TOKENS.fontSizes.md }),
          fontWeight: TOKENS.fontWeights.black,
          color: accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
          letterSpacing: VALUE_LETTER_SPACING,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
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

/* ─── VAULT HERO ────────────────────────────────────────────────────────── */
function VaultHero({
  vault,
  mode,
  onBack,
}: {
  vault: AvailableVault
  mode: SmartFitMode
  onBack?: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[5] }}>
      {onBack && (
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
            alignSelf: 'flex-start',
          }}
        >
          ← Back to vaults
        </button>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[3] }}>
        <h1
          style={{
            margin: 0,
            fontSize: fitValue(mode, { normal: 'var(--dashboard-text-display)', tight: TOKENS.fontSizes.xxl, limit: TOKENS.fontSizes.xl }),
            fontWeight: TOKENS.fontWeights.black,
            letterSpacing: TOKENS.letterSpacing.tight,
            color: TOKENS.colors.textPrimary,
            lineHeight: 1.05,
          }}
        >
          {vault.name}
        </h1>
        {vault.strategy && (
          <p style={{
            margin: 0,
            fontSize: TOKENS.fontSizes.md,
            color: TOKENS.colors.textSecondary,
            fontWeight: TOKENS.fontWeights.medium,
            lineHeight: 1.5,
            maxWidth: '52ch',
          }}>
            {vault.strategy}
          </p>
        )}
      </div>

      {/* KPI strip — Target (accent) · APY · Lock · Min · Risk */}
      <div style={{
        display: 'flex',
        gap: TOKENS.spacing[8],
        rowGap: TOKENS.spacing[4],
        flexWrap: 'wrap',
        alignItems: 'baseline',
      }}>
        <CompactMetric label="Target" value={vault.target} mode={mode} accent />
        <CompactMetric label="APY" value={`${vault.apr}%`} mode={mode} />
        <CompactMetric label="Lock" value={vault.lockPeriod} mode={mode} />
        <CompactMetric label="Min Entry" value={fmtUsd(vault.minDeposit)} mode={mode} />
        <CompactMetric label="Risk" value={vault.risk} mode={mode} />
      </div>
    </div>
  )
}

/* ─── VAULT TABS — progressive disclosure ───────────────────────────────── */
function VaultTabs({
  vault,
  lockMonths,
  mode,
}: {
  vault: AvailableVault
  lockMonths: number
  mode: SmartFitMode
}) {
  const [activeTab, setActiveTab] = useState<VaultTab>('overview')

  return (
    <div style={{
      flex: 1,
      background: TOKENS.colors.black,
      border: `1px solid ${TOKENS.colors.borderSubtle}`,
      borderRadius: TOKENS.radius.lg,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      overflow: 'hidden',
    }}>
      {/* Tab nav */}
      <div
        role="tablist"
        aria-label="Vault details"
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
          padding: `0 ${TOKENS.spacing[4]}`,
        }}
      >
        {VAULT_TABS.map((tab) => {
          const active = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`vault-tab-panel-${tab.id}`}
              id={`vault-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: `${TOKENS.spacing[4]} ${TOKENS.spacing[5]}`,
                margin: 0,
                cursor: 'pointer',
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
                color: active ? TOKENS.colors.textPrimary : TOKENS.colors.textGhost,
                position: 'relative',
                transition: 'color var(--transition-fast)',
              }}
            >
              {tab.label}
              {active && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: -1,
                    height: '2px',
                    background: TOKENS.colors.accent,
                  }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab panel */}
      <div
        role="tabpanel"
        id={`vault-tab-panel-${activeTab}`}
        aria-labelledby={`vault-tab-${activeTab}`}
        style={{
          padding: fitValue(mode, { normal: TOKENS.spacing[6], tight: TOKENS.spacing[4], limit: TOKENS.spacing[3] }),
          overflow: 'auto',
          flex: 1,
          minHeight: 0,
        }}
      >
        {activeTab === 'overview' && <OverviewPanel vault={vault} onSeeStrategy={() => setActiveTab('strategy')} onSeeTerms={() => setActiveTab('terms')} />}
        {activeTab === 'strategy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[6] }}>
            <StrategyPockets />
            <DynamicAllocation />
            <CapitalRecoveryCallout />
          </div>
        )}
        {activeTab === 'terms' && <KeyTerms vault={vault} lockMonths={lockMonths} />}
      </div>
    </div>
  )
}

/* ─── OVERVIEW PANEL — 3 pillars + capital recovery pill ────────────────── */
function OverviewPanel({
  vault,
  onSeeStrategy,
  onSeeTerms,
}: {
  vault: AvailableVault
  onSeeStrategy: () => void
  onSeeTerms: () => void
}) {
  void vault
  const pillars = [
    {
      label: 'Daily distributions',
      detail: 'Yield streams to your wallet daily in USDC.',
      tab: 'terms' as const,
    },
    {
      label: 'Target-based unlock',
      detail: 'Capital unlocks once cumulative target hits — same end value, earlier finish in bull markets.',
      tab: 'strategy' as const,
    },
    {
      label: 'Capital recovery',
      detail: 'If principal sits below initial deposit at maturity, mining keeps running for up to 2 extra years to restore it.',
      tab: 'strategy' as const,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[10] }}>
      {/* Pillars — flat list, no cards */}
      <section
        aria-labelledby="overview-pillars-label"
        style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[4] }}
      >
        <Label id="overview-pillars-label" tone="scene" variant="text">
          Why this vault
        </Label>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' }}>
          {pillars.map((p, i) => (
            <li
              key={p.label}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(180px, 1fr) 3fr',
                gap: TOKENS.spacing[6],
                alignItems: 'baseline',
                padding: `${TOKENS.spacing[4]} 0`,
                borderBottom: i === pillars.length - 1 ? 'none' : `1px solid ${TOKENS.colors.borderSubtle}`,
              }}
            >
              <button
                type="button"
                onClick={p.tab === 'strategy' ? onSeeStrategy : onSeeTerms}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: TOKENS.fontSizes.md,
                  fontWeight: TOKENS.fontWeights.bold,
                  color: TOKENS.colors.textPrimary,
                  fontFamily: 'inherit',
                  lineHeight: 1.3,
                }}
              >
                {p.label}
              </button>
              <span
                style={{
                  fontSize: TOKENS.fontSizes.sm,
                  color: TOKENS.colors.textSecondary,
                  lineHeight: 1.6,
                }}
              >
                {p.detail}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Trust signals — inline text, dot-separated */}
      <section
        aria-labelledby="overview-trust-label"
        style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[3] }}
      >
        <Label id="overview-trust-label" tone="scene" variant="text">
          Trust signals
        </Label>
        <p style={{
          margin: 0,
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          color: TOKENS.colors.textSecondary,
          lineHeight: 1.8,
        }}>
          Audited <span style={{ color: TOKENS.colors.accent }}>·</span>{' '}
          Onchain proof <span style={{ color: TOKENS.colors.accent }}>·</span>{' '}
          Institutional custody <span style={{ color: TOKENS.colors.accent }}>·</span>{' '}
          Base L2
        </p>
      </section>

      <HowItWorks />

      <AtAGlance />
    </div>
  )
}

/* ─── HOW IT WORKS — flat numbered list, no cards ────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: '01', title: 'Deposit', body: 'Allocate USDC into the vault contract on Base.' },
    { n: '02', title: 'Operate', body: 'Industrial mining infrastructure runs against the deposited capital.' },
    { n: '03', title: 'Distribute', body: 'Yield streams to your wallet daily, denominated in USDC.' },
    { n: '04', title: 'Unlock', body: 'Capital unlocks once cumulative target is reached, or at maturity.' },
  ]

  return (
    <section
      aria-labelledby="how-it-works-label"
      style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[4] }}
    >
      <Label id="how-it-works-label" tone="scene" variant="text">
        How it works
      </Label>
      <ol
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {steps.map((s, i) => (
          <li
            key={s.n}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto minmax(140px, 1fr) 3fr',
              gap: TOKENS.spacing[5],
              alignItems: 'baseline',
              padding: `${TOKENS.spacing[3]} 0`,
              borderBottom: i === steps.length - 1 ? 'none' : `1px solid ${TOKENS.colors.borderSubtle}`,
            }}
          >
            <span
              style={{
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                color: TOKENS.colors.accent,
              }}
              aria-hidden
            >
              {s.n}
            </span>
            <span
              style={{
                fontSize: TOKENS.fontSizes.md,
                fontWeight: TOKENS.fontWeights.bold,
                color: TOKENS.colors.textPrimary,
                lineHeight: 1.3,
              }}
            >
              {s.title}
            </span>
            <span
              style={{
                fontSize: TOKENS.fontSizes.sm,
                color: TOKENS.colors.textSecondary,
                lineHeight: 1.6,
              }}
            >
              {s.body}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

/* ─── AT A GLANCE — flat label/value pairs ──────────────────────────────── */
function AtAGlance() {
  const stats = [
    { label: 'Distribution', value: 'Daily' },
    { label: 'Token', value: 'USDC' },
    { label: 'Network', value: 'Base L2' },
    { label: 'Custody', value: 'Institutional' },
  ]

  return (
    <section
      aria-labelledby="at-a-glance-label"
      style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[4] }}
    >
      <Label id="at-a-glance-label" tone="scene" variant="text">
        At a glance
      </Label>
      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          rowGap: TOKENS.spacing[4],
          columnGap: TOKENS.spacing[6],
          margin: 0,
          padding: 0,
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: TOKENS.spacing[2],
            }}
          >
            <dt
              style={{
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.micro,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
                color: TOKENS.colors.textGhost,
                margin: 0,
              }}
            >
              {s.label}
            </dt>
            <dd
              style={{
                fontSize: TOKENS.fontSizes.md,
                fontWeight: TOKENS.fontWeights.bold,
                color: TOKENS.colors.textPrimary,
                margin: 0,
                letterSpacing: VALUE_LETTER_SPACING,
              }}
            >
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* ─── KEY TERMS ─────────────────────────────────────────────────────────── */
function KeyTerms({ vault, lockMonths }: { vault: AvailableVault; lockMonths: number }) {
  const years = lockMonths / 12
  const targetPct = vault.target

  // Trimmed: Target APY, Lock period, Minimum deposit are already in the hero KPI row.
  const rows: Array<[string, string]> = [
    ['Yield distribution', 'Daily'],
    ['Withdraw condition', `${targetPct} target or ${years % 1 === 0 ? years : years.toFixed(1)}-year maturity`],
    ['Custody', 'Audited — institutional'],
    ['Network', 'Base (Ethereum L2)'],
    ['Deposit token', vault.token || 'USDC'],
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
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <svg
            viewBox={`0 0 ${size} ${size}`}
            style={{ width: size, height: size, transform: 'rotate(-90deg)' }}
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
          {/* Center label */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            gap: TOKENS.spacing[1],
          }}>
            <span style={{
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              color: TOKENS.colors.textGhost,
            }}>
              Baseline
            </span>
            <span style={{
              fontSize: TOKENS.fontSizes.xl,
              fontWeight: TOKENS.fontWeights.black,
              color: TOKENS.colors.textPrimary,
              letterSpacing: TOKENS.letterSpacing.tight,
              lineHeight: 1,
            }}>
              {pockets[0].percent}/{pockets[1].percent}
            </span>
          </div>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: TOKENS.spacing[2],
          width: '100%',
          maxWidth: 280,
        }}>
          {pockets.map((p) => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[2] }}>
              <span style={{ width: TOKENS.dot.md, height: TOKENS.dot.md, borderRadius: TOKENS.radius.full, background: p.color, flexShrink: 0 }} />
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
      </div>
    </div>
  )
}

/* ─── AMOUNT PRESETS ────────────────────────────────────────────────────── */
function AmountPresets({
  minDeposit,
  currentAmount,
  onSelect,
}: {
  minDeposit: number
  currentAmount: number
  onSelect: (v: number) => void
}) {
  // Presets: minDeposit × multipliers — adapts to vault tier.
  const raw = AMOUNT_PRESET_MULTIPLIERS.map((m) => minDeposit * m)
  const presets = Array.from(new Set(raw)).filter((n) => n >= minDeposit).slice(0, AMOUNT_PRESET_MULTIPLIERS.length)
  return (
    <div style={{
      display: 'flex',
      gap: TOKENS.spacing[2],
      marginTop: TOKENS.spacing[3],
      flexWrap: 'wrap',
    }}>
      {presets.map((value) => {
        const active = Math.round(currentAmount) === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            style={{
              flex: '1 1 auto',
              minWidth: 0,
              padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
              background: active ? 'var(--hc-accent-dim)' : TOKENS.colors.bgTertiary,
              border: `1px solid ${active ? TOKENS.colors.accent : TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radius.full,
              color: active ? TOKENS.colors.accent : TOKENS.colors.textSecondary,
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.xs,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            aria-pressed={active}
          >
            {fmtUsdAxis(value)}
          </button>
        )
      })}
    </div>
  )
}

/* ─── COLLAPSIBLE PRE-FLIGHT ────────────────────────────────────────────── */
function CollapsiblePreFlight({
  vault,
  depositAmount,
  onApprove,
  isApproving,
  onPreFlightReady,
}: {
  vault: AvailableVault
  depositAmount: string
  onApprove: () => void
  isApproving: boolean
  onPreFlightReady?: (ready: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)

  const handleReadyChange = (r: boolean) => {
    setReady(r)
    onPreFlightReady?.(r)
  }

  // Auto-open when there's an issue (so user sees what to fix).
  useEffect(() => {
    if (!ready) setOpen(true)
  }, [ready])

  return (
    <div style={{
      marginTop: TOKENS.spacing[3],
      paddingTop: TOKENS.spacing[3],
      borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
    }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: TOKENS.spacing[3],
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: TOKENS.colors.textSecondary,
        }}
        aria-expanded={open}
      >
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: TOKENS.spacing[2],
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          color: ready ? TOKENS.colors.accent : TOKENS.colors.warning,
        }}>
          <span style={{
            width: TOKENS.spacing[2],
            height: TOKENS.spacing[2],
            borderRadius: TOKENS.radius.full,
            background: 'currentColor',
          }} aria-hidden />
          Pre-flight · {ready ? 'all checks passed' : 'review required'}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform var(--transition-base)',
        }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div style={{ marginTop: TOKENS.spacing[3] }}>
          <PreFlightCheck
            vault={vault}
            depositAmount={depositAmount}
            onApprove={onApprove}
            isApproving={isApproving}
            onReadyChange={handleReadyChange}
          />
        </div>
      )}
    </div>
  )
}

/* ─── CAPITAL RECOVERY CALLOUT — flat ───────────────────────────────────── */
function CapitalRecoveryCallout() {
  return (
    <section
      aria-labelledby="capital-recovery-label"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: TOKENS.spacing[3],
      }}
    >
      <Label id="capital-recovery-label" tone="scene" variant="text">
        Capital recovery
      </Label>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(180px, 1fr) 3fr',
        gap: TOKENS.spacing[6],
        alignItems: 'baseline',
        paddingBottom: TOKENS.spacing[4],
      }}>
        <span style={{
          fontSize: TOKENS.fontSizes.md,
          fontWeight: TOKENS.fontWeights.bold,
          color: TOKENS.colors.textPrimary,
          lineHeight: 1.3,
        }}>
          2-year extension
        </span>
        <p style={{
          margin: 0,
          fontSize: TOKENS.fontSizes.sm,
          color: TOKENS.colors.textSecondary,
          lineHeight: 1.6,
        }}>
          If principal sits below the initial deposit at maturity, mining infrastructure keeps operating on behalf of the vault for up to two additional years — output directed exclusively at restoring the original capital base.
        </p>
      </div>
    </section>
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
  placeholder = false,
}: {
  amount: number
  totalYield: number
  lockMonths: number
  target: string
  mode: SmartFitMode
  compact?: boolean
  placeholder?: boolean
}) {
  const targetValue = amount + totalYield
  // Each scenario closes at a different month; same end value (target hit)
  const scenarios = [
    { id: 'bull', label: 'Bull', closesAt: Math.max(CHART.bullMinMonths, Math.round(lockMonths / CHART.bullFractionDenom)), color: CHART_PALETTE[0] },
    { id: 'sideways', label: 'Sideways', closesAt: Math.max(CHART.sidewaysMinMonths, Math.round(lockMonths * CHART.sidewaysFraction)), color: TOKENS.colors.textSecondary },
    { id: 'bear', label: 'Bear', closesAt: lockMonths, color: CHART_PALETTE[2] || TOKENS.colors.warning || TOKENS.colors.danger },
  ]

  const geom = compact ? CHART.compact : CHART.full
  const width = geom.width
  const height = geom.height
  const padding = { top: geom.padTop, right: geom.padRight, bottom: geom.padBottom, left: geom.padLeft }
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

  const yTickValues = Array.from({ length: CHART.yTickCount }, (_, i) => {
    const r = i / (CHART.yTickCount - 1)
    return minVal + r * (maxVal - minVal)
  })
  // Evenly-spaced X ticks anchored at M0 and M{lockMonths} for symmetry
  const xTickCount = lockMonths >= 24 ? CHART.xTickCountLong : lockMonths >= 12 ? CHART.xTickCountMid : CHART.xTickCountShort
  const xTickMonths = Array.from({ length: xTickCount }, (_, i) =>
    Math.round((i / (xTickCount - 1)) * lockMonths),
  )

  const compactPad = `${TOKENS.spacing[3]} 0 0 0`
  const fullPad = fitValue(mode, { normal: TOKENS.spacing[6], tight: TOKENS.spacing[4], limit: TOKENS.spacing[3] })
  const borderColor = TOKENS.colors.borderSubtle
  return (
    <div style={{
      marginTop: TOKENS.spacing[2],
      padding: compact ? compactPad : fullPad,
      background: compact ? 'transparent' : TOKENS.colors.black,
      borderTop: `1px solid ${borderColor}`,
      borderRight: compact ? '0' : `1px solid ${borderColor}`,
      borderBottom: compact ? '0' : `1px solid ${borderColor}`,
      borderLeft: compact ? '0' : `1px solid ${borderColor}`,
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

      {placeholder ? (
        <div
          style={{
            width: '100%',
            aspectRatio: `${width} / ${height}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: TOKENS.spacing[2],
            border: `1px dashed ${TOKENS.colors.borderSubtle}`,
            borderRadius: TOKENS.radius.md,
            background: TOKENS.colors.bgTertiary,
          }}
          aria-hidden
        >
          <span style={{
            fontFamily: TOKENS.fonts.mono,
            fontSize: TOKENS.fontSizes.micro,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
            color: TOKENS.colors.textGhost,
          }}>
            Awaiting input
          </span>
          <span style={{
            fontSize: TOKENS.fontSizes.sm,
            color: TOKENS.colors.textSecondary,
            fontWeight: TOKENS.fontWeights.medium,
            textAlign: 'center',
            maxWidth: LAYOUT.emptyMessageMaxWidth,
            padding: `0 ${TOKENS.spacing[3]}`,
          }}>
            Enter an amount above to plot your projection.
          </span>
        </div>
      ) : (
      <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {yTickValues.map((v, i) => {
          const y = yPos(v)
          return (
            <g key={`y-${i}`}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={TOKENS.colors.borderSubtle} strokeWidth={CHART.gridStrokeWidth} strokeDasharray={CHART.gridDash} />
              <text x={padding.left - CHART.axisLabelOffset} y={y + CHART.axisLabelDy} textAnchor="end" fill={TOKENS.colors.textGhost} fontSize={CHART.axisFontSize} fontFamily={TOKENS.fonts.mono}>
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
          strokeWidth={CHART.guideStrokeWidth}
          strokeDasharray={CHART.targetDash}
          opacity={CHART.targetLineOpacity}
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
              strokeWidth={CHART.guideStrokeWidth}
              strokeDasharray={CHART.guideDash}
              opacity={CHART.guideOpacity}
            />
            <path d={buildPath(s.closesAt)} fill="none" stroke={s.color} strokeWidth={CHART.scenarioStrokeWidth} strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={xPos(s.closesAt)} cy={yPos(targetValue)} r={CHART.scenarioMarkerRadius} fill={s.color} stroke={TOKENS.colors.black} strokeWidth={CHART.scenarioMarkerStroke} />
          </g>
        ))}

        {xTickMonths.map((m, i) => (
          <text
            key={`x-${i}`}
            x={xPos(m)}
            y={height - padding.bottom + CHART.xLabelOffset}
            textAnchor="middle"
            fill={TOKENS.colors.textGhost}
            fontSize={CHART.axisFontSize}
            fontFamily={TOKENS.fonts.mono}
          >
            M{m}
          </text>
        ))}
      </svg>
      </div>
      )}

      {!placeholder && (
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
                width: compact ? TOKENS.dot.sm : TOKENS.dot.lg,
                height: compact ? TOKENS.dot.sm : TOKENS.dot.lg,
                borderRadius: TOKENS.radius.full,
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
      )}
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
                background: `color-mix(in srgb, ${c.tagColor} 10%, transparent)`,
                border: `1px solid color-mix(in srgb, ${c.tagColor} 25%, transparent)`,
                borderRadius: TOKENS.radius.full,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: TOKENS.spacing[2],
              }}
            >
              <span style={{ width: TOKENS.dot.sm, height: TOKENS.dot.sm, borderRadius: TOKENS.radius.full, background: c.tagColor, flexShrink: 0 }} />
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
