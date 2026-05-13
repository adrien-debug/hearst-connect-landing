'use client'

import { useEffect, useCallback, useId, useRef } from 'react'
import { TOKENS } from './constants'
import { fitValue, type SmartFitMode } from './smart-fit'
import { prefersReducedMotion } from '@/lib/reduced-motion'

const FOCUSABLE_SELECTORS = 'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// An element is reachable if it's actually rendered + not visually hidden.
// `offsetParent === null` catches display:none ancestors and out-of-tree nodes
// — cheap heuristic that the standard focusable selector misses.
function isVisible(el: HTMLElement): boolean {
  return !!el.offsetParent || el === document.activeElement
}

type ModalSize = 'sm' | 'md' | 'lg'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: ModalSize
  mode?: SmartFitMode
  footer?: React.ReactNode
  // When false, ESC and backdrop click are ignored. Use during in-flight
  // transactions to prevent accidental dismissal of a pending action.
  dismissable?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  mode = 'normal',
  footer,
  dismissable = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const scrollYRef = useRef<number>(0)
  // Snapshot the element that had focus when the modal opened so we can
  // restore focus there on close — standard a11y pattern.
  const openerRef = useRef<HTMLElement | null>(null)
  // Tracks whether the current click sequence started on the backdrop, so a
  // drag-out from an input selection doesn't dismiss the modal.
  const backdropMouseDownRef = useRef<boolean>(false)
  const titleId = useId()

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (dismissable) onClose()
        return
      }
      if (event.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
        ).filter(isVisible)
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        const active = document.activeElement
        // If focus escaped the modal entirely (programmatic blur, content
        // re-render, etc.), pull it back to the first focusable.
        if (!(active instanceof Node) || !modalRef.current.contains(active)) {
          event.preventDefault()
          first.focus()
          return
        }
        if (event.shiftKey) {
          if (active === first) { event.preventDefault(); last.focus() }
        } else {
          if (active === last) { event.preventDefault(); first.focus() }
        }
      }
    },
    [onClose, dismissable]
  )

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Capture the opener (typically the button that triggered the modal)
      // so we can return focus there on close.
      openerRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
      modalRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTORS)?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      scrollYRef.current = window.scrollY
      // Compensate the disappearing scrollbar so the page underneath doesn't
      // shift horizontally when the modal opens (desktop with permanent
      // scrollbars). Mobile gets 0 here, which is correct.
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollYRef.current}px`
      document.body.style.width = '100%'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.paddingRight = ''
      window.scrollTo(0, scrollYRef.current)
      // Return focus to the opener so keyboard users don't get dumped at the
      // top of the page after the modal unmounts.
      openerRef.current?.focus?.()
      openerRef.current = null
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const reducedMotion = prefersReducedMotion()
  const backdropAnim = reducedMotion ? 'none' : 'fadeIn var(--dashboard-duration) var(--dashboard-ease)'
  const dialogAnim = reducedMotion ? 'none' : 'scaleIn var(--dashboard-duration) var(--dashboard-ease)'

  // Semantic widths from theme/tokens.css. Each var clamps with min() so the
  // modal can never exceed the viewport minus a gutter — kills the mobile
  // edge-bleed without per-call media queries.
  const sizeStyles = {
    sm: { maxWidth: 'var(--modal-width-sm)' },
    md: { maxWidth: 'var(--modal-width-md)' },
    lg: { maxWidth: 'var(--modal-width-lg)' },
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: TOKENS.spacing[4],
      }}
    >
      {/* Backdrop — clicking dismisses; not focusable, hidden from a11y tree.
       * mousedown/click both required on the backdrop itself, so a click that
       * starts inside an input and drags onto the backdrop never closes. */}
      <div
        onMouseDown={(e) => {
          backdropMouseDownRef.current = e.target === e.currentTarget
        }}
        onClick={(e) => {
          if (!dismissable) return
          if (e.target === e.currentTarget && backdropMouseDownRef.current) {
            onClose()
          }
          backdropMouseDownRef.current = false
        }}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--hc-overlay)',
          animation: backdropAnim,
        }}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          position: 'relative',
          width: '100%',
          ...sizeStyles[size],
          background: TOKENS.colors.black,
          borderRadius: TOKENS.radius.lg,
          border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
          boxShadow: 'var(--hc-shadow-lg)',
          animation: dialogAnim,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100dvh - var(--space-12))',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: fitValue(mode, {
              normal: TOKENS.spacing[4],
              tight: TOKENS.spacing[3],
              limit: TOKENS.spacing[3],
            }),
            borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
            flexShrink: 0,
          }}
        >
          <h2
            id={titleId}
            style={{
              fontSize: fitValue(mode, {
                normal: TOKENS.fontSizes.lg,
                tight: TOKENS.fontSizes.md,
                limit: TOKENS.fontSizes.md,
              }),
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.normal,
              color: TOKENS.colors.textPrimary,
              margin: 0,
            }}
          >
            {title}
          </h2>
          {dismissable && (
            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: TOKENS.spacing[8],
                height: TOKENS.spacing[8],
                background: 'transparent',
                border: 'none',
                borderRadius: TOKENS.radius.md,
                color: TOKENS.colors.textSecondary,
                cursor: 'pointer',
                fontSize: TOKENS.fontSizes.xl,
                lineHeight: 1,
              }}
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>

        {/* Content */}
        <div
          className="hide-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: fitValue(mode, {
              normal: TOKENS.spacing[4],
              tight: TOKENS.spacing[3],
              limit: TOKENS.spacing[3],
            }),
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: fitValue(mode, {
                normal: TOKENS.spacing[4],
                tight: TOKENS.spacing[3],
                limit: TOKENS.spacing[3],
              }),
              borderTop: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}

// Transaction state component for modals
export function TransactionState({
  state,
  message,
}: {
  state: 'idle' | 'pending' | 'success' | 'error'
  message: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: TOKENS.spacing[4],
        padding: TOKENS.spacing[6],
      }}
    >
      {state === 'pending' && (
        <>
          <div
            style={{
              width: TOKENS.spacing[12],
              height: TOKENS.spacing[12],
              border: `${TOKENS.borders.heavy} solid ${TOKENS.colors.borderSubtle}`,
              borderTopColor: TOKENS.colors.accent,
              borderRadius: TOKENS.radius.full,
              animation: 'spin var(--dashboard-duration-loader, 1s) linear infinite',
            }}
          />
          <p style={{ color: TOKENS.colors.textSecondary, margin: 0 }}>{message}</p>
        </>
      )}

      {state === 'success' && (
        <>
          <div
            style={{
              width: TOKENS.spacing[12],
              height: TOKENS.spacing[12],
              borderRadius: TOKENS.radius.full,
              background: TOKENS.colors.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'scaleIn var(--dashboard-duration-slow) var(--dashboard-ease)',
            }}
          >
            <svg width={TOKENS.spacing[6]} height={TOKENS.spacing[6]} viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12l5 5L20 7"
                stroke={TOKENS.colors.black}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p style={{ color: TOKENS.colors.accent, margin: 0, fontWeight: TOKENS.fontWeights.bold }}>
            {message}
          </p>
        </>
      )}

      {state === 'error' && (
        <>
          <div
            style={{
              width: TOKENS.spacing[12],
              height: TOKENS.spacing[12],
              borderRadius: TOKENS.radius.full,
              background: TOKENS.colors.danger,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width={TOKENS.spacing[6]} height={TOKENS.spacing[6]} viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke={TOKENS.colors.white}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p style={{ color: TOKENS.colors.danger, margin: 0 }}>{message}</p>
        </>
      )}

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
