export const LESSON_CATEGORIES = ['Everyday', 'Work', 'Social', 'Travel', 'Food', 'Home', 'Services', 'Community', 'Wellbeing', 'Ideas'] as const;

export type LessonCategory = (typeof LESSON_CATEGORIES)[number];

export type Speaker = {
  id: string;
  name: string;
  role: string;
  color: 'lime' | 'coral';
};

export type DialogueLine = {
  id: string;
  speakerId: string;
  text: string;
  phraseGroups: string[];
  stressWords: string[];
  coachNote: string;
  audio?: string;
};

export type Expression = {
  phrase: string;
  meaning: string;
  example: string;
  audio?: string;
};

export type StressOption = {
  word: string;
  meaning: string;
  audio?: string;
};

export type StressExercise = {
  sentence: string;
  prompt: string;
  answer: string;
  options: StressOption[];
  coachNote: string;
};

export type Lesson = {
  id: string;
  number: number;
  title: string;
  situation: string;
  durationSeconds: number;
  estimatedMinutes: number;
  level: 'A2–B1' | 'B1–B2' | 'B2–C1';
  category: LessonCategory;
  focus: string;
  intention: string;
  speakers: Speaker[];
  lines: DialogueLine[];
  expressions: Expression[];
  stressExercise: StressExercise;
  fullAudio?: string;
};

export type LessonProgress = {
  completedAt?: string;
  repsByLine: Record<string, number>;
  lastStep: number;
};

export type ProgressState = {
  version: 1;
  lessons: Record<string, LessonProgress>;
  totalSentences: number;
  totalReps: number;
};
