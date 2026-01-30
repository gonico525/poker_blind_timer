import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VolumeControl } from './VolumeControl';

describe('VolumeControl', () => {
  const defaultProps = {
    volume: 0.7,
    isSoundEnabled: true,
    onVolumeChange: vi.fn(),
    onSoundEnabledChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render volume control button', () => {
      render(<VolumeControl {...defaultProps} />);
      const button = screen.getByRole('button', { name: /音量設定/i });
      expect(button).toBeInTheDocument();
    });

    it('should display correct icon for high volume', () => {
      render(
        <VolumeControl {...defaultProps} volume={0.8} isSoundEnabled={true} />
      );
      const icon = screen.getByRole('button').querySelector('span');
      expect(icon?.textContent).toBe('🔊');
    });

    it('should display correct icon for medium volume', () => {
      render(
        <VolumeControl {...defaultProps} volume={0.5} isSoundEnabled={true} />
      );
      const icon = screen.getByRole('button').querySelector('span');
      expect(icon?.textContent).toBe('🔉');
    });

    it('should display correct icon for low volume', () => {
      render(
        <VolumeControl {...defaultProps} volume={0.2} isSoundEnabled={true} />
      );
      const icon = screen.getByRole('button').querySelector('span');
      expect(icon?.textContent).toBe('🔈');
    });

    it('should display mute icon when sound is disabled', () => {
      render(
        <VolumeControl {...defaultProps} volume={0.7} isSoundEnabled={false} />
      );
      const icon = screen.getByRole('button').querySelector('span');
      expect(icon?.textContent).toBe('🔇');
    });

    it('should display mute icon when volume is 0', () => {
      render(
        <VolumeControl {...defaultProps} volume={0} isSoundEnabled={true} />
      );
      const icon = screen.getByRole('button').querySelector('span');
      expect(icon?.textContent).toBe('🔇');
    });
  });

  describe('Popover behavior', () => {
    it('should not show popover initially', () => {
      render(<VolumeControl {...defaultProps} />);
      const popover = screen.queryByRole('dialog');
      expect(popover).not.toBeInTheDocument();
    });

    it('should show popover when button is clicked', async () => {
      const user = userEvent.setup();
      render(<VolumeControl {...defaultProps} />);

      const button = screen.getByRole('button', { name: /音量設定/i });
      await user.click(button);

      const popover = screen.getByRole('dialog', { name: /音量設定/i });
      expect(popover).toBeInTheDocument();
    });

    it('should hide popover when button is clicked again', async () => {
      const user = userEvent.setup();
      render(<VolumeControl {...defaultProps} />);

      const button = screen.getByRole('button', { name: /音量設定/i });
      await user.click(button);
      await user.click(button);

      const popover = screen.queryByRole('dialog');
      expect(popover).not.toBeInTheDocument();
    });

    it('should hide popover when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <VolumeControl {...defaultProps} />
        </div>
      );

      const button = screen.getByRole('button', { name: /音量設定/i });
      await user.click(button);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const outside = screen.getByTestId('outside');
      await user.click(outside);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should hide popover when pressing Escape key', async () => {
      const user = userEvent.setup();
      render(<VolumeControl {...defaultProps} />);

      const button = screen.getByRole('button', { name: /音量設定/i });
      await user.click(button);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should set aria-expanded attribute correctly', async () => {
      const user = userEvent.setup();
      render(<VolumeControl {...defaultProps} />);

      const button = screen.getByRole('button', { name: /音量設定/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');

      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');

      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Volume adjustment', () => {
    it('should call onVolumeChange when slider value changes', async () => {
      const user = userEvent.setup();
      const onVolumeChange = vi.fn();
      render(
        <VolumeControl {...defaultProps} onVolumeChange={onVolumeChange} />
      );

      const button = screen.getByRole('button', { name: /音量設定/i });
      await user.click(button);

      const slider = screen.getByRole('slider') as HTMLInputElement;
      fireEvent.change(slider, { target: { value: '50' } });

      expect(onVolumeChange).toHaveBeenCalledWith(0.5);
    });

    it('should display current volume value correctly', async () => {
      const user = userEvent.setup();
      render(<VolumeControl {...defaultProps} volume={0.7} />);

      const button = screen.getByRole('button', { name: /音量設定/i });
      await user.click(button);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('70');
    });

    it('should disable slider when sound is disabled', async () => {
      const user = userEvent.setup();
      render(<VolumeControl {...defaultProps} isSoundEnabled={false} />);

      const button = screen.getByRole('button', { name: /音量設定/i });
      await user.click(button);

      const slider = screen.getByRole('slider');
      expect(slider).toBeDisabled();
    });
  });

  describe('Sound toggle', () => {
    it('should call onSoundEnabledChange when toggle is clicked', async () => {
      const user = userEvent.setup();
      const onSoundEnabledChange = vi.fn();
      render(
        <VolumeControl
          {...defaultProps}
          isSoundEnabled={true}
          onSoundEnabledChange={onSoundEnabledChange}
        />
      );

      const button = screen.getByRole('button', { name: /音量設定/i });
      await user.click(button);

      const toggle = screen.getByRole('switch', { name: /音声ON/i });
      await user.click(toggle);

      expect(onSoundEnabledChange).toHaveBeenCalledWith(false);
    });

    it('should show toggle in correct state', async () => {
      const user = userEvent.setup();
      render(<VolumeControl {...defaultProps} isSoundEnabled={true} />);

      const button = screen.getByRole('button', { name: /音量設定/i });
      await user.click(button);

      const toggle = screen.getByRole('switch', { name: /音声ON/i });
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on button', () => {
      render(<VolumeControl {...defaultProps} />);
      const button = screen.getByRole('button', { name: /音量設定/i });

      expect(button).toHaveAttribute('aria-label', '音量設定');
      expect(button).toHaveAttribute('aria-haspopup', 'true');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have proper role on popover', async () => {
      const user = userEvent.setup();
      render(<VolumeControl {...defaultProps} />);

      const button = screen.getByRole('button', { name: /音量設定/i });
      await user.click(button);

      const popover = screen.getByRole('dialog', { name: /音量設定/i });
      expect(popover).toBeInTheDocument();
    });

    it('should return focus to button when closing with Escape', async () => {
      const user = userEvent.setup();
      render(<VolumeControl {...defaultProps} />);

      const button = screen.getByRole('button', { name: /音量設定/i });
      await user.click(button);
      await user.keyboard('{Escape}');

      expect(button).toHaveFocus();
    });
  });
});
