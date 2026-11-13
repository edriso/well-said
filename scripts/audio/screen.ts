/**
 * Automated screen for Stress Mode takes.
 *
 * The three takes of a stress exercise say the same sentence in the same voice
 * and differ only in which word is stressed. A take is convincing when its
 * target word is louder and/or longer than the same word in the two sibling
 * takes, each measured relative to the rest of its own take (which cancels out
 * overall tempo and level). Pitch is left out: simple pitch trackers make
 * octave errors on these voices, while aligned loudness and duration are
 * robust.
 *
 * Score units: +1 ≈ one clear, natural cue (+3 dB or +30% duration). Around 0
 * the word is no more prominent than when unstressed; below about -0.3 it is
 * clearly less prominent. This is a screen, not a substitute for listening.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { stressSlug, stressWordKey } from '../../src/content/audio';
import type { Lesson } from '../../src/content/types';
import { alignedWords } from './alignment';
import type { ElevenLabsClient } from './elevenlabs';
import { decodePcm, PCM_RATE } from './ffmpeg';

export type StressScreenResult = { lessonId: string; slug: string; score: number; loudnessDb: number; durationPct: number };

export type WordFeatures = { loudness: number; logDuration: number };

const LOUDNESS_UNIT_DB = 3;
const DURATION_UNIT = Math.log(1.3);
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

/**
 * Prominence of the target word(s) in one take against the same words in sibling
 * takes. Each array holds per-word features relative to its own take.
 */
export function prominenceScore(own: WordFeatures[], siblings: WordFeatures[][], targets: number[]) {
  const delta = (pick: (word: WordFeatures) => number) =>
    mean(targets.map((index) => pick(own[index]!) - mean(siblings.map((sibling) => pick(sibling[index]!)))));
  const loudnessDb = delta((word) => word.loudness);
  const logDuration = delta((word) => word.logDuration);
  return {
    score: Math.round((loudnessDb / LOUDNESS_UNIT_DB + logDuration / DURATION_UNIT) * 100) / 100,
    loudnessDb: Math.round(loudnessDb * 10) / 10,
    durationPct: Math.round((Math.exp(logDuration) - 1) * 100),
  };
}

/** Loudness and duration of each sentence word relative to its take, or undefined if alignment does not match. */
async function takeFeatures(file: string, sentence: string, cacheDir: string, client: ElevenLabsClient | undefined) {
  const words = await alignedWords(file, sentence, cacheDir, client);
  if (words.length !== sentence.split(/\s+/).filter(Boolean).length) return undefined;
  const samples = await decodePcm(file);
  const raw = words.map((word) => {
    const start = Math.floor(word.start * PCM_RATE);
    const end = Math.max(Math.floor(word.end * PCM_RATE), start + 1);
    const segment = samples.subarray(start, end);
    const rms = Math.sqrt(segment.reduce((sum, value) => sum + value * value, 0) / Math.max(segment.length, 1));
    return { db: 20 * Math.log10(rms + 1e-9), seconds: Math.max(word.end - word.start, 0.02) };
  });
  const meanDb = mean(raw.map((word) => word.db));
  const totalSeconds = raw.reduce((sum, word) => sum + word.seconds, 0);
  return raw.map((word): WordFeatures => ({ loudness: word.db - meanDb, logDuration: Math.log(word.seconds / totalSeconds) }));
}

/** Scores every Stress Mode option that has a take; options with fewer than two siblings' worth of data are skipped. */
export async function screenStress(lessons: Lesson[], publicDir: string, cacheDir: string, client?: ElevenLabsClient): Promise<StressScreenResult[]> {
  mkdirSync(cacheDir, { recursive: true });
  const results: StressScreenResult[] = [];
  for (const lesson of lessons) {
    const { sentence, options } = lesson.stressExercise;
    const voiced = options.filter((option) => option.audio);
    const features = new Map<string, WordFeatures[] | undefined>();
    for (const option of voiced) features.set(option.word, await takeFeatures(join(publicDir, option.audio!), sentence, cacheDir, client));
    const parts = sentence.split(/\s+/).filter(Boolean);

    for (const option of voiced) {
      const own = features.get(option.word);
      const siblings = voiced.filter((other) => other !== option).map((other) => features.get(other.word)).filter((value) => value !== undefined);
      const targets = parts.flatMap((part, index) => (stressWordKey(part) === option.word.toLocaleLowerCase('en') ? [index] : []));
      if (!own || !siblings.length || !targets.length) continue;
      results.push({ lessonId: lesson.id, slug: stressSlug(option.word), ...prominenceScore(own, siblings, targets) });
    }
  }
  return results;
}
