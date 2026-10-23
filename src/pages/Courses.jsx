import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Award, Calendar, Check, Dumbbell, Lock, Play, Star, Users } from 'lucide-react'
import { useApp } from '../state/store'
import { courseProgress, findWorkout } from '../state/selectors'
import { courses, courseMap, isDeloadWeek, sessionWorkoutId } from '../data/courses'
import { Badge, BackLink, Button, Card, EmptyState, FilterChips, PageHeader, ProgressBar, ProgressRing, Section, SectionTabs } from '../ui/primitives'
import { Cover } from '../ui/art'
import { CourseCard, ExerciseRow } from '../ui/domain'
import { workoutsTabs } from '../ui/sections'
import { useToast, ConfirmSheet } from '../ui/overlays'
import { useStartWorkout } from '../lib/useStart'
import { shortDate } from '../lib/dates'
import { exerciseMap } from '../data/exercises'
import { fmtVolume } from '../lib/format'

export function Courses() {
  const { state } = useApp()
  const [level, setLevel] = useState(null)
  const mine = courses.filter((c) => state.enrolled.includes(c.id))
  const featured = courses.find((c) => !state.enrolled.includes(c.id) && c.goal === state.user.goal) || courses[0]
  const explore = useMemo(() => courses.filter((c) => (!level || c.level === level)), [level])
  return (
    <div className="stack-lg">
      <PageHeader eyebrow="Programs" title="Courses" subtitle="Multi-week programs that tell you exactly what to train next." />
      <SectionTabs items={workoutsTabs} />
      <Section title="My courses">
        {mine.length ? (
          <div className="grid-auto">{mine.map((c) => <CourseCard key={c.id} course={c} progress={courseProgress(state, c.id)} />)}</div>
        ) : (
          <EmptyState icon={Calendar} title="No course enrolled" body="Pick a program and Champion schedules every session for you." action={<Button variant="primary" to={`/courses/${featured.id}`}>View {featured.title}</Button>} />
        )}
      </Section>
      {!state.enrolled.includes(featured.id) && (
        <Section title="Featured" eyebrow="Picked for your goal">
          <FeaturedCourse course={featured} />
        </Section>
      )}
      <Section title="Explore" action={null}>
        <div className="stack">
          <FilterChips label="Difficulty" options={['Beginner', 'Intermediate', 'Advanced']} value={level} onChange={setLevel} />
          <div className="grid-auto">{explore.map((c) => <CourseCard key={c.id} course={c} progress={courseProgress(state, c.id)} />)}</div>
        </div>
      </Section>
    </div>
  )
}

function FeaturedCourse({ course }) {
  return (
    <Link to={`/courses/${course.id}`} className="card card-interactive feat">
      <Cover hue={course.hue} variant={1} className="feat-cover">
        <div className="feat-inner">
          <Badge tone="glass">{course.level}</Badge>
          <div><h2 className="feat-title">{course.title}</h2><p className="feat-sub">{course.tagline}</p></div>
          <div className="row gap-4 wrap feat-facts"><span>{course.weeks} weeks</span><span>{course.perWeek} sessions / week</span><span className="row gap-1"><Star size={13} fill="currentColor" aria-hidden="true" /> {course.rating} ({course.ratings.toLocaleString()})</span></div>
        </div>
      </Cover>
    </Link>
  )
}

