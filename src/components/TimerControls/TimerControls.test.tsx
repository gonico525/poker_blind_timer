import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimerControls } from './TimerControls';

describe('TimerControls', () => {
  const defaultProps = {
    status: 'idle' as const,
    isOnBreak: false,
    hasNextLevel: true,
    hasPrevLevel: false,
    onStart: vi.fn(),
    onPause: vi.fn(),
    onReset: vi.fn(),
    onNextLevel: vi.fn(),
    onPrevLevel: vi.fn(),
    onSkipBreak: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Start/Pause button', () => {
    it('should show "Start" when idle', () => {
      render(<TimerControls {...defaultProps} status="idle" />);
      expect(
        screen.getByRole('button', { name: /start/i })
      ).toBeInTheDocument();
    });

    it('should show "Pause" when running', () => {
      render(<TimerControls {...defaultProps} status="running" />);
      expect(
        screen.getByRole('button', { name: /pause/i })
      ).toBeInTheDocument();
    });

    it('should show "Resume" when paused', () => {
      render(<TimerControls {...defaultProps} status="paused" />);
      expect(
        screen.getByRole('button', { name: /resume/i })
      ).toBeInTheDocument();
    });

    it('should call onStart when clicked in idle state', async () => {
      const user = userEvent.setup();
      render(<TimerControls {...defaultProps} status="idle" />);
      await user.click(screen.getByRole('button', { name: /start/i }));
      expect(defaultProps.onStart).toHaveBeenCalled();
    });

    it('should call onPause when clicked in running state', async () => {
      const user = userEvent.setup();
      render(<TimerControls {...defaultProps} status="running" />);
      await user.click(screen.getByRole('button', { name: /pause/i }));
      expect(defaultProps.onPause).toHaveBeenCalled();
    });
  });

  describe('Reset button', () => {
    it('should call onReset when clicked', async () => {
      const user = userEvent.setup();
      render(<TimerControls {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /reset/i }));
      expect(defaultProps.onReset).toHaveBeenCalled();
    });
  });

  describe('Level navigation', () => {
    it('should disable prev button when hasPrevLevel is false', () => {
      render(<TimerControls {...defaultProps} hasPrevLevel={false} />);
      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    });

    it('should disable next button when hasNextLevel is false', () => {
      render(<TimerControls {...defaultProps} hasNextLevel={false} />);
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });

    it('should call onNextLevel when next is clicked', async () => {
      const user = userEvent.setup();
      render(<TimerControls {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /next/i }));
      expect(defaultProps.onNextLevel).toHaveBeenCalled();
    });

    it('should call onPrevLevel when prev is clicked', async () => {
      const user = userEvent.setup();
      render(<TimerControls {...defaultProps} hasPrevLevel={true} />);
      await user.click(screen.getByRole('button', { name: /previous/i }));
      expect(defaultProps.onPrevLevel).toHaveBeenCalled();
    });
  });

  describe('Break controls', () => {
    it('should show skip break button when on break', () => {
      render(<TimerControls {...defaultProps} isOnBreak={true} />);
      expect(
        screen.getByRole('button', { name: /skip break/i })
      ).toBeInTheDocument();
    });

    it('should disable level navigation when on break', () => {
      render(
        <TimerControls
          {...defaultProps}
          isOnBreak={true}
          hasNextLevel={true}
          hasPrevLevel={true}
        />
      );
      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });

    it('should call onSkipBreak when skip break is clicked', async () => {
      const user = userEvent.setup();
      render(<TimerControls {...defaultProps} isOnBreak={true} />);
      await user.click(screen.getByRole('button', { name: /skip break/i }));
      expect(defaultProps.onSkipBreak).toHaveBeenCalled();
    });
  });
});
