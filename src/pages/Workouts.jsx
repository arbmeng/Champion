import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Bookmark, Clock, Dumbbell, Flame, Minus, Play, Plus, SlidersHorizontal, Trash2 } from 'lucide-react'
import { useApp } from '../state/store'
import { allWorkouts, exerciseStats, findExercise, findWorkout, recommendations } from '../state/selectors'
import { CATEGORIES, GOALS, TRAINERS } from '../data/workouts'
import { EQUIPMENT, MUSCLES } from '../data/exercises'
import { Badge, BackLink, Button, Card, EmptyState, FilterChips, IconButton, Input, PageHeader, SearchField, Section, SectionTabs, Select } from '../ui/primitives'
import { Cover, MuscleMap } from '../ui/art'
import { ExerciseRow, WorkoutCard } from '../ui/domain'
import { ConfirmSheet, Sheet, useToast } from '../ui/overlays'
import { ExercisePicker } from '../ui/pickers'
import { workoutsTabs } from '../ui/sections'
import { useStartWorkout } from '../lib/useStart'
import { shortDate } from '../lib/dates'
import { clamp } from '../lib/format'
import { tr } from '../lib/i18n'

const DURATIONS = { 'Under 30 min': (m) => m < 30, '30–45 min': (m) => m >= 30 && m <= 45, '45–60 min': (m) => m > 45 && m <= 60, '60+ min': (m) => m > 60 }
const repText = (r) => (r[0] === r[1] ? `${r[0]}` : `${r[0]}–${r[1]}`)

