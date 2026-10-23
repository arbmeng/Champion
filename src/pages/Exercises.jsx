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
  const opt = (label, list) => [{ value: '', label }, ...list.map((x) => ({ value: x, label: x }))]

  useEffect(() => {
    const t = setTimeout(() => { if (q.trim().length >= 3) actions.search(q) }, 900)
    return () => clearTimeout(t)
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  const card = (e) => <ExerciseCard key={e.id} exercise={e} fav={state.favorites.exercises.includes(e.id)} onFav={() => actions.favorite('exercises', e.id)} onClick={() => actions.viewed(e.id)} />

  return (
    <div className="stack-lg">
      <PageHeader eyebrow="Encyclopedia" title="Exercises" subtitle={`${all.length} movements with technique, muscles and your own history.`} actions={<Button icon={Plus} onClick={() => setCreate(true)}>Create exercise</Button>} />
      <SectionTabs items={workoutsTabs} />
      <div className="stack">
        <div className="row gap-2">
          <SearchField className="grow" value={q} onChange={(v) => { setQ(v); if (params.get('q')) setParams({}, { replace: true }) }} placeholder="Search exercises, muscles, equipment" onSubmit={actions.search} />
          <Button icon={SlidersHorizontal} onClick={() => setFilters(true)}>Filters{active > 0 && <Badge tone="accent">{active}</Badge>}</Button>
        </div>
        <div className="row gap-2">
          <button type="button" className={`chip ${favOnly ? 'is-active' : ''}`} aria-pressed={favOnly} onClick={() => setFavOnly(!favOnly)}><Heart size={13} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> Favorites</button>
          <FilterChips options={MUSCLES} value={muscle} onChange={setMuscle} label="Muscle group" />
        </div>
        {!q && state.recent.searches.length > 0 && (
          <div className="row gap-2 wrap"><span className="caption">Recent searches</span>{state.recent.searches.map((s) => <button key={s} type="button" className="chip chip-sm" onClick={() => setQ(s)}>{s}</button>)}<button type="button" className="link caption" onClick={actions.clearSearches}>Clear</button></div>
        )}
      </div>

      {browsing && recent.length > 0 && <Section title="Recently viewed"><div className="grid-auto">{recent.slice(0, 3).map(card)}</div></Section>}
      {browsing && favs.length > 0 && <Section title="Favorites"><div className="grid-auto">{favs.slice(0, 6).map(card)}</div></Section>}

      <Section title={browsing ? 'All exercises' : `${results.length} ${results.length === 1 ? 'result' : 'results'}`}>
        {results.length ? <div className="grid-auto">{results.map(card)}</div> : favOnly && !q ? (
          <EmptyState icon={Heart} title="No favorite exercises" body="Tap the heart on any exercise to keep it close." action={<Button onClick={() => setFavOnly(false)}>Browse all exercises</Button>} />
        ) : (
          <EmptyState icon={Search} title={`Nothing found${q ? ` for “${q}”` : ''}`} body="Try a muscle name, equipment, or create your own exercise." action={<div className="row gap-2"><Button onClick={() => { setQ(''); setMuscle(null); setF({ equipment: '', difficulty: '', pattern: '', type: '' }) }}>Clear filters</Button><Button variant="primary" icon={Plus} onClick={() => setCreate(true)}>Create exercise</Button></div>} />
        )}
      </Section>

      <Sheet open={filters} onClose={() => setFilters(false)} title="Filter exercises" footer={<div className="row gap-2"><Button block onClick={() => setF({ equipment: '', difficulty: '', pattern: '', type: '' })}>Reset</Button><Button block variant="primary" onClick={() => setFilters(false)}>Show {results.length}</Button></div>}>
        <div className="grid-2">
          <Select label="Equipment" options={opt('Any equipment', EQUIPMENT)} value={f.equipment} onChange={(v) => setF({ ...f, equipment: v })} />
          <Select label="Difficulty" options={opt('Any level', DIFFICULTY)} value={f.difficulty} onChange={(v) => setF({ ...f, difficulty: v })} />
          <Select label="Movement pattern" options={opt('Any movement', PATTERNS)} value={f.pattern} onChange={(v) => setF({ ...f, pattern: v })} />
          <Select label="Type" options={opt('Any type', ['Compound', 'Isolation', 'Bodyweight', 'Conditioning', 'Cardio', 'Mobility'])} value={f.type} onChange={(v) => setF({ ...f, type: v })} />
        </div>
      </Sheet>
      <CreateExerciseSheet open={create} onClose={() => setCreate(false)} />
    </div>
  )
}

const RANGES = [{ id: '1', label: '1M' }, { id: '3', label: '3M' }, { id: '6', label: '6M' }, { id: '12', label: '1Y' }]

export function ExerciseDetail() {
  const { id } = useParams()
  const { state, actions } = useApp()
  const ex = findExercise(state, id)
  const [range, setRange] = useState('6')
  useEffect(() => { if (ex) actions.viewed(ex.id) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!ex) return <EmptyState icon={Dumbbell} title="Exercise not found" body="It may have been removed." action={<Button to="/exercises">Back to exercises</Button>} />
  const unit = state.settings.unit
  const st = exerciseStats(state, id)
  const series = strengthSeries(state, id, Number(range))
  const hist = exerciseHistory(state, id)
  const first = series[0]?.e1rm
  const lastV = series[series.length - 1]?.e1rm
  const change = first && lastV ? ((lastV - first) / first) * 100 : null
  const fav = state.favorites.exercises.includes(id)
  const timeBased = ex.repLabel !== 'reps'
  const unitLabel = timeBased ? ex.repLabel : unit

  return (
    <div className="stack-lg">
      <div>
        <BackLink to="/exercises">Exercises</BackLink>
        <div className="row-top between">
          <div className="grow stack-sm">
            <div className="row gap-2 wrap"><Badge tone="accent">{ex.muscle}</Badge><Badge>{ex.type}</Badge><Badge tone={ex.difficulty === 'Advanced' ? 'warning' : 'neutral'}>{ex.difficulty}</Badge></div>
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

          <Section title="Technique">
            <Card><ol className="steps">{ex.tech.map((t, i) => <li key={i}><span className="num">{i + 1}</span><p>{t}</p></li>)}</ol></Card>
          </Section>

          <div className="grid-2">
            <Card className="stack-sm"><h3 className="row gap-2"><AlertTriangle size={17} className="warn" aria-hidden="true" /> Common mistakes</h3><ul className="bullets">{ex.mistakes.map((m) => <li key={m}>{m}</li>)}</ul></Card>
            <Card className="stack-sm"><h3 className="row gap-2"><ShieldCheck size={17} className="pos" aria-hidden="true" /> Safety</h3><p className="muted">{ex.safety}</p></Card>
            <Card className="stack-sm"><h3 className="row gap-2"><Dumbbell size={17} aria-hidden="true" /> Range of motion</h3><p className="muted">{ex.rom}</p></Card>
            <Card className="stack-sm"><h3 className="row gap-2"><Timer size={17} aria-hidden="true" /> Tempo</h3><p className="muted">{ex.tempo}</p></Card>
            <Card className="stack-sm"><h3 className="row gap-2"><Wind size={17} aria-hidden="true" /> Breathing</h3><p className="muted">{ex.breathing}</p></Card>
            <Card className="stack-sm"><h3>Training notes</h3><p className="muted">{ex.tip}</p><p className="caption">{tr('Suggested: {0} sets × {1}–{2} {3}, rest {4} min.', ex.sets, ex.reps[0], ex.reps[1], tr(ex.repLabel), Math.round(ex.rest / 60 * 10) / 10)}</p></Card>
          </div>
        </div>

        <div className="stack">
          <Card className="stack-sm">
            <h3>Target muscles</h3>
            <div className="row gap-2 wrap"><Badge tone="accent">{tr('Primary · {0}', tr(ex.muscle))}</Badge>{ex.secondary.map((m) => <Badge key={m}>{tr('Secondary · {0}', tr(m))}</Badge>)}</div>
            <div className="row gap-2"><span className="caption">Equipment</span><Badge>{ex.equipment}</Badge><span className="caption">Pattern</span><Badge>{ex.pattern}</Badge></div>
          </Card>

          <Card className="stack perf">
            <div className="row between"><h3>Your performance</h3>{st.sessions > 0 && <span className="caption">{st.sessions} sessions</span>}</div>
            {st.sessions ? (
              <div className="grid-3 perf-grid">
                <div><span className="eyebrow">Best</span><div className="num num-md">{timeBased ? st.best.reps : toDisplay(st.best.weight, unit)}<span className="unit">{timeBased ? ex.repLabel : `${unit} × ${st.best.reps}`}</span></div></div>
                <div><span className="eyebrow">Last</span><div className="num num-md">{timeBased ? st.lastTop.reps : toDisplay(st.lastTop.weight, unit)}<span className="unit">{timeBased ? ex.repLabel : `${unit} × ${st.lastTop.reps}`}</span></div></div>
                <div><span className="eyebrow">Personal record</span><div className="num num-md accent">{timeBased ? st.heaviest.reps : toDisplay(st.heaviest.weight, unit)}<span className="unit">{unitLabel}</span></div></div>
              </div>
            ) : <p className="muted">No logged sets yet. Add this exercise to a workout to start tracking it.</p>}
          </Card>

          {ex.repLabel === 'reps' && st.sessions > 1 && (
            <ChartCard title="Progress" question="Am I getting stronger on this lift?" right={<SegmentedControl size="sm" label="Time range" items={RANGES} value={range} onChange={setRange} />} foot={change != null ? `Estimated 1RM ${fmtPct(change, 1)} over this period (Epley estimate, not a measured max).` : 'Not enough sessions in this range.'}>
              {series.length > 1 ? <TrendChart data={series.map((s) => ({ ...s, e1rm: toDisplay(s.e1rm, unit) }))} y="e1rm" unit={`${unit} est. 1RM`} height={200} label={`Estimated one-rep max for ${ex.name}`} /> : <EmptyState compact icon={Dumbbell} title="Not enough data" body="Log more sessions in this range to see a trend." />}
            </ChartCard>
          )}
        </div>
      </div>

      {hist.length > 0 && (
        <Section title="Exercise history" eyebrow="Every session">
          <Card pad={false}>
            <table className="rtable">
              <thead><tr><th>Date</th><th>Weight</th><th>Reps</th><th>Sets</th><th>RIR</th><th>Volume</th></tr></thead>
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
