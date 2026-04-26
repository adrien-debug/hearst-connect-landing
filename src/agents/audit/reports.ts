/**
 * Daily risk report generation
 */

import { getLatestMarket, getSignals } from '../shared/hearst-api'
import { analyzeWithClaude } from '../shared/anthropic'

export async function generateDailyReport(): Promise<string> {
  const [marketRes, signalsRes] = await Promise.all([
    getLatestMarket() as Promise<{ snapshot: { btcPrice: number; btc24hChange: number; btc7dChange: number; usdcApy: number; usdtApy: number; fearGreed: number; fearLabel: string } | null }>,
    getSignals() as Promise<{ signals: Array<{ type: string; status: string; timestamp: number }> }>,
  ])

  const snap = marketRes?.snapshot
  const signals = signalsRes?.signals ?? []

  const last24h = signals.filter(s => Date.now() - s.timestamp < 86_400_000)
  const pending = last24h.filter(s => s.status === 'pending').length
  const approved = last24h.filter(s => s.status === 'approved').length
  const executed = last24h.filter(s => s.status === 'executed').length
  const blocked = last24h.filter(s => s.status === 'blocked').length

  const contextLines = [
    `*Daily Risk Report — ${new Date().toISOString().slice(0, 10)}*`,
    '',
    '*Market Overview:*',
    snap ? `• BTC: $${snap.btcPrice.toFixed(0)} (24h: ${snap.btc24hChange.toFixed(2)}%, 7d: ${snap.btc7dChange.toFixed(2)}%)` : '• BTC data unavailable',
    snap ? `• USDC APY: ${snap.usdcApy.toFixed(2)}% | USDT APY: ${snap.usdtApy.toFixed(2)}%` : '',
    snap ? `• Fear & Greed: ${snap.fearGreed} (${snap.fearLabel})` : '',
    '',
    '*Signals (24h):*',
    `• Pending: ${pending} | Approved: ${approved} | Executed: ${executed} | Blocked: ${blocked}`,
  ]

  let analysis = ''
  if (snap) {
    try {
      analysis = await analyzeWithClaude('audit',
        `Generate a brief daily risk assessment (3-4 bullet points).\nBTC: $${snap.btcPrice.toFixed(0)}, 24h: ${snap.btc24hChange.toFixed(2)}%, 7d: ${snap.btc7dChange.toFixed(2)}%\nUSDC: ${snap.usdcApy.toFixed(2)}%, USDT: ${snap.usdtApy.toFixed(2)}%\nF&G: ${snap.fearGreed}\nSignals 24h: ${pending} pending, ${blocked} blocked`,
        300
      )
    } catch (e) {
      console.warn('[audit/reports] Claude analysis failed, report will skip risk assessment:', e)
    }
  }

  if (analysis) {
    contextLines.push('', '*Risk Assessment:*', analysis)
  }

  return contextLines.filter(Boolean).join('\n')
}
