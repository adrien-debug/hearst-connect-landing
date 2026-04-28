'use client'

import { useState } from 'react'
import { AdminSidebar } from './components/sidebar'
import { AdminHeader } from './components/header'
import { DashboardSection } from './sections/dashboard'
import { VaultsSection } from './sections/vaults'
import { ActivitySection } from './sections/activity'
import { SettingsSection } from './sections/settings'
import { SignalsSection } from './sections/signals'
import { MarketSection } from './sections/market'
import { SimulatorSection } from './sections/simulator'
import { AgentConfigSection } from './sections/agent-config'
import AgentsSection from './sections/agents'
import { useSiweAuth } from '@/hooks/useSiweAuth'
import { ADMIN_TOKENS as TOKENS } from './constants'
import { useDemoMode } from '@/lib/demo/use-demo-mode'


const SECTIONS: Record<string, React.ComponentType> = {
  dashboard: DashboardSection,
  vaults: VaultsSection,
  signals: SignalsSection,
  market: MarketSection,
  simulator: SimulatorSection,
  'agent-config': AgentConfigSection,
  agents: AgentsSection,
  activity: ActivitySection,
  settings: SettingsSection,
}

const SECTION_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview and key metrics' },
  vaults: { title: 'Vault Management', subtitle: 'Configure and manage vaults' },
  signals: { title: 'Rebalancing Signals', subtitle: 'Agent signals — approve, reject or execute' },
  market: { title: 'Market Intelligence', subtitle: 'Live data, yields, sentiment & agent insights' },
  simulator: { title: 'Vault Simulator', subtitle: 'Projections multi-scénarios · Produit structuré crypto' },
  'agent-config': { title: 'Agent Config', subtitle: 'Seuils, timings, prompts — tout se règle ici' },
  agents: { title: 'Managed Agents', subtitle: 'Déclencher et monitorer les agents en temps réel' },
  activity: { title: 'Activity Log', subtitle: 'Recent actions and events' },
  settings: { title: 'Settings', subtitle: 'System configuration' },
}

export default function AdminPage() {
  return <AdminContent />
}

function AdminContent() {
  const {
    isAuthenticated,
    isAdmin,
    address,
    sessionChecked,
    logout,
  } = useSiweAuth()
  const isDemo = useDemoMode()
  const [activeSection, setActiveSection] = useState('dashboard')

  // Always wait for the session check first — prevents a flash of NoSessionScreen
  // when demo is authorized but useDemoMode resolves slightly after sessionChecked.
  if (!sessionChecked) {
    return <LoadingScreen />
  }

  // Demo bypass: authorized demo wallets reach the admin shell without needing
  // ADMIN_ADDRESSES. Real-mode still requires the full SIWE + admin whitelist.
  if (!isDemo) {
    if (!isAuthenticated) {
      return <NoSessionScreen />
    }
    if (!isAdmin) {
      return <NotAdminScreen address={address} onLogout={logout} />
    }
  }

  const CurrentSection = SECTIONS[activeSection]
  const sectionInfo = SECTION_TITLES[activeSection]

  return (
    <div style={styles.layout}>
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={() => {
          void logout()
        }}
      />
      <div style={styles.main}>
        <AdminHeader title={sectionInfo.title} subtitle={sectionInfo.subtitle} />
        <div style={styles.content}>
          <CurrentSection />
        </div>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={styles.loadingScreen}>
      <div style={styles.spinner} />
    </div>
  )
}

/** NoSessionScreen — Shown when there is no SIWE cookie at all. We can't
 * trigger the wallet flow from here (it lives in /app's AccessGate), so the
 * shortest path is a deep-link back to /app where the user connects + signs
 * once, then returns. */
function NoSessionScreen() {
  return (
    <div style={styles.loginScreen}>
      <div style={styles.loginBox}>
        <div style={styles.loginHeader}>
          <img src="/logos/hearst.svg" alt="Hearst" style={styles.logo} />
          <h1 style={styles.loginTitle}>Admin Console</h1>
          <p style={styles.loginSubtitle}>
            Sign in with an admin wallet to access the console.
          </p>
        </div>

        <a href="/app" style={styles.primaryLink}>
          Connect &amp; sign in →
        </a>

        <p style={styles.helper}>
          You will be sent to the main app to connect your wallet and sign the
          authentication message. Return here once authenticated.
        </p>
      </div>
    </div>
  )
}

/** NotAdminScreen — Shown when the user has a valid SIWE session but their
 * wallet isn't in the ADMIN_ADDRESSES whitelist. Lets them log out (in case
 * they want to retry with a different wallet) without leaving the page. */
