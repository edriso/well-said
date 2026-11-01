import { describe, expect, it } from 'vitest';
import { attachAudio, audioManifest, audioPaths, fingerprint, fullDialogueText, hasModelAudio, stressPerformanceText, stressSlug, type AudioManifest } from './audio';
import { getLessonById, lessons } from './lessons';

const filesOnDisk = new Set(Object.keys(import.meta.glob('/public/audio/lessons/**/*.mp3')));
const onDisk = (path: string) => filesOnDisk.has(path);
const publicFile = (path: string) => `/public/${path}`;

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
      if (entry.full) {
        expect(entry.full, `${lessonId} full dialogue is stale`).toBe(fingerprint(fullDialogueText(lesson!)));
        expect(onDisk(publicFile(audioPaths.full(lessonId)))).toBe(true);
      }
    }
  });
});
