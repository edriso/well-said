import type { Lesson } from '../content/types';
import type { SpokenWord } from '../hooks/useSpokenWord';
import { HighlightedText } from './HighlightedText';

export function DialogueTranscript({ lesson, compact = false, spoken }: { lesson: Lesson; compact?: boolean; spoken?: SpokenWord }) {
  return (
    <div className={`transcript ${compact ? 'transcript-compact' : ''}`}>
      {lesson.lines.map((line) => {
        const speaker = lesson.speakers.find((item) => item.id === line.speakerId)!;
        return (
          <div className="transcript-line" key={line.id}>
            <span className={`speaker-dot ${speaker.color}`} aria-hidden="true" />
            <div>
              <p className="speaker-name">{speaker.name}</p>
              <p><HighlightedText text={line.text} stressWords={compact ? [] : line.stressWords} spokenIndex={spoken?.lineId === line.id ? spoken.index : undefined} /></p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
