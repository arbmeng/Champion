// Deterministic, rule-based coach. It reads the user's logged data and answers with templates —
// there is no language model behind it, and the UI says so.
import { exercises } from '../data/exercises'
import { addDaysKey, dateKey } from './dates'
import { fmtNum, toDisplay } from './format'
import { tr } from './i18n'
import { exerciseStats, exerciseHistory, insight, muscleSets, recoveryState, strengthSeries, weekStats, totals, todaysSession } from '../state/selectors'

// Chips carry an intent so they work in any language.
export const SUGGESTIONS = [
  { id: 'analyze', label: () => tr('Analyze my progress') },
  { id: 'increase', label: () => tr('Should I increase my bench press weight?') },
  { id: 'build', label: () => tr('Build a workout') },
  { id: 'explain', label: () => tr('Explain Romanian deadlift') },
  { id: 'adjust', label: () => tr('Adjust today’s workout') },
  { id: 'week', label: () => tr('Review my week') },
]

const W = (kg, unit) => `${toDisplay(kg, unit)} ${unit}`
const has = (q, ...words) => words.some((w) => q.includes(w))
const nameOf = (e) => e.name

const KEYWORDS = {
  increase: ['increase', 'add weight', 'heavier', 'go up', 'زیاد', 'قورستر', 'بەرزتر', 'کێش زیاد'],
  analyze: ['analy', 'progress', 'stronger', 'trend', 'پێشکەوتن', 'شیکار', 'بەهێزتر'],
  week: ['review', 'week', 'how am i doing', 'هەفتە', 'پێداچوونەوە'],
  build: ['build', 'create', 'generate', 'give me a workout', 'plan', 'دروست', 'ڕاهێنان بۆ', 'پلان', 'بنیات'],
  adjust: ['adjust', 'today', 'tired', 'easier', 'lighter', 'short on time', 'ئەمڕۆ', 'ماندوو', 'سووک', 'ڕێکبخە'],
  recover: ['recover', 'sleep', 'rest', 'sore', 'readiness', 'ئاسوودە', 'خەو', 'پشوو', 'ئامادەیی', 'ژان'],
  prs: ['pr', 'record', 'best', 'ڕیکۆرد', 'باشترین'],
}

function increaseAdvice(state, ex) {
  const unit = state.settings.unit
  const h = exerciseHistory(state, ex.id).slice(0, 3)
  if (h.length < 2) return { text: h.length === 1 ? tr('I only have 1 logged session of {0}. Log two or three more and I can give a grounded recommendation.', nameOf(ex)) : tr('I only have {0} logged sessions of {1}. Log two or three more and I can give a grounded recommendation.', h.length, nameOf(ex)) }
  const tops = h.map((x) => x.sets.reduce((b, s) => (s.weight > b.weight || (s.weight === b.weight && s.reps > b.reps) ? s : b), x.sets[0])).reverse()
  const list = tops.map((s) => `${toDisplay(s.weight, unit)}×${s.reps}`).join('، ')
  const last = h[0]
  const hi = ex.reps[1]
  const allTop = last.sets.every((s) => s.reps >= hi)
  const avgRir = Math.round((last.sets.reduce((n, s) => n + (s.rir ?? 2), 0) / last.sets.length) * 10) / 10
  const inc = tops[tops.length - 1].weight >= 40 ? 2.5 : 1
  const actions = [{ label: tr('Open {0}', nameOf(ex)), to: `/exercises/${ex.id}` }]
  if (allTop && avgRir >= 1) return { text: tr('Your last {0} sessions of {1} were {2}. You completed every set at the top of the {3}–{4} rep range with about {5} reps in reserve, so a small increase to {6} looks appropriate.', tops.length, nameOf(ex), list, ex.reps[0], hi, avgRir, W(tops[tops.length - 1].weight + inc, unit)), actions }
  return { text: tr('Your last {0} sessions of {1} were {2}. You haven\'t yet hit {3} reps on every set, so I\'d stay at {4} and add a rep or two before increasing the load.', tops.length, nameOf(ex), list, hi, W(tops[tops.length - 1].weight, unit)), actions }
}

