import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { getTodaysLesson } from '../content/lessons';
import { emptyProgress } from '../hooks/useProgress';
import { HomeScreen } from './HomeScreen';

describe('HomeScreen', () => {
  it('keeps the daily workout as the primary action', async () => {
    const user = userEvent.setup();
    const onOpenLesson = vi.fn();
    render(<HomeScreen progress={emptyProgress} onOpenLesson={onOpenLesson} />);

    expect(screen.getByRole('heading', { name: /sound a little more natural/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /start workout/i }));
    expect(onOpenLesson).toHaveBeenCalledWith(getTodaysLesson());
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<HomeScreen progress={emptyProgress} onOpenLesson={vi.fn()} />);
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });

  it('searches and filters the extended workout library', async () => {
    const user = userEvent.setup();
    render(<HomeScreen progress={emptyProgress} onOpenLesson={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText(/filter by category/i), 'Travel');
    expect(screen.getByText('18 workouts')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/search workouts/i), 'rideshare');
    expect(screen.getByRole('button', { name: /finding the rideshare pickup/i })).toBeInTheDocument();
    expect(screen.getByText('1 workout')).toBeInTheDocument();
  });
});
