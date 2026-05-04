/**
 * Early Access signup endpoint - public.
 * Captures landing-page email submissions, dedupes, and notifies the team.
 */

import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db/connection'
import { EarlyAccessRepository } from '@/lib/db/repositories'
import { sendEarlyAccessNotification } from '@/lib/notifications/early-access'

initDb()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const rawEmail = typeof body?.email === 'string' ? body.email.trim() : ''
    const source = typeof body?.source === 'string' ? body.source.slice(0, 120) : 'landing'

    if (!rawEmail || !EMAIL_RE.test(rawEmail) || rawEmail.length > 254) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const email = rawEmail.toLowerCase()
    const existing = EarlyAccessRepository.findByEmail(email)
    if (existing) {
      return NextResponse.json({ ok: true, duplicate: true })
    }

    const userAgent = request.headers.get('user-agent') || undefined
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      undefined

    const signup = EarlyAccessRepository.create({ email, source, userAgent, ip })

    // Fire-and-forget notification (non-blocking on failure)
    sendEarlyAccessNotification(signup).catch((err) => {
      console.error('[early-access] notification failed:', err)
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[API early-access POST] Error:', error)
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 })
  }
}
