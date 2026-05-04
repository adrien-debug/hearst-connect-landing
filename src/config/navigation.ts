/**
 * Navigation links and CTAs used across landing page
 * Centralized to avoid duplication between header, footer, and sections
 */

export const HEARST_EMAIL = 'hello@hearstvault.com'

export const HUB_MAILTO_SALES = `mailto:${HEARST_EMAIL}?subject=${encodeURIComponent('Hearst investor inquiry')}`

export const NAV_LINKS = [
  { href: '#intro', label: 'About' },
  { href: '#feature-unified', label: 'Solutions' },
  { href: '#developers', label: 'Verticals' },
] as const

export const CTA_LINKS = {
  launchApp: { href: '/app', label: 'Launch App' },
  viewOffering: { href: '#beforeyougo', label: 'View offering' },
  contactSales: { href: HUB_MAILTO_SALES, label: 'Contact Sales' },
} as const
