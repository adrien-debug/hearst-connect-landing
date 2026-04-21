import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'placeholder'

export const wagmiConfig = getDefaultConfig({
  appName: 'Hearst Connect',
  projectId,
  chains: [base],
  ssr: true,
})