export function CourseDetail() {
  const { id } = useParams()
  const course = courseMap[id]
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const toast = useToast()
  const start = useStartWorkout()
  const [leave, setLeave] = useState(false)
  const p = course ? courseProgress(state, id) : null
  const [pickedWeek, setPickedWeek] = useState(null)
  if (!course) return <EmptyState icon={Calendar} title="Course not found" body="This course doesn’t exist." action={<Button to="/courses">Back to courses</Button>} />
  const week = pickedWeek ?? p.week
  const sessions = Array.from({ length: course.perWeek }, (_, i) => { const index = (week - 1) * course.perWeek + i; return { index, workout: findWorkout(state, sessionWorkoutId(course, index)), log: p.done.get(index) } })
  const enrolled = p.enrolled
  const doneInWeek = (w) => Array.from({ length: course.perWeek }, (_, i) => p.done.has((w - 1) * course.perWeek + i)).filter(Boolean).length
  const nextSession = p.next != null ? { index: p.next, workout: findWorkout(state, sessionWorkoutId(course, p.next)) } : null
  const doEnroll = () => { actions.enroll(id); toast({ title: `Enrolled in ${course.title}`, body: 'Your first session is ready on Today.', tone: 'success' }) }

  return (
    <div className="stack-lg">
      <div>
        <BackLink to="/courses">Courses</BackLink>
        <Cover hue={course.hue} variant={1} className="course-hero">
          <div className="course-hero-inner">
            <div className="row gap-2 wrap"><Badge tone="glass">{course.level}</Badge><Badge tone="glass">{course.weeks} weeks</Badge><Badge tone="glass">{course.perWeek}×/week</Badge>{enrolled && <Badge tone="accent">Enrolled</Badge>}</div>
            <div className="stack-sm"><h1 className="course-title">{course.title}</h1><p className="course-desc">{course.description}</p></div>
            <div className="row gap-4 wrap course-meta"><span><Users size={14} aria-hidden="true" /> {course.trainer.name}</span><span><Dumbbell size={14} aria-hidden="true" /> {course.equipment.join(', ')}</span><span className="row gap-1"><Star size={14} fill="currentColor" aria-hidden="true" /> {course.rating} · {course.ratings.toLocaleString()} ratings</span></div>
            <div className="row gap-2 wrap">
              {!enrolled && <Button variant="primary" size="xl" onClick={doEnroll}>Enroll in course</Button>}
              {enrolled && nextSession && <Button variant="primary" size="xl" icon={Play} onClick={() => start(nextSession.workout, { courseId: id, sessionIndex: nextSession.index })}>Continue course</Button>}
              {enrolled && p.finished && <Badge tone="success" icon={Award}>Course complete</Badge>}
            </div>
          </div>
        </Cover>
      </div>

      {enrolled && (
        <div className="grid-3 course-stats">
          <Card className="row gap-4"><ProgressRing value={p.pct} size={84} stroke={9} label={`${Math.round(p.pct)} percent complete`}><b className="num num-md">{Math.round(p.pct)}%</b></ProgressRing><div><div className="eyebrow">Progress</div><div className="num num-lg">{p.completed}<span className="unit">/ {p.total}</span></div><span className="caption">sessions completed</span></div></Card>
          <Card className="stack-sm"><div className="eyebrow">Current week</div><div className="num num-lg">{p.week}<span className="unit">of {course.weeks}</span></div><ProgressBar value={(doneInWeek(p.week) / course.perWeek) * 100} label="Week progress" /><span className="caption">{doneInWeek(p.week)} of {course.perWeek} sessions this week</span></Card>
          <Card className="stack-sm"><div className="eyebrow">Up next</div>{nextSession ? <><h3>{nextSession.workout.title}</h3><span className="caption">{nextSession.workout.minutes} min · {nextSession.workout.exercises.length} exercises</span></> : <h3>All sessions complete</h3>}</Card>
        </div>
      )}

      {p.finished && enrolled && (
        <Card tone="accent" className="row gap-4 completion"><Award size={32} className="accent" aria-hidden="true" /><div><h3>Course complete</h3><p className="muted">You finished all {p.total} sessions of {course.title}. Review your progress, then choose your next program.</p></div><Button to="/progress" variant="primary" className="completion-cta">View progress</Button></Card>
      )}

      <Section title="Weekly schedule" eyebrow={`Week ${week}${isDeloadWeek(course, week) ? ' · Deload' : ''}`}>
        <div className="week-picker" role="group" aria-label="Choose week">
          {Array.from({ length: course.weeks }, (_, i) => i + 1).map((w) => {
            const d = doneInWeek(w)
            const full = d === course.perWeek
            return <button key={w} type="button" className={`wk ${w === week ? 'is-active' : ''} ${full ? 'is-done' : ''} ${enrolled && w === p.week ? 'is-current' : ''}`} aria-pressed={w === week} aria-label={`Week ${w}${full ? ', complete' : ''}${enrolled && w === p.week ? ', current' : ''}`} onClick={() => setPickedWeek(w)}>{full ? <Check size={14} strokeWidth={3} /> : w}</button>
          })}
        </div>
        <ul className="session-list">
          {sessions.map((s) => {
            const done = Boolean(s.log)
            const current = enrolled && s.index === p.next
            return (
              <li key={s.index} className={`session ${done ? 'is-done' : ''} ${current ? 'is-current' : ''} ${!done && !current ? 'is-future' : ''}`}>
                <span className="session-state" aria-hidden="true">{done ? <Check size={18} strokeWidth={3} /> : current ? <Play size={14} fill="currentColor" /> : <Lock size={14} />}</span>
                <div className="grow">
                  <div className="eyebrow">Session {s.index % course.perWeek + 1}{current ? ' · Next up' : ''}</div>
                  <Link to={done ? `/history/${s.log.id}` : `/workouts/${s.workout.id}`} className="session-title">{s.workout.title}</Link>
                  <div className="caption">{done ? `Completed ${shortDate(s.log.date)} · ${fmtVolume(s.log.volume, state.settings.unit)}` : `${s.workout.minutes} min · ${s.workout.exercises.length} exercises`}</div>
                </div>
                {done ? <Badge tone="success" icon={Check}>Done</Badge> : enrolled ? (
                  <Button variant={current ? 'primary' : 'ghost'} size={current ? 'lg' : 'sm'} icon={current ? Play : undefined} onClick={() => start(s.workout, { courseId: id, sessionIndex: s.index })}>{current ? 'Start session' : 'Start early'}</Button>
                ) : <Button variant="ghost" size="sm" to={`/workouts/${s.workout.id}`}>Preview</Button>}
              </li>
            )
          })}
        </ul>
      </Section>

      <div className="grid-2">
        <Card className="stack"><h3>Your coach</h3><div className="row gap-4"><div className="coach-avatar" aria-hidden="true">{course.trainer.name.split(' ').map((x) => x[0]).join('')}</div><div><b>{course.trainer.name}</b><p className="caption">{course.trainer.role}</p></div></div><p className="muted">{course.trainer.bio}</p></Card>
        <Card className="stack"><h3>What you’ll get</h3><ul className="stack-sm check-list">{course.outcomes.map((o) => <li key={o}><Check size={16} className="accent" aria-hidden="true" /> {o}</li>)}</ul><div className="row gap-2 wrap">{course.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div></Card>
      </div>

      <Section title="Session preview" eyebrow={sessions[0].workout.title}>
        <Card className="stack-sm">{sessions[0].workout.exercises.map((it, i) => <ExerciseRow key={it.exerciseId} index={i + 1} exercise={exerciseMap[it.exerciseId]} detail={`${it.sets} × ${it.reps[0]}${it.reps[1] !== it.reps[0] ? `–${it.reps[1]}` : ''}`} to={`/exercises/${it.exerciseId}`} />)}</Card>
      </Section>

      {enrolled && !p.finished && <div className="row center"><Button variant="ghost" onClick={() => setLeave(true)}>Leave course</Button></div>}
      <ConfirmSheet open={leave} onClose={() => setLeave(false)} tone="danger" title="Leave this course?" body="Your logged workouts stay in your history. You can enroll again at any time and pick up where you left off." confirmLabel="Leave course" onConfirm={() => { actions.leaveCourse(id); toast({ title: 'You left the course' }); navigate('/courses') }} />
    </div>
  )
}
