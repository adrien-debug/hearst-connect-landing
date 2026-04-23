'use client'

import { useMarketingTheme } from './theme-provider'

interface ThemeToggleProps {
  variant?: 'default' | 'minimal' | 'icon-only'
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ThemeToggle({ 
  variant = 'default',
  className = '',
  size = 'md'
}: ThemeToggleProps) {
  const { isDark, toggle } = useMarketingTheme()

  const sizeClasses = {
    sm: { button: 'p-1.5', icon: 'w-4 h-4' },
    md: { button: 'p-2', icon: 'w-5 h-5' },
    lg: { button: 'p-2.5', icon: 'w-6 h-6' },
  }

  const baseClasses = `
    inline-flex items-center justify-center
    rounded-full
    transition-all duration-200 ease-out
    focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]
  `.trim()

  const variantClasses = {
    default: `
      ${baseClasses}
      bg-[var(--color-bg-elevated)]
      border border-[var(--color-border-default)]
      hover:bg-[var(--color-hover)]
      hover:border-[var(--color-border-strong)]
      text-[var(--color-text-secondary)]
      hover:text-[var(--color-text-primary)]
    `.trim(),
    minimal: `
      ${baseClasses}
      bg-transparent
      hover:bg-[var(--color-hover)]
      text-[var(--color-text-ghost)]
      hover:text-[var(--color-text-primary)]
    `.trim(),
    'icon-only': `
      ${baseClasses}
      bg-transparent
      hover:bg-[var(--color-hover)]
      text-[var(--color-text-secondary)]
      hover:text-[var(--color-accent)]
    `.trim(),
  }

  return (
    <button
      onClick={toggle}
      className={`${variantClasses[variant]} ${sizeClasses[size].button} ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <svg 
          className={sizeClasses[size].icon} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" 
          />
        </svg>
      ) : (
        <svg 
          className={sizeClasses[size].icon} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" 
          />
        </svg>
      )}
    </button>
  )
}
