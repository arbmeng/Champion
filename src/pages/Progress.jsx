import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Activity, Dumbbell, Flame, Plus, Scale, TrendingUp, Trophy } from 'lucide-react'
import { useApp } from '../state/store'
import { bodyLatest, exerciseStats, heatmap, LOWER, muscleSets, strengthSeries, streakDays, sumLogs, totals, UPPER, volumeBuckets, weekStats } from '../state/selectors'
import { MUSCLES } from '../data/exercises'
import { Badge, Button, Card, EmptyState, Input, PageHeader, Section, SectionTabs, SegmentedControl, Select, Tabs } from '../ui/primitives'
import { ChartCard, MetricCard } from '../ui/domain'
import { BarsChart, HBars, Sparkline, TrendChart } from '../ui/charts'
import { Sheet, useToast } from '../ui/overlays'
import { progressTabs } from '../ui/sections'
import { addDaysKey, dateKey, shortDate, weekKeys } from '../lib/dates'
import { fmtCompact, fmtNum, fmtPct, toDisplay } from '../lib/format'
import { tr } from '../lib/i18n'

const TABS = [
  { id: 'overview', label: tr("Overview") }, { id: 'strength', label: tr("Strength") }, { id: 'volume', label: tr("Volume") }, { id: 'muscles', label: tr("Muscles") },
  { id: 'prs', label: tr("PRs") }, { id: 'consistency', label: tr("Consistency") }, { id: 'body', label: tr("Body") },
]
const KEY_LIFTS = ['bench', 'squat', 'rdl', 'pullup', 'ohp', 'deadlift']
const BODY_METRICS = [{ id: 'weight', label: tr("Weight"), unit: 'kg' }, { id: 'bodyFat', label: tr("Body fat"), unit: '%' }, { id: 'chest', label: tr("Chest"), unit: 'cm' }, { id: 'waist', label: tr("Waist"), unit: 'cm' }, { id: 'arms', label: tr("Arms"), unit: 'cm' }, { id: 'thighs', label: tr("Thighs"), unit: 'cm' }, { id: 'hips', label: tr("Hips"), unit: 'cm' }]

function liftChange(state, id, weeks = 8) {
  const series = strengthSeries(state, id, weeks / 4.35)
  if (series.length < 2) return null
  return ((series[series.length - 1].e1rm - series[0].e1rm) / series[0].e1rm) * 100
}

export function Progress() {
  const { state } = useApp()
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'overview'
  const setTab = (id) => setParams(id === 'overview' ? {} : { tab: id }, { replace: true })
  const empty = state.history.length === 0 && state.body.length === 0
  return (
    <div className="stack-lg">
      <PageHeader eyebrow={tr("Performance")} title={tr("Progress")} subtitle={tr("Are you getting stronger, training consistently, and balancing your volume?")} />
      <SectionTabs items={progressTabs} />
      {empty ? (
        <EmptyState icon={TrendingUp} title={tr("No data yet")} body={tr("Complete your first workout and your strength, volume and consistency trends will appear here.")} action={<Button variant="primary" to="/workouts">{tr("Find a workout")}</Button>} />
      ) : (
        <>
          <Tabs items={TABS} value={tab} onChange={setTab} label={tr("Progress sections")} className="subtabs" />
          <div key={tab} className="enter">
            {tab === 'overview' && <Overview state={state} go={setTab} />}
            {tab === 'strength' && <Strength state={state} />}
            {tab === 'volume' && <VolumeTab state={state} />}
            {tab === 'muscles' && <Muscles state={state} />}
            {tab === 'prs' && <PRs state={state} />}
            {tab === 'consistency' && <Consistency state={state} />}
            {tab === 'body' && <Body state={state} />}
          </div>
        </>
      )}
    </div>
  )
}

