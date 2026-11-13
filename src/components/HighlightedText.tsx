import { Fragment } from 'react';
import { stressWordKey } from '../content/audio';

const wordKey = (part: string) => stressWordKey(part.replace(/[’‘]/g, "'"));

type Props = {
  text: string;
  stressWords: string[];
  /** Index (among whitespace-separated words) of the word being spoken by model audio, if any. */
  spokenIndex?: number;
};

/**
 * Renders text with stressed words in bold and underlined (never color alone),
 * and an optional follow-along highlight on the word currently being spoken.
 */
export function HighlightedText({ text, stressWords, spokenIndex }: Props) {
  const stressed = stressWords.map(wordKey);
  const parts = text.split(/(\s+)/);
  // Position of each part among the words (whitespace parts get -1), matching timedWords().
  const wordIndexes = parts.reduce<number[]>((indexes, part) => [...indexes, part.trim() ? Math.max(-1, ...indexes) + 1 : -1], []);
  return (
    <>
      {parts.map((part, index) => {
        if (!part.trim()) return part;
        const wordIndex = wordIndexes[index];
        const key = wordKey(part);
        // Also matches stressed word endings inside longer tokens, e.g. SAYED in "El-Sayed".
        const isStressed = stressed.includes(key) || stressed.some((word) => word.length > 2 && key.endsWith(word));
        const content = isStressed ? <strong className="stress-word">{part}</strong> : part;
        return wordIndex === spokenIndex
          ? <span className="spoken-word" key={`${part}-${index}`}>{content}</span>
          : <Fragment key={`${part}-${index}`}>{content}</Fragment>;
      })}
    </>
  );
}
