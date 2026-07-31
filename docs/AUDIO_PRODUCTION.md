# Audio production

The UI currently uses browser speech synthesis when an `audio` field is absent. This is a functional placeholder, visibly disclosed on the home card. Final recordings should replace it lesson by lesson.

## Deliverables per lesson

Use `content/audio-briefs/<lesson-id>.md` as the performance script. Export:

```text
public/audio/lessons/<lesson-id>/
  full.mp3
  line-01.mp3
  line-02.mp3
  ...
  expression-01.mp3
  ...
  stress-<word>.mp3
```

Every complete set needs:

- One continuous full dialogue with both voices
- One clean file per line, matching the full performance closely
- One clean file per expression
- One file per Stress Mode option, genuinely performing the named contrast

## Recording direction

- Use two distinct adult English speakers with natural conversational delivery.
- Preserve each speaker across full and isolated line files.
- Aim for clear international comprehensibility, not an exaggerated teaching voice.
- Keep contractions, reductions, and linking natural at the stated CEFR level.
- Honor the marked stress and coach note without turning stressed words into shouting.
- Leave about 120–180 ms of clean head/tail room on line files. Do not add music or effects.
- For a future curriculum, vary English varieties thoughtfully and label them only when pedagogically useful.

## Technical target

- Source master: mono WAV, 48 kHz, 24-bit PCM
- Web delivery: mono MP3, 96–128 kbps constant quality
- Integrated loudness: approximately -19 LUFS mono
- True peak: no higher than -1 dBTP
- No audible clipping, gating, denoising artifacts, or inconsistent room tone

Keep source masters outside the Git repository or in approved large-file storage. Commit only optimized delivery files and provenance notes.

## Wiring files into a lesson

Paths are relative to `public/` and must not begin with the Pages base:

```ts
fullAudio: 'audio/lessons/small-talk-at-work/full.mp3'

audio: 'audio/lessons/small-talk-at-work/line-01.mp3'
```

The adapter adds `import.meta.env.BASE_URL`, so the same data works locally and at `/well-said/`. If a configured file fails, playback falls back to browser speech instead of breaking the workout.

## Review before merge

Listen on headphones and a phone speaker. Compare isolated lines with the full dialogue, verify every filename on a case-sensitive filesystem, test all three playback rates, and confirm the Stress Mode meanings match the audible contrast.
