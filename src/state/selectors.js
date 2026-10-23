// Pure derivations over app state. Every number the UI shows about progress comes from here,
// so a completed workout updates dashboards, goals, PRs, streaks and courses consistently.
import { getExercise, MUSCLES } from '../data/exercises'
import { courseMap, DAY_PATTERNS, totalSessions, sessionWorkoutId, sessionWeek } from '../data/courses'
import { getWorkout, makeWorkout, workouts as libraryWorkouts } from '../data/workouts'
import { L, tr } from '../lib/i18n'
import { friends } from '../data/social'
import { addDaysKey, dateKey, daysBetween, parseKey, weekKeys } from '../lib/dates'
import { clamp, e1rm, pct } from '../lib/format'

export const UPPER = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps']
export const LOWER = ['Quads', 'Hamstrings', 'Glutes']
const remoteCache = new WeakMap()
// Workouts that arrived through content sync, localised for the current language.
export function remoteWorkouts(state) {
  const list = state.remote?.workouts
  if (!list?.length) return []
  if (!remoteCache.has(list)) remoteCache.set(list, list.map((w) => makeWorkout([w.id, L(w.title), L(w.description), w.categories, w.goal, w.level, w.place, w.trainer, w.minutes, w.exercises], { remote: true })))
  return remoteCache.get(list)
}
export const allWorkouts = (state) => [...libraryWorkouts, ...remoteWorkouts(state), ...state.customWorkouts]
export const findWorkout = (state, id) => getWorkout(id, [...remoteWorkouts(state), ...state.customWorkouts])
export const findExercise = (state, id) => getExercise(id, state.customExercises)
export const countsVolume = (ex, set) => Boolean(ex) && ex.repLabel === 'reps' && Number(set.weight) > 0 && Number(set.reps) > 0
export const setVolume = (ex, set) => (countsVolume(ex, set) ? Number(set.weight) * Number(set.reps) : 0)
const today = () => dateKey(new Date())

/* ---------- exercises ---------- */
export function exerciseHistory(state, id) {
  return state.history.filter((l) => l.entries.some((e) => e.exerciseId === id)).map((l) => ({ logId: l.id, date: l.date, title: l.title, sets: l.entries.find((e) => e.exerciseId === id).sets }))
}

export function bestSetOf(sets) {
  return sets.reduce((best, s) => (!best || e1rm(s.weight, s.reps) > e1rm(best.weight, best.reps) ? s : best), null)
}

export function exerciseStats(state, id) {
  const ex = findExercise(state, id)
  const hist = exerciseHistory(state, id)
  const all = hist.flatMap((h) => h.sets.map((s) => ({ ...s, date: h.date })))
  const ranked = all.filter((s) => s.weight > 0 || ex?.repLabel !== 'reps')
  const best = ranked.reduce((b, s) => (!b || e1rm(s.weight, s.reps) > e1rm(b.weight, b.reps) || (s.weight === 0 && b.weight === 0 && s.reps > b.reps) ? s : b), null)
  const heaviest = all.reduce((b, s) => (!b || s.weight > b.weight || (s.weight === b.weight && s.reps > b.reps) ? s : b), null)
  const lastSession = hist[0] || null
  const lastTop = lastSession ? bestSetOf(lastSession.sets) : null
  return { ex, hist, best, heaviest, lastSession, lastTop, sessions: hist.length, e1rm: best ? Math.round(e1rm(best.weight, best.reps)) : 0 }
}

export function strengthSeries(state, id, months = 3) {
  const cutoff = addDaysKey(today(), -Math.round(months * 30.4))
  return exerciseHistory(state, id).filter((h) => h.date >= cutoff).map((h) => { const b = bestSetOf(h.sets); return { date: h.date, weight: b.weight, reps: b.reps, e1rm: Math.round(e1rm(b.weight, b.reps) * 10) / 10 } }).reverse()
}

// What the logger should prefill and show as "Previous" for each set of an exercise.
export function previousSets(state, id) {
  const last = exerciseHistory(state, id)[0]
  return last ? last.sets : []
}

/* ---------- aggregates ---------- */
export function sumLogs(logs) {
  return logs.reduce((a, l) => ({ workouts: a.workouts + 1, volume: a.volume + l.volume, sets: a.sets + l.sets, minutes: a.minutes + l.duration / 60, prs: a.prs + l.prs.length, calories: a.calories + (l.calories || 0) }), { workouts: 0, volume: 0, sets: 0, minutes: 0, prs: 0, calories: 0 })
}
export const logsBetween = (state, from, to) => state.history.filter((l) => l.date >= from && l.date <= to)
export const totals = (state) => sumLogs(state.history)

