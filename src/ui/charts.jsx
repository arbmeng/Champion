import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useMemo } from 'react'
import { cx } from './primitives'
import { shortDate } from '../lib/dates'

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const axis = { stroke: 'var(--text-3)', fontSize: 11, tickLine: false, axisLine: false }

function ChartTip({ active, payload, label, unit, labelFmt, valueFmt }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tip">
      <div className="caption">{labelFmt ? labelFmt(label) : label}</div>
      {payload.filter((p) => p.value != null).map((p) => <div key={p.dataKey}><b className="num">{valueFmt ? valueFmt(p.value) : p.value}</b> <span className="caption">{p.name && p.name !== p.dataKey ? p.name : unit}</span></div>)}
    </div>
  )
}

export function TrendChart({ data, x = 'date', y = 'value', unit = '', height = 220, kind = 'area', domain, dateAxis = true, ref: refLine, y2, className, valueFmt, label }) {
  const anim = !reduced()
  const Chart = kind === 'area' ? AreaChart : LineChart
  const margin = { top: 8, right: 8, left: 0, bottom: 0 }
  const dom = useMemo(() => domain || ['auto', 'auto'], [domain])
  return (
    <div className={cx('chart', className)} style={{ height }} role="img" aria-label={label || `Chart of ${y} over time`}>
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={margin}>
          <defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity=".28" /><stop offset="100%" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey={x} {...axis} tickFormatter={dateAxis ? shortDate : undefined} minTickGap={28} />
          <YAxis {...axis} domain={dom} width={48} tickFormatter={(v) => (Math.abs(v) >= 10000 ? `${Math.round(v / 1000)}k` : v)} />
          <Tooltip content={<ChartTip unit={unit} labelFmt={dateAxis ? shortDate : undefined} valueFmt={valueFmt} />} cursor={{ stroke: 'var(--line-strong)' }} />
          {refLine != null && <ReferenceLine y={refLine} stroke="var(--success)" strokeDasharray="4 4" />}
          {kind === 'area'
            ? <Area type="monotone" dataKey={y} name={unit} stroke="var(--accent)" strokeWidth={2.5} fill="url(#trendFill)" isAnimationActive={anim} animationDuration={700} dot={false} activeDot={{ r: 5, fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 }} />
            : <Line type="monotone" dataKey={y} name={unit} stroke="var(--accent)" strokeWidth={2.5} isAnimationActive={anim} animationDuration={700} dot={{ r: 3, fill: 'var(--accent)', strokeWidth: 0 }} activeDot={{ r: 5 }} />}
          {y2 && <Line type="monotone" dataKey={y2} stroke="var(--text-3)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={anim} />}
        </Chart>
      </ResponsiveContainer>
    </div>
  )
}

export function BarsChart({ data, x = 'label', y = 'value', unit = '', height = 200, highlightLast = true, className, valueFmt, label }) {
  const anim = !reduced()
  return (
    <div className={cx('chart', className)} style={{ height }} role="img" aria-label={label || `Bar chart of ${y}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey={x} {...axis} interval="preserveStartEnd" />
          <YAxis {...axis} width={48} tickFormatter={(v) => (Math.abs(v) >= 10000 ? `${Math.round(v / 1000)}k` : v)} />
          <Tooltip content={<ChartTip unit={unit} valueFmt={valueFmt} />} cursor={{ fill: 'var(--surface-2)' }} />
          <Bar dataKey={y} name={unit} radius={[5, 5, 0, 0]} isAnimationActive={anim} animationDuration={600}>
            {data.map((d, i) => <Cell key={d[x] + i} fill={highlightLast && i === data.length - 1 ? 'var(--accent)' : 'var(--text-3)'} fillOpacity={highlightLast && i === data.length - 1 ? 1 : 0.45} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Horizontal bars (muscle sets): compact, readable on phones.
export function HBars({ rows, max, unit = 'sets', target }) {
  const top = max || Math.max(1, ...rows.map((r) => r.value), target || 0)
  return (
    <ul className="hbars">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="hbar-label">{r.label}</span>
          <span className="hbar-track" role="progressbar" aria-valuenow={r.value} aria-valuemin={0} aria-valuemax={top} aria-label={`${r.label}: ${r.value} ${unit}`}>
            <span className="hbar-fill" style={{ width: `${(r.value / top) * 100}%` }} />
            {target ? <span className="hbar-target" style={{ left: `${(target / top) * 100}%` }} /> : null}
          </span>
          <span className="hbar-val num">{r.value}</span>
        </li>
      ))}
    </ul>
  )
}

export function Sparkline({ values, width = 96, height = 32 }) {
  if (values.length < 2) return null
  const lo = Math.min(...values), hi = Math.max(...values)
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 3 - ((v - lo) / (hi - lo || 1)) * (height - 6)}`).join(' ')
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true"><polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
