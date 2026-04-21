import { AppClient } from './app-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Connect | Hearst',
  description: 'Institutional DeFi vault interface.',
}

export default function AppPage() {
  return <AppClient />
}
