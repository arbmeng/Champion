import { lang, tr } from './i18n'

const pad = (n) => String(n).padStart(2, '0')
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseKey = (key) => new Date(`${key}T00:00:00`)
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
export const addDaysKey = (key, n) => dateKey(addDays(parseKey(key), n))
export const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000)
export const startOfWeek = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x }
export const weekKeys = (d = new Date(), offset = 0) => { const s = addDays(startOfWeek(d), offset * 7); return Array.from({ length: 7 }, (_, i) => dateKey(addDays(s, i))) }
export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(tr)
export const DAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(tr)
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(tr)
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(tr)
const dowIdx = (d) => (d.getDay() + 6) % 7 // Monday = 0
const compose = (day, month) => (lang === 'en' ? `${month} ${day}` : `${day} ${month}`)
export const monthShort = (d) => MONTHS_SHORT[d.getMonth()]
export const monthYear = (d) => `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`
export const shortDate = (key) => { const d = parseKey(key); return compose(d.getDate(), MONTHS_SHORT[d.getMonth()]) }
export const longDate = (key) => { const d = parseKey(key); return `${DAY_LONG[dowIdx(d)]}${lang === 'en' ? ',' : '،'} ${compose(d.getDate(), MONTHS_LONG[d.getMonth()])}` }
export const weekdayShort = (key) => DAY_LABELS[dowIdx(parseKey(key))]
export function fmtDateTime(ts) {
  const d = new Date(ts)
  return `${compose(d.getDate(), MONTHS_SHORT[d.getMonth()])}، ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
export function timeAgo(ts, now = Date.now()) {
  const m = Math.max(0, Math.round((now - ts) / 60000))
  if (m < 1) return tr('Just now')
  if (m < 60) return tr('{0}m ago', m)
  const h = Math.round(m / 60)
  if (h < 24) return tr('{0}h ago', h)
  const d = Math.round(h / 24)
  return d === 1 ? tr('Yesterday') : tr('{0}d ago', d)
}
export function greeting(d = new Date()) {
  const h = d.getHours()
  return h < 5 ? tr('Late night') : h < 12 ? tr('Good morning') : h < 18 ? tr('Good afternoon') : tr('Good evening')
}
