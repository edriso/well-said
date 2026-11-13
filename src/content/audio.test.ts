import { describe, expect, it } from 'vitest';
import rejectedStress from '../../content/stress-audio-rejected.json';
import { attachAudio, audioManifest, audioPaths, canPerformStress, currentTimings, fingerprint, fullDialogueText, hasModelAudio, requestedStressTake, spokenWordIndex, stressPerformanceText, stressSlug, stressTakeFingerprint, type AudioManifest, type LessonTimings, type StressReview } from './audio';
import { getLessonById, lessons } from './lessons';

const filesOnDisk = new Set(Object.keys(import.meta.glob('/public/audio/lessons/**/*.mp3')));
const onDisk = (path: string) => filesOnDisk.has(path);
const publicFile = (path: string) => `/public/${path}`;
const review = rejectedStress.lessons as StressReview;
const timingFiles = import.meta.glob<LessonTimings>('/public/audio/lessons/*/timings.json', { eager: true, import: 'default' });

describe('audio contract', () => {
  it('fingerprints text deterministically', () => {
    expect(fingerprint('Sounds good.')).toBe(fingerprint('Sounds good.'));
    expect(fingerprint('Sounds good.')).not.toBe(fingerprint('Sounds good!'));
    expect(fingerprint('café')).toBe(fingerprint('café'));
    expect(fingerprint('')).toMatch(/^[0-9a-f]{8}$/);
  });

  it('builds stress performances and safe file slugs', () => {
    expect(stressPerformanceText('Could I get a small latte?', 'small')).toBe('Could I get a SMALL latte?');
    expect(stressPerformanceText('I thought the meeting was tomorrow.', 'tomorrow')).toBe('I thought the meeting was TOMORROW.');
    expect(stressSlug('Café?')).toBe('cafe');
  });

  it('quotes words that capitalization cannot mark', () => {
    expect(stressPerformanceText('Could I get a small latte?', 'I')).toBe('Could "I" get a small latte?');
    expect(stressPerformanceText('I said I would.', 'I')).toBe('"I" said "I" would.');
    expect(stressPerformanceText('Gate C, not B.', 'C')).toBe('Gate "C", not B.');
    expect(stressPerformanceText("I'm sure.", "I'm")).toBe("I'M sure.");
  });

  it('only attaches stress audio for words the sentence contains', () => {
    expect(canPerformStress('Could I get a small latte?', 'small')).toBe(true);
    expect(canPerformStress('Could I get a small latte?', 'I')).toBe(true);
    expect(canPerformStress('Could I get a small latte?', 'mocha')).toBe(false);

    const attached = getLessonById('ordering-coffee')!;
    const lesson = {
      ...attached,
      stressExercise: { ...attached.stressExercise, options: attached.stressExercise.options.map((option) => ({ ...option, audio: undefined })) },
    };
    const { sentence } = lesson.stressExercise;
    const manifest: AudioManifest = {
      version: 1,
      lessons: {
        [lesson.id]: {
          lines: {},
          expressions: [],
          // A take recorded from the unmarked sentence is not a stressed performance.
          stress: { i: fingerprint(sentence), small: fingerprint(stressPerformanceText(sentence, 'small')) },
        },
      },
    };
    const options = attachAudio(lesson, manifest).stressExercise.options;
    expect(options.find((option) => option.word === 'I')!.audio).toBeUndefined();
    expect(options.find((option) => option.word === 'small')!.audio).toBe(audioPaths.stress(lesson.id, 'small'));
  });

  it('finds the spoken word, holding it briefly through the following pause', () => {
    const words: [number, number][] = [[0.2, 0.5], [0.6, 0.9], [1.5, 1.8]];
    expect(spokenWordIndex(words, 0.1)).toBe(-1);
    expect(spokenWordIndex(words, 0.3)).toBe(0);
    expect(spokenWordIndex(words, 0.55)).toBe(0);
    expect(spokenWordIndex(words, 0.7)).toBe(1);
    expect(spokenWordIndex(words, 1.3)).toBe(-1);
    expect(spokenWordIndex(words, 1.6)).toBe(2);
  });

  it('uses only timings that still match the text', () => {
    const lesson = getLessonById('ordering-coffee')!;
    const [first, second] = lesson.lines;
    const wordsFor = (text: string) => text.split(/\s+/).map((_, index): [number, number] => [index, index + 0.5]);
    const timings: LessonTimings = {
      version: 1,
      lines: {
        [first!.id]: { fingerprint: fingerprint(first!.text), audio: 'hash', words: wordsFor(first!.text) },
        [second!.id]: { fingerprint: fingerprint('an older version'), audio: 'hash', words: wordsFor(second!.text) },
      },
      full: { fingerprint: fingerprint(fullDialogueText(lesson)), audio: 'hash', lines: Object.fromEntries(lesson.lines.map((line) => [line.id, wordsFor(line.text)])) },
    };
    const valid = currentTimings(lesson, timings);
    expect(valid.lines.has(first!.id)).toBe(true);
    expect(valid.lines.has(second!.id)).toBe(false);
    expect(valid.full.size).toBe(lesson.lines.length);

    const wrongCount = { ...timings, lines: { [first!.id]: { ...timings.lines[first!.id]!, words: [[0, 1]] as [number, number][] } } };
    expect(currentTimings(lesson, wrongCount).lines.size).toBe(0);
    expect(currentTimings(lesson, { ...timings, full: { ...timings.full!, fingerprint: 'stale' } }).full.size).toBe(0);
    expect(currentTimings(lesson, undefined).lines.size).toBe(0);
  });

  it('tracks stress re-takes without breaking existing takes', () => {
    const text = 'Could I get a SMALL latte?';
    expect(stressTakeFingerprint(text)).toBe(fingerprint(text));
    expect(stressTakeFingerprint(text, 1)).toBe(fingerprint(text));
    expect(stressTakeFingerprint(text, 3)).toBe(`${fingerprint(text)}#3`);

    const decisions: StressReview = { lesson: { flat: 'No usable take.', weak: { reason: 'Stress too soft.', take: 2 } } };
    expect(requestedStressTake(decisions, 'lesson', 'flat')).toBeUndefined();
    expect(requestedStressTake(decisions, 'lesson', 'weak')).toBe(2);
    expect(requestedStressTake(decisions, 'lesson', 'fine')).toBe(1);
    expect(requestedStressTake(decisions, 'other', 'weak')).toBe(1);

    // The app plays a re-take exactly like a first take.
    const attached = getLessonById('ordering-coffee')!;
    const { sentence } = attached.stressExercise;
    const manifest: AudioManifest = {
      version: 1,
      lessons: { [attached.id]: { lines: {}, expressions: [], stress: { small: stressTakeFingerprint(stressPerformanceText(sentence, 'small'), 2) } } },
    };
    const options = attachAudio(attached, manifest).stressExercise.options;
    expect(options.find((option) => option.word === 'small')!.audio).toBe(audioPaths.stress(attached.id, 'small'));
  });

  it('keeps the stress review file well-formed', () => {
    for (const [lessonId, decisions] of Object.entries(review)) {
      const lesson = getLessonById(lessonId);
      expect(lesson, `stress review names unknown lesson ${lessonId}`).toBeDefined();
      for (const [slug, decision] of Object.entries(decisions)) {
        const option = lesson!.stressExercise.options.find((item) => stressSlug(item.word) === slug);
        expect(option, `stress review names unknown option ${lessonId}/${slug}`).toBeDefined();
        const reason = typeof decision === 'string' ? decision : decision.reason;
        expect(reason.trim(), `${lessonId}/${slug} needs a reason`).not.toBe('');
        if (typeof decision !== 'string') {
          expect(Number.isInteger(decision.take) && decision.take >= 2, `${lessonId}/${slug}: take must be a whole number, 2 or more`).toBe(true);
        }
      }
    }
  });

  it('attaches only recordings whose text still matches', () => {
    const attached = getLessonById('ordering-coffee')!;
    const lesson = {
      ...attached,
      fullAudio: undefined,
      lines: attached.lines.map((line) => ({ ...line, audio: undefined })),
      expressions: attached.expressions.map((expression) => ({ ...expression, audio: undefined })),
    };
    const [first, second] = lesson.lines;
    const manifest: AudioManifest = {
      version: 1,
      lessons: {
        [lesson.id]: {
          full: fingerprint(fullDialogueText(lesson)),
          lines: { [first!.id]: fingerprint(first!.text), [second!.id]: fingerprint('an older version of this line') },
          expressions: [fingerprint(lesson.expressions[0]!.phrase)],
          stress: {},
        },
      },
    };
    const withAudio = attachAudio(lesson, manifest);
    expect(withAudio.fullAudio).toBe(audioPaths.full(lesson.id));
    expect(withAudio.lines[0]!.audio).toBe(`audio/lessons/ordering-coffee/${first!.id}.mp3`);
    expect(withAudio.lines[1]!.audio).toBeUndefined();
    expect(withAudio.expressions[0]!.audio).toBe('audio/lessons/ordering-coffee/expression-01.mp3');
    expect(withAudio.expressions[1]!.audio).toBeUndefined();
    expect(hasModelAudio(withAudio)).toBe(false);
  });

  it('has current word timings for every voiced line and full dialogue', () => {
    for (const lesson of lessons.filter(hasModelAudio)) {
      const timings = timingFiles[`/public/${audioPaths.timings(lesson.id)}`];
      expect(timings, `${lesson.id} has no timings.json; run npm run audio:timings`).toBeDefined();
      const valid = currentTimings(lesson, timings);
      for (const line of lesson.lines) {
        expect(valid.lines.has(line.id), `${lesson.id}/${line.id} timings are missing or stale; run npm run audio:timings`).toBe(true);
        if (lesson.fullAudio) expect(valid.full.has(line.id), `${lesson.id} full-dialogue timings are missing or stale`).toBe(true);
      }
    }
  });

  it('has a current file on disk for every manifest entry', () => {
    for (const [lessonId, entry] of Object.entries(audioManifest.lessons)) {
      const lesson = lessons.find((item) => item.id === lessonId);
      expect(lesson, `${lessonId} is in the audio manifest but not the curriculum`).toBeDefined();
      for (const line of lesson!.lines) {
        const recorded = entry.lines[line.id];
        if (recorded === undefined) continue;
        expect(recorded, `${lessonId}/${line.id} changed after recording; run npm run audio:generate`).toBe(fingerprint(line.text));
        expect(onDisk(publicFile(audioPaths.line(lessonId, line.id))), `${lessonId}/${line.id}.mp3 is missing`).toBe(true);
      }
      lesson!.expressions.forEach((expression, index) => {
        const recorded = entry.expressions[index];
        if (recorded === undefined) return;
        expect(recorded, `${lessonId} expression ${index + 1} changed after recording`).toBe(fingerprint(expression.phrase));
        expect(onDisk(publicFile(audioPaths.expression(lessonId, index)))).toBe(true);
      });
      for (const [slug, recorded] of Object.entries(entry.stress)) {
        const option = lesson!.stressExercise.options.find((item) => stressSlug(item.word) === slug);
        expect(option, `${lessonId}/stress-${slug} has no matching stress option`).toBeDefined();
        const { sentence } = lesson!.stressExercise;
        expect(canPerformStress(sentence, option!.word), `${lessonId}/stress-${slug} names a word the sentence does not contain`).toBe(true);
        const take = requestedStressTake(review, lessonId, slug);
        expect(take, `${lessonId}/stress-${slug} was rejected on review; run npm run audio:prune`).toBeDefined();
        const text = stressPerformanceText(sentence, option!.word);
        expect(recorded.split('#')[0], `${lessonId}/stress-${slug} changed after recording`).toBe(fingerprint(text));
        expect(recorded, `${lessonId}/stress-${slug}: take ${take} requested on review; run npm run audio:retakes`).toBe(stressTakeFingerprint(text, take));
        expect(onDisk(publicFile(audioPaths.stress(lessonId, option!.word))), `${lessonId}/stress-${slug}.mp3 is missing`).toBe(true);
      }
      if (entry.full) {
        expect(entry.full, `${lessonId} full dialogue is stale`).toBe(fingerprint(fullDialogueText(lesson!)));
        expect(onDisk(publicFile(audioPaths.full(lessonId)))).toBe(true);
      }
    }
  });
});
