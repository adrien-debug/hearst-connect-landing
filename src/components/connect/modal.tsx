'use client'

import { useEffect, useCallback, useRef } from 'react'
import { TOKENS } from './constants'
import { fitValue, type SmartFitMode } from './smart-fit'

type ModalSize = 'sm' | 'md' | 'lg'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: ModalSize
  mode?: SmartFitMode
  footer?: React.ReactNode
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  mode = 'normal',
  footer,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  // Store scroll position to restore on close
  const scrollYRef = useRef<number>(0)

  useEffect(() => {
    if (isOpen) {
      scrollYRef.current = window.scrollY
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollYRef.current}px`
      document.body.style.width = '100%'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollYRef.current)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const sizeStyles = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '520px' },
    lg: { maxWidth: '720px' },
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
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--hc-overlay)',
          animation: 'fadeIn 200ms ease-out',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          ...sizeStyles[size],
          background: TOKENS.colors.black,
          borderRadius: TOKENS.radius.lg,
          border: `1px solid ${TOKENS.colors.borderSubtle}`,
          boxShadow: 'var(--hc-shadow-lg)',
          animation: 'scaleIn 200ms ease-out',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 48px)',
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
            borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: fitValue(mode, {
                normal: TOKENS.fontSizes.lg,
                tight: TOKENS.fontSizes.md,
                limit: TOKENS.fontSizes.md,
              }),
              fontWeight: TOKENS.fontWeights.black,
              textTransform: 'uppercase',
              letterSpacing: TOKENS.letterSpacing.tight,
              color: TOKENS.colors.textPrimary,
              margin: 0,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
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
              borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
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
              width: '48px',
              height: '48px',
              border: `3px solid ${TOKENS.colors.borderSubtle}`,
              borderTopColor: TOKENS.colors.accent,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{ color: TOKENS.colors.textSecondary, margin: 0 }}>{message}</p>
        </>
      )}

      {state === 'success' && (
        <>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: TOKENS.colors.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'scaleIn 300ms ease-out',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: TOKENS.colors.danger,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
