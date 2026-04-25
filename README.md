# Hearst Connect

Onchain access to institutional Bitcoin mining cash flows.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page — marketing, investment strategies carousel, CTA |
| `/intro` | **Legacy entry** — server-side redirect to `/vaults` |
| `/vaults` | **Entry page** — browse vaults, wallet connect, "Enter Platform" CTA when connected |
| `/app` | **Dashboard** — portfolio, vault subscription. Requires wallet connection or demo mode. |
| `/admin` | Vault registry management (add/edit/remove vaults) |

> **Redirects:** `/launch-app` → `/vaults`, `/hub` → `/`, `/vault` → `/vaults`, `/intro` → `/vaults`.

## User Flow

1. **Landing** (`/`) → "Launch App" → **Vaults** (`/vaults`)
2. **Vaults** (`/vaults`) → Browse products + connect wallet → "Enter Platform" → **Dashboard** (`/app`)

Streamlined DeFi flow: landing → products (with wallet) → platform.

## Tech Stack

- **Next.js 16** (App Router, webpack)
- **React 19** + TypeScript (strict mode)
- **Tailwind CSS v4** (via `@tailwindcss/webpack`)
- **wagmi v3** + **viem** — wallet connection & on-chain vault interactions (Base chain)
- **TanStack React Query** — async state management
- **Vitest** — unit tests for vault math and projection helpers (`npm test`)
- **Satoshi Variable** (brand font) + **IBM Plex Mono** (data) + **Inter** (fallback)

## Getting Started

```bash
cp .env.example .env  # optional — analytics / wallet / vault addresses
npm install
npm test              # vault math + projection
npm run dev           # http://localhost:8100
```

## Environment Variables

Copy `.env.example` if present. Common keys:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=  # WalletConnect (optional for demo mode)
NEXT_PUBLIC_VAULT_ADDRESS=             # Vault contract address
NEXT_PUBLIC_USDC_ADDRESS=              # USDC contract address
NEXT_PUBLIC_GA_ID=                     # Optional — Google Analytics
NEXT_PUBLIC_GOOGLE_ADS_ID=             # Optional — Google Ads
```

## App Modes

Two modes (`hearst:app-mode` in localStorage; switching reloads the page):

- **Live** (default) — Registry-driven list + on-chain flows when addresses exist. If registry is empty, public pages show **marketing vaults** from `src/lib/default-vaults.ts` (non-functional, for demonstration only).
- **Demo** — System vaults in `src/lib/demo-data.ts`, portfolio in localStorage. Accessible **only via Admin panel** (after email/password auth). Header: **DÉMO** toggle (→ Live, one-way), **Reset**.

### Demo Mode Access Control

Demo mode is **strictly coupled to admin session**:

1. **Public users** (no admin session): Always see live mode, even if `demo` is in localStorage
2. **Admin users**: Can activate demo mode via "Launch Demo Mode" button in admin dashboard
3. **On admin logout or session expiry**: Demo mode automatically falls back to live
4. **No auto-seeding**: Demo data is only seeded when admin explicitly clicks "Launch Demo Mode"

This ensures demo data never leaks into the public experience.

## Admin Access

Navigate to `/admin` → email/password authentication required. Default: `admin@hearst.app` / `hearst2024`. Session stored in localStorage (24h).

From Admin panel, authorized users can:
- Manage vault registry (CRUD)
- Enter Demo Mode via "Demo Mode" button

## UI / Design System (Cinematic Financial OS)

- **Tokens** in `src/components/connect/constants.ts` (single source) and `src/styles/connect/dashboard-vars.css` (CSS variables for `.connect-scope`).
- **Theme tokens** in `src/styles/theme/tokens.css` — unified `[data-theme="dark"]` / `[data-theme="light"]` system with `--color-*` CSS variables.
- **Look**: deep void `#050505`, accent `#A7FB90`, type scale 48/24/14/11, spacing on an **8px** grid.
- **Dark/Light mode**: Supported globally via `ThemeProvider` + `ThemeToggle`. Vaults page uses design system tokens (`--color-*`) for theme-aware rendering. Cards use glassmorphism (`backdrop-filter: blur`) with theme-specific overrides.
- **Rule file**: `.cursor/rules/vault-ui-system.mdc` — all `connect/` components must use `TOKENS.*` exclusively.
- **Tests**: `npm test` (Vitest) — `src/lib/*.test.ts` for `vault-math` and `projection-simulation`.
- **Typecheck**: `npm run lint` → `tsc -p . --noEmit`.

## Project Structure

```
src/
├── app/
│   ├── page.tsx, landing-client.tsx, layout.tsx, not-found.tsx
│   ├── app/           # /app route — Cinematic OS shell (wallet required)
│   ├── vaults/        # /vaults route — Product page (public)
│   ├── admin/         # /admin route — vault registry
│   └── intro/         # /intro route — (redirects to /vaults)
├── components/
│   ├── connect/       # Canvas, panels, constants.ts (TOKENS + chart palette), utils/portfolio-chart-utils
│   ├── ui/            # Label, click-ripple
│   ├── layout/        # Analytics scripts
│   ├── providers/     # Web3Provider (wagmi)
│   └── theme/         # Theme provider, toggle, script
├── config/
│   ├── wagmi.ts       # Wagmi config (Base chain)
│   ├── abi/vault.ts   # Vault contract ABI
│   └── navigation.ts
├── hooks/
│   ├── useAppMode.ts        # Demo/live toggle (localStorage)
│   ├── useDemoPortfolio.ts  # Demo positions + actions (seed/claim/withdraw)
│   ├── useVaultLines.ts     # Unified vault data (demo ↔ live)
│   ├── useVaultRegistry.ts  # Admin vault CRUD (localStorage + React Query)
│   ├── usePositionData.ts   # On-chain position data
│   ├── useVault.ts          # Vault contract reads (position, global) + writes
│   ├── useTokenAllowance.ts # ERC-20 approve flow
│   ├── useTransaction.ts    # Transaction lifecycle
│   ├── useMonthProgress.ts  # Monthly yield gauge
│   └── useAdminAuth.ts      # Admin authentication (email/password)
├── lib/
│   ├── vault-math.ts              # Aggregate + monthly yield
│   ├── projection-simulation.ts   # Scenario projection
│   ├── demo-data.ts               # System demo vaults + yield calculation
│   └── wagmi-tempo-mock.js        # Webpack shim for optional wagmi deps
├── styles/
│   ├── connect/dashboard-vars.css
│   ├── tailwind.css
│   └── marketing/
└── types/
    ├── vault.ts       # VaultConfig, VaultRegistryState
    ├── position.ts    # PositionData, PositionError
    └── demo.ts        # DemoPosition, HydratedDemoPosition
```

## Deployment

- **Platform**: Vercel (`vercel.json` present)
- **Build**: `npm run build` → `next build --webpack`
- **Security headers**: HSTS, X-Frame-Options, CSP configured in `next.config.mjs`
