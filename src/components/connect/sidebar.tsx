'use client'

import { Label } from '@/components/ui/label'
import { TOKENS, fmtUsdCompact } from './constants'
import type { VaultLine, ActiveVault, AvailableVault } from './data'
import { SIMULATION_VIEW_ID } from './view-ids'
import { VaultNode } from './vault-node'
import { fitValue, getSidebarWidthPx, useSmartFit } from './smart-fit'

interface SidebarProps {
  vaults: VaultLine[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function Sidebar({ vaults, selectedId, onSelect }: SidebarProps) {
  const { mode, isLimit, isCompactBottom } = useSmartFit({
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
  const isSimulation = selectedId === SIMULATION_VIEW_ID
  const sidePadH = isLimit ? TOKENS.spacing[3] : TOKENS.spacing[4]
  const sidePadV = fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[2] })

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
      <div
        style={{
          padding: `${sidePadV} ${sidePadH} ${TOKENS.spacing[2]}`,
          flexShrink: 0,
        }}
      >
        <Label id="side-portfolio" tone="sidebar" variant="text">
          Portfolio
        </Label>
        <div
          style={{
            fontFamily: TOKENS.fonts.sans,
            fontSize: isLimit ? TOKENS.fontSizes.md : TOKENS.fontSizes.lg,
            fontWeight: TOKENS.fontWeights.black,
            textTransform: 'uppercase' as const,
            color: TOKENS.colors.textOnDark,
            marginTop: TOKENS.spacing[2],
          }}
        >
          Portfolio
        </div>
        {!isOverview && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            style={{
              marginTop: TOKENS.spacing[2],
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
            Back to overview
          </button>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: `${sidePadV} ${sidePadH} 0`,
          minHeight: 0,
        }}
      >
        <Label id="side-active" tone="sidebar" variant="text">
          Active
        </Label>
        <div
          className="hide-scrollbar min-h-0 flex-1 overflow-y-auto"
          style={{ marginTop: TOKENS.spacing[2], paddingRight: 2, display: 'flex', flexDirection: 'column', gap: 0 }}
        >
          {activeVaults.length === 0 && (
            <p style={{ fontSize: TOKENS.fontSizes.micro, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.4 }}>No active positions</p>
          )}
          {activeVaults.map((v, i) => (
            <VaultNode
              key={v.id}
              kicker={!isCompactBottom ? `Vault ${i + 1}` : '•'}
              title={v.name}
              apy={`${v.progress}%`}
              amount={fmtUsdCompact(v.deposited)}
              selected={selectedId === v.id}
              onClick={() => onSelect(v.id)}
              mode={mode}
              showKicker={!isCompactBottom}
              isLimit={isLimit}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          padding: `${sidePadV} ${sidePadH} ${sidePadV}`,
          background: `linear-gradient(180deg, rgba(255,255,255,0) 0%, ${TOKENS.colors.accentDim} 100%)`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: sidePadV, alignItems: 'start' }}>
          <div>
            <Label id="side-sim" tone="sidebar" variant="text">
              Model
            </Label>
            <button
              type="button"
              onClick={() => onSelect(SIMULATION_VIEW_ID)}
              style={{
                width: '100%',
                background: isSimulation ? TOKENS.colors.surfaceActive : 'transparent',
                border: 'none',
                boxShadow: isSimulation ? `inset 0 0 0 1px ${TOKENS.colors.accent}` : 'none',
                padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[2]}`,
                marginTop: TOKENS.spacing[2],
                cursor: 'pointer',
                textAlign: 'left',
                color: TOKENS.colors.textOnDark,
                transition: '120ms ease-out',
              }}
              aria-pressed={isSimulation}
              aria-label="Open projection model"
            >
              <div
                style={{
                  fontFamily: TOKENS.fonts.mono,
                  fontSize: TOKENS.fontSizes.xs,
                  color: isSimulation ? TOKENS.colors.accent : 'rgba(255,255,255,0.45)',
                  textTransform: 'uppercase' as const,
                }}
              >
                Projection
              </div>
              <div
                style={{
                  fontSize: TOKENS.fontSizes.sm,
                  fontWeight: TOKENS.fontWeights.black,
                  textTransform: 'uppercase' as const,
                  marginTop: TOKENS.spacing[2],
                }}
              >
                Scenario lab
              </div>
            </button>
          </div>

          {availableVaults.length > 0 && (
            <div>
              <Label id="side-deals" tone="sidebar" variant="text">
                Available
              </Label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isCompactBottom && availableVaults.length > 1 ? '1fr 1fr' : '1fr',
                  gap: TOKENS.spacing[2],
                  marginTop: TOKENS.spacing[2],
                }}
              >
                {availableVaults.map((vault, i) => (
                  <VaultNode
                    key={vault.id}
                    kicker={!isCompactBottom ? `Deal ${i + 1}` : '•'}
                    title={vault.name}
                    apy={`${vault.apr}% APY`}
                    amount={fmtUsdCompact(vault.minDeposit)}
                    selected={selectedId === vault.id}
                    onClick={() => onSelect(vault.id)}
                    mode={mode}
                    showKicker={!isCompactBottom}
                    isLimit={isLimit}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
