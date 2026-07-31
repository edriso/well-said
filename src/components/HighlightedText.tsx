const cleanWord = (word: string) => word.toLocaleLowerCase().replace(/[^a-z’']/g, '');

export function HighlightedText({ text, stressWords }: { text: string; stressWords: string[] }) {
  const stressed = new Set(stressWords.map(cleanWord));
  return (
    <>
      {text.split(/(\s+)/).map((part, index) =>
        stressed.has(cleanWord(part)) ? (
          <strong className="stress-word" key={`${part}-${index}`}>
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}
