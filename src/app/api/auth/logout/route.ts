/**
 * Logout endpoint
 * Clears the session cookie
 */

import { NextResponse } from 'next/server'

export async function POST() {
  const isSecure = process.env.NODE_ENV === 'production'
  const cookieValue = `hearst-session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${isSecure ? '; Secure' : ''}`

  return NextResponse.json(
    { success: true },
    { headers: { 'Set-Cookie': cookieValue } }
  )
}
