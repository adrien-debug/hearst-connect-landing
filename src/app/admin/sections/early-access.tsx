'use client'

import { useQuery } from '@tanstack/react-query'
import type { DbEarlyAccessSignup } from '@/lib/db/schema'

interface EarlyAccessResponse {
  signups: DbEarlyAccessSignup[]
  total: number
}

const ADMIN_KEY_HEADER = { 'x-admin-key': 'hearst-admin-dev-key' }

export function EarlyAccessSection() {
  const { data, isLoading, refetch, isFetching } = useQuery<EarlyAccessResponse>({
    queryKey: ['admin-early-access'],
    queryFn: async () => {
      const res = await fetch('/api/admin/early-access?limit=5000', {
        credentials: 'include',
        headers: ADMIN_KEY_HEADER,
      })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    staleTime: 30_000,
  })

  const signups = data?.signups ?? []
  const total = data?.total ?? 0

  const handleExport = async () => {
    const res = await fetch('/api/admin/early-access?format=csv&limit=50000', {
      credentials: 'include',
      headers: ADMIN_KEY_HEADER,
    })
    if (!res.ok) {
      console.error('CSV export failed', res.status)
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `early-access-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const last24h = signups.filter((s) => Date.now() - s.createdAt < 24 * 3600 * 1000).length

  return (
    <div className="activity-container">
      <div className="activity-stats">
        <Stat label="Total Signups" value={total} />
        <Stat label="Last 24h" value={last24h} />
        <Stat label="Showing" value={signups.length} accent />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="activity-filter-btn"
        >
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="activity-filter-btn activity-filter-btn-active"
        >
          Export CSV
        </button>
      </div>

      <div className="activity-card">
        <div className="activity-list-header" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr' }}>
          <span className="activity-header-cell">Email</span>
          <span className="activity-header-cell">Date</span>
          <span className="activity-header-cell">Source</span>
          <span className="activity-header-cell">IP</span>
        </div>
        <div className="activity-list">
          {isLoading && (
            <div className="activity-loading-row">
              <div className="activity-spinner" />
              <span>Loading signups…</span>
            </div>
          )}
          {!isLoading && signups.length === 0 && (
            <div className="activity-empty-row">No signups yet.</div>
          )}
          {!isLoading &&
            signups.map((s) => (
              <div
                key={s.id}
                className="activity-row"
                style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr' }}
              >
                <span className="activity-event-message" style={{ fontWeight: 600 }}>
                  {s.email}
                </span>
                <span className="activity-cell-time">
                  {new Date(s.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
                </span>
                <span className="activity-cell-type">{s.source ?? '—'}</span>
                <span className="activity-cell-type">{s.ip ?? '—'}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="activity-stat-card">
      <span className={`activity-stat-value ${accent ? '' : ''}`}>{value}</span>
      <span className="activity-stat-label">{label}</span>
    </div>
  )
}
