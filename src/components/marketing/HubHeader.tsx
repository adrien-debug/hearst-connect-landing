import Link from 'next/link';
import { NAV_LINKS, CTA_LINKS } from '@/config/navigation';

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function HubHeader({ isHeaderVisible }: { isHeaderVisible: boolean }) {
  return (
    <div className={`header-wrapper ${isHeaderVisible ? 'is-visible' : ''}`}>
      <header>
        <a href="#" className="header-logo-link" aria-label="Hearst Connect">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/hearst-connect.svg" alt="Hearst Connect" width={160} height={54} style={{ height: '54px', width: 'auto', display: 'block' }} />
        </a>
        <input
          className="menu-checkbox"
          type="checkbox"
          id="menu-checkbox"
          aria-controls="hub-site-nav"
        />
        <label className="menu-button" htmlFor="menu-checkbox" lang="fr">
          <span className="not-sr-only" data-show-when="closed">
            <MenuIcon />
          </span>
          <span className="not-sr-only" data-show-when="open">
            <CloseIcon />
          </span>
          <span className="sr-only">Ouvrir ou fermer le menu de navigation</span>
        </label>

        <nav id="hub-site-nav" aria-label="Navigation principale" lang="fr">
          <ul>
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <Link href={CTA_LINKS.launchApp.href} className="login-btn" prefetch>
          <span>{CTA_LINKS.launchApp.label}</span>
        </Link>
      </header>
    </div>
  );
}
