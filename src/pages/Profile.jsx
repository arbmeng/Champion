import { Link } from 'react-router-dom'
import { Bluetooth, CreditCard, Flame, Heart, Settings as Cog, Trophy } from 'lucide-react'
import { useApp } from '../state/store'
import { achievementList, bodyLatest, courseProgress, exerciseStats, findExercise, findWorkout, streakDays, totals } from '../state/selectors'
import { devices } from '../data/social'
import { Avatar, Badge, Button, Card, EmptyState, PageHeader, Section, SectionTabs } from '../ui/primitives'
import { AchievementCard, ExerciseRow, MetricCard, WorkoutCard } from '../ui/domain'
import { profileTabs } from '../ui/sections'
import { shortDate } from '../lib/dates'
import { fmtCompact, toDisplay } from '../lib/format'
import { tr } from '../lib/i18n'

export function Profile() {
  const { state } = useApp()
  const unit = state.settings.unit
  const t = totals(state)
  const ach = achievementList(state)
  const prog = state.activeCourse ? courseProgress(state, state.activeCourse) : null
  const favEx = state.favorites.exercises.map((id) => findExercise(state, id)).filter(Boolean)
  const favW = state.favorites.workouts.map((id) => findWorkout(state, id)).filter(Boolean)
  const prs = ['bench', 'squat', 'rdl', 'pullup'].map((id) => exerciseStats(state, id)).filter((s) => s.best)
  const unlocked = ach.filter((a) => a.unlocked).length
  return (
    <div className="stack-lg">
      <PageHeader eyebrow={tr("You")} title={tr("Profile")} actions={<Button icon={Cog} to="/settings">{tr("Settings")}</Button>} />
      <SectionTabs items={profileTabs} />
      <Card className="profile-hero row gap-4 wrap">
        <Avatar name={state.user.name} size={76} hue={18} />
        <div className="grow stack-sm">
          <h2>{state.user.name}</h2>
          <div className="row gap-2 wrap"><Badge tone="accent">{tr(state.user.level)}</Badge><Badge>{tr(state.user.goal)}</Badge><Badge>{state.user.frequency} {tr("days / week")}</Badge><Badge>{tr(state.user.preferred)}</Badge></div>
          <span className="caption">{tr('Training since {0}', shortDate(state.user.since))}{prog ? ` · ${tr('{0}, week {1}', prog.course.title, prog.week)}` : ''}</span>
        </div>
      </Card>

      <div className="grid-4">
        <MetricCard icon={Flame} label={tr("Streak")} value={streakDays(state)} unit={tr("days")} />
        <MetricCard label={tr("Workouts")} value={t.workouts} />
        <MetricCard icon={Trophy} label={tr("PRs")} value={t.prs} />
        <MetricCard label={tr("Volume")} value={fmtCompact(toDisplay(t.volume, unit))} unit={unit} />
      </div>

      <Section title={tr("Achievements")} eyebrow={tr("{0} of {1} unlocked", unlocked, ach.length)}>
        <div className="grid-auto ach-grid">{ach.map((a) => <AchievementCard key={a.id} a={a} />)}</div>
      </Section>

      <div className="grid-2">
        <Card className="stack-sm"><h3>{tr("Personal records")}</h3>{prs.length ? prs.map((s) => <div key={s.ex.id} className="row between"><Link className="link" to={`/exercises/${s.ex.id}`}>{s.ex.name}</Link><b className="num">{toDisplay(s.best.weight, unit)} {unit} × {s.best.reps}</b></div>) : <p className="muted">{tr("No PRs yet.")}</p>}<Link className="link caption" to="/progress?tab=prs">{tr("All PRs →")}</Link></Card>
        <Card className="stack-sm"><h3>{tr("Body stats")}</h3>{state.body.length ? (<><div className="row between"><span className="muted">{tr("Weight")}</span><b className="num">{bodyLatest(state, 'weight')} {tr("kg")}</b></div><div className="row between"><span className="muted">{tr("Body fat")}</span><b className="num">{bodyLatest(state, 'bodyFat')}%</b></div><div className="row between"><span className="muted">{tr("Waist")}</span><b className="num">{bodyLatest(state, 'waist')} {tr("cm")}</b></div></>) : <p className="muted">{tr("No measurements yet.")}</p>}<Link className="link caption" to="/progress?tab=body">{tr("Body progress →")}</Link></Card>
      </div>

      <Section title={tr("Favorite exercises")}>
        {favEx.length ? <Card className="stack-sm">{favEx.map((e) => <ExerciseRow key={e.id} exercise={e} to={`/exercises/${e.id}`} right={<Heart size={15} className="accent" fill="currentColor" aria-hidden="true" />} />)}</Card> : <EmptyState compact icon={Heart} title={tr("No favorite exercises")} body={tr("Tap the heart on an exercise to pin it here.")} action={<Button to="/exercises">{tr("Browse exercises")}</Button>} />}
      </Section>
      <Section title={tr("Favorite workouts")}>
        {favW.length ? <div className="grid-auto">{favW.map((w) => <WorkoutCard key={w.id} workout={w} compact />)}</div> : <EmptyState compact icon={Heart} title={tr("No saved workouts")} body={tr("Save a workout to find it here.")} action={<Button to="/workouts">{tr("Browse workouts")}</Button>} />}
      </Section>

      <div className="grid-2">
        <Card className="stack-sm"><h3 className="row gap-2"><Bluetooth size={17} aria-hidden="true" /> {tr("Connected devices")}</h3>{devices.map((d) => <div key={d.id} className="row between"><span>{d.name}</span><Badge tone={state.devices[d.id] ? 'success' : 'neutral'}>{state.devices[d.id] ? tr("Connected (mock)") : tr("Not connected")}</Badge></div>)}<Link className="link caption" to="/recovery">{tr("Manage →")}</Link></Card>
        <Card className="stack-sm"><h3 className="row gap-2"><CreditCard size={17} aria-hidden="true" /> {tr("Subscription")}</h3><div className="row between"><span>{tr("Champion Pro")}</span><Badge tone="accent">{tr("Demo plan")}</Badge></div><p className="caption">{tr("Billing is not connected in this prototype. Nothing is charged.")}</p></Card>
      </div>
    </div>
  )
}
