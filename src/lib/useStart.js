import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/store'
import { useToast } from '../ui/overlays'

// Single entry point for launching a session from Today, a course, or a workout page.
export function useStartWorkout() {
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const toast = useToast()
  return useCallback((workout, opts = {}) => {
    const a = state.active
    if (a) {
      if (a.workoutId !== workout.id) toast({ title: 'Workout already in progress', body: `Resuming ${a.title}. Finish or discard it to start another.`, tone: 'warning' })
      navigate(`/workout/${a.workoutId}/session`)
      return
    }
    actions.start(workout, opts)
    navigate(`/workout/${workout.id}/session`)
  }, [state.active, actions, navigate, toast])
}
