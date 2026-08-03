import { useCallback, useState } from 'react';
import type { Lesson, ProgressState, WorkoutFeel } from '../content/types';

const STORAGE_KEY = 'well-said:progress:v2';
const LEGACY_STORAGE_KEY = 'well-said:progress:v1';

export const emptyProgress: ProgressState = {
  version: 2,
  lessons: {},
  totalReps: 0,
};

export function loadProgress(): ProgressState {
  try {
    const value = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!value) return emptyProgress;
    const parsed = JSON.parse(value) as ProgressState | (Omit<ProgressState, 'version'> & { version: 1; totalSentences?: number });
    if (parsed.version === 2 && parsed.lessons && Number.isFinite(parsed.totalReps)) return parsed;
    if (parsed.version === 1) {
      const migrated: ProgressState = { version: 2, lessons: parsed.lessons, totalReps: parsed.totalReps };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return emptyProgress;
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
              lastPracticedAt: new Date().toISOString(),
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

  const saveLine = useCallback(
    (lesson: Lesson, lineIndex: number) => {
      update((current) => {
        const existing = current.lessons[lesson.id] ?? { repsByLine: {}, lastStep: 1 };
        return {
          ...current,
          lessons: { ...current.lessons, [lesson.id]: { ...existing, lastLineIndex: lineIndex } },
        };
      });
    },
    [update],
  );

  const saveFeel = useCallback(
    (lesson: Lesson, felt: WorkoutFeel) => {
      update((current) => {
        const existing = current.lessons[lesson.id] ?? { repsByLine: {}, lastStep: 1 };
        return {
          ...current,
          lessons: { ...current.lessons, [lesson.id]: { ...existing, felt } },
        };
      });
    },
    [update],
  );

  const complete = useCallback(
    (lesson: Lesson) => {
      update((current) => {
        const existing = current.lessons[lesson.id] ?? { repsByLine: {}, lastStep: 1 };
        const now = new Date().toISOString();
        return {
          ...current,
          lessons: {
            ...current.lessons,
            [lesson.id]: { ...existing, lastStep: 5, completedAt: existing.completedAt ?? now, lastPracticedAt: now },
          },
        };
      });
    },
    [update],
  );

  return { progress, addRep, saveStep, saveLine, saveFeel, complete };
}

export const countPracticedLines = (progress: ProgressState) => Object.values(progress.lessons)
  .reduce((total, lesson) => total + Object.values(lesson.repsByLine).filter((reps) => reps > 0).length, 0);

export const countCompletedWorkouts = (progress: ProgressState) => Object.values(progress.lessons)
  .filter((lesson) => lesson.completedAt).length;

export const countPracticeDaysThisWeek = (progress: ProgressState, now = new Date()) => {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const mondayOffset = (day.getDay() + 6) % 7;
  const monday = new Date(day.getFullYear(), day.getMonth(), day.getDate() - mondayOffset);
  return new Set(Object.values(progress.lessons)
    .map((lesson) => lesson.lastPracticedAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => value >= monday && value <= now)
    .map((value) => `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`)).size;
};
