import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HighlightedText } from './HighlightedText';

describe('HighlightedText', () => {
  it('marks stressed words with weight and underline, including accented words', () => {
    const { container } = render(<p><HighlightedText text="Past the café, then up the stairs." stressWords={['café', 'stairs']} /></p>);
    expect([...container.querySelectorAll('strong.stress-word')].map((node) => node.textContent)).toEqual(['café,', 'stairs.']);
  });

  it('highlights the spoken word by its position, keeping stress marks inside it', () => {
    const { container } = render(<p><HighlightedText text="Could I get a small latte?" stressWords={['small']} spokenIndex={4} /></p>);
    const spoken = container.querySelector('.spoken-word');
    expect(spoken).toHaveTextContent('small');
    expect(spoken?.querySelector('strong.stress-word')).not.toBeNull();
    expect(container).toHaveTextContent('Could I get a small latte?');
  });

  it('adds no highlight when nothing is being spoken', () => {
    const { container } = render(<p><HighlightedText text="Hi there!" stressWords={[]} /></p>);
    expect(container.querySelector('.spoken-word')).toBeNull();
  });
});