function progressAnalysis(state) {
  const unit = state.settings.unit
  const lifts = ['bench', 'squat', 'rdl', 'ohp', 'pullup'].map((id) => ({ id, st: exerciseStats(state, id), s: strengthSeries(state, id, 2) })).filter((l) => l.s.length > 1)
  if (!lifts.length) return { text: tr('Log a few weeks of weighted sets and I can chart your strength trends.') }
  const rows = lifts.map((l) => { const c = ((l.s[l.s.length - 1].e1rm - l.s[0].e1rm) / l.s[0].e1rm) * 100; return { name: nameOf(l.st.ex), c, best: l.st.best } }).sort((a, b) => b.c - a.c)
  const lines = rows.slice(0, 3).map((r) => `• ${tr('{0}: {1}% est. 1RM over 8 weeks (best {2} × {3})', r.name, `${r.c >= 0 ? '+' : ''}${r.c.toFixed(1)}`, W(r.best.weight, unit), r.best.reps)}`)
  const tot = totals(state)
  return { text: tr('Here\'s what your logs show:\n{0}\n\nTotal volume lifted: {1} {2} across {3} sessions.', lines.join('\n'), fmtNum(toDisplay(tot.volume, unit)), unit, tot.workouts), actions: [{ label: tr('Open strength charts'), to: '/progress?tab=strength' }] }
}

function weekReview(state) {
  const w = weekStats(state, 0)
  const p = weekStats(state, -1)
  const unit = state.settings.unit
  const sets = muscleSets(state, addDaysKey(dateKey(), -6), dateKey())
  const low = Object.entries(sets).filter(([m]) => m !== 'Core').sort((a, b) => a[1] - b[1])[0]
  const head = tr('This week: {0} of {1} planned sessions, {2} {3} of volume.', w.workouts, state.settings.weeklyTarget, fmtNum(toDisplay(w.volume, unit)), unit)
  const prev = p.volume ? ` ${tr('(last week: {0} {1} in total)', fmtNum(toDisplay(p.volume, unit)), unit)}` : ''
  return { text: `${head}${prev}\n${insight(state).text}\n${tr('Lowest muscle group over the last 7 days: {0} ({1} sets).', tr(low[0]), low[1])}`, actions: [{ label: tr('Muscle balance'), to: '/progress?tab=muscles' }] }
}

const MUSCLE_WORDS = { chest: 'Chest', 'سنگ': 'Chest', back: 'Back', 'پشت': 'Back', shoulder: 'Shoulders', 'شان': 'Shoulders', leg: 'Quads', 'ران': 'Quads', quad: 'Quads', hamstring: 'Hamstrings', glute: 'Glutes', 'ڕین': 'Glutes', bicep: 'Biceps', tricep: 'Triceps', arm: 'Biceps', 'قۆڵ': 'Biceps', core: 'Core', ab: 'Core', 'ناوەڕاست': 'Core' }

function build(state, q) {
  const key = Object.keys(MUSCLE_WORDS).find((k) => q.includes(k))
  const target = key ? MUSCLE_WORDS[key] : 'Chest'
  const mins = Number((q.match(/(\d{2})\s*(min|m\b|خولەک)/) || [])[1]) || 45
  const count = Math.max(3, Math.min(6, Math.round(mins / 9)))
  const home = ['Home', 'Dumbbells', 'Bodyweight'].includes(state.user.equipment)
  const pool = exercises.filter((e) => !['Mobility', 'Conditioning', 'Cardio'].includes(e.type) && (!home || ['Dumbbell', 'Bodyweight'].includes(e.equipment)))
  const main = pool.filter((e) => e.muscle === target)
  const supp = pool.filter((e) => e.secondary.includes(target) || (target === 'Quads' && e.muscle === 'Hamstrings') || (target === 'Chest' && e.muscle === 'Triceps') || (target === 'Back' && e.muscle === 'Biceps') || (target === 'Shoulders' && e.muscle === 'Triceps'))
  const picks = [...main.sort((a, b) => (a.type === 'Compound' ? -1 : 1) - (b.type === 'Compound' ? -1 : 1)).slice(0, Math.ceil(count * 0.65)), ...supp.slice(0, count)].filter((e, i, a) => a.findIndex((x) => x.id === e.id) === i).slice(0, count)
  const items = picks.map((e) => ({ exerciseId: e.id, sets: e.type === 'Compound' ? 4 : 3, reps: e.reps }))
  const list = picks.map((e, i) => `${i + 1}. ${nameOf(e)} — ${items[i].sets} × ${e.reps[0]}–${e.reps[1]}`).join('\n')
  const head = home ? tr('Here\'s a {0}-minute {1} session using home-friendly equipment:', mins, tr(target)) : tr('Here\'s a {0}-minute {1} session using gym equipment:', mins, tr(target))
  return { text: `${head}\n${list}\n${tr('Start each exercise with a weight that leaves 2–3 reps in reserve.')}`, actions: [{ label: tr('Save as workout'), build: { title: tr('{0} focus ({1} min)', tr(target), mins), items } }] }
}

