'use client'

import { Label } from '@/components/ui/label'
import { TOKENS, MONO, VALUE_LETTER_SPACING } from './constants'
import type { CSSProperties } from 'react'

const rangeStyle: CSSProperties = {
  width: '100%',
  accentColor: TOKENS.colors.accent,
  cursor: 'pointer',
}

interface RangeSliderProps {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  formatValue: (value: number) => string
  minLabel?: string
  maxLabel?: string
  ariaLabel: string
  ariaValueText: (value: number) => string
  onChange: (value: number) => void
}

export function RangeSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  formatValue,
  minLabel,
  maxLabel,
  ariaLabel,
  ariaValueText,
  onChange,
}: RangeSliderProps) {
  return (
    <div
      style={{
        background: TOKENS.colors.bgSecondary,
        borderRadius: TOKENS.radius.md,
        padding: TOKENS.spacing[3],
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: TOKENS.spacing[2],
      }}>
        <Label id={id} tone="scene" variant="text">
          {label}
        </Label>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.md,
          fontWeight: TOKENS.fontWeights.black,
          letterSpacing: VALUE_LETTER_SPACING,
          color: TOKENS.colors.textPrimary,
        }}>
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={rangeStyle}
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={ariaValueText(value)}
      />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: TOKENS.spacing[2],
        fontFamily: MONO,
        fontSize: TOKENS.fontSizes.micro,
        color: TOKENS.colors.textGhost,
      }}>
        <span>{minLabel ?? formatValue(min)}</span>
        <span>{maxLabel ?? formatValue(max)}</span>
      </div>
    </div>
  )
}
