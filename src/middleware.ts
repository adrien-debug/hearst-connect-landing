import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

/**
 * Early-reject auth middleware.
 *
 * Verifies the JWT cookie signature for protected API routes before the route
 * handler runs. Returns 401 on missing/invalid token so we never spin up DB
 * connections or repository logic for unauthenticated requests.
 *
 * Fine-grained checks (isAdmin, isDemoAuthorized, x-admin-key / x-agent-key
 * fallbacks) stay in the handlers via requireSession()/requireAdminAccess().
 */

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'hearst-dev-secret-do-not-use-in-production-32bytes',
)

// API routes that must NOT require a session cookie:
//   - /api/auth/*           (login flow itself)
//   - /api/early-access     (public signup)
//   - /api/vaults (GET)     (public vault listing)
//   - /api/agents/webhook   (uses x-agent-key header, no session)
// Anything not in this list under /api/ requires a verified cookie OR an
// admin-key/agent-key header (handlers decide which).
const PUBLIC_API_PREFIXES = [
  '/api/auth/',
  '/api/early-access',
  '/api/agents/webhook',
]

function isPublic(pathname: string): boolean {
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return true
  // GET /api/vaults and GET /api/vaults/[id] are public listings; POST/PUT
  // go through handler-level auth. We let the handler enforce by-method
  // rather than parsing the request here.
  if (pathname === '/api/vaults' || pathname.startsWith('/api/vaults/')) return true
  return false
}

function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/api/')) return NextResponse.next()
  if (isPublic(pathname)) return NextResponse.next()

  // Admin/agent header-auth bypass: handler will validate the actual key value.
  // We only check presence here to avoid rejecting valid admin-key requests
  // that never carry a cookie.
  if (request.headers.get('x-admin-key') || request.headers.get('x-agent-key')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('hearst-session')?.value
  if (!token) return unauthorized()

  try {
    await jwtVerify(token, SECRET_KEY)
    return NextResponse.next()
  } catch {
    return unauthorized()
  }
}

export const config = {
  matcher: ['/api/:path*'],
}
