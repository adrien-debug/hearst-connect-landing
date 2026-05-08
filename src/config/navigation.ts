/**
 * Navigation links and CTAs used across landing page
 * Centralized to avoid duplication between header, footer, and sections
 */

export const HEARST_EMAIL = 'hello@hearst.app'

export const NAV_LINKS = [
  { href: '#features-section', label: 'Why Connect' },
  { href: '#developers', label: 'Vaults' },
  { href: '#simulator', label: 'Simulator' },
] as const

export const CTA_LINKS = {
  launchApp: { href: '/app', label: 'Launch App' },
} as const
