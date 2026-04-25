/**
 * Activity API Route - SECURED
 * GET: List activity for authenticated user (from wallet header)
 * POST: Create activity event for authenticated user
 *
 * Security: userId is derived from authenticated wallet header, never from client body
 */

import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db/connection'
import { ActivityRepository, UserRepository } from '@/lib/db/repositories'
import { requireAuth } from '@/lib/auth/wallet-auth'

initDb()

// GET /api/activity - List activity for authenticated user
export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const auth = requireAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Find user by wallet
    const user = UserRepository.findByWalletAddress(auth.walletAddress)
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
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}

// POST /api/activity - Create activity event for authenticated user
export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const auth = requireAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Find user by wallet
    const user = UserRepository.findByWalletAddress(auth.walletAddress)
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

    // Create activity event with server-derived userId
    const event = ActivityRepository.create({
      userId: user.id,
      vaultId: body.vaultId,
      vaultName: body.vaultName || 'Unknown Vault',
      type: body.type,
      amount: body.amount,
    })

    console.log('[API Activity POST] Created activity:', event.id, 'type:', event.type, 'wallet:', auth.walletAddress, 'txHash:', body.txHash)
    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('[API Activity POST] Error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to create activity event' }, { status: 500 })
  }
}
