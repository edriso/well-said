/**
 * Model-audio pipeline for Well Said.
 *
 *   npm run audio:plan     -- [selection] [options]  pending files and credits needed; credits remaining
 *   npm run audio:generate -- [selection] [options]  synthesize, normalize, and register audio
 *   npm run audio:check                              validate files, fingerprints, takes, loudness, and size
 *   npm run audio:prune                              drop recordings whose text changed, whose take was
 *                                                    rejected, or whose lesson is gone
 *   npm run audio:retakes                            bring Stress Mode takes in line with the review file
 *   npm run audio:screen   -- [selection]            score how clearly each Stress Mode take stresses its word
 *   npm run audio:voices                             list voices available to your API key
 *
 * Selection (default: the Start Here collection):
 *   --lesson=<id>[,<id>]   --collection="<name>"   --all   --limit=<n>
 *   --non-commercial       lessons whose audio came from a free/pay-as-you-go plan (re-voice with --force --fresh)
 *   --retakes              lessons whose Stress Mode takes differ from content/stress-audio-rejected.json
 * Options:
 *   --no-stress     skip Stress Mode takes (registered ones are kept). By default every performable
 *                   option is voiced; the review file rejects a take ("reason") or asks for a re-take
 *                   ({ "reason", "take": 2 }), which uses a new seed. --with-stress is still accepted.
 *   --force         re-process files even when the recorded text is unchanged (uses the raw cache)
 *   --fresh         with --force, ignore the raw cache and synthesize again (spends credits)
 *   --threshold=<n> screen: list takes scoring below n (default 0)
 *
 * Raw API responses are cached in .cache/audio-raw/ and alignments in .cache/alignments/, so
 * re-processing and re-screening never spend credits twice.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { audioPaths, canPerformStress, fingerprint, fullDialogueText, requestedStressTake, stressPerformanceText, stressSlug, stressTakeFingerprint, stressTextFingerprint, type AudioManifest, type LessonAudioEntry, type StressReview } from '../../src/content/audio';
import { lessons } from '../../src/content/lessons';
import type { Lesson } from '../../src/content/types';
import { castLesson, type Voice, type VoicePools } from './cast';
import { ALIGNMENT_CACHE_DIR, config, MANIFEST_PATH, STRESS_SCREEN_REPORT, RAW_CACHE_DIR, PROVENANCE_PATH, PUBLIC_DIR, REJECTED_STRESS_PATH, requireApiKey } from './config';
import { createClient, ElevenLabsError, type ElevenLabsClient } from './elevenlabs';
import { assertFfmpeg, concatDialogue, LOUDNESS, measure, processClip } from './ffmpeg';
import { screenStress } from './screen';

/** Stress takes a reviewer heard and rejected (reason) or asked to re-take ({ reason, take }). */
type RejectedStress = { version: 1; lessons: StressReview };

type Provenance = {
  version: 1;
  lessons: Record<string, { generatedAt: string; provider: 'ElevenLabs'; model: string; stressModel?: string; voices: Record<string, string>; plan?: string; commercialUse?: boolean }>;
};

/** Where a file's fingerprint lives in the manifest entry. */
type Slot = { kind: 'lines' | 'stress'; key: string } | { kind: 'expressions'; key: number };

type Job = { slot: Slot; path: string; text: string; fingerprint: string; voice: Voice; modelId: string; take?: number; previousText?: string; nextText?: string };

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
    'non-commercial': { type: 'boolean', default: false },
    limit: { type: 'string' },
    force: { type: 'boolean', default: false },
    fresh: { type: 'boolean', default: false },
    'with-stress': { type: 'boolean', default: false },
    'no-stress': { type: 'boolean', default: false },
    retakes: { type: 'boolean', default: false },
    threshold: { type: 'string' },
  },
});

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;
const writeJson = (path: string, value: unknown) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const publicPath = (relative: string) => resolve(PUBLIC_DIR, relative);
const order = new Map(lessons.map((lesson, index) => [lesson.id, index]));
const sortByCatalog = <T>(record: Record<string, T>) =>
  Object.fromEntries(Object.entries(record).sort(([a], [b]) => (order.get(a) ?? 1e9) - (order.get(b) ?? 1e9)));
const formatBytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const rejectedStress = existsSync(REJECTED_STRESS_PATH) ? readJson<RejectedStress>(REJECTED_STRESS_PATH).lessons : {};

if (flags['no-stress'] && (flags['with-stress'] || flags.retakes)) {
  console.error('--no-stress cannot be combined with --with-stress or --retakes.');
  process.exit(1);
}
const withStress = !flags['no-stress'];

