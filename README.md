# Well Said

A calm daily gym for natural English speaking. Well Said turns one short, realistic dialogue into a focused 7–10 minute workout: listen, notice, repeat, shadow, perform, and explore how stress changes meaning.

## What is included

- One uncluttered daily workout plus a searchable library of 184 hand-written dialogues across ten everyday situation families
- More than six calendar months of daily practice without a repeated workout, with speaking focus and difficulty (A2–C1) rotating through the catalog
- A guided Start Here path: new learners meet 14 gentle, fully voiced workouts first
- Model audio for every line, full dialogue, and expression in all 184 workouts, generated with ElevenLabs and loudness-normalized
- Full-dialogue and line-level playback with 0.75×, 1×, 1.25×, and looping
- Optional transcript, phrase grouping, structural stress marks, and coaching notes
- Browser-only microphone recording for private A/B listening
- Full shadowing, hidden/first-word transcript modes, and turn-by-turn role practice
- Explainable Stress Mode with a model performance of every option—no AI pronunciation scoring
- Focus Mode, slow reveal, and adjacent Model/Mine playback
- Versioned local progress based on actual speaking reps, practiced lines, and practice days
- Local theme and lightweight level/situation preferences
- Responsive WCAG-conscious UI, reduced-motion support, and an installable web manifest
- Typed lesson content, tests, CI, Pages deployment, and audio-production guidance

Every workout is an individually written, independently reviewed conversation with its own coach notes, reusable expressions, and contrastive-stress challenge. Every workout has model audio, including each Stress Mode option. If a line is edited later, the app falls back to a clearly labeled browser speech demo for that item until it is regenerated (see [audio production](docs/AUDIO_PRODUCTION.md)). Audio is wired in by a manifest, so new or human-studio recordings never require UI changes.

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

## Model audio

Audio generation needs ffmpeg and an ElevenLabs API key. The key is used only by local Node scripts and never reaches the browser bundle.

```bash
cp .env.example .env.local     # add ELEVENLABS_API_KEY
npm run audio:plan             # pending files, credits needed, and credits remaining
npm run audio:generate         # Start Here by default; see the guide for options
npm run audio:check            # files, fingerprints, loudness, and size
npm run audio:retakes          # apply Stress Mode re-take decisions
```

See [audio production](docs/AUDIO_PRODUCTION.md) for selection flags, voices, processing, and licensing.

## Project map

```text
src/
  app/          Application shell and URL state
  components/   Reusable presentation components
  content/      Hand-written catalog (catalog/), composition, audio manifest, and tests
  hooks/        Audio, recording, and local progress adapters
  lib/          Small framework-free helpers
  screens/      Home and workout screen composition
  workout/      The five workout steps
scripts/audio/  ElevenLabs + ffmpeg model-audio pipeline (Node only)
docs/           Architecture, authoring, audio, and deployment guides
content/        Audio briefs, provenance, and Stress Mode review decisions
public/audio/   Generated model audio, one folder per lesson
```

Read [Architecture](docs/ARCHITECTURE.md), [curriculum design](docs/CURRICULUM.md), [lesson authoring](docs/CONTENT_GUIDE.md), [audio production](docs/AUDIO_PRODUCTION.md), and [deployment](docs/DEPLOYMENT.md) before making substantial changes.

## Product principles

1. One complete workout is a genuine stopping point.
2. Transcript support is progressive, never withheld.
3. Repetitions are encouraged, never used as a gate.
4. Progress rewards showing up and lifetime practice, not guilt or fragile streaks.
5. The app supports clearer, more expressive speech; it does not promise to erase accents.

## License

No license has been selected yet. All rights are reserved by the repository owner.
