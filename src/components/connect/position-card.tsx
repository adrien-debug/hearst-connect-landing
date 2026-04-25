'use client'

import { TOKENS, fmtUsdCompact, VALUE_LETTER_SPACING } from './constants'
import type { PositionData } from '@/types/position'
import { fitValue, type SmartFitMode } from './smart-fit'

interface PositionCardProps {
  data: PositionData
  mode: SmartFitMode
}

export function PositionCard({ data, mode }: PositionCardProps) {
  return (
    <div style={{
      background: TOKENS.colors.bgSecondary,
      borderRadius: TOKENS.radius.lg,
      padding: fitValue(mode, {
        normal: TOKENS.spacing[3],
        tight: TOKENS.spacing[2],
        limit: TOKENS.spacing[2],
      }),
      border: `1px solid ${TOKENS.colors.borderSubtle}`,
    }}>
      {/* Header — Position Value */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: TOKENS.spacing[4],
        paddingBottom: TOKENS.spacing[3],
        borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
      }}>
        <div>
          <div style={{
            fontSize: TOKENS.fontSizes.micro,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
            color: TOKENS.colors.textSecondary,
          }}>
            Position Value
          </div>
          <div style={{
            fontSize: fitValue(mode, {
              normal: TOKENS.fontSizes.xxl,
              tight: TOKENS.fontSizes.xl,
              limit: TOKENS.fontSizes.lg,
            }),
            fontWeight: TOKENS.fontWeights.black,
            letterSpacing: VALUE_LETTER_SPACING,
            color: TOKENS.colors.textPrimary,
            marginTop: TOKENS.spacing[2],
          }}>
            {fmtUsdCompact(data.positionValue)}
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: TOKENS.spacing[2],
        }}>
          {data.isTargetReached && (
            <span style={{
              padding: `${TOKENS.spacing[1]}px ${TOKENS.spacing[2]}px`,
              background: TOKENS.colors.accentSubtle,
              borderRadius: TOKENS.radius.sm,
              fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.bold,
              color: TOKENS.colors.accent,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
            }}>
              Target Reached
            </span>
          )}
        </div>
      </div>

      {/* Core Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: TOKENS.spacing[4],
        marginBottom: TOKENS.spacing[4],
      }}>
        <MetricItem
          label="Capital Deployed"
          value={fmtUsdCompact(data.capitalDeployed)}
          mode={mode}
        />
        <MetricItem
          label="Accrued Yield"
          value={`+${fmtUsdCompact(data.accruedYield)}`}
          accent
          mode={mode}
        />
      </div>

      {/* Timeline */}
      <div style={{
        background: TOKENS.colors.bgTertiary,
        borderRadius: TOKENS.radius.sm,
        padding: TOKENS.spacing[3],
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: TOKENS.spacing[2],
        }}>
          <span style={{
            fontSize: TOKENS.fontSizes.micro,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
            color: TOKENS.colors.textSecondary,
          }}>
            Unlock Timeline
          </span>
          <span style={{
            fontSize: TOKENS.fontSizes.micro,
            fontFamily: TOKENS.fonts.mono,
            color: data.unlockTimeline.daysRemaining < 30
              ? TOKENS.colors.accent
              : TOKENS.colors.textGhost,
          }}>
            {data.unlockTimeline.daysRemaining} days
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '4px',
          background: TOKENS.colors.black,
          borderRadius: TOKENS.radius.sm,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${data.unlockTimeline.progressPercent}%`,
            height: '100%',
            background: data.unlockTimeline.progressPercent >= 100
              ? TOKENS.colors.accent
              : TOKENS.colors.gray700,
            borderRadius: TOKENS.radius.sm,
          }} />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: TOKENS.spacing[2],
          fontSize: TOKENS.fontSizes.micro,
          color: TOKENS.colors.textGhost,
        }}>
          <span>Progress: {data.unlockTimeline.progressPercent}%</span>
          <span>{data.unlockTimeline.maturityDate}</span>
        </div>
      </div>

      {/* Epoch badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: TOKENS.spacing[2],
        marginTop: TOKENS.spacing[3],
        padding: `${TOKENS.spacing[2]}px ${TOKENS.spacing[3]}px`,
        background: TOKENS.colors.bgTertiary,
        borderRadius: TOKENS.radius.sm,
      }}>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: TOKENS.colors.accent,
        }} />
        <span style={{
          fontSize: TOKENS.fontSizes.micro,
          fontWeight: TOKENS.fontWeights.bold,
          color: TOKENS.colors.textSecondary,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
        }}>
          Epoch {data.epoch.currentEpoch} · {data.epoch.epochProgress}%
        </span>
      </div>
    </div>
  )
}

function MetricItem({
  label,
  value,
  accent = false,
  mode,
}: {
  label: string
  value: string
  accent?: boolean
  mode: SmartFitMode
}) {
  return (
    <div>
      <div style={{
        fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        color: TOKENS.colors.textSecondary,
        marginBottom: TOKENS.spacing[2],
      }}>
        {label}
      </div>
      <div style={{
        fontSize: fitValue(mode, {
          normal: TOKENS.fontSizes.lg,
          tight: TOKENS.fontSizes.md,
          limit: TOKENS.fontSizes.md,
        }),
        fontWeight: TOKENS.fontWeights.black,
        letterSpacing: VALUE_LETTER_SPACING,
        color: accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
      }}>
        {value}
      </div>
    </div>
  )
}