/** Repository space per voiced lesson, Stress Mode included (measured on the full catalog). */
const MB_PER_LESSON = 0.75;

/** Free and pay-as-you-go audio is licensed for non-commercial use with attribution only. */
const isCommercialPlan = (tier: string) => !['free', 'payg'].includes(tier);

/** Voice IDs from provenance labels such as "Jessica - Warm (cgSgspJ2msm6clMCkdW9)". */
const voiceIdsOf = (voices: Record<string, string>) =>
  Object.fromEntries(Object.entries(voices).map(([speaker, label]) => [speaker, label.match(/\(([^()]+)\)$/)?.[1] ?? label]));

/**
 * True when the lesson was voiced with this model and these voice IDs. IDs are
 * compared rather than display names, so a voice renamed by ElevenLabs does
 * not trigger a re-voice.
 */
const castMatches = (lesson: Lesson, cast: Map<string, Voice>, previous: Provenance['lessons'][string] | undefined) => {
  if (!previous || previous.model !== config.modelId) return false;
  const ids = voiceIdsOf(previous.voices);
  return Object.keys(ids).length === lesson.speakers.length
    && lesson.speakers.every((speaker) => ids[speaker.name] === cast.get(speaker.id)!.id);
};
const stressTake = (lesson: Lesson, word: string) => requestedStressTake(rejectedStress, lesson.id, stressSlug(word));

/**
 * Stress options that may have model audio: the word must be in the sentence,
 * and the take must not have been rejected outright on review. (A rejected take
 * can't simply be regenerated: the seed comes from the text, so it would come
 * back identical. A re-take number changes the seed instead.)
 */
const stressOptions = (lesson: Lesson) => lesson.stressExercise.options.filter((option) =>
  canPerformStress(lesson.stressExercise.sentence, option.word) && stressTake(lesson, option.word) !== undefined);

/** The manifest value each performable stress option should have, including its take. */
const expectedStress = (lesson: Lesson) => new Map(stressOptions(lesson).map((option) => [
  stressSlug(option.word),
  stressTakeFingerprint(stressPerformanceText(lesson.stressExercise.sentence, option.word), stressTake(lesson, option.word)),
]));

function selectLessons(): Lesson[] {
  let selected: Lesson[];
  if (flags.lesson) {
    const ids = flags.lesson.split(',').map((id) => id.trim());
    const unknown = ids.filter((id) => !order.has(id));
    if (unknown.length) throw new Error(`Unknown lesson id(s): ${unknown.join(', ')}`);
    selected = lessons.filter((lesson) => ids.includes(lesson.id));
  } else if (flags.all) {
    selected = lessons;
  } else if (flags.retakes) {
    const manifest = readJson<AudioManifest>(MANIFEST_PATH);
    selected = lessons.filter((lesson) => [...expectedStress(lesson)].some(([slug, value]) =>
      manifest.lessons[lesson.id]?.stress[slug] !== value));
  } else if (flags['non-commercial']) {
    const provenance = readJson<Provenance>(PROVENANCE_PATH);
    selected = lessons.filter((lesson) => provenance.lessons[lesson.id]?.commercialUse === false);
  } else {
    const collection = flags.collection ?? 'Start Here';
    selected = lessons.filter((lesson) => lesson.collection === collection);
    if (!selected.length) throw new Error(`No lessons in collection "${collection}".`);
  }
  const limit = flags.limit ? Number(flags.limit) : undefined;
  return limit ? selected.slice(0, limit) : selected;
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
    for (const option of stressOptions(lesson)) {
      const text = stressPerformanceText(lesson.stressExercise.sentence, option.word);
      const take = stressTake(lesson, option.word)!;
      jobs.push({
        slot: { kind: 'stress', key: stressSlug(option.word) },
        path: audioPaths.stress(lesson.id, option.word),
        text,
        fingerprint: stressTakeFingerprint(text, take),
        voice: voiceFor(lesson.speakers[0]!.id),
        modelId: config.stressModelId,
        take,
      });
    }
  }
  return jobs;
}

const speechRequest = (job: Job) => ({
  voiceId: job.voice.id,
  text: job.text,
  modelId: job.modelId,
  outputFormat: config.outputFormat,
  // Take 1 keeps the text-derived seed (and its cache key); a re-take varies the seed for a new performance.
  seed: Number.parseInt(fingerprint(job.take && job.take > 1 ? `${job.text}#take${job.take}` : job.text), 16),
  ...(config.speed === 1 ? {} : { speed: config.speed }),
  previousText: job.previousText,
  nextText: job.nextText,
});

