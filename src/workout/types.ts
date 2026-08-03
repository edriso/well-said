import type { DialogueLine, Lesson } from '../content/types';
import type { PlayableLine, useLessonAudio } from '../hooks/useLessonAudio';

export type AudioController = ReturnType<typeof useLessonAudio>;

export type StepProps = {
  lesson: Lesson;
  audio: AudioController;
  onNext: () => void;
};

export const speakerVoiceIndex = (lesson: Lesson, line: DialogueLine) =>
  Math.max(0, lesson.speakers.findIndex((speaker) => speaker.id === line.speakerId));

export const dialoguePlayables = (lesson: Lesson, lines: DialogueLine[] = lesson.lines): PlayableLine[] =>
  lines.map((line) => ({ text: line.text, src: line.audio, voiceIndex: speakerVoiceIndex(lesson, line) }));
