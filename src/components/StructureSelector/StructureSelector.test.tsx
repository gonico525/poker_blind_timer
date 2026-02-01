import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StructureSelector } from './StructureSelector';
import type { Structure, StructureId } from '@/types';

const mockStructures: Structure[] = [
  {
    id: 'structure-1' as StructureId,
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
    id: 'structure-2' as StructureId,
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
    id: 'structure-3' as StructureId,
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

describe('StructureSelector', () => {
  const defaultProps = {
    structures: mockStructures,
    currentStructureId: 'structure-1' as StructureId,
    onSelect: vi.fn(),
    onManage: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render structure selector', () => {
      render(<StructureSelector {...defaultProps} />);
      const dropdown = screen.getByRole('button', {
        name: /ストラクチャー選択/i,
      });
      expect(dropdown).toBeInTheDocument();
    });

    it('should display current structure name', () => {
      render(<StructureSelector {...defaultProps} />);
      // 現在選択中のストラクチャー名が表示されている（ドロップダウン内にも表示されるため複数存在する可能性あり）
      const structureNames = screen.getAllByText('Standard Tournament');
      expect(structureNames.length).toBeGreaterThanOrEqual(1);
    });

    it('should not display structure name when no structure is selected', () => {
      render(<StructureSelector {...defaultProps} currentStructureId={null} />);
      const structureName = screen.queryByText('Standard Tournament');
      expect(structureName).not.toBeInTheDocument();
    });

    it('should render all structures in dropdown', async () => {
      const user = userEvent.setup();
      render(<StructureSelector {...defaultProps} />);

      const button = screen.getByRole('button', {
        name: /ストラクチャー選択/i,
      });
      await user.click(button);

      // ドロップダウン内のオプションを確認（現在選択中のものは2つ表示される可能性がある）
      expect(
        screen.getAllByText('Standard Tournament').length
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Turbo Tournament')).toBeInTheDocument();
      expect(screen.getByText('Deep Stack')).toBeInTheDocument();
    });

    it('should render management option in dropdown', async () => {
      const user = userEvent.setup();
      render(<StructureSelector {...defaultProps} />);

      const button = screen.getByRole('button', {
        name: /ストラクチャー選択/i,
      });
      await user.click(button);

      expect(screen.getByText(/ストラクチャー管理/i)).toBeInTheDocument();
    });

    it('should render separator before management option', async () => {
      const user = userEvent.setup();
      render(<StructureSelector {...defaultProps} />);

      const button = screen.getByRole('button', {
        name: /ストラクチャー選択/i,
      });
      await user.click(button);

      const separator = screen.getByText('────────');
      expect(separator).toBeInTheDocument();
    });
  });

  describe('Structure selection', () => {
    it('should call onSelect when a structure is selected', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<StructureSelector {...defaultProps} onSelect={onSelect} />);

      const button = screen.getByRole('button', {
        name: /ストラクチャー選択/i,
      });
      await user.click(button);

      const turboOption = screen.getByText('Turbo Tournament');
      await user.click(turboOption);

      expect(onSelect).toHaveBeenCalledWith('structure-2');
    });

    it('should call onManage when management option is selected', async () => {
      const user = userEvent.setup();
      const onManage = vi.fn();
      render(<StructureSelector {...defaultProps} onManage={onManage} />);

      const button = screen.getByRole('button', {
        name: /ストラクチャー選択/i,
      });
      await user.click(button);

      const manageOption = screen.getByText(/ストラクチャー管理/i);
      await user.click(manageOption);

      expect(onManage).toHaveBeenCalled();
    });

    it('should not call onSelect when management option is selected', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<StructureSelector {...defaultProps} onSelect={onSelect} />);

      const button = screen.getByRole('button', {
        name: /ストラクチャー選択/i,
      });
      await user.click(button);

      const manageOption = screen.getByText(/ストラクチャー管理/i);
      await user.click(manageOption);

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('should not call any callback when separator is clicked', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const onManage = vi.fn();
      render(
        <StructureSelector
          {...defaultProps}
          onSelect={onSelect}
          onManage={onManage}
        />
      );

      const button = screen.getByRole('button', {
        name: /ストラクチャー選択/i,
      });
      await user.click(button);

      const separator = screen.getByText('────────');
      await user.click(separator);

      expect(onSelect).not.toHaveBeenCalled();
      expect(onManage).not.toHaveBeenCalled();
    });
  });

  describe('Empty state', () => {
    it('should render with empty structure list', () => {
      render(<StructureSelector {...defaultProps} structures={[]} />);
      const dropdown = screen.getByRole('button', {
        name: /ストラクチャー選択/i,
      });
      expect(dropdown).toBeInTheDocument();
    });

    it('should still show management option with empty structure list', async () => {
      const user = userEvent.setup();
      render(<StructureSelector {...defaultProps} structures={[]} />);

      const button = screen.getByRole('button', {
        name: /ストラクチャー選択/i,
      });
      await user.click(button);

      expect(screen.getByText(/ストラクチャー管理/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      render(<StructureSelector {...defaultProps} />);
      const dropdown = screen.getByRole('button', {
        name: /ストラクチャー選択/i,
      });
      expect(dropdown).toBeInTheDocument();
    });
  });
});
