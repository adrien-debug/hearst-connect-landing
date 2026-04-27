'use client'

import { useEffect, useMemo, useState } from 'react'
import { PreFlightCheck } from './pre-flight-check'
import { TOKENS, fmtUsd, fmtUsdCompact, VALUE_LETTER_SPACING, CHART_PALETTE, LINE_HEIGHT } from './constants'
import { CockpitGauge } from './cockpit-gauge'
import type { AvailableVault } from './data'
import type { VaultConfig } from '@/types/vault'
import { fitValue, type SmartFitMode } from './smart-fit'

const LAYOUT = {
  rightColMinWidth: '300px',
  rightColPreferred: '34%',
} as const

const AMOUNT_PRESET_MULTIPLIERS = [1, 2, 10, 20] as const

type VaultTab = 'strategy' | 'terms'
const VAULT_TABS: ReadonlyArray<{ id: VaultTab; label: string }> = [
  { id: 'strategy', label: 'Strategy' },
  { id: 'terms', label: 'Terms' },
]

/** Maps risk string → display color token (green+grey spectrum only) */
function riskColor(risk: string): string {
  const r = risk.toLowerCase()
  if (r.includes('very low')) return '#52c97a'
  if (r === 'low') return TOKENS.colors.accent
  if (r === 'medium' || r === 'moderate') return '#71717a'
  if (r === 'high') return '#d4d4d8'
  return TOKENS.colors.textGhost
}

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

  const historicalReturns = vaultConfig?.historicalReturns ?? vault.historicalReturns
  const composition    = vaultConfig?.composition    ?? vault.composition
  const geo            = vaultConfig?.geo            ?? vault.geo
  const tvl            = vaultConfig?.tvl            ?? vault.tvl
  const investorCount  = vaultConfig?.investorCount  ?? vault.investorCount
  const inception      = vaultConfig?.inception      ?? vault.inception
  const sharpe         = vaultConfig?.sharpe         ?? vault.sharpe
  const volatility     = vaultConfig?.volatility     ?? vault.volatility
  const maxDrawdown    = vaultConfig?.maxDrawdown    ?? vault.maxDrawdown
  const lockPeriodDays = vaultConfig?.lockPeriodDays ?? 365

  const hasYieldHistory = (historicalReturns?.length ?? 0) > 1
  const hasComposition  = (composition?.length ?? 0) > 0
  const hasGeo          = (geo?.length ?? 0) > 0
  const hasPerfStats    = sharpe != null || volatility != null || maxDrawdown != null
  const hasFundStats    = tvl != null || investorCount != null || inception != null
  const hasAnalytics    = hasYieldHistory || hasComposition
  const hasMetaRow      = hasPerfStats || hasFundStats

  const gap = fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[2] })

  return (
    <div
      className="flex flex-col flex-1 min-h-0 connect-panel-stage"
      style={{ gap, overflow: 'hidden' }}
    >
      {/* Back */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: TOKENS.spacing[2],
            background: 'none', border: 'none', padding: 0,
            color: TOKENS.colors.accent,
            fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase', cursor: 'pointer',
            alignSelf: 'flex-start', flexShrink: 0,
          }}
        >
          ← Back to vaults
        </button>
      )}

      {/* ── MAIN GRID ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isLimit ? '1fr' : `1fr minmax(${LAYOUT.rightColMinWidth}, ${LAYOUT.rightColPreferred})`,
        gap: fitValue(mode, { normal: TOKENS.spacing[6], tight: TOKENS.spacing[5], limit: TOKENS.spacing[4] }),
        flex: 1, minHeight: 0, overflow: 'hidden',
      }}>

        {/* ── LEFT ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap, minHeight: 0, overflow: 'hidden' }}>

          {/* COCKPIT HEADER — grid bg + risk badge */}
          <div style={{
            background: TOKENS.colors.black,
            border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
            borderRadius: TOKENS.radius.lg,
            padding: fitValue(mode, {
              normal: `${TOKENS.spacing[5]} ${TOKENS.spacing[6]}`,
              tight:  `${TOKENS.spacing[4]} ${TOKENS.spacing[5]}`,
              limit:  `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
            }),
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Subtle dot-grid texture */}
            <div aria-hidden style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
            }} />
            {/* Accent glow corner */}
            <div aria-hidden style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
              background: `linear-gradient(90deg, transparent, rgba(var(--brand-accent-rgb), 0.4) 40%, rgba(var(--brand-accent-rgb), 0.4) 60%, transparent)`,
            }} />

            <div style={{ position: 'relative' }}>
              {/* Risk badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: TOKENS.spacing[2] }}>
                <span style={{
                  fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro,
                  fontWeight: TOKENS.fontWeights.bold, letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase', color: TOKENS.colors.textGhost,
                }}>
                  Available vault
                </span>
                <RiskBadge risk={vault.risk} />
              </div>

              <h1 style={{
                margin: `0 0 ${TOKENS.spacing[1]} 0`,
                fontSize: fitValue(mode, { normal: 'var(--dashboard-text-display)', tight: TOKENS.fontSizes.xxl, limit: TOKENS.fontSizes.xl }),
                fontWeight: TOKENS.fontWeights.black,
                letterSpacing: TOKENS.letterSpacing.tight,
                color: TOKENS.colors.textPrimary,
                lineHeight: 1.0,
              }}>
                {vault.name}
              </h1>
              {vault.strategy && (
                <p style={{
                  margin: `0 0 ${TOKENS.spacing[4]} 0`,
                  fontSize: TOKENS.fontSizes.sm,
                  color: TOKENS.colors.textSecondary,
                  fontWeight: TOKENS.fontWeights.medium,
                  lineHeight: 1.55,
                }}>
                  {vault.strategy}
                </p>
              )}

              {/* KPI gauges with vertical separators */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                borderTop: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
                paddingTop: TOKENS.spacing[4],
              }}>
                {[
                  { label: 'Target',    value: vault.target,               compact: vault.target,          sub: 'cumulative',    accent: true },
                  { label: 'APY',       value: `${vault.apr}%`,            compact: `${vault.apr}%`,       sub: 'annualized' },
                  { label: 'Lock',      value: vault.lockPeriod,           compact: vault.term,            sub: 'from deposit' },
                  { label: 'Min entry', value: fmtUsdCompact(vault.minDeposit), compact: fmtUsdCompact(vault.minDeposit), sub: 'USDC' },
                  { label: 'Fee',       value: vault.fees ? vault.fees.split('·')[0]?.trim() ?? '—' : '—', compact: vault.fees ? vault.fees.split('·')[0]?.trim() ?? '—' : '—', sub: 'management' },
                ].map((g, i) => (
                  <div key={g.label} style={{
                    borderLeft: i > 0 ? `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}` : 'none',
                    paddingLeft: i > 0 ? TOKENS.spacing[4] : 0,
                  }}>
                    <CockpitGauge
                      label={g.label}
                      value={g.value}
                      valueCompact={g.compact}
                      subtext={g.sub}
                      mode={mode}
                      accent={g.accent}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ANALYTICS ROW — yield chart + composition donut */}
          {hasAnalytics && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: hasYieldHistory && hasComposition
                ? fitValue(mode, { normal: '1.7fr 1fr', tight: '1.5fr 1fr', limit: '1fr' })
                : '1fr',
              gap, flexShrink: 0,
            }}>
              {hasYieldHistory && (
                <PremiumCard title={`Yield history · ${historicalReturns!.length}mo`}>
                  <YieldHistoryChart returns={historicalReturns!} targetApr={vault.apr} mode={mode} />
                </PremiumCard>
              )}
              {hasComposition && (
                <PremiumCard title="Allocation">
                  <CompositionDonut composition={composition!} />
                </PremiumCard>
              )}
            </div>
          )}

          {/* METRICS ROW — fund + performance */}
          {hasMetaRow && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: hasFundStats && hasPerfStats ? '1fr 1fr' : '1fr',
              gap, flexShrink: 0,
            }}>
              {hasFundStats && (
                <PremiumCard title="Fund">
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${[tvl, investorCount, inception].filter(x => x != null).length}, 1fr)`,
                    gap: TOKENS.spacing[5],
                  }}>
                    {tvl != null && <StatPill label="TVL" value={fmtUsdCompact(tvl)} sub="assets under mgmt" />}
                    {investorCount != null && <StatPill label="Investors" value={investorCount.toLocaleString('en-US')} sub="active depositors" />}
                    {inception != null && (
                      <StatPill
                        label="Inception"
                        value={new Date(inception).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        sub="live since"
                      />
                    )}
                  </div>
                </PremiumCard>
              )}
              {hasPerfStats && (
                <PremiumCard title="Performance">
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${[sharpe, volatility, maxDrawdown].filter(x => x != null).length}, 1fr)`,
                    gap: TOKENS.spacing[5],
                  }}>
                    {sharpe != null && (
                      <PerformanceStat
                        label="Sharpe"
                        value={sharpe.toFixed(2)}
                        sub="risk-adj. return"
                        barPct={(sharpe / 3.0) * 100}
                        barColor={TOKENS.colors.accent}
                      />
                    )}
                    {volatility != null && (
                      <PerformanceStat
                        label="Volatility"
                        value={`${volatility.toFixed(1)}%`}
                        sub="annualized"
                        barPct={(volatility / 40) * 100}
                        barColor={TOKENS.colors.textGhost}
                      />
                    )}
                    {maxDrawdown != null && (
                      <PerformanceStat
                        label="Max drawdown"
                        value={`-${maxDrawdown.toFixed(1)}%`}
                        sub="peak to trough"
                        barPct={(maxDrawdown / 50) * 100}
                        barColor={TOKENS.colors.danger}
                      />
                    )}
                  </div>
                </PremiumCard>
              )}
            </div>
          )}

          {/* STRATEGY / TERMS TABS — flex 1 */}
          <VaultTabs vault={vault} vaultConfig={vaultConfig} mode={mode} lockPeriodDays={lockPeriodDays} />
        </div>

        {/* ── RIGHT COLUMN ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap, minHeight: 0, overflow: 'auto' }} className="hide-scrollbar">

          {/* Section label */}
          <div style={{
            fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase', color: TOKENS.colors.textGhost,
            paddingLeft: TOKENS.spacing[3],
            borderLeft: `var(--dashboard-card-border-accent-width) solid ${TOKENS.colors.accent}`,
            flexShrink: 0,
          }}>
            Order Summary
          </div>

          {/* AMOUNT INPUT CARD */}
          <div style={{
            background: TOKENS.colors.black,
            border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
            borderRadius: TOKENS.radius.lg,
            padding: TOKENS.spacing[5],
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {isValid && num > 0 && (
              <div aria-hidden style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                background: `linear-gradient(90deg, transparent, rgba(var(--brand-accent-rgb), 0.6) 50%, transparent)`,
              }} />
            )}
            <label
              htmlFor={idAmount}
              id={idAmountHint}
              style={{
                display: 'block',
                fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro,
                fontWeight: TOKENS.fontWeights.bold, textTransform: 'uppercase',
                letterSpacing: TOKENS.letterSpacing.display,
                color: TOKENS.colors.textSecondary,
                marginBottom: TOKENS.spacing[2],
              }}
            >
              Amount to deploy
            </label>
            <div style={{
              display: 'flex', alignItems: 'center',
              border: `${TOKENS.borders.thin} solid ${isValid && num > 0 ? TOKENS.colors.accent : TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radius.md,
              padding: `0 ${TOKENS.spacing[4]}`,
              background: isValid && num > 0 ? 'rgba(var(--brand-accent-rgb), 0.04)' : TOKENS.colors.bgTertiary,
              height: TOKENS.control.heightLg,
              boxShadow: isValid && num > 0 ? `0 0 0 1px rgba(var(--brand-accent-rgb), 0.2), 0 0 16px rgba(var(--brand-accent-rgb), 0.08)` : 'none',
              transition: 'all var(--transition-fast)',
            }}>
              <span style={{
                fontSize: TOKENS.fontSizes.xxl, fontWeight: TOKENS.fontWeights.black,
                color: num > 0 ? TOKENS.colors.accent : TOKENS.colors.textGhost,
                marginRight: TOKENS.spacing[1], lineHeight: 1, flexShrink: 0,
                transition: `color var(--transition-fast)`,
              }}>$</span>
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
                  flex: 1, minWidth: 0, border: 0,
                  background: 'transparent',
                  fontWeight: TOKENS.fontWeights.black,
                  color: TOKENS.colors.textPrimary,
                  outline: 'none',
                  fontSize: TOKENS.fontSizes.xxl,
                  fontFamily: TOKENS.fonts.sans,
                  letterSpacing: VALUE_LETTER_SPACING,
                  lineHeight: 1, padding: 0, height: '100%',
                }}
              />
              <span style={{
                fontFamily: TOKENS.fonts.mono, fontWeight: TOKENS.fontWeights.bold,
                color: TOKENS.colors.textGhost, fontSize: TOKENS.fontSizes.xs,
                marginLeft: TOKENS.spacing[2], flexShrink: 0,
                letterSpacing: TOKENS.letterSpacing.display,
              }} aria-hidden>
                USDC
              </span>
            </div>
            <div
              id={idAmountStatus}
              role="status"
              aria-live="polite"
              style={{
                marginTop: TOKENS.spacing[2], minHeight: TOKENS.spacing[4],
                fontSize: TOKENS.fontSizes.xs, fontWeight: TOKENS.fontWeights.bold,
                color: showError ? TOKENS.colors.danger : showValidHint ? TOKENS.colors.accent : 'transparent',
                display: 'flex', alignItems: 'center', gap: TOKENS.spacing[1],
              }}
            >
              {showError && <span>Minimum deposit: {fmtUsd(vault.minDeposit)}</span>}
              {showValidHint && !showError && <><span>✓</span><span>Valid amount</span></>}
            </div>
            <AmountPresets
              minDeposit={vault.minDeposit}
              currentAmount={num}
              onSelect={(v) => onAmountChange(String(v))}
            />
          </div>

          {/* PROJECTIONS CARD — accent highlight when active */}
          {num > 0 ? (
            <div style={{
              background: 'rgba(var(--brand-accent-rgb), 0.03)',
              border: `${TOKENS.borders.thin} solid rgba(var(--brand-accent-rgb), 0.2)`,
              borderRadius: TOKENS.radius.lg,
              padding: TOKENS.spacing[5],
              flexShrink: 0,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div aria-hidden style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                background: `linear-gradient(90deg, transparent, rgba(var(--brand-accent-rgb), 0.5) 50%, transparent)`,
              }} />
              <div style={{
                fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
                color: TOKENS.colors.textSecondary,
                borderLeft: `var(--dashboard-card-border-accent-width) solid ${TOKENS.colors.accent}`,
                paddingLeft: TOKENS.spacing[3],
                marginBottom: TOKENS.spacing[4],
              }}>
                Yield projections
              </div>
              <ProjectionRow label="Est. annual yield" value={`+${fmtUsd(yearlyYield)}`} />
              <ProjectionRow label="Target yield at maturity" value={`+${fmtUsd(totalYield)}`} />
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                paddingTop: TOKENS.spacing[4], marginTop: TOKENS.spacing[2],
                borderTop: `${TOKENS.borders.thin} solid rgba(var(--brand-accent-rgb), 0.15)`,
              }}>
                <span style={{
                  fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.xs,
                  fontWeight: TOKENS.fontWeights.bold,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                  color: TOKENS.colors.textSecondary,
                }}>
                  Total at maturity
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: TOKENS.spacing[2] }}>
                  <span style={{
                    fontSize: TOKENS.fontSizes.xl,
                    fontWeight: TOKENS.fontWeights.black,
                    color: TOKENS.colors.accent,
                    letterSpacing: VALUE_LETTER_SPACING,
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: LINE_HEIGHT.tight,
                    filter: `drop-shadow(0 0 10px rgba(var(--brand-accent-rgb), 0.5))`,
                  }}>
                    {fmtUsd(num + totalYield)}
                  </span>
                  <span style={{
                    fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro,
                    fontWeight: TOKENS.fontWeights.bold,
                    color: TOKENS.colors.accent, opacity: 0.65,
                    padding: `1px ${TOKENS.spacing[2]}`,
                    background: 'rgba(var(--brand-accent-rgb), 0.1)',
                    borderRadius: TOKENS.radius.full,
                    letterSpacing: TOKENS.letterSpacing.display,
                  }}>
                    +{((totalYield / num) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <MaturityProjectionChart
                principal={num}
                totalYield={totalYield}
                lockPeriodDays={lockPeriodDays}
              />
              <ScenarioGrid apr={vault.apr} principal={num} lockPeriodDays={lockPeriodDays} />
            </div>
          ) : hasGeo ? (
            <PremiumCard title="Geographic exposure">
              <GeoDistribution geo={geo!} />
            </PremiumCard>
          ) : null}

          {/* PRE-FLIGHT */}
          <CollapsiblePreFlight
            vault={vault}
            depositAmount={amount}
            onApprove={onApprove}
            isApproving={isApproving}
            onPreFlightReady={onPreFlightReady}
          />

          {/* TERMS + CTA */}
          <div style={{
            background: TOKENS.colors.black,
            border: `${TOKENS.borders.thin} solid ${isReady ? 'rgba(var(--brand-accent-rgb), 0.3)' : TOKENS.colors.borderSubtle}`,
            borderRadius: TOKENS.radius.lg,
            padding: TOKENS.spacing[5],
            display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[3],
            marginTop: 'auto', flexShrink: 0,
            transition: 'border-color var(--transition-base)',
          }}>
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
                  style={{ width: TOKENS.spacing[5], height: TOKENS.spacing[5], accentColor: TOKENS.colors.accent, cursor: 'pointer', flexShrink: 0 }}
                  aria-describedby={`${idAgree}-desc`}
                />
                <span
                  id={`${idAgree}-desc`}
                  style={{ fontSize: TOKENS.fontSizes.xs, fontWeight: TOKENS.fontWeights.bold, color: TOKENS.colors.textSecondary, lineHeight: 1.4 }}
                >
                  I confirm the term sheet and minimum deposit.
                </span>
              </label>
            </fieldset>

            <DeployButton
              isReady={isReady}
              isDepositing={isDepositing}
              num={num}
              onClick={onDeposit}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── PREMIUM CARD ──────────────────────────────────────────────────────── */
