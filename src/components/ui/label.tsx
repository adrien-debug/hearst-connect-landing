import type { CSSProperties, ReactNode } from 'react'
import { TOKENS } from '@/components/connect/constants'

export type ConnectLabelProps = {
  children: ReactNode
  id?: string
  /** `bar` = accent rail (connect design system), `text` = discrete uppercase without rail */
  variant?: 'bar' | 'text'
  /** `scene` = light copy on dark ground, `sidebar` = on black sidebar, `inverted` = on accent chip */
  tone?: 'scene' | 'sidebar' | 'inverted'
  className?: string
  style?: CSSProperties
}

const toneColor: Record<NonNullable<ConnectLabelProps['tone']>, string> = {
  scene: TOKENS.colors.textGhost,
  sidebar: 'rgba(255,255,255,0.45)',
  inverted: 'rgba(0,0,0,0.55)',
}

export function Label({ children, id, variant = 'bar', tone = 'scene', className, style }: ConnectLabelProps) {
  if (variant === 'text') {
    return (
      <div
        id={id}
        style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.micro,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          color: toneColor[tone],
          marginBottom: TOKENS.spacing[2],
          ...style,
        }}
        className={className}
      >
        {children}
      </div>
    )
  }
  return (
    <div
      id={id}
      style={{
        fontFamily: TOKENS.fonts.mono,
        fontSize: TOKENS.fontSizes.xs,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        color: toneColor[tone],
        borderLeft: `3px solid ${TOKENS.colors.accent}`,
        paddingLeft: TOKENS.spacing[3],
        marginBottom: TOKENS.spacing[3],
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  )
}
