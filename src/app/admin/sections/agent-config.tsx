'use client'

import { useState, useEffect, useCallback } from 'react'
import { AgentsApi } from '@/lib/api-client'
import { ADMIN_TOKENS as T, MONO } from '../constants'

// ── Prompt presets ─────────────────────────────────────────────────────

const PROMPT_PRESETS: Record<string, Array<{ id: string; label: string; desc: string; value: string }>> = {
  watcher: [
    { id: 'default', label: 'Standard', desc: 'Observations factuelles, 2-3 phrases', value: '' },
    { id: 'verbose', label: 'Détaillé', desc: 'Analyse complète avec comparaisons historiques', value: 'Fournis une analyse plus détaillée (4-5 phrases). Compare avec les tendances récentes. Mentionne les corrélations inter-marchés (S&P500, DXY, gold) si pertinent.' },
    { id: 'alert', label: 'Mode alerte', desc: 'Focus sur les risques et anomalies uniquement', value: 'Concentre-toi UNIQUEMENT sur les anomalies et risques. Si tout est normal, dis-le en une phrase. Si tu détectes un risque, détaille-le.' },
    { id: 'fr', label: 'Rapport FR', desc: 'Format rapport investisseur en français', value: 'Rédige en français dans un style rapport investisseur institutionnel. Structure: [Marché] [Yields] [Sentiment]. Utilise des bullet points.' },
  ],
  strategy: [
    { id: 'default', label: 'Standard', desc: 'Conservateur, signaux justifiés', value: '' },
    { id: 'aggressive', label: 'Agressif', desc: 'Plus de signaux, seuils plus bas', value: 'Sois plus proactif dans tes propositions de signaux. Un spread de yield de 1.5% suffit pour un YIELD_ROTATE. Un F&G < 30 suffit pour INCREASE_BTC.' },
    { id: 'defensive', label: 'Défensif', desc: 'Uniquement les signaux critiques', value: 'Sois ULTRA conservateur. Ne propose un signal QUE si les conditions sont extrêmes (F&G < 10 ou > 90, yield spread > 5%, BTC > 2x entry). En cas de doute, ne propose RIEN.' },
    { id: 'btc-focus', label: 'Focus BTC', desc: 'Priorité aux signaux BTC (TP, increase)', value: 'Priorise les signaux liés au BTC (TAKE_PROFIT et INCREASE_BTC). Les YIELD_ROTATE sont secondaires. Sois attentif aux niveaux psychologiques du BTC (50k, 75k, 100k, 125k, 150k).' },
  ],
  audit: [
    { id: 'default', label: 'Standard', desc: 'Vérifications de base', value: '' },
    { id: 'strict', label: 'Strict', desc: 'Bloque tout signal > risk 40', value: 'Applique une politique stricte : tout signal avec un risk score > 40 doit être BLOQUÉ. Vérifie systématiquement le TVL des protocoles DeFi mentionnés. Exige une diversification minimale.' },
    { id: 'permissive', label: 'Permissif', desc: 'Laisse passer sauf risque critique', value: 'Sois plus permissif. Ne bloque que les signaux avec un risque CRITIQUE (depeg, crash, exploit). Ajoute des warnings mais ne bloque pas pour des risques modérés.' },
  ],
}

// ── Config presets ─────────────────────────────────────────────────────

