/* Champion service worker — generated at build time (see vite.config.js).
   Strategy: precache the whole app shell so every screen works offline; keep content.json fresh
   with network-first; tell open pages when a new version or new content is available. */
const VERSION = '172d2f1d51'
const SHELL = `champion-shell-${VERSION}`
const RUNTIME = 'champion-runtime'
const PRECACHE = ["assets/manrope-latin-400-normal-PaqtzbVb.woff2","assets/manrope-latin-500-normal-BYYD-dBL.woff2","assets/manrope-latin-800-normal-BfWYOv1c.woff2","assets/manrope-latin-600-normal-4f0koTD-.woff2","assets/manrope-latin-700-normal-BZp_XxE4.woff2","assets/noto-sans-arabic-arabic-400-normal-AAMxebZb.woff2","assets/noto-sans-arabic-arabic-600-normal-JPxwL-XU.woff2","assets/noto-sans-arabic-arabic-700-normal-3CqrwsiZ.woff2","assets/noto-sans-arabic-arabic-500-normal-DPISWLls.woff2","assets/noto-sans-arabic-arabic-800-normal-BqK5sGSM.woff2","assets/manrope-latin-400-normal-8tf8FM3T.woff","assets/manrope-latin-500-normal-DMZssgOp.woff","assets/manrope-latin-800-normal-uHUdIJgA.woff","assets/manrope-latin-600-normal-BqgrALkZ.woff","assets/manrope-latin-700-normal-DGRFkw-m.woff","assets/noto-sans-arabic-arabic-400-normal-hsqIUL9Q.woff","assets/noto-sans-arabic-arabic-600-normal-JLzruTOp.woff","assets/noto-sans-arabic-arabic-700-normal-DXnsSW3z.woff","assets/noto-sans-arabic-arabic-500-normal-CoaTbVwZ.woff","assets/noto-sans-arabic-arabic-800-normal-X48NTV6W.woff","assets/index-DZZkNKh_.css","assets/index-D2FhHb0f.js","assets/Today-CidpBRR3.js","assets/Courses-DZFh_5Ek.js","assets/Workouts-8Ftns8wY.js","assets/Session-DlkN5IFD.js","assets/minus-CQ5u-zgZ.js","assets/Complete-fB936H4m.js","assets/Exercises-DJpD6QIB.js","assets/sliders-horizontal-BNbYW2C5.js","assets/pickers-7o97VWKS.js","assets/Progress-B9FoAKTG.js","assets/History-C5pLRG2r.js","assets/useStart-CNWRn7LT.js","assets/chevron-left-D08oSlJc.js","assets/Goals-CSiC4k2H.js","assets/Challenges-DPbG0wmL.js","assets/Community-ZLIOXH2a.js","assets/Coach-fNaLVtbM.js","assets/send-D6sBVcbk.js","assets/Nutrition-1Un8J1Iv.js","assets/plus-Dc4Mbzyc.js","assets/Recovery-DD48UTd_.js","assets/charts-D36kEaN8.js","assets/Profile-DegCuDtS.js","assets/Settings-BIp1mJ74.js","assets/trash-BoaTwmie.js","assets/sections-DTjNVxMd.js","assets/Notifications-QPZa6I4r.js","assets/Onboarding-BhW7FIw8.js","assets/domain-BssMiIHG.js","assets/art-ptUBEp9f.js","assets/award-7VR_pnA9.js","assets/trophy-DELUODpq.js","./","manifest.webmanifest","content.json","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","icons/apple-touch-180.png","icons/icon.svg"]
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
