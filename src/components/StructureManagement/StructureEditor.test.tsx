import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StructureEditor } from './StructureEditor';
import type { Structure, StructureId } from '@/types';

const createTestStructure = (overrides?: Partial<Structure>): Structure => ({
  id: 'test_1' as StructureId,
  name: 'Test Structure',
  type: 'custom',
  blindLevels: [
    { smallBlind: 25, bigBlind: 50, ante: 0 },
    { smallBlind: 50, bigBlind: 100, ante: 0 },
  ],
  levelDuration: 600, // 10分 = 600秒
  breakConfig: {
    enabled: false,
    frequency: 4,
    duration: 10,
  },
  initialStack: 0, // 初期スタック（0 = 未設定）
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

describe('StructureEditor', () => {
  const defaultProps = {
    structure: createTestStructure(),
    onSave: vi.fn(),
    onUse: vi.fn(),
    isDirty: false,
  };

  it('structureがnullの場合、空の状態メッセージが表示される', () => {
    render(<StructureEditor {...defaultProps} structure={null} />);

    expect(
      screen.getByText('ストラクチャーを選択するか、新規作成してください')
    ).toBeInTheDocument();
  });

  it('ストラクチャー名が正しく表示される', () => {
    render(<StructureEditor {...defaultProps} />);

    const nameInput = screen.getByTestId('structure-name-input');
    expect(nameInput).toHaveValue('Test Structure');
  });

  it('ストラクチャー名を変更できる', async () => {
    const user = userEvent.setup();
    render(<StructureEditor {...defaultProps} />);

    const nameInput = screen.getByTestId('structure-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'New Name');

    expect(nameInput).toHaveValue('New Name');
  });

  it('ストラクチャー名が空の場合、エラーメッセージが表示される', async () => {
    const user = userEvent.setup();
    render(<StructureEditor {...defaultProps} />);

    const nameInput = screen.getByTestId('structure-name-input');
    await user.clear(nameInput);

    await waitFor(() => {
      expect(screen.getByTestId('name-error')).toHaveTextContent(
        'ストラクチャー名を入力してください'
      );
    });
  });

  it('ストラクチャー名が50文字を超える場合、エラーメッセージが表示される', async () => {
    const user = userEvent.setup();
    render(<StructureEditor {...defaultProps} />);

    const nameInput = screen.getByTestId('structure-name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'a'.repeat(51));

    await waitFor(() => {
      expect(screen.getByTestId('name-error')).toHaveTextContent(
        'ストラクチャー名は50文字以内で入力してください'
      );
    });
  });

  it('ブラインド構造が表示される', () => {
    render(<StructureEditor {...defaultProps} />);

    // BlindEditorが表示されていることを確認
    expect(screen.getByText('ブラインド構造')).toBeInTheDocument();
    expect(screen.getAllByTestId('blind-level-row')).toHaveLength(2);
  });

  it('レベル時間が分単位で表示される', () => {
    render(<StructureEditor {...defaultProps} />);

    const levelDurationInput = screen.getAllByTestId('number-input')[0];
    expect(levelDurationInput).toHaveValue(10); // 600秒 / 60 = 10分
  });

  it('レベル時間を変更すると秒単位で保存される', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <StructureEditor {...defaultProps} onSave={onSave} isDirty={true} />
    );

    const incrementButton = screen.getAllByTestId('increment-button')[0];
    await user.click(incrementButton);

    const saveButton = screen.getByTestId('save-button');
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          levelDuration: 660, // 11分 = 660秒
        })
      );
    });
  });

  it('休憩設定トグルが表示される', () => {
    render(<StructureEditor {...defaultProps} />);

    expect(screen.getByText('休憩を有効にする')).toBeInTheDocument();
  });

  it('休憩が無効な場合、休憩頻度・休憩時間が表示されない', () => {
    render(<StructureEditor {...defaultProps} />);

    expect(screen.queryByText('休憩頻度')).not.toBeInTheDocument();
    expect(screen.queryByText('休憩時間')).not.toBeInTheDocument();
  });

  it('休憩が有効な場合、休憩頻度・休憩時間が表示される', () => {
    const structure = createTestStructure({
      breakConfig: {
        enabled: true,
        frequency: 4,
        duration: 10,
      },
    });
    render(<StructureEditor {...defaultProps} structure={structure} />);

    expect(screen.getByText('休憩頻度')).toBeInTheDocument();
    expect(screen.getByText('休憩時間')).toBeInTheDocument();
  });

  it('保存ボタンはisDirtyがfalseの時に無効化される', () => {
    render(<StructureEditor {...defaultProps} isDirty={false} />);

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).toBeDisabled();
  });

  it('保存ボタンはisDirtyがtrueの時に有効化される', () => {
    render(<StructureEditor {...defaultProps} isDirty={true} />);

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).not.toBeDisabled();
  });

  it('保存ボタンクリックでonSaveが呼ばれる', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <StructureEditor {...defaultProps} onSave={onSave} isDirty={true} />
    );

    const saveButton = screen.getByTestId('save-button');
    await user.click(saveButton);

    expect(onSave).toHaveBeenCalled();
  });

  it('このストラクチャーを使うボタンクリックでonUseが呼ばれる', async () => {
    const user = userEvent.setup();
    const onUse = vi.fn();
    render(<StructureEditor {...defaultProps} onUse={onUse} />);

    const useButton = screen.getByTestId('use-button');
    await user.click(useButton);

    expect(onUse).toHaveBeenCalled();
  });

  it('ストラクチャー名が空の場合、保存ボタンが無効化される', async () => {
    const user = userEvent.setup();
    render(<StructureEditor {...defaultProps} isDirty={true} />);

    const nameInput = screen.getByTestId('structure-name-input');
    await user.clear(nameInput);

    await waitFor(() => {
      const saveButton = screen.getByTestId('save-button');
      expect(saveButton).toBeDisabled();
    });
  });

  it('ストラクチャー変更時に内部状態が更新される', () => {
    const { rerender } = render(<StructureEditor {...defaultProps} />);

    const newStructure = createTestStructure({ name: 'Updated Structure' });
    rerender(<StructureEditor {...defaultProps} structure={newStructure} />);

    const nameInput = screen.getByTestId('structure-name-input');
    expect(nameInput).toHaveValue('Updated Structure');
  });

  it('データ管理セクションが表示される', () => {
    render(<StructureEditor {...defaultProps} />);

    expect(screen.getByText('データ管理')).toBeInTheDocument();
    expect(screen.getByText('エクスポート')).toBeInTheDocument();
    expect(screen.getByText('インポート')).toBeInTheDocument();
  });

  it('休憩トグルをオンにすると休憩設定が表示される', async () => {
    const user = userEvent.setup();
    render(<StructureEditor {...defaultProps} />);

    const toggle = screen.getByTestId('toggle-switch');
    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByText('休憩頻度')).toBeInTheDocument();
      expect(screen.getByText('休憩時間')).toBeInTheDocument();
    });
  });

  it('初期スタック入力フィールドが表示される', () => {
    render(<StructureEditor {...defaultProps} />);

    expect(screen.getByText('初期スタック')).toBeInTheDocument();
    expect(
      screen.getByText('0の場合、アベレージスタックは表示されません')
    ).toBeInTheDocument();
  });

  it('初期スタックの値が正しく表示される', () => {
    const structure = createTestStructure({ initialStack: 30000 });
    render(<StructureEditor {...defaultProps} structure={structure} />);

    // NumberInputは2番目（レベル時間、初期スタックの順）
    const initialStackInput = screen.getAllByTestId('number-input')[1];
    expect(initialStackInput).toHaveValue(30000);
  });

  it('初期スタックを変更できる', async () => {
    const user = userEvent.setup();
    render(<StructureEditor {...defaultProps} />);

    // NumberInputは2番目
    const incrementButton = screen.getAllByTestId('increment-button')[1];
    await user.click(incrementButton);

    const initialStackInput = screen.getAllByTestId('number-input')[1];
    expect(initialStackInput).toHaveValue(1000); // step=1000
  });

  it('初期スタックの変更が保存される', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <StructureEditor {...defaultProps} onSave={onSave} isDirty={true} />
    );

    // NumberInputは2番目
    const incrementButton = screen.getAllByTestId('increment-button')[1];
    await user.click(incrementButton);

    const saveButton = screen.getByTestId('save-button');
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          initialStack: 1000,
        })
      );
    });
  });
});
