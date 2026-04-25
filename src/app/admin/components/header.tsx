'use client'

import { ADMIN_TOKENS as TOKENS, MONO } from '../constants'
import { ThemeToggle } from '@/components/theme/theme-toggle'

interface AdminHeaderProps {
  title: string
  subtitle: string
}

export function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  return (
    <header style={styles.header}>
      <div>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.subtitle}>{subtitle}</p>
      </div>
      <div style={styles.meta}>
        <ThemeToggle variant="minimal" size="sm" />
        <span style={styles.version}>v1.0.0</span>
        <div style={styles.status}>
          <span style={styles.statusDot} />
          <span style={styles.statusText}>System Online</span>
        </div>
      </div>
    </header>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${TOKENS.spacing[6]} ${TOKENS.spacing[6]} ${TOKENS.spacing[4]}`,
  },
  title: {
    fontSize: TOKENS.fontSizes.xl,
    fontWeight: TOKENS.fontWeights.black,
    textTransform: 'uppercase',
    letterSpacing: TOKENS.letterSpacing.normal,
    margin: `0 0 ${TOKENS.spacing[1]} 0`,
  },
  subtitle: {
    fontSize: TOKENS.fontSizes.sm,
    color: TOKENS.colors.textSecondary,
    margin: 0,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[4],
  },
  version: {
    fontFamily: MONO,
    fontSize: TOKENS.fontSizes.xs,
    color: TOKENS.colors.textGhost,
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[2],
    padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
    background: TOKENS.colors.bgTertiary,
    borderRadius: TOKENS.radius.md,
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: TOKENS.colors.accent,
  },
  statusText: {
    fontFamily: MONO,
    fontSize: TOKENS.fontSizes.micro,
    fontWeight: TOKENS.fontWeights.bold,
    color: TOKENS.colors.textSecondary,
    letterSpacing: TOKENS.letterSpacing.normal,
  },
}
