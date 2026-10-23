import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { achievementList, exerciseStats, findExercise, findWorkout, previousSets, setVolume } from './selectors'
import { createSeed, emptyState, STORAGE_KEY } from './seed'
import { dateKey } from '../lib/dates'
import { e1rm, roundTo } from '../lib/format'
import { buildCustomWorkout } from '../data/workouts'
import { courseMap } from '../data/courses'
import { foods } from '../data/social'

const AppContext = createContext(null)
let uid = 0
const newId = (p) => `${p}-${Date.now().toString(36)}${(uid++).toString(36)}`

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      if (saved?.v === 1) return saved
    }
  } catch { /* storage unavailable — fall through to the demo profile */ }
  return createSeed()
}

const toggle = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
const patchAt = (arr, i, fn) => arr.map((x, idx) => (idx === i ? fn(x) : x))

function buildActive(state, { workout, courseId = null, sessionIndex = null, now }) {
  const exercises = workout.exercises.map((item) => makeActiveExercise(state, item.exerciseId, item.sets, item.reps, item.rest))
  const rate = workout.calories / workout.minutes
  return { id: newId('log'), workoutId: workout.id, title: workout.title, categories: workout.categories, courseId, sessionIndex, startedAt: now, current: 0, exercises, restEndsAt: null, restTotal: 0, rate }
}

export function makeActiveExercise(state, exerciseId, sets, reps, rest) {
  const ex = findExercise(state, exerciseId)
  const prev = previousSets(state, exerciseId)
  const hitTop = prev.length > 0 && prev.every((s) => s.reps >= reps[1]) && ex.weighted
  const inc = (prev[0]?.weight || 0) >= 40 ? 2.5 : 1
  const suggest = hitTop ? { weight: roundTo((prev[0].weight || 0) + inc, 0.5), reason: `You hit ${reps[1]} reps on every set last time` } : null
  return {
    key: newId('ex'), exerciseId, rest: rest ?? ex.rest, reps,
    suggest,
    sets: Array.from({ length: sets }, (_, j) => {
      const p = prev[j] || prev[prev.length - 1]
      return { weight: p ? p.weight : ex.weight, reps: p ? p.reps : reps[1], rir: p?.rir ?? 2, done: false, prev: prev[j] ? { weight: prev[j].weight, reps: prev[j].reps } : null }
    }),
  }
}

function finishWorkout(state, now) {
  const a = state.active
  const entries = a.exercises
    .map((e) => ({ exerciseId: e.exerciseId, sets: e.sets.filter((s) => s.done).map((s) => ({ weight: Number(s.weight) || 0, reps: Number(s.reps) || 0, rir: Number(s.rir) || 0 })) }))
    .filter((e) => e.sets.length)
  let volume = 0, setCount = 0
  const prs = []
  for (const e of entries) {
    const ex = findExercise(state, e.exerciseId)
    setCount += e.sets.length
    volume += e.sets.reduce((n, s) => n + setVolume(ex, s), 0)
    if (!ex || ex.repLabel !== 'reps') continue
    const before = exerciseStats(state, e.exerciseId)
    const top = e.sets.reduce((b, s) => (e1rm(s.weight, s.reps) > e1rm(b.weight, b.reps) ? s : b))
    if (before.best && top.weight > 0 && e1rm(top.weight, top.reps) > e1rm(before.best.weight, before.best.reps)) prs.push({ exerciseId: ex.id, name: ex.name, weight: top.weight, reps: top.reps })
  }
  const duration = Math.max(60, Math.round((now - a.startedAt) / 1000))
  const log = {
    id: a.id, workoutId: a.workoutId, title: a.title, categories: a.categories, date: dateKey(new Date(now)), startedAt: a.startedAt, duration,
    volume: Math.round(volume), sets: setCount, exercises: entries.length,
    muscles: [...new Set(entries.map((e) => findExercise(state, e.exerciseId)?.muscle).filter(Boolean))],
    calories: Math.round((duration / 60) * (a.rate || 6)), entries, prs, courseId: a.courseId, sessionIndex: a.sessionIndex, newAchievements: [],
  }
  const next = { ...state, active: null, history: [log, ...state.history] }
  const before = achievementList(state)
  const after = achievementList(next)
  const unlockedNow = after.filter((x, i) => x.unlocked && !before[i].unlocked)
  log.newAchievements = unlockedNow.map((x) => x.id)
  const unlocked = { ...state.unlocked }
  for (const x of unlockedNow) unlocked[x.id] = log.date
  const notes = []
  const ts = now
  for (const pr of prs) notes.push({ id: newId('n'), type: 'pr', title: 'New PR', body: `${pr.name} · ${pr.weight} kg × ${pr.reps}`, ts, read: false, href: `/exercises/${pr.exerciseId}` })
  for (const x of unlockedNow) notes.push({ id: newId('n'), type: 'achievement', title: 'Achievement unlocked', body: x.title, ts, read: false, href: '/profile' })
  if (log.courseId) notes.push({ id: newId('n'), type: 'course', title: 'Course progress', body: `${courseMap[log.courseId].title} · session ${log.sessionIndex + 1} complete.`, ts, read: false, href: `/courses/${log.courseId}` })
  return { ...next, history: [log, ...state.history], unlocked, notifications: [...notes, ...state.notifications] }
}

