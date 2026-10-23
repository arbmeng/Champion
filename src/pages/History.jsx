import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Dumbbell, Flame, Play, Trophy } from 'lucide-react'
import { useApp } from '../state/store'
import { exerciseStats, findExercise, findWorkout, setVolume } from '../state/selectors'
import { Badge, BackLink, Button, Card, EmptyState, IconButton, PageHeader, SectionTabs, Tabs } from '../ui/primitives'
import { ExerciseRow, MetricCard, WorkoutRow } from '../ui/domain'
import { progressTabs } from '../ui/sections'
import { useStartWorkout } from '../lib/useStart'
import { DAY_LABELS, dateKey, longDate, monthYear } from '../lib/dates'
import { fmtNum, fmtVolume, toDisplay } from '../lib/format'
import { tr } from '../lib/i18n'

function CalendarMonth({ byDate, selected, onSelect }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const first = new Date(cursor)
  const offset = (first.getDay() + 6) % 7
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, i) => { const n = i - offset + 1; return n >= 1 && n <= days ? dateKey(new Date(cursor.getFullYear(), cursor.getMonth(), n)) : null })
  const today = dateKey()
  const inMonth = Object.keys(byDate).filter((k) => k.startsWith(dateKey(cursor).slice(0, 7))).length
  return (
    <Card className="stack cal">
      <div className="row between">
        <h2>{monthYear(cursor)}</h2>
        <div className="row gap-1"><span className="caption">{inMonth} {tr("training days")}</span><IconButton label={tr("Previous month")} icon={ChevronLeft} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} /><IconButton label={tr("Next month")} icon={ChevronRight} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} /></div>
      </div>
      <div className="cal-grid" role="grid" aria-label={tr("Training calendar")}>
        {DAY_LABELS.map((d) => <span key={d} className="cal-head caption" role="columnheader">{d}</span>)}
        {cells.map((k, i) => {
          if (!k) return <span key={i} className="cal-cell is-blank" />
          const logs = byDate[k] || []
          const isSel = k === selected
          return (
            <button key={k} type="button" role="gridcell" className={`cal-cell ${logs.length ? 'has-log' : ''} ${k === today ? 'is-today' : ''} ${isSel ? 'is-selected' : ''}`} onClick={() => onSelect(k)} aria-label={logs.length ? `${longDate(k)}, ${logs.map((l) => l.title).join('، ')}` : tr('{0}, no workout', longDate(k))} aria-pressed={isSel}>
              <span className="num cal-n">{Number(k.slice(8))}</span>
              {logs.length > 0 && <span className="cal-dots" aria-hidden="true">{logs.map((l) => <i key={l.id} />)}</span>}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

export function History() {
  const { state } = useApp()
  const unit = state.settings.unit
  const [tab, setTab] = useState('calendar')
  const [selected, setSelected] = useState(dateKey())
  const byDate = useMemo(() => state.history.reduce((m, l) => { (m[l.date] ||= []).push(l); return m }, {}), [state.history])
  const dayLogs = byDate[selected] || []
  const exercisesDone = useMemo(() => [...new Set(state.history.flatMap((l) => l.entries.map((e) => e.exerciseId)))].map((id) => exerciseStats(state, id)).filter((s) => s.ex).sort((a, b) => b.sessions - a.sessions), [state])
  const vol = fmtVolume
  return (
    <div className="stack-lg">
      <PageHeader eyebrow={tr("Training log")} title={tr("History")} subtitle={tr("Every workout you’ve completed, with full detail.")} />
      <SectionTabs items={progressTabs} />
      {state.history.length === 0 ? (
        <EmptyState icon={CalendarDays} title={tr("No workouts yet")} body={tr("Finish your first workout and it will appear in your calendar.")} action={<Button variant="primary" to="/workouts">{tr("Browse workouts")}</Button>} />
      ) : (
        <>
          <Tabs label={tr("History views")} value={tab} onChange={setTab} items={[{ id: 'calendar', label: tr("Calendar") }, { id: 'workouts', label: tr("Workouts"), count: state.history.length }, { id: 'exercises', label: tr("Exercises") }]} />
          {tab === 'calendar' && (
            <div className="history-cols">
              <CalendarMonth byDate={byDate} selected={selected} onSelect={setSelected} />
              <div className="stack">
                <h3>{longDate(selected)}</h3>
                {dayLogs.length ? dayLogs.map((l) => (
                  <Link key={l.id} to={`/history/${l.id}`} className="card card-pad card-interactive stack-sm">
                    <div className="row between"><b>{l.title}</b>{l.prs.length > 0 && <Badge tone="accent" icon={Trophy}>{l.prs.length} {tr("PR")}</Badge>}</div>
                    <div className="grid-3 daystats"><div><span className="eyebrow">{tr("Duration")}</span><div className="num num-md">{Math.round(l.duration / 60)}<span className="unit">{tr("min")}</span></div></div><div><span className="eyebrow">{tr("Volume")}</span><div className="num num-md">{fmtNum(toDisplay(l.volume, unit))}<span className="unit">{unit}</span></div></div><div><span className="eyebrow">{tr("Exercises")}</span><div className="num num-md">{l.exercises}</div></div></div>
                  </Link>
                )) : <Card className="stack-sm"><p className="muted">{selected > dateKey() ? tr("A future day.") : tr("Rest day — no workout logged.")}</p></Card>}
              </div>
            </div>
          )}
          {tab === 'workouts' && <ul className="stack-sm">{state.history.map((l) => <li key={l.id}><WorkoutRow log={l} unit={unit} fmtVol={(v) => vol(v, unit)} /></li>)}</ul>}
          {tab === 'exercises' && (
            <Card className="stack-sm">{exercisesDone.map((s) => <ExerciseRow key={s.ex.id} exercise={s.ex} detail={`${s.sessions}×`} to={`/exercises/${s.ex.id}`} right={s.best && s.ex.repLabel === 'reps' && s.best.weight > 0 ? <Badge className="hide-mobile">{tr("Best")} {toDisplay(s.best.weight, unit)}×{s.best.reps}</Badge> : null} />)}</Card>
          )}
        </>
      )}
    </div>
  )
}

export function HistoryDetail() {
  const { logId } = useParams()
  const { state } = useApp()
  const start = useStartWorkout()
  const log = state.history.find((l) => l.id === logId)
  if (!log) return <EmptyState icon={CalendarDays} title={tr("Workout not found")} action={<Button to="/history">{tr("Back to history")}</Button>} />
  const unit = state.settings.unit
  const w = findWorkout(state, log.workoutId)
  return (
    <div className="stack-lg">
      <div>
        <BackLink to="/history">{tr("History")}</BackLink>
        <PageHeader eyebrow={longDate(log.date)} title={log.title} actions={w && <Button icon={Play} variant="primary" onClick={() => start(w)}>{tr("Repeat workout")}</Button>} />
      </div>
      <div className="grid-4">
        <MetricCard icon={Clock} label={tr("Duration")} value={Math.round(log.duration / 60)} unit={tr("min")} />
        <MetricCard icon={Flame} label={tr("Volume")} value={fmtNum(toDisplay(log.volume, unit))} unit={unit} />
        <MetricCard icon={Dumbbell} label={tr("Sets")} value={log.sets} hint={tr("{0} exercises", log.exercises)} />
        <MetricCard icon={Trophy} label={tr("PRs")} value={log.prs.length} hint={tr("{0} kcal est.", log.calories)} />
      </div>
      <div className="stack">
        {log.entries.map((e) => {
          const ex = findExercise(state, e.exerciseId)
          if (!ex) return null
          const pr = log.prs.find((p) => p.exerciseId === e.exerciseId)
          const showW = ex.repLabel === 'reps' && e.sets.some((s) => s.weight > 0)
          return (
            <Card key={e.exerciseId} className="stack-sm">
              <div className="row between"><Link to={`/exercises/${ex.id}`} className="link entry-title">{ex.name}</Link>{pr && <Badge tone="accent" icon={Trophy}>{tr("PR")}</Badge>}</div>
              <table className="rtable compact">
                <thead><tr><th>{tr("Set")}</th>{showW && <th>{tr("Weight")}</th>}<th>{ex.repLabel === 'reps' ? tr("Reps") : tr(ex.repLabel)}</th><th>{tr("RIR")}</th>{showW && <th>{tr("Volume")}</th>}</tr></thead>
                <tbody>{e.sets.map((s, i) => <tr key={i}><td data-label="Set" className="num">{i + 1}</td>{showW && <td data-label="Weight" className="num">{toDisplay(s.weight, unit)} {unit}</td>}<td data-label="Reps" className="num">{s.reps}</td><td data-label="RIR" className="num">{ex.repLabel === 'reps' ? s.rir : '—'}</td>{showW && <td data-label="Volume" className="num">{fmtNum(toDisplay(setVolume(ex, s), unit))}</td>}</tr>)}</tbody>
              </table>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
