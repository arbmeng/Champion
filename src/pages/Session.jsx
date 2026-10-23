import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, Copy, Info, List, MoreHorizontal, Minus, Plus, RotateCcw, Trash2, Trophy, X } from 'lucide-react'
import { useApp, useNow } from '../state/store'
import { exerciseStats, findExercise } from '../state/selectors'
import { Badge, Button, EmptyState, IconButton, ProgressBar, cx } from '../ui/primitives'
import { ConfirmSheet, Sheet, useToast } from '../ui/overlays'
import { ExercisePicker } from '../ui/pickers'
import { MuscleMap, bodyView } from '../ui/art'
import { clamp, e1rm, fmtClock, toDisplay, toKg } from '../lib/format'
import { tr } from '../lib/i18n'

/* A number field that is friendly to both thumbs and keyboards: large −/+ controls and a typeable value. */
function NumField({ label, value, onChange, step = 1, min = 0, max = 999, suffix, decimals = 2, big }) {
  const [text, setText] = useState(String(value))
  const [focused, setFocused] = useState(false)
  useEffect(() => { if (!focused) setText(String(value)) }, [value, focused])
  const round = (n) => Math.round(n * 10 ** decimals) / 10 ** decimals
  const bump = (d) => onChange(clamp(round(value + d), min, max))
  const onType = (e) => {
    const t = e.target.value.replace(',', '.')
    if (!/^\d*\.?\d*$/.test(t)) return
    setText(t)
    if (t !== '' && t !== '.') onChange(clamp(parseFloat(t), min, max))
  }
  return (
    <div className={cx('numfield', big && 'numfield-big')}>
      <span className="numfield-label">{label}</span>
      <div className="numfield-body">
        <button type="button" className="numfield-btn" aria-label={tr("Decrease {0}", label)} onClick={() => bump(-step)}><Minus size={22} /></button>
        <label className="numfield-input">
          <span className="sr-only">{label}</span>
          <input inputMode="decimal" value={text} onChange={onType} onFocus={(e) => { setFocused(true); e.target.select() }} onBlur={() => { setFocused(false); setText(String(value)) }} aria-label={label} />
          {suffix && <small>{suffix}</small>}
        </label>
        <button type="button" className="numfield-btn" aria-label={tr("Increase {0}", label)} onClick={() => bump(step)}><Plus size={22} /></button>
      </div>
    </div>
  )
}

function RirPicker({ value, onChange }) {
  return (
    <div className="rir" role="radiogroup" aria-label={tr("Reps in reserve")}>
      <span className="numfield-label">{tr("RIR")} <small>{tr("(reps left in the tank)")}</small></span>
      <div className="rir-row">
        {[0, 1, 2, 3, 4].map((n) => <button key={n} type="button" role="radio" aria-checked={value === n} className={cx('rir-btn', value === n && 'is-active')} onClick={() => onChange(n)}>{n === 4 ? '4+' : n}</button>)}
      </div>
    </div>
  )
}

function RestRing({ active, onSkip, onAdjust, nextLabel, now }) {
  const left = Math.max(0, Math.ceil((active.restEndsAt - now) / 1000))
  const total = active.restTotal || 1
  const size = 208, stroke = 8, r = (size - stroke) / 2, c = 2 * Math.PI * r
  return (
    <div className="restring enter" role="timer" aria-label={tr("Rest {0}", fmtClock(left))}>
      <div className="restring-dial">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * Math.min(1, left / total))} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 300ms linear' }} />
        </svg>
        <div className="restring-center"><span className="eyebrow">{tr("Rest")}</span><b className="num">{fmtClock(left)}</b></div>
      </div>
      <div className="row gap-2 center-row"><Button size="sm" onClick={() => onAdjust(-15000)}>{tr("−15s")}</Button><Button size="sm" onClick={() => onAdjust(15000)}>{tr("+15s")}</Button><Button size="sm" variant="primary" onClick={onSkip}>{tr("Skip")}</Button></div>
      <p className="caption">{tr("Next:")} <b>{nextLabel}</b></p>
    </div>
  )
}

