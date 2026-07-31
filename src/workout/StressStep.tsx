import { ArrowRight, Check, Lightbulb, Pause, Play, X } from 'lucide-react';
import { useState } from 'react';
import type { StressOption } from '../content/types';
import type { StepProps } from './types';

export function StressStep({ lesson, audio, onNext }: StepProps) {
  const exercise = lesson.stressExercise;
  const [selected, setSelected] = useState<StressOption>();
  const correct = selected?.word.toLocaleLowerCase() === exercise.answer.toLocaleLowerCase();
  const playing = audio.activeId === `stress-${selected?.word}` && audio.isPlaying;

  const renderSentence = (stressedWord?: string) => exercise.sentence.split(/(\s+)/).map((part, index) => {
    const clean = part.toLocaleLowerCase().replace(/[^a-z']/g, '');
    return clean === stressedWord?.toLocaleLowerCase() ? <strong className="stress-demo" key={index}>{part}</strong> : part;
  });

  return (
    <section className="step-layout stress-layout" aria-labelledby="stress-title">
      <div className="step-intro compact">
        <p className="eyebrow">04 · Stress mode</p>
        <h1 id="stress-title">Move the stress. Change the meaning.</h1>
        <p>English speakers make one word stronger to show what they are correcting or contrasting.</p>
      </div>

      <article className="stress-card">
        <p className="stress-prompt">{exercise.prompt}</p>
        <p className="stress-sentence">{renderSentence(selected?.word)}</p>
        <div className="stress-options" aria-label="Choose the stressed word">
          {exercise.options.map((option) => {
            const isSelected = selected?.word === option.word;
            return <button key={option.word} className={isSelected ? 'selected' : ''} onClick={() => { audio.stop(); setSelected(option); }} aria-pressed={isSelected}>Stress <strong>{option.word.toLocaleUpperCase()}</strong></button>;
          })}
        </div>

        {selected && (
          <div className={`stress-result ${correct ? 'correct' : 'try-again'}`} aria-live="polite">
            <span>{correct ? <Check /> : <X />}</span>
            <div><strong>{correct ? 'Exactly.' : 'That changes a different detail.'}</strong><p>{selected.meaning}</p></div>
            <button className="icon-button" onClick={() => playing ? audio.stop() : audio.play({ id: `stress-${selected.word}`, text: exercise.sentence, src: selected.audio, rate: 0.9 })} aria-label={`Hear ${selected.word} stressed`}>{playing ? <Pause /> : <Play />}</button>
          </div>
        )}
      </article>

      <aside className="focus-note"><Lightbulb /><div><strong>Why this works</strong><p>{exercise.coachNote}</p></div></aside>
      <button className="primary-button step-next" onClick={onNext}>Finish workout <ArrowRight /></button>
    </section>
  );
}
