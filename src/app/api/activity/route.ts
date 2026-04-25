/**
 * Activity API Route - SECURED with JWT
 * GET: List activity for authenticated user (from JWT session)
 * POST: Create activity event for authenticated user
 *
 * Security: userId is derived from JWT session, never from client body
 */

import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db/connection'
import { ActivityRepository, UserRepository } from '@/lib/db/repositories'
import { getSessionFromRequest, requireSession, AuthError } from '@/lib/auth/session'

initDb()

// GET /api/activity - List activity for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    requireSession(session)

    // Find user by wallet from session
    const user = UserRepository.findByWalletAddress(session.address)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse limit from query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Return activity for this user only
    const events = ActivityRepository.findByUserId(user.id, limit)
    return NextResponse.json({ events })
  } catch (error) {
    console.error('[API Activity GET] Error:', error)
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}

// POST /api/activity - Create activity event for authenticated user
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    requireSession(session)

    // Find user by wallet from session
    const user = UserRepository.findByWalletAddress(session.address)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse body (no userId accepted from client)
    const body = await request.json() as {
      vaultId: string
      vaultName: string
      type: 'deposit' | 'claim' | 'withdraw'
      amount: number
      txHash?: string
    }

    // Validate required fields
    if (!body.vaultId || !body.type || typeof body.amount !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: vaultId, type, amount' },
        { status: 400 }
      )
    }

    if (!['deposit', 'claim', 'withdraw'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: deposit, claim, withdraw' },
        { status: 400 }
      )
    }

    // Validate txHash if provided
    if (body.txHash && body.txHash !== 'pending') {
      if (!/^0x([A-Fa-f0-9]{64})$/.test(body.txHash)) {
        return NextResponse.json({ error: 'Invalid txHash format' }, { status: 400 })
      }
    }

    // Create activity event with server-derived userId
    const event = ActivityRepository.create({
      userId: user.id,
      vaultId: body.vaultId,
      vaultName: body.vaultName || 'Unknown Vault',
      type: body.type,
      amount: body.amount,
    })

    if (process.env.NODE_ENV !== 'production') {
      console.log('[API Activity POST] Created activity:', event.id, 'type:', event.type, 'wallet:', session.address, 'txHash:', body.txHash)
    }
    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('[API Activity POST] Error:', error)
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Failed to create activity event' }, { status: 500 })
  }
}