export function weekStats(state, offset = 0, through = 6) {
  const keys = weekKeys(new Date(), offset).slice(0, through + 1)
  const logs = logsBetween(state, keys[0], keys[keys.length - 1])
  const s = sumLogs(logs)
  const days = new Set(logs.map((l) => l.date))
  return { ...s, logs, days, keys }
}

export function muscleSets(state, from, to) {
  const out = Object.fromEntries(MUSCLES.map((m) => [m, 0]))
  for (const l of logsBetween(state, from, to)) {
    for (const e of l.entries) {
      const ex = findExercise(state, e.exerciseId)
      if (!ex || !(ex.muscle in out)) continue
      out[ex.muscle] += e.sets.length
    }
  }
  return out
}

export function muscleVolume(state, from, to) {
  const out = Object.fromEntries(MUSCLES.map((m) => [m, 0]))
  for (const l of logsBetween(state, from, to)) for (const e of l.entries) {
    const ex = findExercise(state, e.exerciseId)
    if (ex && ex.muscle in out) out[ex.muscle] += e.sets.reduce((n, s) => n + setVolume(ex, s), 0)
  }
  return out
}

export function volumeBuckets(state, mode = 'week', count = 8) {
  const out = []
  const t = new Date()
  if (mode === 'week') {
    for (let i = count - 1; i >= 0; i--) {
      const keys = weekKeys(t, -i)
      const s = sumLogs(logsBetween(state, keys[0], keys[6]))
      out.push({ label: keys[0].slice(5).replace('-', '/'), key: keys[0], volume: Math.round(s.volume), workouts: s.workouts, sets: s.sets })
    }
  } else {
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(t.getFullYear(), t.getMonth() - i, 1)
      const from = dateKey(d)
      const to = dateKey(new Date(d.getFullYear(), d.getMonth() + 1, 0))
      const s = sumLogs(logsBetween(state, from, to))
      out.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), key: from, volume: Math.round(s.volume), workouts: s.workouts, sets: s.sets })
    }
  }
  return out
}

export function heatmap(state, weeks = 14) {
  const byDate = {}
  for (const l of state.history) byDate[l.date] = (byDate[l.date] || 0) + 1
  const first = weekKeys(new Date(), -(weeks - 1))[0]
  return Array.from({ length: weeks * 7 }, (_, i) => { const date = addDaysKey(first, i); return { date, count: byDate[date] || 0, future: date > today() } })
}

export function streakDays(state) {
  const dates = [...new Set(state.history.map((l) => l.date))].sort().reverse()
  if (!dates.length) return 0
  if (daysBetween(dates[0], today()) > 2) return 0
  let end = dates[0]
  let start = dates[0]
  for (let i = 1; i < dates.length; i++) {
    if (daysBetween(dates[i], start) > 3) break
    start = dates[i]
  }
  return daysBetween(start, end) + 1
}

export function weeklyTargetStreak(state) {
  const target = state.settings.weeklyTarget
  let weeks = 0
  for (let off = 0; off > -52; off--) {
    const n = weekStats(state, off).workouts
    if (n >= target) weeks++
    else if (off !== 0) break
  }
  return weeks
}

/* ---------- courses ---------- */
export function courseProgress(state, courseId) {
  const course = courseMap[courseId]
  const done = new Map()
  for (const l of state.history) if (l.courseId === courseId && l.sessionIndex != null && !done.has(l.sessionIndex)) done.set(l.sessionIndex, l)
  const total = totalSessions(course)
  let next = 0
  while (done.has(next) && next < total) next++
  const completed = done.size
  return { course, done, completed, total, next: next >= total ? null : next, week: next >= total ? course.weeks : sessionWeek(course, next), pct: pct(completed, total), finished: completed >= total, enrolled: state.enrolled.includes(courseId) }
}

// The current course week laid out on calendar days, e.g. Mon / Wed / Fri / Sat.
export function weekPlan(state) {
  const id = state.activeCourse
  if (!id || !state.enrolled.includes(id)) return null
  const p = courseProgress(state, id)
  if (p.next == null) return null
  const { course } = p
  const base = (p.week - 1) * course.perWeek
  const pattern = DAY_PATTERNS[course.perWeek] || Array.from({ length: course.perWeek }, (_, i) => i)
  const keys = weekKeys()
  const todayKey = today()
  return pattern.map((dayIdx, i) => {
    const index = base + i
    return { dayIdx, key: keys[dayIdx], index, workout: findWorkout(state, sessionWorkoutId(course, index)), done: p.done.has(index), isToday: keys[dayIdx] === todayKey, past: keys[dayIdx] < todayKey }
  })
}

