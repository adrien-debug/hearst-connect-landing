/**
 * Admin Early Access API — list & export landing-page signups.
 * GET ?format=csv → CSV download (email,date,source,ip).
 * GET → JSON list.
 */

import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db/connection'
import { EarlyAccessRepository } from '@/lib/db/repositories'
import { requireAdminAccess, AuthError } from '@/lib/auth/session'

initDb()

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request)

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')
    const limit = Math.min(parseInt(searchParams.get('limit') || '5000', 10), 50000)

    const signups = EarlyAccessRepository.findAll(limit)

    if (format === 'csv') {
      const header = 'email,date,source,ip\n'
      const rows = signups
        .map((s) => {
          const date = new Date(s.createdAt).toISOString()
          return [s.email, date, s.source ?? '', s.ip ?? ''].map(csvField).join(',')
        })
        .join('\n')
      const csv = header + rows + (rows ? '\n' : '')
      const filename = `early-access-${new Date().toISOString().slice(0, 10)}.csv`
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    return NextResponse.json({
      signups,
      total: EarlyAccessRepository.count(),
    })
  } catch (error) {
    console.error('[API Admin EarlyAccess GET] Error:', error)
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Failed to fetch early-access signups' }, { status: 500 })
  }
}

function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
