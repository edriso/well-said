import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import timingsFile from '../../public/audio/lessons/ordering-coffee/timings.json';
import { currentTimings, timedWords, type LessonTimings } from '../content/audio';
import { getLessonById } from '../content/lessons';
import { ListenStep } from './ListenStep';
import type { AudioController, LessonTimingsApi } from './types';

const lesson = getLessonById('ordering-coffee')!;
const valid = currentTimings(lesson, timingsFile as unknown as LessonTimings);
const timings: LessonTimingsApi = {
  line: (lineId) => (valid.lines.has(lineId) ? [{ lineId, words: valid.lines.get(lineId)! }] : undefined),
  full: lesson.lines.map((line) => ({ lineId: line.id, words: valid.full.get(line.id)! })),
};

const playingAt = (time: number): AudioController => ({
  activeId: 'full-dialogue', isPlaying: true, unavailable: false, speechAvailable: true,
  play: vi.fn(), playLines: vi.fn(), stop: vi.fn(), currentTime: () => time,
});

describe('ListenStep follow-along', () => {
  it('highlights the word the full dialogue is speaking, using the real timings', async () => {
    const user = userEvent.setup();
    const line = lesson.lines[1]!;
    const [start, end] = valid.full.get(line.id)![2]!;
    const { container } = render(<ListenStep lesson={lesson} audio={playingAt((start + end) / 2)} timings={timings} onNext={vi.fn()} />);

    expect(container.querySelector('.spoken-word')).toBeNull();
    await user.click(screen.getByRole('button', { name: /reveal transcript/i }));

    const spoken = container.querySelectorAll('.spoken-word');
    expect(spoken).toHaveLength(1);
    expect(spoken[0]).toHaveTextContent(timedWords(line.text)[2]!);
  });
});