export function todaysSession(state) {
  const id = state.activeCourse
  if (!id || !state.enrolled.includes(id)) return null
  const p = courseProgress(state, id)
  if (p.next == null) return null
  const pick = state.todayPick
  const picked = pick && pick.date === today() && pick.courseId === id && !p.done.has(pick.index) && pick.index < p.total ? pick.index : null
  const index = picked ?? p.next
  const workout = findWorkout(state, sessionWorkoutId(p.course, index))
  const doneToday = state.history.some((l) => l.date === today() && l.courseId === id)
  return { course: p.course, progress: p, index, workout, doneToday, picked: picked != null }
}

/* ---------- insights & recommendations ---------- */
export function insight(state) {
  const target = state.settings.weeklyTarget
  const now = weekStats(state, 0)
  const dayIdx = (new Date().getDay() + 6) % 7
  const prevThrough = weekStats(state, -1, dayIdx)
  if (!state.history.length) return { tone: 'info', text: tr('Complete your first workout to unlock personal insights.') }
  if (now.workouts === target - 1) return { tone: 'progress', text: tr("You're one workout away from your weekly target.") }
  if (now.workouts >= target) return { tone: 'success', text: tr('Weekly target reached — {0} of {1} sessions done. Recovery is part of the plan.', now.workouts, target) }
  if (now.volume > 0 && prevThrough.volume > 0) {
    const diff = ((now.volume - prevThrough.volume) / prevThrough.volume) * 100
    const n = Math.abs(Math.round(diff))
    if (n >= 3) return { tone: diff > 0 ? 'success' : 'info', text: diff > 0 ? tr('Your training volume is {0}% higher than last week at this point.', n) : tr('Your training volume is {0}% lower than last week at this point.', n) }
  }
  const prs = weekStats(state, 0).prs
  if (prs) return { tone: 'success', text: prs === 1 ? tr('1 new personal record this week.') : tr('{0} new personal records this week.', prs) }
  const left = target - now.workouts
  return { tone: 'info', text: left === 1 ? tr('1 session left to hit your weekly target.') : tr('{0} sessions left to hit your weekly target.', left) }
}

export function recommendations(state) {
  const to = today()
  const from = addDaysKey(to, -6)
  const sets = muscleSets(state, from, to)
  const lagging = Object.entries(sets).filter(([m]) => m !== 'Core').sort((a, b) => a[1] - b[1])[0]
  const pool = allWorkouts(state).filter((w) => w.muscles.includes(lagging?.[0]) && !w.categories.includes('Mobility') && !w.categories.includes('Recovery'))
  const level = state.user.level
  const fit = pool.filter((w) => w.level === level).concat(pool.filter((w) => w.level !== level))
  const items = []
  if (lagging && fit[0]) items.push({ id: 'lag', kind: 'workout', workout: fit[0], reason: tr('{0} has the fewest sets in the last 7 days ({1}).', tr(lagging[0]), lagging[1]) })
  const rec = recoveryState(state)
  const mob = libraryWorkouts.find((w) => w.id === (rec.score < 65 ? 'recovery-reset' : 'mobility-flow'))
  items.push({ id: 'mob', kind: 'workout', workout: mob, reason: rec.score < 65 ? tr('Readiness is moderate — an easy session keeps you moving.') : tr('Mobility work supports your heavy lower days.') })
  const notEnrolled = Object.values(courseMap).filter((c) => !state.enrolled.includes(c.id) && c.goal === state.user.goal)
  if (notEnrolled[0]) items.push({ id: 'course', kind: 'course', course: notEnrolled[0], reason: tr('Matches your goal: {0}.', tr(state.user.goal)) })
  return items
}

/* ---------- recovery ---------- */
export function recoveryState(state) {
  const sleep = state.health.sleep
  const last3 = sleep.slice(-3)
  const sleepAvg = last3.reduce((n, d) => n + d.hours, 0) / Math.max(1, last3.length)
  const to = today()
  const vol7 = sumLogs(logsBetween(state, addDaysKey(to, -6), to)).volume
  const vol28 = sumLogs(logsBetween(state, addDaysKey(to, -27), to)).volume
  const ratio = vol28 > 0 ? vol7 / (vol28 / 4) : 1
  const lastDate = state.history[0]?.date
  const since = lastDate ? daysBetween(lastDate, to) : 3
  const sleepPts = clamp((sleepAvg - 5) / 3, 0, 1) * 40
  const loadPts = ratio <= 1 ? 35 : clamp(35 - (ratio - 1) * 70, 5, 35)
  const restPts = clamp(10 + since * 6, 10, 25)
  const score = Math.round(clamp(sleepPts + loadPts + restPts, 0, 100))
  const label = score >= 75 ? 'High' : score >= 55 ? 'Moderate' : 'Low' // English keys; translated where displayed
  const advice = ratio > 1.15
    ? tr('Your training load has increased this week. Consider keeping today’s session at your normal intensity and prioritising sleep.')
    : sleepAvg < 6.5
      ? tr('Sleep has been shorter than usual. A normal session is fine, but consider stopping sets 1–2 reps earlier.')
      : tr('Load and sleep look balanced. A good day to follow the plan and push the first working set.')
  return { score, label, sleepAvg, ratio, since, advice }
}

