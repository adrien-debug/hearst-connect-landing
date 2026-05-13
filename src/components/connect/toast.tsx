'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { TOKENS } from './constants'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastAction {
  label: string
  href?: string
  onClick?: () => void
}

export interface ToastInput {
  variant: ToastVariant
  title: string
  body?: string
  action?: ToastAction
  /** ms before auto-dismiss. 0 = sticky. Default 5000. */
  duration?: number
}

interface ToastRecord extends ToastInput {
  id: string
  // Pre-resolved auto-dismiss delay (ms). The item owns its timer so it can
  // pause on hover/focus and resume on leave/blur.
  duration: number
}

interface ToastApi {
  show: (toast: ToastInput) => string
  success: (title: string, opts?: Omit<ToastInput, 'variant' | 'title'>) => string
  error: (title: string, opts?: Omit<ToastInput, 'variant' | 'title'>) => string
  info: (title: string, opts?: Omit<ToastInput, 'variant' | 'title'>) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const DEFAULT_DURATION = 5000
const ERROR_DURATION = 8000

function genId(): string {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (input: ToastInput): string => {
      const id = genId()
      const duration = input.duration ?? (input.variant === 'error' ? ERROR_DURATION : DEFAULT_DURATION)
      setToasts((prev) => [...prev, { ...input, id, duration }])
      return id
    },
    [],
  )

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, opts) => show({ variant: 'success', title, ...opts }),
      error: (title, opts) => show({ variant: 'error', title, ...opts }),
      info: (title, opts) => show({ variant: 'info', title, ...opts }),
      dismiss,
    }),
    [show, dismiss],
  )

  // Split hosts: errors are announced assertively so screen readers interrupt
  // the current task to surface a failure; success/info stay polite.
  const errorToasts = toasts.filter((t) => t.variant === 'error')
  const politeToasts = toasts.filter((t) => t.variant !== 'error')

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastHost toasts={politeToasts} onDismiss={dismiss} live="polite" />
      <ToastHost toasts={errorToasts} onDismiss={dismiss} live="assertive" offset />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}

function ToastHost({
  toasts,
  onDismiss,
  live,
  offset,
}: {
  toasts: ToastRecord[]
  onDismiss: (id: string) => void
  live: 'polite' | 'assertive'
  offset?: boolean
}) {
  if (toasts.length === 0) return null
  return (
    <div
      role={live === 'assertive' ? 'alert' : 'status'}
      aria-live={live}
      style={{
        position: 'fixed',
        right: TOKENS.spacing[6],
        // Errors stack above success toasts so a failure is never visually
        // buried by a stale success message.
        bottom: offset ? TOKENS.spacing[24] : TOKENS.spacing[20],
        zIndex: TOKENS.zIndex.toast,
        display: 'flex',
        flexDirection: 'column',
        gap: TOKENS.spacing[3],
        pointerEvents: 'none',
        maxWidth: 360,
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: ToastRecord; onDismiss: () => void }) {
  const accent = variantAccent(toast.variant)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const remainingRef = useRef<number>(toast.duration)
  const startRef = useRef<number>(Date.now())

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback(
    (delay: number) => {
      clear()
      if (delay <= 0) return
      startRef.current = Date.now()
      timerRef.current = setTimeout(() => onDismiss(), delay)
    },
    [clear, onDismiss],
  )

  useEffect(() => {
    start(toast.duration)
    return clear
  }, [start, clear, toast.duration])

  const pause = () => {
    if (!timerRef.current) return
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startRef.current))
    clear()
  }
  const resume = () => start(remainingRef.current)

  return (
    <div
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: TOKENS.spacing[2],
        padding: TOKENS.spacing[4],
        background: TOKENS.colors.black,
        border: `${TOKENS.borders.thin} solid ${accent}`,
        borderRadius: TOKENS.radius.md,
        fontFamily: TOKENS.fonts.sans,
        color: TOKENS.colors.textPrimary,
        boxShadow: 'none',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: TOKENS.spacing[3],
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: TOKENS.spacing[2],
          minWidth: 0,
        }}>
          <span
            aria-hidden
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 18,
              height: 18,
              borderRadius: TOKENS.radius.full,
              border: `${TOKENS.borders.thin} solid ${accent}`,
              color: accent,
              fontFamily: TOKENS.fonts.mono,
              fontSize: 11,
              fontWeight: TOKENS.fontWeights.black,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {variantGlyph(toast.variant)}
          </span>
          <span style={{
            fontSize: TOKENS.fontSizes.sm,
            fontWeight: TOKENS.fontWeights.bold,
            color: TOKENS.colors.textPrimary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {toast.title}
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: TOKENS.colors.textGhost,
            fontFamily: TOKENS.fonts.mono,
            fontSize: TOKENS.fontSizes.sm,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>
      {toast.body && (
        <p style={{
          margin: 0,
          fontSize: TOKENS.fontSizes.xs,
          color: TOKENS.colors.textSecondary,
          lineHeight: 1.45,
        }}>
          {toast.body}
        </p>
      )}
      {toast.action && (
        <ToastActionLink action={toast.action} accent={accent} onAfterClick={onDismiss} />
      )}
    </div>
  )
}

function ToastActionLink({
  action,
  accent,
  onAfterClick,
}: {
  action: ToastAction
  accent: string
  onAfterClick: () => void
}) {
  const baseStyle = {
    fontFamily: TOKENS.fonts.mono,
    fontSize: TOKENS.fontSizes.micro,
    fontWeight: TOKENS.fontWeights.bold,
    letterSpacing: TOKENS.letterSpacing.display,
    textTransform: 'uppercase' as const,
    color: accent,
    background: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    width: 'fit-content',
    textDecoration: 'underline',
    textDecorationColor: accent,
    textUnderlineOffset: '3px',
  }
  if (action.href) {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          action.onClick?.()
          onAfterClick()
        }}
        style={baseStyle}
      >
        {action.label} ↗
      </a>
    )
  }
  return (
    <button
      type="button"
      onClick={() => {
        action.onClick?.()
        onAfterClick()
      }}
      style={baseStyle}
    >
      {action.label}
    </button>
  )
}

function variantAccent(variant: ToastVariant): string {
  switch (variant) {
    case 'success':
      return TOKENS.colors.accent
    case 'error':
      return TOKENS.colors.danger
    case 'info':
      return TOKENS.colors.borderStrong
  }
}

function variantGlyph(variant: ToastVariant): string {
  switch (variant) {
    case 'success':
      return '✓'
    case 'error':
      return '!'
    case 'info':
      return 'i'
  }
}