function PremiumCard({
  title,
  headerRight,
  children,
  accent = false,
  style: extraStyle,
}: {
  title: string
  headerRight?: React.ReactNode
  children: React.ReactNode
  accent?: boolean
  style?: React.CSSProperties
}) {
  return (
    <div style={{
      background: TOKENS.colors.black,
      border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
      borderRadius: TOKENS.radius.lg,
      padding: TOKENS.spacing[5],
      display: 'flex', flexDirection: 'column', minHeight: 0,
      ...extraStyle,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: TOKENS.spacing[3], marginBottom: TOKENS.spacing[4], flexShrink: 0,
      }}>
        <span style={{
          fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase', color: TOKENS.colors.textSecondary,
          borderLeft: `var(--dashboard-card-border-accent-width) solid ${accent ? TOKENS.colors.accent : TOKENS.colors.borderStrong}`,
          paddingLeft: TOKENS.spacing[3],
        }}>
          {title}
        </span>
        {headerRight}
      </div>
      <div style={{ minHeight: 0, flex: 1 }}>{children}</div>
    </div>
  )
}

/* ─── RISK BADGE ─────────────────────────────────────────────────────────── */
function RiskBadge({ risk }: { risk: string }) {
  const color = riskColor(risk)
  const r = risk.toLowerCase()
  const segments = ['low', 'medium', 'high']
  const activeIdx = r === 'low' ? 0 : r === 'medium' || r === 'moderate' ? 1 : 2
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: TOKENS.spacing[2] }}>
      <div style={{ display: 'flex', gap: TOKENS.spacing[1], alignItems: 'center' }}>
        {segments.map((_, i) => (
          <div key={i} style={{
            width: 16, height: 3,
            borderRadius: TOKENS.radius.full,
            background: i <= activeIdx ? color : TOKENS.colors.bgTertiary,
            transition: 'background var(--transition-fast)',
          }} />
        ))}
      </div>
      <span style={{
        fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase', color,
        padding: `${TOKENS.spacing.half} ${TOKENS.spacing[2]}`,
        background: 'rgba(var(--brand-accent-rgb), 0.06)',
        borderRadius: TOKENS.radius.full,
        border: `${TOKENS.borders.thin} solid rgba(var(--brand-accent-rgb), 0.18)`,
      }}>
        {risk}
      </span>
    </div>
  )
}

