'use client'

import { TOKENS } from './constants'
import type { SmartFitMode } from './smart-fit'
import type { ActiveVault } from './data'

interface VaultNodeProps {
  vault: ActiveVault
  vaultIndex: number
  selected: boolean
  onClick: () => void
  mode: SmartFitMode
}

/** Ultra-minimal vault button — just the name */
export function VaultNode({
  vault,
  selected,
  onClick,
}: VaultNodeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left"
      style={{
        display: 'flex',
        alignItems: 'center',
        background: selected
          ? `linear-gradient(90deg, rgba(167,251,144,0.08) 0%, transparent 100%)`
          : 'transparent',
        border: 'none',
        borderLeft: selected ? `2px solid ${TOKENS.colors.accent}` : '2px solid transparent',
        borderRadius: '0 6px 6px 0',
        padding: '10px 12px',
        cursor: 'pointer',
        transition: 'all 120ms ease-out',
      }}
    >
      <span
        style={{
          fontFamily: TOKENS.fonts.sans,
          fontSize: TOKENS.fontSizes.sm,
          fontWeight: TOKENS.fontWeights.black,
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          color: selected ? TOKENS.colors.textPrimary : 'rgba(255,255,255,0.6)',
        }}
      >
        {vault.name.replace('HashVault ', '')}
      </span>
    </button>
  )
}
