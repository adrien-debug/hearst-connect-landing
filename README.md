# Hearst Connect

Onchain access to institutional Bitcoin mining cash flows.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page — marketing, investment strategies, CTA |
| `/app` | DeFi vault interface — connect wallet, deposit, claim, withdraw |

> `/launch-app` and `/hub` redirect to their canonical routes.

## Tech Stack

- **Next.js 16** (App Router, webpack)
- **React 19** + TypeScript
- **Tailwind CSS v4** (via `@tailwindcss/webpack`)
- **wagmi v2** + **viem** + **RainbowKit** (Web3, Base chain)
- **Satoshi Variable** (brand font) + **Inter** (fallback)

## Getting Started

```bash
cp .env.example .env   # fill in contract addresses + WalletConnect ID
npm install
npm run dev            # http://localhost:8000
```

## Environment Variables

Copy `.env.example` and fill in:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=   # Required for /app
NEXT_PUBLIC_VAULT_ADDRESS=0x...         # EpochVault contract on Base
NEXT_PUBLIC_USDC_ADDRESS=0x...          # USDC contract on Base
NEXT_PUBLIC_GA_ID=                      # Optional — Google Analytics
NEXT_PUBLIC_GOOGLE_ADS_ID=              # Optional — Google Ads
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                # Landing (server) → landing-client.tsx
│   ├── landing-client.tsx      # Landing page (client)
│   ├── not-found.tsx           # 404 page
│   └── app/
│       ├── page.tsx            # Vault interface (server, force-dynamic)
│       └── app-client.tsx      # Vault interface (client)
├── components/
│   ├── connect/                # Vault UI (Canvas, providers)
│   ├── layout/                 # Analytics scripts
│   └── ui/                     # Click ripple
├── config/
│   ├── abi/                    # EpochVault + USDC ABIs
│   ├── contracts.ts            # Addresses, chain, constants, env guards
│   └── wagmi.ts                # RainbowKit config
├── hooks/                      # useVaultData, useUserPosition, useRewards, useEpoch, useDeposit, useWithdraw
├── generated/
│   └── dashboard-vars.css      # Design tokens
└── styles/
    ├── tailwind.css
    └── marketing/              # Landing page styles
```
