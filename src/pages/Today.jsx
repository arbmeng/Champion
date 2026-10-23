import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Dumbbell, Flame, Layers, Play, Sparkles, Trophy, Apple, BedDouble, Target } from 'lucide-react'
import { useApp } from '../state/store'
import { achievementList, courseProgress, insight, recommendations, streakDays, todaysSession, totals, weekStats } from '../state/selectors'
import { sessionPosition, sessionWeek, sessionWorkoutId } from '../data/courses'
import { Badge, Button, Card, EmptyState, ProgressBar, Section } from '../ui/primitives'
import { Cover } from '../ui/art'
import { AchievementCard, MetricCard, WeekStrip, WorkoutCard } from '../ui/domain'
import { dateKey, greeting, weekKeys } from '../lib/dates'
import { fmtCompact, fmtPct, toDisplay } from '../lib/format'
import { useStartWorkout } from '../lib/useStart'
import { findWorkout } from '../state/selectors'

function TodayHero({ session, onStart }) {
  const { state } = useApp()
  const { workout, course, index, doneToday } = session
  const a = state.active && state.active.workoutId === workout.id ? state.active : null
  const exDone = a ? a.exercises.filter((e) => e.sets.every((s) => s.done)).length : 0
  const total = workout.exercises.length
  return (
    <Cover hue={workout.hue} variant={2} className="hero enter">
      <div className="hero-inner">
        <div className="stack-sm">
          <div className="row gap-2 wrap"><Badge tone="glass">{doneToday ? 'Up next' : 'Today’s workout'}</Badge><span className="hero-course">{course.title} · Week {sessionWeek(course, index)} · Session {sessionPosition(course, index)}</span></div>
          <h2 className="hero-title">{workout.title}</h2>
          <div className="hero-meta"><span><Dumbbell size={15} aria-hidden="true" /> {total} exercises</span><span><Clock size={15} aria-hidden="true" /> {workout.minutes} min</span><span>{workout.level}</span></div>
        </div>
        <div className="stack-sm hero-foot">
          <div className="row between hero-progress-label"><span>{a ? 'In progress' : doneToday ? 'Today’s session is done — next one is ready' : 'Ready when you are'}</span><b className="num">{exDone} / {total} completed</b></div>
          <div className="hero-bar"><span style={{ width: `${(exDone / total) * 100}%` }} /></div>
          <div className="row gap-2 wrap hero-actions">
            <Button variant="primary" size="xl" icon={Play} onClick={onStart} className="hero-cta">{a ? 'Resume workout' : doneToday ? 'Start next session' : 'Start workout'}</Button>
            <Button variant="glass" size="lg" to={`/workouts/${workout.id}`}>View workout</Button>
          </div>
        </div>
      </div>
    </Cover>
  )
}

