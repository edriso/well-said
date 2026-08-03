import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Focus, Gauge, Mic, Pause, Play, RotateCw, Square, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { HighlightedText } from '../components/HighlightedText';
import type { useProgress } from '../hooks/useProgress';
import { useRecorder } from '../hooks/useRecorder';
import { speakerVoiceIndex, type StepProps } from './types';

type Props = StepProps & { progressApi: ReturnType<typeof useProgress> };

export function PracticeStep({ lesson, audio, onNext, progressApi }: Props) {
  const storedLine = progressApi.progress.lessons[lesson.id]?.lastLineIndex ?? 0;
  const [lineIndex, setLineIndex] = useState(Math.min(storedLine, lesson.lines.length - 1));
  const [rate, setRate] = useState(1);
  const [loop, setLoop] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [sentenceVisible, setSentenceVisible] = useState(true);
  const [recordingLineIndex, setRecordingLineIndex] = useState<number>();
  const recorder = useRecorder();
  const line = lesson.lines[lineIndex]!;
  const speaker = lesson.speakers.find((item) => item.id === line.speakerId)!;
  const reps = progressApi.progress.lessons[lesson.id]?.repsByLine[line.id] ?? 0;
  const playing = audio.activeId === line.id && audio.isPlaying;
  const lastLine = lineIndex === lesson.lines.length - 1;
  const minePlaying = audio.activeId === 'my-recording' && audio.isPlaying;

  useEffect(() => {
    if (!focusMode) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setFocusMode(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [focusMode]);

  const moveLine = (next: number) => {
    audio.stop();
    setLineIndex(next);
    setSentenceVisible(true);
    progressApi.saveLine(lesson, next);
  };

  const playModel = () => playing ? audio.stop() : audio.play({ id: line.id, text: line.text, src: line.audio, rate, loop, voiceIndex: speakerVoiceIndex(lesson, line) });

  return (
    <section className={`step-layout practice-layout ${focusMode ? 'focus-mode' : ''}`} aria-labelledby="practice-title">
      {focusMode && <button className="focus-close icon-button" autoFocus onClick={() => setFocusMode(false)} aria-label="Exit Focus Mode"><X /></button>}
      <div className="step-intro compact">
        <p className="eyebrow">02 · Notice & repeat</p>
        <h1 id="practice-title" tabIndex={-1}>One line at a time.</h1>
        <p>Listen, notice the strong beats, then say it your way. Three reps is a useful target—not a gate.</p>
      </div>

      <div className="line-progress"><span style={{ width: `${((lineIndex + 1) / lesson.lines.length) * 100}%` }} /></div>
      <div className="line-toolbar"><span>Line {lineIndex + 1} of {lesson.lines.length}</span><span className={`speaker-chip ${speaker.color}`}><i /> {speaker.name}</span></div>

      <article className="practice-card">
        <p className={`practice-sentence ${sentenceVisible ? '' : 'sentence-hidden'}`}>{sentenceVisible ? <HighlightedText text={line.text} stressWords={line.stressWords} /> : <span>Listen first. Then say it from memory.</span>}</p>
        {sentenceVisible && <div className="phrase-groups" aria-label="Phrase groups">
          {line.phraseGroups.map((group, index) => (
            <span key={group}><HighlightedText text={group} stressWords={line.stressWords} />{index < line.phraseGroups.length - 1 && <b aria-label="brief pause">/</b>}</span>
          ))}
        </div>}
        <div className="audio-controls">
          <button className="round-play small" onClick={playModel} aria-label={playing ? `Pause ${line.text}` : `Play ${line.text}`}>
            {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
          </button>
          <button className="secondary-icon-button" onClick={() => setSentenceVisible((value) => !value)} aria-pressed={!sentenceVisible}>{sentenceVisible ? <EyeOff /> : <Eye />} {sentenceVisible ? 'Try without text' : 'Reveal sentence'}</button>
          <button className="secondary-icon-button" onClick={() => setFocusMode(true)}><Focus /> Focus Mode</button>
        </div>
        <details className="practice-options">
          <summary>Practice options</summary>
          <div><span className="control-label">Playback speed</span><div className="segmented" aria-label="Playback speed">
            {[0.75, 1, 1.25].map((speed) => <button key={speed} className={rate === speed ? 'active' : ''} onClick={() => setRate(speed)} aria-pressed={rate === speed}>{speed}×</button>)}
          </div><button className={`secondary-icon-button ${loop ? 'active' : ''}`} onClick={() => setLoop((value) => !value)} aria-pressed={loop}><RotateCw /> Loop</button></div>
        </details>
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
            <button className="record-button" onClick={() => { setRecordingLineIndex(lineIndex); void recorder.start(); }}><Mic /> {recorder.status === 'ready' ? 'Record again' : 'Record'}</button>
          )}
          {recorder.recordingUrl && <div className="recording-playback model-mine" aria-label="Compare model and your recording">
            <button className="compare-button" onClick={playModel}><Play /> Model</button>
            <button className="compare-button" onClick={() => minePlaying ? audio.stop() : audio.play({ id: 'my-recording', text: '', src: recorder.recordingUrl })}>{minePlaying ? <Pause /> : <Play />} Mine</button>
            <button className="delete-recording" onClick={recorder.clear} aria-label="Delete recording"><Trash2 /></button>
            {recordingLineIndex !== lineIndex && <small>Saved from line {(recordingLineIndex ?? 0) + 1}. Return there to compare the same sentence.</small>}
          </div>}
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
