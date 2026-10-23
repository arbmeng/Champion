import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Sparkles, Trash2 } from 'lucide-react'
import { useApp } from '../state/store'
import { coachReply, SUGGESTIONS } from '../lib/coach'
import { tr } from '../lib/i18n'
import { Button, Card, IconButton, PageHeader, SectionTabs } from '../ui/primitives'
import { ChatMessage } from '../ui/domain'
import { useToast } from '../ui/overlays'
import { profileTabs } from '../ui/sections'

export function Coach() {
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const toast = useToast()
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const end = useRef(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [state.coach.length, typing])

  const send = (raw, intent) => {
    const q = raw.trim()
    if (!q || typing) return
    setText('')
    actions.coachAdd([{ id: `u${Date.now()}`, role: 'user', text: q }])
    setTyping(true)
    setTimeout(() => {
      const r = coachReply(state, q, intent) || { text: tr('I can analyse your strength trends, review your week, suggest load changes, explain an exercise, or build a quick workout. Try one of the suggestions below.') }
      actions.coachAdd([{ id: `c${Date.now()}`, role: 'coach', text: r.text, actions: r.actions }])
      setTyping(false)
    }, 450)
  }
  const act = (a) => {
    if (a.to) { navigate(a.to); return }
    if (a.build) { const w = actions.saveWorkout(a.build); toast({ title: tr("Workout saved"), body: w.title, tone: 'success' }); navigate(`/workouts/${w.id}`) }
  }

  return (
    <div className="stack-lg coach-page">
      <PageHeader eyebrow={tr("Rule-based demo coach")} title={tr("AI Coach")} subtitle={tr("Answers come from your logged data using fixed rules — not a live language model.")} actions={<IconButton label={tr("Clear conversation")} icon={Trash2} onClick={actions.coachClear} />} />
      <SectionTabs items={profileTabs} />
      <Card className="chat" pad={false}>
        <div className="chat-log" role="log" aria-live="polite" aria-label={tr("Conversation with coach")}>
          {state.coach.map((m) => (
            <ChatMessage key={m.id} m={m}>
              {m.actions?.length > 0 && <div className="row gap-2 wrap chat-actions">{m.actions.map((a) => <Button key={a.label} size="sm" onClick={() => act(a)}>{a.label}</Button>)}</div>}
            </ChatMessage>
          ))}
          {typing && <div className="chat-msg is-coach"><span className="chat-avatar"><Sparkles size={14} aria-hidden="true" /></span><div className="chat-bubble typing" aria-label={tr("Coach is typing")}><i /><i /><i /></div></div>}
          <div ref={end} />
        </div>
        <div className="chat-suggest" aria-label={tr("Suggested questions")}>{SUGGESTIONS.map((s) => <button key={s.id} type="button" className="chip" onClick={() => send(s.label(), s.id)}>{s.label()}</button>)}</div>
        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(text) }}>
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={tr("Ask about your lifts, your week, or what to train")} aria-label={tr("Message your coach")} />
          <Button type="submit" variant="primary" icon={Send} disabled={!text.trim() || typing} aria-label={tr("Send")} />
        </form>
      </Card>
    </div>
  )
}
