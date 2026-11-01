/**
 * Model-audio pipeline for Well Said.
 *
 *   npm run audio:plan     -- [selection]            estimate characters and files; show remaining credits
 *   npm run audio:generate -- [selection] [--force]  synthesize, normalize, and register audio
 *   npm run audio:check                              validate files, fingerprints, loudness, and size
 *   npm run audio:voices                             list voices available to your API key
 *
 * Selection (default: the reviewed Start Here collection):
 *   --lesson=<id>[,<id>]   --collection="<name>"   --all   --limit=<n>
 * Options:
 *   --with-stress   also perform each Stress Mode option (opt-in; review every file by ear)
 *   --force         re-process files even when the recorded text is unchanged (uses the raw cache)
 *   --fresh         with --force, ignore the raw cache and synthesize again (spends credits)
 *
 * Raw API responses are cached in .cache/audio-raw/ so re-processing never spends credits twice.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { audioPaths, fingerprint, fullDialogueText, stressPerformanceText, stressSlug, type AudioManifest, type LessonAudioEntry } from '../../src/content/audio';
import { lessons } from '../../src/content/lessons';
import type { Lesson } from '../../src/content/types';
import { castLesson, type Voice, type VoicePools } from './cast';
import { config, MANIFEST_PATH, RAW_CACHE_DIR, PROVENANCE_PATH, PUBLIC_DIR, requireApiKey } from './config';
import { createClient, ElevenLabsError, type ElevenLabsClient } from './elevenlabs';
import { assertFfmpeg, concatDialogue, LOUDNESS, measure, processClip } from './ffmpeg';

type Provenance = {
  version: 1;
  lessons: Record<string, { generatedAt: string; provider: 'ElevenLabs'; model: string; stressModel?: string; voices: Record<string, string> }>;
};

/** Where a file's fingerprint lives in the manifest entry. */
type Slot = { kind: 'lines' | 'stress'; key: string } | { kind: 'expressions'; key: number };

type Job = { slot: Slot; path: string; text: string; fingerprint: string; voice: Voice; modelId: string; previousText?: string; nextText?: string };

const readSlot = (entry: LessonAudioEntry | undefined, slot: Slot) =>
  slot.kind === 'expressions' ? entry?.expressions[slot.key] : entry?.[slot.kind][slot.key];

const writeSlot = (entry: LessonAudioEntry, slot: Slot, value: string) => {
  if (slot.kind === 'expressions') entry.expressions[slot.key] = value;
  else entry[slot.kind][slot.key] = value;
};

const { positionals, values: flags } = parseArgs({
  allowPositionals: true,
  options: {
    lesson: { type: 'string' },
    collection: { type: 'string' },
    all: { type: 'boolean', default: false },
    limit: { type: 'string' },
    force: { type: 'boolean', default: false },
    fresh: { type: 'boolean', default: false },
    'with-stress': { type: 'boolean', default: false },
  },
});

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;
const writeJson = (path: string, value: unknown) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const publicPath = (relative: string) => resolve(PUBLIC_DIR, relative);
const order = new Map(lessons.map((lesson, index) => [lesson.id, index]));
const sortByCatalog = <T>(record: Record<string, T>) =>
  Object.fromEntries(Object.entries(record).sort(([a], [b]) => (order.get(a) ?? 1e9) - (order.get(b) ?? 1e9)));
const formatBytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function selectLessons(): Lesson[] {
  let selected: Lesson[];
  if (flags.lesson) {
    const ids = flags.lesson.split(',').map((id) => id.trim());
    const unknown = ids.filter((id) => !order.has(id));
    if (unknown.length) throw new Error(`Unknown lesson id(s): ${unknown.join(', ')}`);
    selected = lessons.filter((lesson) => ids.includes(lesson.id));
  } else if (flags.all) {
    selected = lessons;
  } else {
    const collection = flags.collection ?? 'Start Here';
    selected = lessons.filter((lesson) => lesson.collection === collection);
    if (!selected.length) throw new Error(`No lessons in collection "${collection}".`);
  }
  const limit = flags.limit ? Number(flags.limit) : undefined;
  return limit ? selected.slice(0, limit) : selected;
}