function Overview({ state, go }) {
  const unit = state.settings.unit
  const t = totals(state)
  const week = weekStats(state, 0)
  const buckets = volumeBuckets(state, 'week', 8)
  const lifts = KEY_LIFTS.map((id) => ({ id, st: exerciseStats(state, id), change: liftChange(state, id), series: strengthSeries(state, id, 3) })).filter((l) => l.st.sessions > 1).slice(0, 4)
  const sets = muscleSets(state, addDaysKey(dateKey(), -6), dateKey())
  return (
    <div className="stack-lg">
      <div className="grid-4">
        <MetricCard icon={Dumbbell} label={tr("Workouts")} value={t.workouts} hint={tr("all time")} />
        <MetricCard icon={Flame} label={tr("Total volume")} value={fmtCompact(toDisplay(t.volume, unit))} unit={unit} hint={tr("all time")} />
        <MetricCard icon={Activity} label={tr("Streak")} value={streakDays(state)} unit={tr("days")} hint={tr("on plan")} />
        <MetricCard icon={Trophy} label={tr("PRs")} value={t.prs} hint={tr("all time")} />
      </div>
      <div className="grid-2 wide-left">
        <ChartCard title={tr("Is my volume increasing?")} question={tr("Total weekly training volume")} right={<button type="button" className="link caption" onClick={() => go('volume')}>{tr("Details")}</button>} foot={tr("This week so far: {0} {1}", fmtNum(toDisplay(week.volume, unit)), unit)}>
          <BarsChart data={buckets.map((b) => ({ ...b, volume: toDisplay(b.volume, unit) }))} y="volume" unit={unit} height={220} label={tr("Weekly volume for the last 8 weeks")} />
        </ChartCard>
        <ChartCard title={tr("Which muscles am I training?")} question={tr("Working sets, last 7 days")} right={<button type="button" className="link caption" onClick={() => go('muscles')}>{tr("Details")}</button>}>
          <HBars rows={MUSCLES.map((m) => ({ label: m, value: sets[m] }))} target={10} />
        </ChartCard>
      </div>
      <Section title={tr("Am I getting stronger?")} eyebrow={tr("Estimated 1RM · 8 weeks")} action={<button type="button" className="link caption" onClick={() => go('strength')}>{tr("All lifts")}</button>}>
        <div className="grid-4">
          {lifts.map((l) => (
            <Card key={l.id} as={Link} to={`/exercises/${l.id}`} className="card-interactive stack-sm lift">
              <div className="row between"><b className="truncate">{l.st.ex.name}</b>{l.change != null && <Badge tone={l.change >= 0 ? 'success' : 'danger'}>{fmtPct(l.change, 1)}</Badge>}</div>
              <div className="num num-md">{toDisplay(l.st.best.weight, unit)}<span className="unit">{unit} × {l.st.best.reps}</span></div>
              <Sparkline values={l.series.map((s) => s.e1rm)} width={140} height={34} />
            </Card>
          ))}
          {!lifts.length && <EmptyState compact icon={Dumbbell} title={tr("Log a few sessions")} body={tr("Strength trends need at least two sessions of a lift.")} />}
        </div>
      </Section>
    </div>
  )
}

