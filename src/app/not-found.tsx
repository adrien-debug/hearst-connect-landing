import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-8"
      style={{ backgroundColor: 'var(--dashboard-page)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-8 text-center"
        style={{ borderColor: 'var(--dashboard-border)', backgroundColor: 'var(--dashboard-surface)' }}
      >
        <h1 className="mb-2 text-4xl font-bold" style={{ color: 'var(--dashboard-text-bright)' }}>
          404
        </h1>
        <p className="mb-6 text-sm" style={{ color: 'var(--dashboard-text-muted)' }}>
          Page not found.
        </p>
        <Link
          href="/hub"
          className="rounded-xl px-4 py-2 text-sm font-bold"
          style={{ background: 'var(--dashboard-accent)', color: 'var(--dashboard-page)' }}
        >
          Back to Hub
        </Link>
      </div>
    </div>
  );
}