/* ─── STAT PILL ──────────────────────────────────────────────────────────── */
function StatPill({ label, value, sub, danger }: { label: string; value: string; sub?: string; danger?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing.half }}>
      <span style={{
        fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase', color: TOKENS.colors.textGhost,
      }}>{label}</span>
      <span style={{
        fontSize: TOKENS.fontSizes.lg, fontWeight: TOKENS.fontWeights.black,
        color: danger ? TOKENS.colors.danger : TOKENS.colors.textPrimary,
        letterSpacing: VALUE_LETTER_SPACING,
        lineHeight: LINE_HEIGHT.tight,
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
      {sub && (
        <span style={{ fontSize: TOKENS.fontSizes.micro, color: TOKENS.colors.textGhost }}>{sub}</span>
      )}
    </div>
  )
}

/* ─── PERFORMANCE STAT (with mini bar) ───────────────────────────────────── */
function PerformanceStat({ label, value, sub, barPct, barColor }: {
  label: string; value: string; sub?: string; barPct: number; barColor: string
}) {
  const clamped = Math.max(0, Math.min(100, barPct))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[1] }}>
      <span style={{
        fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase', color: TOKENS.colors.textGhost,
      }}>{label}</span>
      <span style={{
        fontSize: TOKENS.fontSizes.lg, fontWeight: TOKENS.fontWeights.black,
        color: barColor, letterSpacing: VALUE_LETTER_SPACING,
        lineHeight: LINE_HEIGHT.tight, fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
      <div style={{
        height: 2, borderRadius: 1, background: TOKENS.colors.bgTertiary,
        overflow: 'hidden', marginTop: TOKENS.spacing.half,
      }}>
        <div style={{
          height: '100%', width: `${clamped}%`,
          background: barColor, borderRadius: 1,
          opacity: 0.75,
          transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
        }} />
      </div>
      {sub && <span style={{ fontSize: TOKENS.fontSizes.micro, color: TOKENS.colors.textGhost }}>{sub}</span>}
    </div>
  )
}

