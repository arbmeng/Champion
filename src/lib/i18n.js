// Tiny i18n. Source strings are English and double as keys; Kurdish Central (Sorani) is the default.
// Switching language reloads the page so module-level data (exercises, courses…) is translated once at load.
import { ckb } from '../i18n/ckb'

const KEY = 'champion.lang'
export const LANGS = {
  ckb: { name: 'کوردی (سۆرانی)', short: 'کوردی', dir: 'rtl', tag: 'ckb', locale: 'ckb-IQ' },
  en: { name: 'English', short: 'English', dir: 'ltr', tag: 'en', locale: 'en-US' },
}

function read() {
  try { const v = localStorage.getItem(KEY); if (v && LANGS[v]) return v } catch { /* storage unavailable */ }
  return 'ckb'
}

export const lang = read()
export const isRtl = LANGS[lang].dir === 'rtl'
export const missing = new Set()

if (typeof document !== 'undefined') {
  document.documentElement.lang = LANGS[lang].tag
  document.documentElement.dir = LANGS[lang].dir
}

// tr('Week {0} of {1}', 6, 12)
export function tr(key, ...args) {
  let out = key
  if (lang !== 'en') {
    const hit = ckb[key]
    if (hit == null) missing.add(key)
    else out = hit
  }
  return args.length ? out.replace(/\{(\d+)\}/g, (_, i) => (args[i] == null ? '' : args[i])) : out
}

// Pick a language from content that carries both: { en: '…', ckb: '…' } or a plain string.
export const L = (v) => (v && typeof v === 'object' ? v[lang] ?? v.en ?? '' : v)

export function setLang(next) {
  if (!LANGS[next] || next === lang) return
  try { localStorage.setItem(KEY, next) } catch { /* ignore */ }
  window.location.reload()
}
