// Deterministic, rule-based coach. It reads the user's logged data and answers with templates —
// there is no language model behind it, and the UI says so.
import { exercises } from '../data/exercises'
import { addDaysKey, dateKey } from './dates'
import { fmtNum, toDisplay } from './format'
import { exerciseStats, exerciseHistory, insight, muscleSets, recoveryState, strengthSeries, weekStats, totals, todaysSession } from '../state/selectors'

export const SUGGESTIONS = ['Analyze my progress', 'Should I increase my bench press weight?', 'Build a workout', 'Explain Romanian deadlift', 'Adjust today’s workout', 'Review my week']

const W = (kg, unit) => `${toDisplay(kg, unit)} ${unit}`
const match = (t, ...words) => words.some((w) => t.includes(w))

function increaseAdvice(state, ex) {
  const unit = state.settings.unit
  const h = exerciseHistory(state, ex.id).slice(0, 3)
  if (h.length < 2) return { text: `I only have ${h.length} logged ${h.length === 1 ? 'session' : 'sessions'} of ${ex.name}. Log two or three more and I can give a grounded recommendation.` }
  const tops = h.map((x) => x.sets.reduce((b, s) => (s.weight > b.weight || (s.weight === b.weight && s.reps > b.reps) ? s : b), x.sets[0])).reverse()
  const list = tops.map((s) => `${toDisplay(s.weight, unit)}×${s.reps}`).join(', ')
  const last = h[0]
  const hi = ex.reps[1]
  const allTop = last.sets.every((s) => s.reps >= hi)
  const avgRir = last.sets.reduce((n, s) => n + (s.rir ?? 2), 0) / last.sets.length
  const inc = tops[tops.length - 1].weight >= 40 ? 2.5 : 1
  if (allTop && avgRir >= 1) return { text: `Your last ${tops.length} sessions of ${ex.name} were ${list}. You completed every set at the top of the ${ex.reps[0]}–${hi} rep range with about ${Math.round(avgRir * 10) / 10} reps in reserve, so a small increase to ${W(tops[tops.length - 1].weight + inc, unit)} looks appropriate.`, actions: [{ label: `Open ${ex.name}`, to: `/exercises/${ex.id}` }] }
  return { text: `Your last ${tops.length} sessions of ${ex.name} were ${list}. You haven't yet hit ${hi} reps on every set, so I'd stay at ${W(tops[tops.length - 1].weight, unit)} and add a rep or two before increasing the load.`, actions: [{ label: `Open ${ex.name}`, to: `/exercises/${ex.id}` }] }
}

function progressAnalysis(state) {
  const unit = state.settings.unit
  const lifts = ['bench', 'squat', 'rdl', 'ohp', 'pullup'].map((id) => ({ id, st: exerciseStats(state, id), s: strengthSeries(state, id, 2) })).filter((l) => l.s.length > 1)
  if (!lifts.length) return { text: 'Log a few weeks of weighted sets and I can chart your strength trends.' }
  const rows = lifts.map((l) => { const c = ((l.s[l.s.length - 1].e1rm - l.s[0].e1rm) / l.s[0].e1rm) * 100; return { name: l.st.ex.name, c, best: l.st.best } }).sort((a, b) => b.c - a.c)
  const lines = rows.slice(0, 3).map((r) => `• ${r.name}: ${r.c >= 0 ? '+' : ''}${r.c.toFixed(1)}% est. 1RM over 8 weeks (best ${W(r.best.weight, unit)} × ${r.best.reps})`)
  return { text: `Here's what your logs show:\n${lines.join('\n')}\n\nTotal volume lifted: ${fmtNum(toDisplay(totals(state).volume, unit))} ${unit} across ${totals(state).workouts} sessions.`, actions: [{ label: 'Open strength charts', to: '/progress?tab=strength' }] }
}

function weekReview(state) {
  const w = weekStats(state, 0)
  const p = weekStats(state, -1)
  const unit = state.settings.unit
  const sets = muscleSets(state, addDaysKey(dateKey(), -6), dateKey())
  const low = Object.entries(sets).filter(([m]) => m !== 'Core').sort((a, b) => a[1] - b[1])[0]
  return { text: `This week: ${w.workouts} of ${state.settings.weeklyTarget} planned sessions, ${fmtNum(toDisplay(w.volume, unit))} ${unit} of volume${p.volume ? ` (last week: ${fmtNum(toDisplay(p.volume, unit))} ${unit} in total)` : ''}.\n${insight(state).text}\nLowest muscle group over the last 7 days: ${low[0]} (${low[1]} sets).`, actions: [{ label: 'Muscle balance', to: '/progress?tab=muscles' }] }
}

