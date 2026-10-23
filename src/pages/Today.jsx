import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Dumbbell, Flame, Layers, Play, Sparkles, Trophy, Apple, BedDouble, Target } from 'lucide-react'
import { useApp } from '../state/store'
import { achievementList, courseProgress, insight, recommendations, streakDays, todaysSession, totals, weekPlan, weekStats } from '../state/selectors'
import { sessionPosition, sessionWeek, sessionWorkoutId } from '../data/courses'
import { Badge, Button, Card, EmptyState, ProgressBar, Section, cx } from '../ui/primitives'
import { Sheet, useToast } from '../ui/overlays'
import { Cover } from '../ui/art'
import { AchievementCard, MetricCard, WeekStrip, WorkoutCard } from '../ui/domain'
import { DAY_LONG, dateKey, greeting, weekKeys } from '../lib/dates'
import { fmtCompact, fmtPct, toDisplay } from '../lib/format'
import { useStartWorkout } from '../lib/useStart'
import { findWorkout } from '../state/selectors'
import { comma, tr } from '../lib/i18n'

function TodayHero({ session, onStart, plan, onChoose, onChooseDay }) {
  const { state } = useApp()
  const { workout, course, index, doneToday } = session
  const a = state.active && state.active.workoutId === workout.id ? state.active : null
  const exDone = a ? a.exercises.filter((e) => e.sets.every((s) => s.done)).length : 0
  const total = workout.exercises.length
  const isMonday = new Date().getDay() === 1
  const wednesday = plan?.find((d) => d.dayIdx === 2 && !d.done)
  return (
    <Cover hue={workout.hue} variant={2} className="hero enter">
      <div className="hero-inner">
        <div className="stack-sm">
          <div className="row gap-2 wrap"><Badge tone="glass">{doneToday ? tr("Up next") : session.picked ? tr("Your pick for today") : tr("Today’s workout")}</Badge><span className="hero-course">{tr('{0} · Week {1} · Session {2}', course.title, sessionWeek(course, index), sessionPosition(course, index))}</span></div>
          <h2 className="hero-title">{workout.title}</h2>
          <div className="hero-meta"><span><Dumbbell size={15} aria-hidden="true" /> {total} {tr("exercises")}</span><span><Clock size={15} aria-hidden="true" /> {workout.minutes} {tr("min")}</span><span>{tr(workout.level)}</span></div>
        </div>
        <div className="stack-sm hero-foot">
          <div className="row between hero-progress-label"><span>{a ? tr("In progress") : doneToday ? tr("Today’s session is done — next one is ready") : tr("Ready when you are")}</span><b className="num">{exDone} / {total} {tr("completed")}</b></div>
          <div className="hero-bar"><span style={{ width: `${(exDone / total) * 100}%` }} /></div>
          <div className="row gap-2 wrap hero-actions">
            <Button variant="primary" size="xl" icon={Play} onClick={onStart} className="hero-cta">{a ? tr("Resume workout") : doneToday ? tr("Start next session") : tr("Start workout")}</Button>
            <Button variant="glass" size="lg" to={`/workouts/${workout.id}`}>{tr("View workout")}</Button>
          </div>
          {plan && (
            <div className="row gap-2 wrap hero-choose">
              {isMonday && wednesday && wednesday.index !== session.index && <Button variant="glass" size="sm" onClick={() => onChooseDay(wednesday)}>{tr("Choose Wednesday’s workout:")} {wednesday.workout.title}</Button>}
              <Button variant="glass" size="sm" onClick={onChoose}>{tr("Choose another day")}</Button>
            </div>
          )}
        </div>
      </div>
    </Cover>
  )
}