function Strength({ state }) {
  const unit = state.settings.unit
  const withHistory = useMemo(() => [...KEY_LIFTS, ...state.history.flatMap((l) => l.entries.map((e) => e.exerciseId))].filter((id, i, a) => a.indexOf(id) === i).map((id) => exerciseStats(state, id)).filter((s) => s.sessions > 0 && s.ex?.repLabel === 'reps' && s.ex.weighted), [state])
  const [id, setId] = useState(withHistory[0]?.ex.id)
  const [range, setRange] = useState('3')
  if (!withHistory.length) return <EmptyState icon={Dumbbell} title={tr("No lifts logged")} body={tr("Log weighted sets to see strength trends.")} />
  const st = exerciseStats(state, id)
  const series = strengthSeries(state, id, Number(range))
  const change = series.length > 1 ? ((series[series.length - 1].e1rm - series[0].e1rm) / series[0].e1rm) * 100 : null
  return (
    <div className="stack-lg">
      <div className="row gap-4 wrap">
        <Select className="grow" label={tr("Exercise")} options={withHistory.map((s) => ({ value: s.ex.id, label: s.ex.name }))} value={id} onChange={setId} />
        <SegmentedControl label={tr("Range")} items={[{ id: '1', label: tr("1M") }, { id: '3', label: tr("3M") }, { id: '6', label: tr("6M") }, { id: '12', label: tr("1Y") }]} value={range} onChange={setRange} />
      </div>
      <Card className="stack">
        <div className="row between wrap"><div><span className="eyebrow">{st.ex.name}</span><div className="num num-xl">{toDisplay(st.best.weight, unit)}<span className="unit">{unit} × {st.best.reps}</span></div></div>{change != null && <Badge tone={change >= 0 ? 'success' : 'danger'}>{fmtPct(change, 1)} {tr("est. 1RM")}</Badge>}</div>
        {series.length > 1 ? <TrendChart data={series.map((s) => ({ ...s, e1rm: toDisplay(s.e1rm, unit), weight: toDisplay(s.weight, unit) }))} y="e1rm" y2="weight" unit={tr("{0} est. 1RM", unit)} height={280} label={tr("Estimated 1RM trend for {0}", st.ex.name)} /> : <EmptyState compact icon={Dumbbell} title={tr("Not enough data in this range")} body={tr("Try a longer range or log more sessions.")} />}
        <p className="caption">{tr("Solid line: estimated one-rep max (Epley estimate). Dashed: heaviest set that day.")}</p>
      </Card>
      <Section title={tr("All key lifts")}>
        <div className="grid-auto">
          {withHistory.slice(0, 9).map((s) => { const c = liftChange(state, s.ex.id); return (
            <Card key={s.ex.id} as={Link} to={`/exercises/${s.ex.id}`} className="card-interactive row between"><div><b>{s.ex.name}</b><div className="caption">{s.sessions} {tr("sessions")}</div></div><div className="tr"><div className="num">{toDisplay(s.best.weight, unit)} × {s.best.reps}</div>{c != null && <span className={`caption ${c >= 0 ? 'pos' : 'neg'}`}>{fmtPct(c, 1)} {tr("/ 8 wks")}</span>}</div></Card>
          ) })}
        </div>
      </Section>
    </div>
  )
}

function VolumeTab({ state }) {
  const unit = state.settings.unit
  const [mode, setMode] = useState('week')
  const data = volumeBuckets(state, mode, mode === 'week' ? 12 : 6).map((b) => ({ ...b, volume: toDisplay(b.volume, unit) }))
  const t = totals(state)
  const cur = data[data.length - 1]?.volume || 0
  const prev = data[data.length - 2]?.volume || 0
  const delta = prev ? ((cur - prev) / prev) * 100 : null
  return (
    <div className="stack-lg">
      <div className="grid-3">
        <MetricCard label={mode === 'week' ? tr("This week") : tr("This month")} value={fmtCompact(cur)} unit={unit} delta={delta != null ? fmtPct(delta) : null} deltaTone={delta > 0 ? 'success' : 'danger'} hint={mode === 'week' ? tr("vs last week") : tr("vs last month")} />
        <MetricCard label={tr("Average session")} value={fmtCompact(toDisplay(t.workouts ? t.volume / t.workouts : 0, unit))} unit={unit} hint={tr("all time")} />
        <MetricCard label={tr("Total volume")} value={fmtCompact(toDisplay(t.volume, unit))} unit={unit} hint={tr("{0} sets", fmtNum(t.sets))} />
      </div>
      <ChartCard title={tr("Is my volume increasing?")} question={mode === 'week' ? tr("Volume = weight × reps, summed per week") : tr("Volume = weight × reps, summed per month")} right={<SegmentedControl size="sm" label={tr("Period")} items={[{ id: 'week', label: tr("Weekly") }, { id: 'month', label: tr("Monthly") }]} value={mode} onChange={setMode} />}>
        <BarsChart data={data} y="volume" unit={unit} height={300} label={mode === 'week' ? tr("Weekly training volume") : tr("Monthly training volume")} />
      </ChartCard>
      <ChartCard title={tr("Sets per period")} question={tr("Working sets logged")}><BarsChart data={data} y="sets" unit={tr("sets")} height={200} /></ChartCard>
    </div>
  )
}

