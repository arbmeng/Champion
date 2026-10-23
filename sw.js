/* Champion service worker — generated at build time (see vite.config.js).
   Strategy: precache the whole app shell so every screen works offline; keep content.json fresh
   with network-first; tell open pages when a new version or new content is available. */
const VERSION = '97d117875f'
const SHELL = `champion-shell-${VERSION}`
const RUNTIME = 'champion-runtime'
const PRECACHE = ["assets/manrope-latin-500-normal-BYYD-dBL.woff2","assets/manrope-latin-600-normal-4f0koTD-.woff2","assets/manrope-latin-400-normal-PaqtzbVb.woff2","assets/manrope-latin-800-normal-BfWYOv1c.woff2","assets/newsreader-latin-500-normal-B66TYsaK.woff2","assets/manrope-latin-700-normal-BZp_XxE4.woff2","assets/newsreader-latin-700-normal-rIgV_oaK.woff2","assets/vazirmatn-arabic-400-normal-DMZFCm7K.woff2","assets/vazirmatn-arabic-500-normal-C_lbnnKa.woff2","assets/newsreader-latin-600-normal-30OJ_TG_.woff2","assets/vazirmatn-arabic-600-normal-CPKvAnd1.woff2","assets/vazirmatn-arabic-700-normal-Dge_DOjm.woff2","assets/vazirmatn-arabic-800-normal-Bwnt96zj.woff2","assets/vazirmatn-latin-500-normal-6zZzgpg4.woff2","assets/vazirmatn-latin-400-normal-BT_DHTc7.woff2","assets/vazirmatn-latin-700-normal-9BlbvDRV.woff2","assets/vazirmatn-latin-800-normal-e0EQwLmk.woff2","assets/vazirmatn-latin-600-normal-D-zF-Oec.woff2","assets/manrope-latin-500-normal-DMZssgOp.woff","assets/manrope-latin-600-normal-BqgrALkZ.woff","assets/manrope-latin-400-normal-8tf8FM3T.woff","assets/manrope-latin-800-normal-uHUdIJgA.woff","assets/newsreader-latin-500-normal-DFwuUcdu.woff","assets/manrope-latin-700-normal-DGRFkw-m.woff","assets/newsreader-latin-700-normal-CluIqIw6.woff","assets/vazirmatn-arabic-400-normal-C4W5XURk.woff","assets/vazirmatn-arabic-500-normal-Dqq3-xo3.woff","assets/newsreader-latin-600-normal-DUnT2r2g.woff","assets/vazirmatn-arabic-600-normal-CWYTfCgi.woff","assets/vazirmatn-arabic-800-normal-BH12s3-y.woff","assets/vazirmatn-arabic-700-normal-B5nPuCFv.woff","assets/vazirmatn-latin-400-normal-GKyMcI03.woff","assets/vazirmatn-latin-500-normal-Bg_BALlD.woff","assets/vazirmatn-latin-700-normal-DrB0PBU6.woff","assets/vazirmatn-latin-600-normal-BxJiDPKT.woff","assets/vazirmatn-latin-800-normal-fM8Xz9cI.woff","assets/index-B2uqB76j.css","assets/index-57HF-VxE.js","assets/Today-zZfDAJuh.js","assets/Courses-DQbMQPLd.js","assets/Workouts-Cg2C3QZu.js","assets/Session-Cwnw9MlE.js","assets/minus-BQBY_x45.js","assets/Complete-CfDjLC17.js","assets/Exercises-Dc4NMMtL.js","assets/sliders-horizontal-ft82mlKe.js","assets/pickers-D_56fWgg.js","assets/Progress-rj0z0CpV.js","assets/History-BYxzp5-p.js","assets/useStart-BS7PShfN.js","assets/chevron-left-BSNcPLej.js","assets/clock-_6t-PP13.js","assets/Goals-B0KwjzJK.js","assets/Challenges-CFiH-UCm.js","assets/Community-CQy1hmXZ.js","assets/Coach-CzhPbiV5.js","assets/send-XYhDSF8Z.js","assets/Nutrition-B5afLGVi.js","assets/plus-Eq9FwzrW.js","assets/Recovery-C1d0uWp6.js","assets/charts-DPCUUedh.js","assets/Profile-YPgL9OYI.js","assets/Settings-BVhl9Vo0.js","assets/sections-DXwuDsDX.js","assets/Notifications-AvYieies.js","assets/trash-Cz-WyfWY.js","assets/Onboarding-BEmd5cd8.js","assets/domain-CtW0XLe8.js","assets/art-DGAQ1Scy.js","assets/award-BswBwSiD.js","assets/trophy-C-_n9SMz.js","./","manifest.webmanifest","content.json","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","icons/apple-touch-180.png","icons/icon.svg"]
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
