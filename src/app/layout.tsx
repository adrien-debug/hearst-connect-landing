import { AnalyticsScripts } from '@/components/layout/analytics-scripts';
import { ClickRipple } from '@/components/ui/click-ripple';
import { ErrorBoundary } from '@/components/error-boundary';
import { Web3Provider } from '@/components/providers/web3-provider';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { THEME_INLINE_SCRIPT } from '@/components/theme/theme-script';
import '@/styles/tailwind.css';
import '@/styles/theme/tokens.css';
import '@/styles/components/subscription.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://hearst.app'),
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
    <html lang="en" suppressHydrationWarning className={`antialiased ${inter.variable}`}>
      <head>
        {/* Inline in head: Next <Script> children warn in RSC; this runs before paint (FOUC). */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_INLINE_SCRIPT }}
        />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body>
        <ErrorBoundary>
          <ClickRipple />
          <Web3Provider>
            <ThemeProvider defaultTheme="system" enableSystem>
              {children}
            </ThemeProvider>
          </Web3Provider>
        </ErrorBoundary>
        <AnalyticsScripts />
      </body>
    </html>
  );
}
