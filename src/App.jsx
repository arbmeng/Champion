import { lazy } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from './state/store'
import { ToastProvider } from './ui/overlays'
import { PwaProvider } from './pwa'
import Shell from './Shell'

const page = (loader, name = 'default') => lazy(() => loader().then((m) => ({ default: m[name] })))
const Today = page(() => import('./pages/Today'), 'Today')
const Courses = page(() => import('./pages/Courses'), 'Courses')
const CourseDetail = page(() => import('./pages/Courses'), 'CourseDetail')
const Workouts = page(() => import('./pages/Workouts'), 'Workouts')
const WorkoutDetail = page(() => import('./pages/Workouts'), 'WorkoutDetail')
const WorkoutBuilder = page(() => import('./pages/Workouts'), 'WorkoutBuilder')
const Session = page(() => import('./pages/Session'), 'Session')
const Complete = page(() => import('./pages/Complete'), 'Complete')
const Exercises = page(() => import('./pages/Exercises'), 'Exercises')
const ExerciseDetail = page(() => import('./pages/Exercises'), 'ExerciseDetail')
const Progress = page(() => import('./pages/Progress'), 'Progress')
const History = page(() => import('./pages/History'), 'History')
const HistoryDetail = page(() => import('./pages/History'), 'HistoryDetail')
const Goals = page(() => import('./pages/Goals'), 'Goals')
const Challenges = page(() => import('./pages/Challenges'), 'Challenges')
const Community = page(() => import('./pages/Community'), 'Community')
const Coach = page(() => import('./pages/Coach'), 'Coach')
const Nutrition = page(() => import('./pages/Nutrition'), 'Nutrition')
const Recovery = page(() => import('./pages/Recovery'), 'Recovery')
const Profile = page(() => import('./pages/Profile'), 'Profile')
const Settings = page(() => import('./pages/Settings'), 'Settings')
const Notifications = page(() => import('./pages/Notifications'), 'Notifications')
const Onboarding = page(() => import('./pages/Onboarding'), 'Onboarding')
const NotFound = page(() => import('./pages/Settings'), 'NotFound')

function Gate({ children }) {
  const { state } = useApp()
  return state.onboarded ? children : <Navigate to="/onboarding" replace />
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <PwaProvider>
        <HashRouter>
          <Routes>
            <Route element={<Shell />}>
              <Route index element={<Navigate to="/today" replace />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="today" element={<Gate><Today /></Gate>} />
              <Route path="courses" element={<Gate><Courses /></Gate>} />
              <Route path="courses/:id" element={<Gate><CourseDetail /></Gate>} />
              <Route path="workouts" element={<Gate><Workouts /></Gate>} />
              <Route path="workouts/new" element={<Gate><WorkoutBuilder /></Gate>} />
              <Route path="workouts/:id" element={<Gate><WorkoutDetail /></Gate>} />
              <Route path="workout/:id/session" element={<Gate><Session /></Gate>} />
              <Route path="complete/:logId" element={<Gate><Complete /></Gate>} />
              <Route path="exercises" element={<Gate><Exercises /></Gate>} />
              <Route path="exercises/:id" element={<Gate><ExerciseDetail /></Gate>} />
              <Route path="progress" element={<Gate><Progress /></Gate>} />
              <Route path="history" element={<Gate><History /></Gate>} />
              <Route path="history/:logId" element={<Gate><HistoryDetail /></Gate>} />
              <Route path="goals" element={<Gate><Goals /></Gate>} />
              <Route path="challenges" element={<Gate><Challenges /></Gate>} />
              <Route path="community" element={<Gate><Community /></Gate>} />
              <Route path="coach" element={<Gate><Coach /></Gate>} />
              <Route path="nutrition" element={<Gate><Nutrition /></Gate>} />
              <Route path="recovery" element={<Gate><Recovery /></Gate>} />
              <Route path="profile" element={<Gate><Profile /></Gate>} />
              <Route path="settings" element={<Gate><Settings /></Gate>} />
              <Route path="notifications" element={<Gate><Notifications /></Gate>} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </HashRouter>
        </PwaProvider>
      </ToastProvider>
    </AppProvider>
  )
}
