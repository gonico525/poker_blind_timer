import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StructureManagementModal } from './StructureManagementModal';
import type { Structure, StructureId } from '@/types';

// useStructuresのモック
const mockStructures: Structure[] = [
  {
    id: 'default-standard' as StructureId,
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
    id: 'custom-1' as StructureId,
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

const mockAddStructure = vi.fn();
const mockUpdateStructure = vi.fn();
const mockDeleteStructure = vi.fn();
const mockLoadStructure = vi.fn();

vi.mock('@/hooks/useStructures', () => ({
  useStructures: () => ({
    structures: mockStructures,
    currentStructureId: 'default-standard' as StructureId,
    addStructure: mockAddStructure,
    updateStructure: mockUpdateStructure,
    deleteStructure: mockDeleteStructure,
    loadStructure: mockLoadStructure,
  }),
}));

describe('StructureManagementModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentStructureId: 'default-standard' as StructureId,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddStructure.mockImplementation((structure) => ({
      ...structure,
      id: 'new_structure_id' as StructureId,
      type: 'custom',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  });

  it('モーダルが開いた時、currentStructureIdのストラクチャーが選択される', () => {
    render(<StructureManagementModal {...defaultProps} />);

    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByTestId('structure-name-input')).toHaveValue('Standard');
  });

  it('ストラクチャー選択時、右側に表示される', async () => {
    const user = userEvent.setup();
    render(<StructureManagementModal {...defaultProps} />);

    const items = screen.getAllByTestId('structure-item');
    const customItem = items.find((item) =>
      item.textContent?.includes('Custom 1')
    )!;

    await user.click(customItem);

    await waitFor(() => {
      expect(screen.getByTestId('structure-name-input')).toHaveValue(
        'Custom 1'
      );
    });
  });

  it('新規作成ボタンクリックで新しいストラクチャーが作成される', async () => {
    const user = userEvent.setup();
    render(<StructureManagementModal {...defaultProps} />);

    const createButton = screen.getByTestId('create-structure-button');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('structure-name-input')).toHaveValue(
        '新しいストラクチャー'
      );
    });
  });

  it('新規ストラクチャーを保存するとaddStructureが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<StructureManagementModal {...defaultProps} />);

    // 新規作成
    const createButton = screen.getByTestId('create-structure-button');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId('structure-name-input')).toHaveValue(
        '新しいストラクチャー'
      );
    });

    // ストラクチャー名を変更
    const nameInput = screen.getByTestId('structure-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'My New Structure');

    // 保存
    const saveButton = screen.getByTestId('save-button');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockAddStructure).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My New Structure',
        })
      );
    });
  });

  it('既存ストラクチャーを編集して保存するとupdateStructureが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<StructureManagementModal {...defaultProps} />);

    // ストラクチャー名を変更
    const nameInput = screen.getByTestId('structure-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Standard');

    await waitFor(() => {
      const saveButton = screen.getByTestId('save-button');
      expect(saveButton).not.toBeDisabled();
    });

    const saveButton = screen.getByTestId('save-button');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateStructure).toHaveBeenCalledWith(
        'default-standard',
        expect.objectContaining({
          name: 'Updated Standard',
        })
      );
    });
  });

  it('このストラクチャーを使うボタンクリックでloadStructureが呼ばれる', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<StructureManagementModal {...defaultProps} onClose={onClose} />);

    const useButton = screen.getByTestId('use-button');
    await user.click(useButton);

    expect(mockLoadStructure).toHaveBeenCalledWith('default-standard');
    expect(onClose).toHaveBeenCalled();
  });

  it('削除ボタンクリックで確認ダイアログが表示される', async () => {
    const user = userEvent.setup();
    render(<StructureManagementModal {...defaultProps} />);

    const deleteButtons = screen.getAllByTestId('delete-structure-button');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('ストラクチャーを削除')).toBeInTheDocument();
      expect(
        screen.getByText(
          /「Custom 1」を削除しますか？この操作は取り消せません。/
        )
      ).toBeInTheDocument();
    });
  });

  it('削除確認でdeleteStructureが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<StructureManagementModal {...defaultProps} />);

    const deleteButtons = screen.getAllByTestId('delete-structure-button');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('ストラクチャーを削除')).toBeInTheDocument();
    });

    const confirmButton = screen.getByTestId('confirm-button');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteStructure).toHaveBeenCalledWith('custom-1');
    });
  });

  it('削除キャンセルでダイアログが閉じる', async () => {
    const user = userEvent.setup();
    render(<StructureManagementModal {...defaultProps} />);

    const deleteButtons = screen.getAllByTestId('delete-structure-button');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('ストラクチャーを削除')).toBeInTheDocument();
    });

    const cancelButton = screen.getByTestId('cancel-button');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByText('ストラクチャーを削除')
      ).not.toBeInTheDocument();
    });

    expect(mockDeleteStructure).not.toHaveBeenCalled();
  });

  it('未保存の変更がある時、別ストラクチャー選択で警告ダイアログが表示される', async () => {
    const user = userEvent.setup();
    render(<StructureManagementModal {...defaultProps} />);

    // ストラクチャー名を変更（未保存）
    const nameInput = screen.getByTestId('structure-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'Modified');

    // 別のストラクチャーを選択
    const items = screen.getAllByTestId('structure-item');
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
    render(<StructureManagementModal {...defaultProps} />);

    // ストラクチャー名を変更（未保存）
    const nameInput = screen.getByTestId('structure-name-input');
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
    render(<StructureManagementModal {...defaultProps} />);

    // ストラクチャー名を変更
    const nameInput = screen.getByTestId('structure-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'Modified');

    // 別のストラクチャーを選択
    const items = screen.getAllByTestId('structure-item');
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
      expect(screen.getByTestId('structure-name-input')).toHaveValue(
        'Custom 1'
      );
    });
  });

  it('未保存警告で「キャンセル」を選択すると変更が保持される', async () => {
    const user = userEvent.setup();
    render(<StructureManagementModal {...defaultProps} />);

    // ストラクチャー名を変更
    const nameInput = screen.getByTestId('structure-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'Modified');

    // 別のストラクチャーを選択
    const items = screen.getAllByTestId('structure-item');
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
    expect(screen.getByTestId('structure-name-input')).toHaveValue('Modified');
  });

  it('モーダルが閉じている時は何も表示されない', () => {
    render(<StructureManagementModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('ストラクチャー管理')).not.toBeInTheDocument();
  });
});
