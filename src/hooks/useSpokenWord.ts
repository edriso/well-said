import { useEffect, useRef, useState } from 'react';
import { spokenWordIndex, type WordTiming } from '../content/audio';
import type { AudioController } from '../workout/types';

/** One timed word list per line; the hook reports which line and word are being spoken. */
export type TimedLines = Array<{ lineId: string; words: WordTiming[] }>;
export type SpokenWord = { lineId: string; index: number };

const nextFrame = (callback: () => void) =>
  typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame(callback) : window.setTimeout(callback, 50);
const cancelFrame = (handle: number) =>
  typeof window.cancelAnimationFrame === 'function' ? window.cancelAnimationFrame(handle) : window.clearTimeout(handle);

const sameWord = (a: SpokenWord | undefined, b: SpokenWord | undefined) => a?.lineId === b?.lineId && a?.index === b?.index;

/**
 * Follows model audio playback for `playId` and returns the word being spoken.
 * Polls the adapter each frame but only re-renders when the word changes. The
 * latest timings and clock are read through refs, so callers may pass new
 * array or function identities on every render without restarting the loop.
 */
export function useSpokenWord(audio: AudioController, playId: string, lines: TimedLines | undefined): SpokenWord | undefined {
  const [spoken, setSpoken] = useState<SpokenWord>();
  const following = audio.activeId === playId && audio.isPlaying && Boolean(lines?.length);
  const linesRef = useRef(lines);
  const clockRef = useRef(audio.currentTime);

  useEffect(() => {
    linesRef.current = lines;
    clockRef.current = audio.currentTime;
  });

  useEffect(() => {
    if (!following) return undefined;
    let handle = 0;
    const tick = () => {
      const time = clockRef.current();
      let next: SpokenWord | undefined;
      if (time !== undefined) {
        for (const line of linesRef.current ?? []) {
          const index = spokenWordIndex(line.words, time);
          if (index >= 0) next = { lineId: line.lineId, index };
        }
      }
      setSpoken((current) => (sameWord(current, next) ? current : next));
      handle = nextFrame(tick);
    };
    tick();
    return () => {
      cancelFrame(handle);
      setSpoken(undefined);
    };
  }, [following]);

  return following ? spoken : undefined;
}
