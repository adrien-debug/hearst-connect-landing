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

## UI / design system (Cinematic Financial OS)

- **Tokens** in `src/components/connect/constants.ts` (single source) and `src/styles/connect/dashboard-vars.css` (CSS variables for the `.connect-scope` shell).
- **Look** : deep void `#050505`, scene carbon `#030303` (denser than sidebar, subtle shoulder light + carbon materiality), accent `#A7FB90`, type scale 24 / 14 / 11, spacing on an **8px** grid, radii **8–12px** where a radius is used (favor alignment over boxes).
- **Chromatic separation** : avoid heavy card borders; prefer **inset shadows**, very low-opacity gradients, and whitespace. Long reading uses soft contrast overlays, not hard frames.
- **Sidebar vault panels** : enriched micro-panels with 4-layer structure (header + core value + visual signal + footer). Prime vaults show mini-donut progress; Growth vaults show linear gauge. Available vaults use simplified linear gauge. All panels: 10px radius, subtle carbon gradient background, 16px padding.
- **Static reference** : `design-system.html` (tokens, labels bar vs text, sidebar width 280/272px).
- **Tests** : `npm test` (Vitest) — `src/lib/*.test.ts` for `vault-math` and `projection-simulation`.
- **Typecheck** (script `npm run lint`) : `tsc -p . --noEmit` — Next 16.2 in this repo does not ship `next lint`.

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

- Cinematic Financial OS: sidebar `#050505`, main scene `#060606` with matte gradients on `.connect-main-scene`, 280px sidebar, shared `Label`, `VaultNode` rows, routing via `useConnectRouting`, `dashboard-vars.css` + `constants.ts` alignment, Vitest for `aggregate` / `computeMonthlyYield` / `projectScenario`
- Removed unused Web3 stack (wagmi, viem, RainbowKit) and dead hooks/ABIs; connect UI is mock-data driven until on-chain is re-enabled

## Previous Updates (Apr 21, 2026)

- ✅ Fixed `projected` calculation with NaN validation
- ✅ Removed code duplication (ICONS 3x → 1x, INVESTMENT_STRATEGY_SLIDES 2x → 1x)
- ✅ Cleaned dead code (hearst-os folder, unused constants)
- ✅ Improved env var validation (server-side only, better fallbacks)
- ✅ Added `/vault → /app` redirect for consistency
- ✅ Enabled TypeScript strict mode
- ✅ Optimized GSAP animations (moved CustomEase inline)
