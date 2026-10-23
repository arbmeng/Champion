import { useNavigate } from 'react-router-dom'
import { Bell, CalendarCheck, CheckCheck, Trash2, Flag, Sparkles, Target, Trophy, Users, Award } from 'lucide-react'
import { useApp } from '../state/store'
import { Button, EmptyState, PageHeader, cx } from '../ui/primitives'
import { timeAgo } from '../lib/dates'
import { tr } from '../lib/i18n'

const icons = { workout: CalendarCheck, course: CalendarCheck, pr: Trophy, goal: Target, challenge: Flag, friend: Users, coach: Sparkles, achievement: Award }

export function Notifications() {
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const list = state.notifications
  return (
    <div className="stack-lg">
      <PageHeader eyebrow={tr("Inbox")} title={tr("Notifications")} actions={list.length ? <><Button icon={CheckCheck} onClick={actions.notifReadAll}>{tr("Mark all read")}</Button><Button variant="ghost" icon={Trash2} onClick={actions.notifClear}>{tr("Clear")}</Button></> : null} />
      {list.length ? (
        <ul className="stack-sm">{list.map((n) => { const I = icons[n.type] || Bell; return (
          <li key={n.id}><button type="button" className={cx('notif', !n.read && 'is-unread')} onClick={() => { actions.notifRead(n.id); if (n.href) navigate(n.href) }}>
            <span className="notif-icon"><I size={18} aria-hidden="true" /></span>
            <span className="grow"><b>{n.title}</b><span className="muted notif-body">{n.body}</span></span>
            <span className="caption">{timeAgo(n.ts)}</span>{!n.read && <span className="notif-dot" aria-label={tr("Unread")} />}
          </button></li>) })}</ul>
      ) : <EmptyState icon={Bell} title={tr("You’re all caught up")} body={tr("Workout reminders, PRs and challenge updates will show up here.")} />}
    </div>
  )
}
