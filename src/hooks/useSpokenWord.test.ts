import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AudioController } from '../workout/types';
import { useSpokenWord, type TimedLines } from './useSpokenWord';

const controller = (activeId: string | undefined, isPlaying: boolean, time: number | undefined): AudioController => ({
  activeId, isPlaying, unavailable: false, speechAvailable: true,
  play: vi.fn(), playLines: vi.fn(), stop: vi.fn(), currentTime: () => time,
});

const lines: TimedLines = [
  { lineId: 'one', words: [[0.2, 0.5], [0.6, 0.9]] },
  { lineId: 'two', words: [[1.4, 1.7], [1.8, 2.2]] },
];

describe('useSpokenWord', () => {
  it('reports the word being spoken across lines of the full dialogue', () => {
    expect(renderHook(() => useSpokenWord(controller('full', true, 0.7), 'full', lines)).result.current).toEqual({ lineId: 'one', index: 1 });
    expect(renderHook(() => useSpokenWord(controller('full', true, 1.9), 'full', lines)).result.current).toEqual({ lineId: 'two', index: 1 });
  });

  it('shows nothing between turns, when paused, or for another source', () => {
    expect(renderHook(() => useSpokenWord(controller('full', true, 1.3), 'full', lines)).result.current).toBeUndefined();
    expect(renderHook(() => useSpokenWord(controller('full', false, 0.7), 'full', lines)).result.current).toBeUndefined();
    expect(renderHook(() => useSpokenWord(controller('other', true, 0.7), 'full', lines)).result.current).toBeUndefined();
  });

  it('shows nothing for the speech fallback, which has no playback position', () => {
    expect(renderHook(() => useSpokenWord(controller('full', true, undefined), 'full', lines)).result.current).toBeUndefined();
  });
});
