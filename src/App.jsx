import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, Dumbbell, Flame, Footprints, History, Home, MoreHorizontal, Plus, Search, Settings2, ShieldCheck, Sparkles, Trophy, UserRound, X } from './Icons.jsx'
import { displayVolume, displayWeight, estimateOneRepMax, formatDuration, formatTimer, library, localDateKey, toKilograms, workoutPlan } from './data'
import { useChampion } from './useChampion'
import { estimateMuscleRecovery } from './recovery'

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'workout', label: 'Workout', icon: Dumbbell },
  { id: 'progress', label: 'Progress', icon: Activity },
  { id: 'exercises', label: 'Exercises', icon: Search },
  { id: 'profile', label: 'Profile', icon: UserRound },
]

export default function App() {
  const champion = useChampion()
  const [tab, setTab] = useState('home')
  const [summary, setSummary] = useState(null)
  const [search, setSearch] = useState('')
  const [minimized, setMinimized] = useState(false)
  const active = champion.active

  const go = (id) => { setTab(id); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const onFinish = () => {
    const completed = champion.finish()
    if (completed) setSummary(completed)
  }

  if (!champion.ready) return <div className="boot-screen"><Brand /><span className="boot-indicator" />Loading your training log…</div>

  if (active && !minimized) return <WorkoutSession active={active} champion={champion} onFinish={onFinish} onClose={() => setMinimized(true)} />
  if (summary) return <WorkoutSummary workout={summary} unit={champion.preferences.unit} onDone={() => { setSummary(null); go('progress') }} />

  return (
    <div className="app-frame">
      <aside className="side-rail">
        <Brand />
        <div className="rail-label">TRAINING</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map((item) => <NavButton key={item.id} item={item} active={tab === item.id} onClick={() => go(item.id)} />)}
        </nav>
        <div className="rail-spacer" />
        <div className="rail-coach"><span className="coach-orb"><Sparkles size={15} /></span><div><b>Train with intent</b><small>Your progress is yours.</small></div></div>
        <div className="profile-mini"><div className="avatar">A</div><div><b>Arez</b><small>Strength athlete</small></div><MoreHorizontal size={17} /></div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="mobile-brand"><Brand /></div>
          <div className="breadcrumb"><span>CHAMPION</span><ChevronRight size={13} /><b>{tab === 'home' ? 'Today' : navItems.find((i) => i.id === tab)?.label || 'Session'}</b></div>
          <div className="top-actions"><span className="demo-pill"><span /> DEMO PROFILE</span><div className="avatar avatar-small">A</div></div>
        </header>
        {active && minimized && <button className="resume-workout-banner" onClick={() => setMinimized(false)}><span className="session-dot" /><span><b>Workout in progress</b><small>{active.title} · continue your session</small></span><ArrowRight size={16} /></button>}
        <main className="page-content">
          {tab === 'home' && <HomePage champion={champion} onStart={() => champion.start()} onResume={() => setMinimized(false)} onNavigate={go} />}
          {tab === 'workout' && <WorkoutPage champion={champion} onStart={champion.start} onResume={() => setMinimized(false)} />}
          {tab === 'progress' && <ProgressPage history={champion.history} unit={champion.preferences.unit} />}
          {tab === 'exercises' && <ExercisesPage search={search} setSearch={setSearch} />}
          {tab === 'profile' && <ProfilePage champion={champion} />}
        </main>
        <BottomNav tab={tab} onNavigate={go} />
      </div>
    </div>
  )
}

function Brand() { return <div className="brand"><span className="brand-mark"><Dumbbell size={19} strokeWidth={2.5} /></span><span>CHAMPION<span className="brand-dot">.</span></span></div> }

function NavButton({ item, active, onClick }) {
  const Icon = item.icon
  return <button className={`side-link ${active ? 'selected' : ''}`} onClick={onClick}><Icon size={18} /><span>{item.label}</span>{active && <span className="nav-indicator" />}</button>
}

function BottomNav({ tab, onNavigate }) {
  return <nav className="bottom-nav" aria-label="Main navigation">{navItems.map((item) => {
    const Icon = item.icon
    return <button key={item.id} className={`bottom-link ${tab === item.id ? 'selected' : ''}`} onClick={() => onNavigate(item.id)}><Icon size={19} strokeWidth={tab === item.id ? 2.4 : 1.8} /><span>{item.label}</span></button>
  })}</nav>
}

function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div>
}

