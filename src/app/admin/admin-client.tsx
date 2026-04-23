'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { useVaultRegistry } from '@/hooks/useVaultRegistry'
import type { VaultConfig, VaultConfigInput } from '@/types/vault'
import { TOKENS, MONO, fmtUsd } from '@/components/connect/constants'
import { isAddress } from 'viem'

const ADMIN_ADDRESSES = (process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || '')
  .split(',')
  .map((a) => a.trim().toLowerCase())
  .filter(Boolean)

function useAdminGuard() {
  const { address, isConnected } = useAccount()
  // If no whitelist configured, allow all (dev mode)
  if (ADMIN_ADDRESSES.length === 0) return { isAuthorized: true, isConnected, address }
  if (!isConnected || !address) return { isAuthorized: false, isConnected, address }
  return {
    isAuthorized: ADMIN_ADDRESSES.includes(address.toLowerCase()),
    isConnected,
    address,
  }
}

export function AdminClient() {
  const { isAuthorized, isConnected, address } = useAdminGuard()
  const { connect, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()

  const {
    vaults,
    hasVaults,
    isLoading,
    addVault,
    removeVault,
    updateVault,
    isAdding,
    isRemoving,
    isUpdating,
  } = useVaultRegistry()

  const [editingVault, setEditingVault] = useState<VaultConfig | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Gate: wallet not connected
  if (!isConnected) {
    return (
      <AdminShell>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${TOKENS.spacing[12]}px`, textAlign: 'center' }}>
          <h2 style={{ fontSize: TOKENS.fontSizes.xl, fontWeight: TOKENS.fontWeights.black, margin: `0 0 ${TOKENS.spacing[3]}px 0`, textTransform: 'uppercase' }}>
            Admin Access
          </h2>
          <p style={{ fontSize: TOKENS.fontSizes.sm, color: TOKENS.colors.textSecondary, margin: `0 0 ${TOKENS.spacing[6]}px 0`, maxWidth: '400px' }}>
            Connect your wallet to access the admin panel.{ADMIN_ADDRESSES.length > 0 ? ' Only whitelisted addresses are authorized.' : ''}
          </p>
          <button
            onClick={() => connect({ connector: injected() })}
            disabled={isConnecting}
            style={{
              padding: `${TOKENS.spacing[3]}px ${TOKENS.spacing[6]}px`,
              background: TOKENS.colors.accent,
              color: TOKENS.colors.black,
              border: 'none',
              borderRadius: TOKENS.radius.md,
              fontSize: TOKENS.fontSizes.sm,
              fontWeight: TOKENS.fontWeights.bold,
              cursor: isConnecting ? 'wait' : 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              opacity: isConnecting ? 0.7 : 1,
            }}
          >
            {isConnecting ? 'Connecting…' : 'Connect Wallet'}
          </button>
        </div>
      </AdminShell>
    )
  }

  // Gate: wallet connected but not authorized
  if (!isAuthorized) {
    return (
      <AdminShell>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${TOKENS.spacing[12]}px`, textAlign: 'center' }}>
          <h2 style={{ fontSize: TOKENS.fontSizes.xl, fontWeight: TOKENS.fontWeights.black, margin: `0 0 ${TOKENS.spacing[3]}px 0`, textTransform: 'uppercase', color: TOKENS.colors.danger }}>
            Access Denied
          </h2>
          <p style={{ fontSize: TOKENS.fontSizes.sm, color: TOKENS.colors.textSecondary, margin: `0 0 ${TOKENS.spacing[2]}px 0`, maxWidth: '400px' }}>
            Your wallet is not authorized to access the admin panel.
          </p>
          <p style={{ fontSize: TOKENS.fontSizes.micro, color: TOKENS.colors.textGhost, fontFamily: MONO, margin: `0 0 ${TOKENS.spacing[6]}px 0` }}>
            {address?.slice(0, 6)}…{address?.slice(-4)}
          </p>
          <div style={{ display: 'flex', gap: TOKENS.spacing[3] }}>
            <button
              onClick={() => disconnect()}
              style={{
                padding: `${TOKENS.spacing[2]}px ${TOKENS.spacing[4]}px`,
                background: 'transparent',
                border: `1px solid ${TOKENS.colors.borderSubtle}`,
                borderRadius: TOKENS.radius.md,
                color: TOKENS.colors.textSecondary,
                fontSize: TOKENS.fontSizes.sm,
                fontWeight: TOKENS.fontWeights.bold,
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              Switch Wallet
            </button>
            <a
              href="/app"
              style={{
                padding: `${TOKENS.spacing[2]}px ${TOKENS.spacing[4]}px`,
                background: TOKENS.colors.accent,
                color: TOKENS.colors.black,
                border: 'none',
                borderRadius: TOKENS.radius.md,
                fontSize: TOKENS.fontSizes.sm,
                fontWeight: TOKENS.fontWeights.bold,
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              Back to App
            </a>
          </div>
        </div>
      </AdminShell>
    )
  }

  const handleSave = async (data: VaultConfigInput) => {
    if (editingVault) {
      await updateVault({ vaultId: editingVault.id, updates: data })
      setEditingVault(null)
    } else {
      await addVault(data)
    }
    setShowForm(false)
  }

  const handleEdit = (vault: VaultConfig) => {
    setEditingVault(vault)
    setShowForm(true)
  }

  const handleDelete = async (vaultId: string) => {
    if (confirm('Are you sure you want to delete this vault?')) {
      await removeVault(vaultId)
    }
  }

  const handleCancel = () => {
    setEditingVault(null)
    setShowForm(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: TOKENS.colors.bgApp,
        color: TOKENS.colors.textPrimary,
        fontFamily: TOKENS.fonts.sans,
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${TOKENS.spacing[4]}px ${TOKENS.spacing[6]}px`,
          borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
          background: TOKENS.colors.bgSidebar,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[4] }}>
          <a
            href="/app"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: TOKENS.spacing[2],
              color: TOKENS.colors.textSecondary,
              textDecoration: 'none',
              fontSize: TOKENS.fontSizes.sm,
              fontWeight: TOKENS.fontWeights.bold,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span>←</span>
            <span>Back to App</span>
          </a>
          <h1
            style={{
              fontSize: TOKENS.fontSizes.xl,
              fontWeight: TOKENS.fontWeights.black,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              margin: 0,
            }}
          >
            Admin
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[3] }}>
          {address && (
            <span style={{ fontSize: TOKENS.fontSizes.micro, color: TOKENS.colors.textGhost, fontFamily: MONO, letterSpacing: TOKENS.letterSpacing.display, textTransform: 'uppercase' }}>
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
          )}
          <button
            onClick={() => setShowForm(true)}
            disabled={isAdding}
            style={{
              padding: `${TOKENS.spacing[2]}px ${TOKENS.spacing[4]}px`,
              background: TOKENS.colors.accent,
              color: TOKENS.colors.black,
              border: 'none',
              borderRadius: TOKENS.radius.md,
              fontSize: TOKENS.fontSizes.sm,
              fontWeight: TOKENS.fontWeights.bold,
              cursor: isAdding ? 'wait' : 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              opacity: isAdding ? 0.7 : 1,
            }}
          >
            {isAdding ? 'Creating...' : '+ Add Vault'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: TOKENS.spacing[6] }}>
        {showForm && (
          <VaultConfigForm
            initialData={editingVault}
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={isAdding || isUpdating}
          />
        )}

        {isLoading ? (
          <LoadingState />
        ) : !hasVaults ? (
          <EmptyState onAdd={() => setShowForm(true)} />
        ) : (
          <VaultList
            vaults={vaults}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDeleting={isRemoving}
          />
        )}
      </main>
    </div>
  )
}

function VaultConfigForm({
  initialData,
  onSave,
  onCancel,
  isSaving,
}: {
  initialData: VaultConfig | null
  onSave: (data: VaultConfigInput) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [formData, setFormData] = useState<VaultConfigInput>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    vaultAddress: (initialData?.vaultAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    usdcAddress: (initialData?.usdcAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    chain: initialData?.chain || { id: 8453, name: 'Base', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [''] } } } as const,
    apr: initialData?.apr || 12,
    target: initialData?.target || '36%',
    lockPeriodDays: initialData?.lockPeriodDays || 1095,
    minDeposit: initialData?.minDeposit || 500000,
    strategy: initialData?.strategy || 'RWA Mining · USDC Yield · BTC Hedged',
    fees: initialData?.fees || '1.5% Mgmt · 15% Perf',
    risk: initialData?.risk || 'Moderate',
    image: initialData?.image || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.vaultAddress) {
      newErrors.vaultAddress = 'Vault address is required'
    } else if (!isAddress(formData.vaultAddress)) {
      newErrors.vaultAddress = 'Invalid Ethereum address'
    }

    if (!formData.usdcAddress) {
      newErrors.usdcAddress = 'USDC address is required'
    } else if (!isAddress(formData.usdcAddress)) {
      newErrors.usdcAddress = 'Invalid Ethereum address'
    }

    if (formData.apr <= 0) {
      newErrors.apr = 'APR must be positive'
    }

    if (formData.minDeposit < 0) {
      newErrors.minDeposit = 'Minimum deposit cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSave(formData)
    }
  }

  const updateField = <K extends keyof VaultConfigInput>(
    field: K,
    value: VaultConfigInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when field is edited
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div
      style={{
        background: TOKENS.colors.bgSidebar,
        border: `1px solid ${TOKENS.colors.borderSubtle}`,
        borderRadius: TOKENS.radius.lg,
        padding: TOKENS.spacing[6],
        marginBottom: TOKENS.spacing[6],
      }}
    >
      <h2
        style={{
          fontSize: TOKENS.fontSizes.lg,
          fontWeight: TOKENS.fontWeights.black,
          textTransform: 'uppercase',
          margin: `0 0 ${TOKENS.spacing[4]}px 0`,
        }}
      >
        {initialData ? 'Edit Vault' : 'Create New Vault'}
      </h2>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: TOKENS.spacing[4],
          }}
        >
          <FormField
            label="Name"
            value={formData.name}
            onChange={(v) => updateField('name', v)}
            error={errors.name}
            placeholder="e.g., HashVault Prime #1"
            required
          />

          <FormField
            label="Description"
            value={formData.description || ''}
            onChange={(v) => updateField('description', v)}
            placeholder="Optional description"
          />

          <FormField
            label="Vault Contract Address"
            value={formData.vaultAddress}
            onChange={(v) => updateField('vaultAddress', v as `0x${string}`)}
            error={errors.vaultAddress}
            placeholder="0x..."
            required
          />

          <FormField
            label="USDC Contract Address"
            value={formData.usdcAddress}
            onChange={(v) => updateField('usdcAddress', v as `0x${string}`)}
            error={errors.usdcAddress}
            placeholder="0x..."
            required
          />

          <FormField
            label="APR (%)"
            type="number"
            value={String(formData.apr)}
            onChange={(v) => updateField('apr', parseFloat(v) || 0)}
            error={errors.apr}
            required
          />

          <FormField
            label="Target Yield"
            value={formData.target}
            onChange={(v) => updateField('target', v)}
            placeholder="e.g., 36%"
            required
          />

          <FormField
            label="Lock Period (Days)"
            type="number"
            value={String(formData.lockPeriodDays)}
            onChange={(v) => updateField('lockPeriodDays', parseInt(v) || 0)}
            required
          />

          <FormField
            label="Minimum Deposit"
            type="number"
            value={String(formData.minDeposit)}
            onChange={(v) => updateField('minDeposit', parseFloat(v) || 0)}
            error={errors.minDeposit}
            placeholder="500000"
            required
          />

          <FormField
            label="Strategy"
            value={formData.strategy}
            onChange={(v) => updateField('strategy', v)}
            placeholder="e.g., RWA Mining · USDC Yield"
          />

          <FormField
            label="Fees"
            value={formData.fees}
            onChange={(v) => updateField('fees', v)}
            placeholder="e.g., 1.5% Mgmt · 15% Perf"
          />

          <FormField
            label="Risk Level"
            value={formData.risk}
            onChange={(v) => updateField('risk', v)}
            placeholder="e.g., Moderate, High, Low"
          />

          <FormField
            label="Image URL"
            value={formData.image || ''}
            onChange={(v) => updateField('image', v)}
            placeholder="https://..."
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: TOKENS.spacing[3],
            marginTop: TOKENS.spacing[6],
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            style={{
              padding: `${TOKENS.spacing[2]}px ${TOKENS.spacing[4]}px`,
              background: 'transparent',
              border: `1px solid ${TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radius.md,
              color: TOKENS.colors.textSecondary,
              fontSize: TOKENS.fontSizes.sm,
              fontWeight: TOKENS.fontWeights.bold,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            style={{
              padding: `${TOKENS.spacing[2]}px ${TOKENS.spacing[4]}px`,
              background: TOKENS.colors.accent,
              color: TOKENS.colors.black,
              border: 'none',
              borderRadius: TOKENS.radius.md,
              fontSize: TOKENS.fontSizes.sm,
              fontWeight: TOKENS.fontWeights.bold,
              cursor: isSaving ? 'wait' : 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? 'Saving...' : initialData ? 'Update Vault' : 'Create Vault'}
          </button>
        </div>
      </form>
    </div>
  )
}

function FormField({
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[2] }}>
      <label
        style={{
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: TOKENS.colors.textSecondary,
        }}
      >
        {label}
        {required && <span style={{ color: TOKENS.colors.accent }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: `${TOKENS.spacing[2]}px ${TOKENS.spacing[3]}px`,
          background: TOKENS.colors.bgTertiary,
          border: `1px solid ${error ? '#ef4444' : TOKENS.colors.borderSubtle}`,
          borderRadius: TOKENS.radius.md,
          color: TOKENS.colors.textPrimary,
          fontSize: TOKENS.fontSizes.sm,
          fontFamily: type === 'number' ? MONO : TOKENS.fonts.sans,
          outline: 'none',
        }}
      />
      {error && (
        <span style={{ fontSize: TOKENS.fontSizes.xs, color: '#ef4444' }}>{error}</span>
      )}
    </div>
  )
}

function VaultList({
  vaults,
  onEdit,
  onDelete,
  isDeleting,
}: {
  vaults: VaultConfig[]
  onEdit: (vault: VaultConfig) => void
  onDelete: (vaultId: string) => void
  isDeleting: boolean
}) {
  return (
    <div>
      <h3
        style={{
          fontSize: TOKENS.fontSizes.md,
          fontWeight: TOKENS.fontWeights.black,
          textTransform: 'uppercase',
          margin: `0 0 ${TOKENS.spacing[4]}px 0`,
        }}
      >
        Configured Vaults ({vaults.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[3] }}>
        {vaults.map((vault) => (
          <VaultCard
            key={vault.id}
            vault={vault}
            onEdit={() => onEdit(vault)}
            onDelete={() => onDelete(vault.id)}
            isDeleting={isDeleting}
          />
        ))}
      </div>
    </div>
  )
}

function VaultCard({
  vault,
  onEdit,
  onDelete,
  isDeleting,
}: {
  vault: VaultConfig
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: TOKENS.spacing[4],
        background: TOKENS.colors.bgSidebar,
        border: `1px solid ${TOKENS.colors.borderSubtle}`,
        borderRadius: TOKENS.radius.lg,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[4] }}>
        {vault.image && (
          <img
            src={vault.image}
            alt={vault.name}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: TOKENS.radius.md,
              objectFit: 'cover',
            }}
          />
        )}
        <div>
          <h4
            style={{
              fontSize: TOKENS.fontSizes.md,
              fontWeight: TOKENS.fontWeights.bold,
              margin: `0 0 ${TOKENS.spacing[2]}px 0`,
            }}
          >
            {vault.name}
          </h4>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: TOKENS.spacing[3],
              fontSize: TOKENS.fontSizes.xs,
              color: TOKENS.colors.textSecondary,
              fontFamily: MONO,
            }}
          >
            <span>{vault.apr}% APR</span>
            <span>·</span>
            <span>Target: {vault.target}</span>
            <span>·</span>
            <span>Min: {fmtUsd(vault.minDeposit)}</span>
          </div>
          <div
            style={{
              marginTop: TOKENS.spacing[2],
              fontSize: TOKENS.fontSizes.micro,
              color: TOKENS.colors.textGhost,
              fontFamily: MONO,
            }}
          >
            {vault.vaultAddress.slice(0, 8)}...{vault.vaultAddress.slice(-6)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: TOKENS.spacing[2] }}>
        <button
          onClick={onEdit}
          style={{
            padding: `${TOKENS.spacing[2]}px ${TOKENS.spacing[3]}px`,
            background: 'transparent',
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
            borderRadius: TOKENS.radius.md,
            color: TOKENS.colors.textSecondary,
            fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.bold,
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          style={{
            padding: `${TOKENS.spacing[2]}px ${TOKENS.spacing[3]}px`,
            background: 'transparent',
            border: `1px solid #ef4444`,
            borderRadius: TOKENS.radius.md,
            color: '#ef4444',
            fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.bold,
            cursor: isDeleting ? 'wait' : 'pointer',
            textTransform: 'uppercase',
            opacity: isDeleting ? 0.5 : 1,
          }}
        >
          {isDeleting ? '...' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${TOKENS.spacing[12]}px`,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: TOKENS.colors.bgTertiary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: TOKENS.spacing[4],
          color: TOKENS.colors.textSecondary,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3
        style={{
          fontSize: TOKENS.fontSizes.lg,
          fontWeight: TOKENS.fontWeights.bold,
          margin: `0 0 ${TOKENS.spacing[2]}px 0`,
        }}
      >
        No Vaults Configured
      </h3>
      <p
        style={{
          fontSize: TOKENS.fontSizes.sm,
          color: TOKENS.colors.textSecondary,
          margin: `0 0 ${TOKENS.spacing[4]}px 0`,
          maxWidth: '400px',
        }}
      >
        Create your first vault to enable deposits and yield generation in the app.
      </p>
      <button
        onClick={onAdd}
        style={{
          padding: `${TOKENS.spacing[3]}px ${TOKENS.spacing[6]}px`,
          background: TOKENS.colors.accent,
          color: TOKENS.colors.black,
          border: 'none',
          borderRadius: TOKENS.radius.md,
          fontSize: TOKENS.fontSizes.sm,
          fontWeight: TOKENS.fontWeights.bold,
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Create First Vault
      </button>
    </div>
  )
}

function LoadingState() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: TOKENS.spacing[12],
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: `3px solid ${TOKENS.colors.bgTertiary}`,
          borderTopColor: TOKENS.colors.accent,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: TOKENS.colors.bgApp,
        color: TOKENS.colors.textPrimary,
        fontFamily: TOKENS.fonts.sans,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${TOKENS.spacing[4]}px ${TOKENS.spacing[6]}px`,
          borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
          background: TOKENS.colors.bgSidebar,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[4] }}>
          <a
            href="/app"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: TOKENS.spacing[2],
              color: TOKENS.colors.textSecondary,
              textDecoration: 'none',
              fontSize: TOKENS.fontSizes.sm,
              fontWeight: TOKENS.fontWeights.bold,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span>←</span>
            <span>Back to App</span>
          </a>
          <h1 style={{ fontSize: TOKENS.fontSizes.xl, fontWeight: TOKENS.fontWeights.black, textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>
            Admin
          </h1>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
