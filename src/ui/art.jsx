import { tr } from '../lib/i18n'
import { useId } from 'react'
import { cx } from './primitives'

// Original generated cover art — a dark, grainy "studio shot" look with a rim-lit equipment silhouette.
// Drawn in SVG (no photos, no stock) so it stays light, offline-friendly and on-brand.
export function Cover({ hue: rawHue = 18, seed = 0, variant, className, children, rounded = true }) {
  // Keep covers in a warm-graphite / steel family so every card feels like one studio shoot.
  const hue = [18, 24, 212, 14, 30, 204][Math.abs(Math.round(rawHue)) % 6]
  const id = useId().replace(/:/g, '')
  const v = variant ?? seed % 4
  const tint = (l, s2 = 14) => `hsl(${hue} ${s2}% ${l}%)`
  const rim = `hsl(${hue} 70% 62%)`
  return (
    <div className={cx('cover', className)} style={{ borderRadius: rounded ? undefined : 0 }}>
      <svg className="cover-art" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={tint(19)} /><stop offset="1" stopColor={tint(7, 18)} /></linearGradient>
          <radialGradient id={`l${id}`} cx=".78" cy=".18" r=".7"><stop offset="0" stopColor={`hsl(${hue} 40% 62%)`} stopOpacity=".34" /><stop offset="1" stopColor={`hsl(${hue} 40% 40%)`} stopOpacity="0" /></radialGradient>
          <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset=".35" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".72" /></linearGradient>
          <filter id={`n${id}`} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 0" /></filter>
        </defs>
        <rect width="400" height="240" fill={`url(#g${id})`} />
        <rect width="400" height="240" fill={`url(#l${id})`} />
        {v === 0 && (
          <g transform="rotate(-14 270 110)" fill={tint(10, 16)} stroke={rim} strokeOpacity=".18" strokeWidth="1.2" opacity=".85">
            <rect x="120" y="106" width="300" height="9" rx="4" />
            {[[168, 62, 46, 100], [190, 76, 34, 72], [330, 62, 46, 100], [308, 76, 34, 72]].map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} rx="7" />)}
          </g>
        )}
        {v === 1 && (
          <g fill={tint(11, 16)} stroke={rim} strokeOpacity=".28" strokeWidth="1.2">
            <circle cx="300" cy="140" r="58" />
            <path d="M262 100c0-42 76-42 76 0" fill="none" strokeWidth="14" stroke={tint(11, 16)} />
            <path d="M268 98c2-34 64-34 66 0" fill="none" strokeOpacity=".32" />
          </g>
        )}
        {v === 2 && (
          <g fill={tint(10, 16)} stroke={rim} strokeOpacity=".16" strokeWidth="1.2" opacity=".8">
            {[0, 1, 2, 3].map((i) => <rect key={i} x={262 + i * 40} y={60 + (i % 2) * 22} width="20" height="230" rx="3" />)}
            <rect x="196" y="118" width="210" height="8" rx="4" />
          </g>
        )}
        {v === 3 && (
          <g fill="none" stroke={rim} strokeOpacity=".3" strokeWidth="1.4">
            {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M120 ${200 - i * 6} C 210 ${120 - i * 12}, 280 ${260 - i * 10}, 430 ${70 + i * 7}`} />)}
          </g>
        )}
        <rect width="400" height="240" fill={`url(#s${id})`} />
        <rect width="400" height="240" filter={`url(#n${id})`} opacity=".07" />
      </svg>
      {children}
    </div>
  )
}

/* Stylised front/back figure. Regions are simple shapes — abstract, not anatomical illustration. */
const FRONT = {
  Shoulders: [<ellipse key="a" cx="26" cy="46" rx="9" ry="10" />, <ellipse key="b" cx="74" cy="46" rx="9" ry="10" />],
  Chest: [<path key="a" d="M50 42c-4-3-13-3-18 1-2 5-1 12 3 15 5 2 12 1 15-3z" />, <path key="b" d="M50 42c4-3 13-3 18 1 2 5 1 12-3 15-5 2-12 1-15-3z" />],
  Biceps: [<rect key="a" x="12" y="58" width="12" height="26" rx="6" />, <rect key="b" x="76" y="58" width="12" height="26" rx="6" />],
  Core: [<rect key="a" x="38" y="62" width="24" height="36" rx="8" />],
  Quads: [<rect key="a" x="30" y="104" width="18" height="52" rx="8" />, <rect key="b" x="52" y="104" width="18" height="52" rx="8" />],
}
const BACK = {
  Shoulders: [<ellipse key="a" cx="26" cy="46" rx="9" ry="10" />, <ellipse key="b" cx="74" cy="46" rx="9" ry="10" />],
  Back: [<path key="a" d="M50 34c-8 0-16 2-19 8-1 12 2 28 9 38l10 4 10-4c7-10 10-26 9-38-3-6-11-8-19-8z" />],
  Triceps: [<rect key="a" x="12" y="58" width="12" height="26" rx="6" />, <rect key="b" x="76" y="58" width="12" height="26" rx="6" />],
  Glutes: [<ellipse key="a" cx="41" cy="102" rx="11" ry="12" />, <ellipse key="b" cx="59" cy="102" rx="11" ry="12" />],
  Hamstrings: [<rect key="a" x="30" y="116" width="18" height="44" rx="8" />, <rect key="b" x="52" y="116" width="18" height="44" rx="8" />],
}
const NEUTRAL = (
  <g>
    <circle cx="50" cy="16" r="10" />
    <rect x="44" y="24" width="12" height="9" rx="3" />
    <rect x="30" y="34" width="40" height="66" rx="14" />
    <rect x="9" y="82" width="11" height="32" rx="5.5" /><rect x="80" y="82" width="11" height="32" rx="5.5" />
    <rect x="33" y="98" width="34" height="14" rx="6" />
    <rect x="31" y="154" width="15" height="44" rx="7" /><rect x="54" y="154" width="15" height="44" rx="7" />
  </g>
)

function Figure({ regions, primary, secondary, x = 0 }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <g className="fig-base">{NEUTRAL}</g>
      {Object.entries(regions).map(([m, shapes]) => (
        <g key={m} className={primary.includes(m) ? 'fig-primary' : secondary.includes(m) ? 'fig-secondary' : 'fig-idle'}>{shapes}</g>
      ))}
    </g>
  )
}

const FRONT_SET = ['Chest', 'Shoulders', 'Biceps', 'Core', 'Quads']
export function bodyView(muscle) { return FRONT_SET.includes(muscle) ? 'front' : 'back' }

export function MuscleMap({ primary = [], secondary = [], view = 'both', height = 180, label, className }) {
  const p = Array.isArray(primary) ? primary : [primary]
  const both = view === 'both'
  const w = both ? 220 : 100
  return (
    <svg className={cx('muscle-map', className)} viewBox={`0 0 ${w} 204`} height={height} role="img" aria-label={label || tr('Target muscles: {0}', p.map((m) => tr(m)).join('، ') || tr('none'))}>
      {(both || view === 'front') && <Figure regions={FRONT} primary={p} secondary={secondary} />}
      {(both || view === 'back') && <Figure regions={BACK} primary={p} secondary={secondary} x={both ? 120 : 0} />}
    </svg>
  )
}

export function ExerciseThumb({ exercise, size = 56 }) {
  const view = bodyView(exercise.muscle)
  return (
    <span className="ex-thumb" style={{ width: size, height: size }} aria-hidden="true">
      <MuscleMap primary={[exercise.muscle]} secondary={exercise.secondary} view={view} height={size - 8} />
    </span>
  )
}
