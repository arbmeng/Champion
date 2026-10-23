import { tr } from '../lib/i18n'

const friendRows = [
  { id: 'maya', name: 'Maya Chen', handle: '@mayalifts', level: 'Advanced', hue: 330, weekly: 5, volume: 31200, streak: 64, prs: 3, following: true },
  { id: 'jonas', name: 'Jonas Weber', handle: '@jonasw', level: 'Intermediate', hue: 210, weekly: 4, volume: 24800, streak: 41, prs: 2, following: true },
  { id: 'imani', name: 'Imani Brooks', handle: '@imanib', level: 'Intermediate', hue: 150, weekly: 4, volume: 22150, streak: 38, prs: 1, following: true },
  { id: 'theo', name: 'Theo Marchetti', handle: '@theom', level: 'Beginner', hue: 40, weekly: 3, volume: 14300, streak: 19, prs: 4, following: true },
  { id: 'sofia', name: 'Sofia Alvarez', handle: '@sofialv', level: 'Advanced', hue: 280, weekly: 6, volume: 38900, streak: 88, prs: 2, following: false },
  { id: 'liam', name: 'Liam Doyle', handle: '@liamd', level: 'Intermediate', hue: 100, weekly: 3, volume: 17600, streak: 12, prs: 0, following: false },
]

const groupRows = [
  { id: 'iron-club', name: 'Iron Club', members: 1284, description: 'Strength training, programming and form checks.', hue: 18 },
  { id: 'early-lifters', name: '6am Lifters', members: 642, description: 'Morning training accountability.', hue: 200 },
  { id: 'home-gym', name: 'Home Gym Builders', members: 903, description: 'Dumbbells, bands and small-space programming.', hue: 150 },
]

export const friends = friendRows.map((f) => ({ ...f, name: tr(f.name) }))

export const groups = groupRows.map((g) => ({ ...g, name: tr(g.name), description: tr(g.description) }))

// Offsets are minutes before "now" so the feed always feels current.
const feedRows = [
  { id: 'p1', authorId: 'maya', ago: 38, workout: 'Push Day', duration: 68, volume: 8420, exercises: 7, text: 'Finally hit 5 strict pull-ups with +10 kg earlier this week — upper body feeling strong.', pr: 'Incline DB Press · 32 kg × 8', likes: 14, comments: [{ authorId: 'jonas', text: 'Huge. Nice work.' }] },
  { id: 'p2', authorId: 'jonas', ago: 190, workout: 'Lower B · Hinge Focus', duration: 72, volume: 11250, exercises: 5, text: 'RDLs finally feel smooth at 110.', likes: 9, comments: [] },
  { id: 'p3', authorId: 'imani', ago: 560, workout: 'Hips & Spine Mobility', duration: 20, volume: 0, exercises: 4, text: 'Recovery day done. Sleep has been better since adding this.', likes: 6, comments: [{ authorId: 'theo', text: 'Going to try this tomorrow.' }] },
  { id: 'p4', authorId: 'theo', ago: 1380, workout: 'Full Body A', duration: 54, volume: 5640, exercises: 5, text: 'Week 3 of Foundations — added 2.5 kg to goblet squats.', pr: 'Goblet Squat · 26 kg × 10', likes: 18, comments: [] },
  { id: 'p5', authorId: 'sofia', ago: 1740, workout: 'Leg Day', duration: 80, volume: 14980, exercises: 6, text: 'Squat day. Top set felt clean at RIR 1.', likes: 22, comments: [{ authorId: 'maya', text: 'Machine!' }] },
]

export const feedSeed = feedRows.map((p) => ({ ...p, workout: tr(p.workout), text: tr(p.text), pr: p.pr ? tr(p.pr) : p.pr }))

