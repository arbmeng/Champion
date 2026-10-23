// Courses are multi-week programs. A course session is addressed by its linear index:
// sessionIndex = (week - 1) * perWeek + position.
export const courses = [
  {
    id: 'strength-hypertrophy',
    title: 'Strength & Hypertrophy',
    tagline: 'Four sessions a week. Heavy where it counts, high-volume where it grows.',
    description: 'A 12-week upper/lower program that alternates strength-focused and hypertrophy-focused days. Load progresses weekly using double progression, with a deload every fourth week to keep you fresh.',
    trainer: { name: 'Marcus Hale', role: 'Strength coach · 14 years coaching', bio: 'Former competitive powerlifter. Builds programs around simple progressions and honest effort.' },
    level: 'Intermediate', weeks: 12, perWeek: 4, equipment: ['Barbell', 'Dumbbell', 'Machine', 'Cable'], tags: ['Strength', 'Hypertrophy', 'Upper/Lower'],
    rating: 4.8, ratings: 2184, goal: 'Build muscle', place: 'Gym', hue: 18,
    schedule: ['lower-a', 'upper-a', 'lower-b', 'upper-b'],
    outcomes: ['Add load to your main lifts every week', 'Train every muscle twice per week', 'Learn how to autoregulate with RIR'],
  },
  {
    id: 'foundations',
    title: 'Foundations of Strength',
    tagline: 'Learn the movements. Build the base. Get strong from day one.',
    description: 'An 8-week full-body program for new lifters. Three sessions a week teach the essential squat, hinge, press and pull patterns with a clear weekly progression.',
    trainer: { name: 'Dana Ortiz', role: 'Certified strength & conditioning specialist', bio: 'Specialises in helping new lifters build confidence and consistency.' },
    level: 'Beginner', weeks: 8, perWeek: 3, equipment: ['Dumbbell', 'Machine', 'Cable'], tags: ['Strength', 'Full Body', 'Beginner'],
    rating: 4.9, ratings: 3902, goal: 'Get stronger', place: 'Gym', hue: 200,
    schedule: ['fb-a', 'fb-b', 'fb-c'],
    outcomes: ['Learn safe technique on the key lifts', 'Build a consistent training habit', 'Finish with a 3-lift baseline'],
  },
  {
    id: 'ppl',
    title: 'Push Pull Legs Hypertrophy',
    tagline: 'Six days. Maximum volume. For lifters who live in the gym.',
    description: 'An 8-week six-day push/pull/legs split for advanced lifters. High weekly volume per muscle with built-in progressive overload.',
    trainer: { name: 'Kenji Mori', role: 'Physique coach', bio: 'Coaches natural bodybuilders and focuses on volume management and recovery.' },
    level: 'Advanced', weeks: 8, perWeek: 6, equipment: ['Barbell', 'Dumbbell', 'Machine', 'Cable'], tags: ['Hypertrophy', 'PPL', 'High volume'],
    rating: 4.7, ratings: 1320, goal: 'Build muscle', place: 'Gym', hue: 330,
    schedule: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
    outcomes: ['Hit each muscle twice per week with high volume', 'Autoregulate load using RIR', 'Build a bigger physique'],
  },
  {
    id: 'home-dumbbell',
    title: 'Home Dumbbell Builder',
    tagline: 'A real training block with nothing but dumbbells and a bench.',
    description: 'Six weeks of four-day upper/lower training designed for home setups. Progress by reps first, then load.',
    trainer: { name: 'Priya Nair', role: 'Movement & strength coach', bio: 'Designs efficient programs for small spaces and busy schedules.' },
    level: 'Intermediate', weeks: 6, perWeek: 4, equipment: ['Dumbbell', 'Bodyweight'], tags: ['Hypertrophy', 'Home', 'Dumbbells'],
    rating: 4.6, ratings: 876, goal: 'Build muscle', place: 'Home', hue: 150,
    schedule: ['hd-upper', 'hd-lower', 'hd-push', 'hd-pull'],
    outcomes: ['Train effectively without a gym', 'Learn double progression with dumbbells', 'Build muscle with limited equipment'],
  },
]

export const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]))
export const totalSessions = (course) => course.weeks * course.perWeek
export const isDeloadWeek = (course, week) => course.weeks >= 8 && week % 4 === 0
export const sessionWorkoutId = (course, index) => course.schedule[index % course.perWeek]
export const sessionWeek = (course, index) => Math.floor(index / course.perWeek) + 1
export const sessionPosition = (course, index) => (index % course.perWeek) + 1