function Muscles({ state }) {
  const [period, setPeriod] = useState('week')
  const to = dateKey()
  const from = addDaysKey(to, period === 'week' ? -6 : -27)
  const prevFrom = addDaysKey(from, period === 'week' ? -7 : -28)
  const cur = muscleSets(state, from, to)
  const prev = muscleSets(state, prevFrom, addDaysKey(from, -1))
  const scale = period === 'week' ? 1 : 4
  const push = cur.Chest + cur.Shoulders + cur.Triceps
  const pull = cur.Back + cur.Biceps
  const upper = UPPER.reduce((n, m) => n + cur[m], 0)
  const lower = LOWER.reduce((n, m) => n + cur[m], 0)
  const ratio = (a, b) => (b ? Math.round((a / b) * 100) / 100 : '—')
  return (
    <div className="stack-lg">
      <div className="row between wrap"><p className="muted">{tr("Hard sets per muscle group. The marker shows 10 sets per week — a common guideline starting point, not a rule.")}</p><SegmentedControl label={tr("Period")} items={[{ id: 'week', label: tr("7 days") }, { id: 'month', label: tr("28 days") }]} value={period} onChange={setPeriod} /></div>
      <div className="grid-2 wide-left">
        <ChartCard title={tr("Weekly sets by muscle")} question={tr("Which muscles am I training most?")}><HBars rows={MUSCLES.map((m) => ({ label: m, value: cur[m] }))} target={10 * scale} /></ChartCard>
        <div className="stack">
          <Card className="stack-sm"><h3>{tr("Muscle balance")}</h3>
            <div className="row between"><span className="muted">{tr("Push : pull sets")}</span><b className="num">{push} : {pull} <span className="caption">({ratio(push, pull)})</span></b></div>
            <div className="row between"><span className="muted">{tr("Upper : lower sets")}</span><b className="num">{upper} : {lower} <span className="caption">({ratio(upper, lower)})</span></b></div>
          </Card>
          <Card className="stack-sm"><h3>{tr("Change vs previous")} {period === 'week' ? tr("week") : tr("4 weeks")}</h3>
            {MUSCLES.map((m) => { const d = cur[m] - prev[m]; return <div key={m} className="row between"><span>{tr(m)}</span><span className={`num ${d > 0 ? 'pos' : d < 0 ? 'neg' : 'faint'}`}>{d > 0 ? '+' : ''}{d} {tr("sets")}</span></div> })}
          </Card>
        </div>
      </div>
    </div>
  )
}

