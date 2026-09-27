export const workoutPlan = {
  id: 'upper-a',
  title: 'Upper A',
  focus: 'Strength · upper body',
  duration: 52,
  exercises: [
    { id: 'bench', name: 'Barbell Bench Press', muscle: 'Chest', type: 'Compound', sets: 3, reps: '6–8', rest: 150, weight: 80 },
    { id: 'row', name: 'Chest-Supported Row', muscle: 'Back', type: 'Compound', sets: 3, reps: '8–10', rest: 120, weight: 55 },
    { id: 'press', name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'Compound', sets: 3, reps: '8–10', rest: 120, weight: 22 },
    { id: 'pulldown', name: 'Lat Pulldown', muscle: 'Back', type: 'Compound', sets: 3, reps: '10–12', rest: 90, weight: 52.5 },
    { id: 'lateral', name: 'Cable Lateral Raise', muscle: 'Shoulders', type: 'Isolation', sets: 3, reps: '12–15', rest: 75, weight: 7.5 },
    { id: 'triceps', name: 'Rope Triceps Pressdown', muscle: 'Arms', type: 'Isolation', sets: 3, reps: '10–12', rest: 75, weight: 25 },
  ],
}

export const library = [
  ...workoutPlan.exercises,
  { id: 'squat', name: 'Barbell Back Squat', muscle: 'Quads', type: 'Compound', sets: 3, reps: '6–8', rest: 180, weight: 90 },
  { id: 'rdl', name: 'Romanian Deadlift', muscle: 'Hamstrings', type: 'Compound', sets: 3, reps: '8–10', rest: 150, weight: 80 },
  { id: 'curl', name: 'Dumbbell Curl', muscle: 'Arms', type: 'Isolation', sets: 3, reps: '10–12', rest: 75, weight: 12 },
  { id: 'plank', name: 'Front Plank', muscle: 'Core', type: 'Bodyweight', sets: 3, reps: '30–45 sec', rest: 60, weight: 0 },
]

export const starterHistory = [
  { id: 'seed-1', title: 'Upper A', date: '2026-09-24', duration: 3090, volume: 4620, sets: 18, exercises: 6, muscles: ['Chest', 'Back', 'Shoulders', 'Arms'], prs: [],
    entries: [{ exerciseId: 'bench', name: 'Barbell Bench Press', sets: [{ weight: 77.5, reps: 8 }, { weight: 77.5, reps: 8 }, { weight: 77.5, reps: 7 }] }] },
  { id: 'seed-2', title: 'Lower A', date: '2026-09-22', duration: 3420, volume: 7380, sets: 18, exercises: 6, muscles: ['Legs', 'Glutes', 'Core'], prs: [], entries: [] },
  { id: 'seed-3', title: 'Upper B', date: '2026-09-20', duration: 3180, volume: 4980, sets: 18, exercises: 6, muscles: ['Chest', 'Back', 'Shoulders', 'Arms'], prs: [], entries: [] },
]

export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const hrs = Math.floor(mins / 60)
  return hrs ? `${hrs}:${String(mins % 60).padStart(2, '0')}` : `${Math.max(1, Math.ceil(seconds / 60))} min`
}

export const formatTimer = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export const volumeFor = (sets) => sets.reduce((sum, set) => sum + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0)

export function displayWeight(value, unit = 'kg') {
  const weight = Number(value) || 0
  return unit === 'lb' ? Math.round(weight * 2.2046226218 * 10) / 10 : weight
}

export function displayVolume(value, unit = 'kg') {
  return Math.round((Number(value) || 0) * (unit === 'lb' ? 2.2046226218 : 1))
}

export function toKilograms(value, unit = 'kg') {
  const weight = Number(value) || 0
  return unit === 'lb' ? Math.round((weight / 2.2046226218) * 1000) / 1000 : weight
}

export function estimateOneRepMax(weight, reps) {
  if (!weight || !reps || reps > 12) return null
  // Epley estimate: weight × (1 + reps / 30). This is an estimate, not a measured max.
  return Math.round(weight * (1 + reps / 30))
}
