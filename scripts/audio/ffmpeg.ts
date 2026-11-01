import { execFile } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { promisify } from 'node:util';

const run = promisify(execFile);

/** Delivery target from docs/AUDIO_PRODUCTION.md. TP leaves headroom for MP3 encoding. */
export const LOUDNESS = { integrated: -19, truePeak: -1.5, range: 11 } as const;
const loudnorm = `loudnorm=I=${LOUDNESS.integrated}:TP=${LOUDNESS.truePeak}:LRA=${LOUDNESS.range}`;
const encode = ['-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '96k', '-map_metadata', '-1'];
const ffmpeg = (args: string[]) => run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { maxBuffer: 16 * 1024 * 1024 });

export async function assertFfmpeg() {
  try {
    await run('ffmpeg', ['-version']);
  } catch {
    throw new Error('ffmpeg is required for audio processing. Install it (macOS: `brew install ffmpeg`) and try again.');
  }
}

/**
 * Two-pass normalization: measure integrated loudness, then apply exact gain
 * followed by a transparent peak limiter. loudnorm's own linear mode refuses
 * to reach the target when a short clip has a sharp transient, which is common
 * in brief phrases such as "Of course."
 */
async function normalize(inputArgs: string[], preFilter: string, output: string) {
  const chain = (tail: string) => [preFilter, tail].filter(Boolean).join(',');
  const { stderr } = await run('ffmpeg', ['-hide_banner', '-nostats', ...inputArgs, '-filter_complex', chain(`${loudnorm}:print_format=json`), '-f', 'null', '-'], { maxBuffer: 16 * 1024 * 1024 });
  const stats = JSON.parse(stderr.slice(stderr.lastIndexOf('{'), stderr.lastIndexOf('}') + 1)) as { input_i: string };
  // alimiter works on sample peaks, so leave 0.5 dB extra room for inter-sample (true) peaks.
  const ceiling = 10 ** ((LOUDNESS.truePeak - 0.5) / 20);
  const render = (gain: number) =>
    ffmpeg([...inputArgs, '-filter_complex', chain(`volume=${gain.toFixed(2)}dB,alimiter=limit=${ceiling.toFixed(3)}:attack=2:release=60:level=false`), ...encode, output]);

  // Limiting can pull very peaky phrases below target, so verify and correct (bounded).
  let gain = LOUDNESS.integrated - Number(stats.input_i);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await render(gain);
    const shortfall = LOUDNESS.integrated - (await measure(output)).integrated;
    if (!Number.isFinite(shortfall) || Math.abs(shortfall) <= 0.5) return;
    gain += shortfall;
  }
}

/** Learner-friendly ceiling. Faster clips are gently slowed; slower ones are left as performed. */
export const MAX_WORDS_PER_MINUTE = 200;
const MIN_TEMPO = 0.85;

const duration = async (file: string) =>
  Number((await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file])).stdout.trim());

/**
 * Trims edge silence, eases rushed delivery toward a learner-friendly pace,
 * normalizes loudness, and adds ~150 ms of clean head and tail room.
 */
export async function processClip(input: string, output: string, wordCount: number) {
  const trim = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.03';
  const trimmed = `${output}.trim.wav`;
  try {
    await ffmpeg(['-i', input, '-af', `${trim},areverse,${trim},areverse`, '-ac', '1', trimmed]);
    const wordsPerMinute = (wordCount / (await duration(trimmed))) * 60;
    const tempo = wordsPerMinute > MAX_WORDS_PER_MINUTE ? Math.max(MIN_TEMPO, MAX_WORDS_PER_MINUTE / wordsPerMinute) : 1;
    const pace = tempo < 0.995 ? `atempo=${tempo.toFixed(3)},` : '';
    // Pad before measuring so the normalizer and `audio:check` see the same signal.
    await normalize(['-i', trimmed], `[0:a]${pace}adelay=150:all=1,apad=pad_dur=0.15`, output);
  } finally {
    await rm(trimmed, { force: true });
  }
}

/** Joins processed line files into one dialogue with a short conversational gap between turns. */
export async function concatDialogue(inputs: string[], output: string, gapSeconds = 0.2) {
  const pads = inputs.map((_, index) => `[${index}:a]${index < inputs.length - 1 ? `apad=pad_dur=${gapSeconds}` : 'anull'}[a${index}]`);
  const joined = `${inputs.map((_, index) => `[a${index}]`).join('')}concat=n=${inputs.length}:v=0:a=1`;
  await normalize(inputs.flatMap((file) => ['-i', file]), `${pads.join(';')};${joined}`, output);
}

export type Measurement = { integrated: number; truePeak: number; duration: number };

export async function measure(file: string): Promise<Measurement> {
  const { stderr } = await run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { maxBuffer: 64 * 1024 * 1024 });
  const summary = stderr.slice(stderr.lastIndexOf('Summary:'));
  const integrated = Number(summary.match(/I:\s+(-?[\d.]+) LUFS/)?.[1]);
  const truePeak = Number(summary.match(/Peak:\s+(-?[\d.]+|-inf) dBFS/)?.[1]);
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  return { integrated, truePeak, duration: Number(stdout.trim()) };
}
