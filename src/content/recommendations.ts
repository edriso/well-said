import { getTodaysLesson, lessons } from './lessons';
import type { Lesson, Preferences, ProgressState, SpeakingComfort } from './types';

const levelForComfort: Record<SpeakingComfort, Lesson['level']> = {
  steady: 'A2–B1',
  everyday: 'B1–B2',
  stretch: 'B2–C1',
};

export function selectDailyLesson(progress: ProgressState, preferences: Preferences, date = new Date()) {
  const scheduled = getTodaysLesson(date);
  if (preferences.areas.length === 0 && preferences.comfort === 'everyday') return scheduled;
  const start = lessons.indexOf(scheduled);
  return Array.from({ length: Math.min(28, lessons.length) }, (_, offset) => lessons[(start + offset) % lessons.length]!)
    .map((lesson, offset) => ({
      lesson,
      score: (preferences.areas.includes(lesson.category) ? 5 : 0)
        + (lesson.level === levelForComfort[preferences.comfort] ? 3 : 0)
        + (progress.lessons[lesson.id]?.completedAt ? -6 : 0)
        - offset * 0.05,
    }))
    .sort((a, b) => b.score - a.score)[0]!.lesson;
}