export function Today() {
  const { state } = useApp()
  const unit = state.settings.unit
  const start = useStartWorkout()
  const session = todaysSession(state)
  const week = weekStats(state, 0)
  const prevWeek = weekStats(state, -1)
  const t = totals(state)
  const streak = streakDays(state)
  const tip = insight(state)
  const recs = recommendations(state)
  const todayKey = dateKey()
  const keys = weekKeys()
  const prog = state.activeCourse && state.enrolled.includes(state.activeCourse) ? courseProgress(state, state.activeCourse) : null
  const monthPrs = state.history.filter((l) => l.date >= todayKey.slice(0, 7)).reduce((n, l) => n + l.prs.length, 0)
  const volDelta = prevWeek.volume ? ((week.volume - prevWeek.volume) / prevWeek.volume) * 100 : null
  const unlocked = achievementList(state).filter((x) => x.unlocked).sort((a, b) => (b.unlockedAt || '').localeCompare(a.unlockedAt || '')).slice(0, 3)
  const upcoming = prog && prog.next != null ? Array.from({ length: Math.min(4, prog.total - prog.next) }, (_, i) => {
    const idx = prog.next + i
    return { idx, workout: findWorkout(state, sessionWorkoutId(prog.course, idx)), week: sessionWeek(prog.course, idx) }
  }) : []
  const quick = recs[0]?.workout
  const goalCount = state.goals.length

  return (
    <div className="today">
      <div className="today-main stack-lg">
        <header className="today-greet enter">
          <div className="eyebrow">{greeting()}, {state.user.name}</div>
          <h1 className="display today-title">Your training is ready.</h1>
        </header>

        {session ? (
          <TodayHero session={session} onStart={() => start(session.workout, { courseId: session.course.id, sessionIndex: session.index })} />
        ) : (
          <Card className="today-empty enter">
            <EmptyState icon={Layers} title={state.enrolled.length ? 'Course complete — nice work' : 'No course enrolled'} body={state.enrolled.length ? 'Pick your next challenge or train something from the library.' : 'Enroll in a course to get a structured weekly plan, or start a single workout from the library.'}
              action={<div className="row gap-2 wrap"><Button variant="primary" to="/courses">Browse courses</Button>{quick && <Button icon={Play} onClick={() => start(quick)}>Quick start: {quick.title}</Button>}</div>} />
          </Card>
        )}

        <div className="grid-2 today-cols">
          {prog ? (
            <Card as={Link} to={`/courses/${prog.course.id}`} className="card-interactive stack course-continue enter enter-1">
              <div className="row between"><span className="eyebrow">Continue course</span><Badge tone="accent">{prog.finished ? 'Complete' : `Week ${prog.week} of ${prog.course.weeks}`}</Badge></div>
              <h3 className="course-continue-title">{prog.course.title}</h3>
              <div className="stack-sm"><ProgressBar value={prog.pct} label="Course progress" height={10} /><div className="row between caption"><span className="num">{prog.completed} / {prog.total} sessions</span><span>{Math.round(prog.pct)}%</span></div></div>
              <span className="link row gap-1">Continue <ArrowRight size={15} aria-hidden="true" /></span>
            </Card>
          ) : (
            <Card className="enter enter-1"><EmptyState compact icon={Layers} title="No course enrolled" body="Follow a multi-week program built by a coach." action={<Button to="/courses" variant="primary" size="sm">Explore courses</Button>} /></Card>
          )}
          <Card className={`insight enter enter-2 insight-${tip.tone}`}>
            <span className="eyebrow row gap-1"><Sparkles size={13} aria-hidden="true" /> Personal insight</span>
            <p className="insight-text">{tip.text}</p>
            <Link className="link caption" to="/coach">Ask your coach →</Link>
          </Card>
        </div>

        <Section title="Performance snapshot" eyebrow="This week" action={<Link className="link caption" to="/progress">Full progress</Link>}>
          <div className="grid-4">
            <MetricCard label="Workouts" icon={Dumbbell} value={week.workouts} unit={`/ ${state.settings.weeklyTarget}`} hint="this week" to="/history" />
            <MetricCard label="Volume" icon={Flame} value={fmtCompact(toDisplay(week.volume, unit))} unit={unit} delta={volDelta != null ? fmtPct(volDelta) : null} deltaTone={volDelta > 0 ? 'success' : 'danger'} hint={volDelta != null ? 'vs last week' : 'this week'} to="/progress?tab=volume" />
            <MetricCard label="Streak" icon={Flame} value={streak} unit="days" hint={streak ? 'on plan' : 'start today'} to="/progress?tab=consistency" />
            <MetricCard label="PRs" icon={Trophy} value={monthPrs} hint="this month" to="/progress?tab=prs" />
          </div>
        </Section>

        {recs.length > 0 && (
          <Section title="Recommended for you" eyebrow="Based on your last 7 days">
            <div className="grid-auto recs">
              {recs.map((r) => r.kind === 'workout' ? (
                <div key={r.id} className="stack-sm"><WorkoutCard workout={r.workout} compact /><p className="caption rec-reason">{r.reason}</p></div>
              ) : (
                <Card key={r.id} as={Link} to={`/courses/${r.course.id}`} className="card-interactive stack-sm"><span className="eyebrow">Course</span><h3>{r.course.title}</h3><p className="caption">{r.course.weeks} weeks · {r.course.perWeek}/week · {r.course.level}</p><p className="caption rec-reason">{r.reason}</p></Card>
              ))}
            </div>
          </Section>
        )}

        <Section title="Jump to" className="quick-links">
          <div className="grid-4">
            <Card as={Link} to="/goals" className="card-interactive quick"><Target size={20} aria-hidden="true" /><b>Goals</b><span className="caption">{goalCount} active</span></Card>
            <Card as={Link} to="/nutrition" className="card-interactive quick"><Apple size={20} aria-hidden="true" /><b>Nutrition</b><span className="caption">Today’s fuel</span></Card>
            <Card as={Link} to="/recovery" className="card-interactive quick"><BedDouble size={20} aria-hidden="true" /><b>Recovery</b><span className="caption">Readiness</span></Card>
            <Card as={Link} to="/coach" className="card-interactive quick"><Sparkles size={20} aria-hidden="true" /><b>AI Coach</b><span className="caption">Ask anything</span></Card>
          </div>
        </Section>
      </div>

      <aside className="today-side stack" aria-label="Weekly overview">
        <Card className="stack enter enter-2">
          <div className="row between"><h3>Weekly activity</h3><span className="num caption">{week.workouts}/{state.settings.weeklyTarget}</span></div>
          <WeekStrip keys={keys} days={week.days} todayKey={todayKey} />
          <ProgressBar value={(week.workouts / state.settings.weeklyTarget) * 100} label="Weekly target" />
        </Card>
        {upcoming.length > 0 && (
          <Card className="stack-sm enter enter-3">
            <h3>Upcoming schedule</h3>
            <ul>{upcoming.map((u, i) => (
              <li key={u.idx}><Link to={`/workouts/${u.workout.id}`} className="upcoming"><span className={`upcoming-dot ${i === 0 ? 'is-next' : ''}`} aria-hidden="true" /><span className="grow"><b className="truncate upcoming-title">{u.workout.title}</b><span className="caption">Week {u.week} · {u.workout.minutes} min</span></span>{i === 0 && <Badge tone="accent">Next</Badge>}</Link></li>
            ))}</ul>
          </Card>
        )}
        <Card className="stack-sm enter enter-4">
          <div className="row between"><h3>Recent achievements</h3><Link className="link caption" to="/profile">All</Link></div>
          {unlocked.length ? <div className="grid-3 ach-mini">{unlocked.map((a) => <AchievementCard key={a.id} a={a} />)}</div> : <EmptyState compact icon={Trophy} title="No achievements yet" body="Complete a workout to earn your first badge." />}
        </Card>
        {t.workouts === 0 && <EmptyState icon={Dumbbell} title="No workouts yet" body="Your history will appear here after your first session." action={<Button variant="primary" to="/workouts">Browse workouts</Button>} />}
      </aside>
    </div>
  )
}