function NotAdminScreen({
  address,
  onLogout,
}: {
  address: string | null
  onLogout: () => Promise<void>
}) {
  return (
    <div style={styles.loginScreen}>
      <div style={styles.loginBox}>
        <div style={styles.loginHeader}>
          <img src="/logos/hearst.svg" alt="Hearst" style={styles.logo} />
          <h1 style={styles.loginTitle}>Not authorized</h1>
          <p style={styles.loginSubtitle}>
            This wallet is not on the admin whitelist.
          </p>
        </div>

        {address && (
          <div style={styles.connectedAddress}>
            <span style={styles.connectedLabel}>Connected</span>
            <span style={styles.connectedValue}>
              {`${address.slice(0, 6)}…${address.slice(-4)}`}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            void onLogout()
          }}
          style={styles.loginButton}
        >
          Disconnect &amp; try another wallet
        </button>

        <a href="/app" style={styles.backLink}>← Back to app</a>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    minHeight: 'calc(100vh - var(--demo-banner-h, 0px))',
    marginTop: 'var(--demo-banner-h, 0px)',
    background: TOKENS.colors.bgApp,
    color: TOKENS.colors.textPrimary,
    fontFamily: TOKENS.fonts.sans,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  content: {
    flex: 1,
    padding: TOKENS.spacing[6],
    overflow: 'auto',
  },
  loadingScreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: TOKENS.colors.bgApp,
  },
  spinner: {
    width: TOKENS.spacing[10],
    height: TOKENS.spacing[10],
    border: `${TOKENS.borders.thin} solid ${TOKENS.colors.bgTertiary}`,
    borderTopColor: TOKENS.colors.accent,
    borderRadius: TOKENS.radius.full,
    animation: 'spin var(--dashboard-duration-loader, 1s) linear infinite',
  },
  loginScreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: TOKENS.colors.bgApp,
    padding: TOKENS.spacing[6],
  },
  loginBox: {
    width: '100%',
    maxWidth: '420px',
    background: TOKENS.colors.bgSidebar,
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.lg,
    padding: TOKENS.spacing[8],
  },
  loginHeader: {
    textAlign: 'center',
    marginBottom: TOKENS.spacing[6],
  },
  logo: {
    height: '40px',
    marginBottom: TOKENS.spacing[4],
  },
  loginTitle: {
    fontSize: TOKENS.fontSizes.xl,
    fontWeight: TOKENS.fontWeights.black,
    textTransform: 'uppercase',
    margin: `0 0 ${TOKENS.spacing[2]} 0`,
    letterSpacing: TOKENS.letterSpacing.normal,
  },
  loginSubtitle: {
    fontSize: TOKENS.fontSizes.sm,
    color: TOKENS.colors.textSecondary,
    margin: 0,
  },
  primaryLink: {
    display: 'block',
    textAlign: 'center',
    padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[6]}`,
    background: TOKENS.colors.accent,
    color: TOKENS.colors.black,
    border: 'none',
    borderRadius: TOKENS.radius.md,
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.bold,
    textTransform: 'uppercase',
    textDecoration: 'none',
    letterSpacing: TOKENS.letterSpacing.normal,
    marginTop: TOKENS.spacing[2],
  },
  helper: {
    margin: `${TOKENS.spacing[5]} 0 0`,
    fontSize: TOKENS.fontSizes.xs,
    color: TOKENS.colors.textSecondary,
    lineHeight: 1.5,
    textAlign: 'center',
  },
  connectedAddress: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: TOKENS.spacing[3],
    margin: `0 0 ${TOKENS.spacing[4]} 0`,
    background: TOKENS.colors.bgTertiary,
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.md,
  },
  connectedLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: TOKENS.fontSizes.micro,
    fontWeight: TOKENS.fontWeights.bold,
    letterSpacing: TOKENS.letterSpacing.display,
    textTransform: 'uppercase',
    color: TOKENS.colors.textGhost,
  },
  connectedValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.bold,
    color: TOKENS.colors.textPrimary,
  },
  loginButton: {
    padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[6]}`,
    background: 'transparent',
    color: TOKENS.colors.textPrimary,
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.md,
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.bold,
    textTransform: 'uppercase',
    cursor: 'pointer',
    letterSpacing: TOKENS.letterSpacing.normal,
    width: '100%',
  },
  backLink: {
    display: 'block',
    textAlign: 'center',
    marginTop: TOKENS.spacing[6],
    color: TOKENS.colors.textSecondary,
    fontSize: TOKENS.fontSizes.sm,
    textDecoration: 'none',
  },
}
