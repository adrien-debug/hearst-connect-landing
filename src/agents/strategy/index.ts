/**
 * Agent 2 — Strategy Optimizer
 * Reads config from admin, injects context, applies cooldowns
 */

import { pushWebhook, getLatestMarket, getSignals, getAgentConfig } from '../shared/hearst-api'
import { analyzeWithClaude } from '../shared/anthropic'
import { sendSlackNotification, formatSignalAlert } from '../shared/slack'
import { evaluateRules, parseConfigToRules } from './rules'
import type { RebalanceSignal, SignalType } from '../shared/types'

let checkInterval = 5 * 60_000

interface SignalRow { type: string; status: string; timestamp: number; description: string }

async function log(level: 'info' | 'warn' | 'error', message: string) {
  console.log(`[Strategy][${level}] ${message}`)
  try {
    await pushWebhook({ action: 'log', data: { agent: 'strategy', level, message } })
  } catch (e) {
    console.warn('[Strategy] log webhook failed:', e)
  }
}

function buildContextBlock(recentSignals: SignalRow[]): string {
  if (recentSignals.length === 0) return ''
  const lines = recentSignals.slice(0, 8).map(s => {
    const ago = Math.round((Date.now() - s.timestamp) / 3600_000)
    return `- [${s.status.toUpperCase()}] ${s.type} (il y a ${ago}h) — ${s.description.slice(0, 120)}`
  })
  return `\n## Historique récent de tes signaux\n${lines.join('\n')}\nAdapte ta sensibilité en fonction des approbations/rejets.\n`
}

async function evaluate() {
  try {
    // Load config from admin
    let rawConfig: Record<string, string> = {}
    try {
      rawConfig = await getAgentConfig()
    } catch (e) {
      await log('warn', `Config fetch failed, using defaults: ${e}`)
    }

    const cfg = parseConfigToRules(rawConfig)
    const promptExtra = rawConfig.strategy_prompt_extra || ''

    // Update interval from config
    const cfgInterval = parseInt(rawConfig.strategy_interval_ms || '300000', 10)
    if (cfgInterval !== checkInterval && cfgInterval >= 30000) {
      checkInterval = cfgInterval
      await log('info', `Interval updated to ${cfgInterval}ms`)
    }

    const marketRes = await getLatestMarket() as { snapshot: { btcPrice: number; btc24hChange: number; btc7dChange: number; usdcApy: number; usdtApy: number; btcApy: number; fearGreed: number; fearLabel: string; miningHashprice: number | null } | null }
    const snap = marketRes?.snapshot
    if (!snap) {
      await log('info', 'No market snapshot available yet')
      return
    }

    // Fetch all recent signals for context + cooldowns + dedup
    const allRes = await getSignals() as { signals: SignalRow[] }
    const allSignals = allRes?.signals ?? []
    const pendingTypes = new Set(allSignals.filter(s => s.status === 'pending').map(s => s.type))

    // Build cooldown timestamps (most recent signal of each type)
    const recentTs: Partial<Record<SignalType, number>> = {}
    for (const s of allSignals) {
      const t = s.type as SignalType
      if (!recentTs[t] || s.timestamp > recentTs[t]!) recentTs[t] = s.timestamp
    }

    const candidateSignals = evaluateRules(snap, pendingTypes, cfg, recentTs)

    const contextBlock = buildContextBlock(allSignals)

    for (const candidate of candidateSignals) {
      let description = candidate.description
      try {
        const refined = await analyzeWithClaude('strategy',
          `${contextBlock}\n## Snapshot marché actuel\n- BTC: $${snap.btcPrice.toFixed(0)} (24h: ${snap.btc24hChange.toFixed(2)}%, 7d: ${snap.btc7dChange.toFixed(2)}%)\n- USDC APY: ${snap.usdcApy.toFixed(2)}% | USDT APY: ${snap.usdtApy.toFixed(2)}%\n- Fear & Greed: ${snap.fearGreed} (${snap.fearLabel})\n- BTC Entry ref: $${cfg.btcEntry}\n\n## Signal proposé\nType: ${candidate.type}\nRaison: ${candidate.description}\nRisk score: ${candidate.riskScore ?? 'N/A'}\n\nAffine cette description en 2 phrases max. Sois précis avec les chiffres.`,
          250,
          promptExtra || undefined
        )
        if (refined) description = refined
      } catch (e) {
        await log('warn', `Claude refinement failed for ${candidate.type}, using raw description: ${e}`)
      }

      const signal: RebalanceSignal = { ...candidate, description, createdBy: 'strategy' }

      await pushWebhook({ action: 'signal', data: signal })
      await sendSlackNotification(formatSignalAlert(signal))
      await log('info', `Signal created: ${signal.type} — ${signal.description}`)
    }

    if (candidateSignals.length === 0) {
      await log('info', `No signals warranted. BTC $${snap.btcPrice.toFixed(0)}, F&G ${snap.fearGreed}`)
    }
  } catch (e) {
    await log('error', `Strategy evaluation failed: ${e}`)
  }
}

async function main() {
  await log('info', 'Strategy Optimizer agent started')
  await evaluate()

  const loop = () => setTimeout(async () => {
    await evaluate()
    loop()
  }, checkInterval)
  loop()
}

main().catch(console.error)