export function Workouts() {
  const { state, actions } = useApp()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState(params.get('cat'))
  const [f, setF] = useState({ goal: '', muscle: '', equipment: '', level: '', duration: '', trainer: '', place: '' })
  const [filters, setFilters] = useState(false)
  const all = allWorkouts(state)
  const active = Object.values(f).filter(Boolean).length
  const chips = [...CATEGORIES, 'Saved', 'Custom']
  const setCategory = (c) => { setCat(c); setParams(c ? { cat: c } : {}, { replace: true }) }

  const results = useMemo(() => all.filter((w) => {
    if (cat === 'Saved' && !state.favorites.workouts.includes(w.id)) return false
    if (cat === 'Custom' && !w.custom) return false
    if (cat && !['Saved', 'Custom'].includes(cat) && !w.categories.includes(cat)) return false
    if (f.goal && w.goal !== f.goal) return false
    if (f.muscle && !w.muscles.includes(f.muscle)) return false
    if (f.equipment && !w.equipment.includes(f.equipment)) return false
    if (f.level && w.level !== f.level) return false
    if (f.duration && !DURATIONS[f.duration](w.minutes)) return false
    if (f.trainer && w.trainer !== f.trainer) return false
    if (f.place && w.place !== f.place) return false
    if (q && !`${w.title} ${w.description} ${w.categories.join(' ')} ${w.muscles.join(' ')} ${w.trainer}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  }), [all, cat, f, q, state.favorites.workouts])

  const browsing = !cat && !active && !q
  const recs = recommendations(state).filter((r) => r.kind === 'workout')
  const saved = all.filter((w) => state.favorites.workouts.includes(w.id))
  const opt = (label, list) => [{ value: '', label: tr(label) }, ...list.map((x) => ({ value: x, label: tr(x) }))]
  const card = (w) => <WorkoutCard key={w.id} workout={w} saved={state.favorites.workouts.includes(w.id)} onSave={() => actions.favorite('workouts', w.id)} />

  return (
    <div className="stack-lg">
      <PageHeader eyebrow={tr("Library")} title={tr("Workouts")} subtitle={tr("Find a session for any goal, place or time budget.")} actions={<Button variant="primary" icon={Plus} to="/workouts/new">{tr("Create workout")}</Button>} />
      <SectionTabs items={workoutsTabs} />
      <div className="stack">
        <div className="row gap-2">
          <SearchField className="grow" value={q} onChange={setQ} placeholder={tr("Search workouts, muscles, trainers")} />
          <Button icon={SlidersHorizontal} onClick={() => setFilters(true)} aria-label={tr("Filters")}>{tr("Filters")}{active > 0 && <Badge tone="accent">{active}</Badge>}</Button>
        </div>
        <FilterChips options={chips} value={cat} onChange={setCategory} label={tr("Categories")} />
      </div>

      {browsing && recs.length > 0 && (
        <Section title={tr("Recommended for you")} eyebrow={tr("Matched to your week")}>
          <div className="grid-auto">{recs.map((r) => <div key={r.id} className="stack-sm">{card(r.workout)}<p className="caption rec-reason">{r.reason}</p></div>)}</div>
        </Section>
      )}
      {browsing && saved.length > 0 && <Section title={tr("Saved")}><div className="grid-auto">{saved.map(card)}</div></Section>}
      <Section title={browsing ? tr("All workouts") : (results.length === 1 ? tr('1 workout') : tr('{0} workouts', results.length))} action={(active > 0 || cat || q) ? <button type="button" className="link caption" onClick={() => { setF({ goal: '', muscle: '', equipment: '', level: '', duration: '', trainer: '', place: '' }); setCategory(null); setQ('') }}>{tr("Clear all")}</button> : null}>
        {results.length ? <div className="grid-auto">{results.map(card)}</div> : (
          cat === 'Saved' ? <EmptyState icon={Bookmark} title={tr("No saved workouts")} body={tr("Tap the bookmark on any workout to keep it here.")} action={<Button onClick={() => setCategory(null)}>{tr("Browse all")}</Button>} />
            : cat === 'Custom' ? <EmptyState icon={Dumbbell} title={tr("No custom workouts yet")} body={tr("Build your own session from the exercise library.")} action={<Button variant="primary" to="/workouts/new">{tr("Create workout")}</Button>} />
              : <EmptyState icon={Dumbbell} title={tr("No workouts match")} body={tr("Try removing a filter or searching for a different muscle.")} action={<Button onClick={() => { setF({ goal: '', muscle: '', equipment: '', level: '', duration: '', trainer: '', place: '' }); setCategory(null); setQ('') }}>{tr("Clear filters")}</Button>} />
        )}
      </Section>

      <Sheet open={filters} onClose={() => setFilters(false)} title={tr("Filter workouts")} footer={<div className="row gap-2"><Button block onClick={() => setF({ goal: '', muscle: '', equipment: '', level: '', duration: '', trainer: '', place: '' })}>{tr("Reset")}</Button><Button block variant="primary" onClick={() => setFilters(false)}>{tr("Show")} {results.length}</Button></div>}>
        <div className="grid-2">
          <Select label={tr("Goal")} options={opt('Any goal', GOALS)} value={f.goal} onChange={(v) => setF({ ...f, goal: v })} />
          <Select label={tr("Muscle")} options={opt('Any muscle', MUSCLES)} value={f.muscle} onChange={(v) => setF({ ...f, muscle: v })} />
          <Select label={tr("Equipment")} options={opt('Any equipment', EQUIPMENT)} value={f.equipment} onChange={(v) => setF({ ...f, equipment: v })} />
          <Select label={tr("Difficulty")} options={opt('Any level', ['Beginner', 'Intermediate', 'Advanced'])} value={f.level} onChange={(v) => setF({ ...f, level: v })} />
          <Select label={tr("Duration")} options={opt('Any length', Object.keys(DURATIONS))} value={f.duration} onChange={(v) => setF({ ...f, duration: v })} />
          <Select label={tr("Trainer")} options={opt('Any trainer', TRAINERS)} value={f.trainer} onChange={(v) => setF({ ...f, trainer: v })} />
          <Select label={tr("Where")} options={opt('Gym or home', ['Gym', 'Home'])} value={f.place} onChange={(v) => setF({ ...f, place: v })} />
        </div>
      </Sheet>
    </div>
  )
}

export function WorkoutDetail() {
  const { id } = useParams()
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const toast = useToast()
  const start = useStartWorkout()
  const [del, setDel] = useState(false)
  const w = findWorkout(state, id)
  if (!w) return <EmptyState icon={Dumbbell} title={tr("Workout not found")} body={tr("It may have been deleted.")} action={<Button to="/workouts">{tr("Back to workouts")}</Button>} />
  const saved = state.favorites.workouts.includes(w.id)
  const last = state.history.find((l) => l.workoutId === w.id)
  const sets = w.exercises.reduce((n, e) => n + e.sets, 0)
  const primary = w.muscles.slice(0, 4)

  return (
    <div className="stack-lg">
      <div>
        <BackLink to="/workouts">{tr("Workouts")}</BackLink>
        <Cover hue={w.hue} seed={w.exercises.length} className="course-hero">
          <div className="course-hero-inner">
            <div className="row gap-2 wrap">{w.categories.map((c) => <Badge key={c} tone="glass">{tr(c)}</Badge>)}<Badge tone="glass">{tr(w.level)}</Badge></div>
            <div className="stack-sm"><h1 className="course-title">{w.title}</h1><p className="course-desc">{w.description}</p></div>
            <div className="row gap-4 wrap course-meta"><span><Clock size={14} aria-hidden="true" /> {w.minutes} {tr("min")}</span><span><Dumbbell size={14} aria-hidden="true" /> {tr("{0} exercises · {1} sets", w.exercises.length, sets)}</span><span><Flame size={14} aria-hidden="true" /> ~{w.calories} {tr("kcal")}</span><span>{w.trainerName || tr(w.trainer)}</span></div>
            <div className="row gap-2 wrap">
              <Button variant="primary" size="xl" icon={Play} onClick={() => start(w)}>{tr("Start workout")}</Button>
              <Button variant="glass" size="lg" icon={Bookmark} aria-pressed={saved} onClick={() => { actions.favorite('workouts', w.id); toast({ title: saved ? tr("Removed from saved") : tr("Saved workout"), tone: 'success' }) }}>{saved ? tr("Saved") : tr("Save")}</Button>
            </div>
          </div>
        </Cover>
      </div>

      <div className="detail-cols">
        <Section title={tr("Exercises")} eyebrow={tr("{0} movements", w.exercises.length)}>
          <Card className="stack-sm">
            {w.exercises.map((it, i) => {
              const ex = findExercise(state, it.exerciseId)
              const st = exerciseStats(state, it.exerciseId)
              return <ExerciseRow key={it.exerciseId + i} index={i + 1} exercise={ex} detail={`${it.sets} × ${repText(it.reps)}${ex.repLabel !== 'reps' ? ` ${tr(ex.repLabel)}` : ''}`} to={`/exercises/${ex.id}`} right={st.lastTop && ex.weighted ? <Badge className="hide-mobile">{tr("Last")} {st.lastTop.weight}×{st.lastTop.reps}</Badge> : null} />
            })}
          </Card>
        </Section>
        <div className="stack">
          <Card className="stack"><h3>{tr("Target muscles")}</h3><div className="row gap-4"><MuscleMap primary={primary} view="both" height={150} /><ul className="stack-sm">{w.muscles.map((m) => <li key={m} className="row gap-2"><span className="dot" aria-hidden="true" />{tr(m)}</li>)}</ul></div></Card>
          <Card className="stack-sm"><h3>{tr("Equipment")}</h3><div className="row wrap gap-2">{w.equipment.map((e) => <Badge key={e}>{tr(e)}</Badge>)}</div></Card>
          <Card className="stack-sm"><h3>{tr("Your history")}</h3>{last ? <p className="muted">{tr('Last done {0} · {1} min · {2} sets.', shortDate(last.date), Math.round(last.duration / 60), last.sets)}</p> : <p className="muted">{tr("You haven’t done this workout yet.")}</p>}</Card>
          {w.custom && <Button variant="danger" icon={Trash2} onClick={() => setDel(true)}>{tr("Delete workout")}</Button>}
        </div>
      </div>
      <ConfirmSheet open={del} onClose={() => setDel(false)} tone="danger" title={tr("Delete this workout?")} body={tr("Past sessions that used it stay in your history.")} confirmLabel={tr("Delete")} onConfirm={() => { actions.deleteWorkout(w.id); toast({ title: tr("Workout deleted") }); navigate('/workouts') }} />
    </div>
  )
}

export function WorkoutBuilder() {
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const toast = useToast()
  const start = useStartWorkout()
  const [title, setTitle] = useState('')
  const [items, setItems] = useState([])
  const [picker, setPicker] = useState(false)
  const [err, setErr] = useState('')
  const move = (i, d) => setItems((l) => { const n = [...l]; const j = i + d; if (j < 0 || j >= n.length) return l; [n[i], n[j]] = [n[j], n[i]]; return n })
  const patch = (i, p) => setItems((l) => l.map((x, idx) => (idx === i ? { ...x, ...p } : x)))
  const save = (andStart) => {
    if (title.trim().length < 2) { setErr('Name your workout.'); return }
    if (!items.length) { setErr('Add at least one exercise.'); return }
    const w = actions.saveWorkout({ title: title.trim(), items: items.map((x) => ({ exerciseId: x.exerciseId, sets: x.sets, reps: x.reps })) })
    toast({ title: tr("Workout saved"), body: w.title, tone: 'success' })
    if (andStart) { start({ ...w, ...{} }) } else navigate(`/workouts/${w.id}`)
  }
  const totalSets = items.reduce((n, x) => n + x.sets, 0)
  return (
    <div className="stack-lg builder">
      <div><BackLink to="/workouts">{tr("Workouts")}</BackLink><PageHeader eyebrow={tr("Custom")} title={tr("Create workout")} subtitle={tr("Pick exercises, set targets, then save or start straight away.")} /></div>
      <Input label={tr("Workout name")} value={title} onChange={(e) => { setTitle(e.target.value); setErr('') }} placeholder={tr("e.g. Saturday Arms & Shoulders")} error={err} />
      <Section title={tr("Exercises")} eyebrow={tr("{0} added · {1} sets", items.length, totalSets)} action={<Button icon={Plus} size="sm" onClick={() => setPicker(true)}>{tr("Add exercise")}</Button>}>
        {items.length ? (
          <ul className="stack-sm">
            {items.map((it, i) => {
              const ex = findExercise(state, it.exerciseId)
              return (
                <li key={it.key}><Card className="stack-sm">
                  <div className="row gap-2"><span className="erow-index num">{String(i + 1).padStart(2, '0')}</span><div className="grow"><b>{ex.name}</b><div className="caption">{tr(ex.muscle)} · {tr(ex.equipment)}</div></div>
                    <IconButton size="sm" label={tr("Move up")} icon={ArrowUp} onClick={() => move(i, -1)} disabled={i === 0} /><IconButton size="sm" label={tr("Move down")} icon={ArrowDown} onClick={() => move(i, 1)} disabled={i === items.length - 1} /><IconButton size="sm" label={tr("Remove {0}", ex.name)} icon={Trash2} onClick={() => setItems((l) => l.filter((_, idx) => idx !== i))} /></div>
                  <div className="row gap-4 wrap">
                    <Stepper label={tr("Sets")} value={it.sets} min={1} max={10} onChange={(v) => patch(i, { sets: v })} />
                    <Stepper label={tr("Min reps")} value={it.reps[0]} min={1} max={it.reps[1]} onChange={(v) => patch(i, { reps: [v, it.reps[1]] })} />
                    <Stepper label={tr("Max reps")} value={it.reps[1]} min={it.reps[0]} max={60} onChange={(v) => patch(i, { reps: [it.reps[0], v] })} />
                  </div>
                </Card></li>
              )
            })}
          </ul>
        ) : <EmptyState icon={Dumbbell} title={tr("No exercises yet")} body={tr("Search the library or create your own exercise.")} action={<Button variant="primary" icon={Plus} onClick={() => setPicker(true)}>{tr("Add exercise")}</Button>} />}
      </Section>
      <div className="builder-bar">
        <Button size="lg" onClick={() => save(false)}>{tr("Save workout")}</Button>
        <Button size="lg" variant="primary" icon={Play} onClick={() => save(true)}>{tr("Save & start")}</Button>
      </div>
      <ExercisePicker open={picker} onClose={() => setPicker(false)} multiple onPick={(e) => setItems((l) => [...l, { key: `${e.id}-${l.length}-${Date.now()}`, exerciseId: e.id, sets: e.sets, reps: [...e.reps] }])} />
    </div>
  )
}

export function Stepper({ label, value, onChange, min = 0, max = 999, step = 1 }) {
  return (
    <div className="stepper-sm" role="group" aria-label={label}>
      <span className="caption">{label}</span>
      <div className="row gap-1">
        <IconButton size="sm" label={tr("Decrease {0}", label)} icon={Minus} onClick={() => onChange(clamp(value - step, min, max))} />
        <b className="num stepper-val" aria-live="polite">{value}</b>
        <IconButton size="sm" label={tr("Increase {0}", label)} icon={Plus} onClick={() => onChange(clamp(value + step, min, max))} />
      </div>
    </div>
  )
}
