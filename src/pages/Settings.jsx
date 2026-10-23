import { useRef, useState } from 'react'
import { Download, RefreshCw, RotateCcw, Smartphone, Trash2, Upload } from 'lucide-react'
import { usePwa } from '../pwa'
import { LANGS, lang, setLang, tr } from '../lib/i18n'
import { fmtDateTime } from '../lib/dates'
import { useApp } from '../state/store'
import { Button, Card, EmptyState, Input, PageHeader, Section, SectionTabs, SegmentedControl, Select, Toggle } from '../ui/primitives'
import { ConfirmSheet, useToast } from '../ui/overlays'
import { profileTabs } from '../ui/sections'

export function Settings() {
  const { state, actions } = useApp()
  const toast = useToast()
  const s = state.settings
  const [confirm, setConfirm] = useState(null)
  const pwa = usePwa()
  const fileRef = useRef(null)
  const importData = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      if (data?.v !== 1 || !Array.isArray(data.history)) throw new Error('bad file')
      actions.importData({ ...data, onboarded: true })
      toast({ title: tr("Data imported"), tone: 'success' })
    } catch { toast({ title: tr("That file isn’t a Champion export"), tone: 'danger' }) }
  }
  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 'champion-data.json'; a.click()
    URL.revokeObjectURL(a.href)
    toast({ title: tr("Data exported"), tone: 'success' })
  }
  return (
    <div className="stack-lg settings">
      <PageHeader eyebrow={tr("Preferences")} title={tr("Settings")} />
      <SectionTabs items={profileTabs} />
      <Section title={tr("Profile")}>
        <Card className="stack"><Input label={tr("Name")} value={state.user.name} onChange={(e) => actions.patchUser({ name: e.target.value })} />
          <Select label={tr("Experience")} value={state.user.level} onChange={(v) => actions.patchUser({ level: v })} options={['Beginner', 'Intermediate', 'Advanced']} /></Card>
      </Section>
      <Section title={tr("Language")}>
        <Card className="stack-sm"><SegmentedControl label={tr("Language")} value={lang} onChange={setLang} items={Object.entries(LANGS).map(([id, l]) => ({ id, label: l.name }))} /><p className="caption">{tr("Kurdish (Sorani) is the default. The app reloads when you switch.")}</p></Card>
      </Section>
      <Section title={tr("Appearance & units")}>
        <Card className="stack">
          <div className="stack-sm"><span className="label">{tr("Theme")}</span><SegmentedControl label={tr("Theme")} value={s.theme} onChange={(v) => actions.patchSettings({ theme: v })} items={[{ id: 'system', label: tr("System") }, { id: 'light', label: tr("Light") }, { id: 'dark', label: tr("Dark") }]} /></div>
          <div className="stack-sm"><span className="label">{tr("Weight unit")}</span><SegmentedControl label={tr("Weight unit")} value={s.unit} onChange={(v) => actions.patchSettings({ unit: v })} items={[{ id: 'kg', label: tr("Kilograms") }, { id: 'lb', label: tr("Pounds") }]} /></div>
          <div className="stack-sm"><span className="label">{tr("Weekly workout target")}</span><SegmentedControl label={tr("Weekly target")} value={String(s.weeklyTarget)} onChange={(v) => actions.patchSettings({ weeklyTarget: Number(v) })} items={[2, 3, 4, 5, 6].map((n) => ({ id: String(n), label: String(n) }))} /></div>
        </Card>
      </Section>
      <Section title={tr("Workout")}>
        <Card><Toggle label={tr("Auto-start rest timer")} description={tr("Start a countdown after each completed set.")} checked={s.autoRest} onChange={(v) => actions.patchSettings({ autoRest: v })} /><Toggle label={tr("Haptic feedback")} description={tr("Vibrate on set completion and when rest ends (device permitting).")} checked={s.haptics} onChange={(v) => actions.patchSettings({ haptics: v })} /></Card>
      </Section>
      <Section title={tr("Offline & sync")}>
        <Card className="stack-sm">
          <div className="row between"><span className="muted">{tr("Connection")}</span><b>{pwa.online ? tr("Online") : tr("Offline")}</b></div>
          <div className="row between"><span className="muted">{tr("Last content sync")}</span><b>{state.remote?.lastSync ? fmtDateTime(state.remote.lastSync) : tr("Not yet")}</b></div>
          <div className="row between"><span className="muted">{tr("Content version")}</span><b className="num">{state.remote?.version || 0}</b></div>
          <p className="caption">{tr("Champion works fully offline. Everything you log is saved on this device; when you’re online it checks for a new app version and pulls new workouts and updates.")}</p>
          <div className="row gap-2 wrap">
            <Button icon={RefreshCw} onClick={() => pwa.syncNow()} disabled={pwa.syncing}>{pwa.syncing ? tr("Syncing…") : tr("Sync now")}</Button>
            {pwa.canInstall && !pwa.installed && <Button variant="primary" icon={Smartphone} onClick={pwa.install}>{tr("Install app")}</Button>}
            {pwa.installed && <span className="badge badge-success">{tr("Installed")}</span>}
          </div>
          {pwa.isIos && !pwa.installed && <p className="caption">{tr("On iPhone or iPad: tap Share, then “Add to Home Screen”.")}</p>}
        </Card>
      </Section>
      <Section title={tr("Your data")} eyebrow={tr("Stored only on this device")}>
        <Card className="stack-sm">
          <p className="muted">{tr("Champion has no account or server in this prototype. Everything lives in your browser’s local storage.")}</p>
          <div className="row gap-2 wrap"><Button icon={Download} onClick={exportData}>{tr("Export data")}</Button><Button icon={Upload} onClick={() => fileRef.current?.click()}>{tr("Import data")}</Button><input ref={fileRef} type="file" accept="application/json" hidden onChange={importData} /><Button icon={RotateCcw} onClick={() => setConfirm('demo')}>{tr("Reload demo data")}</Button><Button icon={RefreshCw} onClick={() => { actions.restartOnboarding(); }} to="/onboarding">{tr("Replay onboarding")}</Button></div>
          <Button variant="danger" icon={Trash2} onClick={() => setConfirm('clear')}>{tr("Delete all data & start fresh")}</Button>
        </Card>
      </Section>
      <p className="caption">{tr("Champion prototype · keyboard shortcuts:")} <kbd className="kbd">/</kbd> {tr("search,")} <kbd className="kbd">g</kbd> {tr("then")} <kbd className="kbd">t</kbd> {tr("Today,")} <kbd className="kbd">w</kbd> {tr("Workouts,")} <kbd className="kbd">p</kbd> {tr("Progress,")} <kbd className="kbd">a</kbd> {tr("Coach.")}</p>
      <ConfirmSheet open={confirm === 'demo'} onClose={() => setConfirm(null)} title={tr("Reload demo data?")} body={tr("This replaces everything with the sample profile (courses, history, goals).")} confirmLabel={tr("Reload demo")} onConfirm={() => { actions.resetDemo(); toast({ title: tr("Demo data loaded"), tone: 'success' }) }} />
      <ConfirmSheet open={confirm === 'clear'} onClose={() => setConfirm(null)} tone="danger" title={tr("Delete all data?")} body={tr("This removes every workout, goal and setting from this device. It cannot be undone.")} confirmLabel={tr("Delete everything")} onConfirm={() => { actions.clearAll(); toast({ title: tr("Fresh start"), body: tr("All data removed.") }) }} />
    </div>
  )
}

export function NotFound() {
  return <EmptyState icon={RotateCcw} title={tr("Page not found")} body={tr("That page doesn’t exist.")} action={<Button variant="primary" to="/today">{tr("Back to Today")}</Button>} />
}
