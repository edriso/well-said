import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AlignedWord, ElevenLabsClient } from './elevenlabs';

/** Short content hash of an audio file; identifies a take regardless of its name. */
export const fileHash = (file: string) => createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 16);

/**
 * Word timings for known text in an audio file, from ElevenLabs forced
 * alignment. Cached by file content, so each recording is aligned once.
 */
export async function alignedWords(file: string, text: string, cacheDir: string, client: ElevenLabsClient | undefined): Promise<AlignedWord[]> {
  mkdirSync(cacheDir, { recursive: true });
  const cached = join(cacheDir, `${fileHash(file)}.json`);
  if (existsSync(cached)) return (JSON.parse(readFileSync(cached, 'utf8')) as AlignedWord[]).filter((word) => word.text.trim());
  if (!client) throw new Error('Uncached alignments need ELEVENLABS_API_KEY.');
  const words = await client.align(readFileSync(file), text);
  writeFileSync(cached, JSON.stringify(words));
  return words;
}
