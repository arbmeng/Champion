# Champion V2

Champion is a React strength-training companion focused on starting a session quickly, logging sets with previous performance in view, and seeing what changed after training.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`.

## Current demo scope

- Home training command center and today's Upper A session
- Active workout with editable sets, previous set history, add-exercise sheet, elapsed workout time, and automatic rest timer
- Finish summary with volume, set count, and personal record detection
- Progress, session history, exercise search and filters, profile preferences
- IndexedDB persistence for the demo profile and active workout, with a localStorage fallback when IndexedDB is unavailable

The app runs without a backend. Demo workout history and profile values live on this device. Authentication, cloud sync, and server backup are not connected; local demo data is not a production account or backup.
