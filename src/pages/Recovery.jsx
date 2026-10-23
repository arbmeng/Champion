import { Footprints, Heart, Moon, Watch } from 'lucide-react'
import { useApp } from '../state/store'
import { muscleRecovery, recoveryState, weekStats } from '../state/selectors'
import { devices } from '../data/social'
import { MUSCLES } from '../data/exercises'
import { workoutMap } from '../data/workouts'
import { Badge, Card, PageHeader, ProgressRing, Section, SectionTabs, Toggle } from '../ui/primitives'
import { ChartCard, MetricCard, WeekStrip, WorkoutCard } from '../ui/domain'
import { BarsChart } from '../ui/charts'
import { profileTabs } from '../ui/sections'
import { dateKey, shortDate, weekKeys } from '../lib/dates'
import { fmtNum } from '../lib/format'
import { tr } from '../lib/i18n'

export function Recovery() {
  const { state, actions } = useApp()
  const r = recoveryState(state)
  const week = weekStats(state, 0)
  const sleep = state.health.sleep
  const last = sleep[sleep.length - 1]
  const steps = state.health.steps
  const tone = r.score >= 75 ? 'success' : r.score >= 55 ? 'warning' : 'danger'
  const mob = workoutMap[r.score < 65 ? 'recovery-reset' : 'mobility-flow']
  const connected = devices.filter((d) => state.devices[d.id])
  return (
    <div className="stack-lg">
      <PageHeader eyebrow={tr("Readiness")} title={tr("Recovery")} subtitle={tr("Training guidance based on sleep, load and rest — not medical advice.")} />
      <SectionTabs items={profileTabs} />
      <div className="grid-2 wide-left">
        <Card className="stack">
          <div className="row gap-6 wrap">
            <ProgressRing value={r.score} size={140} stroke={12} tone={tone === 'success' ? 'success' : 'accent'} label={tr("Recovery score {0} out of 100", r.score)}><div><div className="num num-xl">{r.score}</div><div className="caption">{tr(r.label)}</div></div></ProgressRing>
            <div className="grow stack-sm"><span className="eyebrow">{tr("Recovery recommendation")}</span><p className="rec-text">{r.advice}</p><div className="row gap-2 wrap"><Badge tone={tone}>{tr('Readiness: {0}', tr(r.label))}</Badge><Badge>{r.since === 0 ? tr('Trained today') : tr('{0}d since last session', r.since)}</Badge></div></div>
          </div>
        </Card>
        <Card className="stack-sm">
          <h3>{tr("Rest days this week")}</h3>
          <WeekStrip keys={weekKeys()} days={week.days} todayKey={dateKey()} />
          <p className="caption">{tr('{0} days without a logged session. Planned rest is part of progress.', 7 - week.workouts)}</p>
        </Card>
      </div>

      <div className="grid-4">
        <MetricCard icon={Moon} label={tr("Sleep (last night)")} value={last ? last.hours : '—'} unit="h" hint={connected.length ? tr("quality {0}%", last?.quality) : tr("connect a device")} />
        <MetricCard icon={Heart} label={tr("Resting HR")} value={state.health.restingHr} unit={tr("bpm")} hint={tr("7-day avg")} />
        <MetricCard icon={Footprints} label={tr("Steps today")} value={fmtNum(steps[steps.length - 1]?.steps || 0)} hint={tr("{0} active kcal", fmtNum(steps[steps.length - 1]?.active || 0))} />
        <MetricCard icon={Watch} label={tr("HRV")} value={last?.hrv ?? '—'} unit={tr("ms")} hint={tr("overnight")} />
      </div>

      <div className="grid-2">
        <ChartCard title={tr("Sleep")} question={tr("Am I sleeping enough to train hard?")} foot={tr("Mock data from a connected device. Typical adult guidance is 7–9 hours.")}><BarsChart data={sleep.map((s) => ({ label: shortDate(s.date), hours: s.hours }))} y="hours" unit="h" height={190} /></ChartCard>
        <Card className="stack-sm"><h3>{tr("Muscle readiness")}</h3><p className="caption">{tr("Based on days since each group was last trained.")}</p>
          <ul className="stack-sm">{MUSCLES.map((m) => { const x = muscleRecovery(state, m); return <li key={m} className="row between"><span>{tr(m)}</span><span className="row gap-2"><span className="caption">{x.days == null ? tr("never") : tr("{0}d ago", x.days)}</span><Badge tone={x.tone}>{tr(x.label)}</Badge></span></li> })}</ul>
        </Card>
      </div>

      <Section title={tr("Mobility")} eyebrow={tr("Recommended for you")}><div className="grid-auto"><WorkoutCard workout={mob} /></div></Section>

      <Section title={tr("Connected devices")} eyebrow={tr("Mock integrations")}>
        <Card className="stack-sm">
          {devices.map((d) => <Toggle key={d.id} label={d.name} description={`${d.description} (${d.metrics.join(', ')})`} checked={Boolean(state.devices[d.id])} onChange={() => actions.toggleDevice(d.id)} />)}
          <p className="caption">{tr("This prototype ships with realistic sample data. No real Apple Health, Health Connect or watch connection is made.")}</p>
        </Card>
      </Section>
    </div>
  )
}
