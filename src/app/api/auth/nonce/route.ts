/**
 * SIWE Nonce endpoint
 * Returns a unique nonce for the wallet address to sign
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateNonce } from '@/lib/auth/session'
import type { Address } from 'viem'

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json() as { address: Address }

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    const nonce = await generateNonce(address)

    console.log('[Auth] Nonce generated for:', address)

    return NextResponse.json({ nonce })
  } catch (error) {
    console.error('[Auth Nonce] Error:', error)
    return NextResponse.json({ error: 'Failed to generate nonce' }, { status: 500 })
  }
}
