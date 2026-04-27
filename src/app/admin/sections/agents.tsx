'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AgentsApi } from '@/lib/api-client'
import { ADMIN_TOKENS as T, MONO } from '../constants'

// ── Types ────────────────────────────────────────────────────────────────

type AgentName = 'watcher' | 'strategy' | 'audit'

interface AgentRunEvent {
  type: 'start' | 'tool_call' | 'tool_result' | 'thinking' | 'signal_created' | 'signal_updated' | 'done' | 'error'
  agent?: string
  tool?: string
  input?: unknown
  result?: unknown
  text?: string
  signalType?: string
  riskScore?: number
  signalId?: string
  status?: string
  report?: string
  durationMs?: number
  message?: string
}

interface LogLine {
  id: string
  ts: string
  tag: 'TOOL' | 'RESULT' | 'SIGNAL' | 'CLAUDE' | 'ERROR' | 'START' | 'DONE'
  text: string
  agent: AgentName
}

interface RunHistory {
  id: string
  agent: AgentName
  ts: string
  durationMs: number
  signalsCreated: string[]
  report: string
}

// ── Constants ────────────────────────────────────────────────────────────

const AGENT_META: Record<AgentName, { label: string; desc: string; icon: string; color: string }> = {
  watcher: {
    label: 'Market Watcher',
    desc: 'Surveille BTC, yields DeFi, Fear & Greed, hashprice en continu.',
    icon: '👁',
    color: T.colors.accent,
  },
  strategy: {
    label: 'Strategy Optimizer',
    desc: 'Analyse les conditions et génère des signaux de rebalance si justifiés.',
    icon: '⚡',
    color: '#52c97a',
  },
  audit: {
    label: 'Audit & Risk',
    desc: 'Audite les signaux pending, vérifie les risques, peut bloquer.',
    icon: '🛡',
    color: '#d4d4d8',
  },
}

/** Token-driven log tag styling. Hue from --color-log-*; bg uses color-mix
 * to derive a low-opacity wash without committing to a fixed RGB triplet. */
const TAG_STYLES: Record<LogLine['tag'], { bg: string; color: string }> = {
  START: { bg: `color-mix(in srgb, ${T.colors.logStart} 15%, transparent)`, color: T.colors.logStart },
  TOOL: { bg: `color-mix(in srgb, ${T.colors.logTool} 15%, transparent)`, color: T.colors.logTool },
  RESULT: { bg: `color-mix(in srgb, ${T.colors.logResult} 12%, transparent)`, color: T.colors.logResult },
  SIGNAL: { bg: `color-mix(in srgb, ${T.colors.logSignal} 15%, transparent)`, color: T.colors.logSignal },
  CLAUDE: { bg: `color-mix(in srgb, ${T.colors.logClaude} 12%, transparent)`, color: T.colors.logClaude },
  ERROR: { bg: `color-mix(in srgb, ${T.colors.logError} 15%, transparent)`, color: T.colors.logError },
  DONE: { bg: `color-mix(in srgb, ${T.colors.logResult} 15%, transparent)`, color: T.colors.logDone },
}

function genId() { return Math.random().toString(36).slice(2, 9) }
function now() { return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }

function truncate(v: unknown, max = 120): string {
  const s = typeof v === 'string' ? v : JSON.stringify(v)
  return s.length > max ? s.slice(0, max) + '…' : s
}

// ── Component ─────────────────────────────────────────────────────────────

