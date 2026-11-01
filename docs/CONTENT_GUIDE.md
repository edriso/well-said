# Lesson authoring guide

Every workout is hand-authored data in `src/content/catalog/`: `startHere.ts` holds the 14 Start Here workouts, and one file per situation family (`everyday.ts`, `work.ts`, … `ideas.ts`) holds the rest. `src/content/lessons.ts` composes them in lesson-number order. All implement the types in `src/content/types.ts`; content never lives in components. Run `npm test` after every curriculum edit; content tests catch duplicate and near-duplicate dialogues, broken speakers, malformed phrase groups, invalid stress answers, unbalanced coverage, and scheduling regressions.

Every lesson has an editorial state: `draft`, `reviewed`, or `audio-ready`. A lesson may move to `reviewed` only after the checklist below is complete. Use `audio-ready` only after every required file has passed the checks in `AUDIO_PRODUCTION.md`. Collections are release-planning metadata and do not override those gates.

## Lesson checklist

1. Choose one ordinary situation with exactly two speakers.
2. Write 5–7 conversational lines totaling roughly 30–60 seconds.
3. Keep the level, focus, and intention narrow enough for one workout.
4. Split each line into natural thought groups. The groups must reconstruct the original sentence exactly when joined with spaces (ignoring terminal punctuation in the validator).
5. Mark 1–3 meaningful content words. A learner should hear them as the strongest beats in this specific context.
6. Write one plain-language coaching note about rhythm, linking, pausing, energy, or intention.
7. Add 2–3 reusable expressions with meaning and a fresh example.
8. Author one contrastive stress challenge with three plausible choices and one unambiguous answer.
9. Have an English pronunciation specialist review stress, grouping, reductions, and model performances before release.

## Tone

Dialogue should sound like something a person would actually say. Prefer contractions and common conversational phrasing, but do not turn every reduction into spelling such as “gonna.” Use coaching to help learners recognize reductions while making it clear that intelligibility matters more than imitating one accent.

Coach notes should be short and performable:

- Good: “Pause after actually. Stress FOUR to make the correction clear.”
- Weak: “Use appropriate suprasegmental phonology.”
- Avoid: “Say it like a native.”

## IDs and ordering

Lesson and line IDs are durable data keys used by local progress and audio file names. Never reuse an old ID for different content. Changing visible copy is safe; changing IDs effectively creates a new lesson for existing learners.

Daily rotation uses a continuous local civil-day ordinal modulo the lesson count. It does not reset on January 1. Adding or reordering a lesson changes future calendar assignments but preserves stored completion data by stable ID.

## Writing conventions

These keep dialogue consistent for learners and for model audio:

- Use straight apostrophes in `text`, `phraseGroups`, and stress sentences, and write numbers as words ("six fifteen", "forty dollars").
- Phrase groups are the units a speaker says without pausing. A comma on a group boundary may be dropped; keep terminal punctuation.
- Stress words are single whole words from the line: the real peaks in context, not function words unless they are contrastive.
- Coach notes are one or two short, performable sentences, with stressed words in CAPS.
- Give speakers specific roles ("Pharmacist", "Flatmate"). Every speaker name must exist in `scripts/audio/cast.ts`, which picks the voice.
- Vary openings, turn structure, tone, and endings across a category. Avoid summary closings such as "That clarifies the plan."
- Health, wellbeing, legal, and money conversations practice communication only. Never give diagnosis, treatment, therapy, legal, or financial advice.

## Order and focus

The catalog interleaves situation families by lesson number, so consecutive days vary; tests enforce this. Speaking focus also rotates within each family, so every family practices most of the ten focuses. Keep the `focus` of an existing lesson unless you rebalance deliberately.

## Future timing metadata

Word-level highlighting should only be added after studio audio has reviewed timestamps. Store timings with content, in seconds from the beginning of each final file. Do not infer timing from text length in the UI.

## After editing a voiced lesson

Changing a line, expression, or stress sentence in a lesson that has model audio makes its recording stale. The app falls back to the browser voice for that item and `npm test` fails until you run `npm run audio:generate -- --lesson=<id>` and commit the updated files and manifest.
