import { exerciseMap } from '../data/exercises'
import { courseMap, DAY_PATTERNS, sessionWorkoutId } from '../data/courses'
import { workoutMap } from '../data/workouts'
import { foods, nutritionTargets } from '../data/social'
import { addDays, dateKey, startOfWeek } from '../lib/dates'
import { e1rm, mulberry32, roundTo } from '../lib/format'
import { achievementList } from './selectors'
import { tr } from '../lib/i18n'

export const STORAGE_KEY = 'champion.os.v1'

export const defaultSettings = { theme: 'system', unit: 'kg', autoRest: true, haptics: true, weeklyTarget: 4, restSound: false }

export const emptyState = () => ({
  v: 1,
  onboarded: false,
  todayPick: null,
  remote: { version: 0, updated: null, lastSync: null, workouts: [], feed: [], notified: [] },
  user: { name: 'Arez', level: 'Intermediate', goal: 'Build muscle', frequency: 4, equipment: 'Full gym', preferred: 'Hypertrophy', since: dateKey(addDays(new Date(), -120)) },
  settings: { ...defaultSettings },
  enrolled: [], activeCourse: null,
  history: [], active: null,
  favorites: { exercises: [], workouts: [], courses: [] },
  customWorkouts: [], customExercises: [],
  goals: [],
  joinedChallenges: {},
  social: { liked: {}, comments: {}, groups: {}, following: {}, posts: [] },
  notifications: [],
  body: [],
  nutrition: { log: {}, past: [], targets: { ...nutritionTargets } },
  health: { sleep: [], steps: [], restingHr: 58 },
  devices: { apple: false, gconnect: false, watch: false },
  coach: [],
  recent: { exercises: [], searches: [] },
  unlocked: {},
})

function buildHistory(rng, now) {
  const todayD = new Date(now); todayD.setHours(0, 0, 0, 0)
  const monday = startOfWeek(todayD)
  const courseStart = addDays(monday, -35)
  const course = courseMap['strength-hypertrophy']
  const plan = []
  const preStart = addDays(courseStart, -70)
  let n = 0
  for (let d = new Date(preStart); d < courseStart; d = addDays(d, 1)) {
    const weekIdx = Math.floor((d - preStart) / 86400000 / 7)
    const wd = (d.getDay() + 6) % 7
    if (weekIdx === 3 || ![0, 2, 4].includes(wd)) continue
    plan.push({ date: new Date(d), workoutId: ['upper-a', 'lower-a', 'upper-b'][n++ % 3] })
  }
  let k = 0
  for (let d = new Date(courseStart); d < todayD; d = addDays(d, 1)) {
    const wd = (d.getDay() + 6) % 7
    if (!DAY_PATTERNS[course.perWeek].includes(wd)) continue
    if (k >= course.weeks * course.perWeek) break
    plan.push({ date: new Date(d), workoutId: sessionWorkoutId(course, k), courseId: course.id, sessionIndex: k })
    k++
  }
  for (const [off, id] of [[1, 'mobility-flow'], [15, 'hiit-circuit'], [22, 'mobility-flow']]) {
    const d = addDays(courseStart, off)
    if (d < todayD) plan.push({ date: d, workoutId: id })
  }
  plan.sort((a, b) => a.date - b.date)

  const totals = {}
  for (const p of plan) for (const item of workoutMap[p.workoutId].exercises) totals[item.exerciseId] = (totals[item.exerciseId] || 0) + 1
  const seen = {}
  const bestE = {}
  const logs = plan.map((p, i) => {
    const w = workoutMap[p.workoutId]
    const entries = w.exercises.map((item) => {
      const ex = exerciseMap[item.exerciseId]
      const idx = seen[ex.id] = (seen[ex.id] ?? -1) + 1
      const frac = totals[ex.id] > 1 ? idx / (totals[ex.id] - 1) : 1
      let weight = 0
      if (ex.id === 'pullup') weight = roundTo(frac * 10, 2.5)
      else if (ex.weight > 0) { const step = ex.weight >= 40 ? 2.5 : ex.weight >= 10 ? 1 : 0.5; weight = roundTo(ex.weight * (0.84 + 0.2 * frac), step) }
      const sets = Array.from({ length: item.sets }, (_, j) => {
        let reps = item.reps[1] - Math.floor(rng() * 3) - (j >= 2 ? 1 : 0)
        reps = Math.max(item.reps[0], Math.min(item.reps[1], reps))
        return { weight, reps, rir: j === item.sets - 1 ? 1 : 1 + Math.floor(rng() * 3) }
      })
      return { exerciseId: ex.id, sets }
    })
    let volume = 0, setCount = 0
    const prs = []
    for (const e of entries) {
      const ex = exerciseMap[e.exerciseId]
      setCount += e.sets.length
      for (const s of e.sets) if (ex.repLabel === 'reps' && s.weight > 0) volume += s.weight * s.reps
      if (ex.repLabel !== 'reps' || e.sets[0].weight <= 0) continue
      const top = e.sets.reduce((b, s) => (e1rm(s.weight, s.reps) > e1rm(b.weight, b.reps) ? s : b))
      const val = e1rm(top.weight, top.reps)
      if (bestE[ex.id] && val > bestE[ex.id] * 1.04) prs.push({ exerciseId: ex.id, name: ex.name, weight: top.weight, reps: top.reps })
      bestE[ex.id] = Math.max(bestE[ex.id] || 0, val)
    }
    const startedAt = p.date.getTime() + (17 * 60 + Math.floor(rng() * 90)) * 60000
    const duration = Math.round(w.minutes * 60 * (0.9 + rng() * 0.15))
    return {
      id: `seed-${i + 1}`, workoutId: w.id, title: w.title, categories: w.categories, date: dateKey(p.date), startedAt, duration,
      volume: Math.round(volume), sets: setCount, exercises: entries.length, muscles: [...new Set(entries.map((e) => exerciseMap[e.exerciseId].muscle))],
      calories: Math.round(w.calories * (duration / (w.minutes * 60))), entries, prs, courseId: p.courseId, sessionIndex: p.sessionIndex,
    }
  })
  return logs.reverse()
}

