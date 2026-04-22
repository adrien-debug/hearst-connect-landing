import { Label } from '@/components/ui/label'
import { TOKENS } from './constants'
import type { SmartFitMode } from './smart-fit'
import { fitValue } from './smart-fit'

export function HeroVaultStage({
  mode,
  kicker,
  title,
  description,
  sideLabel,
  sideValue,
  sideBadge,
}: {
  mode: SmartFitMode
  kicker: string
  title: string
  description: string
  sideLabel: string
  sideValue: string
  sideBadge: string
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: fitValue(mode, { normal: '1.1fr 0.45fr', tight: '1fr 0.42fr', limit: '1fr' }),
        gap: fitValue(mode, { normal: TOKENS.spacing[6], tight: TOKENS.spacing[4], limit: TOKENS.spacing[3] }),
        paddingBottom: fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[2] }),
        borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
      }}
    >
      <div>
        <Label id="hero-vault-kicker" tone="scene" variant="text">
          {kicker}
        </Label>
        <h2
          style={{
            margin: 0,
            fontSize: fitValue(mode, { normal: TOKENS.fontSizes.xxxl, tight: TOKENS.fontSizes.xl, limit: TOKENS.fontSizes.lg }),
            fontWeight: TOKENS.fontWeights.black,
            letterSpacing: TOKENS.letterSpacing.tight,
            lineHeight: 0.95,
            color: TOKENS.colors.textPrimary,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: `${fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[2] })} 0 0 0`,
            maxWidth: 700,
            fontSize: fitValue(mode, { normal: TOKENS.fontSizes.sm, tight: TOKENS.fontSizes.sm, limit: TOKENS.fontSizes.micro }),
            lineHeight: 1.5,
            color: TOKENS.colors.textSecondary,
          }}
        >
          {description}
        </p>
      </div>
      <div
        style={{
          textAlign: mode === 'limit' ? 'left' : 'right',
          minWidth: 0,
        }}
      >
        <div id="hero-side-metric" style={{ textAlign: mode === 'limit' ? 'left' : 'right' }}>
          <Label id="side-value-label" tone="scene" variant="text">
            {sideLabel}
          </Label>
          <div
            aria-label={`${sideLabel} ${sideValue}`}
            style={{
              fontSize: fitValue(mode, { normal: TOKENS.fontSizes.xxl, tight: TOKENS.fontSizes.xl, limit: TOKENS.fontSizes.lg }),
              fontWeight: TOKENS.fontWeights.black,
              color: TOKENS.colors.textPrimary,
            }}
          >
            {sideValue}
          </div>
          <div
            style={{
              marginTop: TOKENS.spacing[2],
              display: 'inline-flex',
              padding: `4px ${TOKENS.spacing[3]}`,
              background: TOKENS.colors.textPrimary,
              color: TOKENS.colors.black,
              fontSize: TOKENS.fontSizes.xs,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
            }}
          >
            {sideBadge}
          </div>
        </div>
      </div>
    </div>
  )
}