/* ─── YIELD HISTORY CHART (interactive crosshair) ────────────────────────── */
function YieldHistoryChart({
  returns,
  targetApr,
}: {
  returns: Array<{ month: string; yieldPct: number }>
  targetApr: number
  mode: SmartFitMode
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const W = 600, H = 170
  const pad = { top: 18, right: 10, bottom: 28, left: 52 }
  const cW = W - pad.left - pad.right
  const cH = H - pad.top - pad.bottom

  const minY = Math.min(targetApr, ...returns.map(r => r.yieldPct)) * 0.78
  const maxY = Math.max(targetApr, ...returns.map(r => r.yieldPct)) * 1.18
  const span = Math.max(0.01, maxY - minY)

  const toX = (i: number) => pad.left + (i / Math.max(1, returns.length - 1)) * cW
  const toY = (v: number)  => pad.top + cH - ((v - minY) / span) * cH

  const points = returns.map((r, i) => ({ x: toX(i), y: toY(r.yieldPct), ...r }))

  const buildBezier = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => {
      if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
      const prev = pts[i - 1]
      const cpx = prev.x + (p.x - prev.x) / 2
      return `C ${cpx.toFixed(1)} ${prev.y.toFixed(1)}, ${cpx.toFixed(1)} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
    }).join(' ')

  const linePath = buildBezier(points)
  const last = points[points.length - 1]
  const areaPath = `${linePath} L ${last.x.toFixed(1)} ${(pad.top + cH).toFixed(1)} L ${pad.left} ${(pad.top + cH).toFixed(1)} Z`
  const targetY = toY(targetApr)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const v = minY + (span / 4) * i
    return { v, y: toY(v), label: `${v.toFixed(1)}%` }
  })

  const hoverPt = hoverIdx != null ? points[hoverIdx] : null
  const lastReturn = returns[returns.length - 1]
  const firstReturn = returns[0]
  const displayReturn = hoverIdx != null ? returns[hoverIdx] : lastReturn
  const isAboveTarget = (displayReturn?.yieldPct ?? 0) >= targetApr

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: TOKENS.spacing[3],
      }}>
        <span style={{
          fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro,
          color: TOKENS.colors.textGhost, letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
        }}>
          {hoverIdx != null ? returns[hoverIdx].month : `${firstReturn?.month} — ${lastReturn?.month}`}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[2] }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: TOKENS.spacing[2],
            padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[3]}`,
            background: isAboveTarget ? 'rgba(var(--brand-accent-rgb), 0.10)' : 'rgba(var(--color-error-rgb), 0.10)',
            borderRadius: TOKENS.radius.full,
            fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.black,
            color: isAboveTarget ? TOKENS.colors.accent : TOKENS.colors.danger,
            fontVariantNumeric: 'tabular-nums',
            transition: 'all var(--transition-fast)',
          }}>
            {(displayReturn?.yieldPct ?? 0).toFixed(1)}%
          </span>
          <span style={{
            fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro,
            color: TOKENS.colors.textGhost,
          }}>
            / target {targetApr.toFixed(1)}%
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', display: 'block', overflow: 'visible', cursor: 'crosshair' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="yieldAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={TOKENS.colors.accent} stopOpacity="0.30" />
            <stop offset="90%" stopColor={TOKENS.colors.accent} stopOpacity="0.01" />
          </linearGradient>
          <filter id="lineGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Y grid + labels */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={pad.left} y1={tick.y} x2={W - pad.right} y2={tick.y}
              stroke={i === 0 ? TOKENS.colors.textGhost : TOKENS.colors.borderSubtle}
              strokeWidth={i === 0 ? 0.8 : 0.5}
              strokeDasharray={i === 0 ? 'none' : '3 3'}
            />
            <text x={pad.left - 8} y={tick.y + 4} textAnchor="end"
              fill={TOKENS.colors.textGhost} fontSize="10" fontFamily={TOKENS.fonts.mono}>
              {tick.label}
            </text>
          </g>
        ))}

        {/* Target line */}
        <line
          x1={pad.left} y1={targetY} x2={W - pad.right} y2={targetY}
          stroke={TOKENS.colors.accent} strokeWidth={0.8} strokeDasharray="4 3" strokeOpacity={0.4}
        />
        <text x={W - pad.right + 4} y={targetY + 4} fill={TOKENS.colors.accent} fontSize="9"
          fontFamily={TOKENS.fonts.mono} opacity={0.5}>
          TGT
        </text>

        {/* Area */}
        <path d={areaPath} fill="url(#yieldAreaGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke={TOKENS.colors.accent} strokeWidth={2.2}
          strokeLinejoin="round" strokeLinecap="round"
          filter="url(#lineGlow)"
        />

        {/* Hover invisible rects */}
        {returns.map((_, i) => {
          const x = toX(i)
          const halfStep = i === 0 ? 0 : (toX(i) - toX(i - 1)) / 2
          const halfNext = i === returns.length - 1 ? 0 : (toX(i + 1) - toX(i)) / 2
          return (
            <rect
              key={i}
              x={x - halfStep} y={pad.top}
              width={halfStep + halfNext} height={cH}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          )
        })}

        {/* Crosshair + tooltip */}
        {hoverPt && (() => {
          const TW = 80, TH = 40
          const flipLeft = hoverPt.x > W - pad.right - TW - 16
          const tx = flipLeft ? hoverPt.x - TW - 12 : hoverPt.x + 12
          const ty = Math.max(pad.top + 2, Math.min(hoverPt.y - TH / 2, pad.top + cH - TH))
          const tipColor = (displayReturn?.yieldPct ?? 0) >= targetApr ? TOKENS.colors.accent : TOKENS.colors.danger
          return (
            <>
              <line
                x1={hoverPt.x} y1={pad.top} x2={hoverPt.x} y2={pad.top + cH}
                stroke={TOKENS.colors.accent} strokeWidth={1}
                strokeDasharray="3 2" strokeOpacity={0.5} pointerEvents="none"
              />
              <circle cx={hoverPt.x} cy={hoverPt.y} r={4.5}
                fill={TOKENS.colors.accent} stroke={TOKENS.colors.black} strokeWidth={2}
                style={{ filter: `drop-shadow(0 0 5px ${TOKENS.colors.accent})` }}
                pointerEvents="none"
              />
              <g pointerEvents="none">
                <rect x={tx + 1} y={ty + 2} width={TW} height={TH} rx={4}
                  fill="rgba(0,0,0,0.35)" />
                <rect x={tx} y={ty} width={TW} height={TH} rx={4}
                  fill={TOKENS.colors.black} stroke={tipColor} strokeWidth={0.8} strokeOpacity={0.45} />
                <text x={tx + TW / 2} y={ty + 16} textAnchor="middle"
                  style={{ fontSize: 13, fontFamily: TOKENS.fonts.mono, fontWeight: 800, fill: tipColor }}>
                  {(displayReturn?.yieldPct ?? 0).toFixed(2)}%
                </text>
                <text x={tx + TW / 2} y={ty + 30} textAnchor="middle"
                  style={{ fontSize: 9, fontFamily: TOKENS.fonts.mono, fill: TOKENS.colors.textGhost, letterSpacing: '0.07em' }}>
                  {(displayReturn?.month ?? '').toUpperCase()}
                </text>
              </g>
            </>
          )
        })()}

        {/* End dot */}
        {!hoverPt && (
          <circle cx={last.x} cy={last.y} r={5}
            fill={TOKENS.colors.accent} stroke={TOKENS.colors.black} strokeWidth={2.5}
            style={{ filter: `drop-shadow(0 0 8px ${TOKENS.colors.accent})` }}
          />
        )}

        {/* X labels */}
        <text x={pad.left} y={H - 4} textAnchor="start" fill={TOKENS.colors.textGhost}
          fontSize="10" fontFamily={TOKENS.fonts.mono}>{firstReturn?.month}</text>
        <text x={W - pad.right} y={H - 4} textAnchor="end" fill={TOKENS.colors.textGhost}
          fontSize="10" fontFamily={TOKENS.fonts.mono}>{lastReturn?.month}</text>
      </svg>
    </div>
  )
}

