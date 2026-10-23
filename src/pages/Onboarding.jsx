import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { useApp } from '../state/store'
import { courses } from '../data/courses'
import { Button, Input, ProgressBar, cx } from '../ui/primitives'
import { CourseCard } from '../ui/domain'
import { courseProgress } from '../state/selectors'

const STEPS = ['goal', 'level', 'freq', 'equip', 'pref', 'target', 'plan']
const EQUIP = ['Full gym', 'Home', 'Dumbbells', 'Bodyweight', 'Mixed']

function recommend(a) {
  const home = ['Home', 'Dumbbells', 'Bodyweight'].includes(a.equipment)
  if (home) return courses.find((c) => c.id === 'home-dumbbell')
  if (a.level === 'Beginner' || a.frequency <= 3) return courses.find((c) => c.id === 'foundations')
  if (a.level === 'Advanced' && a.frequency >= 5) return courses.find((c) => c.id === 'ppl')
  return courses.find((c) => c.id === 'strength-hypertrophy')
}

function Choice({ options, value, onChange, cols = 2, label }) {
  return <div className="choices" role="radiogroup" aria-label={label} style={{ '--cols': cols }}>{options.map((o) => <button key={o} type="button" role="radio" aria-checked={value === o} className={cx('choice', value === o && 'is-active')} onClick={() => onChange(o)}>{o}{value === o && <Check size={16} aria-hidden="true" />}</button>)}</div>
}

export function Onboarding() {
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const [i, setI] = useState(0)
  const [a, setA] = useState({ goal: state.user.goal || 'Build muscle', level: state.user.level || 'Intermediate', frequency: state.user.frequency || 4, equipment: state.user.equipment || 'Full gym', preferred: state.user.preferred || 'Hypertrophy', bench: '100', weekly: String(state.user.frequency || 4) })
  const step = STEPS[i]
  const rec = recommend(a)
  const finish = (enroll) => {
    actions.patchUser({ goal: a.goal, level: a.level, frequency: a.frequency, equipment: a.equipment, preferred: a.preferred })
    actions.patchSettings({ weeklyTarget: a.frequency })
    const weekly = parseInt(a.weekly, 10)
    if (weekly > 0 && !state.goals.some((g) => g.type === 'weekly')) actions.addGoal({ type: 'weekly', target: weekly })
    const b = parseFloat(a.bench)
    if (b > 0 && !state.goals.some((g) => g.type === 'strength' && g.exerciseId === 'bench')) actions.addGoal({ type: 'strength', exerciseId: 'bench', target: b })
    if (enroll && !state.enrolled.includes(rec.id)) actions.enroll(rec.id)
    actions.finishOnboarding()
    navigate('/today', { replace: true })
  }
  const skip = () => { actions.finishOnboarding(); navigate('/today', { replace: true }) }
  const titles = { goal: 'What’s your main goal?', level: 'How experienced are you?', freq: 'How often can you train?', equip: 'What equipment do you have?', pref: 'What do you like to train?', target: 'Set your first goals', plan: 'Your recommended plan' }
  return (
    <div className="onb">
      <div className="onb-inner">
        <header className="onb-head">
          {i > 0 ? <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setI(i - 1)}>Back</Button> : <span />}
          <span className="caption">Step {i + 1} of {STEPS.length}</span>
          <button type="button" className="link caption" onClick={skip}>Skip, use demo profile</button>
        </header>
        <ProgressBar value={((i + 1) / STEPS.length) * 100} height={4} label="Onboarding progress" />
        <div key={step} className="onb-body enter">
          <div className="eyebrow">Welcome to Champion</div>
          <h1>{titles[step]}</h1>
          {step === 'goal' && <Choice label="Main goal" options={['Build muscle', 'Get stronger', 'Lose fat', 'Improve fitness', 'Improve endurance', 'Stay active']} value={a.goal} onChange={(v) => setA({ ...a, goal: v })} />}
          {step === 'level' && <Choice label="Experience" cols={1} options={['Beginner', 'Intermediate', 'Advanced']} value={a.level} onChange={(v) => setA({ ...a, level: v })} />}
          {step === 'freq' && <Choice label="Days per week" cols={5} options={['2', '3', '4', '5', '6']} value={String(a.frequency)} onChange={(v) => setA({ ...a, frequency: Number(v), weekly: v })} />}
          {step === 'equip' && <Choice label="Equipment" options={EQUIP} value={a.equipment} onChange={(v) => setA({ ...a, equipment: v })} />}
          {step === 'pref' && <Choice label="Preferred training" options={['Strength', 'Hypertrophy', 'Cardio', 'Mixed']} value={a.preferred} onChange={(v) => setA({ ...a, preferred: v })} />}
          {step === 'target' && <div className="stack"><Input label="Workouts per week" inputMode="numeric" value={a.weekly} onChange={(e) => setA({ ...a, weekly: e.target.value })} /><Input label="Bench press target (kg)" inputMode="decimal" value={a.bench} onChange={(e) => setA({ ...a, bench: e.target.value })} hint="You can add or change goals any time." /></div>}
          {step === 'plan' && (
            <div className="stack">
              <p className="muted">Based on your goal ({a.goal.toLowerCase()}), {a.level.toLowerCase()} experience, {a.frequency} days a week and {a.equipment.toLowerCase()} access.</p>
              <CourseCard course={rec} progress={courseProgress({ ...state, enrolled: [] }, rec.id)} featured />
            </div>
          )}
        </div>
        <footer className="onb-foot">
          {step !== 'plan' ? <Button variant="primary" size="xl" block onClick={() => setI(i + 1)}>Continue</Button> : (<><Button variant="primary" size="xl" block onClick={() => finish(true)}>Start this plan</Button><Button block variant="ghost" onClick={() => finish(false)}>Enter dashboard without enrolling</Button></>)}
        </footer>
      </div>
    </div>
  )
}
