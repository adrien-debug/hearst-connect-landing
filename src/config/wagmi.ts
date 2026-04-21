import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'placeholder'

if (typeof window !== 'undefined' && projectId === 'placeholder') {
  console.warn('[hearst] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set — wallet connect will fail in production')
}

export const wagmiConfig = getDefaultConfig({
  appName: 'Hearst Connect',
  projectId,
  chains: [base],
  ssr: true,
})