/* ─── COMPOSITION DONUT ──────────────────────────────────────────────────── */
function CompositionDonut({
  composition,
}: {
  composition: Array<{ label: string; pct: number; color?: string }>
}) {
  const [hovIdx, setHovIdx] = useState<number | null>(null)
  const total = composition.reduce((s, c) => s + c.pct, 0) || 1
  const size = 96, stroke = 20, radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius

  const segments = useMemo(() => {
    let off = 0
    return composition.map((s, i) => {
      const dash = circ * (s.pct / total)
      const seg = { dash, gap: circ - dash, offset: -off, color: s.color ?? CHART_PALETTE[i % CHART_PALETTE.length] }
      off += dash
      return seg
    })
  }, [composition, total, circ])

  const active = hovIdx != null ? composition[hovIdx] : null

  return (
    <div style={{ display: 'flex', gap: TOKENS.spacing[5], alignItems: 'flex-start' }}>
      {/* Donut */}
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={TOKENS.colors.bgTertiary} strokeWidth={stroke} />
          {segments.map((seg, i) => (
            <circle key={i}
              cx={size / 2} cy={size / 2} r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={hovIdx === i ? stroke + 4 : stroke}
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={seg.offset}
              strokeLinecap="round"
              style={{
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                filter: hovIdx === i ? `drop-shadow(0 0 8px ${seg.color})` : 'none',
              }}
              onMouseEnter={() => setHovIdx(i)}
              onMouseLeave={() => setHovIdx(null)}
            />
          ))}
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontSize: '12px', fontWeight: TOKENS.fontWeights.black,
            color: active ? segments[hovIdx!].color : TOKENS.colors.textSecondary,
            fontVariantNumeric: 'tabular-nums', lineHeight: 1,
            transition: 'color var(--transition-fast)',
          }}>
            {active ? `${active.pct.toFixed(0)}%` : `${composition.length}`}
          </span>
          <span style={{
            fontSize: '9px', fontFamily: TOKENS.fonts.mono, letterSpacing: '0.08em',
            color: TOKENS.colors.textGhost, marginTop: 2, textTransform: 'uppercase',
          }}>
            {active ? 'alloc' : 'slices'}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: TOKENS.spacing.half, minWidth: 0 }}>
        {composition.map((slice, i) => {
          const color = slice.color ?? CHART_PALETTE[i % CHART_PALETTE.length]
          const isHov = hovIdx === i
          return (
            <div
              key={slice.label}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: TOKENS.spacing[2],
                padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[2]}`,
                borderRadius: TOKENS.radius.sm,
                background: isHov ? TOKENS.colors.bgTertiary : 'transparent',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={() => setHovIdx(i)}
              onMouseLeave={() => setHovIdx(null)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[2], minWidth: 0 }}>
                <span style={{
                  width: TOKENS.dot.sm, height: TOKENS.dot.sm,
                  borderRadius: TOKENS.radius.full, background: color, flexShrink: 0,
                  boxShadow: isHov ? `0 0 6px ${color}` : 'none',
                  transition: 'box-shadow var(--transition-fast)',
                }} />
                <span style={{
                  fontSize: TOKENS.fontSizes.micro, fontWeight: TOKENS.fontWeights.bold,
                  color: isHov ? TOKENS.colors.textPrimary : TOKENS.colors.textSecondary,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  transition: `color ${TOKENS.transitions.durFast}`,
                }}>{slice.label}</span>
              </span>
              <span style={{
                fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro,
                fontWeight: TOKENS.fontWeights.black, color: TOKENS.colors.textPrimary,
                fontVariantNumeric: 'tabular-nums', flexShrink: 0,
              }}>{slice.pct.toFixed(0)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── MATURITY PROJECTION CHART ──────────────────────────────────────────── */
function MaturityProjectionChart({ principal, totalYield, lockPeriodDays }: {
  principal: number; totalYield: number; lockPeriodDays: number
}) {
  const W = 500, H = 96
  const pad = { top: 8, right: 10, bottom: 22, left: 52 }
  const cW = W - pad.left - pad.right
  const cH = H - pad.top - pad.bottom
  const steps = 24

  const pts = Array.from({ length: steps + 1 }, (_, i) => ({
    x: pad.left + (i / steps) * cW,
    y: pad.top + cH - ((totalYield * i) / steps / Math.max(totalYield, 1)) * cH,
  }))

  const buildBezier = (points: { x: number; y: number }[]) =>
    points.map((p, i) => {
      if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
      const prev = points[i - 1]
      const cpx = prev.x + (p.x - prev.x) / 2
      return `C ${cpx.toFixed(1)} ${prev.y.toFixed(1)}, ${cpx.toFixed(1)} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
    }).join(' ')

  const linePath = buildBezier(pts)
  const last = pts[pts.length - 1]
  const areaPath = `${linePath} L ${last.x.toFixed(1)} ${(pad.top + cH).toFixed(1)} L ${pad.left} ${(pad.top + cH).toFixed(1)} Z`

  return (
    <div style={{ marginTop: TOKENS.spacing[4] }}>
      <span style={{
        fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.display, textTransform: 'uppercase',
        color: TOKENS.colors.textGhost, display: 'block', marginBottom: TOKENS.spacing[2],
      }}>
        Growth projection
      </span>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', overflow: 'visible' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={TOKENS.colors.accent} stopOpacity="0.22" />
            <stop offset="100%" stopColor={TOKENS.colors.accent} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Axes */}
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + cH}
          stroke={TOKENS.colors.borderSubtle} strokeWidth={0.5} />
        <line x1={pad.left} y1={pad.top + cH} x2={W - pad.right} y2={pad.top + cH}
          stroke={TOKENS.colors.borderSubtle} strokeWidth={0.5} />
        {/* Y labels */}
        <text x={pad.left - 6} y={pad.top + 4} textAnchor="end"
          fill={TOKENS.colors.textGhost} fontSize="10" fontFamily={TOKENS.fonts.mono}>
          {fmtUsdCompact(principal + totalYield)}
        </text>
        <text x={pad.left - 6} y={pad.top + cH + 4} textAnchor="end"
          fill={TOKENS.colors.textGhost} fontSize="10" fontFamily={TOKENS.fonts.mono}>
          {fmtUsdCompact(principal)}
        </text>
        <path d={areaPath} fill="url(#projGrad)" />
        <path d={linePath} fill="none" stroke={TOKENS.colors.accent} strokeWidth={2}
          strokeLinejoin="round" strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 2px 6px rgba(var(--brand-accent-rgb), 0.3))' }}
        />
        <circle cx={last.x} cy={last.y} r={4}
          fill={TOKENS.colors.accent} stroke={TOKENS.colors.black} strokeWidth={1.5}
          style={{ filter: `drop-shadow(0 0 6px ${TOKENS.colors.accent})` }}
        />
        {/* X labels */}
        <text x={pad.left} y={H - 2} textAnchor="start"
          fill={TOKENS.colors.textGhost} fontSize="10" fontFamily={TOKENS.fonts.mono}>Now</text>
        <text x={W - pad.right} y={H - 2} textAnchor="end"
          fill={TOKENS.colors.textGhost} fontSize="10" fontFamily={TOKENS.fonts.mono}>
          {lockPeriodDays}d
        </text>
      </svg>
    </div>
  )
}

