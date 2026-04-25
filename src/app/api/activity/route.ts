/**
 * Activity API Route
 * GET: List activity events for a user (query param: userId)
 * POST: Create a new activity event
 */

import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db/connection'
import { ActivityRepository } from '@/lib/db/repositories'
import type { DbActivityEventInput } from '@/lib/db/schema'

initDb()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required (query param: userId)' },
        { status: 400 }
      )
    }

    const events = ActivityRepository.findByUserId(userId, limit)
    return NextResponse.json({ events })
  } catch (error) {
    console.error('[API Activity GET] Error fetching activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DbActivityEventInput

    if (!body.userId || !body.vaultId || !body.type || typeof body.amount !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: userId, vaultId, type, amount' },
        { status: 400 }
      )
    }

    if (!['deposit', 'claim', 'withdraw'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: deposit, claim, withdraw' },
        { status: 400 }
      )
    }

    const event = ActivityRepository.create(body)
    console.log('[API Activity POST] Created activity event:', event.id, event.type)

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('[API Activity POST] Error creating activity event:', error)
    return NextResponse.json(
      { error: 'Failed to create activity event' },
      { status: 500 }
    )
  }
}
