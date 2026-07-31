# Architecture

## Runtime shape

Well Said is a static React 19 application built by Vite and hosted below the `/well-said/` GitHub Pages base. It intentionally has no API, account, or server dependency. The URL uses a `?workout=<lesson-id>` query so a workout can be refreshed or shared without requiring a server-side SPA fallback.

The app has three kinds of state:

- Curriculum is immutable typed data in `src/content/lessons.ts`.
- Workout UI state (step, active line, speed, transcript mode) stays in the relevant React component.
- Durable learning progress is handled by `useProgress` and written to `well-said:progress:v1` in localStorage.

Keeping these boundaries separate makes it possible to replace audio, expand the curriculum, or add a backend later without rewriting the practice UI.

## Main flow

```text
Home
 └─ Workout
     ├─ Listen        full context; optional transcript
     ├─ Practice      line playback, stress, phrase groups, reps, recording
     ├─ Shadow        full dialogue, transcript support, role practice
     ├─ Stress        one manually authored contrastive-stress challenge
     └─ Complete      calm summary and reusable expressions
```

The workout is a linear state machine. Learners can revisit completed steps, but incomplete future steps are disabled. Completed workouts restart at Listen when opened again.

## Audio boundary

`useLessonAudio` is the single playback adapter. It accepts an optional repository-relative source and otherwise uses browser speech synthesis as an explicit demo fallback. Only one source plays at a time, and route/step changes stop it. Do not invoke `Audio`, `speechSynthesis`, or autoplay from presentation components outside this adapter.

`useRecorder` uses `getUserMedia` and `MediaRecorder`. Its object URL lives only in memory; nothing is uploaded or persisted. Permission refusal is an expected state, not an error that blocks a workout.

## Progress contract

The current stored schema is:

```ts
type ProgressState = {
  version: 1;
  lessons: Record<string, {
    completedAt?: string;
    repsByLine: Record<string, number>;
    lastStep: number;
  }>;
  totalSentences: number;
  totalReps: number;
};
```

Never mutate this shape without increasing the version and adding a tested migration. Completion is idempotent: repeating a workout can add reps but must not add its lines to `totalSentences` twice.

## Styling

Tailwind 4 supplies the CSS pipeline, while the branded design is expressed as small semantic classes in `src/styles.css`. This avoids a runtime component kit and keeps accessibility states auditable. Design tokens live at `:root`. The UI must continue to work at 320 CSS px, 200% zoom, keyboard-only input, and reduced-motion preference.

## Deliberate constraints

- No pronunciation scoring without a validated feedback model and transparent uncertainty.
- No inaccurate word-level karaoke without approved timing metadata.
- No rigid repetition gate; three reps is guidance.
- No remote analytics, auth, or recording upload in this version.
- No router dependency while the app has only Home and Workout.