/* ─── GEO DISTRIBUTION ───────────────────────────────────────────────────── */
function GeoDistribution({ geo }: { geo: Array<{ region: string; pct: number }> }) {
  const total = geo.reduce((s, g) => s + g.pct, 0) || 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[3] }}>
      {geo.map((g, i) => (
        <div key={g.region} style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[1] }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: TOKENS.fontSizes.xs, fontWeight: TOKENS.fontWeights.bold, color: TOKENS.colors.textSecondary }}>
              {g.region}
            </span>
            <span style={{
              fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.xs,
              fontWeight: TOKENS.fontWeights.black, color: TOKENS.colors.textPrimary,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {g.pct.toFixed(0)}%
            </span>
          </div>
          <div style={{ height: 4, borderRadius: TOKENS.radius.full, background: TOKENS.colors.bgTertiary, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${(g.pct / total) * 100}%`,
              background: CHART_PALETTE[i % CHART_PALETTE.length],
              borderRadius: TOKENS.radius.full,
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── VAULT TABS ─────────────────────────────────────────────────────────── */
function VaultTabs({
  vault, vaultConfig, mode, lockPeriodDays,
}: {
  vault: AvailableVault
  vaultConfig: VaultConfig | null
  mode: SmartFitMode
  lockPeriodDays: number
}) {
  const [activeTab, setActiveTab] = useState<VaultTab>('strategy')

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden',
      background: TOKENS.colors.black,
      border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
      borderRadius: TOKENS.radius.lg,
    }}>
      <div role="tablist" aria-label="Vault details" style={{
        display: 'flex', gap: TOKENS.spacing[5],
        borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
        padding: `0 ${TOKENS.spacing[5]}`, flexShrink: 0,
      }}>
        {VAULT_TABS.map((tab) => {
          const active = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`sc-tab-panel-${tab.id}`}
              id={`sc-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent', border: 'none',
                padding: `${TOKENS.spacing[4]} 0`, margin: 0, cursor: 'pointer',
                fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
                color: active ? TOKENS.colors.textPrimary : TOKENS.colors.textGhost,
                position: 'relative', transition: 'color var(--transition-fast)',
              }}
            >
              {tab.label}
              {active && (
                <span aria-hidden style={{
                  position: 'absolute', left: 0, right: 0, bottom: -1, height: 2,
                  background: TOKENS.colors.accent, borderRadius: '1px 1px 0 0',
                }} />
              )}
            </button>
          )
        })}
      </div>
      <div
        role="tabpanel"
        id={`sc-tab-panel-${activeTab}`}
        aria-labelledby={`sc-tab-${activeTab}`}
        style={{
          padding: `${TOKENS.spacing[5]} ${TOKENS.spacing[5]} ${TOKENS.spacing[5]}`,
          overflow: 'auto', flex: 1, minHeight: 0,
        }}
        className="hide-scrollbar"
      >
        {activeTab === 'strategy' && <StrategyTabBody vault={vault} vaultConfig={vaultConfig} />}
        {activeTab === 'terms' && <TermsTabBody vault={vault} vaultConfig={vaultConfig} lockPeriodDays={lockPeriodDays} />}
      </div>
    </div>
  )
}