function HomePage({ champion, onStart, onResume, onNavigate }) {
  const hasActiveWorkout = Boolean(champion.active)
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const recent = champion.history[0]
  const daysSinceTraining = recent ? Math.max(0, Math.floor((new Date(`${localDateKey()}T00:00:00`) - new Date(`${recent.date}T00:00:00`)) / 86400000)) : 0
  const readinessScore = Math.min(95, 58 + daysSinceTraining * 8)
  const readinessLabel = daysSinceTraining >= 3 ? 'READY' : daysSinceTraining >= 2 ? 'MODERATE' : 'RECOVERING'
  const readinessMessage = readinessLabel === 'READY' ? "You're ready to go." : readinessLabel === 'MODERATE' ? 'Ease into today.' : 'You trained recently.'
  const bestBench = Math.max(77.5, ...champion.history.flatMap((workout) => workout.entries || []).filter((entry) => entry.exerciseId === 'bench').flatMap((entry) => entry.sets || []).map((set) => set.weight))
  const goalProgress = Math.min(100, bestBench / 100 * 100)
  const muscleRecovery = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'].map((name) => ({ name, ...estimateMuscleRecovery(champion.history, name) }))
  const todayKey = localDateKey()
  const monday = new Date()
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const weekDateKeys = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  })
  const trainedDates = new Set(champion.history.map((workout) => workout.date))
  const weekly = weekDateKeys.filter((day) => trainedDates.has(day)).length

  return <div className="home-page">
    <PageHeading eyebrow={date.toUpperCase()} title={<>Good morning, <span className="text-accent">Arez.</span></>} subtitle="Your next strong session starts here." action={<button className="icon-button settings-action" aria-label="Settings" onClick={() => onNavigate('profile')}><Settings2 size={18} /></button>} />
    <section className="hero-panel">
      <div className="hero-grid-lines" aria-hidden="true" />
    <div className="hero-copy"><div className="hero-kicker"><span className="live-dot" /> TODAY'S TRAINING</div><h2>{hasActiveWorkout ? champion.active.title : workoutPlan.title}<br /><span>Upper body strength</span></h2><div className="hero-meta"><span><Dumbbell size={15} /> 6 exercises</span><i /><span><Clock3 size={15} /> 52 min</span><i /><span><Activity size={15} /> ~{displayVolume(6620, champion.preferences.unit).toLocaleString()} {champion.preferences.unit}</span></div><button className="button-primary" onClick={hasActiveWorkout ? onResume : onStart}>{hasActiveWorkout ? 'Continue workout' : 'Start workout'} <ArrowRight size={17} /></button><div className="hero-caption">Last session: {daysSinceTraining === 0 ? 'today' : daysSinceTraining === 1 ? 'yesterday' : `${daysSinceTraining} days ago`} <span>·</span> {recent?.sets || 0} sets completed</div></div>
      <div className="hero-art" aria-hidden="true"><div className="hero-ring ring-one" /><div className="hero-ring ring-two" /><div className="hero-stat"><b>{String(weekly).padStart(2, '0')}</b><span>SESSIONS THIS WEEK</span><div className="tiny-bars"><i /><i /><i /><i /><i /><i /><i /></div></div><div className="hero-watermark">C</div></div>
      <div className="hero-edge" />
    </section>

    <div className="overview-grid">
      <section className="surface readiness-card"><div className="section-top"><div><div className="eyebrow">TRAINING READINESS · DEMO ESTIMATE</div><h3>{readinessMessage}</h3></div><span className={`status-chip ${readinessLabel.toLowerCase()}`}><span /> {readinessLabel}</span></div><div className="readiness-content"><div className="readiness-gauge"><svg viewBox="0 0 120 72" aria-label={`Demo readiness estimate ${readinessScore} out of 100`}><path d="M12 62 A48 48 0 0 1 108 62" fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="9" strokeLinecap="round"/><path d={`M12 62 A48 48 0 0 1 ${12 + 96 * readinessScore / 100} ${62 - 44 * Math.sin(Math.PI * readinessScore / 100)}`} fill="none" stroke="#bd2435" strokeWidth="9" strokeLinecap="round"/><circle cx={12 + 96 * readinessScore / 100} cy={62 - 44 * Math.sin(Math.PI * readinessScore / 100)} r="4.5" fill="#f45a64" /></svg><div><b>{readinessScore}</b><small>/ 100</small></div></div><p>Simple estimate from days since your last logged session. How you feel comes first.</p></div><div className="readiness-foot"><span><ShieldCheck size={14} /> Listen to how you feel today.</span><ChevronRight size={16} /></div></section>
      <section className="surface week-card"><div className="section-top"><div><div className="eyebrow">THIS WEEK</div><h3>Consistency adds up.</h3></div><span className="week-count">{weekly}<small> / 4</small></span></div><div className="week-days">{weekDateKeys.map((dayKey, index) => { const trained = trainedDates.has(dayKey); const today = dayKey === todayKey; return <div className="week-day" key={dayKey}><span>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span><i className={trained ? 'trained' : today ? 'today' : ''}>{trained ? <Check size={13} /> : today ? <span /> : null}</i></div> })}</div><div className="week-foot"><span><Flame size={14} /> <b>{weekly} workouts</b> this week</span><span className="week-target">Goal: 4</span></div></section>
    </div>

    <section className="section-block"><div className="section-heading"><div><div className="eyebrow">MUSCLE RECOVERY</div><h3>Training recovery estimate</h3></div><button className="text-button" onClick={() => onNavigate('progress')}>View details <ArrowRight size={14} /></button></div><div className="muscle-grid">{muscleRecovery.map(({ name, label, tone }) => <div className="muscle-item" key={name}><span className={`muscle-dot ${tone}`} /><div><b>{name}</b><small>{label}</small></div><div className={`recovery-line ${tone}`}><i /></div></div>)}</div><p className="disclaimer">Simple two-day training estimate, not medical guidance.</p></section>

    <div className="lower-grid"><section className="surface recent-card"><div className="section-top"><div><div className="eyebrow">LAST SESSION</div><h3>{recent?.title || 'Your training log'}</h3></div><span className="quiet-date">{recent ? new Date(`${recent.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</span></div><div className="recent-stats"><div><b>{recent?.sets || 0}</b><small>SETS</small></div><div><b>{recent?.exercises || 0}</b><small>EXERCISES</small></div><div><b>{displayVolume(recent?.volume, champion.preferences.unit).toLocaleString()}</b><small>{champion.preferences.unit.toUpperCase()} VOLUME</small></div></div><button className="inline-link" onClick={() => onNavigate('progress')}>Open training history <ArrowRight size={14} /></button></section>
      <section className="surface pr-card"><div className="pr-emblem"><Trophy size={19} /></div><div className="eyebrow">YOUR NEXT MILESTONE</div><h3>Bench press <span>{displayWeight(100, champion.preferences.unit)} {champion.preferences.unit}</span></h3><p>You're {displayWeight(Math.max(0, 100 - bestBench), champion.preferences.unit)} {champion.preferences.unit} away from your strength goal.</p><div className="goal-progress"><i style={{ width: `${goalProgress}%` }} /></div><div className="goal-meta"><span>{displayWeight(bestBench, champion.preferences.unit)} {champion.preferences.unit} current best</span><b>{Math.round(goalProgress)}%</b></div></section></div>
  </div>
}

function WorkoutPage({ champion, onStart, onResume }) {
  const hasActiveWorkout = Boolean(champion.active)
  return <div><PageHeading eyebrow="YOUR TRAINING" title="Workout" subtitle="The next rep is the one that counts." /><div className="workout-layout"><section className="surface plan-detail"><div className="plan-overline"><span className="plan-icon"><Dumbbell size={18} /></span><span>ACTIVE PROGRAM · UPPER / LOWER</span></div><h2>Upper A</h2><p className="plan-desc">A balanced upper-body strength session built around the lifts that move you forward.</p><div className="plan-metrics"><Metric label="DURATION" value="52 min" /><Metric label="EXERCISES" value="06" /><Metric label="EST. VOLUME" value={`${displayVolume(6620, champion.preferences.unit).toLocaleString()} ${champion.preferences.unit}`} /></div><div className="plan-list">{workoutPlan.exercises.map((exercise, i) => <div className="plan-exercise" key={exercise.id}><span className="plan-number">0{i + 1}</span><div><b>{exercise.name}</b><small>{exercise.muscle} · {exercise.sets} × {exercise.reps}</small></div><ChevronRight size={16} /></div>)}</div><button className="button-primary wide" onClick={hasActiveWorkout ? onResume : () => onStart()}>{hasActiveWorkout ? 'Continue current workout' : 'Start Upper A'} <ArrowRight size={17} /></button></section>
    <aside className="workout-aside"><section className="surface upcoming-card"><div className="eyebrow">UP NEXT IN YOUR PLAN</div><h3>Lower A</h3><p>Quads · glutes · posterior chain</p><div className="upcoming-row"><span><Clock3 size={15} /> Next session</span><span>6 exercises</span></div></section><section className="surface templates-card"><div className="section-top"><div><div className="eyebrow">QUICK START</div><h3>Choose your pace.</h3></div><Footprints size={18} className="muted-icon" /></div><button className="quick-start-row" onClick={hasActiveWorkout ? onResume : () => onStart('Empty Workout', [])}><span className="quick-icon"><Plus size={17} /></span><span><b>{hasActiveWorkout ? 'Continue current workout' : 'Start empty workout'}</b><small>{hasActiveWorkout ? champion.active.title : 'Build your session as you go'}</small></span><ChevronRight size={16} /></button><button className="quick-start-row" onClick={hasActiveWorkout ? onResume : () => onStart('Upper A')}><span className="quick-icon"><History size={17} /></span><span><b>{hasActiveWorkout ? 'Return to active session' : 'Repeat last workout'}</b><small>{hasActiveWorkout ? 'Pick up where you left off' : 'Upper A · 3 days ago'}</small></span><ChevronRight size={16} /></button></section><div className="offline-note"><ShieldCheck size={15} /><span>Demo mode saves your workout on this device.</span></div></aside></div></div>
}

function Metric({ label, value }) { return <div className="metric"><small>{label}</small><b>{value}</b></div> }

function WorkoutSession({ active, champion, onFinish, onClose }) {
  const [seconds, setSeconds] = useState(() => active.restEndsAt ? Math.max(0, Math.ceil((active.restEndsAt - Date.now()) / 1000)) : 0)
  const [openExercise, setOpenExercise] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('')
  const [now, setNow] = useState(Date.now)
  const duration = Math.max(0, Math.floor((now - active.startedAt) / 1000))
  const completedSets = active.exercises.reduce((n, exercise) => n + exercise.sets.filter((set) => set.done).length, 0)
  const totalSets = active.exercises.reduce((n, exercise) => n + exercise.sets.length, 0)
  const elapsedLabel = `${String(Math.floor(duration / 3600)).padStart(2, '0')}:${String(Math.floor((duration % 3600) / 60)).padStart(2, '0')}:${String(duration % 60).padStart(2, '0')}`

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now())
      setSeconds(active.restEndsAt ? Math.max(0, Math.ceil((active.restEndsAt - Date.now()) / 1000)) : 0)
    }, 1000)
    return () => window.clearInterval(id)
  }, [active.restEndsAt])

  function editSet(exerciseIndex, setIndex, field, value) {
    champion.patchActive((workout) => ({ ...workout, exercises: workout.exercises.map((exercise, ei) => ei !== exerciseIndex ? exercise : { ...exercise, sets: exercise.sets.map((set, si) => si !== setIndex ? set : { ...set, [field]: value }) }) }))
  }
  function completeSet(exerciseIndex, setIndex) {
    const set = active.exercises[exerciseIndex].sets[setIndex]
    if (!set.done && (!Number(set.reps) || (active.exercises[exerciseIndex].type !== 'Bodyweight' && !Number(set.weight)))) return
    editSet(exerciseIndex, setIndex, 'done', !set.done)
    if (!set.done && champion.preferences.rest) {
      const secondsToRest = active.exercises[exerciseIndex].rest || 90
      champion.patchActive((workout) => ({ ...workout, restDuration: secondsToRest, restEndsAt: Date.now() + secondsToRest * 1000 }))
    }
  }
  function adjustTimer(delta) {
    champion.patchActive((workout) => ({ ...workout, restDuration: Math.max(0, seconds + delta), restEndsAt: Date.now() + Math.max(0, seconds + delta) * 1000 }))
  }
  function addExercise(exercise) {
    champion.patchActive((workout) => ({ ...workout, exercises: [...workout.exercises, { ...exercise, sets: Array.from({ length: exercise.sets || 3 }, (_, i) => ({ id: `${exercise.id}-${Date.now()}-${i}`, weight: exercise.weight ? String(exercise.weight) : '', reps: '', done: false })) }] }))
    setShowAdd(false)
    setFilter('')
    setOpenExercise(active.exercises.length)
  }

  return <div className="session-shell"><header className="session-header"><button className="session-back" onClick={onClose} aria-label="Minimize workout"><ChevronDown size={19} /></button><div className="session-title"><span className="eyebrow">WORKOUT IN PROGRESS</span><b>{active.title}</b></div><div className="session-clock"><span className="session-dot" />{elapsedLabel}</div><button className="finish-top" onClick={onFinish}>Finish</button></header><div className="session-progress"><i style={{ width: `${totalSets ? completedSets / totalSets * 100 : 0}%` }} /></div>
    <main className="session-content"><div className="session-heading"><div><span className="eyebrow">STAY IN THE MOMENT</span><h1>Your session.</h1><p>{completedSets} of {totalSets} sets complete <span>·</span> {active.exercises.length} exercises</p></div><button className="subtle-button" onClick={() => setShowAdd(true)}><Plus size={16} /> Add exercise</button></div>
      {active.exercises.map((exercise, ei) => { const isOpen = openExercise === ei; const priorEntry = champion.history.flatMap((workout) => workout.entries || []).find((entry) => entry.exerciseId === exercise.id); const priorSet = priorEntry?.sets?.[0]; const previous = priorSet ? `${displayWeight(priorSet.weight, champion.preferences.unit)} ${champion.preferences.unit} × ${priorSet.reps}` : 'First session'; return <section className={`exercise-block ${isOpen ? 'exercise-open' : ''}`} key={`${exercise.id}-${ei}`}><button className="exercise-heading" onClick={() => setOpenExercise(isOpen ? -1 : ei)}><span className="exercise-index">{String(ei + 1).padStart(2, '0')}</span><span className="exercise-name"><b>{exercise.name}</b><small>{exercise.muscle} <i>·</i> {exercise.type} <i>·</i> Last time: {previous}</small></span><span className="exercise-done-count">{exercise.sets.filter((set) => set.done).length}/{exercise.sets.length}</span><ChevronDown className={isOpen ? 'rotate' : ''} size={17} /></button>
        {isOpen && <div className="exercise-body"><div className="set-table-head"><span>SET</span><span>PREVIOUS</span><span>{champion.preferences.unit.toUpperCase()}</span><span>REPS</span><span /></div>{exercise.sets.map((set, si) => { const old = priorEntry?.sets?.[si] || priorSet; return <div className={`set-row ${set.done ? 'set-complete' : ''}`} key={set.id}><div className="set-index">{si + 1}</div><div className="previous-set">{old ? `${displayWeight(old.weight, champion.preferences.unit)} × ${old.reps}` : '—'}</div><input aria-label={`${exercise.name}, set ${si + 1}, weight`} type="number" inputMode="decimal" min="0" step={champion.preferences.unit === 'lb' ? '1' : '0.5'} value={set.weight === '' ? '' : displayWeight(set.weight, champion.preferences.unit)} onChange={(e) => editSet(ei, si, 'weight', e.target.value === '' ? '' : toKilograms(e.target.value, champion.preferences.unit))} /><input aria-label={`${exercise.name}, set ${si + 1}, reps`} type="number" inputMode="numeric" min="0" step="1" value={set.reps} onChange={(e) => editSet(ei, si, 'reps', e.target.value)} /><button className={`set-check ${set.done ? 'checked' : ''}`} disabled={!set.done && (!Number(set.reps) || (exercise.type !== 'Bodyweight' && !Number(set.weight)))} onClick={() => completeSet(ei, si)} aria-label={set.done ? 'Mark set incomplete' : 'Complete set'}>{set.done && <Check size={16} />}</button></div>})}<div className="set-footer"><button className="inline-link" onClick={() => champion.patchActive((workout) => ({ ...workout, exercises: workout.exercises.map((item, i) => i !== ei ? item : { ...item, sets: [...item.sets, { id: `${item.id}-${Date.now()}`, weight: item.sets.at(-1)?.weight || '', reps: '', done: false }] }) }))}><Plus size={14} /> Add set</button><span>Target {exercise.reps} reps <i>·</i> rest {exercise.rest}s</span></div></div>}</section>})}
      <div className="session-note"><Sparkles size={16} /><span>Last time on bench: <b>77.5 kg × 8</b>. One rep stronger is still progress.</span></div>
    </main>
    {seconds > 0 && <div className="rest-dock"><div className="rest-icon"><Clock3 size={19} /></div><div className="rest-info"><small>REST TIMER</small><b>{formatTimer(seconds)}</b></div><div className="rest-controls"><button onClick={() => adjustTimer(15)}>+15s</button><button onClick={() => adjustTimer(30)}>+30s</button><button className="rest-skip" onClick={() => champion.patchActive((workout) => ({ ...workout, restEndsAt: null, restDuration: null }))}>Skip <ArrowRight size={14} /></button></div><div className="rest-track"><i style={{ width: `${active.restDuration ? Math.min(100, seconds / active.restDuration * 100) : 0}%` }} /></div></div>}
    <div className="finish-dock"><div><b>{completedSets}<span> / {totalSets}</span></b><small>sets completed</small></div><button className="button-primary" onClick={onFinish}>Finish workout <ArrowRight size={16} /></button></div>
    {showAdd && <div className="sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAdd(false) }}><section className="add-sheet"><div className="sheet-grab" /><div className="sheet-head"><div><span className="eyebrow">EXERCISE LIBRARY</span><h2>Add an exercise</h2></div><button className="icon-button" onClick={() => setShowAdd(false)} aria-label="Close"><X size={18} /></button></div><label className="search-field"><Search size={17} /><input autoFocus value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search movements" /></label><div className="sheet-results">{library.filter((item) => !active.exercises.some((exercise) => exercise.id === item.id)).filter((item) => `${item.name} ${item.muscle}`.toLowerCase().includes(filter.toLowerCase())).map((item) => <button className="sheet-result" onClick={() => addExercise(item)} key={item.id}><span className="exercise-mini-icon"><Dumbbell size={17} /></span><span><b>{item.name}</b><small>{item.muscle} · {item.type}</small></span><Plus size={17} /></button>)}</div></section></div>}
  </div>
}

function WorkoutSummary({ workout, unit, onDone }) {
  const previous = workout.previousVolume
  const change = previous && workout.volume ? Math.round((workout.volume / previous - 1) * 100) : 0
  return <div className="summary-shell"><button className="summary-close" onClick={onDone}><X size={19} /></button><div className="summary-wrap"><div className="summary-badge"><Check size={27} /></div><div className="eyebrow">SESSION COMPLETE</div><h1>Strong work.<br /><span>That's in the books.</span></h1><p className="summary-date">{new Date(`${workout.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p><div className="summary-stats"><Metric label="DURATION" value={formatDuration(workout.duration)} /><Metric label="TOTAL VOLUME" value={`${displayVolume(workout.volume, unit).toLocaleString()} ${unit}`} /><Metric label="SETS" value={String(workout.sets).padStart(2, '0')} /><Metric label="EXERCISES" value={String(workout.exercises).padStart(2, '0')} /></div>{change > 0 && <div className="summary-insight"><ArrowUpRight size={17} /><span><b>Volume is up {change}%</b> from your previous session.</span></div>}{workout.prs.length > 0 && <div className="pr-celebration"><Trophy size={19} /><div><b>New personal record</b><span>{workout.prs.map((pr) => `${pr.name} · ${displayWeight(pr.weight, unit)} ${unit}`).join(' / ')}</span></div></div>}<button className="button-primary wide" onClick={onDone}>See your progress <ArrowRight size={17} /></button><p className="summary-footnote">Progress comes from showing up. Keep going.</p></div></div>
}

function ProgressPage({ history, unit }) {
  const totalVolume = history.reduce((sum, workout) => sum + workout.volume, 0)
  const totalSets = history.reduce((sum, workout) => sum + workout.sets, 0)
  const prs = history.flatMap((workout) => workout.prs || [])
  const benchSets = history.flatMap((workout) => workout.entries || []).filter((entry) => entry.exerciseId === 'bench').flatMap((entry) => entry.sets || [])
  const bestBenchSet = benchSets.reduce((best, set) => !best || estimateOneRepMax(set.weight, set.reps) > estimateOneRepMax(best.weight, best.reps) ? set : best, null)
  const values = history.slice(0, 6).reverse().map((workout) => displayVolume(workout.volume, unit))
  const max = Math.max(1, ...values)
  const points = values.map((value, index) => `${10 + index * (280 / Math.max(1, values.length - 1))},${112 - value / max * 76}`).join(' ')
  return <div><PageHeading eyebrow="THE WORK ADDS UP" title="Your progress" subtitle="Small wins stack into serious strength." action={<span className="period-pill">LAST 30 DAYS <ChevronDown size={13} /></span>} /><div className="progress-kpis"><Kpi icon={Activity} label="TOTAL VOLUME" value={`${(displayVolume(totalVolume, unit) / 1000).toFixed(1)}k`} unit={unit} trend="Across your logged sessions" /><Kpi icon={Dumbbell} label="SETS LOGGED" value={String(totalSets)} unit="sets" trend="Every rep is a deposit" /><Kpi icon={Flame} label="WORKOUTS" value={String(history.length)} unit="sessions" trend="Consistency is the advantage" /></div><section className="surface chart-card"><div className="chart-heading"><div><div className="eyebrow">TRAINING VOLUME</div><h3>Load moved over time</h3></div><span className="chart-legend"><i /> {unit.toUpperCase()} × REPS</span></div><div className="chart-value">{displayVolume(history[0]?.volume, unit).toLocaleString()} <small>{unit}</small><span><ArrowUpRight size={14} /> SESSION VOLUME</span></div><div className="volume-chart"><div className="chart-y">{[1, .75, .5, .25].map((fraction) => <span key={fraction}>{(Math.round(max * fraction / 100) / 10).toFixed(1)}k</span>)}</div><svg viewBox="0 0 300 126" preserveAspectRatio="none" role="img" aria-label="Workout volume trend chart"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#bf2435" stopOpacity=".28" /><stop offset="100%" stopColor="#bf2435" stopOpacity="0" /></linearGradient></defs><path d={`M ${points} L 290 126 L 10 126 Z`} fill="url(#fill)" /><polyline points={points} fill="none" stroke="#db3544" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />{values.map((value, i) => <circle key={i} cx={10 + i * (280 / Math.max(1, values.length - 1))} cy={112 - value / max * 76} r="3.5" fill="#090a0c" stroke="#ee5962" strokeWidth="2" />)}</svg></div><div className="chart-x">{history.slice(0, 6).reverse().map((workout) => <span key={workout.id}>{new Date(`${workout.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>)}</div></section><div className="progress-bottom"><section className="surface prs-list"><div className="section-top"><div><div className="eyebrow">PERSONAL RECORDS</div><h3>Earned, not given.</h3></div><Trophy size={18} className="muted-icon" /></div>{prs.length ? prs.map((pr, i) => <div className="pr-row" key={`${pr.exerciseId}-${i}`}><span className="pr-rank">PR</span><div><b>{pr.name}</b><small>{new Date(`${history.find((w) => w.prs?.includes(pr))?.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small></div><strong>{displayWeight(pr.weight, unit)} {unit}</strong></div>) : <div className="empty-pr"><span><Trophy size={18} /></span><div><b>Your next PR is out there.</b><small>Log a stronger set to make it official.</small></div></div>}</section><section className="surface best-lift"><div className="eyebrow">STRENGTH ESTIMATE</div><h3>Bench press</h3><div className="estimate-value">{displayWeight(estimateOneRepMax(bestBenchSet?.weight ?? 77.5, bestBenchSet?.reps ?? 8), unit)}<small>{unit}</small></div><p>Estimated one rep max</p><div className="estimate-note"><ArrowUpRight size={14} /> Based on {displayWeight(bestBenchSet?.weight ?? 77.5, unit)} {unit} × {bestBenchSet?.reps ?? 8} reps</div></section></div><section className="history-section"><div className="section-heading"><div><div className="eyebrow">TRAINING LOG</div><h3>Recent sessions</h3></div><span className="history-count">{history.length} sessions</span></div>{history.map((workout) => <article className="history-row" key={workout.id}><span className="history-icon"><Dumbbell size={17} /></span><div className="history-name"><b>{workout.title}</b><small>{new Date(`${workout.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {formatDuration(workout.duration)}</small></div><div className="history-vol"><b>{displayVolume(workout.volume, unit).toLocaleString()} {unit}</b><small>{workout.sets} sets</small></div><ChevronRight size={16} /></article>)}</section></div>
}

function Kpi({ icon: Icon, label, value, unit, trend }) { return <section className="surface kpi-card"><div className="kpi-icon"><Icon size={17} /></div><div className="eyebrow">{label}</div><div className="kpi-value">{value}<small> {unit}</small></div><p>{trend}</p></section> }

function ExercisesPage({ search, setSearch }) {
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState(null)
  const muscles = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Quads', 'Hamstrings', 'Core']
  const cues = {
    bench: 'Set your feet and upper back before you unrack. Lower the bar with control to your mid chest, then press up while keeping your wrists stacked.',
    row: 'Keep your chest supported and neck relaxed. Pull your elbows toward your hips, pause briefly, and lower until your arms are long.',
    press: 'Sit tall with your ribs stacked over your hips. Press the dumbbells overhead without arching your lower back, then lower smoothly.',
    pulldown: 'Brace your trunk and draw your elbows down toward your sides. Bring the handle to your upper chest without swinging back.',
    lateral: 'Keep a soft bend in your elbow and raise your arm out to the side. Stop around shoulder height and lower slowly.',
    triceps: 'Keep your upper arms close to your sides. Extend your elbows to move the rope down, then return under control.',
    squat: 'Brace before each rep, sit between your hips, and keep your whole foot planted. Use a depth you can control with a steady torso.',
    rdl: 'Unlock your knees and push your hips back. Keep the load close to your legs and stop when your hamstrings limit the hinge.',
    curl: 'Keep your elbows near your sides. Curl without swinging your torso, then lower until your arms are nearly straight.',
    plank: 'Keep your elbows under your shoulders and form a straight line from head to heels. Breathe steadily and stop before your hips sag.',
  }
  const results = useMemo(() => library.filter((exercise) => (filter === 'All' || exercise.muscle === filter) && `${exercise.name} ${exercise.muscle} ${exercise.type}`.toLowerCase().includes(search.toLowerCase())), [filter, search])
  const alternatives = selected ? library.filter((exercise) => exercise.id !== selected.id && exercise.muscle === selected.muscle).slice(0, 3) : []

  return <div>
    <PageHeading eyebrow="MOVEMENT LIBRARY" title="Exercises" subtitle="Good form today. More strength tomorrow." />
    <label className="library-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search exercises, muscles, equipment" /></label>
    <div className="filter-row">{muscles.map((muscle) => <button key={muscle} className={filter === muscle ? 'filter-chip active' : 'filter-chip'} onClick={() => setFilter(muscle)}>{muscle}</button>)}</div>
    <div className="library-grid">{results.map((exercise, index) => <article className="surface library-card" key={exercise.id}>
      <div className={`exercise-art art-${index % 4}`}><span className="exercise-art-mark">{String(index + 1).padStart(2, '0')}</span><Dumbbell size={26} /></div>
      <div className="library-card-content"><span className="muscle-tag">{exercise.muscle}</span><h3>{exercise.name}</h3><p>{exercise.type} <i>·</i> {exercise.sets} sets <i>·</i> {exercise.reps} reps</p><button className="inline-link" onClick={() => setSelected(exercise)}>Technique cues <ArrowRight size={14} /></button></div>
    </article>)}</div>
    {!results.length && <div className="empty-results"><Search size={21} /><b>No movements found</b><span>Try another name or muscle group.</span></div>}
    {selected && <div className="sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}><section className="add-sheet exercise-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="exercise-detail-title"><div className="sheet-grab" /><div className="sheet-head"><div><span className="eyebrow">{selected.muscle.toUpperCase()} · {selected.type.toUpperCase()}</span><h2 id="exercise-detail-title">{selected.name}</h2></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Close exercise details"><X size={18} /></button></div><div className="detail-block"><span className="detail-symbol"><Sparkles size={17} /></span><div><b>Technique cues</b><p>{cues[selected.id] || 'Move with control, use a comfortable range, and keep each rep consistent.'}</p></div></div><div className="detail-metrics"><Metric label="MUSCLE GROUP" value={selected.muscle} /><Metric label="TARGET" value={`${selected.sets} × ${selected.reps}`} /><Metric label="REST GUIDE" value={`${selected.rest} sec`} /></div>{alternatives.length > 0 && <div className="detail-alternatives"><b>Similar movements</b><div>{alternatives.map((item) => <span key={item.id}>{item.name}</span>)}</div></div>}<p className="detail-note">Use a load and range of motion that you can control comfortably.</p></section></div>}
  </div>
}
function ProfilePage({ champion }) {
  const workouts = champion.history.length
  const monday = new Date()
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const startKey = localDateKey(monday)
  const weekCount = champion.history.filter((workout) => workout.date >= startKey && workout.date <= localDateKey()).length
  const personalRecords = champion.history.flatMap((workout) => workout.prs || []).length

  return <div>
    <PageHeading eyebrow="YOUR ATHLETE PROFILE" title="Profile" subtitle="Your training, your way." />
    <section className="surface profile-hero"><div className="profile-avatar-large">A</div><div className="profile-main"><span className="athlete-tag">STRENGTH ATHLETE</span><h2>Arez</h2><p>Building strength one session at a time.</p></div></section>
    <div className="profile-stats"><Kpi icon={Dumbbell} label="TOTAL WORKOUTS" value={String(workouts)} unit="sessions" trend="Every session counts" /><Kpi icon={Trophy} label="PERSONAL RECORDS" value={String(personalRecords)} unit="records" trend="Milestones in your log" /><Kpi icon={Flame} label="WORKOUTS THIS WEEK" value={String(weekCount)} unit="sessions" trend="Recovery days are part of training" /></div>
    <section className="surface preference-card"><div className="section-top"><div><div className="eyebrow">TRAINING PREFERENCES</div><h3>Make it work for you.</h3></div><Settings2 size={18} className="muted-icon" /></div>
      <div className="preference-row"><span><b>Weight units</b><small>Choose how loads are displayed.</small></span><div className="segmented"><button className={champion.preferences.unit === 'kg' ? 'active' : ''} onClick={() => champion.setPreference('unit', 'kg')}>kg</button><button className={champion.preferences.unit === 'lb' ? 'active' : ''} onClick={() => champion.setPreference('unit', 'lb')}>lb</button></div></div>
      <div className="preference-row"><span><b>Automatic rest timer</b><small>Start a timer when you complete a set.</small></span><button className={`toggle ${champion.preferences.rest ? 'on' : ''}`} onClick={() => champion.setPreference('rest', !champion.preferences.rest)} aria-label="Toggle automatic rest timer"><i /></button></div>
      <div className="demo-privacy"><ShieldCheck size={16} /><span>This demo saves workouts locally in this browser. Cloud sync isn't connected.</span></div>
    </section>
    <div className="profile-foot"><CircleHelp size={16} /> Champion demo · Built for steady progress.</div>
  </div>
}