/** Cache file for a job's raw API response, keyed by everything that shapes the performance. */
const rawPath = (job: Job) => join(RAW_CACHE_DIR, `${fingerprint(JSON.stringify(speechRequest(job)))}.mp3`);

const isCurrent = (job: Job, entry: LessonAudioEntry | undefined) =>
  readSlot(entry, job.slot) === job.fingerprint && existsSync(publicPath(job.path));

/**
 * The entry with keys in lesson order (lines as authored, expressions, Stress Mode
 * options, then the full dialogue), so parallel jobs finishing in any order
 * never reshuffle the manifest.
 */
function orderedEntry(lesson: Lesson, entry: LessonAudioEntry): LessonAudioEntry {
  const pick = (record: Record<string, string>, keys: string[]) =>
    Object.fromEntries(keys.filter((key) => record[key] !== undefined).map((key) => [key, record[key]!]));
  return {
    lines: pick(entry.lines, lesson.lines.map((line) => line.id)),
    expressions: entry.expressions,
    stress: pick(entry.stress, lesson.stressExercise.options.map((option) => stressSlug(option.word))),
    ...(entry.full ? { full: entry.full } : {}),
  };
}

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

/**
 * Estimates what `generate` would do with the same flags: files not yet current
 * in the manifest, and the credits for the ones not already in the raw cache.
 */
