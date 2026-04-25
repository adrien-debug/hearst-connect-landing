/**
 * Single Vault API Route - SECURED with JWT
 * GET: Get vault by ID - Public
 * PATCH: Update vault - Admin only (JWT session + admin flag)
 * DELETE: Delete vault - Admin only (JWT session + admin flag)
 */

import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db/connection'
import { VaultRepository } from '@/lib/db/repositories'
import { requireAdminAccess, AuthError } from '@/lib/auth/session'
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
      return NextResponse.json({ error: 'Vault not found' }, { status: 404 })
    }

    return NextResponse.json({ vault })
  } catch (error) {
    console.error('[API Vault GET] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch vault' }, { status: 500 })
  }
}

// PATCH /api/vaults/[id] - Admin only (JWT session + admin flag)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAccess(request)

    const { id } = await params
    const updates = await request.json() as Partial<DbVaultInput>

    const vault = VaultRepository.update(id, updates)

    if (!vault) {
      return NextResponse.json({ error: 'Vault not found' }, { status: 404 })
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[API Vault PATCH] Updated vault:', id)
    }
    return NextResponse.json({ vault })
  } catch (error) {
    console.error('[API Vault PATCH] Error:', error)
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Failed to update vault' }, { status: 500 })
  }
}

// DELETE /api/vaults/[id] - Admin only (soft delete to preserve position references)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAccess(request)

    const { id } = await params
    
    const vault = VaultRepository.softDelete(id)

    if (!vault) {
      return NextResponse.json({ error: 'Vault not found' }, { status: 404 })
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[API Vault DELETE] Soft deleted vault:', id, vault.name)
    }
    return NextResponse.json({ success: true, vault })
  } catch (error) {
    console.error('[API Vault DELETE] Error:', error)
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Failed to delete vault' }, { status: 500 })
  }
}