function speechText(lesson: Lesson, withStress: boolean) {
  const texts = [...lesson.lines.map((line) => line.text), ...lesson.expressions.map((expression) => expression.phrase)];
  if (withStress) texts.push(...lesson.stressExercise.options.map((option) => stressPerformanceText(lesson.stressExercise.sentence, option.word)));
  return texts;
}

async function resolvePools(client: ElevenLabsClient): Promise<VoicePools> {
  const available = new Map((await client.voices()).map((voice) => [voice.voice_id, voice.name]));
  const resolvePool = (ids: string[], label: string) => ids.map((id) => {
    const name = available.get(id);
    if (!name) throw new Error(`Voice ${id} (${label} pool) is not available to this API key. Run \`npm run audio:voices\` and update .env.local.`);
    return { id, name };
  });
  return { female: resolvePool(config.voiceIds.female, 'female'), male: resolvePool(config.voiceIds.male, 'male') };
}

function lessonJobs(lesson: Lesson, cast: Map<string, Voice>, withStress: boolean): Job[] {
  const voiceFor = (speakerId: string) => cast.get(speakerId)!;
  const jobs: Job[] = lesson.lines.map((line, index) => ({
    slot: { kind: 'lines', key: line.id },
    path: audioPaths.line(lesson.id, line.id),
    text: line.text,
    fingerprint: fingerprint(line.text),
    voice: voiceFor(line.speakerId),
    modelId: config.modelId,
    previousText: lesson.lines[index - 1]?.text,
    nextText: lesson.lines[index + 1]?.text,
  }));
  lesson.expressions.forEach((expression, index) => jobs.push({
    slot: { kind: 'expressions', key: index },
    path: audioPaths.expression(lesson.id, index),
    text: expression.phrase.replace(/…/g, '...'),
    fingerprint: fingerprint(expression.phrase),
    voice: voiceFor(lesson.speakers[index % lesson.speakers.length]!.id),
    modelId: config.modelId,
  }));
  if (withStress) {
    for (const option of lesson.stressExercise.options) {
      const text = stressPerformanceText(lesson.stressExercise.sentence, option.word);
      jobs.push({
        slot: { kind: 'stress', key: stressSlug(option.word) },
        path: audioPaths.stress(lesson.id, option.word),
        text,
        fingerprint: fingerprint(text),
        voice: voiceFor(lesson.speakers[0]!.id),
        modelId: config.stressModelId,
      });
    }
  }
  return jobs;
}

const isCurrent = (job: Job, entry: LessonAudioEntry | undefined) =>
  readSlot(entry, job.slot) === job.fingerprint && existsSync(publicPath(job.path));

const referencedFiles = (lessonId: string, entry: LessonAudioEntry) => new Set([
  ...(entry.full ? [audioPaths.full(lessonId)] : []),
  ...Object.keys(entry.lines).map((lineId) => audioPaths.line(lessonId, lineId)),
  ...entry.expressions.map((_, index) => audioPaths.expression(lessonId, index)),
  ...Object.keys(entry.stress).map((word) => audioPaths.stress(lessonId, word)),
]);

/** Deletes files left behind by removed lines or expressions so the repository holds only live audio. */
function removeUnreferenced(lessonId: string, entry: LessonAudioEntry) {
  const dir = publicPath(audioPaths.dir(lessonId));
  if (!existsSync(dir)) return;
  const keep = referencedFiles(lessonId, entry);
  for (const file of readdirSync(dir)) {
    if (!keep.has(`${audioPaths.dir(lessonId)}/${file}`)) rmSync(join(dir, file));
  }
}

async function runPool<T>(items: T[], size: number, worker: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(Array.from({ length: Math.min(size, queue.length) }, async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift()) await worker(item);
  }));
}