function reducer(state, action) {
  switch (action.type) {
    case 'reset': return action.state
    case 'settings': return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'user': return { ...state, user: { ...state.user, ...action.patch } }
    case 'onboarded': return { ...state, onboarded: true }

    case 'start': {
      if (state.active) return state
      return { ...state, active: buildActive(state, action) }
    }
    case 'discard': return { ...state, active: null }
    case 'setCurrent': return state.active ? { ...state, active: { ...state.active, current: action.index } } : state
    case 'patchSet': return { ...state, active: { ...state.active, exercises: patchAt(state.active.exercises, action.ex, (e) => ({ ...e, sets: patchAt(e.sets, action.set, (s) => ({ ...s, ...action.patch })) })) } }
    case 'completeSet': {
      const a = state.active
      const exercise = a.exercises[action.ex]
      const isLastOverall = a.exercises.every((e, ei) => e.sets.every((s, si) => s.done || (ei === action.ex && si === action.set)))
      const restOn = state.settings.autoRest && !isLastOverall && exercise.rest > 0 && action.rest !== false
      const exercises = patchAt(a.exercises, action.ex, (e) => ({ ...e, sets: patchAt(e.sets, action.set, (s) => ({ ...s, done: true })) }))
      const doneAll = exercises[action.ex].sets.every((s) => s.done)
      return { ...state, active: { ...a, exercises, current: doneAll ? Math.min(a.exercises.length - 1, action.ex + 1) : a.current, restEndsAt: restOn ? action.now + exercise.rest * 1000 : null, restTotal: restOn ? exercise.rest : 0 } }
    }
    case 'uncompleteSet': return { ...state, active: { ...state.active, exercises: patchAt(state.active.exercises, action.ex, (e) => ({ ...e, sets: patchAt(e.sets, action.set, (s) => ({ ...s, done: false })) })) } }
    case 'addSet': return { ...state, active: { ...state.active, exercises: patchAt(state.active.exercises, action.ex, (e) => { const last = e.sets[e.sets.length - 1]; return { ...e, sets: [...e.sets, { weight: last.weight, reps: last.reps, rir: last.rir, done: false, prev: null }] } }) } }
    case 'removeSet': return { ...state, active: { ...state.active, exercises: patchAt(state.active.exercises, action.ex, (e) => (e.sets.length > 1 ? { ...e, sets: e.sets.filter((_, i) => i !== action.set) } : e)) } }
    case 'addExercise': {
      const ex = findExercise(state, action.exerciseId)
      if (!ex) return state
      const item = makeActiveExercise(state, ex.id, ex.sets, ex.reps, ex.rest)
      return { ...state, active: { ...state.active, exercises: [...state.active.exercises, item], current: state.active.exercises.length } }
    }
    case 'removeExercise': {
      const exercises = state.active.exercises.filter((_, i) => i !== action.index)
      return exercises.length ? { ...state, active: { ...state.active, exercises, current: Math.min(state.active.current, exercises.length - 1) } } : state
    }
    case 'copyLast': return { ...state, active: { ...state.active, exercises: state.active.exercises.map((e) => { const prev = previousSets(state, e.exerciseId); return prev.length ? { ...e, sets: e.sets.map((s, j) => (s.done ? s : { ...s, weight: (prev[j] || prev[prev.length - 1]).weight, reps: (prev[j] || prev[prev.length - 1]).reps, rir: (prev[j] || prev[prev.length - 1]).rir ?? s.rir })) } : e }) } }
    case 'skipRest': return { ...state, active: { ...state.active, restEndsAt: null, restTotal: 0 } }
    case 'adjustRest': return state.active?.restEndsAt ? { ...state, active: { ...state.active, restEndsAt: state.active.restEndsAt + action.ms, restTotal: Math.max(5, state.active.restTotal + action.ms / 1000) } } : state
    case 'finish': return state.active ? finishWorkout(state, action.now) : state

    case 'favorite': return { ...state, favorites: { ...state.favorites, [action.kind]: toggle(state.favorites[action.kind], action.id) } }
    case 'enroll': return { ...state, enrolled: state.enrolled.includes(action.id) ? state.enrolled : [...state.enrolled, action.id], activeCourse: action.id }
    case 'leaveCourse': { const enrolled = state.enrolled.filter((c) => c !== action.id); return { ...state, enrolled, activeCourse: state.activeCourse === action.id ? enrolled[0] || null : state.activeCourse } }
    case 'activeCourse': return { ...state, activeCourse: action.id }

    case 'goalAdd': return { ...state, goals: [...state.goals, { ...action.goal, id: newId('g') }] }
    case 'goalRemove': return { ...state, goals: state.goals.filter((g) => g.id !== action.id) }
    case 'joinChallenge': return { ...state, joinedChallenges: { ...state.joinedChallenges, [action.id]: !state.joinedChallenges[action.id] } }

    case 'like': return { ...state, social: { ...state.social, liked: { ...state.social.liked, [action.id]: !state.social.liked[action.id] } } }
    case 'comment': return { ...state, social: { ...state.social, comments: { ...state.social.comments, [action.id]: [...(state.social.comments[action.id] || []), { id: newId('c'), text: action.text }] } } }
    case 'follow': return { ...state, social: { ...state.social, following: { ...state.social.following, [action.id]: !state.social.following[action.id] } } }
    case 'group': return { ...state, social: { ...state.social, groups: { ...state.social.groups, [action.id]: !state.social.groups[action.id] } } }
    case 'share': return { ...state, social: { ...state.social, posts: [{ id: newId('post'), logId: action.logId, text: action.text, ts: action.now }, ...state.social.posts] } }

    case 'notifRead': return { ...state, notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)) }
    case 'notifReadAll': return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) }
    case 'notifClear': return { ...state, notifications: [] }
    case 'notifAdd': return { ...state, notifications: [{ id: newId('n'), read: false, ts: action.now, ...action.note }, ...state.notifications] }

    case 'bodyAdd': return { ...state, body: [{ ...action.entry }, ...state.body.filter((b) => b.date !== action.entry.date)].sort((a, b) => b.date.localeCompare(a.date)) }

    case 'food': {
      const key = dateKey()
      const day = state.nutrition.log[key] || { meals: { breakfast: [], lunch: [], dinner: [], snack: [] }, water: 0 }
      const food = action.food
      return { ...state, nutrition: { ...state.nutrition, log: { ...state.nutrition.log, [key]: { ...day, meals: { ...day.meals, [action.meal]: [...day.meals[action.meal], { ...food, id: newId('f'), qty: action.qty }] } } } } }
    }
    case 'foodRemove': {
      const key = dateKey()
      const day = state.nutrition.log[key]
      if (!day) return state
      return { ...state, nutrition: { ...state.nutrition, log: { ...state.nutrition.log, [key]: { ...day, meals: { ...day.meals, [action.meal]: day.meals[action.meal].filter((f) => f.id !== action.id) } } } } }
    }
    case 'water': {
      const key = dateKey()
      const day = state.nutrition.log[key] || { meals: { breakfast: [], lunch: [], dinner: [], snack: [] }, water: 0 }
      return { ...state, nutrition: { ...state.nutrition, log: { ...state.nutrition.log, [key]: { ...day, water: Math.max(0, day.water + action.ml) } } } }
    }
    case 'device': return { ...state, devices: { ...state.devices, [action.id]: !state.devices[action.id] } }

    case 'coachAdd': return { ...state, coach: [...state.coach, ...action.messages] }
    case 'coachClear': return { ...state, coach: state.coach.slice(0, 1) }
    case 'viewed': return { ...state, recent: { ...state.recent, exercises: [action.id, ...state.recent.exercises.filter((x) => x !== action.id)].slice(0, 8) } }
    case 'search': {
      const q = action.q.trim().toLowerCase()
      return q.length < 2 ? state : { ...state, recent: { ...state.recent, searches: [q, ...state.recent.searches.filter((x) => x !== q)].slice(0, 6) } }
    }
    case 'clearSearches': return { ...state, recent: { ...state.recent, searches: [] } }

    case 'customWorkout': return { ...state, customWorkouts: [...state.customWorkouts.filter((w) => w.id !== action.workout.id), action.workout] }
    case 'deleteWorkout': return { ...state, customWorkouts: state.customWorkouts.filter((w) => w.id !== action.id), favorites: { ...state.favorites, workouts: state.favorites.workouts.filter((w) => w !== action.id) } }
    case 'customExercise': return { ...state, customExercises: [...state.customExercises, action.exercise] }
    default: return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, load)
  const timer = useRef(null)

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* storage full or blocked */ }
    }, 250)
    return () => clearTimeout(timer.current)
  }, [state])

  // flush immediately when the tab is hidden or closed so the last change is never lost to the debounce
  const latest = useRef(state)
  latest.current = state
  useEffect(() => {
    const flush = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(latest.current)) } catch { /* storage unavailable */ } }
    const onVis = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVis)
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  const actions = useMemo(() => ({
    patchSettings: (patch) => dispatch({ type: 'settings', patch }),
    patchUser: (patch) => dispatch({ type: 'user', patch }),
    finishOnboarding: () => dispatch({ type: 'onboarded' }),
    start: (workout, opts = {}) => dispatch({ type: 'start', workout, now: Date.now(), ...opts }),
    discard: () => dispatch({ type: 'discard' }),
    setCurrent: (index) => dispatch({ type: 'setCurrent', index }),
    patchSet: (ex, set, patch) => dispatch({ type: 'patchSet', ex, set, patch }),
    completeSet: (ex, set, rest) => dispatch({ type: 'completeSet', ex, set, now: Date.now(), rest }),
    uncompleteSet: (ex, set) => dispatch({ type: 'uncompleteSet', ex, set }),
    addSet: (ex) => dispatch({ type: 'addSet', ex }),
    removeSet: (ex, set) => dispatch({ type: 'removeSet', ex, set }),
    addExercise: (exerciseId) => dispatch({ type: 'addExercise', exerciseId }),
    removeExercise: (index) => dispatch({ type: 'removeExercise', index }),
    copyLast: () => dispatch({ type: 'copyLast' }),
    skipRest: () => dispatch({ type: 'skipRest' }),
    adjustRest: (ms) => dispatch({ type: 'adjustRest', ms }),
    finish: () => dispatch({ type: 'finish', now: Date.now() }),
    favorite: (kind, id) => dispatch({ type: 'favorite', kind, id }),
    enroll: (id) => dispatch({ type: 'enroll', id }),
    leaveCourse: (id) => dispatch({ type: 'leaveCourse', id }),
    setActiveCourse: (id) => dispatch({ type: 'activeCourse', id }),
    addGoal: (goal) => dispatch({ type: 'goalAdd', goal }),
    removeGoal: (id) => dispatch({ type: 'goalRemove', id }),
    joinChallenge: (id) => dispatch({ type: 'joinChallenge', id }),
    like: (id) => dispatch({ type: 'like', id }),
    comment: (id, text) => dispatch({ type: 'comment', id, text }),
    follow: (id) => dispatch({ type: 'follow', id }),
    toggleGroup: (id) => dispatch({ type: 'group', id }),
    share: (logId, text) => dispatch({ type: 'share', logId, text, now: Date.now() }),
    notifRead: (id) => dispatch({ type: 'notifRead', id }),
    notifReadAll: () => dispatch({ type: 'notifReadAll' }),
    notifClear: () => dispatch({ type: 'notifClear' }),
    notify: (note) => dispatch({ type: 'notifAdd', note, now: Date.now() }),
    addBody: (entry) => dispatch({ type: 'bodyAdd', entry }),
    addFood: (foodId, meal, qty) => dispatch({ type: 'food', food: foods.find((f) => f.id === foodId), meal, qty }),
    addCustomFood: (food, meal, qty) => dispatch({ type: 'food', food, meal, qty }),
    removeFood: (meal, id) => dispatch({ type: 'foodRemove', meal, id }),
    addWater: (ml) => dispatch({ type: 'water', ml }),
    toggleDevice: (id) => dispatch({ type: 'device', id }),
    coachAdd: (messages) => dispatch({ type: 'coachAdd', messages }),
    coachClear: () => dispatch({ type: 'coachClear' }),
    viewed: (id) => dispatch({ type: 'viewed', id }),
    search: (q) => dispatch({ type: 'search', q }),
    clearSearches: () => dispatch({ type: 'clearSearches' }),
    saveWorkout: (def) => { const workout = buildCustomWorkout({ id: def.id || newId('cw'), ...def }); dispatch({ type: 'customWorkout', workout }); return workout },
    deleteWorkout: (id) => dispatch({ type: 'deleteWorkout', id }),
    addExerciseDef: (exercise) => dispatch({ type: 'customExercise', exercise }),
    resetDemo: () => dispatch({ type: 'reset', state: { ...createSeed(), onboarded: true } }),
    clearAll: () => dispatch({ type: 'reset', state: { ...emptyState(), onboarded: true } }),
    restartOnboarding: () => dispatch({ type: 'reset', state: { ...state, onboarded: false } }),
  }), [state])

  const value = useMemo(() => ({ state, actions }), [state, actions])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

export const useWorkout = (id) => { const { state } = useApp(); return findWorkout(state, id) }
export function useNow(intervalMs = 1000, enabled = true) {
  const [, force] = useReducer((n) => n + 1, 0)
  const cb = useCallback(force, [])
  useEffect(() => {
    if (!enabled) return undefined
    const t = setInterval(cb, intervalMs)
    return () => clearInterval(t)
  }, [cb, intervalMs, enabled])
  return Date.now()
}
