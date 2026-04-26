/**
 * Agent 3 — Audit & Risk Monitor
 * Validates signals, monitors risks, generates daily reports
 */

import { pushWebhook, getSignals, getLatestMarket, getAgentConfig } from '../shared/hearst-api'
import { sendSlackNotification, formatDailyReport, formatCriticalAlert } from '../shared/slack'
import { runRiskChecks } from './risk-checks'
import { generateDailyReport } from './reports'

let AUDIT_INTERVAL = 2 * 60_000
const DAILY_REPORT_HOUR = 8

let lastReportDate = ''

async function log(level: 'info' | 'warn' | 'error', message: string) {
  console.log(`[Audit][${level}] ${message}`)
  try {
    await pushWebhook({ action: 'log', data: { agent: 'audit', level, message } })
  } catch (e) {
    console.warn('[Audit] log webhook failed:', e)
  }
}

async function auditPendingSignals() {
  try {
    const res = await getSignals('pending') as { signals: Array<{ id: string; type: string; description: string; riskScore: number | null; paramsJson: string | null }> }
    const pending = res?.signals ?? []

    if (pending.length === 0) return

    const marketRes = await getLatestMarket() as { snapshot: { btcPrice: number; fearGreed: number; usdcApy: number; usdtApy: number } | null }
    const market = marketRes?.snapshot

    for (const signal of pending) {
      const riskResult = runRiskChecks(signal, market)

      if (riskResult.block) {
        await pushWebhook({
          action: 'signal_update',
          data: { signalId: signal.id, status: 'blocked', riskScore: riskResult.score, riskNotes: riskResult.notes }
        })
        await sendSlackNotification(formatCriticalAlert(`Signal BLOCKED: ${signal.type} — ${riskResult.notes}`))
        await log('warn', `Blocked signal ${signal.id}: ${riskResult.notes}`)
      } else if (riskResult.score !== signal.riskScore || riskResult.notes) {
        await pushWebhook({
          action: 'signal_update',
          data: { signalId: signal.id, status: 'pending', riskScore: riskResult.score, riskNotes: riskResult.notes }
        })
        await log('info', `Updated risk for signal ${signal.id}: score=${riskResult.score}`)
      }
    }
  } catch (e) {
    await log('error', `Audit check failed: ${e}`)
  }
}

async function checkDailyReport() {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  if (dateStr === lastReportDate || now.getUTCHours() !== DAILY_REPORT_HOUR) return

  try {
    const report = await generateDailyReport()
    await sendSlackNotification(formatDailyReport(report))
    await log('info', 'Daily risk report sent')
    lastReportDate = dateStr
  } catch (e) {
    await log('error', `Daily report failed: ${e}`)
  }
}

async function tick() {
  try {
    const cfg = await getAgentConfig()
    const cfgInterval = parseInt(cfg.audit_interval_ms || '120000', 10)
    if (cfgInterval >= 30000) AUDIT_INTERVAL = cfgInterval
  } catch (e) {
    await log('warn', `Config fetch failed, using previous interval: ${e}`)
  }

  await auditPendingSignals()
  await checkDailyReport()
}

async function main() {
  await log('info', 'Audit & Risk Monitor agent started')
  await tick()

  const loop = () => setTimeout(async () => {
    await tick()
    loop()
  }, AUDIT_INTERVAL)
  loop()
}

main().catch(console.error)
