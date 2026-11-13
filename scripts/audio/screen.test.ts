import { describe, expect, it } from 'vitest';
import { prominenceScore, type WordFeatures } from './screen';

const flat = (count: number): WordFeatures[] => Array.from({ length: count }, () => ({ loudness: 0, logDuration: Math.log(1 / count) }));
const withWord = (count: number, index: number, loudness: number, durationFactor: number): WordFeatures[] =>
  flat(count).map((word, i) => (i === index ? { loudness, logDuration: word.logDuration + Math.log(durationFactor) } : word));

describe('Stress Mode prominence score', () => {
  it('is zero when the target word sounds the same as in the sibling takes', () => {
    expect(prominenceScore(flat(5), [flat(5), flat(5)], [2]).score).toBe(0);
  });

  it('scores one unit for each clear cue: +3 dB or +30% duration', () => {
    expect(prominenceScore(withWord(5, 2, 3, 1), [flat(5), flat(5)], [2])).toEqual({ score: 1, loudnessDb: 3, durationPct: 0 });
    expect(prominenceScore(withWord(5, 2, 0, 1.3), [flat(5), flat(5)], [2])).toEqual({ score: 1, loudnessDb: 0, durationPct: 30 });
    expect(prominenceScore(withWord(5, 2, 3, 1.3), [flat(5), flat(5)], [2]).score).toBe(2);
  });

  it('goes negative when the word is quieter or shorter than when unstressed', () => {
    expect(prominenceScore(flat(5), [withWord(5, 2, 3, 1), withWord(5, 2, 3, 1)], [2]).score).toBe(-1);
  });

  it('averages over every occurrence of a repeated target word', () => {
    const own = withWord(6, 1, 3, 1).map((word, i) => (i === 4 ? { ...word, loudness: 0 } : word));
    expect(prominenceScore(own, [flat(6), flat(6)], [1, 4]).loudnessDb).toBe(1.5);
  });
});
