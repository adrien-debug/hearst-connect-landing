'use client'

import { useState } from 'react'
import { useSignals, useSignalMutations } from '@/hooks/useSignals'
import { useAgentsStatus } from '@/hooks/useMarketData'
import { ADMIN_TOKENS as T, MONO } from '../constants'
import type { DbRebalanceSignal } from '@/lib/db/schema'

const STATUS_COLORS: Record<string, string> = {
  pending: T.colors.warning,
  approved: T.colors.success,
  rejected: T.colors.danger,
  executed: T.colors.accent,
  blocked: T.colors.danger,
}

const TYPE_ICONS: Record<string, string> = {
  TAKE_PROFIT: '💰',
  REBALANCE: '⚖️',
  YIELD_ROTATE: '🔄',
  INCREASE_BTC: '📈',
  REDUCE_RISK: '🛡️',
}

export function SignalsSection() {
  const [filter, setFilter] = useState<string>('')
  const { data, isLoading } = useSignals(filter || undefined)
  const { data: agentsData } = useAgentsStatus()
  const { approve, reject, execute } = useSignalMutations()

  const signals = data?.signals ?? []
  const agents = agentsData?.agents ?? []

  return (
    <div>
      {/* Agent status bar */}
      <div style={s.agentBar}>
        {agents.map(a => (
          <div key={a.name} style={s.agentChip}>
            <div style={{ ...s.dot, background: a.status === 'online' ? T.colors.success : T.colors.danger }} />
            <span style={s.agentName}>{a.name}</span>
            <span style={s.agentStatus}>{a.status}</span>
          </div>
        ))}
        {agents.length === 0 && <span style={{ color: T.colors.textSecondary, fontSize: T.fontSizes.sm }}>No agent data</span>}
      </div>

      {/* Filter tabs */}
      <div style={s.filterRow}>
        {['', 'pending', 'approved', 'rejected', 'executed', 'blocked'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...s.filterBtn,
              background: filter === f ? T.colors.accentSubtle : 'transparent',
              borderColor: filter === f ? T.colors.accent : T.colors.borderSubtle,
              color: filter === f ? T.colors.accent : T.colors.textSecondary,
            }}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      {/* Signals list */}
      {isLoading ? (
        <div style={{ color: T.colors.textSecondary, padding: T.spacing[6] }}>Loading signals...</div>
      ) : signals.length === 0 ? (
        <div style={s.empty}>No signals{filter ? ` with status "${filter}"` : ''}</div>
      ) : (
        <div style={s.list}>
          {signals.map(sig => (
            <SignalCard
              key={sig.id}
              signal={sig}
              onApprove={() => approve.mutate(sig.id)}
              onReject={() => reject.mutate(sig.id)}
              onExecute={() => execute.mutate(sig.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SignalCard({
  signal: sig,
  onApprove,
  onReject,
  onExecute,
}: {
  signal: DbRebalanceSignal
  onApprove: () => void
  onReject: () => void
  onExecute: () => void
}) {
  const statusColor = STATUS_COLORS[sig.status] ?? T.colors.textSecondary
  const icon = TYPE_ICONS[sig.type] ?? '📋'

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <span style={s.typeIcon}>{icon}</span>
        <span style={s.typeName}>{sig.type.replace(/_/g, ' ')}</span>
        <span style={{ ...s.statusBadge, background: T.colors.bgTertiary, color: statusColor, borderColor: statusColor }}>{sig.status}</span>
        <span style={s.agent}>by {sig.createdBy}</span>
      </div>

      <p style={s.desc}>{sig.description}</p>

      <div style={s.meta}>
        <span>{new Date(sig.timestamp).toLocaleString()}</span>
        {sig.riskScore != null && (
          <span style={{ color: sig.riskScore > 60 ? T.colors.danger : sig.riskScore > 30 ? T.colors.warning : T.colors.success }}>
            Risk: {sig.riskScore}/100
          </span>
        )}
        {sig.riskNotes && <span style={{ fontStyle: 'italic' }}>{sig.riskNotes}</span>}
      </div>

      {sig.paramsJson && (
        <pre style={s.params}>{JSON.stringify(JSON.parse(sig.paramsJson), null, 2)}</pre>
      )}

      {sig.status === 'pending' && (
        <div style={s.actions}>
          <button onClick={onApprove} style={{ ...s.actionBtn, background: T.colors.success, color: T.colors.black }}>Approve</button>
          <button onClick={onReject} style={{ ...s.actionBtn, background: T.colors.danger, color: T.colors.white }}>Reject</button>
        </div>
      )}
      {sig.status === 'approved' && (
        <div style={s.actions}>
          <button onClick={onExecute} style={{ ...s.actionBtn, background: T.colors.accent, color: T.colors.black }}>Execute</button>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  agentBar: { display: 'flex', gap: T.spacing[3], marginBottom: T.spacing[4], flexWrap: 'wrap' },
  agentChip: {
    display: 'flex', alignItems: 'center', gap: T.spacing[2],
    padding: `${T.spacing[2]} ${T.spacing[3]}`,
    background: T.colors.bgTertiary, borderRadius: T.radius.md,
    fontSize: T.fontSizes.xs,
  },
  dot: { width: T.spacing[2], height: T.spacing[2], borderRadius: T.radius.full },
  agentName: { fontWeight: T.fontWeights.bold, color: T.colors.textPrimary, textTransform: 'capitalize' },
  agentStatus: { color: T.colors.textSecondary },
  filterRow: { display: 'flex', gap: T.spacing[2], marginBottom: T.spacing[4], flexWrap: 'wrap' },
  filterBtn: {
    padding: `${T.spacing[2]} ${T.spacing[3]}`,
    border: `1px solid ${T.colors.borderSubtle}`,
    borderRadius: T.radius.md, fontSize: T.fontSizes.xs,
    fontWeight: T.fontWeights.bold, cursor: 'pointer',
    textTransform: 'capitalize', transition: `all ${T.transitions.fast}`,
  },
  empty: { color: T.colors.textSecondary, fontSize: T.fontSizes.sm, padding: T.spacing[8], textAlign: 'center' },
  list: { display: 'flex', flexDirection: 'column', gap: T.spacing[3] },
  card: {
    background: T.colors.bgSurface, border: `1px solid ${T.colors.borderSubtle}`,
    borderRadius: T.radius.lg, padding: T.spacing[4],
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: T.spacing[2], marginBottom: T.spacing[2] },
  typeIcon: { fontSize: T.fontSizes.lg },
  typeName: { fontWeight: T.fontWeights.bold, fontSize: T.fontSizes.sm, color: T.colors.textPrimary },
  statusBadge: {
    padding: `${T.spacing[1]} ${T.spacing[2]}`, borderRadius: T.radius.sm,
    fontSize: T.fontSizes.micro, fontWeight: T.fontWeights.bold, textTransform: 'uppercase',
    border: `1px solid transparent`,
  },
  agent: { fontSize: T.fontSizes.xs, color: T.colors.textSecondary, marginLeft: 'auto' },
  desc: { fontSize: T.fontSizes.sm, color: T.colors.textPrimary, margin: `${T.spacing[0]} ${T.spacing[0]} ${T.spacing[2]}`, lineHeight: T.lineHeights.base },
  meta: {
    display: 'flex', gap: T.spacing[4], fontSize: T.fontSizes.xs,
    color: T.colors.textSecondary, flexWrap: 'wrap',
  },
  params: {
    fontFamily: MONO, fontSize: T.fontSizes.micro, color: T.colors.textSecondary,
    background: T.colors.bgTertiary, borderRadius: T.radius.sm,
    padding: T.spacing[3], marginTop: T.spacing[2], overflow: 'auto', maxHeight: T.spacing[12],
  },
  actions: { display: 'flex', gap: T.spacing[2], marginTop: T.spacing[3] },
  actionBtn: {
    padding: `${T.spacing[2]} ${T.spacing[4]}`, border: 'none', borderRadius: T.radius.md,
    fontSize: T.fontSizes.xs, fontWeight: T.fontWeights.bold, cursor: 'pointer',
    textTransform: 'uppercase', transition: `all ${T.transitions.fast}`,
  },
}
