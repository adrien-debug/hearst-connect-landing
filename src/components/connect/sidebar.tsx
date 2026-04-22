'use client'

import { TOKENS, fmtUsdCompact } from './constants'
import type { Aggregate, VaultLine, ActiveVault, AvailableVault } from './data'
import { SIMULATION_VIEW_ID } from './view-ids'

interface SidebarProps {
  vaults: VaultLine[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  agg: Aggregate
}

export function Sidebar({ vaults, selectedId, onSelect, agg }: SidebarProps) {
  const activeVaults = vaults
    .filter((v): v is ActiveVault => v.type === 'active')
    .sort((a, b) => b.deposited - a.deposited)
  const availableVaults = vaults.filter((v): v is AvailableVault => v.type === 'available')
  const isOverview = selectedId === null
  const isSimulation = selectedId === SIMULATION_VIEW_ID

  return (
    <aside
      id="connect-sidebar"
      className="flex h-full min-h-0 flex-col shrink-0"
      style={{
        width: '360px',
        background: TOKENS.colors.black,
        borderRight: `${TOKENS.borders.thin} solid rgba(255,255,255,0.12)`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{
        padding: `${TOKENS.spacing[6]} ${TOKENS.spacing[8]} ${TOKENS.spacing[4]}`,
        borderBottom: `1px solid rgba(255,255,255,0.12)`,
        flexShrink: 0,
      }}>
        <SectionLabel>Portfolio</SectionLabel>
        <div style={{
          fontFamily: TOKENS.fonts.sans,
          fontSize: TOKENS.fontSizes.lg,
          fontWeight: TOKENS.fontWeights.black,
          textTransform: 'uppercase',
          color: TOKENS.colors.textOnDark,
        }}>
          Portfolio
        </div>
        {!isOverview && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            style={{
              marginTop: TOKENS.spacing[3],
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.xs,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              color: TOKENS.colors.accent,
            }}
          >
            Back to Overview
          </button>
        )}
      </div>

      <div style={{
        flex: 1,
        overflow: 'hidden',
        padding: `${TOKENS.spacing[6]} ${TOKENS.spacing[8]}`,
        minHeight: 0,
        borderBottom: `1px solid rgba(255,255,255,0.12)`,
      }}>
        <SectionLabel>Active Positions</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[6] }}>
          {activeVaults.map((v, index) => {
            const isSel = selectedId === v.id
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelect(v.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: isSel ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: `${TOKENS.borders.thin} solid ${isSel ? TOKENS.colors.accent : 'rgba(255,255,255,0.12)'}`,
                  padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
                  cursor: 'pointer',
                  transition: '120ms ease-out',
                  boxShadow: isSel ? `inset 0 0 0 1px ${TOKENS.colors.accent}` : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: TOKENS.spacing[4] }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontFamily: TOKENS.fonts.mono,
                      fontSize: TOKENS.fontSizes.xs,
                      fontWeight: TOKENS.fontWeights.bold,
                      letterSpacing: TOKENS.letterSpacing.display,
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.45)',
                      marginBottom: TOKENS.spacing[2],
                    }}>
                      Vault {index + 1}
                    </div>
                    <div style={{
                      fontFamily: TOKENS.fonts.sans,
                      fontSize: TOKENS.fontSizes.sm,
                      fontWeight: TOKENS.fontWeights.black,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: TOKENS.colors.textOnDark,
                      marginBottom: '4px',
                    }}>{v.name}</div>
                  </div>
                  <span style={{
                    fontFamily: TOKENS.fonts.mono,
                    fontSize: TOKENS.fontSizes.xs,
                    fontWeight: TOKENS.fontWeights.bold,
                    textTransform: 'uppercase',
                    letterSpacing: TOKENS.letterSpacing.wide,
                    color: isSel ? TOKENS.colors.accent : 'rgba(255,255,255,0.55)',
                    whiteSpace: 'nowrap',
                  }}>
                    {v.progress}%
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: TOKENS.spacing[3], marginTop: TOKENS.spacing[3] }}>
                  <RegisterMetric label="Current Value" value={fmtUsdCompact(v.deposited)} />
                  <RegisterMetric label="Available Yield" value={fmtUsdCompact(v.claimable)} accent />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{
        padding: `${TOKENS.spacing[6]} ${TOKENS.spacing[8]} ${TOKENS.spacing[6]}`,
        borderTop: `1px solid rgba(255,255,255,0.12)`,
        background: `linear-gradient(180deg, rgba(255,255,255,0) 0%, ${TOKENS.colors.accentDim} 100%)`,
        flexShrink: 0,
      }}>
        <SectionLabel>Simulation</SectionLabel>
        <button
          type="button"
          onClick={() => onSelect(SIMULATION_VIEW_ID)}
          style={{
            width: '100%',
            background: TOKENS.colors.accent,
            border: `${TOKENS.borders.thin} solid ${isSimulation ? TOKENS.colors.white : TOKENS.colors.accent}`,
            padding: TOKENS.spacing[4],
            cursor: 'pointer',
            textAlign: 'left',
            color: TOKENS.colors.black,
            boxShadow: isSimulation ? `inset 0 0 0 1px ${TOKENS.colors.white}` : 'none',
            marginBottom: availableVaults.length > 0 ? TOKENS.spacing[6] : '0px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: TOKENS.spacing[4] }}>
            <div>
              <div style={{
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
                color: 'rgba(0,0,0,0.55)',
                marginBottom: TOKENS.spacing[2],
              }}>
                Simulation
              </div>
              <div style={{
                fontFamily: TOKENS.fonts.sans,
                fontSize: TOKENS.fontSizes.sm,
                fontWeight: TOKENS.fontWeights.black,
                textTransform: 'uppercase',
                color: TOKENS.colors.black,
                marginBottom: TOKENS.spacing[2],
              }}>
                Projection Tool
              </div>
            </div>
            <div style={{
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.xs,
              fontWeight: TOKENS.fontWeights.bold,
              color: TOKENS.colors.black,
              whiteSpace: 'nowrap',
            }}>
              Open
            </div>
          </div>
          <div style={{
            fontFamily: TOKENS.fonts.mono,
            fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.bold,
            color: 'rgba(0,0,0,0.65)',
          }}>
            Bear / Base / Bull · BTC Price · Time · Graph
          </div>
        </button>

        {availableVaults.length > 0 && (
          <>
            <SectionLabel>Available Deals</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[3] }}>
              {availableVaults.map((vault, index) => {
                const isSelected = selectedId === vault.id
                return (
                  <button
                    key={vault.id}
                    type="button"
                    onClick={() => onSelect(vault.id)}
                    style={{
                      width: '100%',
                      background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `${TOKENS.borders.thin} solid ${isSelected ? TOKENS.colors.accent : 'rgba(255,255,255,0.16)'}`,
                      padding: TOKENS.spacing[4],
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: TOKENS.spacing[4] }}>
                      <div>
                        <div style={{
                          fontFamily: TOKENS.fonts.mono,
                          fontSize: TOKENS.fontSizes.xs,
                          fontWeight: TOKENS.fontWeights.bold,
                          letterSpacing: TOKENS.letterSpacing.display,
                          textTransform: 'uppercase',
                          color: 'rgba(255,255,255,0.45)',
                          marginBottom: TOKENS.spacing[2],
                        }}>
                          Deal {index + 1}
                        </div>
                        <div style={{
                          fontFamily: TOKENS.fonts.sans,
                          fontSize: TOKENS.fontSizes.sm,
                          fontWeight: TOKENS.fontWeights.black,
                          textTransform: 'uppercase',
                          color: TOKENS.colors.textOnDark,
                          marginBottom: TOKENS.spacing[2],
                        }}>
                          {vault.name}
                        </div>
                      </div>
                      <div style={{
                        fontFamily: TOKENS.fonts.mono,
                        fontSize: TOKENS.fontSizes.xs,
                        fontWeight: TOKENS.fontWeights.bold,
                        color: TOKENS.colors.accent,
                        whiteSpace: 'nowrap',
                      }}>
                        {vault.apr}% APY
                      </div>
                    </div>
                    <div style={{
                      fontFamily: TOKENS.fonts.mono,
                      fontSize: TOKENS.fontSizes.xs,
                      fontWeight: TOKENS.fontWeights.bold,
                      color: 'rgba(255,255,255,0.55)',
                    }}>
                      Min. {fmtUsdCompact(vault.minDeposit)}
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </aside>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: TOKENS.fonts.mono,
      fontSize: TOKENS.fontSizes.xs,
      fontWeight: TOKENS.fontWeights.bold,
      letterSpacing: TOKENS.letterSpacing.display,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.45)',
      marginBottom: TOKENS.spacing[4],
      display: 'flex',
      alignItems: 'center',
      gap: TOKENS.spacing[3],
    }}>
      {children}
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' }} />
    </div>
  )
}

function RegisterMetric({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div>
      <div style={{
        fontFamily: TOKENS.fonts.mono,
        fontSize: TOKENS.fontSizes.xs,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.45)',
        marginBottom: TOKENS.spacing[2],
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: TOKENS.fonts.sans,
        fontSize: TOKENS.fontSizes.sm,
        fontWeight: TOKENS.fontWeights.black,
        color: accent ? TOKENS.colors.accent : TOKENS.colors.textOnDark,
      }}>
        {value}
      </div>
    </div>
  )
}
