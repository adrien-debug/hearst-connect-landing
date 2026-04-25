/**
 * SIWE Verify endpoint
 * Verifies the signed EIP-4361 message and creates a session.
 *
 * siwe@3 ABNF parser is broken under Next 16 / Webpack bundling.
 * We parse the EIP-4361 string manually and verify with viem.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyMessage } from 'viem'
import { createSession, verifySession, verifyNonce, clearNonce } from '@/lib/auth/session'
import type { Address } from 'viem'

function parseSiweMessage(message: string): {
  domain: string
  address: Address
  statement: string
  uri: string
  version: string
  chainId: number
  nonce: string
  issuedAt: string
} | null {
  try {
    const lines = message.split('\n')
    if (lines.length < 9) return null

    const domain = lines[0].replace(' wants you to sign in with your Ethereum account:', '')
    const address = lines[1] as Address
    const statement = lines[3]

    const fields: Record<string, string> = {}
    for (let i = 5; i < lines.length; i++) {
      const match = lines[i].match(/^(.+?):\s*(.+)$/)
      if (match) {
        fields[match[1]] = match[2]
      }
    }

    if (!fields['URI'] || !fields['Version'] || !fields['Chain ID'] || !fields['Nonce'] || !fields['Issued At']) {
      return null
    }

    return {
      domain,
      address,
      statement,
      uri: fields['URI'],
      version: fields['Version'],
      chainId: parseInt(fields['Chain ID'], 10),
      nonce: fields['Nonce'],
      issuedAt: fields['Issued At'],
    }
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, signature } = await request.json() as {
      message: string
      signature: string
    }

    if (!message || !signature) {
      return NextResponse.json(
        { error: 'Missing message or signature' },
        { status: 400 }
      )
    }

    // Parse EIP-4361 message manually
    const parsed = parseSiweMessage(message)
    if (!parsed) {
      console.error('[Auth Verify] Failed to parse SIWE message')
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      )
    }

    // Verify signature with viem
    const valid = await verifyMessage({
      address: parsed.address,
      message,
      signature: signature as `0x${string}`,
    })

    if (!valid) {
      console.error('[Auth Verify] Invalid signature for:', parsed.address)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Verify nonce was issued by us (async HMAC check)
    if (!(await verifyNonce(parsed.address, parsed.nonce))) {
      console.error('[Auth Verify] Invalid or expired nonce for:', parsed.address)
      return NextResponse.json(
        { error: 'Invalid or expired nonce. Please try again.' },
        { status: 400 }
      )
    }

    clearNonce(parsed.address)

    // Create JWT session
    const token = await createSession(parsed.address)
    const session = await verifySession(token)
    const isAdmin = session?.isAdmin ?? false

    console.log('[Auth] Session created for:', parsed.address, isAdmin ? '(admin)' : '')

    const isSecure = process.env.NODE_ENV === 'production'
    const cookieValue = `hearst-session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${isSecure ? '; Secure' : ''}`

    return NextResponse.json(
      { success: true, address: parsed.address, isAdmin },
      { headers: { 'Set-Cookie': cookieValue } }
    )
  } catch (error) {
    console.error('[Auth Verify] Error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 401 }
    )
  }
}
