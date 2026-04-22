# Hearst Connect

Onchain access to institutional Bitcoin mining cash flows.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page — marketing, investment strategies, CTA |
| `/app` | Cinematic Financial OS — portfolio, vaults, subscription & projection (mock data) |

> **Redirects:** `/launch-app`, `/hub`, and `/vault` all redirect to their canonical routes.

## Tech Stack

- **Next.js 16** (App Router, webpack)
- **React 19** + TypeScript
- **Tailwind CSS v4** (via `@tailwindcss/webpack`)
- **GSAP** — animation (`CustomEase`) where used
- **Vitest** — unit tests for vault math and projection helpers (`npm test`)
- **Satoshi Variable** (brand font) + **Inter** (fallback)

## Getting Started

```bash
cp .env.example .env  # optional — analytics / future integrations
npm install
npm test              # vault math + projection
npm run dev           # http://localhost:8100
```

## Environment Variables

Copy `.env.example` if present. Common keys:

```
NEXT_PUBLIC_GA_ID=                      # Optional — Google Analytics
NEXT_PUBLIC_GOOGLE_ADS_ID=              # Optional — Google Ads
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx, landing-client.tsx, layout.tsx, not-found.tsx
│   └── app/
│       ├── page.tsx            # Cinematic OS shell
│       └── app-client.tsx
├── components/
│   ├── connect/                # Canvas, panels, `constants.ts` (TOKENS)
│   └── ui/                     # Label, click ripple, etc.
├── hooks/
│   └── useMonthProgress.ts     # Used by monthly yield gauge
├── lib/
│   ├── vault-math.ts           # Aggregate + monthly yield
│   └── projection-simulation.ts
├── styles/
│   ├── connect/
│   │   └── dashboard-vars.css  # CSS variables (mirror of TOKENS)
│   ├── tailwind.css
│   └── marketing/
```

## Recent Updates (Apr 22, 2026)

- Cinematic Financial OS: dark scene (`#050505` / `#0A0A0A`), 280px sidebar, shared `Label`, `VaultNode` rows, routing via `useConnectRouting`, `dashboard-vars.css` + `constants.ts` alignment, Vitest for `aggregate` / `computeMonthlyYield` / `projectScenario`
- Removed unused Web3 stack (wagmi, viem, RainbowKit) and dead hooks/ABIs; connect UI is mock-data driven until on-chain is re-enabled

## Previous Updates (Apr 21, 2026)

- ✅ Fixed `projected` calculation with NaN validation
- ✅ Removed code duplication (ICONS 3x → 1x, INVESTMENT_STRATEGY_SLIDES 2x → 1x)
- ✅ Cleaned dead code (hearst-os folder, unused constants)
- ✅ Improved env var validation (server-side only, better fallbacks)
- ✅ Added `/vault → /app` redirect for consistency
- ✅ Enabled TypeScript strict mode
- ✅ Optimized GSAP animations (moved CustomEase inline)
