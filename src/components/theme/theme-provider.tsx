'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'dark' | 'light' | 'system'
type ResolvedTheme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'hearst-theme'
const THEME_ATTR = 'data-theme'

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(STORAGE_KEY) as Theme | null
  } catch {
    return null
  }
}

function storeTheme(theme: Theme) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Ignore storage errors (e.g., private mode)
  }
}

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  forcedTheme?: ResolvedTheme
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  forcedTheme,
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = getStoredTheme()
    const initialTheme = stored || defaultTheme
    setThemeState(initialTheme)
    
    if (forcedTheme) {
      setResolvedTheme(forcedTheme)
    } else if (initialTheme === 'system' && enableSystem) {
      setResolvedTheme(getSystemTheme())
    } else {
      setResolvedTheme(initialTheme as ResolvedTheme)
    }
    
    setMounted(true)
  }, [defaultTheme, forcedTheme, enableSystem])

  useEffect(() => {
    if (!enableSystem || theme !== 'system' || forcedTheme) return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light')
    }
    
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme, enableSystem, forcedTheme])

  useEffect(() => {
    if (!mounted) return
    
    const root = document.documentElement
    const effectiveTheme = forcedTheme || resolvedTheme
    
    if (disableTransitionOnChange) {
      root.style.transition = 'none'
    }
    
    root.setAttribute(THEME_ATTR, effectiveTheme)
    
    if (disableTransitionOnChange) {
      requestAnimationFrame(() => {
        root.style.transition = ''
      })
    }
  }, [resolvedTheme, forcedTheme, mounted, disableTransitionOnChange])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    storeTheme(newTheme)
    
    if (forcedTheme) {
      setResolvedTheme(forcedTheme)
    } else if (newTheme === 'system' && enableSystem) {
      setResolvedTheme(getSystemTheme())
    } else {
      setResolvedTheme(newTheme as ResolvedTheme)
    }
  }

  const toggleTheme = () => {
    if (forcedTheme) return
    
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  const value: ThemeContextType = {
    theme,
    resolvedTheme: forcedTheme || resolvedTheme,
    setTheme,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function useMarketingTheme() {
  const { resolvedTheme, toggleTheme, setTheme } = useTheme()
  
  return {
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    theme: resolvedTheme,
    toggle: toggleTheme,
    setLight: () => setTheme('light'),
    setDark: () => setTheme('dark'),
    setSystem: () => setTheme('system'),
  }
}
