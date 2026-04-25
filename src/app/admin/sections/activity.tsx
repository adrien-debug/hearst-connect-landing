'use client'

import { TOKENS, MONO } from '@/components/connect/constants'
import { useDemoPortfolio } from '@/hooks/useDemoPortfolio'

const SYSTEM_EVENTS = [
  { id: 1, type: 'system', message: 'System initialized', time: '2026-04-24 08:00:00', level: 'info' },
  { id: 2, type: 'vault', message: 'Vault "HashVault Prime #1" registered', time: '2026-04-24 08:15:00', level: 'success' },
  { id: 3, type: 'config', message: 'APR configuration updated', time: '2026-04-24 09:30:00', level: 'info' },
  { id: 4, type: 'user', message: 'Admin login from 192.168.1.100', time: '2026-04-24 10:00:00', level: 'info' },
]

export function ActivitySection() {
  const { history } = useDemoPortfolio()

  // Generate activity from portfolio history
  const positionActivity = history.slice(0, 10).map((h, i) => ({
    id: `hist-${i}`,
    type: h.type === 'deposit' ? 'deposit' : h.type,
    message: `${h.type === 'deposit' ? 'Deposit' : h.type === 'claim' ? 'Claim' : 'Withdraw'} of $${h.amount.toLocaleString()} ${h.type === 'deposit' ? 'into' : 'from'} ${h.vaultName}`,
    time: new Date(h.timestamp).toISOString().replace('T', ' ').slice(0, 19),
    level: 'success' as const,
  }))

  const allActivity = [...SYSTEM_EVENTS, ...positionActivity].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
  )

  return (
    <div style={styles.container}>
      {/* Stats */}
      <div style={styles.stats}>
        <ActivityStat label="Total Events" value={allActivity.length} />
        <ActivityStat label="System Events" value={SYSTEM_EVENTS.length} />
        <ActivityStat label="User Actions" value={positionActivity.length} />
        <ActivityStat label="Last 24h" value={allActivity.filter((a) => isRecent(a.time, 24)).length} />
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <button style={{ ...styles.filterBtn, background: TOKENS.colors.accent, color: TOKENS.colors.black }}>
          All
        </button>
        <button style={styles.filterBtn}>System</button>
        <button style={styles.filterBtn}>Vaults</button>
        <button style={styles.filterBtn}>User</button>
      </div>

      {/* Activity List */}
      <div style={styles.card}>
        <div style={styles.listHeader}>
          <span style={styles.headerCell}>Event</span>
          <span style={styles.headerCell}>Type</span>
          <span style={styles.headerCell}>Timestamp</span>
          <span style={styles.headerCell}>Level</span>
        </div>
        <div style={styles.list}>
          {allActivity.map((event) => (
            <div key={event.id} style={styles.row}>
              <div style={styles.cellEvent}>
                <div style={styles.eventIcon}>{getIcon(event.type)}</div>
                <span style={styles.eventMessage}>{event.message}</span>
              </div>
              <span style={styles.cellType}>{event.type}</span>
              <span style={styles.cellTime}>{event.time}</span>
              <LevelBadge level={event.level} />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div style={styles.pagination}>
        <span style={styles.pageInfo}>Showing {allActivity.length} events</span>
        <div style={styles.pageButtons}>
          <button style={styles.pageBtn} disabled>Previous</button>
          <button style={styles.pageBtn} disabled>Next</button>
        </div>
      </div>
    </div>
  )
}

function ActivityStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statValue}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  )
}

function LevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    info: TOKENS.colors.textSecondary,
    success: TOKENS.colors.accent,
    warning: 'var(--color-warning)',
    error: TOKENS.colors.danger,
  }

  return (
    <span
      style={{
        ...styles.levelBadge,
        color: colors[level] || TOKENS.colors.textSecondary,
        borderColor: colors[level] || TOKENS.colors.textSecondary,
      }}
    >
      {level}
    </span>
  )
}

function getIcon(type: string) {
  switch (type) {
    case 'system':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    case 'vault':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    case 'deposit':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      )
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      )
  }
}

function isRecent(time: string, hours: number): boolean {
  const eventTime = new Date(time).getTime()
  const cutoff = Date.now() - hours * 3600000
  return eventTime > cutoff
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: TOKENS.spacing[4],
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: TOKENS.spacing[4],
  },
  statCard: {
    background: TOKENS.colors.bgSidebar,
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.lg,
    padding: TOKENS.spacing[4],
    display: 'flex',
    flexDirection: 'column',
    gap: TOKENS.spacing[1],
  },
  statValue: {
    fontSize: TOKENS.fontSizes.xl,
    fontWeight: TOKENS.fontWeights.black,
    color: TOKENS.colors.accent,
  },
  statLabel: {
    fontSize: TOKENS.fontSizes.xs,
    color: TOKENS.colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: TOKENS.fontWeights.bold,
  },
  filters: {
    display: 'flex',
    gap: TOKENS.spacing[2],
  },
  filterBtn: {
    padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[4]}`,
    background: TOKENS.colors.bgSidebar,
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.md,
    color: TOKENS.colors.textSecondary,
    fontSize: TOKENS.fontSizes.xs,
    fontWeight: TOKENS.fontWeights.bold,
    cursor: 'pointer',
  },
  card: {
    background: TOKENS.colors.bgSidebar,
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.lg,
    overflow: 'hidden',
  },
  listHeader: {
    display: 'grid',
    gridTemplateColumns: '3fr 1fr 2fr 1fr',
    gap: TOKENS.spacing[4],
    padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
    background: TOKENS.colors.bgApp,
    fontFamily: MONO,
    fontSize: TOKENS.fontSizes.micro,
    fontWeight: TOKENS.fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: TOKENS.letterSpacing.display,
    color: TOKENS.colors.textSecondary,
    borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
  },
  headerCell: {
    textAlign: 'left',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '3fr 1fr 2fr 1fr',
    gap: TOKENS.spacing[4],
    alignItems: 'center',
    padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
    borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
  },
  cellEvent: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[3],
  },
  eventIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    background: TOKENS.colors.bgTertiary,
    borderRadius: TOKENS.radius.sm,
    color: TOKENS.colors.accent,
  },
  eventMessage: {
    fontSize: TOKENS.fontSizes.sm,
    color: TOKENS.colors.textPrimary,
  },
  cellType: {
    fontFamily: MONO,
    fontSize: TOKENS.fontSizes.micro,
    textTransform: 'uppercase',
    color: TOKENS.colors.textSecondary,
  },
  cellTime: {
    fontFamily: MONO,
    fontSize: TOKENS.fontSizes.xs,
    color: TOKENS.colors.textGhost,
  },
  levelBadge: {
    display: 'inline-block',
    padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[2]}`,
    border: `1px solid`,
    borderRadius: TOKENS.radius.sm,
    fontFamily: MONO,
    fontSize: TOKENS.fontSizes.micro,
    fontWeight: TOKENS.fontWeights.bold,
    textTransform: 'uppercase',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
  },
  pageInfo: {
    fontSize: TOKENS.fontSizes.sm,
    color: TOKENS.colors.textSecondary,
  },
  pageButtons: {
    display: 'flex',
    gap: TOKENS.spacing[2],
  },
  pageBtn: {
    padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[4]}`,
    background: TOKENS.colors.bgSidebar,
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.md,
    color: TOKENS.colors.textSecondary,
    fontSize: TOKENS.fontSizes.sm,
    cursor: 'pointer',
  },
}
