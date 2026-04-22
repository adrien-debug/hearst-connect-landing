import { Label } from '@/components/ui/label'
import { TOKENS, VALUE_LETTER_SPACING, LINE_HEIGHT } from './constants'
import type { SmartFitMode } from './smart-fit'
import { fitValue, useShellPadding } from './smart-fit'

/** H2 title size by mode — standardized per design system */
const H2_SIZE: Record<SmartFitMode, string> = {
  normal: TOKENS.fontSizes.xxl, // 40px
  tight: TOKENS.fontSizes.xl, // 24px
  limit: TOKENS.fontSizes.lg, // 20px
}

/** Side metric value size by mode */
const SIDE_VALUE_SIZE: Record<SmartFitMode, string> = {
  normal: TOKENS.fontSizes.xxl, // 40px
  tight: TOKENS.fontSizes.xl, // 24px
  limit: TOKENS.fontSizes.lg, // 20px
}

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
  const { gap } = useShellPadding(mode)
  return (
    <div
      className="bg-gradient-to-b from-transparent to-white/[0.02]"
      style={{
        display: 'grid',
        gridTemplateColumns: fitValue(mode, { normal: '1.1fr 0.45fr', tight: '1fr 0.42fr', limit: '1fr' }),
        gap,
        paddingBottom: TOKENS.spacing[4],
      }}
    >
      <div>
        <Label id="hero-vault-kicker" tone="scene" variant="text">
          {kicker}
        </Label>
        <h2
          style={{
            margin: 0,
            fontSize: H2_SIZE[mode],
            fontWeight: TOKENS.fontWeights.black,
            letterSpacing: TOKENS.letterSpacing.tight,
            lineHeight: LINE_HEIGHT.title,
            color: TOKENS.colors.textPrimary,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: `${TOKENS.spacing[4]} 0 0 0`,
            maxWidth: 700,
            fontSize: TOKENS.fontSizes.sm,
            lineHeight: LINE_HEIGHT.body,
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
              fontSize: SIDE_VALUE_SIZE[mode],
              fontWeight: TOKENS.fontWeights.black,
              letterSpacing: VALUE_LETTER_SPACING,
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