const CONFIG_PRESETS: Array<{ id: string; label: string; icon: string; desc: string; values: Record<string, string> }> = [
  {
    id: 'conservative', label: 'Conservateur', icon: '🛡️', desc: 'Seuils larges, cooldowns longs, peu de signaux',
    values: { fear_greed_low: '15', fear_greed_high: '85', yield_drift_threshold: '3', allocation_drift_threshold: '7', max_btc_sell_pct: '15', signal_cooldown_hours: '{"TAKE_PROFIT":48,"YIELD_ROTATE":24,"REBALANCE":72,"INCREASE_BTC":48,"REDUCE_RISK":12}', strategy_prompt_extra: PROMPT_PRESETS.strategy.find(p => p.id === 'defensive')!.value },
  },
  {
    id: 'balanced', label: 'Équilibré', icon: '⚖️', desc: 'Réglages par défaut, bon compromis',
    values: { fear_greed_low: '20', fear_greed_high: '80', yield_drift_threshold: '2', allocation_drift_threshold: '5', max_btc_sell_pct: '20', signal_cooldown_hours: '{"TAKE_PROFIT":24,"YIELD_ROTATE":12,"REBALANCE":48,"INCREASE_BTC":24,"REDUCE_RISK":6}', strategy_prompt_extra: '' },
  },
  {
    id: 'aggressive', label: 'Agressif', icon: '🔥', desc: 'Seuils serrés, cooldowns courts, plus de signaux',
    values: { fear_greed_low: '25', fear_greed_high: '75', yield_drift_threshold: '1.5', allocation_drift_threshold: '3', max_btc_sell_pct: '25', signal_cooldown_hours: '{"TAKE_PROFIT":12,"YIELD_ROTATE":6,"REBALANCE":24,"INCREASE_BTC":12,"REDUCE_RISK":3}', strategy_prompt_extra: PROMPT_PRESETS.strategy.find(p => p.id === 'aggressive')!.value },
  },
]

// ── Helpers ─────────────────────────────────────────────────────────────

function msToLabel(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  if (ms < 3600000) return `${Math.round(ms / 60000)}min`
  return `${(ms / 3600000).toFixed(1)}h`
}

function parseCooldowns(raw: string): Record<string, number> {
  try { return JSON.parse(raw) } catch { return {} }
}

// ── Component ──────────────────────────────────────────────────────────