export default function AgentsSection() {
  const [runningAgent, setRunningAgent] = useState<AgentName | null>(null)
  const [logs, setLogs] = useState<LogLine[]>([])
  const [history, setHistory] = useState<RunHistory[]>([])
  const [activeFilter, setActiveFilter] = useState<AgentName | 'all'>('all')
  const logEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const addLog = useCallback((tag: LogLine['tag'], text: string, agent: AgentName) => {
    setLogs(prev => [...prev, { id: genId(), ts: now(), tag, text, agent }])
  }, [])

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleRun = useCallback((agent: AgentName) => {
    if (runningAgent) return
    setRunningAgent(agent)
    setLogs(prev => [
      ...prev,
      { id: genId(), ts: now(), tag: 'START', text: `▶ Lancement de l'agent ${AGENT_META[agent].label}…`, agent },
    ])

    const runStart = Date.now()
    const signalsThisRun: string[] = []

    const ctrl = AgentsApi.streamRun(
      agent,
      (raw) => {
        try {
          const event: AgentRunEvent = JSON.parse(raw)
          switch (event.type) {
            case 'tool_call':
              addLog('TOOL', `[${event.tool}] ← ${truncate(event.input)}`, agent)
              break
            case 'tool_result':
              addLog('RESULT', `[${event.tool}] → ${truncate(event.result)}`, agent)
              break
            case 'thinking':
              if (event.text) addLog('CLAUDE', event.text.trim(), agent)
              break
            case 'signal_created':
              signalsThisRun.push(event.signalType ?? '')
              addLog('SIGNAL', `Signal créé: ${event.signalType} (risk ${event.riskScore})`, agent)
              break
            case 'signal_updated':
              addLog('SIGNAL', `Signal mis à jour: ${event.signalId} → ${event.status}`, agent)
              break
            case 'done':
              addLog('DONE', `✓ Terminé en ${((event.durationMs ?? 0) / 1000).toFixed(1)}s`, agent)
              if (event.report) addLog('CLAUDE', `Rapport: ${event.report}`, agent)
              setHistory(prev => [
                {
                  id: genId(),
                  agent,
                  ts: new Date().toLocaleTimeString('fr-FR'),
                  durationMs: event.durationMs ?? Date.now() - runStart,
                  signalsCreated: [...signalsThisRun],
                  report: event.report ?? '',
                },
                ...prev.slice(0, 4),
              ])
              setRunningAgent(null)
              break
            case 'error':
              addLog('ERROR', `Erreur: ${event.message}`, agent)
              setRunningAgent(null)
              break
          }
        } catch {
          // ignore parse error
        }
      },
      () => {
        setRunningAgent(null)
      },
      (err) => {
        addLog('ERROR', `Stream error: ${err.message}`, agent)
        setRunningAgent(null)
      }
    )

    abortRef.current = ctrl
  }, [runningAgent, addLog])

  const handleStop = () => {
    abortRef.current?.abort()
    abortRef.current = null
    if (runningAgent) {
      addLog('ERROR', '⏹ Run interrompu par l\'admin', runningAgent)
      setRunningAgent(null)
    }
  }

  const clearLogs = () => setLogs([])

  const filteredLogs = activeFilter === 'all' ? logs : logs.filter(l => l.agent === activeFilter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: T.spacing[8], paddingBottom: T.spacing[10] }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: T.fontSizes.xl, fontWeight: T.fontWeights.bold, color: T.colors.textPrimary, margin: 0 }}>
          Managed Agents
        </h1>
        <p style={{ fontSize: T.fontSizes.sm, color: T.colors.textSecondary, margin: `${T.spacing[2]} 0 0` }}>
          Déclenchez un agent manuellement avec tool use natif Anthropic. Les logs s'affichent en temps réel.
        </p>
      </div>

      {/* Agent cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: T.spacing[4] }}>
        {(Object.entries(AGENT_META) as [AgentName, typeof AGENT_META[AgentName]][]).map(([key, meta]) => {
          const isRunning = runningAgent === key
          const isOtherRunning = runningAgent !== null && runningAgent !== key
          return (
            <div
              key={key}
              style={{
                background: T.colors.bgSurface,
                border: `${T.borders.thin} solid ${isRunning ? meta.color : T.colors.borderSubtle}`,
                borderRadius: T.radius.lg,
                padding: T.spacing[5],
                display: 'flex',
                flexDirection: 'column',
                gap: T.spacing[3],
                transition: T.transitions.base,
                boxShadow: isRunning ? `0 0 0 1px rgba(var(--brand-accent-rgb), 0.25)` : 'none',
              }}
            >
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: T.spacing[2] }}>
                    <span style={{ fontSize: T.fontSizes.md }}>{meta.icon}</span>
                    <span style={{ fontSize: T.fontSizes.md, fontWeight: T.fontWeights.semibold, color: T.colors.textPrimary }}>
                      {meta.label}
                    </span>
                  </div>
                  <p style={{ fontSize: T.fontSizes.xs, color: T.colors.textSecondary, margin: `${T.spacing[2]} 0 0`, lineHeight: T.lineHeight.relaxed }}>
                    {meta.desc}
                  </p>
                </div>
                {/* Status dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: T.spacing[2], flexShrink: 0 }}>
                  {isRunning ? (
                    <PulsingDot color={meta.color} />
                  ) : (
                    <span style={{ width: 8, height: 8, borderRadius: T.radius.full, background: T.colors.borderDefault, display: 'inline-block' }} />
                  )}
                  <span style={{ fontSize: T.fontSizes.xs, color: isRunning ? meta.color : T.colors.textGhost }}>
                    {isRunning ? 'En cours' : 'Idle'}
                  </span>
                </div>
              </div>

              {/* Run button */}
              <button
                onClick={() => isRunning ? handleStop() : handleRun(key)}
                disabled={isOtherRunning}
                style={{
                  padding: `${T.spacing[3]} ${T.spacing[4]}`,
                  borderRadius: T.radius.md,
                  border: `${T.borders.thin} solid ${isRunning ? T.colors.logError : meta.color}`,
                  background: isRunning ? `color-mix(in srgb, ${T.colors.danger} 10%, transparent)` : 'rgba(var(--brand-accent-rgb), 0.06)',
                  color: isRunning ? T.colors.logError : meta.color,
                  fontSize: T.fontSizes.sm,
                  fontWeight: T.fontWeights.semibold,
                  cursor: isOtherRunning ? 'not-allowed' : 'pointer',
                  opacity: isOtherRunning ? 0.4 : 1,
                  transition: T.transitions.base,
                  width: '100%',
                  fontFamily: T.fonts.sans,
                }}
              >
                {isRunning ? '⏹ Arrêter' : '▶ Run now'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Log terminal */}
      <div style={{
        background: T.colors.bgApp,
        border: `${T.borders.thin} solid ${T.colors.borderSubtle}`,
        borderRadius: T.radius.lg,
        overflow: 'hidden',
      }}>
        {/* Terminal toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${T.spacing[3]} ${T.spacing[4]}`,
          borderBottom: `${T.borders.thin} solid ${T.colors.borderSubtle}`,
          background: T.colors.bgSurface,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: T.spacing[3] }}>
            {/* macOS dots */}
            <div style={{ display: 'flex', gap: T.spacing[2] }}>
              {[T.colors.terminalRed, T.colors.terminalYellow, T.colors.terminalGreen].map(c => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: T.radius.full, background: c }} />
              ))}
            </div>
            <span style={{ fontSize: T.fontSizes.xs, color: T.colors.textGhost, fontFamily: MONO }}>
              agents/log-stream
            </span>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: T.spacing[1] }}>
            {(['all', 'watcher', 'strategy', 'audit'] as const).map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  padding: `${T.spacing.half} ${T.spacing[3]}`,
                  borderRadius: T.radius.sm,
                  border: 'none',
                  background: activeFilter === f ? T.colors.accent : 'transparent',
                  color: activeFilter === f ? T.colors.bgApp : T.colors.textGhost,
                  fontSize: T.fontSizes.xs,
                  cursor: 'pointer',
                  fontFamily: T.fonts.sans,
                  fontWeight: activeFilter === f ? T.fontWeights.semibold : T.fontWeights.regular,
                  transition: T.transitions.fast,
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={clearLogs}
            style={{
              background: 'transparent',
              border: 'none',
              color: T.colors.textGhost,
              fontSize: T.fontSizes.xs,
              cursor: 'pointer',
              padding: `${T.spacing.half} ${T.spacing[2]}`,
              fontFamily: T.fonts.sans,
            }}
          >
            clear
          </button>
        </div>

        {/* Log lines */}
        <div style={{
          height: 380,
          overflowY: 'auto',
          padding: `${T.spacing[3]} ${T.spacing[4]}`,
          display: 'flex',
          flexDirection: 'column',
          gap: T.spacing[1],
        }}>
          {filteredLogs.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: T.colors.textGhost,
              fontSize: T.fontSizes.xs,
              fontFamily: MONO,
              flexDirection: 'column',
              gap: T.spacing[2],
            }}>
              <span>$</span>
              <span>Cliquez sur "Run now" pour déclencher un agent</span>
            </div>
          ) : (
            filteredLogs.map(line => {
              const style = TAG_STYLES[line.tag]
              return (
                <div key={line.id} style={{ display: 'flex', gap: T.spacing[3], alignItems: 'flex-start' }}>
                  <span style={{ color: T.colors.textGhost, fontSize: T.fontSizes.micro, fontFamily: MONO, flexShrink: 0, paddingTop: 1, opacity: 0.7 }}>
                    {line.ts}
                  </span>
                  <span style={{
                    fontSize: T.fontSizes.nano,
                    fontFamily: MONO,
                    fontWeight: T.fontWeights.semibold,
                    padding: `1px ${T.spacing[2]}`,
                    borderRadius: T.radius.sm,
                    background: style.bg,
                    color: style.color,
                    flexShrink: 0,
                    letterSpacing: T.letterSpacing.loose,
                  }}>
                    {line.tag}
                  </span>
                  <span style={{
                    fontSize: T.fontSizes.xs,
                    fontFamily: MONO,
                    color: line.tag === 'ERROR' ? T.colors.logError : T.colors.textPrimary,
                    lineHeight: T.lineHeight.relaxed,
                    wordBreak: 'break-word',
                  }}>
                    {line.text}
                  </span>
                </div>
              )
            })
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Run history */}
      {history.length > 0 && (
        <div>
          <h2 style={{ fontSize: T.fontSizes.md, fontWeight: T.fontWeights.semibold, color: T.colors.textPrimary, margin: `0 0 ${T.spacing[3]}` }}>
            Historique des runs
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: T.spacing[2] }}>
            {history.map(run => (
              <div
                key={run.id}
                style={{
                  background: T.colors.bgSurface,
                  border: `${T.borders.thin} solid ${T.colors.borderSubtle}`,
                  borderRadius: T.radius.md,
                  padding: `${T.spacing[3]} ${T.spacing[4]}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: T.spacing[4],
                }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: T.spacing.half,
                  minWidth: 120,
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: T.fontSizes.xs, fontWeight: T.fontWeights.semibold, color: AGENT_META[run.agent].color }}>
                    {AGENT_META[run.agent].icon} {AGENT_META[run.agent].label}
                  </span>
                  <span style={{ fontSize: T.fontSizes.micro, color: T.colors.textGhost, fontFamily: MONO }}>{run.ts}</span>
                  <span style={{ fontSize: T.fontSizes.micro, color: T.colors.textSecondary }}>
                    {(run.durationMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {run.signalsCreated.length > 0 && (
                    <div style={{ display: 'flex', gap: T.spacing[2], marginBottom: T.spacing[2], flexWrap: 'wrap' }}>
                      {run.signalsCreated.map((s, i) => (
                        <span key={i} style={{
                          fontSize: T.fontSizes.nano,
                          padding: `${T.spacing.half} ${T.spacing[2]}`,
                          borderRadius: T.radius.sm,
                          background: `color-mix(in srgb, ${T.colors.logSignal} 15%, transparent)`,
                          color: T.colors.logSignal,
                          fontFamily: MONO,
                          fontWeight: T.fontWeights.semibold,
                        }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {run.report && (
                    <p style={{
                      fontSize: T.fontSizes.xs,
                      color: T.colors.textSecondary,
                      margin: 0,
                      lineHeight: T.lineHeight.relaxed,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {run.report}
                    </p>
                  )}
                  {run.signalsCreated.length === 0 && !run.report && (
                    <span style={{ fontSize: T.fontSizes.xs, color: T.colors.textGhost }}>Aucun signal créé — conditions non remplies</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Pulsing dot ──────────────────────────────────────────────────────────

function PulsingDot({ color }: { color: string }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        .ping-dot { animation: ping 1s cubic-bezier(0,0,0.2,1) infinite; }
      `}</style>
      <span className="ping-dot" style={{
        position: 'absolute', inset: 0, borderRadius: T.radius.full, background: color, opacity: 0.75,
      }} />
      <span style={{ borderRadius: T.radius.full, background: color, width: 8, height: 8, display: 'inline-block' }} />
    </span>
  )
}
