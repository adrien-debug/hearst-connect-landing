'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { DbActivityEvent } from '@/lib/db/schema'
import { useDemoMode } from '@/lib/demo/use-demo-mode'
import { DEMO_ADMIN_ACTIVITY } from '@/lib/demo/demo-data'

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
  const isDemo = useDemoMode()

  // Fetch real user activities from DB (admin endpoint)
  const { data: queriedActivities = [], isLoading: isQueryLoading } = useQuery<DbActivityEvent[]>({
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
    enabled: !isDemo,
    staleTime: 1000 * 30, // 30 seconds
  })

  const liveActivities = isDemo ? (DEMO_ADMIN_ACTIVITY as unknown as DbActivityEvent[]) : queriedActivities
  const isLoading = isDemo ? false : isQueryLoading

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
    <div className="activity-container">
      {/* Stats */}
      <div className="activity-stats">
        <ActivityStat label="Total Events" value={totalEvents} />
        <ActivityStat label="System Events" value={systemCount} />
        <ActivityStat label="User Actions" value={liveCount} accent />
      </div>

      {/* Filters */}
      <div className="activity-filters">
        <button
          onClick={() => setActiveFilter('all')}
          className={`activity-filter-btn ${activeFilter === 'all' ? 'activity-filter-btn-active' : ''}`}
        >
          All ({totalEvents})
        </button>
        <button
          onClick={() => setActiveFilter('system')}
          className={`activity-filter-btn ${activeFilter === 'system' ? 'activity-filter-btn-active' : ''}`}
        >
          System ({systemCount})
        </button>
        <button
          onClick={() => setActiveFilter('live')}
          className={`activity-filter-btn ${activeFilter === 'live' ? 'activity-filter-btn-active' : ''}`}
        >
          Users ({liveCount})
        </button>
      </div>

      {/* Activity List */}
      <div className="activity-card">
        <div className="activity-list-header">
          <span className="activity-header-cell">Event</span>
          <span className="activity-header-cell">Type</span>
          <span className="activity-header-cell">Timestamp</span>
          <span className="activity-header-cell">Source</span>
        </div>
        <div className="activity-list">
          {isLoading && (
            <div className="activity-loading-row">
              <div className="activity-spinner" />
              <span>Loading activities...</span>
            </div>
          )}
          {!isLoading && filteredActivity.length === 0 && (
            <div className="activity-empty-row">No activities found for this filter</div>
          )}
          {!isLoading && filteredActivity.map((event) => (
            <div key={event.id} className="activity-row">
              <div className="activity-cell-event">
                <div className="activity-event-icon">{getIcon(event.type)}</div>
                <span className="activity-event-message">{event.message}</span>
              </div>
              <span className="activity-cell-type">{event.type}</span>
              <span className="activity-cell-time">{event.time}</span>
              <SourceBadge source={event.source || 'system'} />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="activity-pagination">
        <span className="activity-page-info">
          Showing {filteredActivity.length} of {totalEvents} events
        </span>
        <div className="activity-page-buttons">
          <button className="activity-page-btn" disabled>Previous</button>
          <button className="activity-page-btn" disabled>Next</button>
        </div>
      </div>
    </div>
  )
}

function ActivityStat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="activity-stat-card">
      <span className={`activity-stat-value ${accent ? '' : ''}`}>{value}</span>
      <span className="activity-stat-label">{label}</span>
    </div>
  )
}

function SourceBadge({ source }: { source: 'system' | 'live' }) {
  return (
    <span className={`activity-source-badge activity-source-badge-${source}`}>
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
