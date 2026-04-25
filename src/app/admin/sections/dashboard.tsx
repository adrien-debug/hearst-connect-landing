'use client'

import { useRouter } from 'next/navigation'
import { useVaultRegistry } from '@/hooks/useVaultRegistry'
import { ADMIN_TOKENS as TOKENS, MONO, fmtUsd, fmtUsdCompact } from '../constants'
import Link from 'next/link'

export function DashboardSection() {
  const router = useRouter()
  const { vaults, isLoading } = useVaultRegistry()

  const totalVaults = vaults.length
  const activeVaults = vaults.filter((v) => v.isActive !== false).length
  const totalUsers = 0

  const recentActivity: { type: string; message: string; time: string }[] = []

  return (
    <div style={styles.container}>
      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <StatCard
          label="Total Vaults"
          value={totalVaults}
          subtext={`${activeVaults} active`}
          trend="+2 this week"
        />
        <StatCard
          label="Total Value Locked"
          value={fmtUsdCompact(0)}
          subtext="Across all vaults"
          trend=""
          accent
        />
        <StatCard
          label="Users"
          value={totalUsers}
          subtext="Active sessions"
        />
        <StatCard
          label="Avg APR"
          value={`${vaults.length > 0 ? (vaults.reduce((s, v) => s + v.apr, 0) / vaults.length).toFixed(1) : 0}%`}
          subtext="Across all vaults"
        />
      </div>

      {/* Main Content Grid */}
      <div style={styles.mainGrid}>
        {/* Quick Actions */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Quick Actions</h3>
          <div style={styles.actionsList}>
            <Link href="/admin?vaults=new" style={styles.actionButton}>
              <PlusIcon />
              <span>Create New Vault</span>
            </Link>
            <button
              style={styles.actionButton}
              onClick={() => router.push('/app')}
            >
              <DemoIcon />
              <span>View App</span>
            </button>
            <button style={styles.actionButton}>
              <ExportIcon />
              <span>Export Data</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Recent Activity</h3>
          <div style={styles.activityList}>
            {recentActivity.map((item, i) => (
              <div key={i} style={styles.activityItem}>
                <div style={styles.activityIcon}>
                  {item.type === 'vault_created' && <VaultIcon />}
                  {item.type === 'deposit' && <DepositIcon />}
                  {item.type === 'config' && <ConfigIcon />}
                </div>
                <div style={styles.activityContent}>
                  <p style={styles.activityMessage}>{item.message}</p>
                  <span style={styles.activityTime}>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vaults Preview */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>Active Vaults</h3>
          <Link href="/admin?vaults" style={styles.viewAllLink}>View All →</Link>
        </div>
        {isLoading ? (
          <LoadingState />
        ) : vaults.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={styles.vaultTable}>
            <div style={styles.tableHeader}>
              <span style={styles.th}>Vault</span>
              <span style={styles.th}>APR</span>
              <span style={styles.th}>Min Deposit</span>
              <span style={styles.th}>Status</span>
            </div>
            {vaults.slice(0, 5).map((vault) => (
              <div key={vault.id} style={styles.tableRow}>
                <div style={styles.tdName}>
                  {vault.image && (
                    <img src={vault.image} alt="" style={styles.vaultThumb} />
                  )}
                  <span>{vault.name}</span>
                </div>
                <span style={styles.tdApr}>{vault.apr}%</span>
                <span style={styles.td}>{fmtUsd(vault.minDeposit)}</span>
                <span style={styles.tdStatus}>
                  <span style={styles.statusBadge}>Active</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  subtext,
  trend,
  accent = false,
}: {
  label: string
  value: string | number
  subtext: string
  trend?: string
  accent?: boolean
}) {
  return (
    <div style={{
      ...styles.statCard,
      borderColor: accent ? TOKENS.colors.accent : TOKENS.colors.borderSubtle,
    }}>
      <span style={styles.statLabel}>{label}</span>
      <span style={{
        ...styles.statValue,
        color: accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
      }}>
        {value}
      </span>
      <div style={styles.statFooter}>
        <span style={styles.statSubtext}>{subtext}</span>
        {trend && <span style={styles.statTrend}>{trend}</span>}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={styles.loadingState}>
      <div style={styles.spinner} />
    </div>
  )
}

function EmptyState() {
  return (
    <div style={styles.emptyState}>
      <p>No vaults configured yet</p>
    </div>
  )
}

// Icons
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function DemoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function ExportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function VaultIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function DepositIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  )
}

function ConfigIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: TOKENS.spacing[6],
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: TOKENS.spacing[4],
  },
  statCard: {
    background: TOKENS.colors.bgSidebar,
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.lg,
    padding: TOKENS.spacing[5],
    display: 'flex',
    flexDirection: 'column',
    gap: TOKENS.spacing[2],
  },
  statLabel: {
    fontSize: TOKENS.fontSizes.xs,
    fontWeight: TOKENS.fontWeights.bold,
    textTransform: 'uppercase',
    color: TOKENS.colors.textSecondary,
    letterSpacing: TOKENS.letterSpacing.normal,
  },
  statValue: {
    fontSize: TOKENS.fontSizes.xxl,
    fontWeight: TOKENS.fontWeights.black,
    letterSpacing: TOKENS.letterSpacing.tight,
  },
  statFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  statSubtext: {
    fontSize: TOKENS.fontSizes.xs,
    color: TOKENS.colors.textGhost,
  },
  statTrend: {
    fontFamily: MONO,
    fontSize: TOKENS.fontSizes.micro,
    color: TOKENS.colors.accent,
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: TOKENS.spacing[4],
  },
  card: {
    background: TOKENS.colors.bgSidebar,
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.lg,
    padding: TOKENS.spacing[5],
  },
  cardTitle: {
    fontSize: TOKENS.fontSizes.md,
    fontWeight: TOKENS.fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: TOKENS.letterSpacing.normal,
    margin: `0 0 ${TOKENS.spacing[4]} 0`,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: TOKENS.spacing[4],
  },
  viewAllLink: {
    fontSize: TOKENS.fontSizes.xs,
    color: TOKENS.colors.accent,
    textDecoration: 'none',
    fontWeight: TOKENS.fontWeights.bold,
  },
  actionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: TOKENS.spacing[3],
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[3],
    padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
    background: TOKENS.colors.bgTertiary,
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.md,
    color: TOKENS.colors.textPrimary,
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.bold,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: TOKENS.spacing[3],
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[3],
    padding: `${TOKENS.spacing[3]}`,
    background: TOKENS.colors.bgTertiary,
    borderRadius: TOKENS.radius.md,
  },
  activityIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: TOKENS.spacing[8],
    height: TOKENS.spacing[8],
    background: TOKENS.colors.bgApp,
    borderRadius: TOKENS.radius.sm,
    color: TOKENS.colors.accent,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.bold,
    margin: `0 0 ${TOKENS.spacing[1]} 0`,
  },
  activityTime: {
    fontFamily: MONO,
    fontSize: TOKENS.fontSizes.micro,
    color: TOKENS.colors.textGhost,
  },
  vaultTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: TOKENS.spacing[2],
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: TOKENS.spacing[4],
    padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
    fontFamily: MONO,
    fontSize: TOKENS.fontSizes.micro,
    fontWeight: TOKENS.fontWeights.bold,
    textTransform: 'uppercase',
    color: TOKENS.colors.textSecondary,
    letterSpacing: TOKENS.letterSpacing.display,
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: TOKENS.spacing[4],
    alignItems: 'center',
    padding: `${TOKENS.spacing[3]}`,
    background: TOKENS.colors.bgTertiary,
    borderRadius: TOKENS.radius.md,
  },
  th: {
    textAlign: 'left',
  },
  td: {
    fontSize: TOKENS.fontSizes.sm,
    color: TOKENS.colors.textSecondary,
  },
  tdName: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[3],
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.bold,
  },
  vaultThumb: {
    width: TOKENS.spacing[8],
    height: TOKENS.spacing[8],
    borderRadius: TOKENS.radius.sm,
    objectFit: 'cover',
  },
  tdApr: {
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.black,
    color: TOKENS.colors.accent,
  },
  tdStatus: {
    textAlign: 'right',
  },
  statusBadge: {
    display: 'inline-block',
    padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[2]}`,
    background: TOKENS.colors.accentSubtle,
    color: TOKENS.colors.accent,
    fontFamily: MONO,
    fontSize: TOKENS.fontSizes.micro,
    fontWeight: TOKENS.fontWeights.bold,
    textTransform: 'uppercase',
    borderRadius: TOKENS.radius.sm,
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: TOKENS.spacing[8],
  },
  spinner: {
    width: TOKENS.spacing[6],
    height: TOKENS.spacing[6],
    border: `2px solid ${TOKENS.colors.bgTertiary}`,
    borderTopColor: TOKENS.colors.accent,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  emptyState: {
    textAlign: 'center',
    padding: TOKENS.spacing[6],
    color: TOKENS.colors.textGhost,
  },
}
