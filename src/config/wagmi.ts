import { createConfig, http } from 'wagmi'
import { mainnet, base } from 'wagmi/chains'
import { injected, coinbaseWallet } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, base],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Hearst Connect' }),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
  },
})
