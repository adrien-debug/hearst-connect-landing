# Hearst Connect

Onchain access to institutional Bitcoin mining cash flows.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page — marketing, investment strategies carousel, CTA |
| `/app` | **Dashboard** — portfolio, vault subscription. Requires SIWE authentication. |
| `/admin` | Admin panel — vault registry management, activity logs, settings |

> **Redirects:** `/launch-app` → `/app`, `/hub` → `/`, `/vault` → `/app`, `/intro` → `/app`.

## User Flow (SIWE)

1. **Landing** (`/`) → "Launch App" → **AccessGate** (`/app`)
2. **AccessGate** → Connect Wallet → Sign In with Ethereum (SIWE EIP-4361)
3. **Dashboard** — Authenticated view with vaults, portfolio, activity

Streamlined DeFi flow: landing → wallet connect → SIWE auth → platform.

## Tech Stack

- **Next.js 16.2.4** (App Router, Turbopack)
- **React 19** + TypeScript (strict mode)
- **Tailwind CSS v4** (via `@tailwindcss/webpack`)
- **wagmi v3** + **viem** — wallet connection & on-chain vault interactions (Base chain)
- **TanStack React Query** — async state management
- **jose** — JWT library for SIWE session management
- **better-sqlite3** — SQLite database for users, vaults, positions, activity
- **Vitest** — unit tests for vault math, projection, and database repositories (`npm test`)
- **Satoshi Variable** (brand font) + **IBM Plex Mono** (data) + **Inter** (fallback)

## Getting Started

```bash
cp .env.example .env  # optional — analytics / wallet / vault addresses
npm install
npm test              # vault math + projection
npm run dev           # http://localhost:8100
```

## Environment Variables

Copy `.env.example` and configure required variables:

```bash
# REQUIRED - Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long  # REQUIRED in production
ADMIN_ADDRESSES=0x1234...,0x5678...                     # Comma-separated Ethereum addresses

# OPTIONAL - Web3
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=                   # WalletConnect project ID

# OPTIONAL - Analytics
NEXT_PUBLIC_GA_ID=                                      # Google Analytics
NEXT_PUBLIC_GOOGLE_ADS_ID=                              # Google Ads
```

**Production requirements:**
- `JWT_SECRET` is mandatory (32+ character secret key)
- `ADMIN_ADDRESSES` should be set to authorized wallet addresses
- The app will throw an error if `JWT_SECRET` is missing in production

## Authentication (SIWE)

**Sign-In with Ethereum (EIP-4361)**:

1. **Landing** (`/`) → **Launch App** → `/app`
2. **AccessGate** (`src/app/app/app-client.tsx`) shows marketing + wallet connect
3. **Connect Wallet** (wagmi injected connector) → popup MetaMask
4. **Sign In with Wallet** → Sign EIP-4361 message
   - `POST /api/auth/nonce` — HMAC stateless nonce (5min TTL)
   - Wallet signs the SIWE message
   - `POST /api/auth/verify` — viem.verifyMessage + JWT cookie
5. **JWT Session** — `hearst-session` cookie (HTTP-only, SameSite=Strict, 24h)
6. **Session Check** — `GET /api/auth/me` (only on mount, no spam 401)
7. **Disconnect** → `POST /api/auth/logout` + redirect to `/` with spinner (no flash)

**Admin Authentication:**
- Admin addresses configured via `ADMIN_ADDRESSES` env variable
- JWT session includes `isAdmin` flag for admin wallets
- Admin API routes check `requireAdminAccess()` (JWT admin OR `x-admin-key` header)
- `/admin` panel shows: Dashboard, Vaults, Activity, Settings

**Security Features:**
- HTTP-only cookies (XSS protection)
- SameSite=Strict (CSRF protection)
- HMAC stateless nonces (no server storage needed)
- JWT verification on all protected endpoints
- Soft-delete for vaults to preserve position history
- Row-level isolation: users only see their own positions/activity

## UI / Design System (Cinematic Financial OS)

- **Tokens** in `src/components/connect/constants.ts` (single source) and `src/styles/connect/dashboard-vars.css` (CSS variables for `.connect-scope`).
- **Theme tokens** in `src/styles/theme/tokens.css` — unified `[data-theme="dark"]` / `[data-theme="light"]` system with `--color-*` CSS variables.
- **Look**: deep void `#050505`, accent `#A7FB90`, type scale 48/24/14/11, spacing on an **8px** grid.
- **Dark/Light mode**: Supported globally via `ThemeProvider` + `ThemeToggle`. Vaults page uses design system tokens (`--color-*`) for theme-aware rendering. Cards use glassmorphism (`backdrop-filter: blur`) with theme-specific overrides.
- **Rule file**: `.cursor/rules/vault-ui-system.mdc` — all `connect/` components must use `TOKENS.*` exclusively.
- **Tests**: `npm test` (Vitest) — `src/lib/*.test.ts` for `vault-math` and `projection-simulation`.
- **Typecheck**: `npm run lint` → `tsc -p . --noEmit`.

