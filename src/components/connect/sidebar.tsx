'use client'

import '@/styles/ui/tokens.css'
import { Label } from '@/components/ui/label'
import { TOKENS, fmtUsdCompact, LINE_HEIGHT, VALUE_LETTER_SPACING } from './constants'
import type { VaultLine, ActiveVault, AvailableVault } from './data'
import { getSidebarWidthPx, useSmartFit, useShellPadding, fitValue } from './smart-fit'
import { SIMULATION_VIEW_ID } from './view-ids'

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
  const { padding: shellPadding, gap: shellGap } = useShellPadding(mode)

  // Check if we're in a specific vault view
  const inVaultView = selectedId !== null && selectedId !== SIMULATION_VIEW_ID
  const inSimulation = selectedId === SIMULATION_VIEW_ID

  return (
    <aside
      id="connect-sidebar"
      className="flex h-full min-h-0 shrink-0 flex-col"
      style={{
        width: sidebarW,
        maxWidth: '100%',
        background: TOKENS.colors.bgSidebar,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRight: `1px solid ${TOKENS.colors.borderSubtle}`,
      }}
    >
      {/* Logo Section — Always visible */}
      <div
        style={{
          padding: `${shellPadding}px`,
          borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
          flexShrink: 0,
          background: TOKENS.colors.bgApp,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <img
          src="/logos/hearst-connect-blackbg.svg"
          alt="Hearst Connect"
          style={{
            height: fitValue(mode, { normal: '40px', tight: '36px', limit: '32px' }),
            width: 'auto',
            maxWidth: '160px',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* Header — Always shows Portfolio/Position info */}
      <div
        style={{
          padding: `${shellPadding}px`,
          borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
          flexShrink: 0,
          background: TOKENS.colors.bgApp,
        }}
      >
        {/* Context row - shows where we are */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: inVaultView ? TOKENS.spacing[2] : 0,
        }}>
          <div style={{ textAlign: 'center', width: '100%' }}>
            <Label id="sidebar-title" tone="sidebar" variant="text">
              {inVaultView ? 'Position' : inSimulation ? 'Simulation' : 'Portfolio'}
            </Label>
          </div>
          
          {/* Back button when in a vault */}
          {inVaultView && (
            <button
              type="button"
              onClick={() => onSelect(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: TOKENS.spacing[2],
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
            >
              <span>←</span>
              <span>Back</span>
            </button>
          )}
        </div>

        {/* Main title */}
        <div
          style={{
            fontSize: fitValue(mode, {
              normal: TOKENS.fontSizes.lg,
              tight: TOKENS.fontSizes.md,
              limit: TOKENS.fontSizes.md,
            }),
            fontWeight: TOKENS.fontWeights.black,
            textTransform: 'uppercase',
            letterSpacing: VALUE_LETTER_SPACING,
            lineHeight: LINE_HEIGHT.tight,
            color: TOKENS.colors.textPrimary,
            marginTop: TOKENS.spacing[2],
            textAlign: 'center',
          }}
        >
          {inVaultView && selectedId
            ? activeVaults.find(v => v.id === selectedId)?.name.replace('HashVault ', '') || 'Position'
            : inSimulation
              ? 'Projection Model'
              : 'Overview'}
        </div>
      </div>

      {/* Active Vaults List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: `${shellPadding}px`,
        }}
        className="hide-scrollbar"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: `${shellGap}px`,
          }}
        >
          {activeVaults.map((v) => (
            <VaultCard
              key={v.id}
              vault={v}
              selected={selectedId === v.id}
              onClick={() => onSelect(v.id)}
              mode={mode}
            />
          ))}
        </div>
      </div>

      {/* Available Section */}
      {availableVaults.length > 0 && (
        <div
          style={{
            flexShrink: 0,
            borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
            background: 'var(--color-bg-secondary)',
            padding: `${shellPadding}px`,
          }}
        >
          <div style={{ textAlign: 'center', width: '100%' }}>
            <Label id="sidebar-available" tone="sidebar" variant="text">
              Available ({availableVaults.length})
            </Label>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: `${TOKENS.spacing[2]}px`,
              marginTop: TOKENS.spacing[3],
            }}
          >
            {availableVaults.map((vault) => (
              <AvailableVaultCard
                key={vault.id}
                vault={vault}
                selected={selectedId === vault.id}
                onClick={() => onSelect(vault.id)}
                mode={mode}
              />
            ))}
          </div>
        </div>
      )}

      {/* Big Simulation Button at bottom */}
      <div
        style={{
          flexShrink: 0,
          borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
          background: TOKENS.colors.bgApp,
          padding: `${shellPadding}px`,
        }}
      >
        <button
          type="button"
          onClick={() => onSelect(inSimulation ? null : SIMULATION_VIEW_ID)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: TOKENS.spacing[3],
            width: '100%',
            background: inSimulation
              ? 'var(--color-accent-subtle)'
              : 'rgba(0,0,0,0.3)',
            border: inSimulation
              ? `2px solid ${TOKENS.colors.accent}`
              : `1px solid ${TOKENS.colors.borderSubtle}`,
            borderRadius: '12px',
            padding: fitValue(mode, {
              normal: `${TOKENS.spacing[4]} ${TOKENS.spacing[4]}`,
              tight: `${TOKENS.spacing[3]} ${TOKENS.spacing[3]}`,
              limit: `${TOKENS.spacing[3]} ${TOKENS.spacing[2]}`,
            
            }),
            cursor: 'pointer',
            transition: 'all 150ms ease-out',
          }}
        >
          {/* Icon/graphic */}
          <div style={{
            width: fitValue(mode, { normal: '40px', tight: '36px', limit: '32px' }),
            height: fitValue(mode, { normal: '40px', tight: '36px', limit: '32px' }),
            borderRadius: '10px',
            background: inSimulation
              ? TOKENS.colors.accent
              : 'var(--color-bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              style={{
                color: inSimulation ? TOKENS.colors.black : TOKENS.colors.accent,
              }}
            >
              <path
                d="M3 12h3l3-9 6 18 3-9h3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: TOKENS.spacing[2],
          }}>
            <span style={{
              fontSize: fitValue(mode, {
                normal: TOKENS.fontSizes.md,
                tight: TOKENS.fontSizes.sm,
                limit: TOKENS.fontSizes.sm,
              }),
              fontWeight: TOKENS.fontWeights.black,
              letterSpacing: VALUE_LETTER_SPACING,
              textTransform: 'uppercase',
              color: inSimulation ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
            }}>
              Simulation
            </span>
            <span style={{
              fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              color: inSimulation ? TOKENS.colors.textSecondary : TOKENS.colors.textGhost,
            }}>
              Project yield scenarios
            </span>
          </div>

          {/* Arrow indicator */}
          <span style={{
            marginLeft: 'auto',
            fontSize: TOKENS.fontSizes.lg,
            color: inSimulation ? TOKENS.colors.accent : TOKENS.colors.textSecondary,
            transition: 'transform 150ms ease-out',
            transform: inSimulation ? 'rotate(90deg)' : 'none',
          }}>
            ›
          </span>
        </button>
      </div>
    </aside>
  )
}