function PRs({ state }) {
  const unit = state.settings.unit
  const rows = useMemo(() => state.history.flatMap((l) => l.entries.map((e) => e.exerciseId)).filter((id, i, a) => a.indexOf(id) === i).map((id) => exerciseStats(state, id)).filter((s) => s.best && s.ex?.repLabel === 'reps' && s.best.weight > 0).sort((a, b) => b.best.date.localeCompare(a.best.date)), [state])
  const recent = state.history.filter((l) => l.prs.length).slice(0, 8)
  if (!rows.length) return <EmptyState icon={Trophy} title={tr("No personal records yet")} body={tr("Beat a previous best on any lift and it will be saved here.")} action={<Button variant="primary" to="/workouts">{tr("Start training")}</Button>} />
  return (
    <div className="stack-lg">
      <div className="grid-auto">
        {rows.slice(0, 12).map((s) => (
          <Card key={s.ex.id} as={Link} to={`/exercises/${s.ex.id}`} className="card-interactive stack-sm pr-card">
            <div className="row between"><span className="eyebrow">{tr(s.ex.muscle)}</span><Trophy size={15} className="accent" aria-hidden="true" /></div>
            <h3>{s.ex.name}</h3>
            <div className="num num-lg">{toDisplay(s.best.weight, unit)}<span className="unit">{unit} × {s.best.reps}</span></div>
            <span className="caption">{tr('Set {0} · est. 1RM {1} {2}', shortDate(s.best.date), toDisplay(s.e1rm, unit), unit)}</span>
          </Card>
        ))}
      </div>
      {recent.length > 0 && (
        <Section title={tr("Recent PRs")}>
          <Card className="stack-sm">{recent.flatMap((l) => l.prs.map((p) => (
            <div key={`${l.id}-${p.exerciseId}`} className="row between"><div><Link to={`/exercises/${p.exerciseId}`} className="link">{p.name}</Link><div className="caption">{shortDate(l.date)} · {l.title}</div></div><b className="num">{toDisplay(p.weight, unit)} {unit} × {p.reps}</b></div>
          )))}</Card>
        </Section>
      )}
    </div>
  )
}

