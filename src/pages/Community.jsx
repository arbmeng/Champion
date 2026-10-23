import { useState } from 'react'
import { Flame, Heart, MessageCircle, PartyPopper, Plus, Send, Trophy, Users } from 'lucide-react'
import { useApp } from '../state/store'
import { leaderboard } from '../state/selectors'
import { feedSeed, friends, groups } from '../data/social'
import { Avatar, Badge, Button, Card, EmptyState, PageHeader, SectionTabs, SegmentedControl, Tabs, cx } from '../ui/primitives'
import { LeaderboardRow } from '../ui/domain'
import { communityTabs } from '../ui/sections'
import { timeAgo } from '../lib/dates'
import { L } from '../lib/i18n'
import { fmtNum, toDisplay } from '../lib/format'
import { tr } from '../lib/i18n'

function Post({ post }) {
  const { state, actions } = useApp()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const unit = state.settings.unit
  const liked = Boolean(state.social.liked[post.id])
  const cheered = Boolean(state.social.liked[`${post.id}:c`])
  const comments = [...post.comments, ...(state.social.comments[post.id] || []).map((c) => ({ ...c, authorId: 'you' }))]
  const author = post.authorId === 'you' ? { name: state.user.name, hue: 18 } : friends.find((f) => f.id === post.authorId)
  const submit = (e) => { e.preventDefault(); if (!text.trim()) return; actions.comment(post.id, text.trim()); setText('') }
  return (
    <Card as="article" className="stack post">
      <div className="row gap-3">
        <Avatar name={author.name} hue={author.hue} size={42} />
        <div className="grow"><b>{author.name}</b><div className="caption">{timeAgo(post.ts)}</div></div>
        <Badge>{post.workout}</Badge>
      </div>
      <div className="grid-3 post-stats">
        <div><span className="eyebrow">{tr("Duration")}</span><div className="num num-md">{post.duration}<span className="unit">{tr("min")}</span></div></div>
        <div><span className="eyebrow">{tr("Volume")}</span><div className="num num-md">{post.volume ? fmtNum(toDisplay(post.volume, unit)) : '—'}<span className="unit">{post.volume ? unit : ''}</span></div></div>
        <div><span className="eyebrow">{tr("Exercises")}</span><div className="num num-md">{post.exercises}</div></div>
      </div>
      {post.pr && <div className="post-pr"><Trophy size={15} aria-hidden="true" /> <b>{tr("PR")}</b> {post.pr}</div>}
      {post.text && <p>{post.text}</p>}
      <div className="row gap-2 post-actions">
        <Button size="sm" variant="ghost" icon={Heart} aria-pressed={liked} className={cx(liked && 'is-on')} onClick={() => actions.like(post.id)}>{post.likes + (liked ? 1 : 0)}</Button>
        <Button size="sm" variant="ghost" icon={MessageCircle} aria-expanded={open} onClick={() => setOpen(!open)}>{comments.length}</Button>
        <Button size="sm" variant="ghost" icon={PartyPopper} aria-pressed={cheered} className={cx(cheered && 'is-on')} onClick={() => actions.like(`${post.id}:c`)}>{tr("Celebrate")}</Button>
      </div>
      {open && (
        <div className="stack-sm comments">
          {comments.map((c, i) => { const a = c.authorId === 'you' ? { name: state.user.name } : friends.find((f) => f.id === c.authorId); return <div key={c.id || i} className="row-top gap-2"><Avatar name={a?.name || '?'} hue={a?.hue ?? 18} size={26} /><p><b>{a?.name?.split(' ')[0]}</b> {c.text}</p></div> })}
          <form className="row gap-2" onSubmit={submit}><input className="input" aria-label={tr("Write a comment")} placeholder={tr("Add a comment")} value={text} onChange={(e) => setText(e.target.value)} /><Button type="submit" variant="primary" icon={Send} aria-label={tr("Send comment")} /></form>
        </div>
      )}
    </Card>
  )
}

