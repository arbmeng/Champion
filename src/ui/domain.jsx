import { Link } from 'react-router-dom'
import { Award, Bookmark, Calendar, Check, ChevronRight, Dumbbell, Flame, Heart, Lock, Medal, Sparkles, Star, Trophy, Weight, Sparkle } from 'lucide-react'
import { Badge, Avatar, Card, ProgressBar, cx } from './primitives'
import { Cover, ExerciseThumb } from './art'
import { DAY_LABELS, monthShort, shortDate } from '../lib/dates'
import { fmtNum } from '../lib/format'
import { tr } from '../lib/i18n'

/* ---------- small controls ---------- */
export function FavoriteButton({ active, onClick, label, size = 'md', plain }) {
  return (
    <button type="button" className={cx('fav-btn', `fav-${size}`, plain && 'fav-plain', active && 'is-active')} aria-pressed={active} aria-label={active ? tr('Remove from favorites: {0}', label) : tr('Add to favorites: {0}', label)} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick() }}>
      <Heart size={size === 'sm' ? 15 : 18} fill={active ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  )
}

export function SaveButton({ active, onClick, label }) {
  return (
    <button type="button" className={cx('fav-btn', active && 'is-active')} aria-pressed={active} aria-label={active ? tr('Unsave {0}', label) : tr('Save {0}', label)} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick() }}>
      <Bookmark size={18} fill={active ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  )
}

/* ---------- metrics ---------- */
export function MetricCard({ label, value, unit, delta, deltaTone, icon: Icon, hint, to, className }) {
  const body = (
    <>
      <div className="metric-top"><span className="eyebrow">{label}</span>{Icon && <Icon size={16} className="metric-icon" aria-hidden="true" />}</div>
      <div className="metric-value num num-lg">{value}{unit && <span className="unit">{unit}</span>}</div>
      {(delta || hint) && <div className={cx('metric-foot caption', deltaTone && `tone-${deltaTone}`)}>{delta && <b>{delta}</b>} {hint}</div>}
    </>
  )
  return to ? <Link to={to} className={cx('card card-pad card-interactive metric', className)}>{body}</Link> : <Card className={cx('metric', className)}>{body}</Card>
}

export function ProgressCard({ title, subtitle, value, label, tone, to, right }) {
  const body = (
    <>
      <div className="row between"><div className="grow"><h3 className="truncate">{title}</h3>{subtitle && <p className="caption">{subtitle}</p>}</div>{right || <span className="num num-md">{Math.round(value)}<span className="unit">%</span></span>}</div>
      <ProgressBar value={value} tone={tone} label={tr("{0} progress", title)} />
      {label && <p className="caption">{label}</p>}
    </>
  )
  return to ? <Link to={to} className="card card-pad card-interactive stack-sm">{body}</Link> : <Card className="stack-sm">{body}</Card>
}

export function ChartCard({ title, question, right, children, className, foot }) {
  return (
    <Card className={cx('chart-card', className)}>
      <div className="row-top between">
        <div className="grow"><h3>{title}</h3>{question && <p className="caption">{question}</p>}</div>
        {right}
      </div>
      <div className="chart-body">{children}</div>
      {foot && <div className="chart-foot caption">{foot}</div>}
    </Card>
  )
}

/* ---------- workouts ---------- */
export function WorkoutCard({ workout, saved, onSave, compact }) {
  return (
    <Link to={`/workouts/${workout.id}`} className={cx('card-interactive wcard', compact && 'wcard-compact')}>
      <Cover hue={workout.hue} seed={workout.id.length + workout.exercises.length} className="wcard-cover">
        <div className="wcard-top">{onSave ? <SaveButton active={saved} onClick={onSave} label={workout.title} /> : <span />}</div>
        <div className="wcard-over">
          <span className="wcard-kicker">{tr(workout.level)} · {tr(workout.categories[0])}</span>
          <h3 className="wcard-title">{workout.title}</h3>
          <span className="wcard-meta"><span>{workout.minutes} {tr('min')}</span><i aria-hidden="true" /><span>{workout.calories} {tr('kcal')}</span><i aria-hidden="true" /><span>{workout.exercises.length} {tr('exercises')}</span></span>
        </div>
      </Cover>
    </Link>
  )
}

