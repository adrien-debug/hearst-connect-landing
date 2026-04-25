/**
 * Wallet-based authentication for API routes
 * Validates wallet address from request headers
 * NOTE: This is a lightweight auth suitable for demo/single-user-per-wallet scenarios.
 * For production, consider SIWE (Sign-In with Ethereum) with nonce challenges.
 */

import type { Address } from 'viem'

export interface AuthContext {
  walletAddress: Address
  isAuthenticated: boolean
}

// Headers expected from client
const WALLET_HEADER = 'x-wallet-address'

/**
 * Extract and validate wallet address from request headers
 * Returns null if invalid/missing
 */
export function getAuthFromRequest(request: Request): AuthContext | null {
  const walletAddress = request.headers.get(WALLET_HEADER) as Address | null

  if (!walletAddress) {
    return null
  }

  // Basic validation: must be a valid Ethereum address format
  const addressRegex = /^0x[a-fA-F0-9]{40}$/
  if (!addressRegex.test(walletAddress)) {
    return null
  }

  return {
    walletAddress,
    isAuthenticated: true,
  }
}

/**
 * Require authentication - throws if not authenticated
 */
export function requireAuth(request: Request): AuthContext {
  const auth = getAuthFromRequest(request)
  if (!auth) {
    throw new AuthError('Authentication required. Provide valid x-wallet-address header.', 401)
  }
  return auth
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Check if request is from an admin
 * For now, simple allowlist or env-based check
 * In production, use on-chain verification or JWT
 */
export function isAdminRequest(request: Request): boolean {
  const adminKey = request.headers.get('x-admin-key')
  const expectedKey = process.env.ADMIN_API_KEY

  if (expectedKey && adminKey === expectedKey) {
    return true
  }

  // In development, allow localhost
  const origin = request.headers.get('origin') || ''
  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1')

  if (process.env.NODE_ENV === 'development' && isLocalhost) {
    return true
  }

  return false
}

/**
 * Middleware helper for route handlers
 */
export function withAuth(
  handler: (req: Request, auth: AuthContext) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (request: Request) => {
    try {
      const auth = requireAuth(request)
      return await handler(request, auth)
    } catch (e) {
      if (e instanceof AuthError) {
        return new Response(
          JSON.stringify({ error: e.message }),
          { status: e.statusCode, headers: { 'Content-Type': 'application/json' } }
        )
      }
      throw e
    }
  }
}