export function Heatmap({ weeks = 14, state }) {
  const cells = heatmap(state, weeks)
  const cols = Array.from({ length: weeks }, (_, w) => cells.slice(w * 7, w * 7 + 7))
  return (
    <div className="heat" role="img" aria-label={tr("Training calendar heatmap for the last {0} weeks", weeks)}>
      <div className="heat-days" aria-hidden="true">{['M', '', 'W', '', 'F', '', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="heat-grid" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
        {cols.map((col, i) => <div key={i} className="heat-col">{col.map((c) => <span key={c.date} className={`heat-cell lvl-${c.future ? 'f' : Math.min(2, c.count)}`} title={c.count === 1 ? tr('{0}: 1 workout', shortDate(c.date)) : tr('{0}: {1} workouts', shortDate(c.date), c.count)} />)}</div>)}
      </div>
    </div>
  )
}

function Consistency({ state }) {
  const target = state.settings.weeklyTarget
  const weeks = Array.from({ length: 8 }, (_, i) => { const off = i - 7; const s = weekStats(state, off); return { label: shortDate(weekKeys(new Date(), off)[0]), workouts: s.workouts } })
  const avg = Math.round((weeks.reduce((n, w) => n + w.workouts, 0) / weeks.length) * 10) / 10
  const hit = weeks.filter((w) => w.workouts >= target).length
  const days = sumLogs(state.history.filter((l) => l.date >= addDaysKey(dateKey(), -27))).workouts
  return (
    <div className="stack-lg">
      <div className="grid-4">
        <MetricCard label={tr("Current streak")} icon={Flame} value={streakDays(state)} unit={tr("days")} />
        <MetricCard label={tr("Weeks on target")} value={hit} unit="/ 8" hint={tr("target {0}/week", target)} />
        <MetricCard label={tr("Average")} value={avg} unit={tr("/ week")} hint={tr("last 8 weeks")} />
        <MetricCard label={tr("Last 28 days")} value={days} unit={tr("workouts")} />
      </div>
      <ChartCard title={tr("Am I training consistently?")} question={tr("Training days over the last 14 weeks")}><Heatmap state={state} /></ChartCard>
      <ChartCard title={tr("Workout frequency")} question={tr("Sessions per week vs your target of {0}", target)}><BarsChart data={weeks} x="label" y="workouts" unit={tr("workouts")} height={220} /></ChartCard>
    </div>
  )
}

function Body({ state }) {
  const { actions } = useApp()
  const toast = useToast()
  const [metric, setMetric] = useState('weight')
  const [open, setOpen] = useState(false)
  const m = BODY_METRICS.find((x) => x.id === metric)
  const data = [...state.body].filter((b) => b[metric] != null).reverse().map((b) => ({ date: b.date, value: b[metric] }))
  const first = data[0]?.value
  const last = data[data.length - 1]?.value
  const [draft, setDraft] = useState({})
  const save = (e) => {
    e.preventDefault()
    const entry = { date: dateKey() }
    for (const mm of BODY_METRICS) { const v = parseFloat(draft[mm.id]); if (!Number.isNaN(v) && v > 0) entry[mm.id] = v }
    if (Object.keys(entry).length < 2) { toast({ title: tr("Enter at least one measurement"), tone: 'warning' }); return }
    const base = state.body[0] || {}
    actions.addBody({ ...Object.fromEntries(BODY_METRICS.map((mm) => [mm.id, base[mm.id]])), ...entry })
    setOpen(false); setDraft({}); toast({ title: tr("Measurements saved"), tone: 'success' })
  }
  return (
    <div className="stack-lg">
      <div className="row between wrap gap-4"><p className="muted">{tr("Tracked on your own schedule. These numbers are informational — they are not a health assessment.")}</p><Button icon={Plus} onClick={() => setOpen(true)}>{tr("Add measurements")}</Button></div>
      {state.body.length === 0 ? <EmptyState icon={Scale} title={tr("No measurements yet")} body={tr("Add your weight and measurements to see a timeline.")} action={<Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>{tr("Add measurements")}</Button>} /> : (
        <>
          <div className="grid-4">{BODY_METRICS.slice(0, 4).map((b) => { const v = bodyLatest(state, b.id); return <MetricCard key={b.id} label={b.label} value={v ?? '—'} unit={tr(b.unit)} hint={tr("latest")} to={undefined} className="clickable" /> })}</div>
          <ChartCard title={tr("{0} timeline", m.label)} question={tr("How has this changed over time?")} right={<Select label={tr("Metric")} options={BODY_METRICS.map((b) => ({ value: b.id, label: b.label }))} value={metric} onChange={setMetric} />} foot={first != null && data.length > 1 ? tr('{0}{1} {2} since {3}', last - first >= 0 ? '+' : '', Math.round((last - first) * 10) / 10, tr(m.unit), shortDate(data[0].date)) : null}>
            {data.length > 1 ? <TrendChart data={data} y="value" unit={tr(m.unit)} kind="line" height={260} label={tr("{0} timeline", m.label)} /> : <EmptyState compact icon={Scale} title={tr("One entry so far")} body={tr("Add another measurement to see a trend.")} />}
          </ChartCard>
          <Card pad={false}>
            <table className="rtable">
              <thead><tr><th>{tr("Date")}</th>{BODY_METRICS.map((b) => <th key={b.id}>{b.label}</th>)}</tr></thead>
              <tbody>{state.body.slice(0, 8).map((b) => <tr key={b.date}><td data-label="Date">{shortDate(b.date)}</td>{BODY_METRICS.map((mm) => <td key={mm.id} data-label={mm.label} className="num">{b[mm.id] ?? '—'}</td>)}</tr>)}</tbody>
            </table>
          </Card>
        </>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title={tr("Add measurements")}>
        <form className="stack" onSubmit={save}>
          <div className="grid-2">{BODY_METRICS.map((b) => <Input key={b.id} label={`${b.label} (${b.unit})`} inputMode="decimal" value={draft[b.id] ?? ''} placeholder={String(bodyLatest(state, b.id) ?? '')} onChange={(e) => setDraft({ ...draft, [b.id]: e.target.value })} />)}</div>
          <Button type="submit" variant="primary" size="lg" block>{tr("Save")}</Button>
        </form>
      </Sheet>
    </div>
  )
}
