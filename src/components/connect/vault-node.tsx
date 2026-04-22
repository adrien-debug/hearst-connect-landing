import { TOKENS, fmtUsdCompact } from './constants'
import type { SmartFitMode } from './smart-fit'
import { fitValue } from './smart-fit'

export function VaultNode({
  title,
  kicker,
  apy,
  amount,
  selected,
  onClick,
  mode,
  showKicker = true,
  isLimit = false,
}: {
  title: string
  kicker: string
  apy: string
  amount: string
  selected: boolean
  onClick: () => void
  mode: SmartFitMode
  showKicker?: boolean
  isLimit?: boolean
}) {
  const apyColor = selected ? TOKENS.colors.accent : 'rgba(255,255,255,0.6)'

  const body = isLimit ? (
    <>
      <div style={{ minWidth: 0, gridColumn: '1 / -1' as const }}>
        {showKicker && (
          <div
            style={{
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)',
              marginBottom: TOKENS.spacing[2],
            }}
          >
            {kicker}
          </div>
        )}
        <div
          style={{
            fontFamily: TOKENS.fonts.sans,
            fontSize: TOKENS.fontSizes.sm,
            fontWeight: TOKENS.fontWeights.black,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          gridColumn: '1 / -1' as const,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginTop: TOKENS.spacing[2],
        }}
      >
        <span
          style={{
            fontFamily: TOKENS.fonts.mono,
            fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.bold,
            color: apyColor,
          }}
        >
          {apy}
        </span>
        <div
          style={{
            fontFamily: TOKENS.fonts.sans,
            fontSize: TOKENS.fontSizes.sm,
            fontWeight: TOKENS.fontWeights.black,
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          {amount}
        </div>
      </div>
    </>
  ) : (
    <>
      <div style={{ minWidth: 0 }}>
        {showKicker && (
          <div
            style={{
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)',
              marginBottom: TOKENS.spacing[2],
            }}
          >
            {kicker}
          </div>
        )}
        <div
          style={{
            fontFamily: TOKENS.fonts.sans,
            fontSize: TOKENS.fontSizes.sm,
            fontWeight: TOKENS.fontWeights.black,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
      </div>
      <span
        style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          textAlign: 'right',
          whiteSpace: 'nowrap',
          color: apyColor,
        }}
      >
        {apy}
      </span>
      <div
        style={{
          textAlign: 'right',
          fontFamily: TOKENS.fonts.sans,
          fontSize: TOKENS.fontSizes.sm,
          fontWeight: TOKENS.fontWeights.black,
          color: 'rgba(255,255,255,0.85)',
        }}
      >
        {amount}
      </div>
    </>
  )

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="w-full text-left"
      style={{
        display: 'grid',
        gridTemplateColumns: isLimit ? '1fr' : 'minmax(0,1.4fr) auto minmax(0,0.6fr)',
        alignItems: 'start',
        gap: isLimit ? 0 : TOKENS.spacing[3],
        background: selected ? TOKENS.colors.surfaceActive : 'transparent',
        border: 'none',
        boxShadow: selected
          ? `inset 0 0 0 1px rgba(167, 251, 144, 0.3)`
          : 'none',
        padding: fitValue(mode, { normal: TOKENS.spacing[3], tight: TOKENS.spacing[2], limit: TOKENS.spacing[2] }),
        color: TOKENS.colors.textOnDark,
        cursor: 'pointer',
        transition: '120ms ease-out',
      }}
    >
      {body}
    </button>
  )
}
