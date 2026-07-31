import { ArrowRight, Check, Headphones, Home, Play, RotateCcw, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import type { Lesson } from '../content/types';
import type { useProgress } from '../hooks/useProgress';
import type { AudioController } from './types';

type Props = {
  lesson: Lesson;
  progressApi: ReturnType<typeof useProgress>;
  onClose: () => void;
  audio: AudioController;
};

export function CompleteStep({ lesson, progressApi, onClose, audio }: Props) {
  useEffect(() => {
    progressApi.complete(lesson);
    // Completion is intentionally idempotent for lifetime sentence totals.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const lessonProgress = progressApi.progress.lessons[lesson.id];
  const reps = Object.values(lessonProgress?.repsByLine ?? {}).reduce((sum, value) => sum + value, 0);

  return (
    <section className="complete-layout" aria-labelledby="complete-title">
      <div className="completion-mark" aria-hidden="true"><Check /></div>
      <p className="eyebrow">Workout complete</p>
      <h1 id="complete-title">Well said.</h1>
      <p className="completion-copy">You showed up, trained your ear, and gave these phrases a voice. That is enough for today.</p>

      <div className="completion-stats">
        <div><strong>{lesson.lines.length}</strong><span>lines practised</span></div>
        <div><strong>{reps}</strong><span>speaking reps</span></div>
        <div><strong>{progressApi.progress.totalSentences}</strong><span>lifetime sentences</span></div>
      </div>

      <section className="expressions" aria-labelledby="expressions-title">
        <div className="expressions-heading"><Sparkles /><div><p className="eyebrow">Take these with you</p><h2 id="expressions-title">Today’s expressions</h2></div></div>
        {lesson.expressions.map((expression) => (
          <article key={expression.phrase}>
            <button className="expression-play" onClick={() => audio.play({ id: `expression-${expression.phrase}`, text: expression.phrase, src: expression.audio })} aria-label={`Play ${expression.phrase}`}><Play fill="currentColor" /></button>
            <div><strong>“{expression.phrase}”</strong><p>{expression.meaning}</p><small>{expression.example}</small></div>
          </article>
        ))}
      </section>

      <div className="completion-actions">
        <button className="primary-button large" onClick={onClose}>Back home <Home /></button>
        <button className="secondary-button" onClick={() => window.location.reload()}><RotateCcw /> Repeat workout</button>
      </div>
      <p className="come-back"><Headphones /> Come back tomorrow. We’ll have another conversation ready.</p>
      <button className="text-button" onClick={onClose}>Done for today <ArrowRight /></button>
    </section>
  );
}
