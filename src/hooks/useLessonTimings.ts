import { useEffect, useMemo, useState } from 'react';
import { audioPaths, currentTimings, type LessonTimings } from '../content/audio';
import type { Lesson } from '../content/types';
import type { TimedLines } from './useSpokenWord';

/**
 * Loads a lesson's word timings (a small static file next to its audio) and
 * keeps only entries that still match the current text. Missing or stale
 * timings simply mean no follow-along highlight.
 */
export function useLessonTimings(lesson: Lesson) {
  const [raw, setRaw] = useState<{ lessonId: string; timings: LessonTimings }>();

  useEffect(() => {
    if (!lesson.lines.some((line) => line.audio) || typeof fetch !== 'function') return undefined;
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}${audioPaths.timings(lesson.id)}`, { signal: controller.signal })
      .then((response) => (response.ok ? (response.json() as Promise<LessonTimings>) : undefined))
      .then((timings) => { if (timings) setRaw({ lessonId: lesson.id, timings }); })
      .catch(() => undefined);
    return () => controller.abort();
  }, [lesson]);

  return useMemo(() => {
    const valid = currentTimings(lesson, raw?.lessonId === lesson.id ? raw.timings : undefined);
    // Built once per load so each call returns a stable reference (useSpokenWord depends on it).
    const byLine = new Map<string, TimedLines>([...valid.lines].map(([lineId, words]) => [lineId, [{ lineId, words }]]));
    const line = (lineId: string) => byLine.get(lineId);
    const full: TimedLines | undefined = valid.full.size === lesson.lines.length
      ? lesson.lines.map((item) => ({ lineId: item.id, words: valid.full.get(item.id)! }))
      : undefined;
    return { line, full };
  }, [lesson, raw]);
}
