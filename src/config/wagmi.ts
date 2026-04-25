import { createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected, coinbaseWallet } from 'wagmi/connectors'

export const config = createConfig({
  chains: [base],
  connectors: [
    injected({ target: 'metaMask' }),
    coinbaseWallet({ appName: 'Hearst Connect' }),
  ],
  transports: {
    [base.id]: http(),
  },
})
