import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BreakDisplay } from './BreakDisplay';

describe('BreakDisplay', () => {
  it('should display break time remaining', () => {
    render(<BreakDisplay remainingTime={300} />);
    expect(screen.getByTestId('break-time')).toHaveTextContent('05:00');
  });

  it('should display break message', () => {
    render(<BreakDisplay remainingTime={300} />);
    expect(
      screen.getByRole('heading', { name: /break time/i })
    ).toBeInTheDocument();
  });

  it('should show skip button', () => {
    const onSkip = vi.fn();
    render(<BreakDisplay remainingTime={300} onSkip={onSkip} />);
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
  });

  it('should call onSkip when skip button is clicked', async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    render(<BreakDisplay remainingTime={300} onSkip={onSkip} />);
    await user.click(screen.getByRole('button', { name: /skip/i }));
    expect(onSkip).toHaveBeenCalled();
  });

  it('should not show skip button when onSkip is not provided', () => {
    render(<BreakDisplay remainingTime={300} />);
    expect(
      screen.queryByRole('button', { name: /skip/i })
    ).not.toBeInTheDocument();
  });

  it('should format time correctly for different values', () => {
    const { rerender } = render(<BreakDisplay remainingTime={59} />);
    expect(screen.getByTestId('break-time')).toHaveTextContent('00:59');

    rerender(<BreakDisplay remainingTime={600} />);
    expect(screen.getByTestId('break-time')).toHaveTextContent('10:00');

    rerender(<BreakDisplay remainingTime={0} />);
    expect(screen.getByTestId('break-time')).toHaveTextContent('00:00');
  });
});
