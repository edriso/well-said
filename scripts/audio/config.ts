import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

export const ROOT = resolve(import.meta.dirname, '../..');
export const PUBLIC_DIR = resolve(ROOT, 'public');
export const MANIFEST_PATH = resolve(ROOT, 'src/content/audio-manifest.json');
export const PROVENANCE_PATH = resolve(ROOT, 'content/audio-provenance.json');
export const RAW_CACHE_DIR = resolve(ROOT, '.cache/audio-raw');

/** Shell variables win over .env.local, which wins over .env. Nothing is written back. */
function loadEnv() {
  const merged: Record<string, string> = {};
  for (const file of ['.env', '.env.local']) {
    const path = resolve(ROOT, file);
    if (existsSync(path)) Object.assign(merged, parseEnv(readFileSync(path, 'utf8')));
  }
  for (const [key, value] of Object.entries(merged)) process.env[key] ??= value;
}

loadEnv();

/** ElevenLabs default (premade) voices. Override either pool in .env.local. */
// Sarah, Jessica, Matilda, Bella (American), Alice (British)
const DEFAULT_FEMALE = ['EXAVITQu4vr4xnSDxMaL', 'cgSgspJ2msm6clMCkdW9', 'XrExE9yKIg1WjnnlVkGX', 'hpp4J3VqNfWAUOO0d1Us', 'Xb7hH8MSUJpSbSDYk0k2'];
// Chris, Eric, Will, Roger (American), George (British)
const DEFAULT_MALE = ['iP95p4xoKVk53GoZ742B', 'cjVigY5qzO86Huf0OWal', 'bIHbv24MWmeRgasZH58o', 'CwhRBWXzGAHq8TQ4Fs17', 'JBFqnCBsd6RMkjVDRZzb'];

const list = (value: string | undefined, fallback: string[]) =>
  value?.split(',').map((item) => item.trim()).filter(Boolean) ?? fallback;

export const config = {
  apiKey: process.env.ELEVENLABS_API_KEY?.trim() ?? '',
  modelId: process.env.ELEVENLABS_MODEL_ID?.trim() || 'eleven_multilingual_v2',
  stressModelId: process.env.ELEVENLABS_STRESS_MODEL_ID?.trim() || 'eleven_v3',
  outputFormat: 'mp3_44100_128',
  /** ElevenLabs delivery speed (0.7–1.2). Changing it re-synthesizes and spends credits. */
  speed: Math.min(1.2, Math.max(0.7, Number(process.env.ELEVENLABS_SPEED) || 1)),
  concurrency: Math.max(1, Number(process.env.ELEVENLABS_CONCURRENCY) || 2),
  voiceIds: {
    female: list(process.env.ELEVENLABS_VOICES_FEMALE, DEFAULT_FEMALE),
    male: list(process.env.ELEVENLABS_VOICES_MALE, DEFAULT_MALE),
  },
};

export function requireApiKey() {
  if (!config.apiKey || config.apiKey.startsWith('your-')) {
    throw new Error('ELEVENLABS_API_KEY is missing. Copy .env.example to .env.local and add your key.');
  }
  return config.apiKey;
}
