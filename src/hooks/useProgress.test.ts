import { beforeEach, describe, expect, it } from 'vitest';
import { loadProgress } from './useProgress';

describe('progress storage migration', () => {
  beforeEach(() => localStorage.clear());

  it('migrates v1 reps and lesson history without carrying the inflated sentence total', () => {
    localStorage.setItem('well-said:progress:v1', JSON.stringify({
      version: 1,
      lessons: { example: { completedAt: '2026-01-01T00:00:00.000Z', repsByLine: { one: 2 }, lastStep: 5 } },
      totalSentences: 99,
      totalReps: 2,
    }));

    expect(loadProgress()).toEqual({
      version: 2,
      lessons: { example: { completedAt: '2026-01-01T00:00:00.000Z', repsByLine: { one: 2 }, lastStep: 5 } },
      totalReps: 2,
    });
    expect(JSON.parse(localStorage.getItem('well-said:progress:v2')!)).not.toHaveProperty('totalSentences');
  });
});
