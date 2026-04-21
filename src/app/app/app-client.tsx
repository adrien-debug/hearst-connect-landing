'use client'

import { ConnectProviders } from '@/components/connect/providers'
import { Canvas } from '@/components/connect/canvas'

export function AppClient() {
  return (
    <ConnectProviders>
      <Canvas />
    </ConnectProviders>
  )
}
