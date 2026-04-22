import { Label } from '@/components/ui/label'
import { TOKENS } from './constants'

export function ProjectionLens({
  kicker,
  title,
  subtitle,
  children,
  compact,
}: {
  kicker: string
  title: string
  subtitle: string
  children: React.ReactNode
  compact?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? TOKENS.spacing[4] : TOKENS.spacing[6],
        minHeight: 0,
        height: '100%',
      }}
    >
      <header
        className="bg-transparent"
        style={{
          paddingBottom: compact ? TOKENS.spacing[2] : TOKENS.spacing[4],
        }}
      >
        <Label id="lens-kicker" tone="scene" variant="text">
          {kicker}
        </Label>
        <h2
          style={{
            margin: `${TOKENS.spacing[2]} 0 0 0`,
            fontSize: compact ? TOKENS.fontSizes.lg : TOKENS.fontSizes.xl,
            fontWeight: TOKENS.fontWeights.black,
            textTransform: 'uppercase' as const,
            letterSpacing: TOKENS.letterSpacing.tight,
            color: TOKENS.colors.textPrimary,
            lineHeight: 1.05,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: `${TOKENS.spacing[2]} 0 0 0`,
            color: TOKENS.colors.textSecondary,
            fontSize: compact ? TOKENS.fontSizes.micro : TOKENS.fontSizes.sm,
            lineHeight: 1.45,
            maxWidth: 720,
          }}
        >
          {subtitle}
        </p>
      </header>
      {children}
    </div>
  )
}

export function MetricTilesRow({
  children,
  columns = 2,
  compact,
}: {
  children: React.ReactNode
  columns?: number
  compact?: boolean
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`,
        gap: compact ? TOKENS.spacing[2] : TOKENS.spacing[3],
        padding: 0,
      }}
    >
      {children}
    </div>
  )
}

export function MetricTile({ label, value, detail, accent, compact }: { label: string; value: string; detail: string; accent?: boolean; compact?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? TOKENS.spacing[2] : TOKENS.spacing[3],
        padding: compact ? `${TOKENS.spacing[2]} 0` : `${TOKENS.spacing[3]} 0`,
        minWidth: 0,
      }}
    >
      <Label id={`lens-tile-${label}`} tone="scene" variant="text">
        {label}
      </Label>
      <div
        style={{
          fontSize: compact ? TOKENS.fontSizes.lg : TOKENS.fontSizes.xl,
          fontWeight: TOKENS.fontWeights.black,
          color: accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
        }}
        aria-label={`${label} ${value}`}
      >
        {value}
      </div>
      <div
        style={{ fontSize: TOKENS.fontSizes.micro, color: TOKENS.colors.textSecondary, lineHeight: 1.45 }}
      >
        {detail}
      </div>
    </div>
  )
}

