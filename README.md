# Champion — Fitness OS

**Kurdish (Central / Sorani) is the primary language**, with full right-to-left layout. English is available in Settings → Language. Installable as a PWA and fully usable offline.

A complete, working React prototype of a fitness operating system: follow multi-week **courses**, start today's workout in one tap, **log sets** with previous performance in view, and watch every completed session update history, course progress, weekly stats, PRs, streaks, goals and achievements.

## Run locally

```sh
npm install
npm run dev      # http://localhost:5173/Champion/
npm run build    # production build in dist/
```

## What's inside

| Area | Routes |
| --- | --- |
| Today (next session, course, snapshot, insight) | `/today` |
| Courses, course detail, weekly schedule | `/courses`, `/courses/:id` |
| Workout library, detail, builder | `/workouts`, `/workouts/:id`, `/workouts/new` |
| Active workout + completion | `/workout/:id/session`, `/complete/:logId` |
| Exercise encyclopedia + detail | `/exercises`, `/exercises/:id` |
| Progress (strength, volume, muscles, PRs, consistency, body) | `/progress?tab=` |
| History (calendar, workouts, exercises) | `/history`, `/history/:logId` |
| Goals, challenges, community, leaderboards | `/goals`, `/challenges`, `/community` |
| AI coach, nutrition, recovery | `/coach`, `/nutrition`, `/recovery` |
| Profile, settings, notifications, onboarding | `/profile`, `/settings`, `/notifications`, `/onboarding` |

Keyboard shortcuts: `/` search · `g` then `t/c/w/e/p/h/o/m/a/n/r` to navigate · `Enter` completes the open set in a workout.

## Architecture

- `src/state/store.jsx` — one reducer + context for all app state, persisted to `localStorage`.
- `src/state/selectors.js` — pure derivations (PRs, volume, streaks, course progress, goals, achievements, recovery). Screens never duplicate this logic.
- `src/state/seed.js` — deterministic demo profile generated relative to today's date.
- `src/data/*` — exercises (47), workouts (20), courses (4), social, challenges, foods.
- `src/ui/*` — design system: primitives, overlays (sheet/modal/drawer/toast), charts, art, domain components.
- `src/styles/*` — tokens (light + dark), base, components, layout, pages.
- Routing is `HashRouter` so it works on GitHub Pages; pages are lazy-loaded.

## Kurdish (Sorani) & RTL

- Default language is `ckb` with `dir="rtl"`; switching to English in Settings reloads the app (`src/lib/i18n.js`).
- Strings are English source text used as keys: `tr('Week {0} of {1}', 6, 12)`. Translations live in `src/i18n/ckb-*.js`; anything missing falls back to English. In the browser console, `window.__i18nMissing` lists untranslated keys.
- Layout uses logical CSS properties; charts and numeric steppers stay left-to-right on purpose. Kurdish month/day names are built in. Fonts (Manrope + Noto Sans Arabic) are bundled for offline use.
- Translations were written by an AI model — **have a native Sorani speaker review them** before a public launch.

## PWA, offline & sync

- `vite.config.js` generates `sw.js` with the full build file list, so every screen works offline after the first load.
- **Pull sync:** when online (on start, on reconnect, and every 10+ minutes on focus) the app checks for a new app version and fetches `content.json`. A higher `version` adds new workouts, feed posts and notifications. Edit `public/content.json` and redeploy to ship new content without an app update.
- **Your data** (workouts, goals, settings) is saved on-device. There is no backend, so nothing is uploaded; use Settings → Export / Import to move data between devices.
- An update banner appears when a new version is ready; offline/online state shows in the top bar.

## Week plan

On Today, *Choose another day* lists the current course week by weekday (e.g. Mon / Wed / Fri / Sat). On Mondays, Wednesday's session is offered directly. Picking a session makes it today's workout; the rest of the plan stays in order.

## Honest scope

There is no backend. The AI coach is a **rule-based** engine over your logged data (not a language model). Wearable/health data, community members, leaderboards and subscription are **mock data**. Exercise "demonstrations" are a muscle map and movement guide — no video is bundled. All data lives in your browser (no cloud account); **Settings → Delete all data** starts completely fresh and **Reload demo data** restores the sample profile.
