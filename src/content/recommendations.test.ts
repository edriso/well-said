import { describe, expect, it } from 'vitest';
import { emptyProgress } from '../hooks/useProgress';
import { defaultPreferences } from '../hooks/usePreferences';
import type { ProgressState } from './types';
import { flagshipLessonIds, getTodaysLesson } from './lessons';
import { selectDailyLesson } from './recommendations';

const date = new Date(2026, 4, 10, 12);
const yesterday = new Date(2026, 4, 9, 12).toISOString();

const progressWith = (ids: string[], completedAt = yesterday): ProgressState => ({
  ...emptyProgress,
  lessons: Object.fromEntries(ids.map((id) => [id, { completedAt, repsByLine: {}, lastStep: 4 }])),
});
const graduated = progressWith(flagshipLessonIds);

describe('daily lesson recommendation', () => {
  it('starts new learners on the first Start Here workout', () => {
    expect(selectDailyLesson(emptyProgress, defaultPreferences, date).id).toBe(flagshipLessonIds[0]);
  });

  it('moves through Start Here in order and keeps today’s finished workout', () => {
    expect(selectDailyLesson(progressWith(flagshipLessonIds.slice(0, 2)), defaultPreferences, date).id).toBe(flagshipLessonIds[2]);
    const finishedToday = progressWith([flagshipLessonIds[0]!], date.toISOString());
    expect(selectDailyLesson(finishedToday, defaultPreferences, date).id).toBe(flagshipLessonIds[0]);
  });

  it('prefers a Start Here workout in a chosen situation', () => {
    const recommended = selectDailyLesson(emptyProgress, { version: 1, comfort: 'everyday', areas: ['Travel'] }, date);
    expect(recommended.collection).toBe('Start Here');
    expect(recommended.category).toBe('Travel');
  });

  it('keeps the calendar rotation after Start Here when no preferences are set', () => {
    expect(selectDailyLesson(graduated, defaultPreferences, date)).toBe(getTodaysLesson(date));
  });

  it('prioritizes an unfinished preferred situation near the scheduled lesson', () => {
    const recommended = selectDailyLesson(graduated, { version: 1, comfort: 'stretch', areas: ['Work'] }, date);
    expect(recommended.category).toBe('Work');
    expect(recommended.level).toBe('B2–C1');
  });
});
