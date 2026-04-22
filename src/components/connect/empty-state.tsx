import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { TOKENS } from './constants'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div
      role="status"
      aria-label={title}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: TOKENS.spacing[4],
        padding: `${TOKENS.spacing[8]} ${TOKENS.spacing[4]}`,
      }}
    >
      <Label tone="scene" variant="text">
        {title}
      </Label>
      <p
        style={{
          margin: 0,
          maxWidth: 420,
          fontSize: TOKENS.fontSizes.sm,
          color: TOKENS.colors.textSecondary,
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      {action}
    </div>
  )
}
