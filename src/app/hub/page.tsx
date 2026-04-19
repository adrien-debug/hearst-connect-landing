import type { Metadata } from 'next';
import HubPageClient from './hub-client';

export const metadata: Metadata = {
  title: 'Hearst Connect | Real yield from Bitcoin mining',
  description:
    'Onchain access to industrial Bitcoin mining cash flows—USDC vaults on Base, institutional controls, transparent reporting.',
  openGraph: {
    title: 'Hearst Connect | Real yield from Bitcoin mining',
    description:
      'Onchain access to industrial Bitcoin mining cash flows—USDC vaults on Base, institutional controls, transparent reporting.',
    siteName: 'Hearst',
    url: '/hub',
    images: [
      {
        url: '/platform-screenshot.png',
        width: 1024,
        height: 657,
        alt: 'Hearst vault strategies preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hearst Connect | Real yield from Bitcoin mining',
    description:
      'Onchain access to industrial Bitcoin mining cash flows—USDC vaults on Base, institutional controls, transparent reporting.',
    images: ['/platform-screenshot.png'],
  },
};

export default function HubPage() {
  return <HubPageClient />;
}
