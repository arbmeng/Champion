import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Dumbbell, Heart, Plus, Search, ShieldCheck, SlidersHorizontal, Timer, Wind } from 'lucide-react'
import { useApp } from '../state/store'
import { exerciseHistory, exerciseStats, findExercise, strengthSeries } from '../state/selectors'
import { DIFFICULTY, EQUIPMENT, MUSCLES, PATTERNS } from '../data/exercises'
import { Badge, BackLink, Button, Card, EmptyState, FilterChips, PageHeader, SearchField, Section, SectionTabs, SegmentedControl, Select } from '../ui/primitives'
import { ChartCard } from '../ui/domain'
import { ExerciseCard, FavoriteButton } from '../ui/domain'
import { MuscleMap } from '../ui/art'
import { TrendChart } from '../ui/charts'
import { Sheet } from '../ui/overlays'
import { CreateExerciseSheet, searchExercises, useAllExercises } from '../ui/pickers'
import { workoutsTabs } from '../ui/sections'
import { shortDate } from '../lib/dates'
import { fmtPct, fmtNum, toDisplay } from '../lib/format'
import { tr } from '../lib/i18n'

export function Exercises() {
  const { state, actions } = useApp()
  const all = useAllExercises()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [muscle, setMuscle] = useState(null)
  const [favOnly, setFavOnly] = useState(false)
  const [f, setF] = useState({ equipment: '', difficulty: '', pattern: '', type: '' })
  const [filters, setFilters] = useState(false)
  const [create, setCreate] = useState(false)
  const active = Object.values(f).filter(Boolean).length
  const results = useMemo(() => searchExercises(all, q, { muscle, ...f }).filter((e) => !favOnly || state.favorites.exercises.includes(e.id)), [all, q, muscle, f, favOnly, state.favorites.exercises])
  const browsing = !q && !muscle && !active && !favOnly
  const recent = state.recent.exercises.map((id) => findExercise(state, id)).filter(Boolean).slice(0, 6)
  const favs = state.favorites.exercises.map((id) => findExercise(state, id)).filter(Boolean)
  const opt = (label, list) => [{ value: '', label: tr(label) }, ...list.map((x) => ({ value: x, label: tr(x) }))]

  useEffect(() => {
    const t = setTimeout(() => { if (q.trim().length >= 3) actions.search(q) }, 900)
    return () => clearTimeout(t)
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  const card = (e) => <ExerciseCard key={e.id} exercise={e} fav={state.favorites.exercises.includes(e.id)} onFav={() => actions.favorite('exercises', e.id)} onClick={() => actions.viewed(e.id)} />

  return (
    <div className="stack-lg">
      <PageHeader eyebrow={tr("Encyclopedia")} title={tr("Exercises")} subtitle={tr("{0} movements with technique, muscles and your own history.", all.length)} actions={<Button icon={Plus} onClick={() => setCreate(true)}>{tr("Create exercise")}</Button>} />
      <SectionTabs items={workoutsTabs} />
      <div className="stack">
        <div className="row gap-2">
          <SearchField className="grow" value={q} onChange={(v) => { setQ(v); if (params.get('q')) setParams({}, { replace: true }) }} placeholder={tr("Search exercises, muscles, equipment")} onSubmit={actions.search} />
          <Button icon={SlidersHorizontal} onClick={() => setFilters(true)}>{tr("Filters")}{active > 0 && <Badge tone="accent">{active}</Badge>}</Button>
        </div>
        <div className="row gap-2">
          <button type="button" className={`chip ${favOnly ? 'is-active' : ''}`} aria-pressed={favOnly} onClick={() => setFavOnly(!favOnly)}><Heart size={13} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> {tr("Favorites")}</button>
          <FilterChips options={MUSCLES} value={muscle} onChange={setMuscle} label={tr("Muscle group")} />
        </div>
        {!q && state.recent.searches.length > 0 && (
          <div className="row gap-2 wrap"><span className="caption">{tr("Recent searches")}</span>{state.recent.searches.map((s) => <button key={s} type="button" className="chip chip-sm" onClick={() => setQ(s)}>{s}</button>)}<button type="button" className="link caption" onClick={actions.clearSearches}>{tr("Clear")}</button></div>
        )}
      </div>

      {browsing && recent.length > 0 && <Section title={tr("Recently viewed")}><div className="grid-auto">{recent.slice(0, 3).map(card)}</div></Section>}
      {browsing && favs.length > 0 && <Section title={tr("Favorites")}><div className="grid-auto">{favs.slice(0, 6).map(card)}</div></Section>}

      <Section title={browsing ? tr("All exercises") : (results.length === 1 ? tr('1 result') : tr('{0} results', results.length))}>
        {results.length ? <div className="grid-auto">{results.map(card)}</div> : favOnly && !q ? (
          <EmptyState icon={Heart} title={tr("No favorite exercises")} body={tr("Tap the heart on any exercise to keep it close.")} action={<Button onClick={() => setFavOnly(false)}>{tr("Browse all exercises")}</Button>} />
        ) : (
          <EmptyState icon={Search} title={q ? tr('Nothing found for “{0}”', q) : tr('Nothing found')} body={tr("Try a muscle name, equipment, or create your own exercise.")} action={<div className="row gap-2"><Button onClick={() => { setQ(''); setMuscle(null); setF({ equipment: '', difficulty: '', pattern: '', type: '' }) }}>{tr("Clear filters")}</Button><Button variant="primary" icon={Plus} onClick={() => setCreate(true)}>{tr("Create exercise")}</Button></div>} />
        )}
      </Section>

      <Sheet open={filters} onClose={() => setFilters(false)} title={tr("Filter exercises")} footer={<div className="row gap-2"><Button block onClick={() => setF({ equipment: '', difficulty: '', pattern: '', type: '' })}>{tr("Reset")}</Button><Button block variant="primary" onClick={() => setFilters(false)}>{tr("Show")} {results.length}</Button></div>}>
        <div className="grid-2">
          <Select label={tr("Equipment")} options={opt('Any equipment', EQUIPMENT)} value={f.equipment} onChange={(v) => setF({ ...f, equipment: v })} />
          <Select label={tr("Difficulty")} options={opt('Any level', DIFFICULTY)} value={f.difficulty} onChange={(v) => setF({ ...f, difficulty: v })} />
          <Select label={tr("Movement pattern")} options={opt('Any movement', PATTERNS)} value={f.pattern} onChange={(v) => setF({ ...f, pattern: v })} />
          <Select label={tr("Type")} options={opt('Any type', ['Compound', 'Isolation', 'Bodyweight', 'Conditioning', 'Cardio', 'Mobility'])} value={f.type} onChange={(v) => setF({ ...f, type: v })} />
        </div>
      </Sheet>
      <CreateExerciseSheet open={create} onClose={() => setCreate(false)} />
    </div>
  )
}

const RANGES = [{ id: '1', label: tr("1M") }, { id: '3', label: tr("3M") }, { id: '6', label: tr("6M") }, { id: '12', label: tr("1Y") }]

export function ExerciseDetail() {
  const { id } = useParams()
  const { state, actions } = useApp()
  const ex = findExercise(state, id)
  const [range, setRange] = useState('6')
  useEffect(() => { if (ex) actions.viewed(ex.id) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!ex) return <EmptyState icon={Dumbbell} title={tr("Exercise not found")} body={tr("It may have been removed.")} action={<Button to="/exercises">{tr("Back to exercises")}</Button>} />
  const unit = state.settings.unit
  const st = exerciseStats(state, id)
  const series = strengthSeries(state, id, Number(range))
  const hist = exerciseHistory(state, id)
  const first = series[0]?.e1rm
  const lastV = series[series.length - 1]?.e1rm
  const change = first && lastV ? ((lastV - first) / first) * 100 : null
  const fav = state.favorites.exercises.includes(id)
  const timeBased = ex.repLabel !== 'reps'
  const unitLabel = timeBased ? tr(ex.repLabel) : unit

  return (
    <div className="stack-lg">
      <div>
        <BackLink to="/exercises">{tr("Exercises")}</BackLink>
        <div className="row-top between">
          <div className="grow stack-sm">
            <div className="row gap-2 wrap"><Badge tone="accent">{tr(ex.muscle)}</Badge><Badge>{tr(ex.type)}</Badge><Badge tone={ex.difficulty === 'Advanced' ? 'warning' : 'neutral'}>{tr(ex.difficulty)}</Badge></div>
            <h1>{ex.name}</h1>
          </div>
          <FavoriteButton plain active={fav} onClick={() => actions.favorite('exercises', id)} label={ex.name} />
        </div>
      </div>

      <div className="detail-cols">
        <div className="stack-lg">
          <Card className="demo" pad={false}>
            <div className="demo-stage">
              <MuscleMap primary={[ex.muscle]} secondary={ex.secondary} view="both" height={230} />
              <div className="demo-rom" aria-hidden="true"><span className="demo-rail" /><span className="demo-dot" style={{ animationDuration: `${ex.pattern === 'Mobility' ? 5 : 3}s` }} /></div>
            </div>
            <div className="demo-caption caption"><b>{tr('Movement guide')}</b> · {tr('The dot shows the controlled path and tempo ({0}). Video demonstrations are not bundled in this prototype — follow the step-by-step technique below.', ex.tempo.split(' ')[0])}</div>
          </Card>

          <Section title={tr("Technique")}>
            <Card><ol className="steps">{ex.tech.map((t, i) => <li key={i}><span className="num">{i + 1}</span><p>{t}</p></li>)}</ol></Card>
          </Section>

          <div className="grid-2">
            <Card className="stack-sm"><h3 className="row gap-2"><AlertTriangle size={17} className="warn" aria-hidden="true" /> {tr("Common mistakes")}</h3><ul className="bullets">{ex.mistakes.map((m) => <li key={m}>{m}</li>)}</ul></Card>
            <Card className="stack-sm"><h3 className="row gap-2"><ShieldCheck size={17} className="pos" aria-hidden="true" /> {tr("Safety")}</h3><p className="muted">{ex.safety}</p></Card>
            <Card className="stack-sm"><h3 className="row gap-2"><Dumbbell size={17} aria-hidden="true" /> {tr("Range of motion")}</h3><p className="muted">{ex.rom}</p></Card>
            <Card className="stack-sm"><h3 className="row gap-2"><Timer size={17} aria-hidden="true" /> {tr("Tempo")}</h3><p className="muted">{ex.tempo}</p></Card>
            <Card className="stack-sm"><h3 className="row gap-2"><Wind size={17} aria-hidden="true" /> {tr("Breathing")}</h3><p className="muted">{ex.breathing}</p></Card>
            <Card className="stack-sm"><h3>{tr("Training notes")}</h3><p className="muted">{ex.tip}</p><p className="caption">{tr('Suggested: {0} sets × {1}–{2} {3}, rest {4} min.', ex.sets, ex.reps[0], ex.reps[1], tr(ex.repLabel), Math.round(ex.rest / 60 * 10) / 10)}</p></Card>
          </div>
        </div>

        <div className="stack">
          <Card className="stack-sm">
            <h3>{tr("Target muscles")}</h3>
            <div className="row gap-2 wrap"><Badge tone="accent">{tr('Primary · {0}', tr(ex.muscle))}</Badge>{ex.secondary.map((m) => <Badge key={m}>{tr('Secondary · {0}', tr(m))}</Badge>)}</div>
            <div className="row gap-2"><span className="caption">{tr("Equipment")}</span><Badge>{tr(ex.equipment)}</Badge><span className="caption">{tr("Pattern")}</span><Badge>{tr(ex.pattern)}</Badge></div>
          </Card>

          <Card className="stack perf">
            <div className="row between"><h3>{tr("Your performance")}</h3>{st.sessions > 0 && <span className="caption">{st.sessions} {tr("sessions")}</span>}</div>
            {st.sessions ? (
              <div className="grid-3 perf-grid">
                <div><span className="eyebrow">{tr("Best")}</span><div className="num num-md">{timeBased ? st.best.reps : toDisplay(st.best.weight, unit)}<span className="unit">{timeBased ? tr(ex.repLabel) : `${unit} × ${st.best.reps}`}</span></div></div>
                <div><span className="eyebrow">{tr("Last")}</span><div className="num num-md">{timeBased ? st.lastTop.reps : toDisplay(st.lastTop.weight, unit)}<span className="unit">{timeBased ? tr(ex.repLabel) : `${unit} × ${st.lastTop.reps}`}</span></div></div>
                <div><span className="eyebrow">{tr("Personal record")}</span><div className="num num-md accent">{timeBased ? st.heaviest.reps : toDisplay(st.heaviest.weight, unit)}<span className="unit">{unitLabel}</span></div></div>
              </div>
            ) : <p className="muted">{tr("No logged sets yet. Add this exercise to a workout to start tracking it.")}</p>}
          </Card>

          {ex.repLabel === 'reps' && st.sessions > 1 && (
            <ChartCard title={tr("Progress")} question={tr("Am I getting stronger on this lift?")} right={<SegmentedControl size="sm" label={tr("Time range")} items={RANGES} value={range} onChange={setRange} />} foot={change != null ? tr("Estimated 1RM {0} over this period (Epley estimate, not a measured max).", fmtPct(change, 1)) : tr("Not enough sessions in this range.")}>
              {series.length > 1 ? <TrendChart data={series.map((s) => ({ ...s, e1rm: toDisplay(s.e1rm, unit) }))} y="e1rm" unit={tr("{0} est. 1RM", unit)} height={200} label={tr("Estimated one-rep max for {0}", ex.name)} /> : <EmptyState compact icon={Dumbbell} title={tr("Not enough data")} body={tr("Log more sessions in this range to see a trend.")} />}
            </ChartCard>
          )}
        </div>
      </div>

      {hist.length > 0 && (
        <Section title={tr("Exercise history")} eyebrow={tr("Every session")}>
          <Card pad={false}>
            <table className="rtable">
              <thead><tr><th>{tr("Date")}</th><th>{tr("Weight")}</th><th>{tr("Reps")}</th><th>{tr("Sets")}</th><th>{tr("RIR")}</th><th>{tr("Volume")}</th></tr></thead>
              <tbody>
                {hist.slice(0, 12).map((h) => {
                  const top = h.sets.reduce((b, s) => (s.weight > b.weight || (s.weight === b.weight && s.reps > b.reps) ? s : b), h.sets[0])
                  const vol = h.sets.reduce((n, s) => n + s.weight * s.reps, 0)
                  const rir = Math.round((h.sets.reduce((n, s) => n + (s.rir ?? 0), 0) / h.sets.length) * 10) / 10
                  return (
                    <tr key={h.logId}>
                      <td data-label="Date"><Link className="link" to={`/history/${h.logId}`}>{shortDate(h.date)}</Link></td>
                      <td data-label="Weight" className="num">{timeBased ? '—' : `${toDisplay(top.weight, unit)} ${unit}`}</td>
                      <td data-label="Reps" className="num">{h.sets.map((s) => s.reps).join(', ')}</td>
                      <td data-label="Sets" className="num">{h.sets.length}</td>
                      <td data-label="RIR" className="num">{rir}</td>
                      <td data-label="Volume" className="num">{vol ? `${fmtNum(toDisplay(vol, unit))} ${unit}` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        </Section>
      )}
    </div>
  )
}
