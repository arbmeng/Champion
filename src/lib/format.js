const LB = 2.2046226218
export const toDisplay = (kg, unit = 'kg') => { const v = Number(kg) || 0; return unit === 'lb' ? Math.round(v * LB * 10) / 10 : Math.round(v * 100) / 100 }
export const toKg = (v, unit = 'kg') => { const n = Number(v) || 0; return unit === 'lb' ? Math.round((n / LB) * 1000) / 1000 : n }
export const fmtNum = (n) => Math.round(Number(n) || 0).toLocaleString('en-US')
export const fmtWeight = (kg, unit = 'kg') => `${toDisplay(kg, unit)} ${unit}`
export const fmtVolume = (kg, unit = 'kg') => `${fmtNum(toDisplay(kg, unit))} ${unit}`
export const fmtCompact = (n) => { const v = Number(n) || 0; return Math.abs(v) >= 10000 ? `${(v / 1000).toFixed(1)}k` : fmtNum(v) }
export const fmtMinutes = (sec) => `${Math.max(1, Math.round((sec || 0) / 60))} min`
export const fmtClock = (sec) => { const s = Math.max(0, Math.round(sec)); const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const r = s % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` }
export const fmtPct = (n, digits = 0) => `${n > 0 ? '+' : ''}${(Number(n) || 0).toFixed(digits)}%`
export const pct = (a, b) => (b ? Math.max(0, Math.min(100, (a / b) * 100)) : 0)
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))
// Epley estimate — an estimate, not a measured max.
export const e1rm = (w, r) => (r > 0 ? w * (1 + r / 30) : 0)
export const roundTo = (n, step) => Math.round(n / step) * step
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
export function mulberry32(seed) { let a = seed; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
