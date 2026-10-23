# Champion — Fitness OS

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

## Honest scope

There is no backend. The AI coach is a **rule-based** engine over your logged data (not a language model). Wearable/health data, community members, leaderboards and subscription are **mock data**. Exercise "demonstrations" are a muscle map and movement guide — no video is bundled. All data lives in your browser; **Settings → Delete all data** starts completely fresh and **Reload demo data** restores the sample profile.
