import { AnalyticsScripts } from '@/components/layout/analytics-scripts';
import { ClickRipple } from '@/components/ui/click-ripple';
import { ErrorBoundary } from '@/components/error-boundary';
import '@/styles/tailwind.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://hub.hearst.app'),
  title: 'Hearst',
  description: 'Onchain access to industrial Bitcoin mining cash flows.',
  openGraph: {
    type: 'website',
    siteName: 'Hearst',
    title: 'Hearst',
    description: 'Onchain access to industrial Bitcoin mining cash flows.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`dark antialiased ${inter.variable}`}>
      <body>
        <ErrorBoundary>
          <ClickRipple />
          {children}
        </ErrorBoundary>
        <AnalyticsScripts />
      </body>
    </html>
  );
}