function VaultCard({
  vault,
  selected,
  onClick,
  mode,
}: {
  vault: ActiveVault
  selected: boolean
  onClick: () => void
  mode: 'normal' | 'tight' | 'limit'
}) {
  const currentValue = vault.deposited + vault.claimable

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: selected
          ? 'var(--color-state-selected)'
          : 'var(--color-bg-secondary)',
        border: selected
          ? '2px solid var(--color-accent)'
          : '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: fitValue(mode, {
          normal: `${TOKENS.spacing[4]}px`,
          tight: `${TOKENS.spacing[3]}px`,
          limit: `${TOKENS.spacing[3]}px`,
        }),
        cursor: 'pointer',
        width: '100%',
        transition: 'all var(--transition-fast)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Selection indicator line */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: '20%',
        bottom: '20%',
        width: '3px',
        background: selected ? 'var(--color-accent)' : 'transparent',
        borderRadius: '0 2px 2px 0',
        transition: 'background var(--transition-fast)',
      }} />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: TOKENS.spacing[2],
        minWidth: 0,
        flex: 1,
        marginLeft: TOKENS.spacing[2],
        alignItems: 'center',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: TOKENS.spacing[2],
        }}>
          {selected && (
            <span style={{
              fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.bold,
              textTransform: 'uppercase',
              letterSpacing: TOKENS.letterSpacing.display,
              color: TOKENS.colors.accent,
              background: 'var(--color-accent-subtle)',
              padding: '2px 6px',
              borderRadius: '4px',
              lineHeight: 1,
            }}>
              Active
            </span>
          )}
          <span style={{
            fontSize: fitValue(mode, {
              normal: TOKENS.fontSizes.sm,
              tight: TOKENS.fontSizes.xs,
              limit: TOKENS.fontSizes.xs,
            }),
            fontWeight: TOKENS.fontWeights.black,
            textTransform: 'uppercase',
            letterSpacing: VALUE_LETTER_SPACING,
            color: selected
              ? TOKENS.colors.textPrimary
              : 'var(--color-text-secondary)',
            lineHeight: LINE_HEIGHT.tight,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {vault.name.replace('HashVault ', '')}
          </span>
        </div>

        <span style={{
          fontSize: fitValue(mode, {
            normal: TOKENS.fontSizes.md,
            tight: TOKENS.fontSizes.md,
            limit: TOKENS.fontSizes.sm,
          }),
          fontWeight: TOKENS.fontWeights.black,
          letterSpacing: VALUE_LETTER_SPACING,
          color: TOKENS.colors.textPrimary,
          lineHeight: LINE_HEIGHT.tight,
        }}>
          {fmtUsdCompact(currentValue)}
        </span>
      </div>

      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: fitValue(mode, {
            normal: TOKENS.fontSizes.md,
            tight: TOKENS.fontSizes.sm,
            limit: TOKENS.fontSizes.sm,
          }),
          fontWeight: TOKENS.fontWeights.black,
          color: selected
            ? TOKENS.colors.accent
            : '#AAAAAA',
          letterSpacing: VALUE_LETTER_SPACING,
          lineHeight: LINE_HEIGHT.tight,
        }}>
          {vault.apr}%
        </span>
        <span style={{
          display: 'block',
          fontSize: TOKENS.fontSizes.micro,
          color: TOKENS.colors.textGhost,
          marginTop: TOKENS.spacing[2],
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
        }}>
          APY
        </span>
      </div>
    </button>
  )
}

