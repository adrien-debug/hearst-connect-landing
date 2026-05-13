import Link from 'next/link';
import { useState } from 'react';
import { CTA_LINKS, HEARST_EMAIL } from '@/config/navigation';
import { HearstConnectLogo } from './HearstConnectLogo';

function EarlyAccessForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setMessage(null);
    try {
      const res = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'landing-footer' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setMessage(data?.error === 'Invalid email' ? 'Please enter a valid email.' : 'Something went wrong. Try again.');
        return;
      }
      setStatus('success');
      setMessage(data?.duplicate ? "You're already on the list — we'll be in touch." : "You're on the list. We'll be in touch shortly.");
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Network error. Try again.');
    }
  };

  return (
    <form className="hub-footer-slim-form" onSubmit={handleSubmit} noValidate>
      <input
        type="email"
        placeholder="your@email.com"
        className="hub-footer-slim-input"
        aria-label="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={status === 'loading'}
      />
      <button
        type="submit"
        className="hub-footer-slim-btn"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Submitting…' : 'Get Early Access'}
      </button>
      {message && (
        <p
          role="status"
          className={`hub-footer-slim-form-msg ${status === 'error' ? 'is-error' : 'is-success'}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}

export function HubFooter() {
  return (
    <>
      {/* Before You Go: outer card scroll-driven scale; inner hub-chapter parallax */}
      <section id="beforeyougo" lang="en">
        <div className="card dark hub-final-cta-card">
          <div className="hub-chapter hub-final-cta-content">
            <p>
              <span className="typewriter">Real yield. Real infrastructure. On-chain.</span>
            </p>
            <div className="buttons">
              <Link href={CTA_LINKS.launchApp.href} className="hub-cta-primary">
                {CTA_LINKS.launchApp.label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="hub-footer-slim" id="hub-footer">
        <div className="hub-footer-slim-inner">
          <HearstConnectLogo
            className="hub-footer-slim-logo"
            style={{ height: 'var(--logo-height-footer)', width: 'auto', display: 'block' }}
          />
          <div className="hub-footer-slim-cta">
            <p className="hub-footer-slim-headline">Join the next wave of institutional Bitcoin yield.</p>
            <EarlyAccessForm />
          </div>
        </div>
        <div className="hub-footer-slim-bottom">
          <span>© {new Date().getFullYear()} Hearst Corporation. All rights reserved.</span>
          <div className="hub-footer-slim-links">
            <a href={`mailto:${HEARST_EMAIL}`}>{HEARST_EMAIL}</a>
          </div>
        </div>
      </footer>
    </>
  );
}