export function Today() {
  const { state, actions } = useApp()
  const toast = useToast()
  const [chooser, setChooser] = useState(false)
  const unit = state.settings.unit
  const start = useStartWorkout()
  const session = todaysSession(state)
  const plan = weekPlan(state)
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
  const pickDay = (d) => {
    actions.pickToday({ courseId: state.activeCourse, index: d.index })
    setChooser(false)
    toast({ title: tr("{0} is your workout for today", d.workout.title), body: tr("Planned for {0}.", DAY_LONG[d.dayIdx]), tone: 'success' })
  }

  return (
    <div className="today">
      <div className="today-main stack-lg">
        <header className="today-greet enter">
          <div className="eyebrow">{greeting()}{comma} {state.user.name}</div>
          <h1 className="display today-title">{tr("Your training is ready.")}</h1>
        </header>

        {session ? (
          <TodayHero session={session} plan={plan} onChoose={() => setChooser(true)} onChooseDay={(d) => pickDay(d)} onStart={() => start(session.workout, { courseId: session.course.id, sessionIndex: session.index })} />
        ) : (
          <Card className="today-empty enter">
            <EmptyState icon={Layers} title={state.enrolled.length ? tr("Course complete — nice work") : tr("No course enrolled")} body={state.enrolled.length ? tr("Pick your next challenge or train something from the library.") : tr("Enroll in a course to get a structured weekly plan, or start a single workout from the library.")}
              action={<div className="row gap-2 wrap"><Button variant="primary" to="/courses">{tr("Browse courses")}</Button>{quick && <Button icon={Play} onClick={() => start(quick)}>{tr("Quick start:")} {quick.title}</Button>}</div>} />
          </Card>
        )}

        <div className="grid-2 today-cols">
          {prog ? (
            <Card as={Link} to={`/courses/${prog.course.id}`} className="card-interactive stack course-continue enter enter-1">
              <div className="row between"><span className="eyebrow">{tr("Continue course")}</span><Badge tone="accent">{prog.finished ? tr("Complete") : tr("Week {0} of {1}", prog.week, prog.course.weeks)}</Badge></div>
              <h3 className="course-continue-title">{prog.course.title}</h3>
              <div className="stack-sm"><ProgressBar value={prog.pct} label={tr("Course progress")} height={10} /><div className="row between caption"><span className="num">{prog.completed} / {prog.total} {tr("sessions")}</span><span>{Math.round(prog.pct)}%</span></div></div>
              <span className="link row gap-1">{tr("Continue")} <ArrowRight size={15} aria-hidden="true" /></span>
            </Card>
          ) : (
            <Card className="enter enter-1"><EmptyState compact icon={Layers} title={tr("No course enrolled")} body={tr("Follow a multi-week program built by a coach.")} action={<Button to="/courses" variant="primary" size="sm">{tr("Explore courses")}</Button>} /></Card>
          )}
          <Card className={`insight enter enter-2 insight-${tip.tone}`}>
            <span className="eyebrow row gap-1"><Sparkles size={13} aria-hidden="true" /> {tr("Personal insight")}</span>
            <p className="insight-text">{tip.text}</p>
            <Link className="link caption" to="/coach">{tr("Ask your coach →")}</Link>
          </Card>
        </div>

        <Section title={tr("Performance snapshot")} eyebrow={tr("This week")} action={<Link className="link caption" to="/progress">{tr("Full progress")}</Link>}>
          <div className="grid-4">
            <MetricCard label={tr("Workouts")} icon={Dumbbell} value={week.workouts} unit={`/ ${state.settings.weeklyTarget}`} hint={tr("this week")} to="/history" />
            <MetricCard label={tr("Volume")} icon={Flame} value={fmtCompact(toDisplay(week.volume, unit))} unit={unit} delta={volDelta != null ? fmtPct(volDelta) : null} deltaTone={volDelta > 0 ? 'success' : 'danger'} hint={volDelta != null ? tr("vs last week") : tr("this week")} to="/progress?tab=volume" />
            <MetricCard label={tr("Streak")} icon={Flame} value={streak} unit={tr("days")} hint={streak ? tr("on plan") : tr("start today")} to="/progress?tab=consistency" />
            <MetricCard label={tr("PRs")} icon={Trophy} value={monthPrs} hint={tr("this month")} to="/progress?tab=prs" />
          </div>
        </Section>

        {recs.length > 0 && (
          <Section title={tr("Recommended for you")} eyebrow={tr("Based on your last 7 days")}>
            <div className="grid-auto recs">
              {recs.map((r) => r.kind === 'workout' ? (
                <div key={r.id} className="stack-sm"><WorkoutCard workout={r.workout} compact /><p className="caption rec-reason">{r.reason}</p></div>
              ) : (
                <Card key={r.id} as={Link} to={`/courses/${r.course.id}`} className="card-interactive stack-sm"><span className="eyebrow">{tr("Course")}</span><h3>{r.course.title}</h3><p className="caption">{tr("{0} weeks · {1}/week · {2}", r.course.weeks, r.course.perWeek, tr(r.course.level))}</p><p className="caption rec-reason">{r.reason}</p></Card>
              ))}
            </div>
          </Section>
        )}

        <Section title={tr("Jump to")} className="quick-links">
          <div className="grid-4">
            <Card as={Link} to="/goals" className="card-interactive quick"><Target size={20} aria-hidden="true" /><b>{tr("Goals")}</b><span className="caption">{goalCount} {tr("active")}</span></Card>
            <Card as={Link} to="/nutrition" className="card-interactive quick"><Apple size={20} aria-hidden="true" /><b>{tr("Nutrition")}</b><span className="caption">{tr("Today’s fuel")}</span></Card>
            <Card as={Link} to="/recovery" className="card-interactive quick"><BedDouble size={20} aria-hidden="true" /><b>{tr("Recovery")}</b><span className="caption">{tr("Readiness")}</span></Card>
            <Card as={Link} to="/coach" className="card-interactive quick"><Sparkles size={20} aria-hidden="true" /><b>{tr("AI Coach")}</b><span className="caption">{tr("Ask anything")}</span></Card>
          </div>
        </Section>
      </div>

      <aside className="today-side stack" aria-label={tr("Weekly overview")}>
        <Card className="stack enter enter-2">
          <div className="row between"><h3>{tr("Weekly activity")}</h3><span className="num caption">{week.workouts}/{state.settings.weeklyTarget}</span></div>
          <WeekStrip keys={keys} days={week.days} todayKey={todayKey} />
          <ProgressBar value={(week.workouts / state.settings.weeklyTarget) * 100} label={tr("Weekly target")} />
        </Card>
        {upcoming.length > 0 && (
          <Card className="stack-sm enter enter-3">
            <h3>{tr("Upcoming schedule")}</h3>
            <ul>{upcoming.map((u, i) => (
              <li key={u.idx}><Link to={`/workouts/${u.workout.id}`} className="upcoming"><span className={`upcoming-dot ${i === 0 ? 'is-next' : ''}`} aria-hidden="true" /><span className="grow"><b className="truncate upcoming-title">{u.workout.title}</b><span className="caption">{tr("Week")} {u.week} · {u.workout.minutes} {tr("min")}</span></span>{i === 0 && <Badge tone="accent">{tr("Next")}</Badge>}</Link></li>
            ))}</ul>
          </Card>
        )}
        <Card className="stack-sm enter enter-4">
          <div className="row between"><h3>{tr("Recent achievements")}</h3><Link className="link caption" to="/profile">{tr("All")}</Link></div>
          {unlocked.length ? <div className="grid-3 ach-mini">{unlocked.map((a) => <AchievementCard key={a.id} a={a} />)}</div> : <EmptyState compact icon={Trophy} title={tr("No achievements yet")} body={tr("Complete a workout to earn your first badge.")} />}
        </Card>
        {t.workouts === 0 && <EmptyState icon={Dumbbell} title={tr("No workouts yet")} body={tr("Your history will appear here after your first session.")} action={<Button variant="primary" to="/workouts">{tr("Browse workouts")}</Button>} />}
      </aside>

      <Sheet open={chooser} onClose={() => setChooser(false)} title={tr("Choose your workout")} size="lg">
        <div className="stack">
          <p className="muted">{tr("This week’s plan. Pick any session to train today — the rest of the plan stays in order.")}</p>
          <ul className="stack-sm">
            {(plan || []).map((d) => (
              <li key={d.index}>
                <button type="button" className={cx('plan-row', d.done && 'is-done', session?.index === d.index && 'is-selected')} disabled={d.done} onClick={() => pickDay(d)}>
                  <span className="plan-day"><b>{DAY_LONG[d.dayIdx]}</b><small>{d.isToday ? tr("Today") : d.past ? tr("Earlier") : tr("Planned")}</small></span>
                  <span className="grow"><b className="truncate plan-title">{d.workout.title}</b><span className="caption">{tr("{0} min · {1} exercises", d.workout.minutes, d.workout.exercises.length)}</span></span>
                  {d.done ? <Badge tone="success">{tr("Done")}</Badge> : session?.index === d.index ? <Badge tone="accent">{tr("Selected")}</Badge> : <span className="link caption">{tr("Choose")}</span>}
                </button>
              </li>
            ))}
          </ul>
          {session?.picked && <Button variant="ghost" onClick={() => { actions.pickToday(null); setChooser(false) }}>{tr("Back to plan order")}</Button>}
        </div>
      </Sheet>
    </div>
  )
}
