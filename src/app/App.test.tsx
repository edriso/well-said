import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/well-said/');
  vi.stubGlobal('scrollTo', vi.fn());
  vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), speak: vi.fn(), getVoices: () => [] });
  vi.stubGlobal('SpeechSynthesisUtterance', class {
    text: string;
    constructor(text: string) { this.text = text; }
  });
});

describe('App workout flow', () => {
  it('opens a workout and progressively reveals the transcript', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /start workout/i }));
    expect(screen.getByRole('heading', { name: /hear the whole conversation/i })).toBeInTheDocument();
    expect(screen.queryByText(/use it when you need support/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /reveal transcript/i }));
    expect(screen.getAllByText(/Maya|Noah|Alex|Sam|Lina|Omar|June|Daniel/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /practice the lines/i }));
    expect(screen.getByRole('heading', { name: /one line at a time/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /i said it/i }));
    expect(document.querySelector('.rep-count')).toHaveTextContent('1/3');
  });
});
