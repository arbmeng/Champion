/* Champion service worker — generated at build time (see vite.config.js).
   Strategy: precache the whole app shell so every screen works offline; keep content.json fresh
   with network-first; tell open pages when a new version or new content is available. */
const VERSION = '__VERSION__'
const SHELL = `champion-shell-${VERSION}`
const RUNTIME = 'champion-runtime'
const PRECACHE = __PRECACHE__
const scope = self.registration.scope
const abs = (p) => new URL(p, scope).href

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE.map(abs))))
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((k) => k.startsWith('champion-shell-') && k !== SHELL).map((k) => caches.delete(k)))
    await self.clients.claim()
  })())
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

async function networkFirst(request, cacheName, timeoutMs = 4000) {
  const cache = await caches.open(cacheName)
  try {
    const fresh = await Promise.race([fetch(request), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs))])
    if (fresh && fresh.ok) cache.put(request, fresh.clone())
    return fresh
  } catch {
    const hit = await cache.match(request, { ignoreSearch: true })
    if (hit) return hit
    throw new Error('offline')
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // App navigations: try the network briefly, fall back to the precached shell.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await Promise.race([fetch(request), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3500))])
        if (fresh && fresh.ok) return fresh
      } catch { /* offline — use the shell */ }
      return (await caches.match(abs('index.html'))) || (await caches.match(abs('./'))) || Response.error()
    })())
    return
  }

  // Fresh content catalogue (sync): network-first so new data arrives as soon as we are online.
  if (url.pathname.endsWith('/content.json')) {
    event.respondWith(networkFirst(request, RUNTIME).catch(() => new Response('{}', { status: 503, headers: { 'content-type': 'application/json' } })))
    return
  }

  // Everything else is hashed/static: serve from the precache, fall back to the network and remember it.
  event.respondWith((async () => {
    const hit = await caches.match(request, { ignoreSearch: true })
    if (hit) return hit
    try {
      const res = await fetch(request)
      if (res.ok) (await caches.open(RUNTIME)).put(request, res.clone())
      return res
    } catch {
      return Response.error()
    }
  })())
})

// Background Sync (Chromium): refresh content when connectivity returns, even if the page is closed.
self.addEventListener('sync', (event) => {
  if (event.tag !== 'champion-content') return
  event.waitUntil((async () => {
    const res = await fetch(abs(`content.json?ts=${Date.now()}`), { cache: 'no-store' })
    if (res.ok) {
      await (await caches.open(RUNTIME)).put(abs('content.json'), res.clone())
      const all = await self.clients.matchAll({ includeUncontrolled: true })
      all.forEach((c) => c.postMessage({ type: 'CONTENT_SYNCED' }))
    }
  })())
})
