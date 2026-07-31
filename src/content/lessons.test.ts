import { describe, expect, it } from 'vitest';
import { getLessonById, getTodaysLesson, lessons } from './lessons';

describe('lesson content', () => {
  it('has stable unique identifiers throughout the curriculum', () => {
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(lessons.length);
    for (const lesson of lessons) {
      expect(new Set(lesson.lines.map((line) => line.id)).size).toBe(lesson.lines.length);
      expect(lesson.lines.length).toBeGreaterThanOrEqual(5);
      expect(lesson.speakers).toHaveLength(2);
      expect(lesson.stressExercise.options.some((option) => option.word === lesson.stressExercise.answer)).toBe(true);
      for (const line of lesson.lines) {
        expect(lesson.speakers.some((speaker) => speaker.id === line.speakerId)).toBe(true);
        expect(line.phraseGroups.join(' ').replace(/[!?.,]/g, '').toLowerCase()).toBe(line.text.replace(/[!?.,]/g, '').toLowerCase());
      }
    }
  });

  it('selects a deterministic daily lesson', () => {
    const lesson = getTodaysLesson(new Date('2026-01-01T12:00:00'));
    expect(lesson).toBe(lessons[0]);
    expect(getLessonById(lesson.id)).toBe(lesson);
  });
});
