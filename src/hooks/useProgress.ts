import { useCallback, useState } from 'react';
import type { Lesson, ProgressState } from '../content/types';

const STORAGE_KEY = 'well-said:progress:v1';

export const emptyProgress: ProgressState = {
  version: 1,
  lessons: {},
  totalSentences: 0,
  totalReps: 0,
};

function loadProgress(): ProgressState {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return emptyProgress;
    const parsed = JSON.parse(value) as ProgressState;
    return parsed.version === 1 ? parsed : emptyProgress;
  } catch {
    return emptyProgress;
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>(loadProgress);

  const update = useCallback((change: (current: ProgressState) => ProgressState) => {
    setProgress((current) => {
      const next = change(current);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addRep = useCallback(
    (lesson: Lesson, lineId: string) => {
      update((current) => {
        const existing = current.lessons[lesson.id] ?? { repsByLine: {}, lastStep: 1 };
        return {
          ...current,
          totalReps: current.totalReps + 1,
          lessons: {
            ...current.lessons,
            [lesson.id]: {
              ...existing,
              repsByLine: {
                ...existing.repsByLine,
                [lineId]: (existing.repsByLine[lineId] ?? 0) + 1,
              },
            },
          },
        };
      });
    },
    [update],
  );

  const saveStep = useCallback(
    (lesson: Lesson, step: number) => {
      update((current) => {
        const existing = current.lessons[lesson.id] ?? { repsByLine: {}, lastStep: 1 };
        return {
          ...current,
          lessons: { ...current.lessons, [lesson.id]: { ...existing, lastStep: step } },
        };
      });
    },
    [update],
  );

  const complete = useCallback(
    (lesson: Lesson) => {
      update((current) => {
        const existing = current.lessons[lesson.id] ?? { repsByLine: {}, lastStep: 1 };
        const wasCompleted = Boolean(existing.completedAt);
        return {
          ...current,
          totalSentences: current.totalSentences + (wasCompleted ? 0 : lesson.lines.length),
          lessons: {
            ...current.lessons,
            [lesson.id]: { ...existing, lastStep: 5, completedAt: new Date().toISOString() },
          },
        };
      });
    },
    [update],
  );

  return { progress, addRep, saveStep, complete };
}
