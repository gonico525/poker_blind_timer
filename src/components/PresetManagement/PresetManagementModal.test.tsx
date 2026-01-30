import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PresetManagementModal } from './PresetManagementModal';
import type { Preset, PresetId } from '@/types';

// usePresetsのモック
const mockPresets: Preset[] = [
  {
    id: 'default-standard' as PresetId,
    name: 'Standard',
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
    id: 'custom-1' as PresetId,
    name: 'Custom 1',
    type: 'custom',
    blindLevels: [
      { smallBlind: 25, bigBlind: 50, ante: 0 },
      { smallBlind: 50, bigBlind: 100, ante: 0 },
    ],
    levelDuration: 600,
    breakConfig: { enabled: false, frequency: 4, duration: 10 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const mockAddPreset = vi.fn();
const mockUpdatePreset = vi.fn();
const mockDeletePreset = vi.fn();
const mockLoadPreset = vi.fn();

vi.mock('@/hooks/usePresets', () => ({
  usePresets: () => ({
    presets: mockPresets,
    currentPresetId: 'default-standard' as PresetId,
    addPreset: mockAddPreset,
    updatePreset: mockUpdatePreset,
    deletePreset: mockDeletePreset,
    loadPreset: mockLoadPreset,
  }),
}));

describe('PresetManagementModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentPresetId: 'default-standard' as PresetId,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddPreset.mockImplementation((preset) => ({
      ...preset,
      id: 'new_preset_id' as PresetId,
      type: 'custom',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  });

  it('モーダルが開いた時、currentPresetIdのプリセットが選択される', () => {
    render(<PresetManagementModal {...defaultProps} />);

    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByTestId('preset-name-input')).toHaveValue('Standard');
  });

  it('プリセット選択時、右側に表示される', async () => {
    const user = userEvent.setup();
    render(<PresetManagementModal {...defaultProps} />);

    const items = screen.getAllByTestId('preset-item');
    const customItem = items.find((item) =>
      item.textContent?.includes('Custom 1')
    )!;

    await user.click(customItem);

    await waitFor(() => {
      expect(screen.getByTestId('preset-name-input')).toHaveValue('Custom 1');
    });
  });

  it('新規作成ボタンクリックで新しいプリセットが作成される', async () => {
    const user = userEvent.setup();
    render(<PresetManagementModal {...defaultProps} />);

    const createButton = screen.getByTestId('create-preset-button');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('preset-name-input')).toHaveValue(
        '新しいプリセット'
      );
    });
  });

  it('新規プリセットを保存するとaddPresetが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<PresetManagementModal {...defaultProps} />);

    // 新規作成
    const createButton = screen.getByTestId('create-preset-button');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('preset-name-input')).toHaveValue(
        '新しいプリセット'
      );
    });

    // プリセット名を変更
    const nameInput = screen.getByTestId('preset-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'My New Preset');

    // 保存
    const saveButton = screen.getByTestId('save-button');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockAddPreset).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My New Preset',
        })
      );
    });
  });

  it('既存プリセットを編集して保存するとupdatePresetが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<PresetManagementModal {...defaultProps} />);

    // プリセット名を変更
    const nameInput = screen.getByTestId('preset-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Standard');

    await waitFor(() => {
      const saveButton = screen.getByTestId('save-button');
      expect(saveButton).not.toBeDisabled();
    });

    const saveButton = screen.getByTestId('save-button');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdatePreset).toHaveBeenCalledWith(
        'default-standard',
        expect.objectContaining({
          name: 'Updated Standard',
        })
      );
    });
  });

  it('このプリセットを使うボタンクリックでloadPresetが呼ばれる', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PresetManagementModal {...defaultProps} onClose={onClose} />);

    const useButton = screen.getByTestId('use-button');
    await user.click(useButton);

    expect(mockLoadPreset).toHaveBeenCalledWith('default-standard');
    expect(onClose).toHaveBeenCalled();
  });

  it('削除ボタンクリックで確認ダイアログが表示される', async () => {
    const user = userEvent.setup();
    render(<PresetManagementModal {...defaultProps} />);

    const deleteButtons = screen.getAllByTestId('delete-preset-button');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('プリセットを削除')).toBeInTheDocument();
      expect(
        screen.getByText(
          /「Custom 1」を削除しますか？この操作は取り消せません。/
        )
      ).toBeInTheDocument();
    });
  });

  it('削除確認でdeletePresetが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<PresetManagementModal {...defaultProps} />);

    const deleteButtons = screen.getAllByTestId('delete-preset-button');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('プリセットを削除')).toBeInTheDocument();
    });

    const confirmButton = screen.getByTestId('confirm-button');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeletePreset).toHaveBeenCalledWith('custom-1');
    });
  });

  it('削除キャンセルでダイアログが閉じる', async () => {
    const user = userEvent.setup();
    render(<PresetManagementModal {...defaultProps} />);

    const deleteButtons = screen.getAllByTestId('delete-preset-button');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('プリセットを削除')).toBeInTheDocument();
    });

    const cancelButton = screen.getByTestId('cancel-button');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('プリセットを削除')).not.toBeInTheDocument();
    });

    expect(mockDeletePreset).not.toHaveBeenCalled();
  });

  it('未保存の変更がある時、別プリセット選択で警告ダイアログが表示される', async () => {
    const user = userEvent.setup();
    render(<PresetManagementModal {...defaultProps} />);

    // プリセット名を変更（未保存）
    const nameInput = screen.getByTestId('preset-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'Modified');

    // 別のプリセットを選択
    const items = screen.getAllByTestId('preset-item');
    const customItem = items.find((item) =>
      item.textContent?.includes('Custom 1')
    )!;

    await user.click(customItem);

    await waitFor(() => {
      expect(screen.getByText('未保存の変更')).toBeInTheDocument();
      expect(
        screen.getByText('保存されていない変更があります。変更を破棄しますか？')
      ).toBeInTheDocument();
    });
  });

  it('未保存の変更がある時、モーダルを閉じると警告ダイアログが表示される', async () => {
    const user = userEvent.setup();
    render(<PresetManagementModal {...defaultProps} />);

    // プリセット名を変更（未保存）
    const nameInput = screen.getByTestId('preset-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'Modified');

    // モーダルを閉じる
    const closeButton = screen.getByTestId('modal-close-button');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.getByText('未保存の変更')).toBeInTheDocument();
    });
  });

  it('未保存警告で「破棄」を選択すると変更が破棄される', async () => {
    const user = userEvent.setup();
    render(<PresetManagementModal {...defaultProps} />);

    // プリセット名を変更
    const nameInput = screen.getByTestId('preset-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'Modified');

    // 別のプリセットを選択
    const items = screen.getAllByTestId('preset-item');
    const customItem = items.find((item) =>
      item.textContent?.includes('Custom 1')
    )!;

    await user.click(customItem);

    await waitFor(() => {
      expect(screen.getByText('未保存の変更')).toBeInTheDocument();
    });

    // 破棄
    const confirmButton = screen.getAllByTestId('confirm-button')[0];
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByTestId('preset-name-input')).toHaveValue('Custom 1');
    });
  });

  it('未保存警告で「キャンセル」を選択すると変更が保持される', async () => {
    const user = userEvent.setup();
    render(<PresetManagementModal {...defaultProps} />);

    // プリセット名を変更
    const nameInput = screen.getByTestId('preset-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'Modified');

    // 別のプリセットを選択
    const items = screen.getAllByTestId('preset-item');
    const customItem = items.find((item) =>
      item.textContent?.includes('Custom 1')
    )!;

    await user.click(customItem);

    await waitFor(() => {
      expect(screen.getByText('未保存の変更')).toBeInTheDocument();
    });

    // キャンセル
    const cancelButton = screen.getAllByTestId('cancel-button')[0];
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('未保存の変更')).not.toBeInTheDocument();
    });

    // 変更が保持されている
    expect(screen.getByTestId('preset-name-input')).toHaveValue('Modified');
  });

  it('モーダルが閉じている時は何も表示されない', () => {
    render(<PresetManagementModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('プリセット管理')).not.toBeInTheDocument();
  });
});
