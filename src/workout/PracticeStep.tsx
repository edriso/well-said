import { ArrowLeft, ArrowRight, Check, Gauge, Mic, Pause, Play, RotateCw, Square, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { HighlightedText } from '../components/HighlightedText';
import type { useProgress } from '../hooks/useProgress';
import { useRecorder } from '../hooks/useRecorder';
import type { StepProps } from './types';

type Props = StepProps & { progressApi: ReturnType<typeof useProgress> };

export function PracticeStep({ lesson, audio, onNext, progressApi }: Props) {
  const [lineIndex, setLineIndex] = useState(0);
  const [rate, setRate] = useState(1);
  const [loop, setLoop] = useState(false);
  const recorder = useRecorder();
  const line = lesson.lines[lineIndex]!;
  const speaker = lesson.speakers.find((item) => item.id === line.speakerId)!;
  const reps = progressApi.progress.lessons[lesson.id]?.repsByLine[line.id] ?? 0;
  const playing = audio.activeId === line.id && audio.isPlaying;
  const lastLine = lineIndex === lesson.lines.length - 1;

  const moveLine = (next: number) => {
    audio.stop();
    recorder.clear();
    setLineIndex(next);
  };

  return (
    <section className="step-layout practice-layout" aria-labelledby="practice-title">
      <div className="step-intro compact">
        <p className="eyebrow">02 · Notice & repeat</p>
        <h1 id="practice-title">One line at a time.</h1>
        <p>Listen, notice the strong beats, then say it your way. Three reps is a useful target—not a gate.</p>
      </div>

      <div className="line-progress"><span style={{ width: `${((lineIndex + 1) / lesson.lines.length) * 100}%` }} /></div>
      <div className="line-toolbar"><span>Line {lineIndex + 1} of {lesson.lines.length}</span><span className={`speaker-chip ${speaker.color}`}><i /> {speaker.name}</span></div>

      <article className="practice-card">
        <p className="practice-sentence"><HighlightedText text={line.text} stressWords={line.stressWords} /></p>
        <div className="phrase-groups" aria-label="Phrase groups">
          {line.phraseGroups.map((group, index) => (
            <span key={group}><HighlightedText text={group} stressWords={line.stressWords} />{index < line.phraseGroups.length - 1 && <b aria-label="brief pause">/</b>}</span>
          ))}
        </div>
        <div className="audio-controls">
          <button className="round-play small" onClick={() => playing ? audio.stop() : audio.play({ id: line.id, text: line.text, src: line.audio, rate, loop, voiceIndex: lineIndex % 2 })} aria-label={playing ? `Pause ${line.text}` : `Play ${line.text}`}>
            {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
          </button>
          <div className="segmented" aria-label="Playback speed">
            {[0.75, 1, 1.25].map((speed) => <button key={speed} className={rate === speed ? 'active' : ''} onClick={() => setRate(speed)} aria-pressed={rate === speed}>{speed}×</button>)}
          </div>
          <button className={`secondary-icon-button ${loop ? 'active' : ''}`} onClick={() => setLoop((value) => !value)} aria-pressed={loop}><RotateCw /> Loop</button>
        </div>
      </article>

      <aside className="coach-note"><span>🎙</span><div><strong>Coach’s note</strong><p>{line.coachNote}</p></div></aside>

      <div className="rep-recorder-grid">
        <div className="rep-card">
          <div><span className="rep-count">{Math.min(reps, 3)}<small>/3</small></span><p>speaking reps</p></div>
          <button className="rep-button" onClick={() => progressApi.addRep(lesson, line.id)}><Check /> I said it</button>
        </div>
        <div className="record-card">
          <div><strong>Hear yourself</strong><p>Your recording stays on this device.</p></div>
          {recorder.status === 'recording' ? (
            <button className="record-button recording" onClick={recorder.stop}><Square fill="currentColor" /> Stop</button>
          ) : (
            <button className="record-button" onClick={recorder.start}><Mic /> {recorder.status === 'ready' ? 'Record again' : 'Record'}</button>
          )}
          {recorder.recordingUrl && <div className="recording-playback"><audio controls src={recorder.recordingUrl} aria-label="Your recording" /><button onClick={recorder.clear} aria-label="Delete recording"><Trash2 /></button></div>}
          {recorder.status === 'denied' && <p className="error-note">Microphone unavailable. You can continue without it.</p>}
        </div>
      </div>

      <div className="line-navigation">
        <button className="secondary-button" disabled={lineIndex === 0} onClick={() => moveLine(lineIndex - 1)}><ArrowLeft /> Previous</button>
        {lastLine ? <button className="primary-button" onClick={onNext}>Start shadowing <ArrowRight /></button> : <button className="primary-button" onClick={() => moveLine(lineIndex + 1)}>Next line <ArrowRight /></button>}
      </div>
      <p className="keyboard-tip"><Gauge size={15} /> Tip: move on when the rhythm feels comfortable. You can always come back.</p>
    </section>
  );
}
