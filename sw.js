/* Champion service worker — generated at build time (see vite.config.js).
   Strategy: precache the whole app shell so every screen works offline; keep content.json fresh
   with network-first; tell open pages when a new version or new content is available. */
const VERSION = '3c572767fc'
const SHELL = `champion-shell-${VERSION}`
const RUNTIME = 'champion-runtime'
const PRECACHE = ["assets/manrope-latin-400-normal-PaqtzbVb.woff2","assets/manrope-latin-500-normal-BYYD-dBL.woff2","assets/manrope-latin-600-normal-4f0koTD-.woff2","assets/manrope-latin-700-normal-BZp_XxE4.woff2","assets/manrope-latin-800-normal-BfWYOv1c.woff2","assets/noto-sans-arabic-arabic-400-normal-AAMxebZb.woff2","assets/noto-sans-arabic-arabic-500-normal-DPISWLls.woff2","assets/noto-sans-arabic-arabic-600-normal-JPxwL-XU.woff2","assets/noto-sans-arabic-arabic-700-normal-3CqrwsiZ.woff2","assets/noto-sans-arabic-arabic-800-normal-BqK5sGSM.woff2","assets/newsreader-latin-500-normal-B66TYsaK.woff2","assets/newsreader-latin-600-normal-30OJ_TG_.woff2","assets/noto-naskh-arabic-arabic-500-normal-9HZNyGfq.woff2","assets/newsreader-latin-700-normal-rIgV_oaK.woff2","assets/noto-naskh-arabic-arabic-700-normal-BdBAMxnO.woff2","assets/noto-naskh-arabic-arabic-600-normal-G5n5bgdQ.woff2","assets/manrope-latin-400-normal-8tf8FM3T.woff","assets/manrope-latin-500-normal-DMZssgOp.woff","assets/manrope-latin-600-normal-BqgrALkZ.woff","assets/manrope-latin-700-normal-DGRFkw-m.woff","assets/noto-sans-arabic-arabic-400-normal-hsqIUL9Q.woff","assets/manrope-latin-800-normal-uHUdIJgA.woff","assets/noto-sans-arabic-arabic-500-normal-CoaTbVwZ.woff","assets/noto-sans-arabic-arabic-600-normal-JLzruTOp.woff","assets/newsreader-latin-500-normal-DFwuUcdu.woff","assets/newsreader-latin-600-normal-DUnT2r2g.woff","assets/noto-sans-arabic-arabic-700-normal-DXnsSW3z.woff","assets/newsreader-latin-700-normal-CluIqIw6.woff","assets/noto-sans-arabic-arabic-800-normal-X48NTV6W.woff","assets/noto-naskh-arabic-arabic-500-normal-C1qSLoTD.woff","assets/noto-naskh-arabic-arabic-600-normal-DaTr67aF.woff","assets/noto-naskh-arabic-arabic-700-normal-fm10sHOa.woff","assets/index-_X9c-R6c.css","assets/index-CTwaoBdu.js","assets/Today-D5Br3X6y.js","assets/Courses-JxsndsNH.js","assets/Workouts-CwHl0H_8.js","assets/Session-ei2-2-CP.js","assets/minus-BEVxPUXc.js","assets/Complete-kLcTZ0bJ.js","assets/Exercises-BTqxbmjk.js","assets/sliders-horizontal-DABL2KOS.js","assets/pickers-Cjac0b_q.js","assets/Progress-D7G7aaSf.js","assets/History-CDEuA75J.js","assets/useStart-BFCoAq2e.js","assets/chevron-left-mzjjHeW0.js","assets/clock-O-4-qq2O.js","assets/Goals-D-BH-Yq1.js","assets/Challenges-CpdXVup-.js","assets/Community-BuXg5vab.js","assets/Coach-CuWognO1.js","assets/send-CXrlIDQJ.js","assets/Nutrition-DC1yfAal.js","assets/plus-AT6bJ1m2.js","assets/Recovery-BeSn2bc5.js","assets/charts-Bxury1dD.js","assets/Profile-DXHHp29u.js","assets/Settings-CfgtcrMi.js","assets/trash-Bt1D8BiH.js","assets/sections-BB3amb5Q.js","assets/Notifications-Rd070wNC.js","assets/Onboarding-BgbeggfX.js","assets/domain-BqwzLr-t.js","assets/art-DwoSFczQ.js","assets/award-CBT7jQt4.js","assets/trophy-D0bWtt9O.js","./","manifest.webmanifest","content.json","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","icons/apple-touch-180.png","icons/icon.svg"]
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
