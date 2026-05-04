/**
 * Email notifications for early-access signups.
 *
 * Uses Resend when RESEND_API_KEY is set; otherwise logs to stdout so the
 * signup is not lost and the local dev workflow keeps working.
 */

import type { DbEarlyAccessSignup } from '@/lib/db/schema'

const NOTIFY_TO = process.env.EARLY_ACCESS_NOTIFY_TO || 'pierre@hearstcorporation.io'
const NOTIFY_FROM = process.env.EARLY_ACCESS_NOTIFY_FROM || 'Hearst AI <noreply@hearstcorporation.io>'

export async function sendEarlyAccessNotification(signup: DbEarlyAccessSignup): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY

  const subject = `New early-access signup — ${signup.email}`
  const dateStr = new Date(signup.createdAt).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'

  const text = [
    'New early-access registration on Hearst AI.',
    '',
    `Email:  ${signup.email}`,
    `Date:   ${dateStr}`,
    `Source: ${signup.source ?? '—'}`,
    `IP:     ${signup.ip ?? '—'}`,
    `Agent:  ${signup.userAgent ?? '—'}`,
  ].join('\n')

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#0b0d10">
      <h2 style="margin:0 0 12px">New early-access signup</h2>
      <table cellpadding="6" style="border-collapse:collapse;font-size:14px">
        <tr><td style="color:#6b7280">Email</td><td><strong>${escape(signup.email)}</strong></td></tr>
        <tr><td style="color:#6b7280">Date</td><td>${escape(dateStr)}</td></tr>
        <tr><td style="color:#6b7280">Source</td><td>${escape(signup.source ?? '—')}</td></tr>
        <tr><td style="color:#6b7280">IP</td><td>${escape(signup.ip ?? '—')}</td></tr>
        <tr><td style="color:#6b7280">User-Agent</td><td>${escape(signup.userAgent ?? '—')}</td></tr>
      </table>
    </div>
  `

  if (!apiKey) {
    console.log(`[early-access] (no RESEND_API_KEY) would notify ${NOTIFY_TO}: ${subject}`)
    console.log(text)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: NOTIFY_FROM,
      to: [NOTIFY_TO],
      subject,
      text,
      html,
      reply_to: signup.email,
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Resend error ${res.status}: ${detail}`)
  }
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
