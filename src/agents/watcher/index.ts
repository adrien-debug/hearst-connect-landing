/**
 * Agent 1 — Market Watcher
 * Collects market data from external APIs and pushes snapshots to Hearst backend
 */

import { fetchBtcPrice, fetchDeFiYields, fetchFearGreed, estimateMiningHashprice } from '../shared/api-sources'
import { pushWebhook, getAgentConfig } from '../shared/hearst-api'
import { analyzeWithClaude } from '../shared/anthropic'
import { checkAlerts } from './alerts'
import type { MarketSnapshot } from '../shared/types'

let PRICE_INTERVAL = 60_000
const YIELD_INTERVAL = 5 * 60_000
const SENTIMENT_INTERVAL = 15 * 60_000

let lastYieldFetch = 0
let lastSentimentFetch = 0
let cachedYields = { usdcApy: 0, usdtApy: 0, btcApy: 0 }
let cachedSentiment = { fearGreed: 50, fearLabel: 'Neutral' }

async function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
  console.log(`[Watcher][${level}] ${message}`)
  try {
    await pushWebhook({ action: 'log', data: { agent: 'watcher', level, message, dataJson: data ? JSON.stringify(data) : undefined } })
  } catch (e) {
    console.warn('[Watcher] log webhook failed:', e)
  }
}

let promptExtra = ''

async function collectAndPush() {
  try {
    // Refresh config
    try {
      const cfg = await getAgentConfig()
      const cfgInterval = parseInt(cfg.watcher_interval_ms || '60000', 10)
      if (cfgInterval >= 10000) PRICE_INTERVAL = cfgInterval
      promptExtra = cfg.watcher_prompt_extra || ''
    } catch (e) {
      await log('warn', `Config fetch failed, using previous values: ${e}`)
    }

    const now = Date.now()
    const btc = await fetchBtcPrice()

    if (now - lastYieldFetch > YIELD_INTERVAL) {
      try {
        cachedYields = await fetchDeFiYields()
        lastYieldFetch = now
      } catch (e) {
        await log('warn', 'Failed to fetch DeFi yields', { error: String(e) })
      }
    }

    if (now - lastSentimentFetch > SENTIMENT_INTERVAL) {
      try {
        const fg = await fetchFearGreed()
        cachedSentiment = { fearGreed: fg.value, fearLabel: fg.label }
        lastSentimentFetch = now
      } catch (e) {
        await log('warn', 'Failed to fetch Fear & Greed', { error: String(e) })
      }
    }

    const hashprice = estimateMiningHashprice(btc.price)

    let notes: string | null = null
    try {
      notes = await analyzeWithClaude('watcher',
        `Market snapshot:\n- BTC: $${btc.price.toFixed(0)} (24h: ${btc.change24h.toFixed(2)}%, 7d: ${btc.change7d.toFixed(2)}%)\n- USDC APY: ${cachedYields.usdcApy.toFixed(2)}%\n- USDT APY: ${cachedYields.usdtApy.toFixed(2)}%\n- BTC APY: ${cachedYields.btcApy.toFixed(2)}%\n- Fear & Greed: ${cachedSentiment.fearGreed} (${cachedSentiment.fearLabel})\n- Hashprice: ~$${hashprice}/PH/day\n\nRédige une observation de marché en 2-3 phrases.`,
        200,
        promptExtra || undefined
      )
    } catch (e) {
      await log('warn', `Claude analyze failed, snapshot will have no notes: ${e}`)
    }

    const snapshot: MarketSnapshot = {
      btcPrice: btc.price,
      btc24hChange: btc.change24h,
      btc7dChange: btc.change7d,
      usdcApy: cachedYields.usdcApy,
      usdtApy: cachedYields.usdtApy,
      btcApy: cachedYields.btcApy,
      miningHashprice: hashprice,
      fearGreed: cachedSentiment.fearGreed,
      fearLabel: cachedSentiment.fearLabel,
      notes,
    }

    await pushWebhook({ action: 'snapshot', data: snapshot })
    await log('info', `Snapshot: BTC $${btc.price.toFixed(0)}, F&G ${cachedSentiment.fearGreed}`)

    await checkAlerts(snapshot)
  } catch (e) {
    await log('error', `Collection failed: ${e}`)
  }
}

async function main() {
  await log('info', 'Market Watcher agent started')
  await collectAndPush()

  const loop = () => setTimeout(async () => {
    await collectAndPush()
    loop()
  }, PRICE_INTERVAL)
  loop()
}

main().catch(console.error)
