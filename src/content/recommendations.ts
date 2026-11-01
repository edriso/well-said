import { getTodaysLesson, lessons } from './lessons';
import type { Lesson, Preferences, ProgressState, SpeakingComfort } from './types';

const levelForComfort: Record<SpeakingComfort, Lesson['level']> = {
  steady: 'A2–B1',
  everyday: 'B1–B2',
  stretch: 'B2–C1',
};

const startHere = lessons.filter((lesson) => lesson.collection === 'Start Here');

const sameLocalDay = (iso: string | undefined, date: Date) => {
  if (!iso) return false;
  const day = new Date(iso);
  return day.getFullYear() === date.getFullYear() && day.getMonth() === date.getMonth() && day.getDate() === date.getDate();
};

/**
 * New learners work through the reviewed Start Here collection first, then
 * move to the calendar rotation. A workout finished today stays as today's
 * card so "Practice again" keeps working.
 */
function nextStartHereLesson(progress: ProgressState, preferences: Preferences, date: Date) {
  const finishedToday = startHere.find((lesson) => sameLocalDay(progress.lessons[lesson.id]?.completedAt, date));
  if (finishedToday) return finishedToday;
  const unfinished = startHere.filter((lesson) => !progress.lessons[lesson.id]?.completedAt);
  return unfinished.find((lesson) => preferences.areas.includes(lesson.category)) ?? unfinished[0];
}

export function selectDailyLesson(progress: ProgressState, preferences: Preferences, date = new Date()) {
  const onboarding = nextStartHereLesson(progress, preferences, date);
  if (onboarding) return onboarding;

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
