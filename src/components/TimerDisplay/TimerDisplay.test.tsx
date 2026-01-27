import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimerDisplay } from './TimerDisplay';

describe('TimerDisplay', () => {
  const mockTimerState = {
    remainingTime: 545, // 9:05
    elapsedTime: 55,
    status: 'running' as const,
    isOnBreak: false,
  };

  it('should display remaining time in MM:SS format', () => {
    render(<TimerDisplay {...mockTimerState} />);
    expect(screen.getByTestId('remaining-time')).toHaveTextContent('09:05');
  });

  it('should display elapsed time', () => {
    render(<TimerDisplay {...mockTimerState} />);
    expect(screen.getByTestId('elapsed-time')).toHaveTextContent('00:55');
  });

  it('should apply running class when timer is running', () => {
    render(<TimerDisplay {...mockTimerState} />);
    expect(screen.getByTestId('timer-display')).toHaveAttribute(
      'data-status',
      'running'
    );
  });

  it('should apply warning class when remainingTime <= 60', () => {
    render(<TimerDisplay {...mockTimerState} remainingTime={60} />);
    expect(screen.getByTestId('timer-display')).toHaveAttribute(
      'data-warning',
      'true'
    );
  });

  it('should apply critical class when remainingTime <= 30', () => {
    render(<TimerDisplay {...mockTimerState} remainingTime={30} />);
    expect(screen.getByTestId('timer-display')).toHaveAttribute(
      'data-critical',
      'true'
    );
  });

  it('should display "BREAK" when on break', () => {
    render(<TimerDisplay {...mockTimerState} isOnBreak={true} />);
    expect(screen.getByTestId('break-indicator')).toBeInTheDocument();
  });

  it('should apply paused class when timer is paused', () => {
    render(<TimerDisplay {...mockTimerState} status="paused" />);
    expect(screen.getByTestId('timer-display')).toHaveAttribute(
      'data-status',
      'paused'
    );
  });

  it('should apply idle class when timer is idle', () => {
    render(<TimerDisplay {...mockTimerState} status="idle" />);
    expect(screen.getByTestId('timer-display')).toHaveAttribute(
      'data-status',
      'idle'
    );
  });
});
