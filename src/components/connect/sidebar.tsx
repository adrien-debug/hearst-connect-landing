'use client'

import { Label } from '@/components/ui/label'
import { TOKENS, fmtUsdCompact } from './constants'
import type { VaultLine, ActiveVault, AvailableVault } from './data'
import { VaultNode } from './vault-node'
import { getSidebarWidthPx, useSmartFit } from './smart-fit'

interface SidebarProps {
  vaults: VaultLine[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function Sidebar({ vaults, selectedId, onSelect }: SidebarProps) {
  const { mode } = useSmartFit({
    tightHeight: 760,
    limitHeight: 680,
    reserveHeight: 64,
  })
  const sidebarW = getSidebarWidthPx(mode)
  const activeVaults = vaults
    .filter((v): v is ActiveVault => v.type === 'active')
    .sort((a, b) => b.deposited - a.deposited)
  const availableVaults = vaults.filter((v): v is AvailableVault => v.type === 'available')
  const isOverview = selectedId === null
  const sidePadH = TOKENS.spacing[4]

  return (
    <aside
      id="connect-sidebar"
      className="flex h-full min-h-0 shrink-0 flex-col"
      style={{
        width: sidebarW,
        maxWidth: '100%',
        background: TOKENS.colors.bgSidebar,
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr) auto',
        overflow: 'hidden',
      }}
    >
      {/* Compact header — just back button when needed */}
      <div
        style={{
          padding: `${TOKENS.spacing[3]} ${sidePadH}`,
          flexShrink: 0,
        }}
      >
        {!isOverview && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.xs,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase' as const,
              color: TOKENS.colors.accent,
            }}
            aria-label="Back to portfolio overview"
          >
            ← Back to overview
          </button>
        )}
      </div>

      {/* Active vaults — ultra compact list */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: `0 ${sidePadH}`,
          flexShrink: 0,
          minHeight: 0,
        }}
      >
        <Label id="side-active" tone="sidebar" variant="text">
          Active ({activeVaults.length})
        </Label>
        <div
          style={{
            marginTop: TOKENS.spacing[2],
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {activeVaults.length === 0 && (
            <p style={{ fontSize: TOKENS.fontSizes.micro, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.4 }}>
              No active positions
            </p>
          )}
          {activeVaults.map((v, i) => (
            <VaultNode
              key={v.id}
              vault={v}
              vaultIndex={i}
              selected={selectedId === v.id}
              onClick={() => onSelect(v.id)}
              mode={mode}
            />
          ))}
        </div>
      </div>

      {/* Available section — subdued at bottom */}
      {availableVaults.length > 0 && (
        <>
          {/* Separator */}
          <div
            style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
              margin: `${TOKENS.spacing[3]} ${sidePadH}`,
            }}
          />
          <div
            style={{
              padding: `0 ${sidePadH} ${TOKENS.spacing[4]}`,
              flexShrink: 0,
            }}
          >
            <Label id="side-deals" tone="sidebar" variant="text">
              Available
            </Label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: TOKENS.spacing[2],
                marginTop: TOKENS.spacing[2],
              }}
            >
              {availableVaults.map((vault, i) => (
                <AvailableVaultNode
                  key={vault.id}
                  vault={vault}
                  vaultIndex={i}
                  selected={selectedId === vault.id}
                  onClick={() => onSelect(vault.id)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </aside>
  )
}

/** Subdued compact panel for available vaults */
function AvailableVaultNode({
  vault,
  selected,
  onClick,
}: {
  vault: AvailableVault
  vaultIndex: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="w-full text-left"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: selected
          ? `linear-gradient(90deg, rgba(167,251,144,0.05) 0%, transparent 100%)`
          : 'transparent',
        border: 'none',
        borderLeft: selected ? `2px solid ${TOKENS.colors.accent}` : '2px solid transparent',
        borderRadius: '0 6px 6px 0',
        padding: '8px 12px',
        cursor: 'pointer',
        transition: 'all 120ms ease-out',
        opacity: selected ? 1 : 0.6,
      }}
    >
      <span
        style={{
          fontFamily: TOKENS.fonts.sans,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.black,
          textTransform: 'uppercase',
          color: selected ? TOKENS.colors.textPrimary : 'rgba(255,255,255,0.5)',
        }}
      >
        {vault.name.replace('HashVault ', '')}
      </span>
      <span
        style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: '9px',
          fontWeight: TOKENS.fontWeights.bold,
          color: selected ? TOKENS.colors.accent : 'rgba(167,251,144,0.5)',
        }}
      >
        {vault.apr}%
      </span>
    </button>
  )
}
