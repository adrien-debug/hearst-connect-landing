/**
 * Users API Route - SECURED with JWT
 * GET: Get current user from session
 * POST: Create or find user (requires valid session)
 *
 * Security: Uses JWT session from cookie (set by /api/auth/verify)
 */

import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db/connection'
import { UserRepository } from '@/lib/db/repositories'
import { getSessionFromRequest, requireSession, AuthError } from '@/lib/auth/session'

initDb()

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    requireSession(session)

    const user = UserRepository.findByWalletAddress(session.address)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('[API Users GET] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    requireSession(session)

    // Verify the request body address matches session
    const body = await request.json() as { walletAddress?: string }
    if (body.walletAddress && body.walletAddress.toLowerCase() !== session.address.toLowerCase()) {
      console.error('[API Users POST] Address mismatch:', body.walletAddress, 'vs session:', session.address)
      return NextResponse.json({ error: 'Address mismatch with session' }, { status: 403 })
    }

    // Find or create user by wallet address from session
    const user = UserRepository.findOrCreateByWallet(session.address)
    const isNew = user.createdAt === user.updatedAt

    console.log(`[API Users POST] ${isNew ? 'Created' : 'Found'} user:`, user.id, user.walletAddress)

    return NextResponse.json({ user, isNew }, { status: isNew ? 201 : 200 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('[API Users POST] Error:', error)
    return NextResponse.json({ error: 'Failed to create/find user' }, { status: 500 })
  }
}
