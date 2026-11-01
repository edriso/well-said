import type { Lesson } from './types';
import { categoryLessons, startHereLessons } from './catalog';
import { attachAudio } from './audio';

const startHereIds = new Set(startHereLessons.map((lesson) => lesson.id));

/** Release packs shown to learners. Start Here membership is explicit; the rest follow the situation family. */
const collectionByCategory: Record<Lesson['category'], NonNullable<Lesson['collection']>> = {
  Everyday: 'Everyday Social English',
  Work: 'Workplace Conversations',
  Social: 'Everyday Social English',
  Travel: 'Travel and Services',
  Food: 'Everyday Social English',
  Home: 'Everyday Social English',
  Services: 'Travel and Services',
  Community: 'Everyday Social English',
  Wellbeing: 'Difficult Conversations',
  Ideas: 'Storytelling and Opinions',
};

/**
 * The full catalog in daily-rotation order. Lesson numbers define the order;
 * category files are interleaved by number so consecutive days vary.
 */
export const lessons: Lesson[] = [...startHereLessons, ...categoryLessons]
  .sort((a, b) => a.number - b.number)
  .map((lesson) => attachAudio({
    ...lesson,
    contentStatus: lesson.contentStatus ?? 'reviewed',
    collection: startHereIds.has(lesson.id) ? 'Start Here' : collectionByCategory[lesson.category],
  }));

export const flagshipLessonIds = lessons
  .filter((lesson) => lesson.collection === 'Start Here')
  .map((lesson) => lesson.id);

export const getLessonById = (id: string) => lessons.find((lesson) => lesson.id === id);

export const getTodaysLesson = (date = new Date()) => {
  const anchorDay = Math.floor(Date.UTC(2026, 0, 1) / 86_400_000);
  const civilDay = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  const index = ((civilDay - anchorDay) % lessons.length + lessons.length) % lessons.length;
  return lessons[index] ?? lessons[0]!;
};