export function muscleRecovery(state, muscle) {
  const log = state.history.find((l) => l.entries.some((e) => findExercise(state, e.exerciseId)?.muscle === muscle))
  if (!log) return { days: null, label: 'Fresh', tone: 'success' }
  const days = daysBetween(log.date, today())
  return days >= 2 ? { days, label: 'Ready', tone: 'success' } : { days, label: 'Recovering', tone: 'warning' }
}

/* ---------- achievements ---------- */
export function achievementList(state) {
  const tot = totals(state)
  const streak = streakDays(state)
  const weekStreak = weeklyTargetStreak(state)
  const week = weekStats(state, 0)
  const courseDone = Object.keys(courseMap).filter((id) => courseProgress(state, id).finished).length
  const recentPr = state.history.filter((l) => l.date >= addDaysKey(today(), -7)).reduce((n, l) => n + l.prs.length, 0)
  return [
    { id: 'first-pr', title: 'First PR', description: 'Set your first personal record.', icon: 'trophy', value: tot.prs, target: 1 },
    { id: 'w10', title: '10 Workouts', description: 'Complete 10 workouts.', icon: 'dumbbell', value: tot.workouts, target: 10 },
    { id: 'w50', title: '50 Workouts', description: 'Complete 50 workouts.', icon: 'dumbbell', value: tot.workouts, target: 50 },
    { id: 'w100', title: '100 Workouts', description: 'Complete 100 workouts.', icon: 'dumbbell', value: tot.workouts, target: 100 },
    { id: 'v100k', title: '100K Volume', description: 'Lift 100,000 kg in total.', icon: 'weight', value: Math.round(tot.volume), target: 100000 },
    { id: 'streak30', title: '30 Day Streak', description: 'Stay on plan for 30 days.', icon: 'flame', value: streak, target: 30 },
    { id: 'course', title: 'Course Complete', description: 'Finish every session in a course.', icon: 'medal', value: courseDone, target: 1 },
    { id: 'consistency', title: 'Consistency Master', description: 'Hit your weekly target 4 weeks in a row.', icon: 'calendar', value: weekStreak, target: 4 },
    { id: 'best', title: 'Personal Best', description: 'Set a PR in the last 7 days.', icon: 'sparkles', value: recentPr, target: 1 },
    { id: 'week', title: 'Perfect Week', description: 'Hit your weekly target this week.', icon: 'check', value: week.workouts, target: state.settings.weeklyTarget },
  ].map((a) => ({ ...a, unlocked: a.value >= a.target, unlockedAt: state.unlocked[a.id] || null }))
}

/* ---------- goals ---------- */
export function bodyLatest(state, metric = 'weight') {
  const e = state.body.find((b) => b[metric] != null)
  return e ? e[metric] : null
}

