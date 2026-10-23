import { library } from './data'

const DB_NAME = 'champion-local'
const STORE_NAME = 'app-state'
const STATE_KEY = 'demo-profile'
const LEGACY_KEY = 'champion.demo.v1'
const muscleByExercise = new Map(library.map((exercise) => [exercise.id, exercise.muscle]))

function normalizeState(saved, defaultState) {
  // drop the old demo sessions that earlier versions seeded into saved profiles
  const history = (Array.isArray(saved?.history) ? saved.history : defaultState.history).filter((workout) => !String(workout.id).startsWith('seed-'))
  return {
    ...defaultState,
    ...saved,
    history: history.map((workout) => {
      if (Array.isArray(workout.muscles)) return workout
      const inferred = (workout.entries || []).map((entry) => muscleByExercise.get(entry.exerciseId)).filter(Boolean)
      const titleBased = workout.title?.startsWith('Upper') ? ['Chest', 'Back', 'Shoulders', 'Arms'] : workout.title?.startsWith('Lower') ? ['Legs', 'Glutes', 'Core'] : []
      const muscles = [...new Set([...inferred, ...titleBased].map((muscle) => ['Quads', 'Hamstrings', 'Glutes', 'Calves'].includes(muscle) ? 'Legs' : muscle))]
      return { ...workout, muscles }
    }),
    preferences: { ...defaultState.preferences, ...(saved?.preferences || {}) },
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is unavailable'))
      return
    }
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadAppState(defaultState) {
  try {
    const database = await openDatabase()
    const saved = await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(STATE_KEY)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
    database.close()
    if (saved) return normalizeState(saved, defaultState)
  } catch { /* continue with a local fallback when IndexedDB is unavailable */ }

  try {
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) return normalizeState(JSON.parse(legacy), defaultState)
  } catch { /* private browsing or unavailable storage */ }
  return defaultState
}

export async function saveAppState(state) {
  try {
    const database = await openDatabase()
    await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(state, STATE_KEY)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
    database.close()
    return
  } catch { /* the demo can still run for this browser session */ }

  try { localStorage.setItem(LEGACY_KEY, JSON.stringify(state)) } catch { /* storage disabled or full */ }
}
