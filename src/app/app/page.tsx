import { AppClient } from './app-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Connect | Hearst',
  description: 'Cinematic portfolio OS — positions, subscription flow, and projections.',
}

export default function AppPage() {
  return <AppClient />
}
