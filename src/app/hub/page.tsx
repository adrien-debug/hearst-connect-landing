import type { Metadata } from 'next';
import HubPageClient from './hub-client';

export const metadata: Metadata = {
  title: 'HUB by Hearst | AI Orchestrator for 200+ Services',
  description:
    'Connect your entire stack through specialized AI agents. One platform, 200+ integrations, zero friction.',
  openGraph: {
    title: 'HUB by Hearst | AI Orchestrator for 200+ Services',
    description:
      'Connect your entire stack through specialized AI agents. One platform, 200+ integrations, zero friction.',
    siteName: 'HUB',
    url: '/hub',
    images: [
      {
        url: '/platform-screenshot.png',
        width: 1024,
        height: 657,
        alt: 'HUB platform — orchestration dashboard preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HUB by Hearst | AI Orchestrator for 200+ Services',
    description:
      'Connect your entire stack through specialized AI agents. One platform, 200+ integrations, zero friction.',
    images: ['/platform-screenshot.png'],
  },
};

export default function HubPage() {
  return <HubPageClient />;
}
