# Well Said

A calm daily gym for natural English speaking. Well Said turns one short, realistic dialogue into a focused 7–10 minute workout: listen, notice, repeat, shadow, perform, and explore how stress changes meaning.

## What is included

- One uncluttered daily workout plus a searchable roadmap of 184 distinct workouts
- More than six calendar months of daily practice without a repeated workout
- Model audio, generated with ElevenLabs and loudness-normalized, for all of Start Here and a growing share of the catalog (labeled “Model audio” in the library)
- Full-dialogue and line-level playback with 0.75×, 1×, 1.25×, and looping
- Optional transcript, phrase grouping, structural stress marks, and coaching notes
- Browser-only microphone recording for private A/B listening
- Full shadowing, hidden/first-word transcript modes, and turn-by-turn role practice
- Static, explainable Stress Mode—no fake AI scoring or synthetic stress comparison
- Focus Mode, slow reveal, and adjacent Model/Mine playback
- Versioned local progress based on actual speaking reps, practiced lines, and practice days
- Local theme and lightweight level/situation preferences
- Responsive WCAG-conscious UI, reduced-motion support, and an installable web manifest
- Typed lesson content, tests, CI, Pages deployment, and audio-production guidance

New learners start with the 14-workout Start Here collection, which has received a dedicated editorial pass and has model audio for every line, the full dialogue, and every expression. The other curriculum packs remain explicitly marked as drafts; some already have model audio, and the rest use a clearly labeled browser speech demo until their audio is generated. Audio is wired in by a manifest, so new or human-studio recordings never require UI changes.

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
npm run audio:plan             # cost, size, and remaining credits
npm run audio:generate         # Start Here by default; see the guide for options
npm run audio:check            # files, fingerprints, loudness, and size
```

See [audio production](docs/AUDIO_PRODUCTION.md) for selection flags, voices, processing, and licensing.

## Project map

```text
src/
  app/          Application shell and URL state
  components/   Reusable presentation components
  content/      Typed lessons, generated catalog, audio manifest, and validation
  hooks/        Audio, recording, and local progress adapters
  lib/          Small framework-free helpers
  screens/      Home and workout screen composition
  workout/      The five workout steps
scripts/audio/  ElevenLabs + ffmpeg model-audio pipeline (Node only)
docs/           Architecture, authoring, audio, and deployment guides
content/        Audio performance briefs and audio provenance
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
