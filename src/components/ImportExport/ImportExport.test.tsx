import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportExport } from './ImportExport';
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
    breakConfig: { enabled: false, frequency: 4, duration: 600 },
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
    breakConfig: { enabled: false, frequency: 4, duration: 600 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// Mock URL methods
const createObjectURLMock = vi.fn();
const revokeObjectURLMock = vi.fn();

describe('ImportExport', () => {
  const defaultProps = {
    structures: mockStructures,
    onImport: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;
    createObjectURLMock.mockReturnValue('blob:mock-url');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render export and import buttons', () => {
      render(<ImportExport {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /エクスポート/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /インポート/i })
      ).toBeInTheDocument();
    });

    it('should disable export button when no structures', () => {
      render(<ImportExport {...defaultProps} structures={[]} />);

      const exportButton = screen.getByRole('button', {
        name: /エクスポート/i,
      });
      expect(exportButton).toBeDisabled();
    });

    it('should not show messages initially', () => {
      render(<ImportExport {...defaultProps} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Export functionality', () => {
    it('should export structures as JSON file', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...defaultProps} />);

      const exportButton = screen.getByRole('button', {
        name: /エクスポート/i,
      });
      await user.click(exportButton);

      expect(createObjectURLMock).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalled();
    });

    it('should show success message after export', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...defaultProps} />);

      const exportButton = screen.getByRole('button', {
        name: /エクスポート/i,
      });
      await user.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/エクスポートしました/i)).toBeInTheDocument();
      });
    });

    it('should include structure count in success message', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...defaultProps} />);

      const exportButton = screen.getByRole('button', {
        name: /エクスポート/i,
      });
      await user.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/2件/i)).toBeInTheDocument();
      });
    });
  });

  describe('Import functionality', () => {
    it('should trigger file input when import button is clicked', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...defaultProps} />);

      const fileInput = screen.getByLabelText(
        /JSONファイルを選択/i
      ) as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      const importButton = screen.getByRole('button', { name: /インポート/i });
      await user.click(importButton);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should import valid JSON file', async () => {
      const user = userEvent.setup();
      const onImport = vi.fn();
      render(<ImportExport {...defaultProps} onImport={onImport} />);

      const fileInput = screen.getByLabelText(
        /JSONファイルを選択/i
      ) as HTMLInputElement;
      const file = new File(
        [JSON.stringify(mockStructures)],
        'structures.json',
        {
          type: 'application/json',
        }
      );

      await user.upload(fileInput, file);

      await waitFor(
        () => {
          expect(onImport).toHaveBeenCalled();
        },
        { timeout: 500 }
      );
    });

    it('should show success message after import', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...defaultProps} />);

      const fileInput = screen.getByLabelText(
        /JSONファイルを選択/i
      ) as HTMLInputElement;
      const file = new File(
        [JSON.stringify(mockStructures)],
        'structures.json',
        {
          type: 'application/json',
        }
      );

      await user.upload(fileInput, file);

      await waitFor(
        () => {
          expect(screen.getByText(/インポートしました/i)).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it('should show error for invalid JSON', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...defaultProps} />);

      const fileInput = screen.getByLabelText(
        /JSONファイルを選択/i
      ) as HTMLInputElement;
      const file = new File(['invalid json'], 'structures.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, file);

      await waitFor(
        () => {
          expect(screen.getByText(/JSONの解析に失敗/i)).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it('should show error for non-array JSON', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...defaultProps} />);

      const fileInput = screen.getByLabelText(
        /JSONファイルを選択/i
      ) as HTMLInputElement;
      const file = new File(
        [JSON.stringify({ not: 'an array' })],
        'structures.json',
        {
          type: 'application/json',
        }
      );

      await user.upload(fileInput, file);

      await waitFor(
        () => {
          expect(screen.getByText(/無効なファイル形式/i)).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on buttons', () => {
      render(<ImportExport {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /ストラクチャーをエクスポート/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /ストラクチャーをインポート/i })
      ).toBeInTheDocument();
    });

    it('should show error message with alert role', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...defaultProps} />);

      const fileInput = screen.getByLabelText(
        /JSONファイルを選択/i
      ) as HTMLInputElement;
      const file = new File(['invalid json'], 'structures.json', {
        type: 'application/json',
      });

      await user.upload(fileInput, file);

      await waitFor(
        () => {
          const alert = screen.getByRole('alert');
          expect(alert).toHaveAttribute('aria-live', 'assertive');
        },
        { timeout: 500 }
      );
    });

    it('should show success message with status role', async () => {
      const user = userEvent.setup();
      render(<ImportExport {...defaultProps} />);

      const exportButton = screen.getByRole('button', {
        name: /エクスポート/i,
      });
      await user.click(exportButton);

      await waitFor(() => {
        const status = screen.getByRole('status');
        expect(status).toHaveAttribute('aria-live', 'polite');
      });
    });
  });
});
