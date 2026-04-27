/**
 * HTTP client for agents to communicate with the Hearst Connect backend
 */

import type { WebhookPayload } from './types'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

function loadLocalEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  const root = process.cwd()
  for (const fileName of ['.env.local', '.env']) {
    const path = join(root, fileName)
    if (!existsSync(path)) continue
    const content = readFileSync(path, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      const key = trimmed.slice(0, idx).trim()
      let value = trimmed.slice(idx + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      env[key] = value
    }
  }
  return env
}

const localEnv = loadLocalEnv()
const API_URL = process.env.HEARST_API_URL || localEnv.HEARST_API_URL || 'http://localhost:8100'
const AGENT_KEY = process.env.AGENT_WEBHOOK_KEY || localEnv.AGENT_WEBHOOK_KEY || process.env.ADMIN_PANEL_KEY || localEnv.ADMIN_PANEL_KEY || 'hearst-admin-dev-key'

async function apiCall<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-agent-key': AGENT_KEY,
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => 'unknown')
    throw new Error(`API ${res.status}: ${body}`)
  }
  return res.json()
}

export async function pushWebhook(payload: WebhookPayload): Promise<unknown> {
  return apiCall('/agents/webhook', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getLatestMarket(): Promise<unknown> {
  return apiCall('/market')
}

export async function getMarketHistory(limit = 100): Promise<unknown> {
  return apiCall(`/market/history?limit=${limit}`)
}

export async function getSignals(status?: string): Promise<unknown> {
  const qs = status ? `?status=${status}` : ''
  return apiCall(`/signals${qs}`)
}

export async function getAgentsStatus(): Promise<unknown> {
  return apiCall('/agents/status')
}

export async function getAgentConfig(): Promise<Record<string, string>> {
  const res = await apiCall<{ config: Record<string, string> }>('/agents/config')
  return res.config
}
