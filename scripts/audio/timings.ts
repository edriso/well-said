/**
 * Word timings for follow-along highlighting.
 *
 * Each dialogue line file and the full dialogue are force-aligned against
 * their text. The result is written next to the audio as `timings.json`, with
 * the text fingerprint and audio hash it was made from, so stale timings are
 * detected (by `audio:check`) and ignored (by the app).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { audioPaths, fingerprint, fullDialogueText, timedWords, type LessonTimings, type WordTiming } from '../../src/content/audio';
import type { Lesson } from '../../src/content/types';
import { alignedWords, fileHash } from './alignment';
import type { AlignedWord, ElevenLabsClient } from './elevenlabs';

const toTimings = (words: AlignedWord[]): WordTiming[] =>
  words.map((word) => [Math.round(word.start * 1000) / 1000, Math.round(word.end * 1000) / 1000]);

/** Builds timings for every recorded line and the full dialogue. Lines whose alignment does not fit are skipped and reported. */
export async function buildTimings(lesson: Lesson, publicDir: string, cacheDir: string, client?: ElevenLabsClient) {
  const timings: LessonTimings = { version: 1, lines: {} };
  const problems: string[] = [];

  for (const line of lesson.lines) {
    if (!line.audio) continue;
    const file = join(publicDir, line.audio);
    const words = await alignedWords(file, line.text, cacheDir, client);
    if (words.length !== timedWords(line.text).length) {
      problems.push(`${lesson.id}/${line.id}: alignment returned ${words.length} words for ${timedWords(line.text).length}`);
      continue;
    }
    timings.lines[line.id] = { fingerprint: fingerprint(line.text), audio: fileHash(file), words: toTimings(words) };
  }

  if (lesson.fullAudio) {
    const file = join(publicDir, lesson.fullAudio);
    const words = await alignedWords(file, lesson.lines.map((line) => line.text).join(' '), cacheDir, client);
    const expected = lesson.lines.reduce((sum, line) => sum + timedWords(line.text).length, 0);
    if (words.length === expected) {
      const lines: Record<string, WordTiming[]> = {};
      let offset = 0;
      for (const line of lesson.lines) {
        const count = timedWords(line.text).length;
        lines[line.id] = toTimings(words.slice(offset, offset + count));
        offset += count;
      }
      timings.full = { fingerprint: fingerprint(fullDialogueText(lesson)), audio: fileHash(file), lines };
    } else {
      problems.push(`${lesson.id}/full: alignment returned ${words.length} words for ${expected}`);
    }
  }
  return { timings, problems };
}

/** Problems that make a lesson's timings file missing or out of date for its current text and audio. */
export function staleTimings(lesson: Lesson, publicDir: string): string[] {
  const path = join(publicDir, audioPaths.timings(lesson.id));
  if (!existsSync(path)) return ['missing'];
  const timings = JSON.parse(readFileSync(path, 'utf8')) as LessonTimings;
  const problems: string[] = [];
  for (const line of lesson.lines) {
    if (!line.audio) continue;
    const entry = timings.lines[line.id];
    if (!entry) problems.push(`${line.id} has no timings`);
    else if (entry.fingerprint !== fingerprint(line.text) || entry.audio !== fileHash(join(publicDir, line.audio))) problems.push(`${line.id} timings are stale`);
  }
  if (lesson.fullAudio) {
    const full = timings.full;
    if (!full) problems.push('full dialogue has no timings');
    else if (full.fingerprint !== fingerprint(fullDialogueText(lesson)) || full.audio !== fileHash(join(publicDir, lesson.fullAudio))) problems.push('full dialogue timings are stale');
  }
  return problems;
}

export function writeTimings(lesson: Lesson, publicDir: string, timings: LessonTimings) {
  writeFileSync(join(publicDir, audioPaths.timings(lesson.id)), `${JSON.stringify(timings)}\n`);
}