function AvailableVaultCard({
  vault,
  selected,
  onClick,
  mode,
}: {
  vault: AvailableVault
  selected: boolean
  onClick: () => void
  mode: 'normal' | 'tight' | 'limit'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: selected
          ? 'var(--color-accent-subtle)'
          : 'var(--color-bg-tertiary)',
        border: selected
          ? '1px solid var(--color-accent)'
          : '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: fitValue(mode, {
          normal: `${TOKENS.spacing[3]}px`,
          tight: `${TOKENS.spacing[2]}px`,
          limit: `${TOKENS.spacing[2]}px`,
        }),
        cursor: 'pointer',
        width: '100%',
        transition: 'all var(--transition-fast)',
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: TOKENS.spacing[2],
        minWidth: 0,
        flex: 1,
        alignItems: 'center',
        textAlign: 'center',
      }}>
        <span style={{
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.black,
          textTransform: 'uppercase',
          letterSpacing: VALUE_LETTER_SPACING,
          color: selected
            ? TOKENS.colors.textPrimary
            : 'var(--color-text-secondary)',
          lineHeight: LINE_HEIGHT.tight,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {vault.name.replace('HashVault ', '')}
        </span>
        <span style={{
          fontSize: TOKENS.fontSizes.micro,
          color: TOKENS.colors.textGhost,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
        }}>
          Min {fmtUsdCompact(vault.minDeposit)}
        </span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: TOKENS.spacing[2],
      }}>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.sm,
          fontWeight: TOKENS.fontWeights.black,
          color: selected
            ? TOKENS.colors.accent
            : '#999999',
          letterSpacing: VALUE_LETTER_SPACING,
        }}>
          {vault.apr}%
        </span>
        {selected && (
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: TOKENS.colors.accent,
            flexShrink: 0,
          }} />
        )}
      </div>
    </button>
  )
}
