/**
 * Server-side tool executor for managed agents
 * Each tool maps to real backend operations (DB, external APIs)
 */

import { initDb } from '@/lib/db/connection'
import { MarketRepository, SignalRepository, AgentConfigRepository } from '@/lib/db/repositories'
import { fetchBtcPrice, fetchDeFiYields, fetchFearGreed, estimateMiningHashprice } from './api-sources'
import type { SignalStatus } from '@/lib/db/schema'
import type { SignalType } from './types'

export async function executeToolCall(name: string, input: unknown): Promise<unknown> {
  initDb()

  switch (name) {
    case 'fetch_market_data': {
      // Try live data first, fall back to latest DB snapshot
      try {
        const [btc, yields, fg] = await Promise.allSettled([
          fetchBtcPrice(),
          fetchDeFiYields(),
          fetchFearGreed(),
        ])
        const btcData = btc.status === 'fulfilled' ? btc.value : null
        const yieldsData = yields.status === 'fulfilled' ? yields.value : null
        const fgData = fg.status === 'fulfilled' ? fg.value : null
        const hashprice = btcData ? estimateMiningHashprice(btcData.price) : null

        if (btcData) {
          return {
            source: 'live',
            btcPrice: btcData.price,
            btc24hChange: btcData.change24h,
            btc7dChange: btcData.change7d,
            usdcApy: yieldsData?.usdcApy ?? null,
            usdtApy: yieldsData?.usdtApy ?? null,
            btcApy: yieldsData?.btcApy ?? null,
            fearGreed: fgData?.value ?? null,
            fearLabel: fgData?.label ?? null,
            miningHashprice: hashprice,
          }
        }
      } catch (e) {
        console.warn('[tool-executor] live market fetch failed, falling back to DB:', e)
      }

      // Fall back to latest DB snapshot
      const snapshot = MarketRepository.latest()
      if (snapshot) return { source: 'db_cache', ...snapshot }
      return { error: 'No market data available' }
    }

    case 'get_signals': {
      const inp = input as { status?: string; limit?: number }
      const VALID_STATUSES: SignalStatus[] = ['pending', 'approved', 'rejected', 'executed', 'blocked']
      const statusVal = inp.status && inp.status !== 'all' && VALID_STATUSES.includes(inp.status as SignalStatus)
        ? (inp.status as SignalStatus)
        : undefined
      const limit = inp.limit ?? 10
      const signals = SignalRepository.findAll(statusVal, limit)
      return { signals, count: signals.length }
    }

    case 'create_signal': {
      const inp = input as { type: string; description: string; riskScore: number; paramsJson?: string }
      if (!inp.type || !inp.description || inp.riskScore === undefined) {
        return { error: 'Missing required fields: type, description, riskScore' }
      }
      const validTypes: SignalType[] = ['TAKE_PROFIT', 'REBALANCE', 'YIELD_ROTATE', 'INCREASE_BTC', 'REDUCE_RISK']
      if (!validTypes.includes(inp.type as SignalType)) {
        return { error: `Invalid signal type: ${inp.type}. Valid: ${validTypes.join(', ')}` }
      }
      const signal = SignalRepository.create({
        type: inp.type as SignalType,
        description: inp.description,
        riskScore: Math.max(0, Math.min(100, inp.riskScore)),
        paramsJson: inp.paramsJson,
        createdBy: 'strategy',
      })
      return { success: true, signal }
    }

    case 'update_signal_risk': {
      const inp = input as { signalId: string; status: string; riskScore: number; riskNotes: string }
      if (!inp.signalId) return { error: 'signalId is required' }
      const validStatuses: SignalStatus[] = ['pending', 'blocked']
      if (!validStatuses.includes(inp.status as SignalStatus)) {
        return { error: `Invalid status: ${inp.status}. Use: pending or blocked` }
      }
      const signal = SignalRepository.updateStatus(
        inp.signalId,
        inp.status as SignalStatus,
        inp.riskScore,
        inp.riskNotes
      )
      if (!signal) return { error: `Signal not found: ${inp.signalId}` }
      return { success: true, signal }
    }

    case 'get_agent_config': {
      const config = AgentConfigRepository.getAll()
      // Parse complex fields for Claude
      let profitLevels = []
      let cooldowns = {}
      try { profitLevels = JSON.parse(config.profit_levels || '[]') } catch (e) {
        console.warn('[tool-executor] invalid profit_levels JSON, using []:', e)
      }
      try { cooldowns = JSON.parse(config.signal_cooldown_hours || '{}') } catch (e) {
        console.warn('[tool-executor] invalid signal_cooldown_hours JSON, using {}:', e)
      }
      return {
        btcEntryPrice: parseFloat(config.btc_entry_price || '95000'),
        profitLevels,
        maxBtcSellPct: parseFloat(config.max_btc_sell_pct || '20'),
        fearGreedLow: parseFloat(config.fear_greed_low || '20'),
        fearGreedHigh: parseFloat(config.fear_greed_high || '80'),
        yieldDriftThreshold: parseFloat(config.yield_drift_threshold || '2'),
        allocationDriftThreshold: parseFloat(config.allocation_drift_threshold || '5'),
        cooldownHours: cooldowns,
      }
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}