export function Community() {
  const { state, actions } = useApp()
  const [tab, setTab] = useState('feed')
  const [cat, setCat] = useState('workouts')
  const [scope, setScope] = useState('friends')
  const unit = state.settings.unit
  const mine = state.social.posts.map((p) => { const l = state.history.find((x) => x.id === p.logId); return l && { id: p.id, authorId: 'you', ts: p.ts, workout: l.title, duration: Math.round(l.duration / 60), volume: l.volume, exercises: l.exercises, text: p.text, pr: l.prs[0] ? `${l.prs[0].name} · ${toDisplay(l.prs[0].weight, unit)} ${unit} × ${l.prs[0].reps}` : null, likes: 0, comments: [] } }).filter(Boolean)
  const base = Date.now()
  const feed = [...mine, ...[...(state.remote?.feed || []), ...feedSeed].filter((p) => state.social.following[p.authorId]).map((p) => ({ ...p, workout: L(p.workout), text: L(p.text), ts: base - p.ago * 60000 }))].sort((a, b) => b.ts - a.ts)
  const rows = leaderboard(state, cat, scope)
  const fmt = { workouts: (v) => tr('{0} workouts', v), volume: (v) => `${fmtNum(toDisplay(v, unit))} ${unit}`, streak: (v) => tr('{0} days', v), prs: (v) => tr('{0} PRs', v) }[cat]
  return (
    <div className="stack-lg">
      <PageHeader eyebrow={tr("Training together")} title={tr("Community")} subtitle={tr("Fitness activity first. Celebrate each other’s work.")} />
      <SectionTabs items={communityTabs} />
      <Tabs label={tr("Community")} value={tab} onChange={setTab} items={[{ id: 'feed', label: tr("Feed") }, { id: 'friends', label: tr("Friends") }, { id: 'groups', label: tr("Groups") }, { id: 'leaderboards', label: tr("Leaderboards") }]} />
      {tab === 'feed' && (feed.length ? <div className="feed">{feed.map((p) => <Post key={p.id} post={p} />)}</div> : <EmptyState icon={Users} title={tr("No community activity")} body={tr("Follow friends or finish a workout and share it to start your feed.")} action={<Button variant="primary" onClick={() => setTab('friends')}>{tr("Find friends")}</Button>} />)}
      {tab === 'friends' && (
        <div className="grid-auto">
          {friends.map((f) => { const on = Boolean(state.social.following[f.id]); return (
            <Card key={f.id} className="row gap-3"><Avatar name={f.name} hue={f.hue} size={46} /><div className="grow"><b>{f.name}</b><div className="caption">{f.handle} · {tr(f.level)}</div><div className="caption row gap-1"><Flame size={12} aria-hidden="true" /> {f.streak} {tr("day streak")}</div></div><Button size="sm" variant={on ? 'secondary' : 'primary'} icon={on ? undefined : Plus} aria-pressed={on} onClick={() => actions.follow(f.id)}>{on ? tr("Following") : tr("Follow")}</Button></Card>
          ) })}
        </div>
      )}
      {tab === 'groups' && (
        <div className="grid-auto">
          {groups.map((g) => { const on = Boolean(state.social.groups[g.id]); return (
            <Card key={g.id} className="stack-sm"><div className="row gap-3"><span className="group-mark" style={{ background: `hsl(${g.hue} 55% 38%)` }} aria-hidden="true"><Users size={18} /></span><div className="grow"><b>{g.name}</b><div className="caption">{fmtNum(g.members + (on ? 1 : 0))} {tr("members")}</div></div></div><p className="muted">{g.description}</p><Button variant={on ? 'secondary' : 'primary'} aria-pressed={on} onClick={() => actions.toggleGroup(g.id)}>{on ? tr("Joined") : tr("Join group")}</Button></Card>
          ) })}
        </div>
      )}
      {tab === 'leaderboards' && (
        <div className="stack">
          <div className="row between wrap gap-4"><SegmentedControl label={tr("Category")} items={[{ id: 'workouts', label: tr("Workouts") }, { id: 'volume', label: tr("Volume") }, { id: 'streak', label: tr("Streak") }, { id: 'prs', label: tr("PRs") }]} value={cat} onChange={setCat} /><SegmentedControl size="sm" label={tr("Scope")} items={[{ id: 'friends', label: tr("Friends") }, { id: 'everyone', label: tr("Everyone") }]} value={scope} onChange={setScope} /></div>
          <Card className="stack-sm"><ol className="stack-sm">{rows.map((r) => <LeaderboardRow key={r.id} row={r} format={fmt} />)}</ol><p className="caption">{tr("Weekly workouts and volume reset every Monday. Streaks and PRs are personal bests — compare, don’t compete.")}</p></Card>
        </div>
      )}
    </div>
  )
}
