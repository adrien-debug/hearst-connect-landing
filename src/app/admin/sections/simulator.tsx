'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { ADMIN_TOKENS as T, MONO } from '../constants'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

// ── Types ──────────────────────────────────────────────────────────────

interface LiveData {
  btcPrice: number; btc24h: number; usdcApy: number; usdtApy: number
  btcApy: number; miningNet: number; fearGreed: number; fearLabel: string
}

interface ProfitLevel { price: number; pct: number; dest: string }

interface PocketResult {
  capital: number; btcCap: number; mCap: number; sCap: number; rCap: number
  btcTotal: number; mTotal: number; sTotal: number; rTotal: number
  btcPnl: number; mPnl: number; sPnl: number; rPnl: number
  net: number; pnl: number; ret: number; ann: number; totalFees: number
  btcSecured: number; btcHeld: number; btcExpo: number
  profitLog: Array<{ price: number; sold: number; revenue: number; dest: string; pctSold: number }>
  btcContrib: number; mContrib: number; sContrib: number; rContrib: number
}

type Scenario = 'bear' | 'base' | 'bull'

// ── Presets ─────────────────────────────────────────────────────────────

const PRESETS: Record<string, { alloc: number[]; profits: ProfitLevel[] }> = {
  conservative: { alloc: [10, 25, 45, 20], profits: [{ price: 1.15, pct: 30, dest: 'usdc' }, { price: 1.30, pct: 30, dest: 'usdc' }, { price: 1.50, pct: 30, dest: 'reserve' }] },
  balanced: { alloc: [30, 30, 30, 10], profits: [{ price: 1.15, pct: 15, dest: 'usdc' }, { price: 1.35, pct: 20, dest: 'usdc' }, { price: 1.55, pct: 20, dest: 'reserve' }, { price: 1.80, pct: 20, dest: 'usdc' }] },
  growth: { alloc: [35, 30, 25, 10], profits: [{ price: 1.20, pct: 15, dest: 'usdc' }, { price: 1.40, pct: 20, dest: 'usdc' }, { price: 1.60, pct: 15, dest: 'reserve' }, { price: 1.90, pct: 20, dest: 'usdc' }] },
  aggressive: { alloc: [50, 20, 20, 10], profits: [{ price: 1.25, pct: 10, dest: 'usdc' }, { price: 1.50, pct: 15, dest: 'usdc' }, { price: 1.80, pct: 15, dest: 'reserve' }, { price: 2.10, pct: 20, dest: 'usdc' }] },
  barbell: { alloc: [20, 0, 60, 20], profits: [{ price: 1.25, pct: 20, dest: 'usdc' }, { price: 1.55, pct: 20, dest: 'usdc' }, { price: 1.90, pct: 20, dest: 'reserve' }, { price: 2.10, pct: 20, dest: 'usdc' }] },
}

// Colors pulled from dashboard-vars.css asset tokens
const POCKET_COLORS = ['#F7931A', '#4ADE80', '#3B82F6', '#A78BFA']
const POCKET_NAMES = ['BTC Spot', 'Mining', 'Stablecoins', 'Réserve']

// Chart.js static colors (CSS variables don't work in Chart.js context)
const CHART_TEXT_SECONDARY = '#7A808A'
const CHART_GRID_COLOR = 'rgba(255,255,255,.05)'
const CHART_SUCCESS_BG = 'rgba(167,251,144,.55)'
const CHART_DANGER_BG = 'rgba(239,68,68,.55)'
const CHART_FONT_SIZE_SMALL = 9
const CHART_FONT_SIZE_MEDIUM = 10
const CHART_BORDER_RADIUS = 4

// Layout dimensions
const SIDEBAR_WIDTH = '340px'
const CHART_HEIGHT = '220px'
const KPI_MIN_WIDTH = '150px'

// ── Simulation engine ──────────────────────────────────────────────────

function getYields(live: LiveData, scenario: Scenario) {
  const mult = { bear: 0.5, base: 1, bull: 1.5 }[scenario]
  const stableY = (live.usdcApy + live.usdtApy) / 2
  return {
    miningNet: Math.round(live.miningNet * mult * 10) / 10,
    stableYield: Math.round(stableY * (0.6 + mult * 0.4) * 10) / 10,
    btcYield: Math.round(live.btcApy * mult * 10) / 10,
    btcExit: Math.round(live.btcPrice * { bear: 0.7, base: 1.5, bull: 2.1 }[scenario]),
  }
}