export function goalProgress(state, goal) {
  if (goal.type === 'strength') {
    const st = exerciseStats(state, goal.exerciseId)
    const cur = st.heaviest?.weight || 0
    return { current: cur, target: goal.target, pct: pct(cur, goal.target), unit: 'kg', title: tr('{0} · {1} kg', st.ex?.name || tr('Lift'), goal.target), label: tr('{0} / {1} kg', cur, goal.target), href: `/exercises/${goal.exerciseId}`, group: 'Strength' }
  }
  if (goal.type === 'weekly') {
    const cur = weekStats(state, 0).workouts
    return { current: cur, target: goal.target, pct: pct(cur, goal.target), unit: 'workouts', title: tr('Train {0}× per week', goal.target), label: tr('{0} / {1} this week', cur, goal.target), href: '/history', group: 'Consistency' }
  }
  if (goal.type === 'course') {
    const p = courseProgress(state, goal.courseId)
    const cur = Math.floor(p.completed / p.course.perWeek)
    return { current: cur, target: p.course.weeks, pct: pct(p.completed, p.total), unit: 'weeks', title: tr('Complete {0}', p.course.title), label: tr('{0} / {1} weeks', cur, p.course.weeks), href: `/courses/${goal.courseId}`, group: 'Course' }
  }
  if (goal.type === 'body') {
    const metric = goal.metric || 'weight'
    const entries = state.body.filter((b) => b[metric] != null)
    const cur = entries[0]?.[metric] ?? 0
    const start = entries[entries.length - 1]?.[metric] ?? cur
    const span = goal.target - start
    const p = span === 0 ? 100 : clamp(((cur - start) / span) * 100, 0, 100)
    const fat = metric === 'bodyFat'
    return { current: cur, target: goal.target, pct: p, unit: fat ? '%' : 'kg', title: fat ? tr('Body fat · {0}%', goal.target) : tr('Body weight · {0} kg', goal.target), label: fat ? tr('{0}% → {1}%', cur, goal.target) : tr('{0} kg → {1} kg', cur, goal.target), href: '/progress?tab=body', group: 'Body' }
  }
  const cur = weekStats(state, 0).logs.filter((l) => l.categories.some((c) => c === 'Mobility' || c === 'Recovery')).length
  return { current: cur, target: goal.target, pct: pct(cur, goal.target), unit: 'sessions', title: goal.target === 1 ? tr('1 mobility session per week') : tr('{0} mobility sessions per week', goal.target), label: tr('{0} / {1} this week', cur, goal.target), href: '/workouts', group: 'Habit' }
}

/* ---------- challenges & leaderboards ---------- */
export function challengeWindow(ch) {
  return { from: addDaysKey(today(), ch.start), to: addDaysKey(today(), ch.end) }
}
export function challengeStatus(ch) {
  if (ch.completed) return 'completed'
  return ch.start > 0 ? 'upcoming' : 'active'
}
export function challengeValue(state, ch) {
  if (ch.completed) return ch.userResult
  const { from, to } = challengeWindow(ch)
  const logs = logsBetween(state, from, to)
  if (ch.kind === 'workouts') return logs.length
  if (ch.kind === 'volume') return Math.round(sumLogs(logs).volume)
  if (ch.kind === 'legSessions') return logs.filter((l) => l.muscles.some((m) => LOWER.includes(m))).length
  if (ch.kind === 'exerciseVolume') {
    return Math.round(logs.reduce((n, l) => n + l.entries.filter((e) => e.exerciseId === ch.exerciseId).reduce((m, e) => m + e.sets.reduce((x, s) => x + s.weight * s.reps, 0), 0), 0))
  }
  return 0
}
export function challengeBoard(state, ch) {
  const mine = challengeValue(state, ch)
  const rows = ch.board.filter(([n]) => n !== 'Arez').map(([name, value]) => ({ name, value }))
  rows.push({ name: state.user.name, value: mine, you: true })
  return rows.sort((a, b) => b.value - a.value).map((r, i) => ({ ...r, rank: i + 1 }))
}

export function leaderboard(state, category, scope = 'friends') {
  const week = weekStats(state, 0)
  const mine = { workouts: week.workouts, volume: Math.round(week.volume), streak: streakDays(state), prs: totals(state).prs ? weekStats(state, 0).prs + weekStats(state, -1).prs : 0 }
  const key = { workouts: 'weekly', volume: 'volume', streak: 'streak', prs: 'prs' }[category]
  const pool = friends.filter((f) => scope === 'everyone' || f.following)
  const rows = pool.map((f) => ({ id: f.id, name: f.name, hue: f.hue, value: f[key] }))
  rows.push({ id: 'you', name: state.user.name, hue: 18, value: mine[category], you: true })
  return rows.sort((a, b) => b.value - a.value).map((r, i) => ({ ...r, rank: i + 1 }))
}

/* ---------- misc ---------- */
export const unreadCount = (state) => state.notifications.filter((n) => !n.read).length
export function isFavorite(state, kind, id) { return state.favorites[kind].includes(id) }
export function nutritionDay(state, key = today()) {
  const day = state.nutrition.log[key] || { meals: { breakfast: [], lunch: [], dinner: [], snack: [] }, water: 0 }
  const items = Object.values(day.meals).flat()
  const sum = items.reduce((a, i) => ({ kcal: a.kcal + i.kcal * i.qty, p: a.p + i.p * i.qty, c: a.c + i.c * i.qty, f: a.f + i.f * i.qty }), { kcal: 0, p: 0, c: 0, f: 0 })
  return { ...day, ...sum }
}
export const parseDate = parseKey