export function Session() {
  const { id } = useParams()
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const toast = useToast()
  const a = state.active
  const now = useNow(250, Boolean(a))
  const [setIdx, setSetIdx] = useState(null)
  const [queue, setQueue] = useState(false)
  const [menu, setMenu] = useState(false)
  const [finish, setFinish] = useState(false)
  const [discard, setDiscard] = useState(false)
  const [picker, setPicker] = useState(false)
  const [tech, setTech] = useState(false)
  const touch = useRef(null)

  const cur = a ? clamp(a.current, 0, a.exercises.length - 1) : 0
  const item = a?.exercises[cur]
  const ex = item ? findExercise(state, item.exerciseId) : null
  const stats = useMemo(() => (ex ? exerciseStats(state, ex.id) : null), [state, ex])
  const nextOpen = item ? item.sets.findIndex((s) => !s.done) : -1
  const activeSet = item ? (setIdx != null && setIdx < item.sets.length ? setIdx : nextOpen) : -1
  const resting = a?.restEndsAt && a.restEndsAt > now

  useEffect(() => { setSetIdx(null); window.scrollTo({ top: 0 }) }, [cur])
  useEffect(() => { if (resting) window.scrollTo({ top: 0, behavior: 'smooth' }) }, [resting])
  useEffect(() => {
    if (a?.restEndsAt && a.restEndsAt <= Date.now()) {
      actions.skipRest()
      if (state.settings.haptics) navigator.vibrate?.([120, 60, 120])
    }
  }, [now]) // eslint-disable-line react-hooks/exhaustive-deps

  // keyboard: Enter completes the open set, arrows switch exercise (desktop)
  useEffect(() => {
    const onKey = (e) => {
      if (!a || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.closest('[role=dialog]')) return
      if (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && activeSet >= 0) { e.preventDefault(); complete() }
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!a) return <div className="session-empty"><EmptyState icon={RotateCcw} title={tr("No workout in progress")} body={tr("Start a workout from Today, a course, or the library.")} action={<Button variant="primary" to="/today">{tr("Back to Today")}</Button>} /></div>
  if (id !== a.workoutId) return <Navigate to={`/workout/${a.workoutId}/session`} replace />

  const unit = state.settings.unit
  const totalSets = a.exercises.reduce((n, e) => n + e.sets.length, 0)
  const doneSets = a.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
  const exDone = (e) => e.sets.every((s) => s.done)
  const showWeight = ex.weighted || item.sets.some((s) => s.weight > 0)
  const showRir = ex.repLabel === 'reps' && !['Conditioning', 'Mobility', 'Cardio'].includes(ex.type)
  const set = activeSet >= 0 ? item.sets[activeSet] : null
  const wStep = unit === 'kg' ? 2.5 : 5
  const repsLabel = ex.repLabel === 'sec' ? tr('Seconds') : ex.repLabel === 'min' ? tr('Minutes') : tr('Reps')
  const nextEx = a.exercises.find((e, i) => i !== cur && !exDone(e))
  const upcoming = set ? tr('{0} · set {1}', ex.name, activeSet + 1) : nextEx ? findExercise(state, nextEx.exerciseId).name : tr('Finish workout')

  function go(d) { actions.setCurrent(clamp(cur + d, 0, a.exercises.length - 1)) }
  function patch(p) { if (activeSet >= 0) actions.patchSet(cur, activeSet, p) }
  function complete() {
    if (activeSet < 0) return
    const s = item.sets[activeSet]
    const wasPr = ex.repLabel === 'reps' && s.weight > 0 && stats.best && e1rm(s.weight, s.reps) > e1rm(stats.best.weight, stats.best.reps)
    actions.completeSet(cur, activeSet)
    setSetIdx(null)
    if (state.settings.haptics) navigator.vibrate?.(wasPr ? [30, 40, 60] : 25)
    if (wasPr) toast({ title: tr("Personal record"), body: `${ex.name} · ${toDisplay(s.weight, unit)} ${unit} × ${s.reps}`, tone: 'success' })
  }
  const finishNow = () => { const id2 = a.id; actions.finish(); navigate(`/complete/${id2}`, { replace: true }) }
  const onTouchEnd = (e) => {
    if (!touch.current) return
    const dx = e.changedTouches[0].clientX - touch.current.x
    const dy = e.changedTouches[0].clientY - touch.current.y
    touch.current = null
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) go(dx < 0 ? 1 : -1)
  }
  const prevText = (s) => (s.prev ? `${showWeight ? `${toDisplay(s.prev.weight, unit)} ${unit} × ` : ''}${s.prev.reps}` : null)

  return (
    <div className="session">
      <header className="session-top">
        <IconButton label={tr("Leave session view (workout keeps running)")} icon={ChevronLeft} onClick={() => navigate('/today')} />
        <div className="grow session-top-center"><span className="session-timer-pill"><span className="eyebrow">{tr("Session time")}</span><b className="num">{fmtClock((now - a.startedAt) / 1000)}</b></span></div>
        <IconButton label={tr("More options")} icon={MoreHorizontal} onClick={() => setMenu(true)} />
        <Button variant="primary" size="sm" onClick={() => setFinish(true)}>{tr("Finish")}</Button>
      </header>
      <ProgressBar value={(doneSets / totalSets) * 100} height={3} label={tr("Workout progress")} className="session-progress" />

      <div className="session-body">
        <div className="session-main" onTouchStart={(e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }} onTouchEnd={onTouchEnd}>
          <div className="session-ex">
            <div className="row between">
              <span className="eyebrow">{tr("Exercise {0} of {1}", cur + 1, a.exercises.length)}</span>
              <div className="row gap-1"><IconButton size="sm" label={tr("Previous exercise")} icon={ChevronLeft} onClick={() => go(-1)} disabled={cur === 0} /><IconButton size="sm" label={tr("Next exercise")} icon={ChevronRight} onClick={() => go(1)} disabled={cur === a.exercises.length - 1} /></div>
            </div>
            <div className="session-ex-head">
              <h1 className="session-ex-name">{ex.name}</h1>
              <div className="row gap-2 wrap center-row">
                {set && <span className="set-chip">{tr("Set {0} of {1}", activeSet + 1, item.sets.length)}</span>}
                <Badge tone="accent">{tr(ex.muscle)}</Badge>
                <button type="button" className="link caption row gap-1" onClick={() => setTech(true)}><Info size={14} aria-hidden="true" /> {tr("Technique")}</button>
              </div>
            </div>
          </div>

          {resting && <RestRing active={a} now={now} onSkip={actions.skipRest} onAdjust={actions.adjustRest} nextLabel={upcoming} />}

          {set ? (
            <div className="logger enter">
              <div className="row between logger-meta">
                <h2 className="logger-set">{tr("Set")} <span className="num">{activeSet + 1}</span> <span className="faint">/ {item.sets.length}</span></h2>
                {prevText(set) ? <button type="button" className="prev-chip" onClick={() => patch({ weight: set.prev.weight, reps: set.prev.reps })} aria-label={tr("Use previous: {0}", prevText(set))}><span>{tr("Previous")}</span> <b className="num">{prevText(set)}</b> <em>{tr("Use")}</em></button> : <span className="caption">{tr("First time — set your baseline")}</span>}
              </div>
              {item.suggest && activeSet === item.sets.findIndex((s) => !s.done) && (
                <button type="button" className="suggest" onClick={() => patch({ weight: item.suggest.weight })}><Trophy size={14} aria-hidden="true" /> <span>{tr('{0}. Try {1} {2}', tr(item.suggest.reason, item.suggest.reps), toDisplay(item.suggest.weight, unit), unit)}</span></button>
              )}
              <div className={cx('logger-fields', !showWeight && 'no-weight')}>
                {showWeight && <NumField big label={ex.type === 'Bodyweight' ? tr("Added weight") : tr("Weight")} suffix={unit} value={toDisplay(set.weight, unit)} step={wStep} decimals={2} onChange={(v) => patch({ weight: toKg(v, unit) })} />}
                <NumField big label={repsLabel} value={set.reps} step={1} decimals={0} max={500} onChange={(v) => patch({ reps: v })} />
              </div>
              {showWeight && <div className="quick-add" aria-label={tr("Quick add weight")}>{[1.25, 2.5, 5].map((d) => <button key={d} type="button" onClick={() => patch({ weight: Math.round((set.weight + toKg(d, unit)) * 100) / 100 })}>+{d}</button>)}</div>}
              {showRir && <RirPicker value={clamp(set.rir ?? 2, 0, 4)} onChange={(v) => patch({ rir: v })} />}
            </div>
          ) : (
            <div className="logger logger-done enter">
              <span className="logger-check"><Check size={28} strokeWidth={3} aria-hidden="true" /></span>
              <h2>{ex.name} {tr("complete")}</h2>
              <p className="muted">{item.sets.length} {tr("sets logged.")}</p>
              <div className="row gap-2 wrap center-row">
                <Button icon={Plus} onClick={() => actions.addSet(cur)}>{tr("Add set")}</Button>
                {cur < a.exercises.length - 1 && <Button variant="primary" onClick={() => go(1)}>{tr("Next exercise")}</Button>}
              </div>
            </div>
          )}

          <section aria-label={tr("Set history")} className="sethist">
            <div className="row between"><h3>{tr("Sets")}</h3><button type="button" className="link caption" onClick={() => actions.addSet(cur)}>{tr("+ Add set")}</button></div>
            <ol className="stack-sm">
              {item.sets.map((s, i) => {
                const pr = s.done && ex.repLabel === 'reps' && s.weight > 0 && stats.best && e1rm(s.weight, s.reps) > e1rm(stats.best.weight, stats.best.reps)
                return (
                  <li key={i} className={cx('setrow', s.done && 'is-done', i === activeSet && 'is-current')}>
                    <button type="button" className="setrow-main" onClick={() => !s.done && setSetIdx(i)} disabled={s.done} aria-label={s.done ? tr('Set {0} complete', i + 1) : tr('Set {0}', i + 1)}>
                      <span className="setrow-n num">{s.done ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
                      <span className="setrow-val num">{showWeight ? `${toDisplay(s.weight, unit)} ${unit} × ${s.reps}` : `${s.reps} ${tr(ex.repLabel)}`}</span>
                      {showRir && <span className="setrow-rir caption">{tr("RIR")} {s.rir}</span>}
                      {pr && <Badge tone="accent" icon={Trophy}>{tr("PR")}</Badge>}
                      {!s.done && prevText(s) && <span className="setrow-prev caption">{tr("prev")} {prevText(s)}</span>}
                    </button>
                    {s.done ? <IconButton size="sm" label={tr("Undo set {0}", i + 1)} icon={RotateCcw} onClick={() => actions.uncompleteSet(cur, i)} /> : item.sets.length > 1 ? <IconButton size="sm" label={tr("Remove set {0}", i + 1)} icon={X} onClick={() => actions.removeSet(cur, i)} /> : null}
                  </li>
                )
              })}
            </ol>
          </section>

          <div className="upnext">
            <span className="eyebrow">{tr("Up next")}</span>
            {nextEx ? <div className="row between"><b>{findExercise(state, nextEx.exerciseId).name}</b><span className="caption">{tr("{0} sets", nextEx.sets.length)}</span></div> : <b>{tr("Finish workout")}</b>}
          </div>
        </div>

        <aside className="session-queue" aria-label={tr("Exercises in this workout")}>
          <QueueList a={a} cur={cur} onPick={(i) => actions.setCurrent(i)} onAdd={() => setPicker(true)} state={state} onRemove={(i) => actions.removeExercise(i)} />
        </aside>
      </div>

      <footer className="session-cta">
        {set ? (
          <div className="session-cta-row">
            <Button size="lg" icon={List} onClick={() => setQueue(true)} className="queue-btn" aria-label={tr("Exercise list")}><span className="sr-only">{tr("Exercises")}</span></Button>
            <Button variant="primary" size="xl" block icon={Check} onClick={complete}>{tr("Complete set")}</Button>
          </div>
        ) : (
          <div className="session-cta-row">
            <Button size="lg" icon={List} onClick={() => setQueue(true)} className="queue-btn" aria-label={tr("Exercise list")}><span className="sr-only">{tr("Exercises")}</span></Button>
            {cur < a.exercises.length - 1 && !a.exercises.every(exDone) ? <Button variant="primary" size="xl" block onClick={() => go(1)}>{tr("Next exercise")}</Button> : <Button variant="primary" size="xl" block onClick={() => setFinish(true)}>{tr("Finish workout")}</Button>}
          </div>
        )}
      </footer>

      <Sheet open={queue} onClose={() => setQueue(false)} title={tr("Exercises")}>
        <QueueList a={a} cur={cur} state={state} onPick={(i) => { actions.setCurrent(i); setQueue(false) }} onAdd={() => { setQueue(false); setPicker(true) }} onRemove={(i) => actions.removeExercise(i)} />
      </Sheet>

      <Sheet open={menu} onClose={() => setMenu(false)} title={tr("Workout options")}>
        <div className="stack-sm">
          <Button block icon={Copy} onClick={() => { actions.copyLast(); setMenu(false); toast({ title: tr("Copied last workout"), body: tr("Open sets now match your previous session."), tone: 'success' }) }}>{tr("Copy last workout")}</Button>
          <Button block icon={Plus} onClick={() => { setMenu(false); setPicker(true) }}>{tr("Add exercise")}</Button>
          <Button block variant="danger" icon={Trash2} onClick={() => { setMenu(false); setDiscard(true) }}>{tr("Discard workout")}</Button>
        </div>
      </Sheet>

      <Sheet open={finish} onClose={() => setFinish(false)} title={tr("Finish workout?")} footer={<div className="stack-sm"><Button variant="primary" size="lg" block disabled={doneSets === 0} onClick={finishNow} data-autofocus>{tr("Finish & save")}</Button><Button block variant="ghost" onClick={() => setFinish(false)}>{tr("Keep training")}</Button></div>}>
        <div className="stack">
          <div className="grid-3 finish-stats"><div><div className="num num-lg">{doneSets}</div><span className="caption">{tr("sets done")}</span></div><div><div className="num num-lg">{a.exercises.filter((e) => e.sets.some((s) => s.done)).length}</div><span className="caption">{tr("exercises")}</span></div><div><div className="num num-lg">{Math.round((now - a.startedAt) / 60000)}</div><span className="caption">{tr("minutes")}</span></div></div>
          {doneSets === 0 ? <p className="muted">{tr("Log at least one set to save this workout, or discard it.")}</p> : doneSets < totalSets ? <p className="muted">{tr('{0} planned sets are still open. Only completed sets are saved.', totalSets - doneSets)}</p> : <p className="muted">{tr("Everything is logged. Nice work.")}</p>}
        </div>
      </Sheet>
      <ConfirmSheet open={discard} onClose={() => setDiscard(false)} tone="danger" title={tr("Discard this workout?")} body={tr("All sets logged in this session will be lost.")} confirmLabel={tr("Discard")} onConfirm={() => { actions.discard(); navigate('/today', { replace: true }) }} />
      <ExercisePicker open={picker} onClose={() => setPicker(false)} onPick={(e) => actions.addExercise(e.id)} />
      <Sheet open={tech} onClose={() => setTech(false)} title={ex.name} size="lg">
        <div className="stack">
          <div className="row gap-4"><MuscleMap primary={[ex.muscle]} secondary={ex.secondary} view={bodyView(ex.muscle)} height={140} /><div className="stack-sm"><span className="eyebrow">{tr("Target")}</span><b>{tr(ex.muscle)}</b>{ex.secondary.length > 0 && <span className="caption">{tr('Also: {0}', ex.secondary.map((m) => tr(m)).join('، '))}</span>}<span className="caption">{tr('Tempo: {0}', ex.tempo)}</span></div></div>
          <ol className="steps">{ex.tech.map((t, i) => <li key={i}><span className="num">{i + 1}</span><p>{t}</p></li>)}</ol>
          <p className="caption">{tr('Avoid: {0}', ex.mistakes.join(' '))}</p>
        </div>
      </Sheet>
    </div>
  )
}

function QueueList({ a, cur, onPick, onAdd, onRemove, state }) {
  return (
    <div className="queue">
      <h3 className="queue-title">{tr("Workout")}</h3>
      <ol className="stack-sm">
        {a.exercises.map((e, i) => {
          const ex = findExercise(state, e.exerciseId)
          const d = e.sets.filter((s) => s.done).length
          const complete = d === e.sets.length
          return (
            <li key={e.key} className="row gap-1">
              <button type="button" className={cx('queue-row', i === cur && 'is-current', complete && 'is-done')} onClick={() => onPick(i)} aria-current={i === cur ? 'step' : undefined}>
                <span className="queue-n num">{complete ? <Check size={13} strokeWidth={3} /> : i + 1}</span>
                <span className="grow"><b className="truncate">{ex.name}</b><span className="caption">{d}/{e.sets.length} {tr("sets")}</span></span>
              </button>
              {d === 0 && a.exercises.length > 1 && <IconButton size="sm" label={tr("Remove {0}", ex.name)} icon={X} onClick={() => onRemove(i)} />}
            </li>
          )
        })}
      </ol>
      <Button block icon={Plus} onClick={onAdd}>{tr("Add exercise")}</Button>
    </div>
  )
}
