/**
 * Session management with JWT for SIWE authentication
 * Server-side session using jose (Edge-compatible)
 */

import { SignJWT, jwtVerify } from 'jose'
import type { Address } from 'viem'

// Session structure
export interface Session {
  address: Address
  isAdmin: boolean
  iat: number
  exp: number
}

// JWT Secret - must be set in env (production enforcement at runtime)
const JWT_SECRET = process.env.JWT_SECRET
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// Validate JWT_SECRET at runtime only (not during build)
function validateJWTSecret() {
  if (!JWT_SECRET && IS_PRODUCTION) {
    throw new Error('[Auth] FATAL: JWT_SECRET environment variable is required in production')
  }
  if (!JWT_SECRET) {
    console.warn('[Auth] JWT_SECRET not set, using development fallback. DO NOT USE IN PRODUCTION.')
  }
}

const SECRET_KEY = new TextEncoder().encode(
  JWT_SECRET || 'hearst-dev-secret-do-not-use-in-production-32bytes'
)

// Admin addresses - validate format and normalize
const ADMIN_ADDRESSES = new Set(
  (process.env.ADMIN_ADDRESSES || '')
    .toLowerCase()
    .split(',')
    .map(addr => addr.trim())
    .filter(addr => {
      if (!addr) return false
      if (!/^0x[a-f0-9]{40}$/.test(addr)) {
        console.warn(`[Auth] Invalid admin address format ignored: ${addr}`)
        return false
      }
      return true
    })
)

/**
 * Create a new JWT session after SIWE verification
 */
export async function createSession(address: Address): Promise<string> {
  validateJWTSecret()
  
  const isAdmin = ADMIN_ADDRESSES.has(address.toLowerCase())

  const token = await new SignJWT({
    address,
    isAdmin,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY)

  if (!IS_PRODUCTION) {
    console.log('[Auth] Session created for:', address, isAdmin ? '(admin)' : '')
  }
  return token
}

/**
 * Verify and decode a JWT token
 */
export async function verifySession(token: string): Promise<Session | null> {
  validateJWTSecret()
  
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    return {
      address: payload.address as Address,
      isAdmin: payload.isAdmin as boolean,
      iat: payload.iat as number,
      exp: payload.exp as number,
    }
  } catch (e) {
    return null
  }
}

/**
 * Get session from request cookies
 */
export async function getSessionFromRequest(request: Request): Promise<Session | null> {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  // Parse cookie manually (Edge-compatible)
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...v] = c.trim().split('=')
      return [key, v.join('=')]
    })
  )

  const token = cookies['hearst-session']
  if (!token) return null

  return verifySession(token)
}

/**
 * Require session - throws if not authenticated
 */
export function requireSession(session: Session | null): asserts session is Session {
  if (!session) {
    throw new AuthError('Authentication required', 401)
  }
}

/**
 * Require admin session (JWT with isAdmin flag)
 */
export function requireAdmin(session: Session | null): asserts session is Session {
  requireSession(session)
  if (!session.isAdmin) {
    throw new AuthError('Admin access required', 403)
  }
}

const ADMIN_PANEL_KEY = process.env.ADMIN_PANEL_KEY || 'hearst-admin-dev-key'

/**
 * Check admin access: JWT admin session OR x-admin-key header.
 * Throws AuthError if neither is valid.
 */
export async function requireAdminAccess(request: Request): Promise<void> {
  const session = await getSessionFromRequest(request)
  if (session?.isAdmin) return

  const key = request.headers.get('x-admin-key')
  if (key === ADMIN_PANEL_KEY) return

  throw new AuthError('Admin access required', 403)
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message)
    this.name = 'AuthError'
  }
}

const NONCE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * HMAC-signed nonce — stateless, no in-memory Map needed.
 * Format: `<random>.<timestamp>.<hmac>`
 * The HMAC covers `address + random + timestamp` so it can be verified
 * without server-side storage. Works across workers / hot-reloads.
 */
async function hmacSign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    SECRET_KEY,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacVerify(data: string, mac: string): Promise<boolean> {
  const expected = await hmacSign(data)
  if (expected.length !== mac.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ mac.charCodeAt(i)
  return diff === 0
}

export async function generateNonce(address: Address): Promise<string> {
  const random = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  const ts = Date.now().toString()
  const mac = await hmacSign(`${address.toLowerCase()}:${random}:${ts}`)
  return `${random}.${ts}.${mac}`
}

export async function verifyNonce(address: Address, nonce: string): Promise<boolean> {
  const parts = nonce.split('.')
  if (parts.length !== 3) return false
  const [random, ts, mac] = parts
  const timestamp = parseInt(ts, 10)
  if (isNaN(timestamp)) return false
  if (Date.now() - timestamp > NONCE_TTL_MS) return false
  return hmacVerify(`${address.toLowerCase()}:${random}:${ts}`, mac)
}

export function clearNonce(_address: Address): void {
  // No-op: stateless nonces don't need clearing
}
