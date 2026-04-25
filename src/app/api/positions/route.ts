/**
 * Positions API Route - SECURED with JWT
 * GET: List positions for authenticated user (from JWT session)
 * POST: Create or update position for authenticated user
 * PATCH: Update position for authenticated user
 *
 * Security: userId is derived from JWT session, never from client body
 */

import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db/connection'
import { PositionRepository, ActivityRepository, UserRepository } from '@/lib/db/repositories'
import { getSessionFromRequest, requireSession, AuthError } from '@/lib/auth/session'
import type { DbUserPositionUpdate } from '@/lib/db/schema'

initDb()

// GET /api/positions - List positions for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    requireSession(session)

    // Find user by wallet address from session
    const user = UserRepository.findByWalletAddress(session.address)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return positions for this user only
    const positions = PositionRepository.findByUserId(user.id)
    return NextResponse.json({ positions })
  } catch (error) {
    console.error('[API Positions GET] Error:', error)
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 })
  }
}

// POST /api/positions - Create or add to position for authenticated user
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    requireSession(session)

    // Find or create user by wallet from session
    const user = UserRepository.findOrCreateByWallet(session.address)

    // Parse body (no userId accepted from client)
    const body = await request.json() as {
      vaultId: string
      deposited: number
      maturityDate: number
      vaultName: string
      txHash?: string
    }

    // Validate required fields
    if (!body.vaultId || typeof body.deposited !== 'number' || body.deposited <= 0) {
      return NextResponse.json(
        { error: 'Missing or invalid fields: vaultId, deposited (must be positive number)' },
        { status: 400 }
      )
    }

    // Require valid txHash
    if (!body.txHash || !/^0x([A-Fa-f0-9]{64})$/.test(body.txHash)) {
      return NextResponse.json({ error: 'Valid txHash is required' }, { status: 400 })
    }

    // Check if user already has an active position for this vault
    const existing = PositionRepository.findByUserAndVault(user.id, body.vaultId)
    if (existing) {
      // Add to existing position
      const updated = PositionRepository.addDeposit(existing.id, body.deposited)
      if (!updated) {
        return NextResponse.json({ error: 'Failed to update position' }, { status: 500 })
      }

      // Log activity with txHash
      ActivityRepository.create({
        userId: user.id,
        vaultId: body.vaultId,
        vaultName: body.vaultName || 'Unknown Vault',
        type: 'deposit',
        amount: body.deposited,
      })

      if (process.env.NODE_ENV !== 'production') {
        console.log('[API Positions POST] Added deposit to existing position:', updated.id, 'wallet:', session.address, 'txHash:', body.txHash)
      }
      return NextResponse.json({ position: updated, isNew: false })
    }

    // Create new position
    const position = PositionRepository.create({
      userId: user.id,
      vaultId: body.vaultId,
      deposited: body.deposited,
      maturityDate: body.maturityDate || Date.now() + 365 * 24 * 60 * 60 * 1000,
    })

    // Log activity with txHash
    ActivityRepository.create({
      userId: user.id,
      vaultId: body.vaultId,
      vaultName: body.vaultName || 'Unknown Vault',
      type: 'deposit',
      amount: body.deposited,
    })

    if (process.env.NODE_ENV !== 'production') {
      console.log('[API Positions POST] Created position:', position.id, 'wallet:', session.address, 'txHash:', body.txHash)
    }
    return NextResponse.json({ position, isNew: true }, { status: 201 })
  } catch (error) {
    console.error('[API Positions POST] Error:', error)
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Failed to create position' }, { status: 500 })
  }
}

// PATCH /api/positions - Update position for authenticated user
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    requireSession(session)

    // Find user
    const user = UserRepository.findByWalletAddress(session.address)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse body
    const body = await request.json() as {
      positionId: string
      deposited?: number
      claimedYield?: number
      accumulatedYield?: number
      state?: 'active' | 'matured' | 'withdrawn'
      maturityDate?: number
      vaultName?: string
      txHash?: string
    }

    if (!body.positionId) {
      return NextResponse.json({ error: 'Position ID is required' }, { status: 400 })
    }

    // Validate txHash if provided
    if (body.txHash && !/^0x([A-Fa-f0-9]{64})$/.test(body.txHash)) {
      return NextResponse.json({ error: 'Invalid txHash format' }, { status: 400 })
    }

    // Verify the position belongs to this user
    const existing = PositionRepository.findById(body.positionId)
    if (!existing) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 })
    }
    if (existing.userId !== user.id) {
      console.error('[API Positions PATCH] Unauthorized access attempt:', body.positionId, 'by wallet:', session.address)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Apply updates
    const { positionId, vaultName, txHash, ...updates } = body
    const position = PositionRepository.update(positionId, updates)

    // Log activity for state changes
    if (updates.state === 'withdrawn' && existing.state !== 'withdrawn') {
      ActivityRepository.create({
        userId: user.id,
        vaultId: existing.vaultId,
        vaultName: vaultName || 'Unknown Vault',
        type: 'withdraw',
        amount: existing.deposited + (existing.accumulatedYield - existing.claimedYield),
      })
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[API Positions PATCH] Updated position:', positionId, 'wallet:', session.address, 'txHash:', txHash)
    }
    return NextResponse.json({ position })
  } catch (error) {
    console.error('[API Positions PATCH] Error:', error)
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Failed to update position' }, { status: 500 })
  }
}
