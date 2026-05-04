export const THEME_INLINE_SCRIPT = `
(function() {
  var isLanding = window.location.pathname === '/';
  var theme = isLanding ? 'dark' : (function() {
    try {
      var stored = localStorage.getItem('hearst-theme')
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
