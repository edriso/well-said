import { Check, Headphones, Home, Play, RotateCcw, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import type { Lesson, WorkoutFeel } from '../content/types';
import { countPracticedLines, type useProgress } from '../hooks/useProgress';
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
    // Completion preserves the first completion date while updating recent practice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const lessonProgress = progressApi.progress.lessons[lesson.id];
  const reps = Object.values(lessonProgress?.repsByLine ?? {}).reduce((sum, value) => sum + value, 0);
  const practicedHere = Object.values(lessonProgress?.repsByLine ?? {}).filter((value) => value > 0).length;
  const feelings: Array<[WorkoutFeel, string]> = [['easy', 'Too easy'], ['right', 'Just right'], ['hard', 'Too hard']];

  return (
    <section className="complete-layout" aria-labelledby="complete-title">
      <div className="completion-mark" aria-hidden="true"><Check /></div>
      <p className="eyebrow">Workout complete</p>
      <h1 id="complete-title" tabIndex={-1}>Well said.</h1>
      <p className="completion-copy">You showed up, trained your ear, and gave these phrases a voice. That is enough for today.</p>

      <div className="completion-stats">
        <div><strong>{practicedHere}</strong><span>lines practiced aloud</span></div>
        <div><strong>{reps}</strong><span>speaking reps</span></div>
        <div><strong>{countPracticedLines(progressApi.progress)}</strong><span>lifetime lines practiced</span></div>
      </div>

      <fieldset className="workout-feel">
        <legend>How did this feel?</legend>
        <div className="segmented">
          {feelings.map(([value, label]) => <button type="button" key={value} className={lessonProgress?.felt === value ? 'active' : ''} aria-pressed={lessonProgress?.felt === value} onClick={() => progressApi.saveFeel(lesson, value)}>{label}</button>)}
        </div>
      </fieldset>

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
    </section>
  );
}
