import { describe, expect, it } from 'vitest';
import { flagshipLessonIds, getLessonById, getTodaysLesson, lessons } from './lessons';
import { LESSON_CATEGORIES } from './types';

const normalize = (value: string) => value
  .normalize('NFKC')
  .toLocaleLowerCase('en')
  .replace(/[\p{P}\p{S}]+/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const tokens = (value: string) => value.toLocaleLowerCase('en').match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? [];

const trigrams = (value: string) => {
  const words = tokens(value);
  return new Set(words.slice(0, -2).map((word, index) => `${word} ${words[index + 1]} ${words[index + 2]}`));
};

const overlap = (left: Set<string>, right: Set<string>) => {
  const shared = [...left].filter((item) => right.has(item)).length;
  return shared / Math.max(1, Math.min(left.size, right.size));
};

describe('six-month lesson catalog', () => {
  it('contains 184 ordered, distinct workouts', () => {
    expect(lessons).toHaveLength(184);
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(lessons.length);
    expect(new Set(lessons.map((lesson) => normalize(lesson.title))).size).toBe(lessons.length);
    expect(new Set(lessons.map((lesson) => normalize(lesson.situation))).size).toBe(lessons.length);
    expect(new Set(lessons.map((lesson) => normalize(lesson.lines.map((line) => line.text).join(' ')))).size).toBe(lessons.length);
    expect(new Set(lessons.map((lesson) => normalize(lesson.expressions.map((expression) => expression.phrase).join(' ')))).size).toBe(lessons.length);
    expect(lessons.map((lesson) => lesson.number)).toEqual(Array.from({ length: lessons.length }, (_, index) => index + 1));
  });

  it('publishes a 14-workout Start Here collection and no drafts', () => {
    expect(flagshipLessonIds).toHaveLength(14);
    for (const id of flagshipLessonIds) {
      const lesson = getLessonById(id)!;
      expect(lesson.contentStatus).toBe('reviewed');
      expect(lesson.collection).toBe('Start Here');
    }
    expect(lessons.filter((lesson) => lesson.contentStatus === 'draft')).toHaveLength(0);
  });

  it('contains only hand-authored dialogue, with no template remnants', () => {
    for (const lesson of lessons) {
      expect(lesson.stressExercise.sentence).not.toMatch(/not the other option/i);
      expect(lesson.speakers.map((speaker) => speaker.role)).not.toContain('Helper');
      expect(lesson.speakers.map((speaker) => speaker.role)).not.toContain('Specialist');
      for (const expression of lesson.expressions) expect(expression.meaning).not.toMatch(/^A natural way to open this specific conversation/);
    }
  });

  it('rotates speaking focus within every situation family', () => {
    // Start Here lessons carry hand-named focuses; the rest of the catalog rotates through ten shared ones.
    const rotating = lessons.filter((lesson) => lesson.collection !== 'Start Here');
    const focusCounts = new Map<string, number>();
    for (const lesson of rotating) focusCounts.set(lesson.focus, (focusCounts.get(lesson.focus) ?? 0) + 1);
    expect(focusCounts.size).toBe(10);
    for (const count of focusCounts.values()) expect(count).toBeGreaterThanOrEqual(15);
    for (const category of LESSON_CATEGORIES) {
      expect(new Set(rotating.filter((lesson) => lesson.category === category).map((lesson) => lesson.focus)).size).toBeGreaterThanOrEqual(8);
    }
  });

  it('flags near-duplicate full dialogues before publication', () => {
    const dialogueTrigrams = lessons.map((lesson) => trigrams(lesson.lines.map((line) => line.text).join(' ')));
    for (let left = 0; left < lessons.length; left += 1) {
      for (let right = left + 1; right < lessons.length; right += 1) {
        expect(overlap(dialogueTrigrams[left]!, dialogueTrigrams[right]!)).toBeLessThan(0.72);
      }
    }
  });

  it('keeps every lesson structurally valid and production-ready', () => {
    const globalLineIds = new Set<string>();

    for (const lesson of lessons) {
      expect(lesson.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(lesson.lines.length).toBeGreaterThanOrEqual(5);
      expect(lesson.lines.length).toBeLessThanOrEqual(7);
      expect(lesson.speakers).toHaveLength(2);
      expect(lesson.speakers[0]?.color).not.toBe(lesson.speakers[1]?.color);
      expect(lesson.expressions.length).toBeGreaterThanOrEqual(2);
      expect(lesson.expressions.length).toBeLessThanOrEqual(3);
      expect(lesson.durationSeconds).toBeGreaterThanOrEqual(30);
      expect(lesson.durationSeconds).toBeLessThanOrEqual(75);
      expect(lesson.estimatedMinutes).toBeGreaterThanOrEqual(7);
      expect(lesson.estimatedMinutes).toBeLessThanOrEqual(15);

      const speakerIds = new Set(lesson.speakers.map((speaker) => speaker.id));
      const usedSpeakers = new Set<string>();
      const localLineTexts = new Set<string>();
      for (const line of lesson.lines) {
        expect(globalLineIds.has(line.id)).toBe(false);
        globalLineIds.add(line.id);
        expect(speakerIds.has(line.speakerId)).toBe(true);
        usedSpeakers.add(line.speakerId);
        expect(localLineTexts.has(normalize(line.text))).toBe(false);
        localLineTexts.add(normalize(line.text));
        expect(tokens(line.phraseGroups.join(' '))).toEqual(tokens(line.text));
        expect(line.stressWords.length).toBeGreaterThanOrEqual(1);
        expect(line.stressWords.length).toBeLessThanOrEqual(3);
        const lineTokens = tokens(line.text);
        for (const stressWord of line.stressWords) expect(lineTokens).toContain(stressWord.toLocaleLowerCase('en'));
      }
      expect(usedSpeakers).toEqual(speakerIds);

      const exercise = lesson.stressExercise;
      const optionWords = exercise.options.map((option) => option.word.toLocaleLowerCase('en'));
      expect(exercise.options).toHaveLength(3);
      expect(new Set(optionWords).size).toBe(3);
      expect(optionWords.filter((word) => word === exercise.answer.toLocaleLowerCase('en'))).toHaveLength(1);
      for (const word of optionWords) expect(tokens(exercise.sentence)).toContain(word);
    }
  });

  it('balances levels and situations throughout the rotation', () => {
    for (const category of LESSON_CATEGORIES) {
      const share = lessons.filter((lesson) => lesson.category === category).length / lessons.length;
      expect(share).toBeGreaterThanOrEqual(0.05);
      expect(share).toBeLessThanOrEqual(0.15);
    }
    for (const level of ['A2–B1', 'B1–B2', 'B2–C1'] as const) {
      const share = lessons.filter((lesson) => lesson.level === level).length / lessons.length;
      expect(share).toBeGreaterThanOrEqual(0.2);
      expect(share).toBeLessThanOrEqual(0.5);
    }
    const circular = [...lessons, ...lessons.slice(0, 13)];
    for (let index = 0; index < lessons.length; index += 1) {
      expect(new Set(circular.slice(index, index + 14).map((lesson) => lesson.category)).size).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('daily rotation', () => {
  it('uses a stable documented anchor', () => {
    const lesson = getTodaysLesson(new Date(2026, 0, 1, 12));
    expect(lesson).toBe(lessons[0]);
    expect(getLessonById(lesson.id)).toBe(lesson);
  });

  it('does not repeat across any 184 consecutive civil days', () => {
    const starts = [new Date(2025, 9, 1, 12), new Date(2026, 0, 1, 12), new Date(2027, 10, 1, 12), new Date(2028, 0, 1, 12)];
    for (const start of starts) {
      const ids = Array.from({ length: 184 }, (_, offset) => getTodaysLesson(new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset, 12)).id);
      expect(new Set(ids).size).toBe(184);
    }
  });

  it('advances correctly across New Year and leap day', () => {
    const newYearPair = [getTodaysLesson(new Date(2026, 11, 31, 12)), getTodaysLesson(new Date(2027, 0, 1, 12))];
    const leapPair = [getTodaysLesson(new Date(2028, 1, 28, 12)), getTodaysLesson(new Date(2028, 1, 29, 12))];
    expect((newYearPair[0]!.number % lessons.length) + 1).toBe(newYearPair[1]!.number);
    expect((leapPair[0]!.number % lessons.length) + 1).toBe(leapPair[1]!.number);
  });
});
