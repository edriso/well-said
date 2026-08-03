const cleanWord = (word: string) => word.toLocaleLowerCase().replace(/[^a-z’']/g, '');

export function HighlightedText({ text, stressWords }: { text: string; stressWords: string[] }) {
  const stressed = new Set(stressWords.map(cleanWord));
  return (
    <>
      {text.split(/(\s+)/).map((part, index) => {
        const cleaned = cleanWord(part);
        const isStressed = stressed.has(cleaned) || [...stressed].some((word) => word.length > 2 && cleaned.endsWith(word));
        return isStressed ? (
          <strong className="stress-word" key={`${part}-${index}`}>
            {part}
          </strong>
        ) : (
          part
        );
      })}
    </>
  );
}