async function plan() {
  const selected = selectLessons();
  const characters = selected.reduce((sum, lesson) => sum + speechText(lesson, flags['with-stress']).join('').length, 0);
  const files = selected.reduce((sum, lesson) => sum + speechText(lesson, flags['with-stress']).length + 1, 0);
  console.log(`Lessons: ${selected.length}  ·  files: ${files}  ·  characters: ${characters.toLocaleString()}`);
  console.log(`Estimated repository size: ~${formatBytes(selected.length * 0.45 * 1024 * 1024)} (about 0.45 MB per lesson)`);
  if (config.apiKey) {
    const subscription = await createClient(requireApiKey()).subscription();
    const remaining = subscription.character_limit - subscription.character_count;
    console.log(`ElevenLabs ${subscription.tier}: ${remaining.toLocaleString()} of ${subscription.character_limit.toLocaleString()} credits remaining.`);
    if (remaining < characters) console.warn('Not enough credits for this selection. Use --limit or --lesson to generate in batches.');
  } else {
    console.log('Add ELEVENLABS_API_KEY to .env.local to see remaining credits.');
  }
}

async function generate() {
  await assertFfmpeg();
  const client = createClient(requireApiKey());
  const pools = await resolvePools(client);
  const selected = selectLessons();
  const manifest = readJson<AudioManifest>(MANIFEST_PATH);
  const provenance = readJson<Provenance>(PROVENANCE_PATH);
  mkdirSync(RAW_CACHE_DIR, { recursive: true });
  let synthesized = 0;

  for (const lesson of selected) {
    const cast = castLesson(lesson, pools);
    const voices = Object.fromEntries(lesson.speakers.map((speaker) => [speaker.name, `${cast.get(speaker.id)!.name} (${cast.get(speaker.id)!.id})`]));
    const previous = provenance.lessons[lesson.id];
    const castChanged = !previous || previous.model !== config.modelId || JSON.stringify(previous.voices) !== JSON.stringify(voices);
    const existing = castChanged || flags.force ? undefined : manifest.lessons[lesson.id];
    const entry: LessonAudioEntry = existing
      ? { ...existing, lines: { ...existing.lines }, expressions: [...existing.expressions], stress: { ...existing.stress } }
      : { lines: {}, expressions: [], stress: {} };
    const pending = lessonJobs(lesson, cast, flags['with-stress']).filter((job) => !isCurrent(job, existing));

    process.stdout.write(`${lesson.id}: ${pending.length ? `${pending.length} file(s)` : 'up to date'}`);
    await runPool(pending, config.concurrency, async (job) => {
      const speech = {
        voiceId: job.voice.id,
        text: job.text,
        modelId: job.modelId,
        outputFormat: config.outputFormat,
        seed: Number.parseInt(fingerprint(job.text), 16),
        ...(config.speed === 1 ? {} : { speed: config.speed }),
        previousText: job.previousText,
        nextText: job.nextText,
      };
      const raw = join(RAW_CACHE_DIR, `${fingerprint(JSON.stringify(speech))}.mp3`);
      if (flags.fresh || !existsSync(raw)) {
        await writeFile(raw, await client.speech(speech));
        synthesized += job.text.length;
      }
      await mkdir(dirname(publicPath(job.path)), { recursive: true });
      await processClip(raw, publicPath(job.path), job.text.split(/\s+/).filter(Boolean).length);
      writeSlot(entry, job.slot, job.fingerprint);
      process.stdout.write('.');
    });

    const fullFingerprint = fingerprint(fullDialogueText(lesson));
    const fullPath = publicPath(audioPaths.full(lesson.id));
    const linesReady = lesson.lines.every((line) => entry.lines[line.id] === fingerprint(line.text));
    const linesChanged = pending.some((job) => job.slot.kind === 'lines');
    if (linesReady && (linesChanged || entry.full !== fullFingerprint || !existsSync(fullPath))) {
      await concatDialogue(lesson.lines.map((line) => publicPath(audioPaths.line(lesson.id, line.id))), fullPath);
      entry.full = fullFingerprint;
    }

    removeUnreferenced(lesson.id, entry);
    manifest.lessons[lesson.id] = entry;
    manifest.lessons = sortByCatalog(manifest.lessons);
    provenance.lessons[lesson.id] = {
      generatedAt: pending.length || !previous ? new Date().toISOString() : previous.generatedAt,
      provider: 'ElevenLabs',
      model: config.modelId,
      stressModel: Object.keys(entry.stress).length ? (flags['with-stress'] ? config.stressModelId : previous?.stressModel) : undefined,
      voices,
    };
    provenance.lessons = sortByCatalog(provenance.lessons);
    writeJson(MANIFEST_PATH, manifest);
    writeJson(PROVENANCE_PATH, provenance);
    process.stdout.write(' ✓\n');
  }
  console.log(`Done. Synthesized ${synthesized.toLocaleString()} characters. Run \`npm run audio:check\` next.`);
}

