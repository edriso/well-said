# Audio production

Model audio is produced by a small, reproducible pipeline in `scripts/audio/` that uses ElevenLabs text-to-speech and ffmpeg. Any line without a current recording falls back to the browser speech demo, so the app always works.

## Setup

Requirements: Node 24, ffmpeg (`brew install ffmpeg`), and an ElevenLabs API key.

```bash
cp .env.example .env.local   # then set ELEVENLABS_API_KEY
npm run audio:voices         # optional: list voices your key can use
```

The key is read only by the Node scripts. It is never bundled into the web app. Do not give it a `VITE_` prefix.

## Commands

```bash
npm run audio:plan                         # characters, files, size, remaining credits
npm run audio:generate                     # Start Here collection (default)
npm run audio:generate -- --lesson=ordering-coffee,catching-up
npm run audio:generate -- --collection="Workplace Conversations" --limit=5
npm run audio:generate -- --all            # entire catalog (~93k characters)
npm run audio:check                        # validate files, fingerprints, loudness, size
npm run audio:prune                        # drop recordings whose text changed (after rewrites)
```

Generation is incremental and resumable. Unchanged files are skipped. Raw API responses are cached in `.cache/audio-raw/` (git-ignored), so `--force` re-processes from the cache without spending credits; add `--fresh` to synthesize again. The manifest is saved after every lesson, so an interrupted run (for example, when credits run out) keeps finished lessons.

## What a lesson gets

```text
public/audio/lessons/<lesson-id>/
  <line-id>.mp3        one clean file per dialogue line (e.g. coffee-1.mp3)
  full.mp3             the lines joined with natural turn gaps
  expression-01.mp3    one file per reusable expression
  stress-<word>.mp3    opt-in, see below
```

Files are named by durable line IDs, so reordering lines never mismatches audio. Paths are relative to `public/`; the playback adapter adds `import.meta.env.BASE_URL`.

## How audio stays in sync with text

`src/content/audio-manifest.json` records a fingerprint of the exact text each file was performed from. `attachAudio` in `src/content/audio.ts` wires a file into a lesson only when the fingerprint still matches. If an author edits a line:

- The app ignores the stale file and uses the browser voice for that line.
- `npm test` fails and tells you to run `npm run audio:generate`, or `npm run audio:prune` if you want to ship the text change before re-recording.

`content/audio-provenance.json` records the provider, model, voice per speaker, and generation date for every lesson.

## Voices

Each speaker is cast from a voice pool (`scripts/audio/cast.ts`) and keeps a stable voice across lessons; the two speakers in one lesson never share a voice. Defaults are ElevenLabs premade voices (four American, one British per pool). Override the pools with `ELEVENLABS_VOICES_FEMALE` and `ELEVENLABS_VOICES_MALE`. Changing a lesson's cast or model regenerates that lesson automatically.

## Processing

Every clip is:

1. Trimmed of edge silence.
2. Eased toward a learner-friendly pace. Clips faster than ~200 words per minute are time-stretched by at most 0.85×. Slower clips are untouched.
3. Normalized to -19 LUFS integrated with a transparent limiter keeping true peak at or below -1 dBTP (verified and corrected per file).
4. Given ~150 ms of clean head and tail room.
5. Encoded as mono MP3, 44.1 kHz, 96 kbps, with metadata stripped.

The full dialogue concatenates the processed lines with a short conversational gap (~0.5 s) and is normalized again. Budget roughly 0.4 MB of repository space per lesson.

## Stress Mode audio (opt-in)

`--with-stress` performs each Stress Mode option with the contrasted word capitalized, using `ELEVENLABS_STRESS_MODEL_ID` (default `eleven_v3`, which responds best to emphasis). Synthetic contrastive stress is not always convincing, so it is off by default. Listen to every file and delete any that do not clearly perform the named contrast before committing.

## Licensing

Audio generated on the ElevenLabs **free** plan may be used non-commercially with attribution. The app credits ElevenLabs in the home-page footer whenever model audio is present. Commercial use requires audio generated while on a paid plan; rights are not retroactive, so regenerate (`--force --fresh`) after upgrading if the product becomes commercial.

## Review before merge

1. `npm run audio:check` passes.
2. Listen on headphones and a phone speaker to at least one full lesson per new voice.
3. Compare isolated lines with the full dialogue, and test all three playback rates.
4. Confirm marked stress words are audible and nothing sounds clipped or rushed.
5. Mark a lesson `audio-ready` only after this human review.

Human-studio recordings can replace generated files at any time: keep the file names, then update the manifest fingerprints (or regenerate and overwrite). The script briefs in `content/audio-briefs/` remain the performance direction for the foundational lessons.