function build(state, t) {
  const muscles = { chest: 'Chest', back: 'Back', shoulder: 'Shoulders', leg: 'Quads', quad: 'Quads', hamstring: 'Hamstrings', glute: 'Glutes', bicep: 'Biceps', tricep: 'Triceps', arm: 'Biceps', core: 'Core', ab: 'Core' }
  const key = Object.keys(muscles).find((k) => t.includes(k))
  const target = key ? muscles[key] : 'Chest'
  const mins = Number((t.match(/(\d{2})\s*(min|m\b)/) || [])[1]) || 45
  const count = Math.max(3, Math.min(6, Math.round(mins / 9)))
  const equip = state.user.equipment === 'Home' || state.user.equipment === 'Dumbbells' || state.user.equipment === 'Bodyweight' ? ['Dumbbell', 'Bodyweight'] : null
  const pool = exercises.filter((e) => e.type !== 'Mobility' && e.type !== 'Conditioning' && e.type !== 'Cardio' && (!equip || equip.includes(e.equipment)))
  const main = pool.filter((e) => e.muscle === target)
  const supp = pool.filter((e) => e.secondary.includes(target) || (target === 'Quads' && e.muscle === 'Hamstrings') || (target === 'Chest' && e.muscle === 'Triceps') || (target === 'Back' && e.muscle === 'Biceps') || (target === 'Shoulders' && e.muscle === 'Triceps'))
  const picks = [...main.sort((a, b) => (a.type === 'Compound' ? -1 : 1) - (b.type === 'Compound' ? -1 : 1)).slice(0, Math.ceil(count * 0.65)), ...supp.slice(0, count)].filter((e, i, a) => a.findIndex((x) => x.id === e.id) === i).slice(0, count)
  const items = picks.map((e) => ({ exerciseId: e.id, sets: e.type === 'Compound' ? 4 : 3, reps: e.reps }))
  return { text: `Here's a ${mins}-minute ${target.toLowerCase()} session using ${equip ? 'home-friendly' : 'gym'} equipment:\n${picks.map((e, i) => `${i + 1}. ${e.name} — ${items[i].sets} × ${e.reps[0]}–${e.reps[1]}`).join('\n')}\nStart each exercise with a weight that leaves 2–3 reps in reserve.`, actions: [{ label: 'Save as workout', build: { title: `${target} focus (${mins} min)`, items } }] }
}

function explain(state, t) {
  const hit = exercises.filter((e) => t.includes(e.name.toLowerCase()) || t.includes(e.id.replace(/-/g, ' '))).sort((a, b) => b.name.length - a.name.length)[0]
    || exercises.find((e) => e.name.toLowerCase().split(' ').filter((w) => w.length > 3).some((w) => t.includes(w)))
  if (!hit) return null
  return { text: `${hit.name} (${hit.muscle}${hit.secondary.length ? `, with ${hit.secondary.join(' and ')}` : ''}):\n${hit.tech.slice(0, 3).map((s, i) => `${i + 1}. ${s}`).join('\n')}\nWatch for: ${hit.mistakes[0]}`, actions: [{ label: 'Full technique page', to: `/exercises/${hit.id}` }] }
}

export function coachReply(state, raw) {
  const t = raw.toLowerCase()
  const unit = state.settings.unit
  if (match(t, 'increase', 'add weight', 'heavier', 'go up', 'progress my')) {
    const named = exercises.find((e) => t.includes(e.name.toLowerCase().split(' ').slice(-2).join(' ')) || t.includes(e.id.replace(/-/g, ' ')))
    const ex = named || exercises.find((e) => e.id === 'bench')
    return increaseAdvice(state, ex)
  }
  if (match(t, 'analy', 'progress', 'stronger', 'trend')) return progressAnalysis(state)
  if (match(t, 'review', 'week', 'how am i doing')) return weekReview(state)
  if (match(t, 'build', 'create', 'generate', 'workout for', 'give me a workout', 'plan')) return build(state, t)
  if (match(t, 'adjust', 'today', 'tired', 'easier', 'lighter', 'short on time')) {
    const s = todaysSession(state)
    const r = recoveryState(state)
    return { text: `${s ? `Today's session is ${s.workout.title} (${s.workout.exercises.length} exercises).` : 'You have no course session scheduled.'} Readiness is ${r.label.toLowerCase()} (${r.score}/100). ${r.score < 65 ? 'Consider trimming one set from each accessory exercise and stopping 1–2 reps earlier than usual.' : 'Keep the plan as written and push your first working set.'}`, actions: s ? [{ label: 'View today’s workout', to: `/workouts/${s.workout.id}` }] : [] }
  }
  if (match(t, 'recover', 'sleep', 'rest', 'sore', 'readiness')) { const r = recoveryState(state); return { text: `Recovery score: ${r.score}/100 (${r.label}). Average sleep over the last 3 nights: ${r.sleepAvg.toFixed(1)} h; training load vs your 4-week average: ${r.ratio.toFixed(2)}×.\n${r.advice}\nThis is training guidance, not medical advice.`, actions: [{ label: 'Open recovery', to: '/recovery' }] } }
  const e = explain(state, t)
  if (e) return e
  if (match(t, 'pr', 'record', 'best')) { const ids = ['bench', 'squat', 'rdl', 'pullup']; const lines = ids.map((id) => exerciseStats(state, id)).filter((s) => s.best).map((s) => `• ${s.ex.name}: ${W(s.best.weight, unit)} × ${s.best.reps}`); return { text: lines.length ? `Your current bests:\n${lines.join('\n')}` : 'No PRs logged yet.', actions: [{ label: 'All PRs', to: '/progress?tab=prs' }] } }
  return { text: 'I can analyse your strength trends, review your week, suggest load changes, explain an exercise, or build a quick workout. Try one of the suggestions below.' }
}
