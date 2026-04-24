'use client'

import { useState } from 'react'
import { useVaultRegistry } from '@/hooks/useVaultRegistry'
import { TOKENS, MONO, fmtUsd } from '@/components/connect/constants'
import { isAddress } from 'viem'
import type { VaultConfig, VaultConfigInput } from '@/types/vault'

export function VaultsSection() {
  const {
    vaults,
    isLoading,
    addVault,
    removeVault,
    updateVault,
    isAdding,
    isRemoving,
    isUpdating,
  } = useVaultRegistry()

  const [showForm, setShowForm] = useState(false)
  const [editingVault, setEditingVault] = useState<VaultConfig | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredVaults = vaults.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

  return (
    <div style={styles.container}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.searchBox}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search vaults..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <button
          onClick={() => {
            setEditingVault(null)
            setShowForm(true)
          }}
          style={styles.addButton}
        >
          <PlusIcon />
          Create Vault
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <VaultFormModal
          initialData={editingVault}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false)
            setEditingVault(null)
          }}
          isSaving={isAdding || isUpdating}
        />
      )}

      {/* Vaults Table */}
      <div style={styles.tableCard}>
        {isLoading ? (
          <LoadingState />
        ) : filteredVaults.length === 0 ? (
          <EmptyState onCreate={() => setShowForm(true)} />
        ) : (
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span style={styles.th}>Vault</span>
              <span style={styles.th}>Contract</span>
              <span style={styles.th}>APR</span>
              <span style={styles.th}>Target</span>
              <span style={styles.th}>Min Deposit</span>
              <span style={styles.th}>Lock</span>
              <span style={styles.th}>Actions</span>
            </div>
            <div style={styles.tableBody}>
              {filteredVaults.map((vault) => (
                <VaultRow
                  key={vault.id}
                  vault={vault}
                  onEdit={() => handleEdit(vault)}
                  onDelete={() => handleDelete(vault.id)}
                  isDeleting={isRemoving}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div style={styles.footerStats}>
        <span style={styles.footerStat}>
          Total: <strong>{vaults.length}</strong> vaults
        </span>
        <span style={styles.footerStat}>
          Active: <strong>{vaults.filter((v) => v.isActive !== false).length}</strong>
        </span>
        <span style={styles.footerStat}>
          Avg APR: <strong>{vaults.length > 0 ? (vaults.reduce((s, v) => s + v.apr, 0) / vaults.length).toFixed(1) : 0}%</strong>
        </span>
      </div>
    </div>
  )
}

function VaultRow({
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
    <div style={styles.tableRow}>
      <div style={styles.tdVault}>
        {vault.image && <img src={vault.image} alt="" style={styles.vaultImage} />}
        <div>
          <span style={styles.vaultName}>{vault.name}</span>
          <span style={styles.vaultStrategy}>{vault.strategy}</span>
        </div>
      </div>
      <span style={styles.tdMono}>
        {vault.vaultAddress.slice(0, 6)}...{vault.vaultAddress.slice(-4)}
      </span>
      <span style={styles.tdApr}>{vault.apr}%</span>
      <span style={styles.td}>{vault.target}</span>
      <span style={styles.td}>{fmtUsd(vault.minDeposit)}</span>
      <span style={styles.td}>{vault.lockPeriodDays} days</span>
      <div style={styles.tdActions}>
        <button onClick={onEdit} style={styles.actionBtn}>Edit</button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          style={{ ...styles.actionBtn, ...styles.deleteBtn }}
        >
          {isDeleting ? '...' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

function VaultFormModal({
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
    vaultAddress: (initialData?.vaultAddress || '') as `0x${string}`,
    usdcAddress: (initialData?.usdcAddress || '') as `0x${string}`,
    chain: initialData?.chain || {
      id: 8453,
      name: 'Base',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [''] } },
    } as const,
    apr: initialData?.apr || 12,
    target: initialData?.target || '36%',
    lockPeriodDays: initialData?.lockPeriodDays || 1095,
    minDeposit: initialData?.minDeposit || 500000,
    strategy: initialData?.strategy || '',
    fees: initialData?.fees || '',
    risk: initialData?.risk || 'Moderate',
    image: initialData?.image || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Required'
    if (!formData.vaultAddress || !isAddress(formData.vaultAddress)) {
      newErrors.vaultAddress = 'Valid address required'
    }
    if (!formData.usdcAddress || !isAddress(formData.usdcAddress)) {
      newErrors.usdcAddress = 'Valid address required'
    }
    if (formData.apr <= 0) newErrors.apr = 'Must be positive'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) onSave(formData)
  }

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>
            {initialData ? 'Edit Vault' : 'Create New Vault'}
          </h2>
          <button onClick={onCancel} style={styles.closeBtn}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            <FormField
              label="Name *"
              value={formData.name}
              onChange={(v) => setFormData((p) => ({ ...p, name: v }))}
              error={errors.name}
              placeholder="e.g., Prime Yield Vault"
            />
            <FormField
              label="Description"
              value={formData.description || ''}
              onChange={(v) => setFormData((p) => ({ ...p, description: v }))}
              placeholder="Short description..."
            />
            <FormField
              label="Vault Address *"
              value={formData.vaultAddress}
              onChange={(v) => setFormData((p) => ({ ...p, vaultAddress: v as `0x${string}` }))}
              error={errors.vaultAddress}
              placeholder="0x..."
            />
            <FormField
              label="USDC Address *"
              value={formData.usdcAddress}
              onChange={(v) => setFormData((p) => ({ ...p, usdcAddress: v as `0x${string}` }))}
              error={errors.usdcAddress}
              placeholder="0x..."
            />
            <FormField
              label="APR (%) *"
              type="number"
              value={String(formData.apr)}
              onChange={(v) => setFormData((p) => ({ ...p, apr: parseFloat(v) || 0 }))}
              error={errors.apr}
            />
            <FormField
              label="Target Yield"
              value={formData.target}
              onChange={(v) => setFormData((p) => ({ ...p, target: v }))}
              placeholder="e.g., 36%"
            />
            <FormField
              label="Lock Period (Days)"
              type="number"
              value={String(formData.lockPeriodDays)}
              onChange={(v) => setFormData((p) => ({ ...p, lockPeriodDays: parseInt(v) || 0 }))}
            />
            <FormField
              label="Min Deposit (USDC)"
              type="number"
              value={String(formData.minDeposit)}
              onChange={(v) => setFormData((p) => ({ ...p, minDeposit: parseFloat(v) || 0 }))}
            />
            <FormField
              label="Strategy"
              value={formData.strategy || ''}
              onChange={(v) => setFormData((p) => ({ ...p, strategy: v }))}
              placeholder="e.g., RWA Mining"
            />
            <FormField
              label="Fees"
              value={formData.fees || ''}
              onChange={(v) => setFormData((p) => ({ ...p, fees: v }))}
              placeholder="e.g., 1.5% Mgmt"
            />
            <FormField
              label="Risk Level"
              value={formData.risk || ''}
              onChange={(v) => setFormData((p) => ({ ...p, risk: v }))}
              placeholder="e.g., Moderate"
            />
            <FormField
              label="Image URL"
              value={formData.image || ''}
              onChange={(v) => setFormData((p) => ({ ...p, image: v }))}
              placeholder="https://..."
            />
          </div>

          <div style={styles.formActions}>
            <button type="button" onClick={onCancel} style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving} style={styles.saveBtn}>
              {isSaving ? 'Saving...' : initialData ? 'Update Vault' : 'Create Vault'}
            </button>
          </div>
        </form>
      </div>
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
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: string
  placeholder?: string
}) {
  return (
    <div style={styles.field}>
      <label style={styles.fieldLabel}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          ...styles.fieldInput,
          borderColor: error ? TOKENS.colors.danger : TOKENS.colors.borderSubtle,
        }}
      />
      {error && <span style={styles.fieldError}>{error}</span>}
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

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div style={styles.emptyState}>
      <p style={styles.emptyText}>No vaults configured yet</p>
      <button onClick={onCreate} style={styles.emptyBtn}>Create First Vault</button>
    </div>
  )
}

