import { exerciseMap } from './exercises'

export const CATEGORIES = ['Strength', 'Hypertrophy', 'Power', 'HIIT', 'Cardio', 'Mobility', 'Recovery', 'Full Body', 'Upper', 'Lower', 'Push', 'Pull', 'Legs', 'Core']
export const GOALS = ['Build muscle', 'Get stronger', 'Lose fat', 'Improve fitness', 'Improve endurance', 'Stay active']
export const TRAINERS = ['Marcus Hale', 'Dana Ortiz', 'Kenji Mori', 'Priya Nair', 'Sam Whitfield']

// [id, title, description, categories, goal, level, place, trainer, minutes, [[exerciseId, sets, repLo, repHi], ...]]
const rows = [
  ['upper-a', 'Upper A · Strength', 'Heavy compound pressing and pulling to drive upper-body strength, finished with focused arm work.', ['Strength', 'Upper'], 'Get stronger', 'Intermediate', 'Gym', 'Marcus Hale', 68,
    [['bench', 4, 6, 8], ['bb-row', 4, 6, 8], ['ohp', 3, 6, 8], ['lat-pulldown', 3, 8, 10], ['lateral', 3, 12, 15], ['pressdown', 3, 10, 12], ['curl', 3, 10, 12]]],
  ['upper-b', 'Upper B · Hypertrophy', 'Higher-rep upper-body volume with machines and cables for chest, back, shoulders and arms.', ['Hypertrophy', 'Upper'], 'Build muscle', 'Intermediate', 'Gym', 'Marcus Hale', 68,
    [['incline-machine', 4, 8, 12], ['cable-row', 3, 10, 12], ['incline-db', 3, 8, 10], ['pullup', 3, 5, 8], ['rear-delt', 3, 12, 15], ['oh-triceps', 3, 10, 12], ['cable-curl', 3, 10, 15]]],
  ['lower-a', 'Lower A · Squat Focus', 'Squat-led lower body session with posterior-chain support.', ['Strength', 'Lower', 'Legs'], 'Get stronger', 'Intermediate', 'Gym', 'Marcus Hale', 72,
    [['squat', 4, 5, 8], ['rdl', 3, 8, 10], ['leg-press', 3, 10, 12], ['leg-curl', 3, 10, 12], ['cable-crunch', 3, 12, 15]]],
  ['lower-b', 'Lower B · Hinge Focus', 'Hinge-led lower body session with single-leg work and glutes.', ['Hypertrophy', 'Lower', 'Legs'], 'Build muscle', 'Intermediate', 'Gym', 'Marcus Hale', 70,
    [['rdl', 4, 6, 8], ['split-squat', 3, 8, 10], ['hip-thrust', 3, 8, 12], ['leg-ext', 3, 12, 15], ['leg-raise', 3, 8, 12]]],

  ['push', 'Push Day', 'Chest, shoulders and triceps with a heavy press followed by volume work.', ['Hypertrophy', 'Push', 'Upper'], 'Build muscle', 'Advanced', 'Gym', 'Kenji Mori', 65,
    [['bench', 4, 6, 8], ['ohp', 3, 6, 8], ['incline-db', 3, 8, 10], ['cable-fly', 3, 12, 15], ['db-lateral', 4, 12, 15], ['skull', 3, 8, 12]]],
  ['pull', 'Pull Day', 'Back thickness, width and biceps in one focused session.', ['Hypertrophy', 'Pull', 'Upper'], 'Build muscle', 'Advanced', 'Gym', 'Kenji Mori', 62,
    [['deadlift', 3, 3, 5], ['pullup', 4, 5, 8], ['chest-row', 3, 8, 12], ['rear-delt', 3, 12, 15], ['hammer', 3, 10, 12], ['cable-curl', 3, 10, 15]]],
  ['legs', 'Leg Day', 'Quads, hamstrings and glutes with a heavy squat and high-quality accessories.', ['Hypertrophy', 'Legs', 'Lower'], 'Build muscle', 'Advanced', 'Gym', 'Kenji Mori', 75,
    [['squat', 4, 5, 8], ['rdl', 3, 8, 10], ['leg-press', 3, 10, 12], ['leg-curl', 3, 10, 12], ['leg-ext', 3, 12, 15], ['plank', 3, 30, 60]]],

  ['fb-a', 'Full Body A', 'A simple full-body session built on squat, press and row patterns.', ['Strength', 'Full Body'], 'Get stronger', 'Beginner', 'Gym', 'Dana Ortiz', 55,
    [['goblet', 3, 10, 12], ['db-bench', 3, 8, 12], ['cable-row', 3, 10, 12], ['db-press', 2, 8, 10], ['plank', 3, 30, 45]]],
  ['fb-b', 'Full Body B', 'Hinge, pull and push patterns to build a solid foundation.', ['Strength', 'Full Body'], 'Get stronger', 'Beginner', 'Gym', 'Dana Ortiz', 55,
    [['leg-press', 3, 10, 12], ['lat-pulldown', 3, 10, 12], ['machine-chest', 3, 10, 12], ['rdl', 3, 8, 10], ['cable-crunch', 3, 12, 15]]],
  ['fb-c', 'Full Body C', 'Single-leg work, rows and presses with arm finishers.', ['Strength', 'Full Body'], 'Get stronger', 'Beginner', 'Gym', 'Dana Ortiz', 55,
    [['lunge', 3, 10, 12], ['db-row', 3, 8, 12], ['incline-machine', 3, 8, 12], ['lateral', 3, 12, 15], ['curl', 2, 10, 12], ['pressdown', 2, 10, 12]]],

  ['hd-upper', 'Home Upper', 'Dumbbell and bodyweight upper-body hypertrophy for home training.', ['Hypertrophy', 'Upper'], 'Build muscle', 'Intermediate', 'Home', 'Priya Nair', 48,
    [['db-bench', 4, 8, 12], ['db-row', 4, 8, 12], ['db-press', 3, 8, 12], ['pushup', 3, 10, 20], ['curl', 3, 10, 12], ['skull', 3, 10, 12]]],
  ['hd-lower', 'Home Lower', 'Unilateral leg work and glute drive with dumbbells and bodyweight.', ['Hypertrophy', 'Lower', 'Legs'], 'Build muscle', 'Intermediate', 'Home', 'Priya Nair', 45,
    [['goblet', 4, 10, 12], ['split-squat', 3, 8, 12], ['rdl', 3, 10, 12], ['glute-bridge', 3, 12, 20], ['plank', 3, 30, 60]]],
  ['hd-push', 'Home Push', 'Pressing session using dumbbells and push-up variations.', ['Hypertrophy', 'Push'], 'Build muscle', 'Intermediate', 'Home', 'Priya Nair', 42,
    [['db-bench', 4, 8, 12], ['db-press', 3, 8, 12], ['pushup', 3, 10, 20], ['db-lateral', 3, 12, 15], ['skull', 3, 10, 12]]],
  ['hd-pull', 'Home Pull', 'Dumbbell rows, curls and rear-delt work with minimal equipment.', ['Hypertrophy', 'Pull'], 'Build muscle', 'Intermediate', 'Home', 'Priya Nair', 42,
    [['db-row', 4, 8, 12], ['pullup', 3, 5, 8], ['hammer', 3, 10, 12], ['curl', 3, 10, 12], ['plank', 3, 30, 60]]],
  ['bw-basics', 'Bodyweight Basics', 'No equipment needed. Push, squat, bridge and brace.', ['Full Body', 'Strength'], 'Stay active', 'Beginner', 'Home', 'Dana Ortiz', 30,
    [['pushup', 3, 8, 15], ['jump-squat', 3, 10, 15], ['glute-bridge', 3, 12, 20], ['mtn-climber', 3, 30, 40], ['plank', 3, 30, 45]]],

  ['power-upper', 'Upper Power', 'Low-rep pressing and pulling with long rests for maximal output.', ['Power', 'Strength', 'Upper'], 'Get stronger', 'Advanced', 'Gym', 'Sam Whitfield', 55,
    [['bench', 5, 3, 5], ['bb-row', 5, 3, 5], ['ohp', 4, 3, 5], ['pullup', 4, 3, 5]]],
  ['hiit-circuit', 'HIIT Engine', 'Full-body conditioning circuit. Short, sharp and scalable.', ['HIIT', 'Full Body'], 'Lose fat', 'Intermediate', 'Home', 'Sam Whitfield', 25,
    [['kb-swing', 4, 15, 20], ['burpee', 4, 10, 15], ['jump-squat', 4, 10, 15], ['mtn-climber', 4, 30, 45]]],
  ['cardio-row', 'Rowing Intervals', 'Aerobic rowing intervals to build your engine without leg fatigue.', ['Cardio'], 'Improve endurance', 'Beginner', 'Gym', 'Sam Whitfield', 30,
    [['row-erg', 5, 2, 4]]],
  ['mobility-flow', 'Hips & Spine Mobility', 'A calm mobility flow for tight hips and a stiff upper back.', ['Mobility', 'Recovery'], 'Stay active', 'Beginner', 'Home', 'Priya Nair', 18,
    [['cat-cow', 2, 8, 10], ['hip-switch', 2, 8, 10], ['thoracic', 2, 8, 10], ['wgs', 2, 5, 6]]],
  ['recovery-reset', 'Active Recovery Reset', 'An easy movement session for rest days — keep the heart rate low.', ['Recovery', 'Mobility'], 'Stay active', 'Beginner', 'Home', 'Priya Nair', 20,
    [['cat-cow', 2, 8, 10], ['glute-bridge', 2, 12, 15], ['hip-switch', 2, 8, 10], ['plank', 2, 20, 30]]],
]

