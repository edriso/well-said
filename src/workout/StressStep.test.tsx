import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getLessonById } from '../content/lessons';
import { StressStep } from './StressStep';
import type { AudioController } from './types';

const audioController = (): AudioController => ({
  activeId: undefined,
  isPlaying: false,
  unavailable: false,
  speechAvailable: true,
  play: vi.fn(),
  playLines: vi.fn(),
  stop: vi.fn(),
  currentTime: () => undefined,
});

const lesson = getLessonById('ordering-coffee')!;

describe('StressStep', () => {
  it('explains the meaning and plays the model take for the chosen word', async () => {
    const user = userEvent.setup();
    const audio = audioController();
    render(<StressStep lesson={lesson} audio={audio} onNext={vi.fn()} />);

    const answer = lesson.stressExercise.options.find((option) => option.word === lesson.stressExercise.answer)!;
    expect(answer.audio).toBeDefined();
    await user.click(screen.getByRole('button', { name: new RegExp(`stress ${answer.word}`, 'i') }));

    expect(screen.getByText('Exactly.')).toBeInTheDocument();
    expect(screen.getByText(answer.meaning)).toBeInTheDocument();
    expect(screen.queryByText(/say the sentence out loud/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: `Hear ${answer.word} stressed` }));
    expect(audio.play).toHaveBeenCalledWith(expect.objectContaining({ src: answer.audio, text: lesson.stressExercise.sentence }));
  });

  it('marks a different word as a different meaning', async () => {
    const user = userEvent.setup();
    render(<StressStep lesson={lesson} audio={audioController()} onNext={vi.fn()} />);

    const other = lesson.stressExercise.options.find((option) => option.word !== lesson.stressExercise.answer)!;
    await user.click(screen.getByRole('button', { name: new RegExp(`stress ${other.word}`, 'i') }));

    expect(screen.getByText('That changes a different detail.')).toBeInTheDocument();
    expect(screen.getByText(other.meaning)).toBeInTheDocument();
  });

  it('highlights words with accents and punctuation like the audio pipeline does', async () => {
    const user = userEvent.setup();
    const accented = {
      ...lesson,
      stressExercise: {
        ...lesson.stressExercise,
        sentence: 'Meet me at the café, not the bakery.',
        answer: 'café',
        options: [{ word: 'café', meaning: 'The café, not another place.' }, { word: 'meet', meaning: 'Meet, not call.' }, { word: 'bakery', meaning: 'The bakery is wrong.' }],
      },
    };
    render(<StressStep lesson={accented} audio={audioController()} onNext={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /stress café/i }));
    expect(document.querySelector('.stress-demo')).toHaveTextContent('café,');
  });

  it('says so when the chosen version has no take but others do', async () => {
    const user = userEvent.setup();
    const [first, ...rest] = lesson.stressExercise.options;
    const partial = { ...lesson, stressExercise: { ...lesson.stressExercise, options: [{ ...first!, audio: undefined }, ...rest] } };
    render(<StressStep lesson={partial} audio={audioController()} onNext={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: new RegExp(`stress ${first!.word}`, 'i') }));
    expect(screen.getByText(/no model take for this version/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: `Hear ${first!.word} stressed` })).not.toBeInTheDocument();
  });

  it('falls back to a text-only exercise when no take is available', () => {
    const textOnly = {
      ...lesson,
      stressExercise: { ...lesson.stressExercise, options: lesson.stressExercise.options.map((option) => ({ ...option, audio: undefined })) },
    };
    render(<StressStep lesson={textOnly} audio={audioController()} onNext={vi.fn()} />);

    expect(screen.getByText(/say the sentence out loud/i)).toBeInTheDocument();
    expect(screen.queryByText(/coming/i)).not.toBeInTheDocument();
  });
});
