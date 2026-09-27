const RECOVERY_WINDOW_DAYS = 2

export function estimateMuscleRecovery(history, muscle, today = new Date()) {
  const lastSession = history.find((workout) => workout.muscles?.includes(muscle))
  if (!lastSession) return { label: 'Fresh', tone: 'fresh' }

  const todayStart = new Date(today)
  todayStart.setHours(0, 0, 0, 0)
  const sessionDate = new Date(`${lastSession.date}T00:00:00`)
  const daysSince = Math.max(0, Math.floor((todayStart - sessionDate) / 86400000))
  return daysSince >= RECOVERY_WINDOW_DAYS
    ? { label: 'Ready', tone: 'ready' }
    : { label: 'Recovering', tone: 'recover' }
}