const perMinute = { HIIT: 11, Cardio: 9, Mobility: 3, Recovery: 3, Power: 6, default: 6 }

export const workouts = rows.map(([id, title, description, categories, goal, level, place, trainer, minutes, items]) => {
  const list = items.map(([exerciseId, sets, lo, hi]) => ({ exerciseId, sets, reps: [lo, hi], rest: exerciseMap[exerciseId].rest }))
  const muscles = [...new Set(list.map((i) => exerciseMap[i.exerciseId].muscle))]
  const equipment = [...new Set(list.map((i) => exerciseMap[i.exerciseId].equipment))]
  const rate = perMinute[categories.find((c) => perMinute[c])] || perMinute.default
  return { id, title, description, categories, goal, level, place, trainer, minutes, exercises: list, muscles, equipment, calories: Math.round(minutes * rate), hue: hueFor(id) }
})

function hueFor(id) {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360
  return h
}

export const workoutMap = Object.fromEntries(workouts.map((w) => [w.id, w]))
export const getWorkout = (id, custom = []) => workoutMap[id] || custom.find((w) => w.id === id)

export function buildCustomWorkout({ id, title, items, description = 'Custom workout' }) {
  const list = items.map((i) => ({ exerciseId: i.exerciseId, sets: i.sets, reps: i.reps, rest: i.rest ?? exerciseMap[i.exerciseId]?.rest ?? 90 }))
  const muscles = [...new Set(list.map((i) => exerciseMap[i.exerciseId]?.muscle).filter(Boolean))]
  const equipment = [...new Set(list.map((i) => exerciseMap[i.exerciseId]?.equipment).filter(Boolean))]
  const sets = list.reduce((n, i) => n + i.sets, 0)
  const minutes = Math.max(15, Math.round(sets * 3.2))
  return { id, title, description, categories: ['Custom'], goal: 'Custom', level: 'Intermediate', place: 'Custom', trainer: 'You', minutes, exercises: list, muscles, equipment, calories: Math.round(minutes * 6), hue: hueFor(id), custom: true }
}
