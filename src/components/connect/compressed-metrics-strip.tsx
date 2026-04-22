import { Label } from '@/components/ui/label'
import { TOKENS, VALUE_LETTER_SPACING } from './constants'
import type { SmartFitMode } from './smart-fit'
import { fitValue, useShellPadding } from './smart-fit'

export function CompressedMetricsStrip({
  items,
  mode,
}: {
  items: { id: string; label: string; value: string; accent?: boolean }[]
  mode: SmartFitMode
}) {
  const { gap } = useShellPadding(mode)
  return (
    <div
      className="bg-transparent"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))`,
        gap,
        paddingBottom: TOKENS.spacing[4],
      }}
    >
      {items.map((m) => (
        <div key={m.id}>
          <Label id={`metric-${m.id}`} tone="scene" variant="text">
            {m.label}
          </Label>
          <div
            id={`metric-${m.id}-value`}
            style={{
              fontSize: fitValue(mode, { normal: TOKENS.fontSizes.xl, tight: TOKENS.fontSizes.lg, limit: TOKENS.fontSizes.md }),
              fontWeight: TOKENS.fontWeights.black,
              letterSpacing: VALUE_LETTER_SPACING,
              color: m.accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
              lineHeight: 1.05,
            }}
          >
            {m.value}
          </div>
        </div>
      ))}
    </div>
  )
}
