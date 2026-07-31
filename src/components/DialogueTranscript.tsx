import type { Lesson } from '../content/types';
import { HighlightedText } from './HighlightedText';

export function DialogueTranscript({ lesson, compact = false }: { lesson: Lesson; compact?: boolean }) {
  return (
    <div className={`transcript ${compact ? 'transcript-compact' : ''}`}>
      {lesson.lines.map((line) => {
        const speaker = lesson.speakers.find((item) => item.id === line.speakerId)!;
        return (
          <div className="transcript-line" key={line.id}>
            <span className={`speaker-dot ${speaker.color}`} aria-hidden="true" />
            <div>
              <p className="speaker-name">{speaker.name}</p>
              <p><HighlightedText text={line.text} stressWords={compact ? [] : line.stressWords} /></p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
