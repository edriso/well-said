/**
 * Transcription audit: does each recording say exactly its script?
 *
 * Every dialogue line and expression is transcribed with ElevenLabs speech to
 * text and compared word by word with its text. Both sides go through the same
 * normalization, so formatting choices are not reported as errors: numbers and
 * times ("7:30" vs "seven thirty"), hyphens, and US/UK spelling variants.
 * Transcripts are cached by file content, so re-running is free.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Lesson } from '../../src/content/types';
import type { ElevenLabsClient } from './elevenlabs';

export type VerifyResult = { item: string; file: string; script: string; heard: string; missing: string[]; extra: string[] };

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function numberWords(value: number): string[] {
  if (value < 20) return [ONES[value]!];
  if (value < 100) return [TENS[Math.floor(value / 10)]!, ...(value % 10 ? [ONES[value % 10]!] : [])];
  if (value < 1000) return [ONES[Math.floor(value / 100)]!, 'hundred', ...(value % 100 ? numberWords(value % 100) : [])];
  return [...numberWords(Math.floor(value / 1000)), 'thousand', ...(value % 1000 ? numberWords(value % 1000) : [])];
}

/** Spellings that differ only by variety or style are compared in one canonical form. */
const CANONICAL: Record<string, string> = {
  ok: 'okay', alright: 'all right', till: 'until', theatre: 'theater', centre: 'center', metre: 'meter', litre: 'liter',
  traveller: 'traveler', travelling: 'traveling', cancelled: 'canceled', cancelling: 'canceling', labelling: 'labeling',
  grey: 'gray', programme: 'program', cheque: 'check', mum: 'mom', pyjamas: 'pajamas', jewellery: 'jewelry',
};

/** Lower-case words with numbers spelled out, punctuation and hyphens removed, and variant spellings unified. */
export function normalizeSpeech(text: string): string[] {
  const expanded = text
    .toLocaleLowerCase('en')
    .replace(/[’‘]/g, "'")
    .replace(/(\d+):(\d{2})/g, (_, hours: string, minutes: string) =>
      [...numberWords(Number(hours)), ...(minutes === '00' ? [] : Number(minutes) < 10 ? ['oh', ...numberWords(Number(minutes))] : numberWords(Number(minutes)))].join(' '))
    .replace(/\$(\d+)/g, '$1 dollars')
    .replace(/£(\d+)/g, '$1 pounds')
    .replace(/€(\d+)/g, '$1 euros')
    .replace(/(\d+)%/g, '$1 percent')
    .replace(/\d+/g, (digits) => numberWords(Number(digits)).join(' '))
    .replace(/[-–—/]/g, ' ');
  return (expanded.match(/[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*/gu) ?? [])
    // colour/color, neighbour/neighbor, but never four/for or your/yor.
    .map((word) => (word.length > 4 ? word.replace(/our(s|ed|ing)?('s)?$/, 'or$1$2').replace(/tre(s?)$/, 'ter$1') : word).replace(/is(e|ed|es|ing)('s)?$/, 'iz$1$2'))
    .flatMap((word) => (CANONICAL[word] ?? word).split(' '));
}

/** Words in `a` but not matched in order in `b` (longest common subsequence). */
function unmatched(a: string[], b: string[]): string[] {
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i]![j] = a[i] === b[j] ? table[i + 1]![j + 1]! + 1 : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
    }
  }
  const out: string[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length) {
    if (j < b.length && a[i] === b[j]) { i += 1; j += 1; }
    else if (j < b.length && table[i]![j + 1]! >= table[i + 1]![j]!) j += 1;
    else { out.push(a[i]!); i += 1; }
  }
  return out;
}

async function transcript(file: string, cacheDir: string, client: ElevenLabsClient | undefined) {
  const audio = readFileSync(file);
  const cached = join(cacheDir, `${createHash('sha1').update(audio).digest('hex').slice(0, 16)}.txt`);
  const usable = (text: string) => normalizeSpeech(text).length > 0 && !/[^\p{Script=Latin}\p{N}\p{P}\p{S}\s]/u.test(text);
  if (existsSync(cached)) {
    const text = readFileSync(cached, 'utf8');
    if (usable(text)) return text;
  }
  if (!client) throw new Error('Uncached transcripts need ELEVENLABS_API_KEY.');
  // Speech to text occasionally returns nothing, or text in another script, for clear
  // English speech. Retry those, and never cache them, so a fluke is not a "defect".
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const text = await client.transcribe(audio);
    if (usable(text)) {
      writeFileSync(cached, text);
      return text;
    }
  }
  return '';
}

/** Transcribes every recorded line and expression and reports any wording that does not match. */
export async function verifySpeech(lessons: Lesson[], publicDir: string, cacheDir: string, client?: ElevenLabsClient, concurrency = 4) {
  mkdirSync(cacheDir, { recursive: true });
  const items = lessons.flatMap((lesson) => [
    ...lesson.lines.filter((line) => line.audio).map((line) => ({ item: `${lesson.id}/${line.id}`, file: line.audio!, script: line.text })),
    ...lesson.expressions.filter((expression) => expression.audio).map((expression, index) => ({ item: `${lesson.id}/expression-${index + 1}`, file: expression.audio!, script: expression.phrase })),
  ]);
  const results: VerifyResult[] = [];
  const queue = [...items];
  await Promise.all(Array.from({ length: concurrency }, async () => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      const heard = await transcript(join(publicDir, next.file), cacheDir, client);
      const expected = normalizeSpeech(next.script);
      const actual = normalizeSpeech(heard);
      results.push({ ...next, heard, missing: unmatched(expected, actual), extra: unmatched(actual, expected) });
    }
  }));
  return { checked: items.length, mismatches: results.filter((result) => result.missing.length || result.extra.length) };
}
