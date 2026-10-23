import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Activity, Apple, Bell, BedDouble, CalendarDays, Dumbbell, Flag, Home, Layers, Moon, Play, Settings, Sparkles, Sun, Swords, Target, User, Users } from 'lucide-react'
import { useApp, useNow } from './state/store'
import { unreadCount } from './state/selectors'
import { IconButton, SearchField, cx } from './ui/primitives'
import { PageSkeleton } from './ui/skeletons'
import { ErrorBoundary } from './ui/ErrorBoundary'
import { fmtClock } from './lib/format'

const nav = [
  { to: '/today', label: 'Today', icon: Home, match: ['/today'] },
  { to: '/courses', label: 'Courses', icon: Layers, match: ['/courses'] },
  { to: '/workouts', label: 'Workouts', icon: Dumbbell, match: ['/workouts'] },
  { to: '/exercises', label: 'Exercises', icon: Activity, match: ['/exercises'] },
  { to: '/progress', label: 'Progress', icon: Flag, match: ['/progress'] },
  { to: '/history', label: 'History', icon: CalendarDays, match: ['/history'] },
  { to: '/goals', label: 'Goals', icon: Target, match: ['/goals'] },
  { to: '/challenges', label: 'Challenges', icon: Swords, match: ['/challenges'] },
  { to: '/community', label: 'Community', icon: Users, match: ['/community'] },
  { to: '/coach', label: 'AI Coach', icon: Sparkles, match: ['/coach'] },
]
const secondary = [
  { to: '/nutrition', label: 'Nutrition', icon: Apple },
  { to: '/recovery', label: 'Recovery', icon: BedDouble },
]
const mobileNav = [
  { to: '/today', label: 'Today', icon: Home, match: ['/today', '/coach'] },
  { to: '/workouts', label: 'Workouts', icon: Dumbbell, match: ['/workouts', '/courses', '/exercises'] },
  { to: '/progress', label: 'Progress', icon: Flag, match: ['/progress', '/history', '/goals'] },
  { to: '/community', label: 'Community', icon: Users, match: ['/community', '/challenges'] },
  { to: '/profile', label: 'Profile', icon: User, match: ['/profile', '/settings', '/nutrition', '/recovery', '/notifications'] },
]
const inSection = (pathname, match) => match.some((m) => pathname === m || pathname.startsWith(`${m}/`))

