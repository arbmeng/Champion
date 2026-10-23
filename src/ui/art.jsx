import { useId } from 'react'
import { cx } from './primitives'

// Original generated cover art: layered geometry on a hue-tinted ground. No photos, no stock.
export function Cover({ hue = 18, seed = 0, variant, className, children, rounded = true }) {
  const id = useId().replace(/:/g, '')
  const v = variant ?? seed % 4
  const h2 = (hue + 24) % 360
  return (
    <div className={cx('cover', className)} style={{ borderRadius: rounded ? undefined : 0 }}>
      <svg className="cover-art" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={`hsl(${hue} 42% 17%)`} />
            <stop offset="1" stopColor={`hsl(${h2} 48% 9%)`} />
          </linearGradient>
          <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={`hsl(${hue} 85% 58%)`} stopOpacity=".95" />
            <stop offset="1" stopColor={`hsl(${h2} 85% 50%)`} stopOpacity=".6" />
          </linearGradient>
        </defs>
        <rect width="400" height="240" fill={`url(#g${id})`} />
        {v === 0 && <g fill="none" stroke={`hsl(${hue} 60% 60%)`} strokeOpacity=".22">{Array.from({ length: 9 }, (_, i) => <circle key={i} cx="320" cy="60" r={30 + i * 26} />)}</g>}
        {v === 1 && <g stroke={`hsl(${hue} 60% 62%)`} strokeOpacity=".2" strokeWidth="1.5">{Array.from({ length: 18 }, (_, i) => <line key={i} x1={-40 + i * 36} y1="260" x2={80 + i * 36} y2="-20" />)}</g>}
        {v === 2 && <g fill={`hsl(${hue} 60% 60%)`} fillOpacity=".16">{Array.from({ length: 6 }, (_, i) => <rect key={i} x={170 + i * 36} y={150 - i * 22} width="22" height={90 + i * 22} rx="3" />)}</g>}
        {v === 3 && <g fill="none" stroke={`hsl(${hue} 60% 62%)`} strokeOpacity=".24" strokeWidth="1.5">{Array.from({ length: 8 }, (_, i) => <path key={i} d={`M-10 ${210 - i * 18} C 120 ${150 - i * 18}, 240 ${290 - i * 18}, 420 ${130 - i * 18}`} />)}</g>}
        <rect x="0" y="234" width="400" height="6" fill={`url(#a${id})`} opacity=".5" />
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
    <svg className={cx('muscle-map', className)} viewBox={`0 0 ${w} 204`} height={height} role="img" aria-label={label || `Target muscles: ${p.join(', ') || 'none'}`}>
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
