import { ArrowLeft, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Lesson } from '../content/types';
import { Brand } from '../components/Brand';
import { ThemeToggle } from '../components/ThemeToggle';
import { useLessonAudio } from '../hooks/useLessonAudio';
import type { useProgress } from '../hooks/useProgress';
import type { useTheme } from '../hooks/useTheme';
import { CompleteStep } from '../workout/CompleteStep';
import { ListenStep } from '../workout/ListenStep';
import { PracticeStep } from '../workout/PracticeStep';
import { ShadowStep } from '../workout/ShadowStep';
import { StressStep } from '../workout/StressStep';

type Props = {
  lesson: Lesson;
  onClose: () => void;
  progressApi: ReturnType<typeof useProgress>;
  themeApi: ReturnType<typeof useTheme>;
};

const stepNames = ['Listen', 'Practice', 'Shadow', 'Stress', 'Finish'];
const stepHeadingIds = ['listen-title', 'practice-title', 'shadow-title', 'stress-title', 'complete-title'];

export function WorkoutScreen({ lesson, onClose, progressApi, themeApi }: Props) {
  const existing = progressApi.progress.lessons[lesson.id];
  const [step, setStep] = useState(existing?.completedAt ? 0 : Math.min(existing?.lastStep ?? 0, 4));
  const audio = useLessonAudio();

  const moveTo = (next: number) => {
    audio.stop();
    setStep(next);
    progressApi.saveStep(lesson, next);
    window.scrollTo({ top: 0, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    window.setTimeout(() => document.getElementById(stepHeadingIds[next]!)?.focus(), 0);
  };

  useEffect(() => {
    document.title = `${stepNames[step]} · ${lesson.title} — Well Said`;
    return () => { document.title = 'Well Said — Daily English speaking practice'; };
  }, [lesson.title, step]);

  const shared = { lesson, audio, onNext: () => moveTo(Math.min(step + 1, 4)) };

  return (
    <main className="workout-shell">
      <header className="workout-header">
        <button className="icon-button workout-close" onClick={onClose} aria-label="Exit workout"><X /></button>
        <Brand />
        <div className="workout-header-actions"><span className="step-count">{step + 1} of {stepNames.length} · {stepNames[step]}</span><ThemeToggle theme={themeApi.theme} onToggle={themeApi.toggleTheme} /></div>
      </header>
      <nav className="stepper" aria-label="Workout progress">
        {stepNames.map((name, index) => (
          <button key={name} className={index === step ? 'active' : index < step ? 'done' : ''} onClick={() => index <= step && moveTo(index)} disabled={index > step} aria-current={index === step ? 'step' : undefined}>
            <span>{index < step ? <Check size={13} /> : index + 1}</span><small>{name}</small>
          </button>
        ))}
      </nav>

      <div className="workout-content">
        {step > 0 && step < 4 && (
          <button className="back-link" onClick={() => moveTo(step - 1)}><ArrowLeft size={17} /> Back</button>
        )}
        <div key={step}>
          {step === 0 && <ListenStep {...shared} />}
          {step === 1 && <PracticeStep {...shared} progressApi={progressApi} />}
          {step === 2 && <ShadowStep {...shared} />}
          {step === 3 && <StressStep {...shared} />}
          {step === 4 && <CompleteStep lesson={lesson} progressApi={progressApi} onClose={onClose} audio={audio} />}
        </div>
      </div>
    </main>
  );
}
