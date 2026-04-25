'use client'

import { useState } from 'react'
import { TOKENS, MONO } from '@/components/connect/constants'
import { useAppMode } from '@/hooks/useAppMode'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { STORAGE_KEYS } from '@/config/storage-keys'

export function SettingsSection() {
  const { isDemo, setMode, hasAdminSession } = useAppMode()
  const { isAuthenticated } = useAdminAuth()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowNewDeposits: true,
    enableAnalytics: true,
    sessionTimeout: 24,
  })

  // Demo mode can only be toggled with valid admin session
  const canToggleDemo = isAuthenticated && hasAdminSession

  const handleResetDemo = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.DEMO_PORTFOLIO)
      localStorage.removeItem(STORAGE_KEYS.APP_MODE)
      window.location.reload()
    }
  }

  return (
    <div style={styles.container}>
      {/* System Status */}
      <div style={styles.statusCard}>
        <div style={styles.statusHeader}>
          <h3 style={styles.statusTitle}>System Status</h3>
          <div style={styles.statusBadge}>
            <span style={styles.statusDot} />
            Operational
          </div>
        </div>
        <div style={styles.statusGrid}>
          <StatusItem label="API" value="Connected" status="good" />
          <StatusItem label="Database" value="Synced" status="good" />
          <StatusItem label="Web3 Provider" value="Base Mainnet" status="good" />
          <StatusItem label="Last Sync" value="2 min ago" status="neutral" />
        </div>
      </div>

      {/* Configuration */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Configuration</h3>
        <div style={styles.settingsList}>
          <ToggleSetting
            label="Maintenance Mode"
            description="Disable all user interactions"
            checked={settings.maintenanceMode}
            onChange={(v) => setSettings((s) => ({ ...s, maintenanceMode: v }))}
          />
          <ToggleSetting
            label="Allow New Deposits"
            description="Enable deposit functionality"
            checked={settings.allowNewDeposits}
            onChange={(v) => setSettings((s) => ({ ...s, allowNewDeposits: v }))}
          />
          <ToggleSetting
            label="Enable Analytics"
            description="Track user activity"
            checked={settings.enableAnalytics}
            onChange={(v) => setSettings((s) => ({ ...s, enableAnalytics: v }))}
          />
        </div>
      </div>

      {/* Demo Settings */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Demo Environment</h3>
        <div style={styles.demoSection}>
          <div style={styles.demoInfo}>
            <span style={styles.demoLabel}>Current Mode</span>
            <span style={styles.demoValue}>{isDemo ? 'Demo' : 'Live'}</span>
          </div>
          <div style={styles.demoActions}>
            <button
              onClick={() => canToggleDemo && setMode(isDemo ? 'live' : 'demo')}
              style={{
                ...styles.demoBtn,
                opacity: canToggleDemo ? 1 : 0.5,
                cursor: canToggleDemo ? 'pointer' : 'not-allowed',
              }}
              disabled={!canToggleDemo}
              title={canToggleDemo ? undefined : 'Admin session required'}
            >
              {isDemo ? 'Switch to Live' : 'Switch to Demo'}
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              style={{ ...styles.demoBtn, ...styles.resetBtn }}
            >
              Reset Demo Data
            </button>
          </div>
        </div>
      </div>

      {/* Admin Credentials */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Admin Credentials</h3>
        <div style={styles.credsList}>
          <div style={styles.credItem}>
            <span style={styles.credLabel}>Email</span>
            <code style={styles.credValue}>admin@hearst.app</code>
          </div>
          <div style={styles.credItem}>
            <span style={styles.credLabel}>Password Hash</span>
            <code style={styles.credValue}>SHA-256 (hidden)</code>
          </div>
          <div style={styles.credItem}>
            <span style={styles.credLabel}>Session Duration</span>
            <span style={styles.credValue}>{settings.sessionTimeout} hours</span>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Reset Demo Data?</h3>
            <p style={styles.modalText}>
              This will clear all demo portfolio data and reset to initial state. This action cannot be undone.
            </p>
            <div style={styles.modalActions}>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button onClick={handleResetDemo} style={styles.confirmBtn}>
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusItem({
  label,
  value,
  status,
}: {
  label: string
  value: string
  status: 'good' | 'warning' | 'error' | 'neutral'
}) {
  const colors = {
    good: TOKENS.colors.accent,
    warning: 'var(--color-warning)',
    error: TOKENS.colors.danger,
    neutral: TOKENS.colors.textGhost,
  }

  return (
    <div style={styles.statusItem}>
      <span style={styles.statusItemLabel}>{label}</span>
      <span style={{ ...styles.statusItemValue, color: colors[status] }}>{value}</span>
    </div>
  )
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div style={styles.settingRow}>
      <div style={styles.settingInfo}>
        <span style={styles.settingLabel}>{label}</span>
        <span style={styles.settingDesc}>{description}</span>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          ...styles.toggle,
          background: checked ? TOKENS.colors.accent : TOKENS.colors.bgTertiary,
        }}
      >
        <span
          style={{
            ...styles.toggleKnob,
            transform: checked ? 'translateX(20px)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: TOKENS.spacing[4],
  },
  statusCard: {
    background: TOKENS.colors.bgSidebar,
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.lg,
    padding: TOKENS.spacing[5],
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: TOKENS.spacing[4],
  },
  statusTitle: {
    fontSize: TOKENS.fontSizes.md,
    fontWeight: TOKENS.fontWeights.bold,
    textTransform: 'uppercase',
    margin: 0,
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[2],
    padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
    background: TOKENS.colors.accentSubtle,
    border: `1px solid ${TOKENS.colors.accent}`,
    borderRadius: TOKENS.radius.md,
    fontFamily: MONO,
    fontSize: TOKENS.fontSizes.micro,
    fontWeight: TOKENS.fontWeights.bold,
    color: TOKENS.colors.accent,
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: TOKENS.colors.accent,
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: TOKENS.spacing[4],
  },
  statusItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: TOKENS.spacing[1],
  },
  statusItemLabel: {
    fontSize: TOKENS.fontSizes.xs,
    color: TOKENS.colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: TOKENS.fontWeights.bold,
  },
  statusItemValue: {
    fontFamily: MONO,
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.bold,
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
    margin: `0 0 ${TOKENS.spacing[4]} 0`,
  },
  settingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: TOKENS.spacing[4],
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${TOKENS.spacing[3]} 0`,
    borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
  },
  settingInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: TOKENS.spacing[1],
  },
  settingLabel: {
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.bold,
    color: TOKENS.colors.textPrimary,
  },
  settingDesc: {
    fontSize: TOKENS.fontSizes.xs,
    color: TOKENS.colors.textGhost,
  },
  toggle: {
    width: '44px',
    height: '24px',
    borderRadius: TOKENS.radius.md,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.2s ease',
    padding: `${TOKENS.spacing[1]}px`,
  },
  toggleKnob: {
    display: 'block',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: TOKENS.colors.white,
    transition: 'transform 0.2s ease',
  },
  demoSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${TOKENS.spacing[3]}`,
    background: TOKENS.colors.bgTertiary,
    borderRadius: TOKENS.radius.md,
  },
  demoInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: TOKENS.spacing[1],
  },
  demoLabel: {
    fontSize: TOKENS.fontSizes.xs,
    color: TOKENS.colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: TOKENS.fontWeights.bold,
  },
  demoValue: {
    fontFamily: MONO,
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.bold,
    color: TOKENS.colors.accent,
  },
  demoActions: {
    display: 'flex',
    gap: TOKENS.spacing[3],
  },
  demoBtn: {
    padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[4]}`,
    background: TOKENS.colors.accent,
    border: 'none',
    borderRadius: TOKENS.radius.md,
    color: TOKENS.colors.black,
    fontSize: TOKENS.fontSizes.xs,
    fontWeight: TOKENS.fontWeights.bold,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  resetBtn: {
    background: 'transparent',
    border: `1px solid ${TOKENS.colors.danger}`,
    color: TOKENS.colors.danger,
  },
  credsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: TOKENS.spacing[3],
  },
  credItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${TOKENS.spacing[3]}`,
    background: TOKENS.colors.bgTertiary,
    borderRadius: TOKENS.radius.md,
  },
  credLabel: {
    fontSize: TOKENS.fontSizes.xs,
    color: TOKENS.colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: TOKENS.fontWeights.bold,
  },
  credValue: {
    fontFamily: MONO,
    fontSize: TOKENS.fontSizes.xs,
    color: TOKENS.colors.accent,
    background: TOKENS.colors.bgApp,
    padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[3]}`,
    borderRadius: TOKENS.radius.sm,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'var(--color-bg-overlay)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 'var(--z-modal)',
  },
  modal: {
    width: '100%',
    maxWidth: '400px',
    background: TOKENS.colors.bgSidebar,
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.lg,
    padding: TOKENS.spacing[6],
  },
  modalTitle: {
    fontSize: TOKENS.fontSizes.lg,
    fontWeight: TOKENS.fontWeights.bold,
    textTransform: 'uppercase',
    margin: `0 0 ${TOKENS.spacing[3]} 0`,
  },
  modalText: {
    fontSize: TOKENS.fontSizes.sm,
    color: TOKENS.colors.textSecondary,
    margin: `0 0 ${TOKENS.spacing[5]} 0`,
    lineHeight: 1.5,
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: TOKENS.spacing[3],
  },
  cancelBtn: {
    padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[5]}`,
    background: 'transparent',
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.md,
    color: TOKENS.colors.textSecondary,
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.bold,
    cursor: 'pointer',
    textTransform: 'uppercase',
  },
  confirmBtn: {
    padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[5]}`,
    background: TOKENS.colors.danger,
    border: 'none',
    borderRadius: TOKENS.radius.md,
    color: TOKENS.colors.white,
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.bold,
    cursor: 'pointer',
    textTransform: 'uppercase',
  },
}
