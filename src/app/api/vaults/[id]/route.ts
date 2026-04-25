/**
 * Single Vault API Route - SECURED
 * GET: Get vault by ID - Public
 * PATCH: Update vault - Admin only
 * DELETE: Delete vault - Admin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db/connection'
import { VaultRepository } from '@/lib/db/repositories'
import { isAdminRequest } from '@/lib/auth/wallet-auth'
import type { DbVaultInput } from '@/lib/db/schema'

initDb()

// GET /api/vaults/[id] - Public endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const vault = VaultRepository.findById(id)

    if (!vault) {
      return NextResponse.json(
        { error: 'Vault not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ vault })
  } catch (error) {
    console.error('[API Vault GET] Error fetching vault:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vault' },
      { status: 500 }
    )
  }
}

// PATCH /api/vaults/[id] - Admin only
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authorization
    if (!isAdminRequest(request)) {
      console.error('[API Vault PATCH] Unauthorized admin attempt')
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const updates = await request.json() as Partial<DbVaultInput>

    const vault = VaultRepository.update(id, updates)

    if (!vault) {
      return NextResponse.json(
        { error: 'Vault not found' },
        { status: 404 }
      )
    }

    console.log('[API Vault PATCH] Updated vault:', id)
    return NextResponse.json({ vault })
  } catch (error) {
    console.error('[API Vault PATCH] Error updating vault:', error)
    return NextResponse.json(
      { error: 'Failed to update vault' },
      { status: 500 }
    )
  }
}

// DELETE /api/vaults/[id] - Admin only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authorization
    if (!isAdminRequest(request)) {
      console.error('[API Vault DELETE] Unauthorized admin attempt')
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const deleted = VaultRepository.delete(id)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Vault not found' },
        { status: 404 }
      )
    }

    console.log('[API Vault DELETE] Deleted vault:', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API Vault DELETE] Error deleting vault:', error)
    return NextResponse.json(
      { error: 'Failed to delete vault' },
      { status: 500 }
    )
  }
}
