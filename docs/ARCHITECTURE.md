# Architecture

## Runtime shape

Well Said is a static React 19 application built by Vite and hosted below the `/well-said/` GitHub Pages base. It intentionally has no API, account, or server dependency at runtime. Model audio is generated ahead of time by a Node-only pipeline (`scripts/audio/`) and committed as static files. The URL uses a `?workout=<lesson-id>` query so a workout can be refreshed or shared without requiring a server-side SPA fallback.

The app has three kinds of state:

- Curriculum is immutable typed data composed in `src/content/lessons.ts`. Four foundational lessons and ten replacement lessons form the editorially reviewed Start Here collection. The remaining roadmap is produced from scenario seeds and category dialogue frames in `src/content/generatedCurriculum.ts`, grouped into packs, and marked `draft` until reviewed.
- Workout UI state (step, active line, speed, transcript mode) stays in the relevant React component.
- Durable learning progress is handled by `useProgress` and written to `well-said:progress:v2` in localStorage. Theme and lightweight personalization use separate versioned keys.

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

Recommendations first walk new learners through the reviewed Start Here collection in order (a workout finished today stays as today’s card), then hand over to the daily scheduler. The daily scheduler converts the learner’s local calendar date into a continuous civil-day ordinal relative to 1 January 2026. It does not reset at New Year. With 184 lessons, any 184 consecutive dates map to distinct workouts.

## Audio boundary

Audio fields on lessons are filled in by `attachAudio` (`src/content/audio.ts`) from the generated `audio-manifest.json`. A file is attached only when the fingerprint of the text it was recorded from matches the current text, so edited content can never play outdated audio. See `AUDIO_PRODUCTION.md`.

`useLessonAudio` is the single playback adapter. It accepts an optional repository-relative source and otherwise uses browser speech synthesis as an explicit demo fallback. It can play dialogue lines as a sequence so fallback voices and conversational gaps are preserved. Only one source plays at a time, and route/step changes stop it. Do not invoke `Audio`, `speechSynthesis`, or autoplay from presentation components outside this adapter.

`useRecorder` uses `getUserMedia` and `MediaRecorder`. Its object URL lives only in memory; nothing is uploaded or persisted. Permission refusal is an expected state, not an error that blocks a workout.

## Progress contract

The current stored schema is:

```ts
type ProgressState = {
  version: 2;
  lessons: Record<string, {
    completedAt?: string;
    lastPracticedAt?: string;
    repsByLine: Record<string, number>;
    lastStep: number;
    lastLineIndex?: number;
    felt?: 'easy' | 'right' | 'hard';
  }>;
  totalReps: number;
};
```

The v1-to-v2 migration preserves completions and reps while dropping the old inferred `totalSentences` value. Never mutate this shape without increasing the version and adding a tested migration. Completion preserves its first completion date; spoken-line and weekly-day totals are derived from actual rep/practice records.

## Styling

Tailwind 4 supplies the CSS pipeline, while the branded design is expressed as small semantic classes in `src/styles.css`. This avoids a runtime component kit and keeps accessibility states auditable. Design tokens live at `:root`. The UI must continue to work at 320 CSS px, 200% zoom, keyboard-only input, and reduced-motion preference.

## Deliberate constraints

- No pronunciation scoring without a validated feedback model and transparent uncertainty.
- No inaccurate word-level karaoke without approved timing metadata.
- No rigid repetition gate; three reps is guidance.
- No remote analytics, auth, or recording upload in this version.
- No router dependency while the app has only Home and Workout.