export function AgentConfigSection() {
  const [config, setConfig] = useState<Record<string, string>>({})
  const [defaults, setDefaults] = useState<Record<string, string>>({})
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'strategy' | 'thresholds' | 'timings' | 'prompts'>('strategy')

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true)
      const res = await AgentsApi.getConfig()
      setConfig(res.config)
      setDefaults(res.defaults)
      setDraft(res.config)
    } catch (e) {
      setError(`Erreur de chargement: ${e}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  const hasChanges = Object.keys(draft).some(k => draft[k] !== config[k])

  const set = (key: string, value: string) => setDraft(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    const changed: Record<string, string> = {}
    for (const [k, v] of Object.entries(draft)) {
      if (v !== config[k]) changed[k] = v
    }
    if (Object.keys(changed).length === 0) return
    try {
      setSaving(true); setError(null)
      const res = await AgentsApi.updateConfig(changed)
      setConfig(res.config); setDraft(res.config)
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e) { setError(`Erreur: ${e}`) }
    finally { setSaving(false) }
  }

  const applyPreset = (p: typeof CONFIG_PRESETS[0]) => {
    setDraft(prev => ({ ...prev, ...p.values }))
  }

  if (loading) return <div style={{ padding: T.spacing[4], color: T.colors.textSecondary }}>Chargement...</div>

  const cooldowns = parseCooldowns(draft.signal_cooldown_hours || '{}')
  const setCooldown = (type: string, hours: number) => {
    const cd = { ...cooldowns, [type]: hours }
    set('signal_cooldown_hours', JSON.stringify(cd))
  }

  const profitLevels: Array<{ mult: number; pct: number }> = (() => {
    try { return JSON.parse(draft.profit_levels || '[]') } catch { return [] }
  })()
  const setProfitLevel = (idx: number, field: 'mult' | 'pct', val: number) => {
    const next = [...profitLevels]; next[idx] = { ...next[idx], [field]: val }
    set('profit_levels', JSON.stringify(next))
  }
  const addProfitLevel = () => {
    const last = profitLevels[profitLevels.length - 1]
    set('profit_levels', JSON.stringify([...profitLevels, { mult: (last?.mult ?? 1.5) + 0.2, pct: 10 }]))
  }
  const removeProfitLevel = (idx: number) => {
    set('profit_levels', JSON.stringify(profitLevels.filter((_, i) => i !== idx)))
  }

  const btcEntry = parseFloat(draft.btc_entry_price || '95000')

  return (
    <div>
      {error && <div style={st.error}>{error}</div>}

      {/* Config presets */}
      <div style={st.presetBar}>
        <span style={st.presetLabel}>Profil rapide :</span>
        {CONFIG_PRESETS.map(p => (
          <button key={p.id} onClick={() => applyPreset(p)} style={st.presetBtn} title={p.desc}>
            <span>{p.icon}</span> {p.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={st.tabs}>
        {([
          { id: 'strategy' as const, label: 'Stratégie', icon: '📊' },
          { id: 'thresholds' as const, label: 'Seuils', icon: '🎯' },
          { id: 'timings' as const, label: 'Timings', icon: '⏱️' },
          { id: 'prompts' as const, label: 'Prompts IA', icon: '🧠' },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ ...st.tab, ...(activeTab === tab.id ? st.tabActive : {}) }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* STRATEGY TAB */}
      {activeTab === 'strategy' && (
        <div style={st.card}>
          <SliderField label="Prix d'entrée BTC" value={btcEntry} min={10000} max={200000} step={1000} unit="$" onChange={v => set('btc_entry_price', String(v))} mono />
          <SliderField label="Max vente BTC par signal" value={parseFloat(draft.max_btc_sell_pct || '20')} min={5} max={50} step={1} unit="%" onChange={v => set('max_btc_sell_pct', String(v))} color={T.colors.textGhost} />

          <div style={{ marginTop: T.spacing[4] }}>
            <div style={st.sectionHead}>
              <h4 style={st.sectionTitle}>Paliers de prise de profit</h4>
              <button onClick={addProfitLevel} style={st.addBtn}>+ Palier</button>
            </div>
            <div style={st.profitGrid}>
              {profitLevels.map((lv, i) => (
                <div key={i} style={st.profitCard}>
                  <div style={st.profitHeader}>
                    <span style={st.profitBadge}>#{i + 1}</span>
                    <button onClick={() => removeProfitLevel(i)} style={st.removeBtn}>x</button>
                  </div>
                  <div style={st.profitRow}>
                    <span style={st.profitLabel}>Prix cible</span>
                    <span style={{ ...st.profitValue, fontFamily: MONO }}>${Math.round(btcEntry * lv.mult).toLocaleString()}</span>
                  </div>
                  <SliderField label={`+${((lv.mult - 1) * 100).toFixed(0)}% vs entrée`} value={lv.mult} min={1.05} max={3.0} step={0.05} unit="x" onChange={v => setProfitLevel(i, 'mult', v)} compact />
                  <SliderField label="% de la poche BTC" value={lv.pct} min={5} max={50} step={5} unit="%" onChange={v => setProfitLevel(i, 'pct', v)} compact color={T.colors.accent} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* THRESHOLDS TAB */}
      {activeTab === 'thresholds' && (
        <div style={st.card}>
          <div style={st.fgContainer}>
            <h4 style={st.sectionTitle}>Fear & Greed Index</h4>
            <div style={st.fgBar}>
              <div style={{ ...st.fgZone, background: 'rgba(var(--color-error-rgb, 239,68,68), 0.18)', width: `${parseFloat(draft.fear_greed_low || '20')}%` }}>
                <span style={st.fgZoneLabel}>FEAR</span>
              </div>
              <div style={{ ...st.fgZone, background: 'rgba(var(--brand-accent-rgb), 0.06)', flex: 1 }}>
                <span style={st.fgZoneLabel}>NEUTRAL</span>
              </div>
              <div style={{ ...st.fgZone, background: 'rgba(var(--brand-accent-rgb), 0.18)', width: `${100 - parseFloat(draft.fear_greed_high || '80')}%` }}>
                <span style={st.fgZoneLabel}>GREED</span>
              </div>
            </div>
            <div style={st.fgSliders}>
              <SliderField label="Seuil Fear (INCREASE_BTC)" value={parseFloat(draft.fear_greed_low || '20')} min={5} max={40} step={1} onChange={v => set('fear_greed_low', String(v))} color={T.colors.danger} />
              <SliderField label="Seuil Greed (REDUCE_RISK)" value={parseFloat(draft.fear_greed_high || '80')} min={60} max={95} step={1} onChange={v => set('fear_greed_high', String(v))} color={T.colors.accent} />
            </div>
          </div>

          <div style={{ marginTop: T.spacing[4] }}>
            <SliderField label="Yield drift minimum (YIELD_ROTATE)" value={parseFloat(draft.yield_drift_threshold || '2')} min={0.5} max={10} step={0.5} unit="%" onChange={v => set('yield_drift_threshold', String(v))} />
            <SliderField label="Allocation drift (REBALANCE)" value={parseFloat(draft.allocation_drift_threshold || '5')} min={1} max={15} step={1} unit="%" onChange={v => set('allocation_drift_threshold', String(v))} />
          </div>
        </div>
      )}

      {/* TIMINGS TAB */}
      {activeTab === 'timings' && (
        <div style={st.card}>
          <h4 style={st.sectionTitle}>Fréquence des agents</h4>
          <div style={st.timingGrid}>
            {[
              { key: 'watcher_interval_ms', label: 'Watcher', desc: 'Collecte prix + yields', color: T.colors.agentWatcher },
              { key: 'strategy_interval_ms', label: 'Strategy', desc: 'Évaluation signaux', color: T.colors.agentStrategy },
              { key: 'audit_interval_ms', label: 'Audit', desc: 'Vérification risques', color: T.colors.agentAudit },
            ].map(agent => {
              const ms = parseInt(draft[agent.key] || '60000', 10)
              return (
                <div key={agent.key} style={st.timingCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: T.spacing[2], marginBottom: T.spacing[2] }}>
                    <div style={{ ...st.timingDot, background: agent.color }} />
                    <span style={st.timingLabel}>{agent.label}</span>
                    <span style={{ ...st.timingValue, fontFamily: MONO }}>{msToLabel(ms)}</span>
                  </div>
                  <p style={st.timingDesc}>{agent.desc}</p>
                  <input type="range" min={10000} max={1800000} step={10000} value={ms} onChange={e => set(agent.key, e.target.value)} style={st.slider} />
                  <div style={st.sliderLabels}><span>10s</span><span>30min</span></div>
                </div>
              )
            })}
          </div>

          <h4 style={{ ...st.sectionTitle, marginTop: T.spacing[4] }}>Cooldowns par signal</h4>
          <p style={st.help}>Temps minimum entre deux signaux du même type</p>
          <div style={st.cooldownGrid}>
            {['TAKE_PROFIT', 'YIELD_ROTATE', 'REBALANCE', 'INCREASE_BTC', 'REDUCE_RISK'].map(type => {
              const hours = cooldowns[type] ?? 24
              const colors: Record<string, string> = {
                TAKE_PROFIT: T.colors.signalTakeProfit,
                YIELD_ROTATE: T.colors.signalYieldRotate,
                REBALANCE: T.colors.signalRebalance,
                INCREASE_BTC: T.colors.signalIncreaseBtc,
                REDUCE_RISK: T.colors.signalReduceRisk,
              }
              return (
                <div key={type} style={st.cooldownCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: T.spacing[2], marginBottom: T.spacing[1] }}>
                    <div style={{ width: 10, height: 10, borderRadius: T.radius.sm, background: colors[type] }} />
                    <span style={st.cooldownLabel}>{type.replace(/_/g, ' ')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: T.spacing[2] }}>
                    <input type="range" min={1} max={72} step={1} value={hours} onChange={e => setCooldown(type, +e.target.value)} style={{ ...st.slider, flex: 1 }} />
                    <span style={{ ...st.cooldownValue, fontFamily: MONO }}>{hours}h</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* PROMPTS TAB */}
      {activeTab === 'prompts' && (
        <div>
          {(['watcher', 'strategy', 'audit'] as const).map(agent => {
            const key = `${agent}_prompt_extra`
            const presets = PROMPT_PRESETS[agent]
            const currentPreset = presets.find(p => p.value === (draft[key] || ''))
            const agentColors: Record<string, string> = {
              watcher: T.colors.agentWatcher,
              strategy: T.colors.agentStrategy,
              audit: T.colors.agentAudit,
            }
            const agentNames: Record<string, string> = { watcher: 'Watcher', strategy: 'Strategy', audit: 'Audit' }
            return (
              <div key={agent} style={st.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: T.spacing[3], marginBottom: T.spacing[3] }}>
                  <div style={{ width: 12, height: 12, borderRadius: T.radius.sm, background: agentColors[agent] }} />
                  <h4 style={{ ...st.sectionTitle, margin: 0 }}>{agentNames[agent]}</h4>
                  {currentPreset && <span style={{ ...st.presetActiveBadge, borderColor: agentColors[agent], color: agentColors[agent] }}>{currentPreset.label}</span>}
                </div>

                <div style={st.promptPresetRow}>
                  {presets.map(p => (
                    <button key={p.id} onClick={() => set(key, p.value)} style={{ ...st.promptPresetBtn, ...(draft[key] === p.value ? { borderColor: agentColors[agent], color: agentColors[agent], background: `${agentColors[agent]}15` } : {}) }}>
                      <strong>{p.label}</strong>
                      <span style={st.promptPresetDesc}>{p.desc}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  value={draft[key] || ''}
                  onChange={e => set(key, e.target.value)}
                  rows={4}
                  style={st.textarea}
                  placeholder="Aucune instruction additionnelle — le prompt système par défaut s'applique"
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Save bar */}
      <div style={{ ...st.saveBar, opacity: hasChanges ? 1 : 0 }}>
        <div style={st.saveBarInner}>
          <span style={{ color: T.colors.textSecondary, fontSize: T.fontSizes.sm, fontWeight: T.fontWeights.bold }}>
            Modifications non sauvegardées
          </span>
          <div style={{ display: 'flex', gap: T.spacing[2] }}>
            <button onClick={() => setDraft(config)} style={st.cancelBtn}>Annuler</button>
            <button onClick={handleSave} disabled={saving} style={st.saveBtn}>
              {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Slider field ───────────────────────────────────────────────────────

function SliderField({ label, value, min, max, step, unit, onChange, color, compact, mono }: {
  label: string; value: number; min: number; max: number; step: number
  unit?: string; onChange: (v: number) => void; color?: string; compact?: boolean; mono?: boolean
}) {
  return (
    <div style={{ marginBottom: compact ? T.spacing[1] : T.spacing[3] }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
        <span style={{ fontSize: compact ? T.fontSizes.micro : T.fontSizes.sm, color: T.colors.textSecondary }}>{label}</span>
        <span style={{ fontSize: compact ? T.fontSizes.sm : T.fontSizes.md, fontWeight: T.fontWeights.bold, color: color || T.colors.accent, fontFamily: mono ? MONO : 'inherit' }}>
          {unit === '$' ? `$${value.toLocaleString()}` : `${value}${unit || ''}`}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} style={st.slider} />
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────

const st: Record<string, React.CSSProperties> = {
  error: { background: 'rgba(var(--color-error-rgb, 239,68,68), 0.08)', border: `${T.borders.thin} solid rgba(var(--color-error-rgb, 239,68,68), 0.25)`, borderRadius: T.radius.md, padding: T.spacing[3], color: T.colors.danger, fontSize: T.fontSizes.sm, marginBottom: T.spacing[3] },
  presetBar: { display: 'flex', alignItems: 'center', gap: T.spacing[2], marginBottom: T.spacing[3], padding: `${T.spacing[2]} ${T.spacing[3]}`, background: T.colors.bgSurface, border: `${T.borders.thin} solid ${T.colors.borderSubtle}`, borderRadius: T.radius.lg, flexWrap: 'wrap' },
  presetLabel: { fontSize: T.fontSizes.sm, color: T.colors.textSecondary, fontWeight: T.fontWeights.bold, marginRight: T.spacing[1] },
  presetBtn: { padding: `${T.spacing[2]} ${T.spacing[3]}`, borderRadius: T.radius.md, fontSize: T.fontSizes.sm, fontWeight: T.fontWeights.bold, cursor: 'pointer', border: `${T.borders.thin} solid ${T.colors.borderSubtle}`, background: T.colors.bgTertiary, color: T.colors.textPrimary, display: 'flex', alignItems: 'center', gap: T.spacing[2], transition: T.transitions.all },
  tabs: { display: 'flex', gap: T.spacing[1], marginBottom: T.spacing[3], background: T.colors.bgSurface, borderRadius: T.radius.lg, padding: T.spacing[1], border: `${T.borders.thin} solid ${T.colors.borderSubtle}` },
  tab: { flex: 1, padding: `${T.spacing[2]} ${T.spacing[3]}`, borderRadius: T.radius.md, fontSize: T.fontSizes.sm, fontWeight: T.fontWeights.bold, cursor: 'pointer', border: 'none', background: 'transparent', color: T.colors.textSecondary, transition: T.transitions.all, textAlign: 'center' as const },
  tabActive: { background: T.colors.bgTertiary, color: T.colors.accent, boxShadow: `0 0 0 1px ${T.colors.borderSubtle}` },
  card: { background: T.colors.bgSurface, border: `${T.borders.thin} solid ${T.colors.borderSubtle}`, borderRadius: T.radius.lg, padding: T.spacing[4], marginBottom: T.spacing[3] },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: T.spacing[3] },
  sectionTitle: { fontSize: T.fontSizes.md, fontWeight: T.fontWeights.bold, color: T.colors.textPrimary, margin: `0 0 ${T.spacing[2]}` },
  help: { fontSize: T.fontSizes.micro, color: T.colors.textSecondary, marginBottom: T.spacing[2] },
  slider: { width: '100%', WebkitAppearance: 'none' as 'none', height: 6, background: T.colors.bgTertiary, borderRadius: T.radius.sm, border: 'none', cursor: 'pointer' },
  sliderLabels: { display: 'flex', justifyContent: 'space-between', fontSize: T.fontSizes.micro, color: T.colors.textGhost, marginTop: T.spacing.half },
  // Profit levels
  profitGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: T.spacing[2] },
  profitCard: { background: T.colors.bgTertiary, borderRadius: T.radius.md, padding: T.spacing[3], border: `${T.borders.thin} solid ${T.colors.borderSubtle}` },
  profitHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: T.spacing[2] },
  profitBadge: { fontSize: T.fontSizes.micro, color: T.colors.accent, background: T.colors.accentSubtle, padding: `${T.spacing.half} ${T.spacing[2]}`, borderRadius: T.radius.sm, fontWeight: T.fontWeights.bold },
  profitRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: T.spacing[2] },
  profitLabel: { fontSize: T.fontSizes.micro, color: T.colors.textSecondary },
  profitValue: { fontSize: T.fontSizes.md, fontWeight: T.fontWeights.bold, color: T.colors.textPrimary },
  removeBtn: { width: 20, height: 20, borderRadius: T.radius.sm, border: `${T.borders.thin} solid ${T.colors.borderSubtle}`, background: 'transparent', color: T.colors.textGhost, cursor: 'pointer', fontSize: T.fontSizes.micro, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  addBtn: { padding: `${T.spacing[1]} ${T.spacing[3]}`, borderRadius: T.radius.sm, fontSize: T.fontSizes.sm, fontWeight: T.fontWeights.bold, cursor: 'pointer', border: `${T.borders.thin} dashed ${T.colors.borderSubtle}`, background: 'transparent', color: T.colors.accent },
  // F&G
  fgContainer: { marginBottom: T.spacing[3] },
  fgBar: { display: 'flex', height: 32, borderRadius: T.radius.md, overflow: 'hidden', marginBottom: T.spacing[3], border: `${T.borders.thin} solid ${T.colors.borderSubtle}` },
  fgZone: { display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 40 },
  fgZoneLabel: { fontSize: T.fontSizes.micro, fontWeight: T.fontWeights.bold, letterSpacing: T.letterSpacing.micro, opacity: 0.7 },
  fgSliders: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: T.spacing[3] },
  // Timings
  timingGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: T.spacing[2] },
  timingCard: { background: T.colors.bgTertiary, borderRadius: T.radius.md, padding: T.spacing[3] },
  timingDot: { width: 10, height: 10, borderRadius: T.radius.sm },
  timingLabel: { fontSize: T.fontSizes.sm, fontWeight: T.fontWeights.bold, color: T.colors.textPrimary },
  timingValue: { fontSize: T.fontSizes.sm, color: T.colors.accent, marginLeft: 'auto' },
  timingDesc: { fontSize: T.fontSizes.micro, color: T.colors.textSecondary, marginBottom: T.spacing[2] },
  // Cooldowns
  cooldownGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: T.spacing[2] },
  cooldownCard: { background: T.colors.bgTertiary, borderRadius: T.radius.md, padding: T.spacing[2] },
  cooldownLabel: { fontSize: T.fontSizes.micro, fontWeight: T.fontWeights.bold, color: T.colors.textPrimary, textTransform: 'uppercase' as const, letterSpacing: T.letterSpacing.loose },
  cooldownValue: { fontSize: T.fontSizes.sm, fontWeight: T.fontWeights.bold, color: T.colors.accent, minWidth: 32, textAlign: 'right' as const },
  // Prompts
  promptPresetRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: T.spacing[2], marginBottom: T.spacing[3] },
  promptPresetBtn: { padding: T.spacing[2], borderRadius: T.radius.md, cursor: 'pointer', border: `${T.borders.thin} solid ${T.colors.borderSubtle}`, background: T.colors.bgTertiary, color: T.colors.textPrimary, textAlign: 'left' as const, display: 'flex', flexDirection: 'column' as const, gap: T.spacing.half, transition: T.transitions.all, fontSize: T.fontSizes.sm },
  promptPresetDesc: { fontSize: T.fontSizes.micro, color: T.colors.textSecondary, fontWeight: T.fontWeights.regular },
  presetActiveBadge: { fontSize: T.fontSizes.micro, padding: `${T.spacing.half} ${T.spacing[2]}`, borderRadius: T.radius.full, border: `${T.borders.thin} solid`, fontWeight: T.fontWeights.bold },
  textarea: { width: '100%', background: T.colors.bgTertiary, border: `${T.borders.thin} solid ${T.colors.borderSubtle}`, borderRadius: T.radius.md, padding: `${T.spacing[3]} ${T.spacing[4]}`, color: T.colors.textPrimary, fontSize: T.fontSizes.sm, resize: 'vertical' as const, minHeight: 80, fontFamily: 'inherit', lineHeight: T.lineHeights.relaxed },
  // Save bar
  saveBar: { position: 'fixed' as const, bottom: 0, left: 0, right: 0, zIndex: T.zIndex.dock, transition: `opacity ${T.transitions.base}`, pointerEvents: 'auto' as const },
  saveBarInner: { maxWidth: 900, margin: '0 auto', padding: `${T.spacing[3]} ${T.spacing[4]}`, background: T.colors.bgSurface, borderTop: `${T.borders.thin} solid ${T.colors.borderSubtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  saveBtn: { padding: `${T.spacing[2]} ${T.spacing[4]}`, borderRadius: T.radius.md, fontSize: T.fontSizes.sm, fontWeight: T.fontWeights.bold, cursor: 'pointer', border: 'none', background: T.colors.accent, color: 'var(--color-on-accent)' },
  cancelBtn: { padding: `${T.spacing[2]} ${T.spacing[4]}`, borderRadius: T.radius.md, fontSize: T.fontSizes.sm, fontWeight: T.fontWeights.bold, cursor: 'pointer', border: `${T.borders.thin} solid ${T.colors.borderSubtle}`, background: 'transparent', color: T.colors.textSecondary },
}
