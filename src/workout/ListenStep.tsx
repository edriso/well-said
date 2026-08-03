import { ArrowRight, Eye, EyeOff, Pause, Play, Sparkles, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { DialogueTranscript } from '../components/DialogueTranscript';
import { dialoguePlayables, type StepProps } from './types';

export function ListenStep({ lesson, audio, onNext }: StepProps) {
  const [revealed, setRevealed] = useState(false);
  const isPlaying = audio.activeId === 'full-dialogue' && audio.isPlaying;

  const playDialogue = () => {
    if (lesson.fullAudio) {
      audio.play({ id: 'full-dialogue', text: lesson.lines.map((line) => line.text).join(' '), src: lesson.fullAudio });
    } else {
      audio.playLines('full-dialogue', dialoguePlayables(lesson));
    }
  };

  return (
    <section className="step-layout" aria-labelledby="listen-title">
      <div className="step-intro">
        <p className="eyebrow">01 · Listen first</p>
        <h1 id="listen-title" tabIndex={-1}>Hear the whole conversation.</h1>
        <p>Don’t repeat yet. Just notice the situation, energy, and rhythm.</p>
      </div>

      <div className="dialogue-player-card">
        <div className={`player-visual ${isPlaying ? 'playing' : ''}`} aria-hidden="true">
          {[14, 27, 19, 38, 51, 30, 44, 22, 55, 35, 18, 42, 28, 48, 20].map((height, index) => <i key={index} style={{ height }} />)}
        </div>
        <div>
          <p className="eyebrow">{lesson.durationSeconds} sec · {lesson.level}</p>
          <h2>{lesson.title}</h2>
          <p>{lesson.situation}</p>
        </div>
        <button className="round-play" onClick={() => isPlaying ? audio.stop() : playDialogue()} aria-label={isPlaying ? 'Pause full dialogue' : 'Play full dialogue'}>
          {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
        </button>
      </div>
      {audio.unavailable && (
        <p className="audio-unavailable" role="status"><VolumeX aria-hidden="true" /> Audio isn’t available in this browser. Read the transcript below and practice at your own pace.</p>
      )}

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
