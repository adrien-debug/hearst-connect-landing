export const THEME_INLINE_SCRIPT = `
(function() {
  // /admin is a dark-only surface — never inherit light from system/storage.
  // Same goes for /app (connect dashboard), which is locked to dark by
  // .connect-scope but we set the attribute upfront to prevent any flash.
  const path = window.location.pathname
  const isDarkOnlyRoute = path === '/admin' || path.startsWith('/admin/') || path === '/app' || path.startsWith('/app/')

  const theme = (function() {
    if (isDarkOnlyRoute) return 'dark'
    try {
      const stored = localStorage.getItem('hearst-theme')
      if (stored === 'dark' || stored === 'light') return stored
      if (stored === 'system' || !stored) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
    } catch (e) {}
    return 'dark'
  })()

  document.documentElement.setAttribute('data-theme', theme)
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})()
`
