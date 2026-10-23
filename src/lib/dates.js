const pad = (n) => String(n).padStart(2, '0')
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseKey = (key) => new Date(`${key}T00:00:00`)
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
export const addDaysKey = (key, n) => dateKey(addDays(parseKey(key), n))
export const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000)
export const startOfWeek = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x }
export const weekKeys = (d = new Date(), offset = 0) => { const s = addDays(startOfWeek(d), offset * 7); return Array.from({ length: 7 }, (_, i) => dateKey(addDays(s, i))) }
export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const shortDate = (key) => parseKey(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
export const longDate = (key) => parseKey(key).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
export const weekdayShort = (key) => parseKey(key).toLocaleDateString('en-US', { weekday: 'short' })
export function timeAgo(ts, now = Date.now()) {
  const m = Math.max(0, Math.round((now - ts) / 60000))
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  return d === 1 ? 'Yesterday' : `${d}d ago`
}
export function greeting(d = new Date()) {
  const h = d.getHours()
  return h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}
