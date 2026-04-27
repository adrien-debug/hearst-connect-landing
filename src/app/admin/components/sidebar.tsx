'use client'

import { ADMIN_TOKENS as TOKENS, MONO } from '../constants'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGridIcon },
  { id: 'vaults', label: 'Vaults', icon: VaultIcon },
  { id: 'signals', label: 'Signals', icon: SignalsIcon },
  { id: 'market', label: 'Market', icon: MarketIcon },
  { id: 'simulator', label: 'Simulator', icon: SimulatorIcon },
  { id: 'agent-config', label: 'Agent Config', icon: AgentConfigIcon },
  { id: 'agents', label: 'Run Agents', icon: RunAgentsIcon },
  { id: 'activity', label: 'Activity', icon: ActivityIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

interface AdminSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  onLogout: () => void
}

export function AdminSidebar({
  activeSection,
  onSectionChange,
  onLogout,
}: AdminSidebarProps) {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoArea}>
        <img src="/logos/hearst.svg" alt="Hearst" style={styles.logo} />
        <span style={styles.adminBadge}>ADMIN</span>
      </div>

      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeSection === item.id}
            onClick={() => onSectionChange(item.id)}
          />
        ))}
      </nav>

      <div style={styles.footer}>
        <button onClick={onLogout} style={styles.logoutButton}>
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

function NavButton({
  item,
  isActive,
  onClick,
}: {
  item: typeof NAV_ITEMS[0]
  isActive: boolean
  onClick: () => void
}) {
  const Icon = item.icon

  return (
    <button
      onClick={onClick}
      style={{
        ...styles.navButton,
        background: isActive ? TOKENS.colors.accentSubtle : 'transparent',
        borderColor: isActive ? TOKENS.colors.accent : 'transparent',
        color: isActive ? TOKENS.colors.accent : TOKENS.colors.textSecondary,
      }}
    >
      <Icon />
      <span style={styles.navLabel}>{item.label}</span>
      {isActive && <div style={styles.activeIndicator} />}
    </button>
  )
}

// Icons
function LayoutGridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function VaultIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function ActivityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function SignalsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 20h.01" /><path d="M7 20v-4" /><path d="M12 20v-8" /><path d="M17 20V8" /><path d="M22 4v16" />
    </svg>
  )
}

function AgentConfigIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function SimulatorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /><path d="M2 20h20" />
    </svg>
  )
}

function MarketIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
    </svg>
  )
}

function RunAgentsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 'var(--dashboard-sidebar-width, 240px)',
    background: TOKENS.colors.bgSidebar,
    borderRight: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[3],
    padding: `${TOKENS.spacing[6]} ${TOKENS.spacing[4]}`,
    borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
  },
  logo: {
    height: TOKENS.spacing[8],
  },
  adminBadge: {
    fontFamily: MONO,
    fontSize: TOKENS.fontSizes.micro,
    fontWeight: TOKENS.fontWeights.bold,
    letterSpacing: TOKENS.letterSpacing.display,
    color: TOKENS.colors.accent,
    padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[2]}`,
    border: `${TOKENS.borders.thin} solid ${TOKENS.colors.accent}`,
    borderRadius: TOKENS.radius.sm,
  },
  nav: {
    flex: 1,
    padding: TOKENS.spacing[4],
    display: 'flex',
    flexDirection: 'column',
    gap: TOKENS.spacing[2],
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[3],
    padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
    background: 'transparent',
    border: `${TOKENS.borders.thin} solid transparent`,
    borderRadius: TOKENS.radius.md,
    color: TOKENS.colors.textSecondary,
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.bold,
    cursor: 'pointer',
    textAlign: 'left',
    transition: TOKENS.transitions.all,
    position: 'relative',
  },
  navLabel: {
    flex: 1,
  },
  activeIndicator: {
    width: TOKENS.spacing[1],
    height: TOKENS.spacing[1],
    borderRadius: TOKENS.radius.full,
    background: TOKENS.colors.accent,
  },
  footer: {
    padding: TOKENS.spacing[4],
    borderTop: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[3],
    width: '100%',
    padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
    background: 'transparent',
    border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.md,
    color: TOKENS.colors.textSecondary,
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.bold,
    cursor: 'pointer',
    transition: TOKENS.transitions.all,
  },
}
