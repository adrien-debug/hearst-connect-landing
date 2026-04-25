/**
 * Vaults API Route - SECURED with JWT
 * GET: List all vaults (optionally filter by active) - Public
 * POST: Create a new vault - Admin only (JWT session + admin flag)
 */

import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db/connection'
import { VaultRepository } from '@/lib/db/repositories'
import { requireAdminAccess, AuthError } from '@/lib/auth/session'
import type { DbVaultInput } from '@/lib/db/schema'

initDb()

// GET /api/vaults - Public endpoint for listing vaults
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const vaults = activeOnly ? VaultRepository.findActive() : VaultRepository.findAll()

    return NextResponse.json({ vaults })
  } catch (error) {
    console.error('[API Vaults GET] Error fetching vaults:', error)
    return NextResponse.json({ error: 'Failed to fetch vaults' }, { status: 500 })
  }
}

// POST /api/vaults - Admin only (JWT session required + admin flag)
export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request)

    const body = await request.json() as DbVaultInput

    // Basic validation
    if (!body.name || !body.vaultAddress || !body.usdcAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: name, vaultAddress, usdcAddress' },
        { status: 400 }
      )
    }

    if (typeof body.apr !== 'number' || body.apr < 0) {
      return NextResponse.json({ error: 'Invalid APR value' }, { status: 400 })
    }

    const vault = VaultRepository.create(body)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[API Vaults POST] Created vault:', vault.id, vault.name)
    }

    return NextResponse.json({ vault }, { status: 201 })
  } catch (error) {
    console.error('[API Vaults POST] Error:', error)
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Failed to create vault' }, { status: 500 })
  }
}