function calcPocket(p: {
  capital: number; months: number; btcEntry: number; btcExit: number
  alloc: number[]; miningNet: number; stableYield: number; btcYield: number
  fees: number; profitLvls: ProfitLevel[]
}): PocketResult {
  const years = p.months / 12
  const btcCap = p.capital * p.alloc[0] / 100
  const btcAmt = btcCap / p.btcEntry
  let btcRem = btcAmt, btcSecured = 0
  const profitLog: PocketResult['profitLog'] = []
  const levels = [...p.profitLvls].sort((a, b) => a.price - b.price)

  for (const lv of levels) {
    const absPrice = p.btcEntry * lv.price
    if (p.btcExit >= absPrice && btcRem > 0) {
      const sold = btcAmt * (lv.pct / 100)
      const actual = Math.min(sold, btcRem)
      btcSecured += actual * absPrice
      btcRem -= actual
      profitLog.push({ price: absPrice, sold: actual, revenue: actual * absPrice, dest: lv.dest, pctSold: lv.pct })
    }
  }

  const btcHeld = btcRem * p.btcExit
  const btcYieldVal = btcHeld * (p.btcYield / 100) * years
  const btcTotal = btcHeld + btcSecured + btcYieldVal
  const btcPnl = btcTotal - btcCap

  const mCap = p.capital * p.alloc[1] / 100
  const mTotal = mCap * Math.pow(1 + p.miningNet / 100, years)
  const mPnl = mTotal - mCap

  const sCap = p.capital * p.alloc[2] / 100
  const sTotal = sCap * Math.pow(1 + p.stableYield / 100 / 12, p.months)
  const sPnl = sTotal - sCap

  const rCap = p.capital * p.alloc[3] / 100
  const rTotal = rCap * (1 + 3 / 100 * years)
  const rPnl = rTotal - rCap

  const gross = btcTotal + mTotal + sTotal + rTotal
  const totalFees = p.capital * (p.fees / 100) * years
  const net = gross - totalFees
  const pnl = net - p.capital
  const ret = pnl / p.capital * 100
  const ann = (Math.pow(net / p.capital, 1 / years) - 1) * 100

  return {
    capital: p.capital, btcCap, mCap, sCap, rCap,
    btcTotal, mTotal, sTotal, rTotal,
    btcPnl, mPnl, sPnl, rPnl,
    net, pnl, ret, ann, totalFees,
    btcSecured, btcHeld, btcExpo: btcHeld / net * 100,
    profitLog,
    btcContrib: btcPnl / (pnl || 1) * 100,
    mContrib: mPnl / (pnl || 1) * 100,
    sContrib: sPnl / (pnl || 1) * 100,
    rContrib: rPnl / (pnl || 1) * 100,
  }
}

// ── Formatting ─────────────────────────────────────────────────────────

const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
const fmtU = (n: number) => '$' + fmt(n)
const cc = (v: number) => (v >= 0 ? T.colors.success : T.colors.danger)

// ── Component ──────────────────────────────────────────────────────────

