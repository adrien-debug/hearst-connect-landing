/**
 * Navigation links and CTAs used across landing page
 * Centralized to avoid duplication between header, footer, and sections
 */

export const HEARST_EMAIL = 'hello@hearstvault.com'

export const HUB_MAILTO_SALES = `mailto:${HEARST_EMAIL}?subject=${encodeURIComponent('Hearst investor inquiry')}`

export const NAV_LINKS = [
  { href: '#intro', label: 'Integrations' },
  { href: '#feature-unified', label: 'Platform' },
  { href: '#developers', label: 'Solutions' },
  { href: '#who', label: 'Contact' },
] as const

export const CTA_LINKS = {
  launchApp: { href: '/vaults', label: 'Launch App' },
  viewOffering: { href: '#beforeyougo', label: 'View offering' },
  contactSales: { href: HUB_MAILTO_SALES, label: 'Contact Sales' },
} as const