function StrategyTabBody({ vault, vaultConfig }: { vault: AvailableVault; vaultConfig: VaultConfig | null }) {
  const description = vaultConfig?.description ?? vault.strategy
  const resolvedRisk = vaultConfig?.risk ?? vault.risk
  const custodian = vaultConfig?.custodian ?? vault.custodian
  const auditReports = vaultConfig?.auditReports ?? vault.auditReports
  const parts = (vault.strategy || '').split('·').map(s => s.trim()).filter(Boolean)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[5] }}>
      {description && (
        <p style={{
          margin: 0, fontSize: TOKENS.fontSizes.sm,
          color: TOKENS.colors.textSecondary, lineHeight: 1.7,
        }}>
          {description}
        </p>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: TOKENS.spacing[4],
      }}>
        {parts[0] && <MetaCell label="Underlying" value={parts[0]} />}
        {parts[1] && <MetaCell label="Distribution" value={parts[1]} mono />}
        {parts[2] && <MetaCell label="Structure" value={parts[2]} />}
        {resolvedRisk && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing.half }}>
            <span style={{
              fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.bold, letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase', color: TOKENS.colors.textGhost,
            }}>Risk</span>
            <RiskBadge risk={resolvedRisk} />
          </div>
        )}
        {custodian && <MetaCell label="Custodian" value={custodian} />}
      </div>

      {auditReports && auditReports.length > 0 && (
        <div>
          <span style={{
            display: 'block', fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro,
            fontWeight: TOKENS.fontWeights.bold, letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase', color: TOKENS.colors.textGhost,
            marginBottom: TOKENS.spacing[2],
          }}>
            Audit Reports
          </span>
          <div style={{ display: 'flex', gap: TOKENS.spacing[3], flexWrap: 'wrap' }}>
            {auditReports.map((r) => (
              <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: TOKENS.spacing[1],
                  fontSize: TOKENS.fontSizes.xs, fontWeight: TOKENS.fontWeights.bold,
                  color: TOKENS.colors.accent, textDecoration: 'none',
                  padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[3]}`,
                  background: 'rgba(var(--brand-accent-rgb), 0.08)',
                  borderRadius: TOKENS.radius.full,
                  border: `${TOKENS.borders.thin} solid rgba(var(--brand-accent-rgb), 0.2)`,
                  transition: 'background var(--transition-fast)',
                }}>
                {r.label} ↗
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TermsTabBody({ vault, vaultConfig, lockPeriodDays }: {
  vault: AvailableVault; vaultConfig: VaultConfig | null; lockPeriodDays: number
}) {
  const lockPeriod = vaultConfig?.lockPeriodDays ? `${vaultConfig.lockPeriodDays} days` : vault.lockPeriod
  const truncatedVault = vaultConfig?.vaultAddress
    ? `${vaultConfig.vaultAddress.slice(0, 6)}…${vaultConfig.vaultAddress.slice(-4)}`
    : undefined
  const penalty = vaultConfig?.earlyWithdrawalPenalty ?? vault.earlyWithdrawalPenalty

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[5] }}>
      {/* Lock period timeline */}
      <div style={{
        padding: TOKENS.spacing[4],
        background: TOKENS.colors.bgTertiary,
        borderRadius: TOKENS.radius.md,
        border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
      }}>
        <div style={{
          fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro,
          fontWeight: TOKENS.fontWeights.bold, letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase', color: TOKENS.colors.textGhost,
          marginBottom: TOKENS.spacing[3],
        }}>
          Lock period timeline
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[2], position: 'relative' }}>
          {/* Start dot */}
          <div style={{
            width: 8, height: 8, borderRadius: TOKENS.radius.full,
            background: TOKENS.colors.accent, flexShrink: 0,
            boxShadow: `0 0 8px rgba(var(--brand-accent-rgb), 0.5)`,
          }} />
          {/* Bar */}
          <div style={{
            flex: 1, height: 2, background: TOKENS.colors.borderSubtle, borderRadius: 1,
            position: 'relative',
          }}>
            <div aria-hidden style={{
              position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
              fontFamily: TOKENS.fonts.mono, fontSize: '9px',
              color: TOKENS.colors.textGhost, whiteSpace: 'nowrap',
            }}>
              {lockPeriod}
            </div>
          </div>
          {/* End dot */}
          <div style={{
            width: 8, height: 8, borderRadius: TOKENS.radius.full,
            background: TOKENS.colors.bgTertiary,
            border: `${TOKENS.borders.thick} solid ${TOKENS.colors.borderStrong}`,
            flexShrink: 0,
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: TOKENS.spacing[2],
          fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro,
          color: TOKENS.colors.textGhost,
        }}>
          <span>Deposit date</span>
          <span>Maturity</span>
        </div>
      </div>

      {/* Terms grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        columnGap: TOKENS.spacing[8], rowGap: TOKENS.spacing[4],
      }}>
        <MetaCell label="Lock period" value={lockPeriod} />
        <MetaCell label="Target unlock" value={vault.target} />
        <MetaCell label="Min deposit" value={fmtUsdCompact(vault.minDeposit)} />
        {vault.fees && <MetaCell label="Fees" value={vault.fees} />}
        {vault.token && <MetaCell label="Token" value={vault.token} />}
        {vaultConfig?.chain?.name && <MetaCell label="Network" value={vaultConfig.chain.name} />}
        {penalty && <MetaCell label="Early exit penalty" value={penalty} />}
        {truncatedVault && <MetaCell label="Vault address" value={truncatedVault} mono />}
      </div>
    </div>
  )
}

function MetaCell({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing.half }}>
      <span style={{
        fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold, letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase', color: TOKENS.colors.textGhost,
      }}>{label}</span>
      <span style={{
        fontFamily: mono ? TOKENS.fonts.mono : TOKENS.fonts.sans,
        fontSize: TOKENS.fontSizes.xs,
        fontWeight: TOKENS.fontWeights.bold,
        color: TOKENS.colors.textPrimary,
      }}>{value}</span>
    </div>
  )
}

/* ─── SCENARIO GRID (Bear / Base / Bull) ─────────────────────────────────── */
function ScenarioGrid({ apr, principal, lockPeriodDays }: {
  apr: number; principal: number; lockPeriodDays: number
}) {
  const termYears = lockPeriodDays / 365
  const scenarios = [
    { label: 'Bear', mult: 0.65, color: TOKENS.colors.danger },
    { label: 'Base', mult: 1.00, color: TOKENS.colors.accent },
    { label: 'Bull', mult: 1.35, color: '#52c97a' },
  ]
  return (
    <div style={{ marginTop: TOKENS.spacing[5] }}>
      <span style={{
        display: 'block',
        fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.display, textTransform: 'uppercase',
        color: TOKENS.colors.textGhost,
        paddingLeft: TOKENS.spacing[3],
        borderLeft: `var(--dashboard-card-border-accent-width) solid ${TOKENS.colors.borderStrong}`,
        marginBottom: TOKENS.spacing[3],
      }}>
        Scenarios
      </span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: TOKENS.spacing[3] }}>
        {scenarios.map((s) => {
          const yld = principal * ((apr * s.mult) / 100) * termYears
          const total = principal + yld
          const isBase = s.mult === 1.0
          return (
            <div key={s.label} style={{
              background: isBase ? 'rgba(var(--brand-accent-rgb), 0.05)' : TOKENS.colors.bgTertiary,
              border: `${TOKENS.borders.thin} solid ${isBase ? 'rgba(var(--brand-accent-rgb), 0.2)' : TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radius.md,
              padding: TOKENS.spacing[3],
              display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[1],
              position: 'relative', overflow: 'hidden',
            }}>
              {isBase && (
                <div aria-hidden style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(var(--brand-accent-rgb), 0.5), transparent)',
                }} />
              )}
              <span style={{
                fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro,
                fontWeight: TOKENS.fontWeights.black,
                letterSpacing: TOKENS.letterSpacing.display, textTransform: 'uppercase',
                color: s.color,
              }}>
                {s.label}
              </span>
              <span style={{
                fontSize: TOKENS.fontSizes.md, fontWeight: TOKENS.fontWeights.black,
                color: s.color, letterSpacing: VALUE_LETTER_SPACING,
                fontVariantNumeric: 'tabular-nums', lineHeight: LINE_HEIGHT.tight,
              }}>
                +{fmtUsdCompact(yld)}
              </span>
              <span style={{
                fontSize: TOKENS.fontSizes.micro, color: TOKENS.colors.textGhost,
                fontFamily: TOKENS.fonts.mono,
              }}>
                {fmtUsdCompact(total)} total
              </span>
              <span style={{
                fontSize: TOKENS.fontSizes.micro,
                color: isBase ? TOKENS.colors.textSecondary : TOKENS.colors.textGhost,
                fontFamily: TOKENS.fonts.mono,
              }}>
                {(apr * s.mult).toFixed(1)}% APR
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── PROJECTION ROW ─────────────────────────────────────────────────────── */
function ProjectionRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: `${TOKENS.spacing[2]} 0`,
      borderBottom: `${TOKENS.borders.thin} solid rgba(var(--brand-accent-rgb), 0.1)`,
    }}>
      <span style={{ fontSize: TOKENS.fontSizes.xs, fontWeight: TOKENS.fontWeights.bold, color: TOKENS.colors.textSecondary }}>
        {label}
      </span>
      <span style={{
        fontSize: TOKENS.fontSizes.md, fontWeight: TOKENS.fontWeights.black,
        color: TOKENS.colors.accent,
        letterSpacing: VALUE_LETTER_SPACING, fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
    </div>
  )
}

