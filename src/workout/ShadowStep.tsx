import { ArrowLeft, ArrowRight, Mic, Pause, Play, RotateCcw, Users } from 'lucide-react';
import { useState } from 'react';
import { DialogueTranscript } from '../components/DialogueTranscript';
import { HighlightedText } from '../components/HighlightedText';
import { dialoguePlayables, speakerVoiceIndex, type StepProps } from './types';

type TranscriptMode = 'full' | 'cues' | 'hidden';

export function ShadowStep({ lesson, audio, onNext }: StepProps) {
  const [transcriptMode, setTranscriptMode] = useState<TranscriptMode>('full');
  const [role, setRole] = useState<'together' | string>('together');
  const [turnIndex, setTurnIndex] = useState(0);

  const fullText = lesson.lines.map((line) => line.text).join(' ');
  const togetherPlaying = audio.activeId === 'shadow' && audio.isPlaying;

  const playTogether = () => {
    if (lesson.fullAudio) {
      audio.play({ id: 'shadow', text: fullText, src: lesson.fullAudio });
    } else {
      audio.playLines('shadow', dialoguePlayables(lesson));
    }
  };

  const changeRole = (next: string) => {
    audio.stop();
    setRole(next);
    setTurnIndex(0);
  };

  const line = lesson.lines[turnIndex]!;
  const speaker = lesson.speakers.find((item) => item.id === line.speakerId)!;
  const me = lesson.speakers.find((item) => item.id === role);
  const isYourTurn = line.speakerId === role;
  const lastTurn = turnIndex === lesson.lines.length - 1;
  const linePlaying = audio.activeId === `turn-${line.id}` && audio.isPlaying;

  const moveTurn = (next: number) => {
    audio.stop();
    setTurnIndex(Math.max(0, Math.min(next, lesson.lines.length - 1)));
  };

  const playModelLine = () => {
    const playedIndex = turnIndex;
    audio.play({
      id: `turn-${line.id}`,
      text: line.text,
      src: line.audio,
      voiceIndex: speakerVoiceIndex(lesson, line),
      onEnd: () => setTurnIndex((current) => (current === playedIndex ? Math.min(current + 1, lesson.lines.length - 1) : current)),
    });
  };

  const cueText = (text: string) => `${text.split(' ').slice(0, 2).join(' ')} …`;

  return (
    <section className="step-layout" aria-labelledby="shadow-title">
      <div className="step-intro compact">
        <p className="eyebrow">03 · Shadow & perform</p>
        <h1 id="shadow-title" tabIndex={-1}>Now join the conversation.</h1>
        <p>Speak with the model, or choose a role and take real turns yourself.</p>
      </div>

      <div className="shadow-controls">
        <div>
          <label htmlFor="role-select"><Users /> Practice mode</label>
          <select id="role-select" value={role} onChange={(event) => changeRole(event.target.value)}>
            <option value="together">Shadow together</option>
            {lesson.speakers.map((item) => <option value={item.id} key={item.id}>I’m {item.name}</option>)}
          </select>
        </div>
        <div>
          <span className="control-label" id="transcript-support-label">Transcript support</span>
          <div className="segmented transcript-switch" role="group" aria-labelledby="transcript-support-label">
            {(['full', 'cues', 'hidden'] as const).map((mode) => <button key={mode} className={transcriptMode === mode ? 'active' : ''} onClick={() => setTranscriptMode(mode)} aria-pressed={transcriptMode === mode}>{mode === 'cues' ? 'First words' : mode}</button>)}
          </div>
        </div>
      </div>

      {role === 'together' ? (
        <article className="shadow-stage">
          <div className="shadow-stage-heading">
            <div><p className="eyebrow">Speak at the same time</p><h2>{lesson.title}</h2></div>
            <button className="round-play" onClick={() => togetherPlaying ? audio.stop() : playTogether()} aria-label={togetherPlaying ? 'Pause shadow practice' : 'Play shadow practice'}>
              {togetherPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
            </button>
          </div>

          {transcriptMode === 'full' && <DialogueTranscript lesson={lesson} />}
          {transcriptMode === 'cues' && (
            <div className="cue-transcript">
              {lesson.lines.map((item) => {
                const cueSpeaker = lesson.speakers.find((entry) => entry.id === item.speakerId)!;
                return <p key={item.id}><strong>{cueSpeaker.name}</strong><span>{cueText(item.text)}</span></p>;
              })}
            </div>
          )}
          {transcriptMode === 'hidden' && <div className="hidden-transcript"><span aria-hidden="true">“</span><p>Look up. Listen closely.<br />You know more than you think.</p></div>}
        </article>
      ) : (
        <article className="shadow-stage roleplay-stage">
          <div className="shadow-stage-heading">
            <div><p className="eyebrow">You are {me?.name}</p><h2>{lesson.title}</h2></div>
            <span className="turn-count">Turn {turnIndex + 1} of {lesson.lines.length}</span>
          </div>
          <div className={`turn-card ${isYourTurn ? 'your-turn' : ''}`}>
            <p className="turn-cue">
              {isYourTurn ? <><Mic aria-hidden="true" /> Your turn</> : `${speaker.name} speaks`}
            </p>
            {transcriptMode !== 'hidden' && (
              <p className="turn-text">
                {transcriptMode === 'full'
                  ? <HighlightedText text={line.text} stressWords={line.stressWords} />
                  : cueText(line.text)}
              </p>
            )}
            {transcriptMode === 'hidden' && (
              <p className="turn-text from-memory">{isYourTurn ? 'Say your line from memory.' : 'Listen without reading.'}</p>
            )}
            <div className="turn-actions">
              <button className="secondary-button" disabled={turnIndex === 0} onClick={() => moveTurn(turnIndex - 1)} aria-label="Previous turn"><ArrowLeft /> Back</button>
              {!isYourTurn && (
                <button className="round-play small" onClick={() => linePlaying ? audio.stop() : playModelLine()} aria-label={linePlaying ? `Pause ${speaker.name}’s line` : `Play ${speaker.name}’s line`}>
                  {linePlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
                </button>
              )}
              {lastTurn
                ? <button className="secondary-button" onClick={() => moveTurn(0)}><RotateCcw /> Start over</button>
                : <button className="primary-button" onClick={() => moveTurn(turnIndex + 1)}>Continue <ArrowRight /></button>}
            </div>
          </div>
        </article>
      )}

      <p className="role-note">
        {role === 'together'
          ? 'Tip: stay half a beat behind the speaker. Copy the music, not just the words.'
          : 'Play each model line, then say yours out loud in the gap. Continue moves the conversation on.'}
      </p>
      <button className="primary-button step-next" onClick={onNext}>Try stress mode <ArrowRight /></button>
    </section>
  );
}
