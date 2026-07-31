# Lesson authoring guide

Foundational lessons live in `src/content/lessons.ts`; the extended six-month catalog lives in `src/content/generatedCurriculum.ts`. Both implement the types in `src/content/types.ts`. Run `npm test` after every curriculum edit; content tests catch duplicate IDs, broken speakers, malformed phrase groups, invalid stress answers, unbalanced coverage, and scheduling regressions.

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

Lesson and line IDs are durable data keys used by local progress and future audio files. Never reuse an old ID for different content. Changing visible copy is safe; changing IDs effectively creates a new lesson for existing learners.

Daily rotation uses a continuous local civil-day ordinal modulo the lesson count. It does not reset on January 1. Adding or reordering a lesson changes future calendar assignments but preserves stored completion data by stable ID.

## Extended catalog seeds

Each generated lesson seed has a unique slug, title, situation, subject, communicative detail, and outcome. Category-specific frames turn those seeds into a five-turn practice dialogue. Keep the frames conversational and grammatically compatible with every seed in that category. Before merging a frame change, inspect samples from its beginning, middle, and end—not only the first lesson.

The catalog is intentionally interleaved by category. Do not regroup it into category blocks: the order prevents learners from seeing the same type of situation repeatedly and is enforced by tests.

## Future timing metadata

Word-level highlighting should only be added after studio audio has reviewed timestamps. Store timings with content, in seconds from the beginning of each final file. Do not infer timing from text length in the UI.
