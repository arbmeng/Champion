import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Award, Check, Clock, Dumbbell, Flame, Share2, Trophy } from 'lucide-react'
import { useApp } from '../state/store'
import { achievementList, courseProgress, weekStats } from '../state/selectors'
import { Badge, Button, Card, EmptyState, ProgressBar } from '../ui/primitives'
import { WeekStrip } from '../ui/domain'
import { useToast } from '../ui/overlays'
import { dateKey, weekKeys } from '../lib/dates'
import { fmtNum, toDisplay } from '../lib/format'
import { tr } from '../lib/i18n'

function CountUp({ to, duration = 900 }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setV(to); return undefined }
    let raf
    const t0 = performance.now()
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration)
      setV(Math.round(to * (1 - (1 - p) ** 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, duration])
  return <>{fmtNum(v)}</>
}

export function Complete() {
  const { logId } = useParams()
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const toast = useToast()
  const log = state.history.find((l) => l.id === logId)
  if (!log) return <div className="complete"><EmptyState icon={Check} title={tr("Summary unavailable")} body={tr("This workout summary is no longer available.")} action={<Button variant="primary" to="/today">{tr("Back to Today")}</Button>} /></div>
  const unit = state.settings.unit
  const week = weekStats(state, 0)
  const prog = log.courseId ? courseProgress(state, log.courseId) : null
  const newAch = achievementList(state).filter((a) => log.newAchievements?.includes(a.id))
  const shared = state.social.posts.some((p) => p.logId === log.id)
  return (
    <div className="complete">
      <div className="complete-inner">
        <div className="complete-hero enter">
          <span className="complete-check" aria-hidden="true"><svg viewBox="0 0 52 52" width="56" height="56"><circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="3" className="cc-ring" /><path d="M15 27l8 8 14-16" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="cc-tick" /></svg></span>
          <div className="eyebrow">{tr("Workout complete")}</div>
          <h1 className="complete-title">{log.title}</h1>
        </div>

        <div className="complete-stats enter enter-1">
          <div><span className="eyebrow"><Clock size={12} aria-hidden="true" /> {tr("Duration")}</span><b className="num num-xl"><CountUp to={Math.round(log.duration / 60)} /><span className="unit">{tr("min")}</span></b></div>
          <div><span className="eyebrow"><Flame size={12} aria-hidden="true" /> {tr("Volume")}</span><b className="num num-xl"><CountUp to={Math.round(toDisplay(log.volume, unit))} /><span className="unit">{unit}</span></b></div>
          <div><span className="eyebrow"><Dumbbell size={12} aria-hidden="true" /> {tr("Exercises")}</span><b className="num num-xl"><CountUp to={log.exercises} /></b></div>
          <div><span className="eyebrow">{tr("Sets")}</span><b className="num num-xl"><CountUp to={log.sets} /></b></div>
          <div><span className="eyebrow">{tr("Calories")}</span><b className="num num-xl"><CountUp to={log.calories} /><span className="unit">{tr("kcal")}</span></b></div>
          <div><span className="eyebrow"><Trophy size={12} aria-hidden="true" /> {tr("PRs")}</span><b className="num num-xl"><CountUp to={log.prs.length} /></b></div>
        </div>

        {log.prs.length > 0 && (
          <Card tone="accent" className="stack-sm enter enter-2">
            <h3 className="row gap-2"><Trophy size={18} className="accent" aria-hidden="true" /> {tr("New personal records")}</h3>
            <ul className="stack-sm">{log.prs.map((p) => <li key={p.exerciseId} className="row between"><Link to={`/exercises/${p.exerciseId}`} className="link">{p.name}</Link><b className="num">{toDisplay(p.weight, unit)} {unit} × {p.reps}</b></li>)}</ul>
          </Card>
        )}

        {newAch.length > 0 && (
          <Card className="stack-sm enter enter-2">
            <h3 className="row gap-2"><Award size={18} className="accent" aria-hidden="true" /> {tr("Achievement unlocked")}</h3>
            <div className="row gap-2 wrap">{newAch.map((a) => <Badge key={a.id} tone="accent">{a.title}</Badge>)}</div>
          </Card>
        )}

        <div className="grid-2 enter enter-3">
          {prog && (
            <Card className="stack-sm">
              <span className="eyebrow">{tr("Course progress")}</span>
              <h3>{prog.course.title}</h3>
              <ProgressBar value={prog.pct} label={tr("Course progress")} height={10} />
              <span className="caption">{tr("Session {0} of {1} · Week {2}", prog.completed, prog.total, prog.week)}</span>
            </Card>
          )}
          <Card className="stack-sm">
            <div className="row between"><span className="eyebrow">{tr("Weekly progress")}</span><b className="num">{week.workouts} / {state.settings.weeklyTarget}</b></div>
            <WeekStrip keys={weekKeys()} days={week.days} todayKey={dateKey()} />
          </Card>
        </div>

        <div className="complete-actions enter enter-4">
          <Button variant="primary" size="xl" block onClick={() => navigate('/today', { replace: true })}>{tr("Done")}</Button>
          <div className="row gap-2">
            <Button block to={`/history/${log.id}`}>{tr("View details")}</Button>
            <Button block icon={Share2} disabled={shared} onClick={() => { actions.share(log.id, ''); toast({ title: tr("Shared to your feed"), tone: 'success' }) }}>{shared ? tr("Shared") : tr("Share")}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