async function plan() {
  const selected = selectLessons();
  const manifest = readJson<AudioManifest>(MANIFEST_PATH);
  const provenance = readJson<Provenance>(PROVENANCE_PATH);
  const pools: VoicePools = {
    female: config.voiceIds.female.map((id) => ({ id, name: id })),
    male: config.voiceIds.male.map((id) => ({ id, name: id })),
  };
  let files = 0;
  let characters = 0;
  let affected = 0;
  for (const lesson of selected) {
    const cast = castLesson(lesson, pools);
    // Mirror generate(): a cast or model change re-voices the whole lesson.
    const rebuild = flags.force || !castMatches(lesson, cast, provenance.lessons[lesson.id]);
    const pending = lessonJobs(lesson, cast, withStress)
      .filter((job) => rebuild || !isCurrent(job, manifest.lessons[lesson.id]));
    if (pending.length) affected += 1;
    files += pending.length;
    characters += pending.filter((job) => flags.fresh || !existsSync(rawPath(job))).reduce((sum, job) => sum + job.text.length, 0);
  }
  console.log(`Lessons: ${affected} of ${selected.length} selected need work  ·  files: ${files}  ·  credits: ${characters.toLocaleString()}`);
  // Only lessons without any audio grow the repository; other work replaces files in place.
  const newLessons = selected.filter((lesson) => !manifest.lessons[lesson.id]).length;
  if (newLessons) console.log(`Estimated repository growth: ~${formatBytes(newLessons * MB_PER_LESSON * 1024 * 1024)} for ${newLessons} new lesson(s) (about ${MB_PER_LESSON} MB each)`);
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
  const subscription = await client.subscription();
  let credits = subscription.character_limit - subscription.character_count;
  let synthesized = 0;
  const newStressTakes: string[] = [];

  for (const lesson of selected) {
    const cast = castLesson(lesson, pools);
    const voices = Object.fromEntries(lesson.speakers.map((speaker) => [speaker.name, `${cast.get(speaker.id)!.name} (${cast.get(speaker.id)!.id})`]));
    const previous = provenance.lessons[lesson.id];
    const castChanged = !castMatches(lesson, cast, previous);
    const registeredStress = manifest.lessons[lesson.id]?.stress ?? {};
    if (!withStress && castChanged && Object.keys(registeredStress).length) {
      throw new Error(`${lesson.id}: the cast or model changed, so its Stress Mode takes would no longer match the new voices. Run without --no-stress to re-voice them too.`);
    }
    const existing = castChanged || flags.force ? undefined : manifest.lessons[lesson.id];
    const entry: LessonAudioEntry = existing
      ? { ...existing, lines: { ...existing.lines }, expressions: [...existing.expressions], stress: { ...existing.stress } }
      : { lines: {}, expressions: [], stress: {} };
    // A run that skips Stress Mode must never discard the takes already registered.
    if (!withStress) entry.stress = { ...registeredStress };
    const allowedStress = new Set(stressOptions(lesson).map((option) => stressSlug(option.word)));
    for (const slug of Object.keys(entry.stress)) if (!allowedStress.has(slug)) delete entry.stress[slug];
    const pending = lessonJobs(lesson, cast, withStress).filter((job) => !isCurrent(job, existing));

    // Never start a lesson the remaining credits cannot finish, so no lesson is left half-voiced.
    const cost = pending.filter((job) => flags.fresh || !existsSync(rawPath(job))).reduce((sum, job) => sum + job.text.length, 0);
    if (cost > credits) {
      console.log(`\nStopping before ${lesson.id}: it needs ${cost.toLocaleString()} credits and ${credits.toLocaleString()} remain.`);
      console.log('Add credits or a new ELEVENLABS_API_KEY, then run the same command again to continue.');
      break;
    }

    process.stdout.write(`${lesson.id}: ${pending.length ? `${pending.length} file(s)` : 'up to date'}`);
    let synthesizedFiles = 0;
    await runPool(pending, config.concurrency, async (job) => {
      const raw = rawPath(job);
      if (flags.fresh || !existsSync(raw)) {
        await writeFile(raw, await client.speech(speechRequest(job)));
        synthesized += job.text.length;
        credits -= job.text.length;
        synthesizedFiles += 1;
        if (job.slot.kind === 'stress') newStressTakes.push(`${lesson.id}/stress-${job.slot.key}`);
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

    // Rights follow the plan each file was synthesized on. The lesson is commercial
    // only if every file came from a paid plan: a file kept from an earlier run, or
    // re-processed from the raw cache, keeps the earlier status.
    const voicedFiles = referencedFiles(lesson.id, entry).size - (entry.full ? 1 : 0);
    const allFresh = synthesizedFiles > 0 && synthesizedFiles === voicedFiles;
    const keptCommercial = previous?.commercialUse ?? false;
    const commercialUse = !pending.length && previous?.commercialUse !== undefined
      ? previous.commercialUse
      : allFresh
        ? isCommercialPlan(subscription.tier)
        : keptCommercial && (synthesizedFiles === 0 || isCommercialPlan(subscription.tier));

    manifest.lessons[lesson.id] = orderedEntry(lesson, entry);
    manifest.lessons = sortByCatalog(manifest.lessons);
    provenance.lessons[lesson.id] = {
      generatedAt: pending.length || !previous ? new Date().toISOString() : previous.generatedAt,
      provider: 'ElevenLabs',
      model: config.modelId,
      stressModel: Object.keys(entry.stress).length ? (withStress ? config.stressModelId : previous?.stressModel) : undefined,
      voices,
      // The plan of the most recent synthesis; commercialUse covers every file in the lesson.
      plan: synthesizedFiles || !previous?.plan ? subscription.tier : previous.plan,
      commercialUse,
    };
    provenance.lessons = sortByCatalog(provenance.lessons);
    writeJson(MANIFEST_PATH, manifest);
    writeJson(PROVENANCE_PATH, provenance);
    process.stdout.write(' ✓\n');
  }
  console.log(`Done. Synthesized ${synthesized.toLocaleString()} characters. Run \`npm run audio:check\` next.`);
  if (newStressTakes.length) {
    console.log(`\nListen to ${newStressTakes.length} new Stress Mode take(s) before committing; record weak ones in content/stress-audio-rejected.json:`);
    for (const take of newStressTakes) console.log(`  ${take}`);
  }
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
    const expectedTakes = expectedStress(lesson);
    for (const [slug, recorded] of Object.entries(entry.stress)) {
      const value = expectedTakes.get(slug);
      if (value === undefined) problems.push(`${lessonId}/stress-${slug}: rejected or not performable; run npm run audio:prune`);
      else if (stressTextFingerprint(recorded) !== stressTextFingerprint(value)) problems.push(`${lessonId}/stress-${slug}: text changed since recording; regenerate`);
      else if (recorded !== value) problems.push(`${lessonId}/stress-${slug}: take ${value.split('#')[1] ?? 1} requested, take ${recorded.split('#')[1] ?? 1} registered; run npm run audio:retakes`);
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

/**
 * Removes recordings that no longer match their text (or whose lesson/line no
 * longer exists) from the manifest, provenance, and disk. Use after rewriting
 * voiced content; regenerate afterwards to restore audio for those items.
 */
async function prune() {
  const manifest = readJson<AudioManifest>(MANIFEST_PATH);
  const provenance = readJson<Provenance>(PROVENANCE_PATH);
  let removedItems = 0;
  let removedLessons = 0;

  for (const [lessonId, entry] of Object.entries(manifest.lessons)) {
    const lesson = lessons.find((item) => item.id === lessonId);
    const kept: LessonAudioEntry = { lines: {}, expressions: [], stress: {} };
    if (lesson) {
      for (const line of lesson.lines) {
        if (entry.lines[line.id] === fingerprint(line.text)) kept.lines[line.id] = entry.lines[line.id]!;
      }
      lesson.expressions.forEach((expression, index) => {
        if (entry.expressions[index] === fingerprint(expression.phrase)) kept.expressions[index] = entry.expressions[index]!;
      });
      // Expression fingerprints are positional; stop at the first gap so indexes stay aligned with file names.
      const firstGap = kept.expressions.findIndex((value) => value === undefined);
      if (firstGap >= 0) kept.expressions = kept.expressions.slice(0, firstGap);
      // A take is kept only if it is the take the review asks for, so a rejected take never lingers.
      for (const [slug, value] of expectedStress(lesson)) {
        if (entry.stress[slug] === value) kept.stress[slug] = value;
      }
      const allLines = lesson.lines.every((line) => kept.lines[line.id]);
      if (allLines && entry.full === fingerprint(fullDialogueText(lesson))) kept.full = entry.full;
    }

    const before = referencedFiles(lessonId, entry).size;
    const after = referencedFiles(lessonId, kept).size;
    removedItems += before - after;
    if (after === 0) {
      delete manifest.lessons[lessonId];
      delete provenance.lessons[lessonId];
      rmSync(publicPath(audioPaths.dir(lessonId)), { recursive: true, force: true });
      removedLessons += 1;
    } else {
      manifest.lessons[lessonId] = kept;
      removeUnreferenced(lessonId, kept);
    }
  }

  writeJson(MANIFEST_PATH, manifest);
  writeJson(PROVENANCE_PATH, provenance);
  console.log(`Pruned ${removedItems} stale file(s); ${removedLessons} lesson(s) no longer have model audio.`);
}

/** Scores every registered Stress Mode take (see screen.ts) and lists the weak ones. */
async function screen() {
  await assertFfmpeg();
  const threshold = flags.threshold === undefined ? 0 : Number(flags.threshold);
  if (!Number.isFinite(threshold)) throw new Error('--threshold must be a number.');
  const client = config.apiKey ? createClient(requireApiKey()) : undefined;
  const results = await screenStress(selectLessons(), PUBLIC_DIR, ALIGNMENT_CACHE_DIR, client);
  writeJson(STRESS_SCREEN_REPORT, results);

  const scores = results.map((result) => result.score).sort((a, b) => a - b);
  const at = (quantile: number) => scores[Math.floor(quantile * (scores.length - 1))]?.toFixed(2) ?? 'n/a';
  console.log(`Screened ${scores.length} takes · p10 ${at(0.1)} · median ${at(0.5)} · below 0: ${scores.filter((score) => score < 0).length}`);
  const weak = results.filter((result) => result.score < threshold).sort((a, b) => a.score - b.score);
  if (!weak.length) {
    console.log(`No takes below ${threshold}.`);
    return;
  }
  const signed = (value: number, unit: string) => `${value >= 0 ? '+' : ''}${value}${unit}`;
  console.log(`\n${weak.length} take(s) below ${threshold} (target word vs. the same word in sibling takes):`);
  for (const result of weak) {
    console.log(`  ${result.score.toFixed(2).padStart(6)}  ${signed(result.loudnessDb, ' dB').padStart(8)}  ${signed(result.durationPct, '%').padStart(5)}  ${result.lessonId}/${result.slug}`);
  }
  console.log(`\nFull report: ${STRESS_SCREEN_REPORT}. Request re-takes in content/stress-audio-rejected.json, then run npm run audio:retakes.`);
}

async function listVoices() {
  const voices = await createClient(requireApiKey()).voices();
  for (const voice of voices) {
    const labels = Object.values(voice.labels ?? {}).join(', ');
    console.log(`${voice.voice_id}  ${voice.name.padEnd(28)} ${voice.category ?? ''}  ${labels}`);
  }
}

const commands: Record<string, () => Promise<void>> = { plan, generate, check, prune, screen, voices: listVoices };
const command = commands[positionals[0] ?? ''];

if (!command) {
  console.error(`Usage: tsx scripts/audio/cli.ts <${Object.keys(commands).join('|')}> [options]`);
  process.exit(1);
}

command().catch((error: unknown) => {
  console.error(`\n${error instanceof ElevenLabsError || error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