export function createSeed(now = new Date()) {
  const rng = mulberry32(20261023)
  const s = emptyState()
  const t = new Date(now); t.setHours(0, 0, 0, 0)
  const key = (n) => dateKey(addDays(t, n))
  s.onboarded = false
  s.todayPick = null
  s.enrolled = ['strength-hypertrophy']
  s.activeCourse = 'strength-hypertrophy'
  s.history = buildHistory(rng, now)
  s.favorites = { exercises: ['bench', 'rdl', 'pullup'], workouts: ['upper-a', 'mobility-flow'], courses: [] }
  s.goals = [
    { id: 'g1', type: 'strength', exerciseId: 'bench', target: 100 },
    { id: 'g2', type: 'weekly', target: 4 },
    { id: 'g3', type: 'course', courseId: 'strength-hypertrophy' },
    { id: 'g4', type: 'body', metric: 'weight', target: 84 },
    { id: 'g5', type: 'habit', target: 1 },
  ]
  s.joinedChallenges = { 'thirty-day': true, 'bench-volume': true, 'volume-100k': true }
  s.social.following = { maya: true, jonas: true, imani: true, theo: true }
  s.social.groups = { 'iron-club': true }
  s.social.posts = []
  s.body = [
    [-2, 82.1, 15.9, 103.5, 83.0, 38.4, 60.2, 96.5], [-16, 81.9, 16.1, 103.2, 83.2, 38.2, 60.0, 96.4], [-30, 81.4, 16.2, 102.8, 83.5, 38.0, 59.8, 96.2],
    [-44, 81.0, 16.4, 102.4, 83.8, 37.8, 59.5, 96.0], [-58, 80.7, 16.6, 102.0, 84.1, 37.5, 59.2, 95.8], [-72, 80.2, 16.8, 101.5, 84.5, 37.3, 59.0, 95.6],
  ].map(([d, weight, bodyFat, chest, waist, arms, thighs, hips]) => ({ date: key(d), weight, bodyFat, chest, waist, arms, thighs, hips }))
  const f = (id) => ({ ...foods.find((x) => x.id === id), qty: 1, id: `${id}-${key(0)}` })
  s.nutrition.log[key(0)] = { meals: { breakfast: [f('oats'), f('whey'), f('banana')], lunch: [f('chicken'), f('rice'), f('avocado')], dinner: [], snack: [] }, water: 1250 }
  s.nutrition.past = Array.from({ length: 6 }, (_, i) => ({ date: key(-(6 - i)), kcal: Math.round(2450 + rng() * 380), p: Math.round(150 + rng() * 30), c: Math.round(250 + rng() * 60), f: Math.round(65 + rng() * 16), water: Math.round(2200 + rng() * 900) }))
  s.health = {
    sleep: Array.from({ length: 7 }, (_, i) => ({ date: key(-(6 - i)), hours: Math.round((6.4 + rng() * 1.9) * 10) / 10, quality: Math.round(70 + rng() * 22), hrv: Math.round(58 + rng() * 14) })),
    steps: Array.from({ length: 7 }, (_, i) => ({ date: key(-(6 - i)), steps: Math.round(6500 + rng() * 5200), active: Math.round(380 + rng() * 260) })),
    restingHr: 57,
  }
  s.devices = { apple: true, gconnect: false, watch: true }
  const last = s.history[0]
  const lastPr = s.history.find((l) => l.prs.length)?.prs[0]
  const mk = (id, type, title, body, minsAgo, href, read = false) => ({ id, type, title, body, ts: now.getTime() - minsAgo * 60000, read, href })
  s.notifications = [
    mk('n1', 'workout', tr('Workout reminder'), tr('Your next course session is ready. Start whenever you are.'), 25, '/today'),
    mk('n2', 'course', tr('Course session ready'), tr('Strength & Hypertrophy · next session unlocked.'), 90, '/courses/strength-hypertrophy'),
    ...(lastPr ? [mk('n3', 'pr', tr('New PR'), tr('{0} · {1} kg × {2}', lastPr.name, lastPr.weight, lastPr.reps), 60 * 30, '/progress?tab=prs')] : []),
    mk('n4', 'goal', tr('Goal progress'), tr('Your weekly training goal is on track.'), 60 * 40, '/goals', true),
    mk('n5', 'challenge', tr('Challenge update'), tr('You are climbing the 30 Day Training Challenge board.'), 60 * 52, '/challenges', true),
    mk('n6', 'friend', tr('Friend activity'), tr('Maya Chen completed Push Day · 8,420 kg.'), 38, '/community'),
    mk('n7', 'coach', tr('AI Coach'), tr('I reviewed your last week — tap for a short summary.'), 60 * 60, '/coach', true),
  ]
  s.coach = [{ id: 'c0', role: 'coach', text: last ? tr('Hi {0}. I can see {1} logged sessions, most recently {2}. Ask me about your lifts, your week, or what to train next.', s.user.name, s.history.length, last.title) : tr('Hi {0}. Ask me about your lifts, your week, or what to train next.', s.user.name) }]
  s.recent = { exercises: ['bench', 'rdl', 'incline-machine'], searches: ['bench', 'squat'] }
  for (const a of achievementList(s)) if (a.unlocked) s.unlocked[a.id] = key(-Math.floor(rng() * 40))
  return s
}
