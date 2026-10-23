import { useState } from 'react'
import { Flag, Users } from 'lucide-react'
import { useApp } from '../state/store'
import { challengeBoard, challengeStatus, challengeValue, challengeWindow } from '../state/selectors'
import { challenges } from '../data/social'
import { Badge, Button, Card, EmptyState, PageHeader, ProgressBar, SectionTabs, Tabs } from '../ui/primitives'
import { Cover } from '../ui/art'
import { LeaderboardRow } from '../ui/domain'
import { Sheet, useToast } from '../ui/overlays'
import { communityTabs } from '../ui/sections'
import { daysBetween, dateKey, shortDate } from '../lib/dates'
import { fmtNum, pct } from '../lib/format'
import { tr } from '../lib/i18n'

function ChallengeCard({ ch, joined, value, onOpen, onJoin }) {
  const status = challengeStatus(ch)
  const { to } = challengeWindow(ch)
  const left = daysBetween(dateKey(), to)
  return (
    <Card className="stack challenge" pad={false}>
      <Cover hue={ch.hue} variant={ch.target % 4} className="challenge-cover"><div className="challenge-top"><Badge tone="glass">{ch.badge}</Badge><Badge tone="glass"><Users size={11} aria-hidden="true" /> {fmtNum(ch.participants)}</Badge></div><h3 className="challenge-title">{ch.title}</h3></Cover>
      <div className="stack-sm challenge-body">
        <p className="muted">{ch.description}</p>
        {(joined || status === 'completed') && (
          <div className="stack-sm">
            <div className="row between"><b className="num">{fmtNum(value)} <span className="caption">/ {fmtNum(ch.target)} {tr(ch.unit)}</span></b><span className="num caption">{Math.round(pct(value, ch.target))}%</span></div>
            <ProgressBar value={pct(value, ch.target)} tone={value >= ch.target ? 'success' : 'accent'} label={tr("{0} progress", ch.title)} />
          </div>
        )}
        <div className="row between"><span className="caption">{status === 'completed' ? tr("Ended {0}", shortDate(to)) : status === 'upcoming' ? tr("Starts {0}", shortDate(challengeWindow(ch).from)) : tr("{0} days left · ends {1}", left, shortDate(to))}</span>
          <div className="row gap-2"><Button size="sm" onClick={onOpen}>{tr("Leaderboard")}</Button>{status !== 'completed' && <Button size="sm" variant={joined ? 'ghost' : 'primary'} onClick={onJoin}>{joined ? tr("Leave") : status === 'upcoming' ? tr("Join early") : tr("Join")}</Button>}</div></div>
      </div>
    </Card>
  )
}

export function Challenges() {
  const { state, actions } = useApp()
  const toast = useToast()
  const [tab, setTab] = useState('active')
  const [open, setOpen] = useState(null)
  const list = challenges.filter((c) => challengeStatus(c) === tab)
  const detail = challenges.find((c) => c.id === open)
  const join = (c) => { actions.joinChallenge(c.id); toast({ title: state.joinedChallenges[c.id] ? tr("Left challenge") : tr("Joined {0}", c.title), tone: state.joinedChallenges[c.id] ? 'neutral' : 'success' }) }
  return (
    <div className="stack-lg">
      <PageHeader eyebrow={tr("Compete with yourself")} title={tr("Challenges")} subtitle={tr("Progress is counted automatically from your logged workouts.")} />
      <SectionTabs items={communityTabs} />
      <Tabs label={tr("Challenge status")} value={tab} onChange={setTab} items={[{ id: 'active', label: tr("Active"), count: challenges.filter((c) => challengeStatus(c) === 'active').length }, { id: 'upcoming', label: tr("Upcoming") }, { id: 'completed', label: tr("Completed") }]} />
      {list.length ? <div className="grid-auto challenge-grid">{list.map((c) => <ChallengeCard key={c.id} ch={c} joined={Boolean(state.joinedChallenges[c.id])} value={challengeValue(state, c)} onOpen={() => setOpen(c.id)} onJoin={() => join(c)} />)}</div> : <EmptyState icon={Flag} title={tr("No {0} challenges", tab)} body={tr("Check back soon — new challenges start every month.")} />}
      <Sheet open={Boolean(detail)} onClose={() => setOpen(null)} title={detail?.title} size="lg">
        {detail && (
          <div className="stack">
            <p className="muted">{detail.description}</p>
            <div className="row gap-4 wrap"><Badge>{fmtNum(detail.participants)} {tr("participants")}</Badge><Badge>{tr("Target")} {fmtNum(detail.target)} {tr(detail.unit)}</Badge></div>
            <h3>{tr("Leaderboard")}</h3>
            <ol className="stack-sm">{challengeBoard(state, detail).map((r) => <LeaderboardRow key={r.name} row={{ ...r, hue: 18 + r.rank * 40 }} format={(v) => `${fmtNum(v)} ${tr(detail.unit)}`} />)}</ol>
            <p className="caption">{tr("Rankings show a sample of participants near you. Everyone’s pace is different — personal progress is what counts.")}</p>
          </div>
        )}
      </Sheet>
    </div>
  )
}
