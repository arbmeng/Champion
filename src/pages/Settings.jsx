import { useState } from 'react'
import { Download, RefreshCw, RotateCcw, Trash2 } from 'lucide-react'
import { useApp } from '../state/store'
import { Button, Card, EmptyState, Input, PageHeader, Section, SectionTabs, SegmentedControl, Select, Toggle } from '../ui/primitives'
import { ConfirmSheet, useToast } from '../ui/overlays'
import { profileTabs } from '../ui/sections'

export function Settings() {
  const { state, actions } = useApp()
  const toast = useToast()
  const s = state.settings
  const [confirm, setConfirm] = useState(null)
  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 'champion-data.json'; a.click()
    URL.revokeObjectURL(a.href)
    toast({ title: 'Data exported', tone: 'success' })
  }
  return (
    <div className="stack-lg settings">
      <PageHeader eyebrow="Preferences" title="Settings" />
      <SectionTabs items={profileTabs} />
      <Section title="Profile">
        <Card className="stack"><Input label="Name" value={state.user.name} onChange={(e) => actions.patchUser({ name: e.target.value })} />
          <Select label="Experience" value={state.user.level} onChange={(v) => actions.patchUser({ level: v })} options={['Beginner', 'Intermediate', 'Advanced']} /></Card>
      </Section>
      <Section title="Appearance & units">
        <Card className="stack">
          <div className="stack-sm"><span className="label">Theme</span><SegmentedControl label="Theme" value={s.theme} onChange={(v) => actions.patchSettings({ theme: v })} items={[{ id: 'system', label: 'System' }, { id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }]} /></div>
          <div className="stack-sm"><span className="label">Weight unit</span><SegmentedControl label="Weight unit" value={s.unit} onChange={(v) => actions.patchSettings({ unit: v })} items={[{ id: 'kg', label: 'Kilograms' }, { id: 'lb', label: 'Pounds' }]} /></div>
          <div className="stack-sm"><span className="label">Weekly workout target</span><SegmentedControl label="Weekly target" value={String(s.weeklyTarget)} onChange={(v) => actions.patchSettings({ weeklyTarget: Number(v) })} items={[2, 3, 4, 5, 6].map((n) => ({ id: String(n), label: String(n) }))} /></div>
        </Card>
      </Section>
      <Section title="Workout">
        <Card><Toggle label="Auto-start rest timer" description="Start a countdown after each completed set." checked={s.autoRest} onChange={(v) => actions.patchSettings({ autoRest: v })} /><Toggle label="Haptic feedback" description="Vibrate on set completion and when rest ends (device permitting)." checked={s.haptics} onChange={(v) => actions.patchSettings({ haptics: v })} /></Card>
      </Section>
      <Section title="Your data" eyebrow="Stored only on this device">
        <Card className="stack-sm">
          <p className="muted">Champion has no account or server in this prototype. Everything lives in your browser’s local storage.</p>
          <div className="row gap-2 wrap"><Button icon={Download} onClick={exportData}>Export data</Button><Button icon={RotateCcw} onClick={() => setConfirm('demo')}>Reload demo data</Button><Button icon={RefreshCw} onClick={() => { actions.restartOnboarding(); }} to="/onboarding">Replay onboarding</Button></div>
          <Button variant="danger" icon={Trash2} onClick={() => setConfirm('clear')}>Delete all data & start fresh</Button>
        </Card>
      </Section>
      <p className="caption">Champion prototype · keyboard shortcuts: <kbd className="kbd">/</kbd> search, <kbd className="kbd">g</kbd> then <kbd className="kbd">t</kbd> Today, <kbd className="kbd">w</kbd> Workouts, <kbd className="kbd">p</kbd> Progress, <kbd className="kbd">a</kbd> Coach.</p>
      <ConfirmSheet open={confirm === 'demo'} onClose={() => setConfirm(null)} title="Reload demo data?" body="This replaces everything with the sample profile (courses, history, goals)." confirmLabel="Reload demo" onConfirm={() => { actions.resetDemo(); toast({ title: 'Demo data loaded', tone: 'success' }) }} />
      <ConfirmSheet open={confirm === 'clear'} onClose={() => setConfirm(null)} tone="danger" title="Delete all data?" body="This removes every workout, goal and setting from this device. It cannot be undone." confirmLabel="Delete everything" onConfirm={() => { actions.clearAll(); toast({ title: 'Fresh start', body: 'All data removed.' }) }} />
    </div>
  )
}

export function NotFound() {
  return <EmptyState icon={RotateCcw} title="Page not found" body="That page doesn’t exist." action={<Button variant="primary" to="/today">Back to Today</Button>} />
}
