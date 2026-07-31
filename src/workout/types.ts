import type { Lesson } from '../content/types';
import type { useLessonAudio } from '../hooks/useLessonAudio';

export type AudioController = ReturnType<typeof useLessonAudio>;

export type StepProps = {
  lesson: Lesson;
  audio: AudioController;
  onNext: () => void;
};