// Icons
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: TOKENS.spacing[4],
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: TOKENS.spacing[4],
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[3],
    flex: 1,
    maxWidth: '400px',
    padding: `${TOKENS.spacing[3]}px ${TOKENS.spacing[4]}px`,
    background: TOKENS.colors.bgSidebar,
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.md,
    color: TOKENS.colors.textSecondary,
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: TOKENS.colors.textPrimary,
    fontSize: TOKENS.fontSizes.sm,
    outline: 'none',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[2],
    padding: `${TOKENS.spacing[3]}px ${TOKENS.spacing[5]}px`,
    background: TOKENS.colors.accent,
    color: TOKENS.colors.black,
    border: 'none',
    borderRadius: TOKENS.radius.md,
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.bold,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  tableCard: {
    background: TOKENS.colors.bgSidebar,
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.lg,
    overflow: 'hidden',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 0.8fr 0.8fr 1fr 0.8fr 1.2fr',
    gap: TOKENS.spacing[4],
    padding: `${TOKENS.spacing[3]}px ${TOKENS.spacing[4]}px`,
    background: TOKENS.colors.bgApp,
    fontFamily: MONO,
    fontSize: TOKENS.fontSizes.micro,
    fontWeight: TOKENS.fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: TOKENS.letterSpacing.display,
    color: TOKENS.colors.textSecondary,
    borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
  },
  tableBody: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 0.8fr 0.8fr 1fr 0.8fr 1.2fr',
    gap: TOKENS.spacing[4],
    alignItems: 'center',
    padding: `${TOKENS.spacing[3]}px ${TOKENS.spacing[4]}px`,
    borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
    transition: 'background 0.15s ease',
  },
  th: {
    textAlign: 'left',
  },
  tdVault: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[3],
  },
  vaultImage: {
    width: '40px',
    height: '40px',
    borderRadius: TOKENS.radius.md,
    objectFit: 'cover',
  },
  vaultName: {
    display: 'block',
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.bold,
    color: TOKENS.colors.textPrimary,
  },
  vaultStrategy: {
    display: 'block',
    fontSize: TOKENS.fontSizes.micro,
    color: TOKENS.colors.textGhost,
    marginTop: TOKENS.spacing[1],
  },
  tdMono: {
    fontFamily: MONO,
    fontSize: TOKENS.fontSizes.xs,
    color: TOKENS.colors.textSecondary,
  },
  tdApr: {
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.black,
    color: TOKENS.colors.accent,
  },
  td: {
    fontSize: TOKENS.fontSizes.sm,
    color: TOKENS.colors.textSecondary,
  },
  tdActions: {
    display: 'flex',
    gap: TOKENS.spacing[2],
  },
  actionBtn: {
    padding: `${TOKENS.spacing[2]}px ${TOKENS.spacing[3]}px`,
    background: 'transparent',
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.md,
    color: TOKENS.colors.textSecondary,
    fontSize: TOKENS.fontSizes.xs,
    fontWeight: TOKENS.fontWeights.bold,
    cursor: 'pointer',
  },
  deleteBtn: {
    borderColor: TOKENS.colors.danger,
    color: TOKENS.colors.danger,
  },
  footerStats: {
    display: 'flex',
    gap: TOKENS.spacing[6],
    padding: `${TOKENS.spacing[3]}px ${TOKENS.spacing[4]}px`,
    fontSize: TOKENS.fontSizes.sm,
    color: TOKENS.colors.textSecondary,
  },
  footerStat: {
    fontFamily: MONO,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: TOKENS.spacing[6],
  },
  modal: {
    width: '100%',
    maxWidth: '800px',
    maxHeight: '90vh',
    background: TOKENS.colors.bgSidebar,
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.lg,
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${TOKENS.spacing[5]}px ${TOKENS.spacing[6]}px`,
    borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
  },
  modalTitle: {
    fontSize: TOKENS.fontSizes.lg,
    fontWeight: TOKENS.fontWeights.black,
    textTransform: 'uppercase',
    margin: 0,
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.md,
    color: TOKENS.colors.textSecondary,
    fontSize: '20px',
    cursor: 'pointer',
  },
  form: {
    padding: TOKENS.spacing[6],
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: TOKENS.spacing[4],
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: TOKENS.spacing[2],
  },
  fieldLabel: {
    fontSize: TOKENS.fontSizes.xs,
    fontWeight: TOKENS.fontWeights.bold,
    textTransform: 'uppercase',
    color: TOKENS.colors.textSecondary,
  },
  fieldInput: {
    padding: `${TOKENS.spacing[3]}px ${TOKENS.spacing[4]}px`,
    background: TOKENS.colors.bgTertiary,
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.md,
    color: TOKENS.colors.textPrimary,
    fontSize: TOKENS.fontSizes.sm,
    outline: 'none',
  },
  fieldError: {
    fontSize: TOKENS.fontSizes.xs,
    color: TOKENS.colors.danger,
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: TOKENS.spacing[3],
    marginTop: TOKENS.spacing[6],
    paddingTop: TOKENS.spacing[6],
    borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
  },
  cancelBtn: {
    padding: `${TOKENS.spacing[3]}px ${TOKENS.spacing[5]}px`,
    background: 'transparent',
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
    borderRadius: TOKENS.radius.md,
    color: TOKENS.colors.textSecondary,
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.bold,
    cursor: 'pointer',
    textTransform: 'uppercase',
  },
  saveBtn: {
    padding: `${TOKENS.spacing[3]}px ${TOKENS.spacing[5]}px`,
    background: TOKENS.colors.accent,
    border: 'none',
    borderRadius: TOKENS.radius.md,
    color: TOKENS.colors.black,
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.bold,
    cursor: 'pointer',
    textTransform: 'uppercase',
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: TOKENS.spacing[12],
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: `2px solid ${TOKENS.colors.bgTertiary}`,
    borderTopColor: TOKENS.colors.accent,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: TOKENS.spacing[12],
    gap: TOKENS.spacing[4],
  },
  emptyText: {
    fontSize: TOKENS.fontSizes.md,
    color: TOKENS.colors.textSecondary,
    margin: 0,
  },
  emptyBtn: {
    padding: `${TOKENS.spacing[3]}px ${TOKENS.spacing[6]}px`,
    background: TOKENS.colors.accent,
    color: TOKENS.colors.black,
    border: 'none',
    borderRadius: TOKENS.radius.md,
    fontSize: TOKENS.fontSizes.sm,
    fontWeight: TOKENS.fontWeights.bold,
    cursor: 'pointer',
    textTransform: 'uppercase',
  },
}
