import { useState } from 'react'
import { Plus, Target } from 'lucide-react'
import { useApp } from '../state/store'
import { goalProgress } from '../state/selectors'
import { courses } from '../data/courses'
import { exercises } from '../data/exercises'
import { Button, EmptyState, Input, PageHeader, Section, SectionTabs, Select, Tabs } from '../ui/primitives'
import { GoalCard } from '../ui/domain'
import { Sheet, useToast } from '../ui/overlays'
import { progressTabs } from '../ui/sections'
import { tr } from '../lib/i18n'

const GROUPS = ['All', 'Strength', 'Body', 'Consistency', 'Course', 'Habit']
const liftable = exercises.filter((e) => e.weighted && e.repLabel === 'reps')

export function Goals() {
  const { state, actions } = useApp()
  const toast = useToast()
  const [group, setGroup] = useState('All')
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('strength')
  const [f, setF] = useState({ exerciseId: 'bench', target: '', courseId: courses[0].id, metric: 'weight' })
  const [err, setErr] = useState('')
  const goals = state.goals.map((g) => ({ g, p: goalProgress(state, g) })).filter(({ p }) => group === 'All' || p.group === group)
  const done = goals.filter(({ p }) => p.pct >= 100)
  const active = goals.filter(({ p }) => p.pct < 100)

  const save = (e) => {
    e.preventDefault()
    const target = parseFloat(f.target)
    if (type !== 'course' && !(target > 0)) { setErr('Enter a target above zero.'); return }
    const goal = type === 'strength' ? { type, exerciseId: f.exerciseId, target } : type === 'course' ? { type, courseId: f.courseId } : type === 'body' ? { type, metric: f.metric, target } : { type, target }
    actions.addGoal(goal)
    toast({ title: tr("Goal added"), body: tr("It now tracks automatically from your training."), tone: 'success' })
    setOpen(false); setErr(''); setF({ ...f, target: '' })
  }

  return (
    <div className="stack-lg">
      <PageHeader eyebrow={tr("Targets")} title={tr("Goals")} subtitle={tr("Goals read directly from your logged training — nothing to update by hand.")} actions={<Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>{tr("New goal")}</Button>} />
      <SectionTabs items={progressTabs} />
      <Tabs items={GROUPS.map((g) => ({ id: g, label: tr(g) }))} value={group} onChange={setGroup} label={tr("Goal types")} />
      {state.goals.length === 0 ? (
        <EmptyState icon={Target} title={tr("No goals yet")} body={tr("Set a strength target, a weekly habit or a course milestone and watch it fill in as you train.")} action={<Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>{tr("Create your first goal")}</Button>} />
      ) : (
        <>
          <Section title={tr("In progress")} eyebrow={tr("{0} active", active.length)}>
            {active.length ? <div className="grid-auto">{active.map(({ g, p }) => <GoalCard key={g.id} g={p} onRemove={() => { actions.removeGoal(g.id); toast({ title: tr("Goal removed") }) }} />)}</div> : <EmptyState compact icon={Target} title={tr("Nothing in this category")} body={tr("Add a goal to start tracking it.")} />}
          </Section>
          {done.length > 0 && <Section title={tr("Achieved")}><div className="grid-auto">{done.map(({ g, p }) => <GoalCard key={g.id} g={p} onRemove={() => actions.removeGoal(g.id)} />)}</div></Section>}
        </>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title={tr("New goal")}>
        <form className="stack" onSubmit={save}>
          <Select label={tr("Goal type")} value={type} onChange={(v) => { setType(v); setErr('') }} options={[{ value: 'strength', label: tr("Strength — lift a target weight") }, { value: 'weekly', label: tr("Consistency — workouts per week") }, { value: 'course', label: tr("Course — finish a program") }, { value: 'body', label: tr("Body — reach a measurement") }, { value: 'habit', label: tr("Habit — mobility sessions per week") }]} />
          {type === 'strength' && <Select label={tr("Exercise")} value={f.exerciseId} onChange={(v) => setF({ ...f, exerciseId: v })} options={liftable.map((e) => ({ value: e.id, label: e.name }))} />}
          {type === 'course' && <Select label={tr("Course")} value={f.courseId} onChange={(v) => setF({ ...f, courseId: v })} options={courses.map((c) => ({ value: c.id, label: c.title }))} />}
          {type === 'body' && <Select label={tr("Measurement")} value={f.metric} onChange={(v) => setF({ ...f, metric: v })} options={[{ value: 'weight', label: tr("Body weight (kg)") }, { value: 'bodyFat', label: tr("Body fat (%)") }]} />}
          {type !== 'course' && <Input label={type === 'strength' ? tr("Target weight (kg)") : type === 'body' ? tr("Target value") : tr("Target per week")} inputMode="decimal" value={f.target} onChange={(e) => { setF({ ...f, target: e.target.value }); setErr('') }} error={err} data-autofocus />}
          <Button type="submit" variant="primary" size="lg" block>{tr("Add goal")}</Button>
        </form>
      </Sheet>
    </div>
  )
}
