/**
 * Positions API Route
 * GET: List positions for a user (query param: userId)
 * POST: Create a new position
 */

import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db/connection'
import { PositionRepository, ActivityRepository } from '@/lib/db/repositories'
import type { DbUserPositionInput, DbUserPositionUpdate } from '@/lib/db/schema'

initDb()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required (query param: userId)' },
        { status: 400 }
      )
    }

    const positions = PositionRepository.findByUserId(userId)
    return NextResponse.json({ positions })
  } catch (error) {
    console.error('[API Positions GET] Error fetching positions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DbUserPositionInput & { vaultName: string }

    if (!body.userId || !body.vaultId || typeof body.deposited !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: userId, vaultId, deposited' },
        { status: 400 }
      )
    }

    // Check if user already has an active position for this vault
    const existing = PositionRepository.findByUserAndVault(body.userId, body.vaultId)
    if (existing) {
      // Add to existing position
      const updated = PositionRepository.addDeposit(existing.id, body.deposited)
      if (!updated) {
        return NextResponse.json(
          { error: 'Failed to update position' },
          { status: 500 }
        )
      }

      // Log activity
      ActivityRepository.create({
        userId: body.userId,
        vaultId: body.vaultId,
        vaultName: body.vaultName || 'Unknown Vault',
        type: 'deposit',
        amount: body.deposited,
      })

      console.log('[API Positions POST] Added deposit to existing position:', updated.id)
      return NextResponse.json({ position: updated, isNew: false })
    }

    // Create new position
    const position = PositionRepository.create({
      userId: body.userId,
      vaultId: body.vaultId,
      deposited: body.deposited,
      maturityDate: body.maturityDate,
    })

    // Log activity
    ActivityRepository.create({
      userId: body.userId,
      vaultId: body.vaultId,
      vaultName: body.vaultName || 'Unknown Vault',
      type: 'deposit',
      amount: body.deposited,
    })

    console.log('[API Positions POST] Created position:', position.id)
    return NextResponse.json({ position, isNew: true }, { status: 201 })
  } catch (error) {
    console.error('[API Positions POST] Error creating position:', error)
    return NextResponse.json(
      { error: 'Failed to create position' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as { id: string } & DbUserPositionUpdate & { vaultName?: string }
    const { id, vaultName, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Position ID is required' },
        { status: 400 }
      )
    }

    const existing = PositionRepository.findById(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      )
    }

    const position = PositionRepository.update(id, updates)

    // Log activity for state changes
    if (updates.state === 'withdrawn' && existing.state !== 'withdrawn') {
      ActivityRepository.create({
        userId: existing.userId,
        vaultId: existing.vaultId,
        vaultName: vaultName || 'Unknown Vault',
        type: 'withdraw',
        amount: existing.deposited + (existing.accumulatedYield - existing.claimedYield),
      })
    }

    console.log('[API Positions PATCH] Updated position:', id)
    return NextResponse.json({ position })
  } catch (error) {
    console.error('[API Positions PATCH] Error updating position:', error)
    return NextResponse.json(
      { error: 'Failed to update position' },
      { status: 500 }
    )
  }
}