export function CourseCard({ course, progress, featured }) {
  const enrolled = progress?.enrolled
  return (
    <Link to={`/courses/${course.id}`} className={cx('card card-interactive ccard', featured && 'ccard-featured')}>
      <Cover hue={course.hue} variant={course.perWeek % 4} className="ccard-cover">
        <div className="ccard-top"><Badge tone="glass">{tr(course.level)}</Badge>{enrolled && <Badge tone="accent">{tr("Enrolled")}</Badge>}</div>
        <div className="ccard-title"><h3>{course.title}</h3><p>{course.trainer.name}</p></div>
      </Cover>
      <div className="ccard-body">
        <div className="ccard-facts caption"><span>{course.weeks} {tr("weeks")}</span><span>{course.weeks * course.perWeek} {tr("workouts")}</span><span>{course.perWeek}{tr("/week")}</span><span className="row gap-1"><Star size={12} fill="currentColor" aria-hidden="true" /> {course.rating}</span></div>
        {enrolled ? (
          <div className="stack-sm"><ProgressBar value={progress.pct} label={tr("{0} progress", course.title)} /><span className="caption">{tr("Week {0} of {1} · {2}/{3} sessions", progress.week, course.weeks, progress.completed, progress.total)}</span></div>
        ) : (
          <div className="row wrap gap-1">{course.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div>
        )}
      </div>
    </Link>
  )
}

/* ---------- exercises ---------- */
export function ExerciseCard({ exercise, fav, onFav, onClick }) {
  return (
    <Link to={`/exercises/${exercise.id}`} onClick={onClick} className="card card-interactive ecard">
      <ExerciseThumb exercise={exercise} size={64} />
      <div className="grow">
        <h3 className="truncate">{exercise.name}</h3>
        <p className="caption">{tr(exercise.muscle)} · {tr(exercise.equipment)}</p>
        <div className="row gap-1 ecard-tags"><Badge>{tr(exercise.type)}</Badge><Badge tone={exercise.difficulty === 'Advanced' ? 'warning' : 'neutral'}>{tr(exercise.difficulty)}</Badge></div>
      </div>
      {onFav && <FavoriteButton active={fav} onClick={onFav} label={exercise.name} size="sm" />}
    </Link>
  )
}

export function ExerciseRow({ index, exercise, detail, right, to }) {
  const inner = (
    <>
      {index != null && <span className="erow-index num">{String(index).padStart(2, '0')}</span>}
      <ExerciseThumb exercise={exercise} size={44} />
      <div className="grow"><b className="truncate erow-name">{exercise.name}</b><span className="caption">{tr(exercise.muscle)} · {tr(exercise.equipment)}</span></div>
      {detail && <span className="erow-detail num">{detail}</span>}
      {right}
      {to && <ChevronRight size={16} className="faint" aria-hidden="true" />}
    </>
  )
  return to ? <Link to={to} className="erow">{inner}</Link> : <div className="erow">{inner}</div>
}

export function WorkoutRow({ log, fmtVol }) {
  const d = new Date(`${log.date}T00:00:00`)
  return (
    <Link to={`/history/${log.id}`} className="wrow">
      <span className="wrow-date"><b className="num">{d.getDate()}</b><small>{monthShort(d)}</small></span>
      <div className="grow"><b className="truncate wrow-title">{log.title}</b><span className="caption">{tr("{0} min · {1} exercises · {2} sets", Math.round(log.duration / 60), log.exercises, log.sets)}</span></div>
      <div className="wrow-right">{log.volume > 0 && <b className="num">{fmtVol(log.volume)}</b>}{log.prs.length > 0 && <Badge tone="accent" icon={Trophy}>{log.prs.length} {tr("PR")}</Badge>}</div>
      <ChevronRight size={16} className="faint" aria-hidden="true" />
    </Link>
  )
}

/* ---------- goals, achievements, leaderboards ---------- */
export function GoalCard({ g, onRemove }) {
  const done = g.pct >= 100
  return (
    <Card className="goal stack-sm">
      <div className="row-top between">
        <div className="grow"><span className="eyebrow">{tr(g.group)}</span><h3>{g.title}</h3></div>
        {done ? <Badge tone="success" icon={Check}>{tr("Achieved")}</Badge> : <span className="num num-md">{Math.round(g.pct)}<span className="unit">%</span></span>}
      </div>
      <ProgressBar value={g.pct} tone={done ? 'success' : 'accent'} label={g.title} />
      <div className="row between"><span className="caption">{g.label}</span><div className="row gap-2">{g.href && <Link className="link caption" to={g.href}>{tr("View")}</Link>}{onRemove && <button type="button" className="link caption" onClick={onRemove}>{tr("Remove")}</button>}</div></div>
    </Card>
  )
}

const achIcons = { trophy: Trophy, dumbbell: Dumbbell, weight: Weight, flame: Flame, medal: Medal, calendar: Calendar, sparkles: Sparkles, check: Check, award: Award }
export function AchievementCard({ a }) {
  const Icon = achIcons[a.icon] || Award
  return (
    <div className={cx('ach', a.unlocked ? 'is-unlocked' : 'is-locked')}>
      <span className="ach-badge">{a.unlocked ? <Icon size={22} aria-hidden="true" /> : <Lock size={18} aria-hidden="true" />}</span>
      <b>{a.title}</b>
      <span className="caption">{a.unlocked ? tr("Unlocked") : `${fmtNum(a.value)} / ${fmtNum(a.target)}`}</span>
      {!a.unlocked && <ProgressBar value={(a.value / a.target) * 100} height={4} label={a.title} />}
      <span className="sr-only">{a.description}</span>
    </div>
  )
}

export function LeaderboardRow({ row, format }) {
  return (
    <li className={cx('lb-row', row.you && 'is-you')}>
      <span className="lb-rank num">{row.rank}</span>
      <Avatar name={row.name} hue={row.hue ?? 18} size={34} />
      <b className="grow truncate">{row.name}{row.you && <Badge tone="accent" className="lb-you">{tr("You")}</Badge>}</b>
      <span className="num">{format ? format(row.value) : row.value}</span>
    </li>
  )
}

export function ChatMessage({ m, children }) {
  const coach = m.role === 'coach'
  return (
    <div className={cx('chat-msg', coach ? 'is-coach' : 'is-user')}>
      {coach && <span className="chat-avatar"><Sparkle size={14} aria-hidden="true" /></span>}
      <div className="chat-bubble">
        <p style={{ whiteSpace: 'pre-line' }}>{m.text}</p>
        {children}
      </div>
    </div>
  )
}

/* ---------- week strip ---------- */
export function WeekStrip({ keys, days, todayKey }) {
  return (
    <ol className="weekstrip" aria-label={tr("This week")}>
      {keys.map((k, i) => {
        const done = days.has(k)
        const isToday = k === todayKey
        return (
          <li key={k} className={cx('weekstrip-day', done && 'is-done', isToday && 'is-today')}>
            <span className="caption">{DAY_LABELS[i]}</span>
            <span className="weekstrip-dot" aria-hidden="true">{done ? <Check size={14} strokeWidth={3} /> : <span>{new Date(`${k}T00:00:00`).getDate()}</span>}</span>
            <span className="sr-only">{done ? tr("Workout completed") : isToday ? tr("Today") : tr("No workout")}, {shortDate(k)}</span>
          </li>
        )
      })}
    </ol>
  )
}

/* Concentric activity rings (weekly workouts / volume / minutes) */
export function Rings({ rings, size = 132, stroke = 10 }) {
  return (
    <svg className="rings" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={rings.map((r) => `${r.label}: ${Math.round(r.value)}%`).join(', ')}>
      {rings.map((r, i) => {
        const radius = size / 2 - stroke / 2 - i * (stroke + 4)
        const c = 2 * Math.PI * radius
        const v = Math.max(0, Math.min(100, r.value))
        return (
          <g key={r.label} transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={r.color} strokeOpacity=".16" strokeWidth={stroke} />
            <circle className="ring-arc" cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={r.color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * v) / 100} />
          </g>
        )
      })}
    </svg>
  )
}