export function useTheme() {
  const { state, actions } = useApp()
  const theme = state.settings.theme
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a0b0d' : '#f4f3ef')
  }, [theme])
  const cycle = () => actions.patchSettings({ theme: theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark' })
  return { theme, cycle }
}

function useShortcuts() {
  const navigate = useNavigate()
  useEffect(() => {
    let g = 0
    const map = { t: '/today', c: '/courses', w: '/workouts', e: '/exercises', p: '/progress', h: '/history', o: '/goals', m: '/community', a: '/coach', n: '/nutrition', r: '/recovery' }
    const onKey = (e) => {
      const tag = e.target.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.target.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '/') { const s = document.querySelector('[data-search]'); if (s) { e.preventDefault(); s.focus() } return }
      if (e.key === 'g') { g = Date.now(); return }
      if (g && Date.now() - g < 1200 && map[e.key]) { g = 0; navigate(map[e.key]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])
}

function GlobalSearch() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  return (
    <div className="topbar-search hide-mobile">
      <SearchField value={q} onChange={setQ} placeholder="Search exercises…" onSubmit={(v) => { if (v.trim()) { navigate(`/exercises?q=${encodeURIComponent(v.trim())}`); setQ('') } }} />
    </div>
  )
}

function Logo({ compact }) {
  return (
    <Link to="/today" className="logo" aria-label="Champion — Today">
      <span className="logo-mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 19V9l7-5 7 5v10" /><path d="M9 19v-6h6v6" /></svg></span>
      {!compact && <span className="logo-word">Champion</span>}
    </Link>
  )
}

function ActiveBar() {
  const { state } = useApp()
  const { pathname } = useLocation()
  const a = state.active
  const now = useNow(1000, Boolean(a))
  if (!a || pathname.endsWith('/session')) return null
  const done = a.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
  const total = a.exercises.reduce((n, e) => n + e.sets.length, 0)
  return (
    <Link to={`/workout/${a.workoutId}/session`} className="active-bar">
      <span className="active-pulse" aria-hidden="true" />
      <span className="grow"><b>{a.title}</b><small>{done}/{total} sets · {fmtClock((now - a.startedAt) / 1000)}</small></span>
      <span className="active-bar-cta"><Play size={14} fill="currentColor" aria-hidden="true" /> Resume</span>
    </Link>
  )
}

export default function Shell() {
  const { state } = useApp()
  const { pathname } = useLocation()
  const { theme, cycle } = useTheme()
  useShortcuts()
  const unread = unreadCount(state)
  const ThemeIcon = theme === 'dark' ? Moon : Sun
  const immersive = pathname.endsWith('/session') || pathname.startsWith('/complete/') || pathname === '/onboarding'
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  const top = `/${pathname.split('/')[1]}`

  return (
    <div className={cx('shell', immersive && 'is-immersive')}>
      <a href="#main" className="skip-link">Skip to content</a>
      {!immersive && (
        <aside className="sidebar" aria-label="Primary">
          <Logo />
          <nav className="side-nav" aria-label="Main">
            {nav.map((n) => <NavLink key={n.to} to={n.to} className={() => cx('side-link', inSection(pathname, n.match) && 'is-active')}><n.icon size={19} aria-hidden="true" /><span>{n.label}</span></NavLink>)}
            <div className="side-sep" role="presentation" />
            {secondary.map((n) => <NavLink key={n.to} to={n.to} className={({ isActive }) => cx('side-link', isActive && 'is-active')}><n.icon size={19} aria-hidden="true" /><span>{n.label}</span></NavLink>)}
          </nav>
          <div className="side-foot">
            <NavLink to="/profile" className={({ isActive }) => cx('side-link', isActive && 'is-active')}><User size={19} aria-hidden="true" /><span>Profile</span></NavLink>
            <NavLink to="/settings" className={({ isActive }) => cx('side-link', isActive && 'is-active')}><Settings size={19} aria-hidden="true" /><span>Settings</span></NavLink>
          </div>
        </aside>
      )}

      <div className="shell-main">
        {!immersive && (
          <header className="topbar">
            <div className="topbar-logo"><Logo /></div>
            <GlobalSearch />
            <div className="grow" />
            <div className="row gap-1">
              <IconButton label={`Theme: ${theme}. Change theme`} icon={ThemeIcon} onClick={cycle} />
              <IconButton label="AI Coach" icon={Sparkles} to="/coach" className="show-mobile-flex" />
              <IconButton label={unread ? `Notifications, ${unread} unread` : 'Notifications'} icon={Bell} to="/notifications" badge={unread} />
            </div>
          </header>
        )}
        <main id="main" className={cx('content', immersive && 'content-immersive')} tabIndex={-1}>
          <ErrorBoundary resetKey={pathname}>
            <Suspense fallback={<PageSkeleton />}>
              <div key={top} className="page enter"><Outlet /></div>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {!immersive && <ActiveBar />}
      {!immersive && (
        <nav className="bottom-nav" aria-label="Primary mobile">
          {mobileNav.map((n) => {
            const active = inSection(pathname, n.match)
            return <NavLink key={n.to} to={n.to} className={cx('bottom-link', active && 'is-active')} aria-current={active ? 'page' : undefined}><n.icon size={22} strokeWidth={active ? 2.4 : 1.9} aria-hidden="true" /><span>{n.label}</span></NavLink>
          })}
        </nav>
      )}
    </div>
  )
}