/* ─── AMOUNT PRESETS ─────────────────────────────────────────────────────── */
function AmountPresets({ minDeposit, currentAmount, onSelect }: {
  minDeposit: number; currentAmount: number; onSelect: (v: number) => void
}) {
  const raw = AMOUNT_PRESET_MULTIPLIERS.map(m => minDeposit * m)
  const presets = Array.from(new Set(raw)).filter(n => n >= minDeposit).slice(0, AMOUNT_PRESET_MULTIPLIERS.length)
  return (
    <div style={{ display: 'flex', gap: TOKENS.spacing[2], marginTop: TOKENS.spacing[3], flexWrap: 'wrap' }}>
      {presets.map((value) => {
        const active = Math.round(currentAmount) === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            style={{
              flex: '1 1 auto', minWidth: 0,
              padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
              background: active ? 'rgba(var(--brand-accent-rgb), 0.12)' : TOKENS.colors.bgTertiary,
              border: `${TOKENS.borders.thin} solid ${active ? TOKENS.colors.accent : TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radius.full,
              color: active ? TOKENS.colors.accent : TOKENS.colors.textSecondary,
              fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.xs,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              cursor: 'pointer', transition: 'all var(--transition-fast)',
              boxShadow: active ? `0 0 10px rgba(var(--brand-accent-rgb), 0.18)` : 'none',
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

/* ─── DEPLOY BUTTON ──────────────────────────────────────────────────────── */
function DeployButton({ isReady, isDepositing, num, onClick }: {
  isReady: boolean; isDepositing: boolean; num: number; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      disabled={!isReady || isDepositing}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        height: TOKENS.control.heightXl,
        padding: `0 ${TOKENS.spacing[5]}`,
        background: isReady ? TOKENS.colors.accent : TOKENS.colors.bgTertiary,
        color: isReady ? TOKENS.colors.black : TOKENS.colors.textGhost,
        border: `${TOKENS.borders.thin} solid ${isReady ? TOKENS.colors.accent : TOKENS.colors.borderSubtle}`,
        borderRadius: TOKENS.radius.md,
        fontSize: TOKENS.fontSizes.sm,
        fontWeight: TOKENS.fontWeights.black,
        fontFamily: TOKENS.fonts.mono,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        cursor: isReady && !isDepositing ? 'pointer' : 'not-allowed',
        transition: 'all var(--transition-fast)',
        opacity: isDepositing ? 0.7 : 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: TOKENS.spacing[2],
        boxShadow: isReady
          ? hovered
            ? `0 4px 20px rgba(var(--brand-accent-rgb), 0.45), 0 0 0 1px rgba(var(--brand-accent-rgb), 0.3)`
            : `0 0 16px rgba(var(--brand-accent-rgb), 0.25)`
          : 'none',
        transform: isReady && hovered ? 'translateY(-1px)' : 'translateY(0)',
        filter: isReady && hovered ? 'brightness(1.08)' : 'none',
      }}
      aria-label={isReady ? `Deploy ${fmtUsd(num)}` : 'Complete form to deploy'}
      aria-disabled={!isReady || isDepositing}
    >
      {isDepositing
        ? 'Confirming…'
        : isReady
          ? <><span>Deploy capital</span><span style={{ opacity: 0.5 }}>·</span><span style={{ letterSpacing: VALUE_LETTER_SPACING }}>{fmtUsd(num)}</span></>
          : num > 0
            ? 'Complete review'
            : 'Enter amount to continue'}
    </button>
  )
}

/* ─── COLLAPSIBLE PRE-FLIGHT ─────────────────────────────────────────────── */
function CollapsiblePreFlight({ vault, depositAmount, onApprove, isApproving, onPreFlightReady }: {
  vault: AvailableVault; depositAmount: string; onApprove: () => void
  isApproving: boolean; onPreFlightReady?: (ready: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)

  const handleReadyChange = (r: boolean) => {
    setReady(r)
    onPreFlightReady?.(r)
  }

  useEffect(() => { if (!ready) setOpen(true) }, [ready])

  return (
    <div style={{
      background: TOKENS.colors.black,
      border: `${TOKENS.borders.thin} solid ${ready ? TOKENS.colors.borderSubtle : TOKENS.colors.borderStrong}`,
      borderRadius: TOKENS.radius.lg,
      overflow: 'hidden',
      transition: 'border-color var(--transition-base)',
      flexShrink: 0,
    }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: TOKENS.spacing[3],
          background: 'transparent', border: 'none',
          padding: `${TOKENS.spacing[4]} ${TOKENS.spacing[5]}`,
          cursor: 'pointer',
        }}
        aria-expanded={open}
      >
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: TOKENS.spacing[2],
          fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display, textTransform: 'uppercase',
          color: ready ? TOKENS.colors.accent : TOKENS.colors.textGhost,
        }}>
          <span style={{
            width: TOKENS.spacing[2], height: TOKENS.spacing[2],
            borderRadius: TOKENS.radius.full, background: 'currentColor',
          }} aria-hidden />
          Pre-flight · {ready ? 'all checks passed' : 'review required'}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke={TOKENS.colors.textGhost}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform var(--transition-base)', flexShrink: 0,
          }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: `0 ${TOKENS.spacing[5]} ${TOKENS.spacing[5]}` }}>
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

/** Compact axis label */
function fmtUsdAxis(n: number): string {
  if (!isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
  if (abs >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${Math.round(n)}`
}
