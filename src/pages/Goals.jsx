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
    toast({ title: 'Goal added', body: 'It now tracks automatically from your training.', tone: 'success' })
    setOpen(false); setErr(''); setF({ ...f, target: '' })
  }

  return (
    <div className="stack-lg">
      <PageHeader eyebrow="Targets" title="Goals" subtitle="Goals read directly from your logged training — nothing to update by hand." actions={<Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>New goal</Button>} />
      <SectionTabs items={progressTabs} />
      <Tabs items={GROUPS.map((g) => ({ id: g, label: g }))} value={group} onChange={setGroup} label="Goal types" />
      {state.goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" body="Set a strength target, a weekly habit or a course milestone and watch it fill in as you train." action={<Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>Create your first goal</Button>} />
      ) : (
        <>
          <Section title="In progress" eyebrow={`${active.length} active`}>
            {active.length ? <div className="grid-auto">{active.map(({ g, p }) => <GoalCard key={g.id} g={p} onRemove={() => { actions.removeGoal(g.id); toast({ title: 'Goal removed' }) }} />)}</div> : <EmptyState compact icon={Target} title="Nothing in this category" body="Add a goal to start tracking it." />}
          </Section>
          {done.length > 0 && <Section title="Achieved"><div className="grid-auto">{done.map(({ g, p }) => <GoalCard key={g.id} g={p} onRemove={() => actions.removeGoal(g.id)} />)}</div></Section>}
        </>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title="New goal">
        <form className="stack" onSubmit={save}>
          <Select label="Goal type" value={type} onChange={(v) => { setType(v); setErr('') }} options={[{ value: 'strength', label: 'Strength — lift a target weight' }, { value: 'weekly', label: 'Consistency — workouts per week' }, { value: 'course', label: 'Course — finish a program' }, { value: 'body', label: 'Body — reach a measurement' }, { value: 'habit', label: 'Habit — mobility sessions per week' }]} />
          {type === 'strength' && <Select label="Exercise" value={f.exerciseId} onChange={(v) => setF({ ...f, exerciseId: v })} options={liftable.map((e) => ({ value: e.id, label: e.name }))} />}
          {type === 'course' && <Select label="Course" value={f.courseId} onChange={(v) => setF({ ...f, courseId: v })} options={courses.map((c) => ({ value: c.id, label: c.title }))} />}
          {type === 'body' && <Select label="Measurement" value={f.metric} onChange={(v) => setF({ ...f, metric: v })} options={[{ value: 'weight', label: 'Body weight (kg)' }, { value: 'bodyFat', label: 'Body fat (%)' }]} />}
          {type !== 'course' && <Input label={type === 'strength' ? 'Target weight (kg)' : type === 'body' ? 'Target value' : 'Target per week'} inputMode="decimal" value={f.target} onChange={(e) => { setF({ ...f, target: e.target.value }); setErr('') }} error={err} data-autofocus />}
          <Button type="submit" variant="primary" size="lg" block>Add goal</Button>
        </form>
      </Sheet>
    </div>
  )
}
