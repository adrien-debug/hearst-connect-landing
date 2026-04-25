/**
 * Admin Activity API Route - SECURED with JWT + admin flag
 * GET: List ALL user activities (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db/connection'
import { ActivityRepository } from '@/lib/db/repositories'
import { requireAdminAccess, AuthError } from '@/lib/auth/session'

initDb()

// GET /api/admin/activity - Admin only endpoint for all activities
export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request)

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    const events = ActivityRepository.findAll(limit)

    return NextResponse.json({ events, total: events.length })
  } catch (error) {
    console.error('[API Admin Activity GET] Error:', error)
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Failed to fetch admin activity' }, { status: 500 })
  }
}
