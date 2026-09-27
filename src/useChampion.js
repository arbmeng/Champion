import { useEffect, useState } from 'react'
import { localDateKey, starterHistory, workoutPlan } from './data'
import { loadAppState, saveAppState } from './persistence'

const defaultState = { history: starterHistory, active: null, preferences: { unit: 'kg', rest: true } }

export function useChampion() {
  const [state, setState] = useState(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let mounted = true
    loadAppState(defaultState).then((saved) => {
      if (mounted) { setState(saved); setReady(true) }
    })
    return () => { mounted = false }
  }, [])
  useEffect(() => {
    if (ready && state) saveAppState(state)
  }, [ready, state])

  function start(title = workoutPlan.title, plan = workoutPlan.exercises) {
    if (state.active) return
    const now = Date.now()
    const exercises = plan.map((exercise) => ({
      ...exercise,
      sets: Array.from({ length: exercise.sets || 3 }, (_, i) => ({
        id: `${exercise.id}-${i + 1}`,
        weight: exercise.weight ? String(exercise.weight) : '',
        reps: '',
        done: false,
      })),
    }))
    setState((current) => ({ ...current, active: { id: `workout-${now}`, title, startedAt: now, exercises, restEndsAt: null, restDuration: null } }))
  }

  function patchActive(updater) {
    setState((current) => current.active ? { ...current, active: typeof updater === 'function' ? updater(current.active) : updater } : current)
  }

  function finish() {
    const active = state.active
    if (!active) return null
    const entries = active.exercises.map((exercise) => ({
      exerciseId: exercise.id,
      name: exercise.name,
      sets: exercise.sets.filter((set) => set.done).map((set) => ({ weight: Number(set.weight) || 0, reps: Number(set.reps) || 0 })),
    })).filter((entry) => entry.sets.length)
    const sets = entries.reduce((sum, entry) => sum + entry.sets.length, 0)
    const volume = entries.reduce((sum, entry) => sum + entry.sets.reduce((n, set) => n + set.weight * set.reps, 0), 0)
    const prs = []
    for (const entry of entries) {
      const previous = state.history.flatMap((workout) => workout.entries || []).filter((row) => row.exerciseId === entry.exerciseId).flatMap((row) => row.sets || [])
      const bestPrevious = Math.max(0, ...previous.map((set) => set.weight))
      const bestCurrent = Math.max(0, ...entry.sets.map((set) => set.weight))
      if (bestCurrent > bestPrevious && bestPrevious > 0) prs.push({ exerciseId: entry.exerciseId, name: entry.name, weight: bestCurrent })
    }
    const previousWorkout = state.history.find((entry) => entry.title === active.title)
    const comparableCoverage = previousWorkout && entries.length >= Math.ceil((previousWorkout.exercises || entries.length) * 0.7)
    const workout = {
      id: active.id,
      title: active.title,
      date: localDateKey(),
      duration: Math.max(0, Math.floor((Date.now() - active.startedAt) / 1000)),
      volume,
      sets,
      exercises: entries.length,
      entries,
      muscles: [...new Set(active.exercises.filter((exercise) => exercise.sets.some((set) => set.done)).map((exercise) => ['Quads', 'Hamstrings', 'Glutes', 'Calves'].includes(exercise.muscle) ? 'Legs' : exercise.muscle))],
      prs,
      previousVolume: comparableCoverage ? previousWorkout.volume : null,
    }
    setState((current) => ({ ...current, active: null, history: [workout, ...current.history] }))
    return workout
  }

  function setPreference(key, value) {
    setState((current) => ({ ...current, preferences: { ...current.preferences, [key]: value } }))
  }

  return { ...(state || defaultState), ready, start, patchActive, finish, setPreference }
}
