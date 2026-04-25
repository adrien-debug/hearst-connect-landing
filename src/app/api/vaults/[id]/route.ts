/**
 * Single Vault API Route
 * GET: Get vault by ID
 * PATCH: Update vault
 * DELETE: Delete vault
 */

import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db/connection'
import { VaultRepository } from '@/lib/db/repositories'
import type { DbVaultInput } from '@/lib/db/schema'

initDb()

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