async function check() {
  await assertFfmpeg();
  const manifest = readJson<AudioManifest>(MANIFEST_PATH);
  const problems: string[] = [];
  const expected = new Set<string>();
  let bytes = 0;
  let measured = 0;

  for (const [lessonId, entry] of Object.entries(manifest.lessons)) {
    const lesson = lessons.find((item) => item.id === lessonId);
    if (!lesson) { problems.push(`${lessonId}: in manifest but not in the curriculum`); continue; }
    const files = [...referencedFiles(lessonId, entry)];
    for (const file of files) {
      expected.add(file);
      const path = publicPath(file);
      if (!existsSync(path)) { problems.push(`${file}: missing`); continue; }
      bytes += statSync(path).size;
      const { integrated, truePeak, duration } = await measure(path);
      measured += 1;
      if (Math.abs(integrated - LOUDNESS.integrated) > 1.5) problems.push(`${file}: loudness ${integrated} LUFS (target ${LOUDNESS.integrated})`);
      if (truePeak > -1) problems.push(`${file}: true peak ${truePeak} dBFS (limit -1)`);
      if (!(duration > 0.3)) problems.push(`${file}: suspiciously short (${duration}s)`);
    }
    for (const line of lesson.lines) {
      if (entry.lines[line.id] && entry.lines[line.id] !== fingerprint(line.text)) problems.push(`${lessonId}/${line.id}: text changed since recording; regenerate`);
    }
  }

  const lessonsDir = publicPath('audio/lessons');
  if (existsSync(lessonsDir)) {
    for (const lessonId of readdirSync(lessonsDir)) {
      for (const file of readdirSync(join(lessonsDir, lessonId))) {
        const relative = `audio/lessons/${lessonId}/${file}`;
        if (!expected.has(relative)) problems.push(`${relative}: not referenced by the manifest`);
      }
    }
  }

  console.log(`Checked ${measured} files across ${Object.keys(manifest.lessons).length} lessons · ${formatBytes(bytes)} total.`);
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n${problems.map((problem) => `  - ${problem}`).join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log('All audio files match the manifest and loudness targets.');
  }
}

async function listVoices() {
  const voices = await createClient(requireApiKey()).voices();
  for (const voice of voices) {
    const labels = Object.values(voice.labels ?? {}).join(', ');
    console.log(`${voice.voice_id}  ${voice.name.padEnd(28)} ${voice.category ?? ''}  ${labels}`);
  }
}

const commands: Record<string, () => Promise<void>> = { plan, generate, check, voices: listVoices };
const command = commands[positionals[0] ?? ''];

if (!command) {
  console.error(`Usage: tsx scripts/audio/cli.ts <${Object.keys(commands).join('|')}> [options]`);
  process.exit(1);
}

command().catch((error: unknown) => {
  console.error(`\n${error instanceof ElevenLabsError || error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
