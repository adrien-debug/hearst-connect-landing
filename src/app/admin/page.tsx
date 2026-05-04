'use client'

import { useState } from 'react'
import { AdminSidebar } from './components/sidebar'
import { AdminHeader } from './components/header'
import { DashboardSection } from './sections/dashboard'
import { VaultsSection } from './sections/vaults'
import { ActivitySection } from './sections/activity'
import { EarlyAccessSection } from './sections/early-access'
import { SettingsSection } from './sections/settings'
import { SignalsSection } from './sections/signals'
import { MarketSection } from './sections/market'
import { SimulatorSection } from './sections/simulator'
import { AgentConfigSection } from './sections/agent-config'
import AgentsSection from './sections/agents'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { ADMIN_TOKENS as TOKENS } from './constants'


const SECTIONS: Record<string, React.ComponentType> = {
  dashboard: DashboardSection,
  vaults: VaultsSection,
  signals: SignalsSection,
  market: MarketSection,
  simulator: SimulatorSection,
  'agent-config': AgentConfigSection,
  agents: AgentsSection,
  activity: ActivitySection,
  'early-access': EarlyAccessSection,
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
  'early-access': { title: 'Early Access', subtitle: 'Landing-page signups — list & export' },
  settings: { title: 'Settings', subtitle: 'System configuration' },
}

export default function AdminPage() {
  return <AdminContent />
}

function AdminContent() {
  const { isAuthenticated, isLoading, error, login, logout } = useAdminAuth()
  const [activeSection, setActiveSection] = useState('dashboard')

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} error={error} />
  }

  const CurrentSection = SECTIONS[activeSection]
  const sectionInfo = SECTION_TITLES[activeSection]

  return (
    <div style={styles.layout}>
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={logout}
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

function LoginScreen({
  onLogin,
  error,
}: {
  onLogin: (email: string, password: string) => Promise<boolean>
  error: string | null
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    await onLogin(email, password)
    setIsLoggingIn(false)
  }

  return (
    <div style={styles.loginScreen}>
      <div style={styles.loginBox}>
        <div style={styles.loginHeader}>
          <img src="/logos/hearst.svg" alt="Hearst" style={styles.logo} />
          <h1 style={styles.loginTitle}>Admin Console</h1>
          <p style={styles.loginSubtitle}>Secure access required</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.loginForm}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={isLoggingIn}
            style={{
              ...styles.loginButton,
              opacity: isLoggingIn ? 0.7 : 1,
            }}
          >
            {isLoggingIn ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <a href="/app" style={styles.backLink}>← Back to App</a>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
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
    width: '40px',
    height: '40px',
    border: `3px solid ${TOKENS.colors.bgTertiary}`,
    borderTopColor: TOKENS.colors.accent,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
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
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: TOKENS.spacing[4],
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: TOKENS.spacing[2],
  },
  label: {
    fontSize: TOKENS.fontSizes.xs,
    fontWeight: TOKENS.fontWeights.bold,
    textTransform: 'uppercase',
    color: TOKENS.colors.textSecondary,
    letterSpacing: TOKENS.letterSpacing.normal,
  },
  input: {
    padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,

    background: TOKENS.colors.bgTertiary,
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.md,
    color: TOKENS.colors.textPrimary,
    fontSize: TOKENS.fontSizes.sm,
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },
  error: {
    padding: TOKENS.spacing[3],
    background: `${TOKENS.colors.danger}15`,
    border: `1px solid ${TOKENS.colors.danger}40`,
    borderRadius: TOKENS.radius.md,
    color: TOKENS.colors.danger,
    fontSize: TOKENS.fontSizes.sm,
  },
  loginButton: {
    padding: `${TOKENS.spacing[3]}px ${TOKENS.spacing[6]}px`,
    background: TOKENS.colors.accent,
    color: TOKENS.colors.black,
    border: 'none',
    borderRadius: TOKENS.radius.md,
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.bold,
    textTransform: 'uppercase',
    cursor: 'pointer',
    letterSpacing: TOKENS.letterSpacing.normal,
    marginTop: TOKENS.spacing[2],
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