const challengeRows = [
  { id: 'thirty-day', title: '30 Day Training Challenge', description: 'Complete 20 workouts inside 30 days. Consistency beats intensity.', kind: 'workouts', target: 20, unit: 'workouts', start: -12, end: 18, participants: 3412, badge: 'Consistency', hue: 18,
    board: [['Sofia Alvarez', 17], ['Maya Chen', 15], ['Jonas Weber', 11], ['Imani Brooks', 10], ['Theo Marchetti', 7]] },
  { id: 'bench-volume', title: 'Bench Press Challenge', description: 'Move 6,000 kg of bench press volume this month.', kind: 'exerciseVolume', exerciseId: 'bench', target: 6000, unit: 'kg', start: -10, end: 20, participants: 1186, badge: 'Press', hue: 210,
    board: [['Maya Chen', 5200], ['Liam Doyle', 3900], ['Jonas Weber', 3600], ['Sofia Alvarez', 3100]] },
  { id: 'volume-100k', title: '100K Volume Challenge', description: 'Lift a total of 100,000 kg across all workouts before the deadline.', kind: 'volume', target: 100000, unit: 'kg', start: -25, end: 35, participants: 2050, badge: 'Volume', hue: 150,
    board: [['Sofia Alvarez', 84200], ['Maya Chen', 79800], ['Jonas Weber', 61000], ['Imani Brooks', 52400], ['Theo Marchetti', 31200]] },
  { id: 'leg-november', title: 'Leg Day November', description: 'Train legs at least 8 times in November. No skipped squats.', kind: 'legSessions', target: 8, unit: 'sessions', start: 9, end: 39, participants: 780, badge: 'Legs', hue: 330, board: [] },
  { id: 'back-to-basics', title: 'Back to Basics', description: 'Complete 12 workouts in September.', kind: 'workouts', target: 12, unit: 'workouts', start: -52, end: -22, participants: 1904, badge: 'Basics', hue: 100, completed: true, userResult: 14,
    board: [['Sofia Alvarez', 17], ['Arez', 14], ['Maya Chen', 14], ['Jonas Weber', 12], ['Imani Brooks', 12]] },
]

export const challenges = challengeRows.map((c) => ({ ...c, title: tr(c.title), description: tr(c.description), badge: tr(c.badge), unit: c.unit }))

const foodRows = [
  { id: 'oats', name: 'Rolled oats (60 g)', kcal: 228, p: 8, c: 41, f: 4 },
  { id: 'eggs', name: 'Eggs ×3', kcal: 234, p: 19, c: 2, f: 16 },
  { id: 'whey', name: 'Whey protein scoop', kcal: 120, p: 24, c: 3, f: 2 },
  { id: 'yogurt', name: 'Greek yogurt (200 g)', kcal: 130, p: 20, c: 8, f: 1 },
  { id: 'banana', name: 'Banana', kcal: 105, p: 1, c: 27, f: 0 },
  { id: 'chicken', name: 'Chicken breast (150 g)', kcal: 248, p: 46, c: 0, f: 5 },
  { id: 'rice', name: 'Cooked rice (200 g)', kcal: 260, p: 5, c: 57, f: 1 },
  { id: 'salmon', name: 'Salmon fillet (150 g)', kcal: 312, p: 34, c: 0, f: 19 },
  { id: 'potato', name: 'Baked potato (250 g)', kcal: 215, p: 5, c: 49, f: 0 },
  { id: 'beef', name: 'Lean beef mince (150 g)', kcal: 330, p: 38, c: 0, f: 20 },
  { id: 'pasta', name: 'Cooked pasta (200 g)', kcal: 314, p: 11, c: 62, f: 2 },
  { id: 'avocado', name: 'Avocado (half)', kcal: 160, p: 2, c: 9, f: 15 },
  { id: 'almonds', name: 'Almonds (30 g)', kcal: 174, p: 6, c: 6, f: 15 },
  { id: 'apple', name: 'Apple', kcal: 95, p: 0, c: 25, f: 0 },
  { id: 'bread', name: 'Wholegrain toast ×2', kcal: 190, p: 8, c: 34, f: 3 },
  { id: 'tofu', name: 'Firm tofu (150 g)', kcal: 190, p: 20, c: 4, f: 11 },
]

export const foods = foodRows.map((f) => ({ ...f, name: tr(f.name) }))

export const nutritionTargets = { kcal: 2650, p: 170, c: 290, f: 75, water: 3000 }
export const MEALS = ['breakfast', 'lunch', 'dinner', 'snack']

const deviceRows = [
  { id: 'apple', name: 'Apple Health', description: 'Steps, workouts, heart rate and sleep.', metrics: ['Steps', 'Heart rate', 'Sleep'] },
  { id: 'gconnect', name: 'Google Health Connect', description: 'Activity, sleep and heart rate on Android.', metrics: ['Steps', 'Sleep', 'Activity'] },
  { id: 'watch', name: 'Smartwatch', description: 'Live heart rate, calories and recovery signals.', metrics: ['Heart rate', 'Calories', 'Activity'] },
]

export const devices = deviceRows.map((d) => ({ ...d, name: tr(d.name), description: tr(d.description), metrics: d.metrics.map(tr) }))