export function SimulatorSection() {
  const [live, setLive] = useState<LiveData>({ btcPrice: 95000, btc24h: 0, usdcApy: 5, usdtApy: 5, btcApy: 1, miningNet: 10, fearGreed: 50, fearLabel: 'Neutral' })
  const [capital, setCapital] = useState(100000)
  const [duration, setDuration] = useState(36)
  const [fees, setFees] = useState(2)
  const [alloc, setAlloc] = useState([30, 30, 30, 10])
  const [preset, setPreset] = useState('balanced')
  const [profitLevels, setProfitLevels] = useState<ProfitLevel[]>(PRESETS.balanced.profits.map(p => ({ ...p })))
  const [activeTab, setActiveTab] = useState<Scenario>('base')
  const [miningOverride, setMiningOverride] = useState<string>('')
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null)

  // Fetch live data
  const fetchLive = useCallback(async () => {
    try {
      const [btcRes, yieldsRes, fgRes] = await Promise.allSettled([
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true').then(r => r.json()),
        fetch('https://yields.llama.fi/pools').then(r => r.json()),
        fetch('https://api.alternative.me/fng/?limit=1').then(r => r.json()),
      ])

      setLive(prev => {
        const next = { ...prev }
        if (btcRes.status === 'fulfilled') {
          next.btcPrice = btcRes.value.bitcoin.usd
          next.btc24h = btcRes.value.bitcoin.usd_24h_change ?? 0
        }
        if (yieldsRes.status === 'fulfilled') {
          const pools = yieldsRes.value.data || []
          const find = (sym: string, proj: string) => pools.find((p: { symbol: string; project: string; chain: string; apy: number }) => p.symbol === sym && p.project === proj && p.chain === 'Ethereum')
          const usdc = find('USDC', 'aave-v3')
          const usdt = find('USDT', 'aave-v3')
          const wbtc = find('WBTC', 'aave-v3')
          if (usdc) next.usdcApy = usdc.apy
          if (usdt) next.usdtApy = usdt.apy
          if (wbtc) next.btcApy = wbtc.apy
        }
        if (fgRes.status === 'fulfilled') {
          const fg = fgRes.value.data?.[0]
          if (fg) { next.fearGreed = +fg.value; next.fearLabel = fg.value_classification }
        }
        next.miningNet = Math.round(10 * (next.btcPrice / 95000) * 10) / 10
        return next
      })
    } catch {}
  }, [])

  useEffect(() => {
    fetchLive()
    intervalRef.current = setInterval(fetchLive, 60000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchLive])

  // Rebalance alloc
  const setAllocSlider = (idx: number, val: number) => {
    setAlloc(prev => {
      const next = [...prev]
      next[idx] = val
      const others = [0, 1, 2, 3].filter(i => i !== idx)
      const othersSum = others.reduce((s, i) => s + prev[i], 0)
      const remaining = 100 - val
      if (othersSum === 0) {
        const each = Math.floor(remaining / others.length)
        let leftover = remaining - each * others.length
        others.forEach(i => { next[i] = each + (leftover-- > 0 ? 1 : 0) })
      } else {
        let distributed = 0
        others.forEach((i, oi) => {
          if (oi === others.length - 1) { next[i] = remaining - distributed }
          else { const share = Math.round((prev[i] / othersSum) * remaining); next[i] = share; distributed += share }
        })
      }
      return next.map(v => Math.max(0, Math.min(100, v)))
    })
  }

  const applyPreset = (id: string) => {
    const p = PRESETS[id]; if (!p) return
    setPreset(id)
    setAlloc(p.alloc)
    setProfitLevels(p.profits.map(r => ({ ...r })))
  }

  // Compute
  const effectiveMining = miningOverride ? parseFloat(miningOverride) : live.miningNet
  const liveWithOverride = { ...live, miningNet: effectiveMining }

  const results: Record<Scenario, PocketResult> = {} as Record<Scenario, PocketResult>
  for (const s of ['bear', 'base', 'bull'] as Scenario[]) {
    const y = getYields(liveWithOverride, s)
    results[s] = calcPocket({ capital, months: duration, btcEntry: live.btcPrice, btcExit: y.btcExit, alloc, miningNet: y.miningNet, stableYield: y.stableYield, btcYield: y.btcYield, fees, profitLvls: profitLevels })
  }

  const r = results[activeTab]
  const y = getYields(liveWithOverride, activeTab)

  // Sensitivity
  const mults = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.5, 3.0]
  const baseY = getYields(liveWithOverride, 'base')
  const sensPrices = mults.map(m => Math.round(live.btcPrice * m))
  const sensPerf = sensPrices.map(p => calcPocket({ capital, months: duration, btcEntry: live.btcPrice, btcExit: p, alloc, miningNet: baseY.miningNet, stableYield: baseY.stableYield, btcYield: baseY.btcYield, fees, profitLvls: profitLevels }).ret)

  // Chart options
  const doughnutOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const, labels: { color: CHART_TEXT_SECONDARY, font: { size: CHART_FONT_SIZE_MEDIUM } } } } }

  const fgHue = live.fearGreed * 1.2

  return (
    <div>
      <style>{`@keyframes simPulse{0%,100%{opacity:1}50%{opacity:.3}}.sim-live-dot{animation:simPulse 2s infinite}`}</style>
      {/* Live bar */}
      <div style={s.liveBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: T.spacing[1] }}>
          <div className="sim-live-dot" style={s.liveDot} /><span style={{ fontSize: T.fontSizes.xs, color: T.colors.success, fontWeight: T.fontWeights.bold }}>LIVE</span>
        </div>
        <LiveItem label="BTC/USD" value={fmtU(live.btcPrice)} />
        <LiveItem label="24h" value={fmtPct(live.btc24h)} color={cc(live.btc24h)} />
        <LiveItem label="USDC (Aave)" value={`${live.usdcApy.toFixed(2)}%`} color={T.colors.success} />
        <LiveItem label="USDT (Aave)" value={`${live.usdtApy.toFixed(2)}%`} color={T.colors.success} />
        <div>
          <span style={s.ll}>Fear & Greed</span>
          <span style={{ ...s.lv, color: live.fearGreed < 30 ? T.colors.danger : live.fearGreed > 70 ? T.colors.success : T.colors.warning }}>{live.fearGreed} — {live.fearLabel}</span>
          <div style={s.fgBar}><div style={{ height: '100%', width: `${live.fearGreed}%`, borderRadius: T.radius.full, background: `hsl(${fgHue},70%,50%)`, transition: `width ${T.transitions.slow}` }} /></div>
        </div>
        <LiveItem label="Mining" value={`${effectiveMining.toFixed(1)}%/yr`} color={T.colors.success} />
      </div>

      <div style={s.layout}>
        {/* LEFT INPUTS */}
        <div>
          <Card title="Investissement">
            <Field label="Capital ($)" value={capital} onChange={v => setCapital(+v)} type="number" min={1000} step={1000} />
            <Field label="Durée (mois)" value={duration} onChange={v => setDuration(+v)} type="number" min={1} max={120} />
            <Field label="Frais annuels (%)" value={fees} onChange={v => setFees(+v)} type="number" min={0} max={10} step={0.1} />
          </Card>

          <Card title="Profil">
            <div style={s.presetRow}>
              {Object.keys(PRESETS).map(id => (
                <button key={id} onClick={() => applyPreset(id)} style={{ ...s.presetBtn, ...(preset === id ? s.presetActive : {}) }}>{id === 'conservative' ? 'Conservateur' : id === 'balanced' ? 'Équilibré' : id === 'growth' ? 'Growth' : id === 'aggressive' ? 'Agressif' : 'Barbell'}</button>
              ))}
            </div>
            {['BTC Spot', 'Mining', 'Stablecoins', 'Réserve'].map((name, i) => (
              <div key={i} style={s.field}>
                <label style={s.label}>{name}</label>
                <div style={s.rangeRow}>
                  <input type="range" min={0} max={100} value={alloc[i]} onChange={e => setAllocSlider(i, +e.target.value)} style={s.range} />
                  <span style={s.rangeVal}>{alloc[i]}%</span>
                </div>
              </div>
            ))}
            <div style={s.allocBar}>{alloc.map((v, i) => <div key={i} style={{ width: `${v}%`, height: '100%', background: POCKET_COLORS[i], transition: `width ${T.transitions.slow}` }} />)}</div>
            <div style={s.allocLegend}>{POCKET_NAMES.map((n, i) => <span key={i} style={s.legendItem}><span style={{ ...s.dot, background: POCKET_COLORS[i] }} />{n}</span>)}</div>
          </Card>

          <Card title="Yields live">
            <div style={s.yieldGrid}>
              <YieldCard label="Mining net/an" value={`${effectiveMining.toFixed(1)}%`} sub="Hashprice-based" />
              <YieldCard label="USDC DeFi" value={`${live.usdcApy.toFixed(2)}%`} sub="Aave v3" />
              <YieldCard label="USDT DeFi" value={`${live.usdtApy.toFixed(2)}%`} sub="Aave v3" />
              <YieldCard label="BTC yield" value={`${live.btcApy.toFixed(2)}%`} sub="Lending" />
            </div>
            <Field label="Override mining yield (%)" value={miningOverride} onChange={setMiningOverride} type="number" placeholder="Auto" />
          </Card>

          <Card title="Prise de profit BTC">
            <table style={s.profitTable}>
              <thead><tr><th style={s.profitTh}>Prix $</th><th style={s.profitTh}>% vendu</th><th style={s.profitTh}>Dest.</th><th style={s.profitTh}></th></tr></thead>
              <tbody>
                {profitLevels.map((lv, i) => (
                  <tr key={i}>
                    <td style={s.profitTd}><input type="number" value={Math.round(live.btcPrice * lv.price)} step={5000} onChange={e => { const next = [...profitLevels]; next[i] = { ...lv, price: +e.target.value / live.btcPrice }; setProfitLevels(next) }} style={s.profitInput} /></td>
                    <td style={s.profitTd}><input type="number" value={lv.pct} min={0} max={100} onChange={e => { const next = [...profitLevels]; next[i] = { ...lv, pct: +e.target.value }; setProfitLevels(next) }} style={s.profitInput} />%</td>
                    <td style={s.profitTd}><select value={lv.dest} onChange={e => { const next = [...profitLevels]; next[i] = { ...lv, dest: e.target.value }; setProfitLevels(next) }} style={s.profitSelect}><option value="usdc">USDC</option><option value="reserve">Réserve</option><option value="mining">Mining</option></select></td>
                    <td style={s.profitTd}><button onClick={() => setProfitLevels(prev => prev.filter((_, j) => j !== i))} style={s.btnSm}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setProfitLevels(prev => [...prev, { price: (prev[prev.length - 1]?.price ?? 1.5) + 0.2, pct: 10, dest: 'usdc' }])} style={{ ...s.btnSm, marginTop: T.spacing[2] }}>+ Palier</button>
          </Card>
        </div>

        {/* RIGHT OUTPUTS */}
        <div>
          {/* Tabs */}
          <div style={s.tabs}>
            {(['bear', 'base', 'bull'] as Scenario[]).map(sc => (
              <button key={sc} onClick={() => setActiveTab(sc)} style={{
                ...s.tab,
                ...(activeTab === sc ? {
                  borderColor: sc === 'bear' ? T.colors.danger : sc === 'bull' ? T.colors.success : T.colors.accent,
                  color: sc === 'bear' ? T.colors.danger : sc === 'bull' ? T.colors.success : T.colors.accent,
                  background: sc === 'bear' ? `${T.colors.danger}18` : sc === 'bull' ? `${T.colors.success}18` : `${T.colors.accent}18`,
                } : {}),
              }}>{sc === 'bear' ? 'Bear' : sc === 'base' ? 'Base' : 'Bull'}</button>
            ))}
          </div>

          {/* KPIs */}
          <div style={s.kpiGrid}>
            <Kpi label="Capital" value={fmtU(r.capital)} />
            <Kpi label="Valeur finale" value={fmtU(r.net)} />
            <Kpi label="P&L" value={fmtU(r.pnl)} color={cc(r.pnl)} />
            <Kpi label="Rendement total" value={fmtPct(r.ret)} color={cc(r.ret)} />
            <Kpi label="Rendement / an" value={fmtPct(r.ann)} color={cc(r.ann)} />
            <Kpi label="BTC cible" value={fmtU(y.btcExit)} />
            <Kpi label="BTC sécurisé" value={fmtU(r.btcSecured)} />
            <Kpi label="Expo BTC" value={`${r.btcExpo.toFixed(1)}%`} />
          </div>

          {/* Charts */}
          <div style={s.chartsRow}>
            <Card title="Valeur finale">
              <div style={s.chartWrap}>
                <Doughnut data={{ labels: POCKET_NAMES, datasets: [{ data: [r.btcTotal, r.mTotal, r.sTotal, r.rTotal], backgroundColor: POCKET_COLORS, borderWidth: 0 }] }} options={doughnutOpts} />
              </div>
            </Card>
            <Card title="Contribution P&L">
              <div style={s.chartWrap}>
                <Doughnut data={{ labels: POCKET_NAMES, datasets: [{ data: [r.btcContrib, r.mContrib, r.sContrib, r.rContrib].map(v => Math.max(v, 0)), backgroundColor: POCKET_COLORS, borderWidth: 0 }] }} options={doughnutOpts} />
              </div>
            </Card>
          </div>

          {/* Sensitivity */}
          <Card title="Rendement par prix BTC">
            <div style={s.chartWrap}>
              <Bar data={{
                labels: sensPrices.map(p => '$' + fmt(p)),
                datasets: [{ data: sensPerf, backgroundColor: sensPerf.map(v => v >= 0 ? CHART_SUCCESS_BG : CHART_DANGER_BG), borderRadius: CHART_BORDER_RADIUS }],
              }} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { ticks: { color: CHART_TEXT_SECONDARY, font: { size: CHART_FONT_SIZE_SMALL } }, grid: { display: false } }, y: { ticks: { color: CHART_TEXT_SECONDARY, callback: (v: number | string) => v + '%' }, grid: { color: CHART_GRID_COLOR } } },
              }} />
            </div>
          </Card>

          {/* Pocket detail */}
          <Card title="Détail par poche">
            {POCKET_NAMES.map((name, i) => {
              const caps = [r.btcCap, r.mCap, r.sCap, r.rCap]
              const vals = [r.btcTotal, r.mTotal, r.sTotal, r.rTotal]
              const pnls = [r.btcPnl, r.mPnl, r.sPnl, r.rPnl]
              return (
                <div key={i} style={s.pocketRow}>
                  <div style={{ ...s.dot, background: POCKET_COLORS[i] }} />
                  <span style={s.pocketName}>{name}</span>
                  <span style={{ ...s.pocketVal, color: cc(pnls[i]) }}>{fmtU(vals[i])}</span>
                  <span style={{ ...s.pocketPct, color: cc(pnls[i]) }}>{caps[i] > 0 ? fmtPct(pnls[i] / caps[i] * 100) : '—'}</span>
                </div>
              )
            })}
          </Card>

          {/* Comparison */}
          <Card title="Comparaison scénarios">
            <table style={s.compTable}>
              <thead><tr><th style={s.compTh}></th><th style={s.compTh}>Bear</th><th style={s.compTh}>Base</th><th style={s.compTh}>Bull</th></tr></thead>
              <tbody>
                {[
                  ['BTC cible', (sc: Scenario) => fmtU(getYields(liveWithOverride, sc).btcExit)],
                  ['Valeur finale', (sc: Scenario) => fmtU(results[sc].net)],
                  ['P&L', (sc: Scenario) => fmtU(results[sc].pnl), true],
                  ['Rendement', (sc: Scenario) => fmtPct(results[sc].ret), true],
                  ['Annualisé', (sc: Scenario) => fmtPct(results[sc].ann), true],
                  ['BTC sécurisé', (sc: Scenario) => fmtU(results[sc].btcSecured)],
                  ['P&L Mining', (sc: Scenario) => fmtU(results[sc].mPnl)],
                  ['P&L Stable', (sc: Scenario) => fmtU(results[sc].sPnl)],
                ].map(([label, fn, colored]) => (
                  <tr key={label as string}>
                    <td style={{ ...s.compTd, fontWeight: T.fontWeights.bold }}>{label as string}</td>
                    {(['bear', 'base', 'bull'] as Scenario[]).map(sc => <td key={sc} style={{ ...s.compTd, ...(colored ? { color: cc(results[sc].pnl) } : {}) }}>{(fn as (s: Scenario) => string)(sc)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Profit waterfall */}
          <Card title="Libération BTC">
            {r.profitLog.length > 0 ? (
              <table style={s.compTable}>
                <thead><tr><th style={s.compTh}>Prix</th><th style={s.compTh}>Vendu</th><th style={s.compTh}>Revenu</th><th style={s.compTh}>Dest.</th></tr></thead>
                <tbody>
                  {r.profitLog.map((p, i) => (
                    <tr key={i}>
                      <td style={s.compTd}>{fmtU(p.price)}</td>
                      <td style={s.compTd}>{p.sold.toFixed(4)} BTC</td>
                      <td style={s.compTd}>{fmtU(p.revenue)}</td>
                      <td style={s.compTd}>{p.dest.toUpperCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: T.colors.textSecondary, fontSize: T.fontSizes.sm }}>Aucun palier atteint dans ce scénario.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────

function LiveItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return <div><span style={s.ll}>{label}</span><span style={{ ...s.lv, ...(color ? { color } : {}) }}>{value}</span></div>
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={s.card}><h3 style={s.cardTitle}>{title}</h3>{children}</div>
}

function Field({ label, value, onChange, type = 'text', ...rest }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; [k: string]: unknown }) {
  return <div style={s.field}><label style={s.label}>{label}</label><input type={type} value={value} onChange={e => onChange(e.target.value)} style={s.input} {...rest} /></div>
}

function Kpi({ label, value, color }: { label: string; value: string; color?: string }) {
  return <div style={s.kpi}><span style={s.kpiLabel}>{label}</span><span style={{ ...s.kpiValue, ...(color ? { color } : {}) }}>{value}</span></div>
}

function YieldCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <div style={s.yieldCard}><span style={s.yl}>{label}</span><div style={s.yv}>{value}</div><div style={s.ys}>{sub}</div></div>
}

// ── Styles ─────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  liveBar: { display: 'flex', gap: T.spacing[4], alignItems: 'center', flexWrap: 'wrap', marginBottom: T.spacing[4], padding: `${T.spacing[3]} ${T.spacing[4]}`, background: T.colors.bgSurface, border: `1px solid ${T.colors.borderSubtle}`, borderRadius: T.radius.lg },
  liveDot: { width: T.spacing[2], height: T.spacing[2], borderRadius: T.radius.full, background: T.colors.success },
  ll: { display: 'block', fontSize: T.fontSizes.micro, color: T.colors.textSecondary, textTransform: 'uppercase', letterSpacing: T.letterSpacing.wide },
  lv: { fontSize: T.fontSizes.sm, fontWeight: T.fontWeights.bold, color: T.colors.textPrimary, fontFamily: MONO },
  fgBar: { width: T.spacing[16], height: T.spacing[1], borderRadius: T.radius.full, background: T.colors.bgTertiary, overflow: 'hidden', marginTop: T.spacing[1] },
  layout: { display: 'grid', gridTemplateColumns: `${SIDEBAR_WIDTH} 1fr`, gap: T.spacing[4] },
  card: { background: T.colors.bgSurface, border: `1px solid ${T.colors.borderSubtle}`, borderRadius: T.radius.lg, padding: T.spacing[4], marginBottom: T.spacing[3] },
  cardTitle: { fontSize: T.fontSizes.sm, fontWeight: T.fontWeights.bold, margin: `0 0 ${T.spacing[3]}`, color: T.colors.textPrimary },
  field: { marginBottom: T.spacing[2] },
  label: { display: 'block', fontSize: T.fontSizes.micro, color: T.colors.textSecondary, marginBottom: T.spacing[1] },
  input: { width: '100%', background: T.colors.bgTertiary, border: `1px solid ${T.colors.borderSubtle}`, borderRadius: T.radius.sm, padding: `${T.spacing[2]} ${T.spacing[3]}`, color: T.colors.textPrimary, fontSize: T.fontSizes.sm, fontFamily: 'inherit' },
  presetRow: { display: 'flex', gap: T.spacing[2], marginBottom: T.spacing[3], flexWrap: 'wrap' },
  presetBtn: { padding: `${T.spacing[2]} ${T.spacing[3]}`, borderRadius: T.radius.sm, fontSize: T.fontSizes.micro, fontWeight: T.fontWeights.bold, cursor: 'pointer', border: `1px solid ${T.colors.borderSubtle}`, background: 'transparent', color: T.colors.textSecondary, transition: `all ${T.transitions.fast}` },
  presetActive: { borderColor: T.colors.accent, background: T.colors.accentSubtle, color: T.colors.accent },
  rangeRow: { display: 'flex', alignItems: 'center', gap: T.spacing[2] },
  range: { flex: 1, border: 'none', width: '100%' },
  rangeVal: { fontSize: T.fontSizes.xs, color: T.colors.accent, minWidth: T.spacing[10], textAlign: 'right', fontWeight: T.fontWeights.bold, fontFamily: MONO },
  allocBar: { height: T.spacing[2], borderRadius: T.radius.sm, display: 'flex', overflow: 'hidden', margin: `${T.spacing[1]} 0 ${T.spacing[1]}` },
  allocLegend: { display: 'flex', gap: T.spacing[2], flexWrap: 'wrap', fontSize: T.fontSizes.micro },
  legendItem: { display: 'flex', alignItems: 'center', gap: T.spacing[1], color: T.colors.textSecondary },
  dot: { width: T.spacing[2], height: T.spacing[2], borderRadius: T.radius.full, display: 'inline-block', flexShrink: 0 },
  yieldGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: T.spacing[2], marginBottom: T.spacing[2] },
  yieldCard: { background: T.colors.bgTertiary, borderRadius: T.radius.sm, padding: T.spacing[2] },
  yl: { fontSize: T.fontSizes.micro, color: T.colors.textSecondary, textTransform: 'uppercase' },
  yv: { fontSize: T.fontSizes.sm, fontWeight: T.fontWeights.bold, color: T.colors.success, fontFamily: MONO, marginTop: T.spacing[0] },
  ys: { fontSize: T.fontSizes.micro, color: T.colors.textSecondary },
  profitTable: { width: '100%', fontSize: T.fontSizes.xs, borderCollapse: 'collapse' },
  profitTh: { textAlign: 'left', padding: T.spacing[1], color: T.colors.textSecondary, borderBottom: `1px solid ${T.colors.borderSubtle}`, fontWeight: T.fontWeights.bold, fontSize: T.fontSizes.micro },
  profitTd: { padding: T.spacing[1], borderBottom: `1px solid ${T.colors.borderSubtle}` },
  profitInput: { width: T.spacing[12], background: T.colors.bgTertiary, border: `1px solid ${T.colors.borderSubtle}`, borderRadius: T.radius.sm, padding: `${T.spacing[1]} ${T.spacing[1]}`, color: T.colors.textPrimary, fontSize: T.fontSizes.micro, textAlign: 'center', fontFamily: MONO },
  profitSelect: { background: T.colors.bgTertiary, border: `1px solid ${T.colors.borderSubtle}`, borderRadius: T.radius.sm, padding: `${T.spacing[1]} ${T.spacing[1]}`, color: T.colors.textPrimary, fontSize: T.fontSizes.micro },
  btnSm: { padding: `${T.spacing[1]} ${T.spacing[2]}`, fontSize: T.fontSizes.micro, background: 'transparent', border: `1px solid ${T.colors.borderSubtle}`, color: T.colors.textSecondary, borderRadius: T.radius.sm, cursor: 'pointer' },
  tabs: { display: 'flex', gap: T.spacing[2], marginBottom: T.spacing[3] },
  tab: { padding: `${T.spacing[2]} ${T.spacing[3]}`, borderRadius: T.radius.sm, fontSize: T.fontSizes.xs, fontWeight: T.fontWeights.bold, cursor: 'pointer', border: `1px solid ${T.colors.borderSubtle}`, background: 'transparent', color: T.colors.textSecondary, transition: `all ${T.transitions.fast}` },
  kpiGrid: { display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${KPI_MIN_WIDTH}, 1fr))`, gap: T.spacing[2], marginBottom: T.spacing[3] },
  kpi: { background: T.colors.bgTertiary, borderRadius: T.radius.md, padding: T.spacing[3] },
  kpiLabel: { display: 'block', fontSize: T.fontSizes.micro, color: T.colors.textSecondary, textTransform: 'uppercase', letterSpacing: T.letterSpacing.wide },
  kpiValue: { fontSize: T.fontSizes.lg, fontWeight: T.fontWeights.black, color: T.colors.textPrimary, fontFamily: MONO },
  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: T.spacing[3] },
  chartWrap: { position: 'relative', height: CHART_HEIGHT },
  pocketRow: { display: 'flex', alignItems: 'center', gap: T.spacing[2], padding: `${T.spacing[2]} 0`, borderBottom: `1px solid ${T.colors.borderSubtle}` },
  pocketName: { flex: 1, fontWeight: T.fontWeights.bold, fontSize: T.fontSizes.sm },
  pocketVal: { fontWeight: T.fontWeights.bold, fontSize: T.fontSizes.sm, fontFamily: MONO },
  pocketPct: { fontSize: T.fontSizes.xs, minWidth: T.spacing[12], textAlign: 'right', fontFamily: MONO },
  compTable: { width: '100%', borderCollapse: 'collapse', fontSize: T.fontSizes.xs, fontFamily: MONO },
  compTh: { textAlign: 'left', padding: T.spacing[2], color: T.colors.textSecondary, borderBottom: `1px solid ${T.colors.borderSubtle}`, fontWeight: T.fontWeights.bold },
  compTd: { padding: T.spacing[2], borderBottom: `1px solid ${T.colors.borderSubtle}`, color: T.colors.textPrimary },
}
