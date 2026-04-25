/**
 * Users API Route
 * GET: Find user by wallet address (query param: wallet)
 * POST: Create or find user by wallet address
 */

import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db/connection'
import { UserRepository } from '@/lib/db/repositories'
import type { Address } from 'viem'

initDb()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet') as Address | null

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required (query param: wallet)' },
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
    const body = await request.json() as { walletAddress: Address }

    if (!body.walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      )
    }

    // Find or create user by wallet address
    const user = UserRepository.findOrCreateByWallet(body.walletAddress)
    const isNew = user.createdAt === user.updatedAt

    console.log(`[API Users POST] ${isNew ? 'Created' : 'Found'} user:`, user.id, user.walletAddress)

    return NextResponse.json({ user, isNew }, { status: isNew ? 201 : 200 })
  } catch (error) {
    console.error('[API Users POST] Error creating/finding user:', error)
    return NextResponse.json(
      { error: 'Failed to create/find user' },
      { status: 500 }
    )
  }
}
