import { ArrowRight, Pause, Play, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DialogueTranscript } from '../components/DialogueTranscript';
import type { StepProps } from './types';

type TranscriptMode = 'full' | 'cues' | 'hidden';

export function ShadowStep({ lesson, audio, onNext }: StepProps) {
  const [transcriptMode, setTranscriptMode] = useState<TranscriptMode>('full');
  const [role, setRole] = useState<'together' | string>('together');

  const modelLines = useMemo(() => role === 'together' ? lesson.lines : lesson.lines.filter((line) => line.speakerId !== role), [lesson.lines, role]);
  const modelText = modelLines.map((line) => line.text).join(' … ');
  const playing = audio.activeId === 'shadow' && audio.isPlaying;

  return (
    <section className="step-layout" aria-labelledby="shadow-title">
      <div className="step-intro compact">
        <p className="eyebrow">03 · Shadow & perform</p>
        <h1 id="shadow-title">Now join the conversation.</h1>
        <p>Speak with the model, or choose a role and fill the missing lines yourself.</p>
      </div>

      <div className="shadow-controls">
        <div>
          <label htmlFor="role-select"><Users /> Practice mode</label>
          <select id="role-select" value={role} onChange={(event) => { audio.stop(); setRole(event.target.value); }}>
            <option value="together">Shadow together</option>
            {lesson.speakers.map((speaker) => <option value={speaker.id} key={speaker.id}>I’m {speaker.name}</option>)}
          </select>
        </div>
        <div>
          <span className="control-label">Transcript support</span>
          <div className="segmented transcript-switch">
            {(['full', 'cues', 'hidden'] as const).map((mode) => <button key={mode} className={transcriptMode === mode ? 'active' : ''} onClick={() => setTranscriptMode(mode)} aria-pressed={transcriptMode === mode}>{mode === 'cues' ? 'First words' : mode}</button>)}
          </div>
        </div>
      </div>

      <article className="shadow-stage">
        <div className="shadow-stage-heading">
          <div><p className="eyebrow">{role === 'together' ? 'Speak at the same time' : `You are ${lesson.speakers.find((speaker) => speaker.id === role)?.name}`}</p><h2>{lesson.title}</h2></div>
          <button className="round-play" onClick={() => playing ? audio.stop() : audio.play({ id: 'shadow', text: modelText, src: role === 'together' ? lesson.fullAudio : undefined })} aria-label={playing ? 'Pause shadow practice' : 'Play shadow practice'}>
            {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
          </button>
        </div>

        {transcriptMode === 'full' && <DialogueTranscript lesson={lesson} />}
        {transcriptMode === 'cues' && (
          <div className="cue-transcript">
            {lesson.lines.map((line) => {
              const speaker = lesson.speakers.find((item) => item.id === line.speakerId)!;
              return <p key={line.id}><strong>{speaker.name}</strong><span>{line.text.split(' ').slice(0, 2).join(' ')} …</span></p>;
            })}
          </div>
        )}
        {transcriptMode === 'hidden' && <div className="hidden-transcript"><span aria-hidden="true">“</span><p>Look up. Listen closely.<br />You know more than you think.</p></div>}
      </article>

      <p className="role-note">{role === 'together' ? 'Tip: stay half a beat behind the speaker. Copy the music, not just the words.' : 'The demo voice plays the other person’s lines. Use each pause to say your part.'}</p>
      <button className="primary-button step-next" onClick={onNext}>Try stress mode <ArrowRight /></button>
    </section>
  );
}
