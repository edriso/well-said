import { ArrowRight, Eye, EyeOff, Pause, Play, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { DialogueTranscript } from '../components/DialogueTranscript';
import type { StepProps } from './types';

export function ListenStep({ lesson, audio, onNext }: StepProps) {
  const [revealed, setRevealed] = useState(false);
  const fullText = lesson.lines.map((line) => line.text).join(' ');
  const isPlaying = audio.activeId === 'full-dialogue' && audio.isPlaying;

  return (
    <section className="step-layout" aria-labelledby="listen-title">
      <div className="step-intro">
        <p className="eyebrow">01 · Listen first</p>
        <h1 id="listen-title">Hear the whole conversation.</h1>
        <p>Don’t repeat yet. Just notice the situation, energy, and rhythm.</p>
      </div>

      <div className="dialogue-player-card">
        <div className="player-visual" aria-hidden="true">
          {[14, 27, 19, 38, 51, 30, 44, 22, 55, 35, 18, 42, 28, 48, 20].map((height, index) => <i key={index} style={{ height }} />)}
        </div>
        <div>
          <p className="eyebrow">{lesson.durationSeconds} sec · {lesson.level}</p>
          <h2>{lesson.title}</h2>
          <p>{lesson.situation}</p>
        </div>
        <button className="round-play" onClick={() => isPlaying ? audio.stop() : audio.play({ id: 'full-dialogue', text: fullText, src: lesson.fullAudio })} aria-label={isPlaying ? 'Pause full dialogue' : 'Play full dialogue'}>
          {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
        </button>
      </div>

      <div className="reveal-panel">
        <button className="reveal-button" onClick={() => setRevealed((value) => !value)} aria-expanded={revealed}>
          {revealed ? <EyeOff /> : <Eye />} {revealed ? 'Hide transcript' : 'Reveal transcript'}
          <small>{revealed ? 'Listen once more without reading' : 'Use it when you need support'}</small>
        </button>
        {revealed && <DialogueTranscript lesson={lesson} compact />}
      </div>

      <aside className="focus-note"><Sparkles aria-hidden="true" /><div><strong>Today’s focus</strong><p>{lesson.intention}</p></div></aside>
      <button className="primary-button step-next" onClick={onNext}>Practice the lines <ArrowRight /></button>
    </section>
  );
}
