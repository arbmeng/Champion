import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { exercises as libraryExercises, EQUIPMENT, DIFFICULTY, MUSCLES, PATTERNS } from '../data/exercises'
import { useApp } from '../state/store'
import { Button, FilterChips, Input, SearchField, Select } from './primitives'
import { Sheet } from './overlays'
import { ExerciseThumb } from './art'
import { useToast } from './overlays'

export function useAllExercises() {
  const { state } = useApp()
  return useMemo(() => [...libraryExercises, ...state.customExercises], [state.customExercises])
}

export function searchExercises(list, q, filters = {}) {
  const term = q.trim().toLowerCase()
  return list.filter((e) => {
    if (filters.muscle && e.muscle !== filters.muscle && !e.secondary.includes(filters.muscle)) return false
    if (filters.equipment && e.equipment !== filters.equipment) return false
    if (filters.difficulty && e.difficulty !== filters.difficulty) return false
    if (filters.pattern && e.pattern !== filters.pattern) return false
    if (filters.type && e.type !== filters.type) return false
    if (!term) return true
    return `${e.name} ${e.muscle} ${e.equipment} ${e.pattern} ${e.secondary.join(' ')}`.toLowerCase().includes(term)
  })
}

export function ExercisePicker({ open, onClose, onPick, title = 'Add exercise', multiple = false }) {
  const all = useAllExercises()
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState(null)
  const [create, setCreate] = useState(false)
  const results = useMemo(() => searchExercises(all, q, { muscle }), [all, q, muscle])
  const pick = (e) => { onPick(e); if (!multiple) { onClose(); setQ('') } }
  return (
    <>
      <Sheet open={open && !create} onClose={onClose} title={title} size="lg">
        <div className="stack">
          <SearchField value={q} onChange={setQ} placeholder="Search exercises" autoFocus />
          <FilterChips options={MUSCLES} value={muscle} onChange={setMuscle} label="Muscle" />
          <ul className="picker-list" aria-label="Exercise results">
            {results.map((e) => (
              <li key={e.id}>
                <button type="button" className="picker-row" onClick={() => pick(e)}>
                  <ExerciseThumb exercise={e} size={44} />
                  <span className="grow"><b>{e.name}</b><span className="caption">{e.muscle} · {e.equipment}</span></span>
                  <Plus size={18} className="accent" aria-hidden="true" />
                </button>
              </li>
            ))}
            {!results.length && <li className="caption picker-empty">No exercises match “{q}”.</li>}
          </ul>
          <Button icon={Plus} onClick={() => setCreate(true)}>Create custom exercise</Button>
        </div>
      </Sheet>
      <CreateExerciseSheet open={create} onClose={() => setCreate(false)} defaultName={q} onCreated={(e) => { setCreate(false); pick(e) }} />
    </>
  )
}

export function CreateExerciseSheet({ open, onClose, defaultName = '', onCreated }) {
  const { actions } = useApp()
  const toast = useToast()
  const [name, setName] = useState('')
  const [muscle, setMuscle] = useState('Chest')
  const [equipment, setEquipment] = useState('Dumbbell')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [pattern, setPattern] = useState('Isolation')
  const [err, setErr] = useState('')
  const submit = (e) => {
    e.preventDefault()
    const n = (name || defaultName).trim()
    if (n.length < 2) { setErr('Give your exercise a name.'); return }
    const ex = {
      id: `custom-${Date.now().toString(36)}`, name: n, muscle, secondary: [], equipment, difficulty, pattern, type: pattern === 'Isolation' ? 'Isolation' : 'Compound',
      sets: 3, reps: [8, 12], rest: 90, weight: 0, repLabel: 'reps', weighted: equipment !== 'Bodyweight', custom: true,
      tech: ['Set up in a stable position and brace your core.', 'Move through a full, controlled range of motion.', 'Pause briefly at peak contraction.', 'Lower under control.'],
      mistakes: ['Using momentum.', 'Rushing the lowering phase.'], tip: 'Add your own notes after a few sessions.',
      tempo: '2-0-1', breathing: 'Exhale on effort, inhale on the return.', rom: 'Use the full range you can control.', safety: 'Choose a load you can control through the whole rep.',
    }
    actions.addExerciseDef(ex)
    toast({ title: 'Exercise created', body: n, tone: 'success' })
    setName(''); setErr('')
    onCreated?.(ex)
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title="Create exercise">
      <form className="stack" onSubmit={submit}>
        <Input label="Name" value={name || defaultName} onChange={(e) => { setName(e.target.value); setErr('') }} error={err} placeholder="e.g. Single-arm cable press" data-autofocus />
        <div className="grid-2">
          <Select label="Primary muscle" options={MUSCLES} value={muscle} onChange={setMuscle} />
          <Select label="Equipment" options={EQUIPMENT} value={equipment} onChange={setEquipment} />
          <Select label="Difficulty" options={DIFFICULTY} value={difficulty} onChange={setDifficulty} />
          <Select label="Movement" options={PATTERNS.filter((p) => !['Mobility', 'Conditioning'].includes(p))} value={pattern} onChange={setPattern} />
        </div>
        <Button type="submit" variant="primary" size="lg" block>Create exercise</Button>
      </form>
    </Sheet>
  )
}
