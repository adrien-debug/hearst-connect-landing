/**
 * Users API Route - SECURED
 * GET: Find user by wallet address (from header or query param)
 * POST: Create or find user by wallet address (from header)
 *
 * Security: Prioritizes wallet address from x-wallet-address header
 */

import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db/connection'
import { UserRepository } from '@/lib/db/repositories'
import { getAuthFromRequest, requireAuth } from '@/lib/auth/wallet-auth'
import type { Address } from 'viem'

initDb()

export async function GET(request: NextRequest) {
  try {
    // Try to get wallet from auth header first, then fall back to query param
    const auth = getAuthFromRequest(request)
    const { searchParams } = new URL(request.url)
    const queryWallet = searchParams.get('wallet') as Address | null

    const walletAddress = auth?.walletAddress || queryWallet

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required (header x-wallet-address or query param wallet)' },
        { status: 400 }
      )
    }

    const user = UserRepository.findByWalletAddress(walletAddress)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('[API Users GET] Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require auth header for creating/finding user
    const auth = requireAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required. Provide x-wallet-address header.' }, { status: 401 })
    }

    // Find or create user by wallet address from header
    const user = UserRepository.findOrCreateByWallet(auth.walletAddress)
    const isNew = user.createdAt === user.updatedAt

    console.log(`[API Users POST] ${isNew ? 'Created' : 'Found'} user:`, user.id, user.walletAddress)

    return NextResponse.json({ user, isNew }, { status: isNew ? 201 : 200 })
  } catch (error) {
    console.error('[API Users POST] Error creating/finding user:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to create/find user' },
      { status: 500 }
    )
  }
}
