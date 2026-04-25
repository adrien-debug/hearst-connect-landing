/**
 * Vaults API Route
 * GET: List all vaults (optionally filter by active)
 * POST: Create a new vault (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db/connection'
import { VaultRepository } from '@/lib/db/repositories'
import type { DbVaultInput } from '@/lib/db/schema'

// Initialize DB on first request
initDb()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const vaults = activeOnly ? VaultRepository.findActive() : VaultRepository.findAll()

    return NextResponse.json({ vaults })
  } catch (error) {
    console.error('[API Vaults GET] Error fetching vaults:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vaults' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DbVaultInput

    // Basic validation
    if (!body.name || !body.vaultAddress || !body.usdcAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: name, vaultAddress, usdcAddress' },
        { status: 400 }
      )
    }

    if (typeof body.apr !== 'number' || body.apr < 0) {
      return NextResponse.json(
        { error: 'Invalid APR value' },
        { status: 400 }
      )
    }

    const vault = VaultRepository.create(body)
    console.log('[API Vaults POST] Created vault:', vault.id, vault.name)

    return NextResponse.json({ vault }, { status: 201 })
  } catch (error) {
    console.error('[API Vaults POST] Error creating vault:', error)
    return NextResponse.json(
      { error: 'Failed to create vault' },
      { status: 500 }
    )
  }
}
