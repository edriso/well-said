# Well Said

A calm daily gym for natural English speaking. Well Said turns one short, realistic dialogue into a focused 7–10 minute workout: listen, notice, repeat, shadow, perform, and explore how stress changes meaning.

## What is included

- One uncluttered daily workout plus a small lesson library
- Full-dialogue and line-level playback with 0.75×, 1×, 1.25×, and looping
- Optional transcript, phrase grouping, structural stress marks, and coaching notes
- Browser-only microphone recording for private A/B listening
- Full shadowing, hidden/first-word transcript modes, and two-role practice
- Static, explainable Stress Mode—no fake AI scoring
- Versioned local progress with lifetime sentences and speaking reps
- Responsive WCAG-conscious UI, reduced-motion support, and an installable web manifest
- Typed lesson content, tests, CI, Pages deployment, and per-lesson audio briefs

The current model audio is a clearly labeled browser speech placeholder. Studio files can be dropped in later without changing the lesson UI.

## Start locally

Requires Node 24.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. Useful commands:

```bash
npm run lint
npm test
npm run build
npm run check
```

## Project map

```text
src/
  app/          Application shell and URL state
  components/   Reusable presentation components
  content/      Typed curriculum and content validation
  hooks/        Audio, recording, and local progress adapters
  screens/      Home and workout screen composition
  workout/      The five workout steps
docs/           Architecture, authoring, audio, and deployment guides
content/        Human/AI production briefs for lesson audio
public/audio/   Final audio target (placeholder documentation only)
```

Read [Architecture](docs/ARCHITECTURE.md), [lesson authoring](docs/CONTENT_GUIDE.md), [audio production](docs/AUDIO_PRODUCTION.md), and [deployment](docs/DEPLOYMENT.md) before making substantial changes.

## Product principles

1. One complete workout is a genuine stopping point.
2. Transcript support is progressive, never withheld.
3. Repetitions are encouraged, never used as a gate.
4. Progress rewards showing up and lifetime practice, not guilt or fragile streaks.
5. The app supports clearer, more expressive speech; it does not promise to erase accents.

## License

No license has been selected yet. All rights are reserved by the repository owner.
