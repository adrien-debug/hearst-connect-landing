import { Label } from '@/components/ui/label'
import { TOKENS } from './constants'
import type { SmartFitMode } from './smart-fit'
import { fitValue } from './smart-fit'

export function CompressedMetricsStrip({
  items,
  mode,
}: {
  items: { id: string; label: string; value: string; accent?: boolean }[]
  mode: SmartFitMode
}) {
  return (
    <div
      className="bg-gradient-to-b from-transparent to-white/[0.02]"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))`,
        gap: fitValue(mode, {
          normal: TOKENS.spacing[6],
          tight: TOKENS.spacing[4],
          limit: TOKENS.spacing[3],
        }),
        paddingBottom: fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[2] }),
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
              letterSpacing: '-0.03em',
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
