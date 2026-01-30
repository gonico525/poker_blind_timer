import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PresetSelector } from './PresetSelector';
import type { Preset, PresetId } from '@/types';

const mockPresets: Preset[] = [
  {
    id: 'preset-1' as PresetId,
    name: 'Standard Tournament',
    type: 'standard',
    blindLevels: [
      { smallBlind: 25, bigBlind: 50, ante: 0 },
      { smallBlind: 50, bigBlind: 100, ante: 0 },
    ],
    levelDuration: 600,
    breakConfig: { enabled: false, frequency: 4, duration: 10 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'preset-2' as PresetId,
    name: 'Turbo Tournament',
    type: 'turbo',
    blindLevels: [
      { smallBlind: 50, bigBlind: 100, ante: 0 },
      { smallBlind: 100, bigBlind: 200, ante: 25 },
    ],
    levelDuration: 300,
    breakConfig: { enabled: false, frequency: 4, duration: 10 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'preset-3' as PresetId,
    name: 'Deep Stack',
    type: 'deepstack',
    blindLevels: [
      { smallBlind: 25, bigBlind: 50, ante: 0 },
      { smallBlind: 50, bigBlind: 75, ante: 0 },
    ],
    levelDuration: 900,
    breakConfig: { enabled: false, frequency: 4, duration: 10 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

describe('PresetSelector', () => {
  const defaultProps = {
    presets: mockPresets,
    currentPresetId: 'preset-1' as PresetId,
    onSelect: vi.fn(),
    onManage: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render preset selector', () => {
      render(<PresetSelector {...defaultProps} />);
      const dropdown = screen.getByRole('button', { name: /プリセット選択/i });
      expect(dropdown).toBeInTheDocument();
    });

    it('should display current preset name', () => {
      render(<PresetSelector {...defaultProps} />);
      const presetName = screen.getByText('Standard Tournament');
      expect(presetName).toBeInTheDocument();
    });

    it('should not display preset name when no preset is selected', () => {
      render(<PresetSelector {...defaultProps} currentPresetId={null} />);
      const presetName = screen.queryByText('Standard Tournament');
      expect(presetName).not.toBeInTheDocument();
    });

    it('should render all presets in dropdown', async () => {
      const user = userEvent.setup();
      render(<PresetSelector {...defaultProps} />);

      const button = screen.getByRole('button', { name: /プリセット選択/i });
      await user.click(button);

      expect(screen.getByText('Standard Tournament')).toBeInTheDocument();
      expect(screen.getByText('Turbo Tournament')).toBeInTheDocument();
      expect(screen.getByText('Deep Stack')).toBeInTheDocument();
    });

    it('should render management option in dropdown', async () => {
      const user = userEvent.setup();
      render(<PresetSelector {...defaultProps} />);

      const button = screen.getByRole('button', { name: /プリセット選択/i });
      await user.click(button);

      expect(screen.getByText(/プリセット管理/i)).toBeInTheDocument();
    });

    it('should render separator before management option', async () => {
      const user = userEvent.setup();
      render(<PresetSelector {...defaultProps} />);

      const button = screen.getByRole('button', { name: /プリセット選択/i });
      await user.click(button);

      const separator = screen.getByText('────────');
      expect(separator).toBeInTheDocument();
    });
  });

  describe('Preset selection', () => {
    it('should call onSelect when a preset is selected', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<PresetSelector {...defaultProps} onSelect={onSelect} />);

      const button = screen.getByRole('button', { name: /プリセット選択/i });
      await user.click(button);

      const turboOption = screen.getByText('Turbo Tournament');
      await user.click(turboOption);

      expect(onSelect).toHaveBeenCalledWith('preset-2');
    });

    it('should call onManage when management option is selected', async () => {
      const user = userEvent.setup();
      const onManage = vi.fn();
      render(<PresetSelector {...defaultProps} onManage={onManage} />);

      const button = screen.getByRole('button', { name: /プリセット選択/i });
      await user.click(button);

      const manageOption = screen.getByText(/プリセット管理/i);
      await user.click(manageOption);

      expect(onManage).toHaveBeenCalled();
    });

    it('should not call onSelect when management option is selected', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<PresetSelector {...defaultProps} onSelect={onSelect} />);

      const button = screen.getByRole('button', { name: /プリセット選択/i });
      await user.click(button);

      const manageOption = screen.getByText(/プリセット管理/i);
      await user.click(manageOption);

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('should not call any callback when separator is clicked', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const onManage = vi.fn();
      render(
        <PresetSelector
          {...defaultProps}
          onSelect={onSelect}
          onManage={onManage}
        />
      );

      const button = screen.getByRole('button', { name: /プリセット選択/i });
      await user.click(button);

      const separator = screen.getByText('────────');
      await user.click(separator);

      expect(onSelect).not.toHaveBeenCalled();
      expect(onManage).not.toHaveBeenCalled();
    });
  });

  describe('Empty state', () => {
    it('should render with empty preset list', () => {
      render(<PresetSelector {...defaultProps} presets={[]} />);
      const dropdown = screen.getByRole('button', { name: /プリセット選択/i });
      expect(dropdown).toBeInTheDocument();
    });

    it('should still show management option with empty preset list', async () => {
      const user = userEvent.setup();
      render(<PresetSelector {...defaultProps} presets={[]} />);

      const button = screen.getByRole('button', { name: /プリセット選択/i });
      await user.click(button);

      expect(screen.getByText(/プリセット管理/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      render(<PresetSelector {...defaultProps} />);
      const dropdown = screen.getByRole('button', { name: /プリセット選択/i });
      expect(dropdown).toBeInTheDocument();
    });
  });
});