function explain(q) {
  const hit = exercises.filter((e) => q.includes(e.name.toLowerCase()) || q.includes(e.en.toLowerCase()) || q.includes(e.id.replace(/-/g, ' '))).sort((a, b) => b.name.length - a.name.length)[0]
    || exercises.find((e) => e.en.toLowerCase().split(' ').filter((w) => w.length > 3).some((w) => q.includes(w)))
  if (!hit) return null
  const sec = hit.secondary.length ? tr(', with {0}', hit.secondary.map((m) => tr(m)).join(' / ')) : ''
  return { text: `${nameOf(hit)} (${tr(hit.muscle)}${sec}):\n${hit.tech.slice(0, 3).map((s, i) => `${i + 1}. ${s}`).join('\n')}\n${tr('Watch for: {0}', hit.mistakes[0])}`, actions: [{ label: tr('Full technique page'), to: `/exercises/${hit.id}` }] }
}

function adjust(state) {
  const s = todaysSession(state)
  const r = recoveryState(state)
  const intro = s ? tr('Today\'s session is {0} ({1} exercises).', s.workout.title, s.workout.exercises.length) : tr('You have no course session scheduled.')
  const tip = r.score < 65 ? tr('Consider trimming one set from each accessory exercise and stopping 1–2 reps earlier than usual.') : tr('Keep the plan as written and push your first working set.')
  return { text: `${intro} ${tr('Readiness is {0} ({1}/100).', tr(r.label).toLowerCase(), r.score)} ${tip}`, actions: s ? [{ label: tr('View today’s workout'), to: `/workouts/${s.workout.id}` }] : [] }
}

function recovery(state) {
  const r = recoveryState(state)
  return { text: tr('Recovery score: {0}/100 ({1}). Average sleep over the last 3 nights: {2} h; training load vs your 4-week average: {3}×.\n{4}\nThis is training guidance, not medical advice.', r.score, tr(r.label), r.sleepAvg.toFixed(1), r.ratio.toFixed(2), r.advice), actions: [{ label: tr('Open recovery'), to: '/recovery' }] }
}

function records(state) {
  const unit = state.settings.unit
  const lines = ['bench', 'squat', 'rdl', 'pullup'].map((id) => exerciseStats(state, id)).filter((s) => s.best).map((s) => `• ${nameOf(s.ex)}: ${W(s.best.weight, unit)} × ${s.best.reps}`)
  return { text: lines.length ? tr('Your current bests:\n{0}', lines.join('\n')) : tr('No PRs logged yet.'), actions: [{ label: tr('All PRs'), to: '/progress?tab=prs' }] }
}

export function coachReply(state, raw, intent) {
  const q = raw.toLowerCase()
  if (intent === 'increase') return increaseAdvice(state, exercises.find((e) => e.id === 'bench'))
  if (intent === 'analyze') return progressAnalysis(state)
  if (intent === 'week') return weekReview(state)
  if (intent === 'build') return build(state, q)
  if (intent === 'adjust') return adjust(state)
  if (intent === 'explain') return explain('romanian deadlift') || null
  if (has(q, ...KEYWORDS.increase)) {
    const named = exercises.find((e) => q.includes(e.name.toLowerCase()) || q.includes(e.en.toLowerCase().split(' ').slice(-2).join(' ')) || q.includes(e.id.replace(/-/g, ' ')))
    return increaseAdvice(state, named || exercises.find((e) => e.id === 'bench'))
  }
  if (has(q, ...KEYWORDS.build)) return build(state, q)
  if (has(q, ...KEYWORDS.adjust)) return adjust(state)
  if (has(q, ...KEYWORDS.recover)) return recovery(state)
  if (has(q, ...KEYWORDS.week)) return weekReview(state)
  const e = explain(q)
  if (e) return e
  if (has(q, ...KEYWORDS.analyze)) return progressAnalysis(state)
  if (has(q, ...KEYWORDS.prs)) return records(state)
  return { text: tr('I can analyse your strength trends, review your week, suggest load changes, explain an exercise, or build a quick workout. Try one of the suggestions below.') }
}
