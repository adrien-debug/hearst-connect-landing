'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ADMIN_TOKENS as TOKENS, MONO } from '../constants'
import type { DbActivityEvent } from '@/lib/db/schema'

const SYSTEM_EVENTS: { id: string; type: string; message: string; time: string; level: string }[] = []

interface ActivityEvent {
  id: string | number
  type: string
  message: string
  time: string
  level: string
  source?: 'system' | 'live'
}

export function ActivitySection() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'system' | 'live'>('all')

  // Fetch real user activities from DB (admin endpoint)
  const { data: liveActivities = [], isLoading } = useQuery<DbActivityEvent[]>({
    queryKey: ['admin-all-activity'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/admin/activity?limit=100', {
          credentials: 'include',
          headers: { 'x-admin-key': 'hearst-admin-dev-key' },
        })
        if (!res.ok) {
          console.error('[ActivitySection] Failed to fetch admin activity:', res.status)
          return []
        }
        const data = await res.json()
        return data.events || []
      } catch (error) {
        console.error('[ActivitySection] Error fetching admin activity:', error)
        return []
      }
    },
    staleTime: 1000 * 30, // 30 seconds
  })

  // Convert live DB activities to activity format
  const liveActivity: ActivityEvent[] = liveActivities.map((event) => ({
    id: `live-${event.id}`,
    type: event.type,
    message: `[USER] ${event.type === 'deposit' ? 'Deposit' : event.type === 'claim' ? 'Claim' : 'Withdraw'} of $${event.amount.toLocaleString()} ${event.type === 'deposit' ? 'into' : 'from'} ${event.vaultName}`,
    time: new Date(event.timestamp).toISOString().replace('T', ' ').slice(0, 19),
    level: 'success' as const,
    source: 'live' as const,
  }))

  const systemActivity: ActivityEvent[] = SYSTEM_EVENTS.map(e => ({ ...e, source: 'system' as const }))

  // Merge all activities
  const allActivity = [...systemActivity, ...liveActivity].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
  )

  // Apply filter
  const filteredActivity = activeFilter === 'all'
    ? allActivity
    : allActivity.filter(a => a.source === activeFilter)

  const totalEvents = allActivity.length
  const systemCount = systemActivity.length
  const liveCount = liveActivity.length
  const last24h = allActivity.filter((a) => isRecent(a.time, 24)).length

  return (
    <div style={styles.container}>
      {/* Stats */}
      <div style={styles.stats}>
        <ActivityStat label="Total Events" value={totalEvents} />
        <ActivityStat label="System Events" value={systemCount} />
        <ActivityStat label="User Actions" value={liveCount} accent />
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <button
          onClick={() => setActiveFilter('all')}
          style={{
            ...styles.filterBtn,
            background: activeFilter === 'all' ? TOKENS.colors.accent : TOKENS.colors.bgSidebar,
            color: activeFilter === 'all' ? TOKENS.colors.black : TOKENS.colors.textSecondary,
          }}
        >
          All ({totalEvents})
        </button>
        <button
          onClick={() => setActiveFilter('system')}
          style={{
            ...styles.filterBtn,
            background: activeFilter === 'system' ? TOKENS.colors.accent : TOKENS.colors.bgSidebar,
            color: activeFilter === 'system' ? TOKENS.colors.black : TOKENS.colors.textSecondary,
          }}
        >
          System ({systemCount})
        </button>
        <button
          onClick={() => setActiveFilter('live')}
          style={{
            ...styles.filterBtn,
            background: activeFilter === 'live' ? TOKENS.colors.accent : TOKENS.colors.bgSidebar,
            color: activeFilter === 'live' ? TOKENS.colors.black : TOKENS.colors.textSecondary,
          }}
        >
          Users ({liveCount})
        </button>
      </div>

      {/* Activity List */}
      <div style={styles.card}>
        <div style={styles.listHeader}>
          <span style={styles.headerCell}>Event</span>
          <span style={styles.headerCell}>Type</span>
          <span style={styles.headerCell}>Timestamp</span>
          <span style={styles.headerCell}>Source</span>
        </div>
        <div style={styles.list}>
          {isLoading && (
            <div style={styles.loadingRow}>
              <div style={styles.spinner} />
              <span>Loading activities...</span>
            </div>
          )}
          {!isLoading && filteredActivity.length === 0 && (
            <div style={styles.emptyRow}>No activities found for this filter</div>
          )}
          {!isLoading && filteredActivity.map((event) => (
            <div key={event.id} style={styles.row}>
              <div style={styles.cellEvent}>
                <div style={styles.eventIcon}>{getIcon(event.type)}</div>
                <span style={styles.eventMessage}>{event.message}</span>
              </div>
              <span style={styles.cellType}>{event.type}</span>
              <span style={styles.cellTime}>{event.time}</span>
              <SourceBadge source={event.source || 'system'} />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div style={styles.pagination}>
        <span style={styles.pageInfo}>
          Showing {filteredActivity.length} of {totalEvents} events
        </span>
        <div style={styles.pageButtons}>
          <button style={styles.pageBtn} disabled>Previous</button>
          <button style={styles.pageBtn} disabled>Next</button>
        </div>
      </div>
    </div>
  )
}

function ActivityStat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div style={styles.statCard}>
      <span style={{ ...styles.statValue, color: accent ? TOKENS.colors.accent : styles.statValue.color }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  )
}

function SourceBadge({ source }: { source: 'system' | 'live' }) {
  const colors: Record<string, string> = {
    system: TOKENS.colors.textSecondary,
    live: 'var(--color-info)',
  }

  return (
    <span
      style={{
        ...styles.sourceBadge,
        color: colors[source] || TOKENS.colors.textSecondary,
        borderColor: colors[source] || TOKENS.colors.textSecondary,
      }}
    >
      {source}
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
    width: TOKENS.spacing[6],
    height: TOKENS.spacing[6],
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
  sourceBadge: {
    display: 'inline-block',
    padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[2]}`,
    border: `1px solid`,
    borderRadius: TOKENS.radius.sm,
    fontFamily: MONO,
    fontSize: TOKENS.fontSizes.micro,
    fontWeight: TOKENS.fontWeights.bold,
    textTransform: 'uppercase',
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: TOKENS.spacing[3],
    padding: `${TOKENS.spacing[8]} ${TOKENS.spacing[4]}`,
    color: TOKENS.colors.textSecondary,
  },
  emptyRow: {
    padding: `${TOKENS.spacing[8]} ${TOKENS.spacing[4]}`,
    textAlign: 'center',
    color: TOKENS.colors.textGhost,
  },
  spinner: {
    width: TOKENS.spacing[5],
    height: TOKENS.spacing[5],
    border: `2px solid ${TOKENS.colors.bgTertiary}`,
    borderTopColor: TOKENS.colors.accent,
    borderRadius: TOKENS.radius.full,
    animation: 'spin 1s linear infinite',
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