## Database & Backend

**SQLite** (`better-sqlite3`) at `data/hearst.db`:

| Table | Purpose |
|-------|---------|
| `users` | Wallet addresses, timestamps |
| `vaults` | Investment products (name, APR, target, addresses, etc.) |
| `user_positions` | User deposits, yields, maturity dates, state |
| `activity_events` | Deposit/claim/withdraw events with timestamps |

**Schema Features:**
- Foreign keys: `user_positions.user_id → users.id`, `user_positions.vault_id → vaults.id`
- ON DELETE CASCADE for referential integrity
- Soft-delete vaults (`is_active = 0`) preserve position history
- Check constraints on enums (`state`, `type`)

**Performance Indexes:**
```
idx_users_wallet — wallet_address lookups
idx_vaults_active — active vault filtering
idx_vaults_address — address lookups
idx_positions_user — user position queries
idx_positions_vault — vault position queries
idx_positions_state — state filtering
idx_positions_user_vault — user+vault compound
idx_activity_user — user activity queries
idx_activity_timestamp — time-based sorting
idx_activity_user_time — user+time compound
```

**API Routes** (`/api/*`):
| Route | Auth | Description |
|-------|------|-------------|
| `POST /api/auth/nonce` | Public | Generate HMAC-signed nonce |
| `POST /api/auth/verify` | Public | Verify SIWE signature, set cookie |
| `GET /api/auth/me` | Cookie | Check session, return address + isAdmin |
| `POST /api/auth/logout` | Cookie | Clear session cookie |
| `GET /api/users` | JWT | Get current user |
| `POST /api/users` | JWT | Find or create user (address from session) |
| `GET /api/vaults` | Public | List vaults (optionally `?active=true`) |
| `POST /api/vaults` | Admin | Create vault |
| `GET /api/vaults/[id]` | Public | Get vault by ID |
| `PATCH /api/vaults/[id]` | Admin | Update vault |
| `DELETE /api/vaults/[id]` | Admin | Soft-delete vault |
| `GET /api/positions` | JWT | List positions for authenticated user |
| `POST /api/positions` | JWT | Create/add to position (user from session) |
| `PATCH /api/positions` | JWT | Update position (ownership verified) |
| `GET /api/activity` | JWT | List activity for authenticated user |
| `POST /api/activity` | JWT | Create activity event |
| `GET /api/admin/activity` | Admin | List all user activities (admin only) |

## Project Structure

```
src/
├── app/
│   ├── page.tsx, landing-client.tsx, layout.tsx, not-found.tsx
│   ├── app/              # /app route — AccessGate + Canvas (SIWE required)
│   ├── admin/            # /admin route — Admin panel (SIWE + admin check)
│   ├── api/              # API routes
│   │   ├── auth/         # SIWE endpoints (nonce, verify, me, logout)
│   │   ├── users/        # User management
│   │   ├── vaults/       # Vault CRUD
│   │   ├── positions/    # Position management
│   │   ├── activity/     # User activity
│   │   └── admin/        # Admin-only endpoints
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── connect/          # Canvas, panels, vault UI
│   │   ├── canvas.tsx
│   │   ├── constants.ts  # TOKENS design system
│   │   ├── modal.tsx
│   │   ├── portfolio-summary.tsx
│   │   ├── subscribe-panel.tsx
│   │   └── ...
│   ├── ui/               # shadcn/ui components
│   └── providers/        # Web3Provider, wagmi config
├── hooks/
│   ├── useSiweAuth.ts     # SIWE authentication hook
│   ├── useBackendUser.ts  # Backend user fetch/create
│   ├── useVaultLines.ts   # Vault data loading
│   ├── useLiveActions.ts  # On-chain interactions
│   ├── useUserData.ts     # User data management
│   └── useMonthProgress.ts
├── lib/
│   ├── auth/
│   │   └── session.ts     # JWT, nonce HMAC, admin check
│   ├── db/
│   │   ├── connection.ts  # SQLite singleton
│   │   ├── repositories.ts # CRUD operations
│   │   └── __tests__/     # Database tests
│   ├── api-client.ts      # API client utilities
│   ├── vault-math.ts      # Yield calculations
│   └── projection-simulation.ts
├── types/
│   └── vault.ts
└── config/
    └── storage-keys.ts

data/
├── hearst.db              # SQLite database (gitignored)
├── hearst.db-shm
└── hearst.db-wal

migrations/
└── 001_add_performance_indexes.sql

.env.example
next.config.mjs
package.json
```

## Deployment

- **Platform**: Vercel (`vercel.json` present)
- **Build**: `npm run build` → `next build --webpack`
- **Security headers**: HSTS, X-Frame-Options, CSP configured in `next.config.mjs`
