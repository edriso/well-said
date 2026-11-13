import type { Lesson } from './types';
import manifestJson from './audio-manifest.json';

/**
 * Model-audio contract.
 *
 * Files live in `public/audio/lessons/<lesson-id>/` and follow fixed names, so
 * the manifest only has to record *which text* each file was recorded from.
 * Every value is a fingerprint of the exact text that was performed. If an
 * author later edits a line, the fingerprint no longer matches, the stale file
 * is ignored, and playback falls back to the browser voice until the audio is
 * regenerated. A test fails in that situation so it cannot ship silently.
 */
export type LessonAudioEntry = {
  full?: string;
  lines: Record<string, string>;
  expressions: string[];
  stress: Record<string, string>;
};

export type AudioManifest = {
  version: 1;
  lessons: Record<string, LessonAudioEntry>;
};

export const audioManifest = manifestJson as AudioManifest;

/** FNV-1a (32-bit). Small, dependency-free, identical in Node and the browser. */
export function fingerprint(value: string): string {
  let hash = 0x811c9dc5;
  for (const char of value.normalize('NFC')) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export const fullDialogueText = (lesson: Lesson) =>
  lesson.lines.map((line) => `${line.speakerId}: ${line.text}`).join('\n');

export const stressSlug = (word: string) =>
  word.toLocaleLowerCase('en').normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'word';

const pad = (value: number) => String(value).padStart(2, '0');

/** Repository-relative paths below `public/`. The playback adapter adds the base URL. */
export const audioPaths = {
  dir: (lessonId: string) => `audio/lessons/${lessonId}`,
  full: (lessonId: string) => `audio/lessons/${lessonId}/full.mp3`,
  line: (lessonId: string, lineId: string) => `audio/lessons/${lessonId}/${lineId}.mp3`,
  expression: (lessonId: string, index: number) => `audio/lessons/${lessonId}/expression-${pad(index + 1)}.mp3`,
  stress: (lessonId: string, word: string) => `audio/lessons/${lessonId}/stress-${stressSlug(word)}.mp3`,
  timings: (lessonId: string) => `audio/lessons/${lessonId}/timings.json`,
};

/** [start, end] in seconds from the beginning of the audio file, one per whitespace-separated word. */
export type WordTiming = [number, number];

/**
 * Word timings for a lesson's model audio (`timings.json`, made by forced
 * alignment). Each entry records the fingerprint of the text it was aligned to
 * and a hash of the audio file, so stale timings are never used.
 */
export type LessonTimings = {
  version: 1;
  lines: Record<string, { fingerprint: string; audio: string; words: WordTiming[] }>;
  full?: { fingerprint: string; audio: string; lines: Record<string, WordTiming[]> };
};

/** The words a timing array is aligned with: the text split on whitespace, punctuation attached. */
export const timedWords = (text: string) => text.split(/\s+/).filter(Boolean);

const wellFormed = (words: WordTiming[] | undefined, text: string) =>
  Array.isArray(words) && words.length === timedWords(text).length
  && words.every((word, index) => word[0] <= word[1] && (index === 0 || word[0] >= words[index - 1]![0]));

/** Timings that still match the lesson's text, by line, for line files and for the full dialogue. */
export function currentTimings(lesson: Lesson, timings: LessonTimings | undefined) {
  const lines = new Map<string, WordTiming[]>();
  const full = new Map<string, WordTiming[]>();
  if (timings?.version !== 1) return { lines, full };
  for (const line of lesson.lines) {
    const entry = timings.lines[line.id];
    if (entry?.fingerprint === fingerprint(line.text) && wellFormed(entry.words, line.text)) lines.set(line.id, entry.words);
  }
  if (timings.full?.fingerprint === fingerprint(fullDialogueText(lesson))) {
    for (const line of lesson.lines) {
      const words = timings.full.lines[line.id];
      if (wellFormed(words, line.text)) full.set(line.id, words!);
    }
  }
  return { lines, full };
}

/**
 * The word being spoken at `time`, or -1 between words. A word stays active
 * through the short pause after it, so the highlight does not flicker.
 */
export function spokenWordIndex(words: WordTiming[], time: number, hold = 0.25): number {
  for (let index = words.length - 1; index >= 0; index -= 1) {
    const [start, end] = words[index]!;
    if (time >= start) return time <= end + hold ? index : -1;
  }
  return -1;
}

/** Returns the lesson with every audio field whose recording still matches its text. */
export function attachAudio(lesson: Lesson, manifest: AudioManifest = audioManifest): Lesson {
  const entry = manifest.lessons[lesson.id];
  if (!entry) return lesson;
  const matches = (recorded: string | undefined, text: string) => recorded !== undefined && recorded === fingerprint(text);

  return {
    ...lesson,
    fullAudio: matches(entry.full, fullDialogueText(lesson)) ? audioPaths.full(lesson.id) : lesson.fullAudio,
    lines: lesson.lines.map((line) =>
      matches(entry.lines[line.id], line.text) ? { ...line, audio: audioPaths.line(lesson.id, line.id) } : line,
    ),
    expressions: lesson.expressions.map((expression, index) =>
      matches(entry.expressions[index], expression.phrase)
        ? { ...expression, audio: audioPaths.expression(lesson.id, index) }
        : expression,
    ),
    stressExercise: {
      ...lesson.stressExercise,
      options: lesson.stressExercise.options.map((option) =>
        canPerformStress(lesson.stressExercise.sentence, option.word) &&
        matches(stressTextFingerprint(entry.stress[stressSlug(option.word)]), stressPerformanceText(lesson.stressExercise.sentence, option.word))
          ? { ...option, audio: audioPaths.stress(lesson.id, option.word) }
          : option,
      ),
    },
  };
}

/** A sentence fragment reduced to the word it contains, for matching stress options ("café," → "café"). */
export const stressWordKey = (part: string) => part.toLocaleLowerCase('en').replace(/[^\p{L}\p{N}']/gu, '');

/**
 * The sentence as the voice performs it, with the contrasted word marked. The
 * cue is capitalization; a word that is already upper case ("I", a gate letter
 * such as "C") is put in quotation marks instead, which the stress model reads
 * as emphasis without speaking the marks.
 */
export function stressPerformanceText(sentence: string, word: string): string {
  const target = word.toLocaleLowerCase('en');
  return sentence
    .split(/(\s+)/)
    .map((part) => {
      if (stressWordKey(part) !== target) return part;
      const upper = part.toLocaleUpperCase('en');
      return upper !== part ? upper : part.replace(/[\p{L}\p{N}']+/u, (core) => `"${core}"`);
    })
    .join('');
}

/** False when the word is not in the sentence, so there is nothing to perform. */
export const canPerformStress = (sentence: string, word: string) => stressPerformanceText(sentence, word) !== sentence;

/**
 * Stress Mode review decisions (`content/stress-audio-rejected.json`), keyed by
 * lesson id, then stress slug. A plain string rejects the take with no
 * replacement; `{ reason, take }` replaces it with re-take number `take` (2+).
 */
export type StressReview = Record<string, Record<string, string | { reason: string; take: number }>>;

/** The take a stress option should use: 1 by default, a re-take number, or undefined when rejected outright. */
export function requestedStressTake(review: StressReview, lessonId: string, slug: string): number | undefined {
  const decision = review[lessonId]?.[slug];
  if (decision === undefined) return 1;
  return typeof decision === 'string' ? undefined : decision.take;
}

/**
 * Manifest value for a stress take: the text fingerprint, plus `#<take>` for a
 * re-take, so the registered take is visible and verifiable. Take 1 is the bare
 * fingerprint, so takes recorded before re-takes existed stay valid.
 */
export const stressTakeFingerprint = (text: string, take = 1) =>
  take > 1 ? `${fingerprint(text)}#${take}` : fingerprint(text);

/** The text fingerprint inside a stress manifest value, whatever its take. */
export const stressTextFingerprint = (recorded: string | undefined) => recorded?.split('#')[0];

/** True when every dialogue line has a matching model recording. */
export const hasModelAudio = (lesson: Lesson) => lesson.lines.length > 0 && lesson.lines.every((line) => Boolean(line.audio));
