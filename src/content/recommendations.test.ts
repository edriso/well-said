import { describe, expect, it } from 'vitest';
import { emptyProgress } from '../hooks/useProgress';
import { defaultPreferences } from '../hooks/usePreferences';
import { getTodaysLesson } from './lessons';
import { selectDailyLesson } from './recommendations';

const date = new Date(2026, 4, 10, 12);

describe('daily lesson recommendation', () => {
  it('keeps the calendar rotation when no preferences are set', () => {
    expect(selectDailyLesson(emptyProgress, defaultPreferences, date)).toBe(getTodaysLesson(date));
  });

  it('prioritizes an unfinished preferred situation near the scheduled lesson', () => {
    const recommended = selectDailyLesson(emptyProgress, { version: 1, comfort: 'stretch', areas: ['Work'] }, date);
    expect(recommended.category).toBe('Work');
    expect(recommended.level).toBe('B2–C1');
  });
});
