'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { ADMIN_TOKENS as T } from '../constants'

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

// Chart.js renders on canvas and cannot read CSS custom properties at draw
// time. We resolve all theme variables once via getComputedStyle and pass
// concrete hex/rgba strings to Chart.js. SSR fallbacks mirror the token
// defaults defined in tokens.css / dashboard-vars.css.
const readVar = (name: string, fallback: string): string => {
  if (typeof window === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

const POCKET_NAMES = ['BTC Spot', 'Mining', 'Stablecoins', 'Réserve']

const getPocketColors = () => [
  readVar('--color-pocket-btc', '#F7931A'),
  readVar('--color-pocket-mining', '#4ADE80'),
  readVar('--color-pocket-stable', '#3B82F6'),
  readVar('--color-pocket-reserve', '#A78BFA'),
]

const getBrandRgb = () => readVar('--brand-accent-rgb', '167, 251, 144')

// Token-derived chart colors (frozen at module load for stable Chart.js theming)
const CHART_TEXT_SECONDARY = readVar('--dashboard-text-muted', '#7A808A')
const CHART_GRID_COLOR = readVar('--dashboard-overlay-05', 'rgba(255,255,255,0.05)')
const CHART_SUCCESS_BG = `rgba(${getBrandRgb()}, 0.55)`
const CHART_DANGER_BG = `rgba(${readVar('--color-error-rgb', '239, 68, 68')}, 0.55)`
const CHART_FONT_SIZE_SMALL = 9
const CHART_FONT_SIZE_MEDIUM = 10
const CHART_BORDER_RADIUS = 4

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
const cc = (v: number) => (v >= 0 ? T.colors.accent : T.colors.danger)

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
  const [pocketColors, setPocketColors] = useState(getPocketColors())
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
    } catch (e) {
      console.warn('[simulator] fetchLive failed:', e)
    }
  }, [])

  useEffect(() => {
    fetchLive()
    setPocketColors(getPocketColors())
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
      {/* Live bar */}
      <div className="simulator-live-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: T.spacing[1] }}>
          <div className="simulator-live-dot" /><span className="simulator-live-badge">LIVE</span>
        </div>
        <LiveItem label="BTC/USD" value={fmtU(live.btcPrice)} />
        <LiveItem label="24h" value={fmtPct(live.btc24h)} color={cc(live.btc24h)} />
        <LiveItem label="USDC (Aave)" value={`${live.usdcApy.toFixed(2)}%`} color={T.colors.accent} />
        <LiveItem label="USDT (Aave)" value={`${live.usdtApy.toFixed(2)}%`} color={T.colors.accent} />
        <div>
          <span className="simulator-live-label">Fear & Greed</span>
          <span className="simulator-live-value" style={{ color: live.fearGreed < 30 ? T.colors.danger : live.fearGreed > 70 ? T.colors.accent : T.colors.textGhost }}>{live.fearGreed} — {live.fearLabel}</span>
          <div className="simulator-fear-bar"><div style={{ height: '100%', width: `${live.fearGreed}%`, borderRadius: T.radius.full, background: `hsl(${fgHue},70%,50%)`, transition: `width ${T.transitions.slow}` }} /></div>
        </div>
        <LiveItem label="Mining" value={`${effectiveMining.toFixed(1)}%/yr`} color={T.colors.accent} />
      </div>

      <div className="simulator-layout">
        {/* LEFT INPUTS */}
        <div>
          <Card title="Investissement">
            <Field label="Capital ($)" value={capital} onChange={v => setCapital(+v)} type="number" min={1000} step={1000} />
            <Field label="Durée (mois)" value={duration} onChange={v => setDuration(+v)} type="number" min={1} max={120} />
            <Field label="Frais annuels (%)" value={fees} onChange={v => setFees(+v)} type="number" min={0} max={10} step={0.1} />
          </Card>

          <Card title="Profil">
            <div className="simulator-preset-row">
              {Object.keys(PRESETS).map(id => (
                <button key={id} onClick={() => applyPreset(id)} className={`simulator-preset-btn ${preset === id ? 'simulator-preset-active' : ''}`}>{id === 'conservative' ? 'Conservateur' : id === 'balanced' ? 'Équilibré' : id === 'growth' ? 'Growth' : id === 'aggressive' ? 'Agressif' : 'Barbell'}</button>
              ))}
            </div>
            {['BTC Spot', 'Mining', 'Stablecoins', 'Réserve'].map((name, i) => (
              <div key={i} className="simulator-field">
                <label className="simulator-label">{name}</label>
                <div className="simulator-range-row">
                  <input type="range" min={0} max={100} value={alloc[i]} onChange={e => setAllocSlider(i, +e.target.value)} className="simulator-range" />
                  <span className="simulator-range-val">{alloc[i]}%</span>
                </div>
              </div>
            ))}
            <div className="simulator-alloc-bar">{alloc.map((v, i) => <div key={i} style={{ width: `${v}%`, height: '100%', background: pocketColors[i], transition: `width ${T.transitions.slow}` }} />)}</div>
            <div className="simulator-alloc-legend">{POCKET_NAMES.map((n, i) => <span key={i} className="simulator-legend-item"><span className="simulator-dot" style={{ background: pocketColors[i] }} />{n}</span>)}</div>
          </Card>

          <Card title="Yields live">
            <div className="simulator-yield-grid">
              <YieldCard label="Mining net/an" value={`${effectiveMining.toFixed(1)}%`} sub="Hashprice-based" />
              <YieldCard label="USDC DeFi" value={`${live.usdcApy.toFixed(2)}%`} sub="Aave v3" />
              <YieldCard label="USDT DeFi" value={`${live.usdtApy.toFixed(2)}%`} sub="Aave v3" />
              <YieldCard label="BTC yield" value={`${live.btcApy.toFixed(2)}%`} sub="Lending" />
            </div>
            <Field label="Override mining yield (%)" value={miningOverride} onChange={setMiningOverride} type="number" placeholder="Auto" />
          </Card>

          <Card title="Prise de profit BTC">
            <table className="simulator-profit-table">
              <thead><tr><th className="simulator-profit-th">Prix $</th><th className="simulator-profit-th">% vendu</th><th className="simulator-profit-th">Dest.</th><th className="simulator-profit-th"></th></tr></thead>
              <tbody>
                {profitLevels.map((lv, i) => (
                  <tr key={i}>
                    <td className="simulator-profit-td"><input type="number" value={Math.round(live.btcPrice * lv.price)} step={5000} onChange={e => { const next = [...profitLevels]; next[i] = { ...lv, price: +e.target.value / live.btcPrice }; setProfitLevels(next) }} className="simulator-profit-input" /></td>
                    <td className="simulator-profit-td"><input type="number" value={lv.pct} min={0} max={100} onChange={e => { const next = [...profitLevels]; next[i] = { ...lv, pct: +e.target.value }; setProfitLevels(next) }} className="simulator-profit-input" />%</td>
                    <td className="simulator-profit-td"><select value={lv.dest} onChange={e => { const next = [...profitLevels]; next[i] = { ...lv, dest: e.target.value }; setProfitLevels(next) }} className="simulator-profit-select"><option value="usdc">USDC</option><option value="reserve">Réserve</option><option value="mining">Mining</option></select></td>
                    <td className="simulator-profit-td"><button onClick={() => setProfitLevels(prev => prev.filter((_, j) => j !== i))} className="simulator-btn-sm">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setProfitLevels(prev => [...prev, { price: (prev[prev.length - 1]?.price ?? 1.5) + 0.2, pct: 10, dest: 'usdc' }])} className="simulator-btn-sm simulator-btn-sm-with-margin">+ Palier</button>
          </Card>
        </div>

        {/* RIGHT OUTPUTS */}
        <div>
          {/* Tabs */}
          <div className="simulator-tabs">
            {(['bear', 'base', 'bull'] as Scenario[]).map(sc => (
              <button key={sc} onClick={() => setActiveTab(sc)} className={`simulator-tab ${activeTab === sc ? (sc === 'bear' ? 'simulator-tab-bear' : sc === 'bull' ? 'simulator-tab-bull' : 'simulator-tab-base') : ''}`}>{sc === 'bear' ? 'Bear' : sc === 'base' ? 'Base' : 'Bull'}</button>
            ))}
          </div>

          {/* KPIs */}
          <div className="simulator-kpi-grid">
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
          <div className="simulator-charts-row">
            <Card title="Valeur finale">
              <div className="simulator-chart-wrap">
                <Doughnut data={{ labels: POCKET_NAMES, datasets: [{ data: [r.btcTotal, r.mTotal, r.sTotal, r.rTotal], backgroundColor: pocketColors, borderWidth: 0 }] }} options={doughnutOpts} />
              </div>
            </Card>
            <Card title="Contribution P&L">
              <div className="simulator-chart-wrap">
                <Doughnut data={{ labels: POCKET_NAMES, datasets: [{ data: [r.btcContrib, r.mContrib, r.sContrib, r.rContrib].map(v => Math.max(v, 0)), backgroundColor: pocketColors, borderWidth: 0 }] }} options={doughnutOpts} />
              </div>
            </Card>
          </div>

          {/* Sensitivity */}
          <Card title="Rendement par prix BTC">
            <div className="simulator-chart-wrap">
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
                <div key={i} className="simulator-pocket-row">
                  <div className="simulator-dot" style={{ background: pocketColors[i] }} />
                  <span className="simulator-pocket-name">{name}</span>
                  <span className="simulator-pocket-val" style={{ color: cc(pnls[i]) }}>{fmtU(vals[i])}</span>
                  <span className="simulator-pocket-pct" style={{ color: cc(pnls[i]) }}>{caps[i] > 0 ? fmtPct(pnls[i] / caps[i] * 100) : '—'}</span>
                </div>
              )
            })}
          </Card>

          {/* Comparison */}
          <Card title="Comparaison scénarios">
            <table className="simulator-comp-table">
              <thead><tr><th className="simulator-comp-th"></th><th className="simulator-comp-th">Bear</th><th className="simulator-comp-th">Base</th><th className="simulator-comp-th">Bull</th></tr></thead>
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
                    <td className="simulator-comp-td simulator-comp-td-bold">{label as string}</td>
                    {(['bear', 'base', 'bull'] as Scenario[]).map(sc => <td key={sc} className="simulator-comp-td" style={colored ? { color: cc(results[sc].pnl) } : {}}>{(fn as (s: Scenario) => string)(sc)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Profit waterfall */}
          <Card title="Libération BTC">
            {r.profitLog.length > 0 ? (
              <table className="simulator-comp-table">
                <thead><tr><th className="simulator-comp-th">Prix</th><th className="simulator-comp-th">Vendu</th><th className="simulator-comp-th">Revenu</th><th className="simulator-comp-th">Dest.</th></tr></thead>
                <tbody>
                  {r.profitLog.map((p, i) => (
                    <tr key={i}>
                      <td className="simulator-comp-td">{fmtU(p.price)}</td>
                      <td className="simulator-comp-td">{p.sold.toFixed(4)} BTC</td>
                      <td className="simulator-comp-td">{fmtU(p.revenue)}</td>
                      <td className="simulator-comp-td">{p.dest.toUpperCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="simulator-empty-state">Aucun palier atteint dans ce scénario.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────

function LiveItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return <div><span className="simulator-live-label">{label}</span><span className="simulator-live-value" style={color ? { color } : {}}>{value}</span></div>
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="simulator-card"><h3 className="simulator-card-title">{title}</h3>{children}</div>
}

function Field({ label, value, onChange, type = 'text', ...rest }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; [k: string]: unknown }) {
  return <div className="simulator-field"><label className="simulator-label">{label}</label><input type={type} value={value} onChange={e => onChange(e.target.value)} className="simulator-input" {...rest} /></div>
}

function Kpi({ label, value, color }: { label: string; value: string; color?: string }) {
  return <div className="simulator-kpi"><span className="simulator-kpi-label">{label}</span><span className="simulator-kpi-value" style={color ? { color } : {}}>{value}</span></div>
}

function YieldCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <div className="simulator-yield-card"><span className="simulator-yield-label">{label}</span><div className="simulator-yield-value">{value}</div><div className="simulator-yield-sub">{sub}</div></div>
}
