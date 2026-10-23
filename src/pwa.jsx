import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from './state/store'
import { useToast } from './ui/overlays'
import { tr } from './lib/i18n'

const PwaContext = createContext(null)
const BASE = import.meta.env.BASE_URL

export function PwaProvider({ children }) {
  const { state, actions } = useApp()
  const toast = useToast()
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const [updateReady, setUpdateReady] = useState(false)
  const [installEvent, setInstallEvent] = useState(null)
  const [installed, setInstalled] = useState(() => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true)
  const [syncing, setSyncing] = useState(false)
  const reg = useRef(null)
  const latest = useRef(state)
  latest.current = state

  // Pull the latest content catalogue. Everything the user logs is already saved on this device.
  const syncNow = useCallback(async ({ quiet = false } = {}) => {
    if (!navigator.onLine) { if (!quiet) toast({ title: tr('You’re offline'), body: tr('Everything is saved on this device and will sync when you reconnect.'), tone: 'warning' }); return { ok: false } }
    setSyncing(true)
    try {
      reg.current?.update().catch(() => {})
      const res = await fetch(`${BASE}content.json?ts=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const content = await res.json()
      const isNew = typeof content.version === 'number' && content.version > (latest.current.remote?.version || 0)
      actions.applyRemote(content)
      if (isNew) toast({ title: tr('New content synced'), body: tr('Fresh workouts and updates were added.'), tone: 'success' })
      else if (!quiet) toast({ title: tr('Everything is up to date'), tone: 'success' })
      return { ok: true, isNew }
    } catch {
      if (!quiet) toast({ title: tr('Couldn’t sync right now'), body: tr('We’ll try again when the connection is stable.'), tone: 'warning' })
      return { ok: false }
    } finally {
      setSyncing(false)
    }
  }, [actions, toast])

  const syncRef = useRef(syncNow)
  syncRef.current = syncNow

  // Service worker registration + update detection (production only).
  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return undefined
    let cancelled = false
    const onMessage = (e) => { if (e.data?.type === 'CONTENT_SYNCED') syncRef.current({ quiet: true }) }
    navigator.serviceWorker.addEventListener('message', onMessage)
    navigator.serviceWorker.register(`${BASE}sw.js`).then((r) => {
      if (cancelled) return
      reg.current = r
      if (r.waiting && navigator.serviceWorker.controller) setUpdateReady(true)
      r.addEventListener('updatefound', () => {
        const w = r.installing
        w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) setUpdateReady(true) })
      })
    }).catch(() => {})
    let reloading = false
    const onCtl = () => { if (reloading) return; reloading = true; window.location.reload() }
    navigator.serviceWorker.addEventListener('controllerchange', onCtl)
    return () => { cancelled = true; navigator.serviceWorker.removeEventListener('message', onMessage); navigator.serviceWorker.removeEventListener('controllerchange', onCtl) }
  }, [])

  // Connectivity: when we come back online, sync. When we go offline, ask the SW to sync later.
  useEffect(() => {
    const on = () => { setOnline(true); toast({ title: tr('Back online'), body: tr('Syncing your content…'), tone: 'success' }); syncRef.current({ quiet: true }) }
    const off = () => {
      setOnline(false)
      reg.current?.sync?.register('champion-content').catch(() => {})
    }
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    const onVis = () => {
      const last = latest.current.remote?.lastSync || 0
      if (document.visibilityState === 'visible' && navigator.onLine && Date.now() - last > 10 * 60 * 1000) syncRef.current({ quiet: true })
    }
    document.addEventListener('visibilitychange', onVis)
    const first = setTimeout(() => { if (navigator.onLine) syncRef.current({ quiet: true }) }, 1500)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); document.removeEventListener('visibilitychange', onVis); clearTimeout(first) }
  }, [toast])

  // Install prompt
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setInstallEvent(e) }
    const onInstalled = () => { setInstalled(true); setInstallEvent(null); toast({ title: tr('Champion is installed'), tone: 'success' }) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled) }
  }, [toast])

  const install = useCallback(async () => {
    if (!installEvent) return false
    installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    setInstallEvent(null)
    return outcome === 'accepted'
  }, [installEvent])

  const applyUpdate = useCallback(() => {
    const w = reg.current?.waiting
    if (w) w.postMessage('SKIP_WAITING')
    else window.location.reload()
  }, [])

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const value = useMemo(() => ({ online, syncing, updateReady, installed, canInstall: Boolean(installEvent), isIos, install, applyUpdate, syncNow }), [online, syncing, updateReady, installed, installEvent, isIos, install, applyUpdate, syncNow])
  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>
}

export const usePwa = () => useContext(PwaContext)
