import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PresetList } from './PresetList';
import type { Preset, PresetId } from '@/types';

// テスト用プリセット作成
const createTestPreset = (
  id: string,
  name: string,
  type: 'standard' | 'custom' = 'custom'
): Preset => ({
  id: id as PresetId,
  name,
  type,
  blindLevels: [
    { smallBlind: 25, bigBlind: 50, ante: 0 },
    { smallBlind: 50, bigBlind: 100, ante: 0 },
  ],
  levelDuration: 600,
  breakConfig: {
    enabled: false,
    frequency: 4,
    duration: 10,
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

describe('PresetList', () => {
  const defaultPreset = createTestPreset(
    'default-standard',
    'Standard',
    'standard'
  );
  const customPreset1 = createTestPreset('custom-1', 'Custom 1');
  const customPreset2 = createTestPreset('custom-2', 'Custom 2');

  const defaultProps = {
    presets: [defaultPreset, customPreset1, customPreset2],
    currentPresetId: defaultPreset.id,
    selectedPresetId: defaultPreset.id,
    onSelect: vi.fn(),
    onCreate: vi.fn(),
    onDelete: vi.fn(),
  };

  it('プリセット一覧が正しく表示される', () => {
    render(<PresetList {...defaultProps} />);

    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('Custom 1')).toBeInTheDocument();
    expect(screen.getByText('Custom 2')).toBeInTheDocument();
  });

  it('使用中プリセットに✓マークが表示される', () => {
    render(<PresetList {...defaultProps} />);

    const items = screen.getAllByTestId('preset-item');
    const standardItem = items.find((item) =>
      item.textContent?.includes('Standard')
    );

    expect(standardItem).toHaveTextContent('✓');
  });

  it('選択中プリセットがハイライトされる', () => {
    render(
      <PresetList {...defaultProps} selectedPresetId={customPreset1.id} />
    );

    const items = screen.getAllByTestId('preset-item');
    const customItem = items.find((item) =>
      item.textContent?.includes('Custom 1')
    );

    expect(customItem?.className).toContain('selected');
  });

  it('プリセットクリックでonSelectが呼ばれる', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PresetList {...defaultProps} onSelect={onSelect} />);

    const items = screen.getAllByTestId('preset-item');
    const customItem = items.find((item) =>
      item.textContent?.includes('Custom 1')
    )!;

    await user.click(customItem);

    expect(onSelect).toHaveBeenCalledWith(customPreset1.id);
  });

  it('デフォルトプリセットには削除ボタンが表示されない', () => {
    render(<PresetList {...defaultProps} />);

    const deleteButtons = screen.queryAllByTestId('delete-preset-button');

    // defaultPresetの削除ボタンは存在しないはず
    expect(deleteButtons).toHaveLength(2); // custom1とcustom2のみ
  });

  it('カスタムプリセットには削除ボタンが表示される', () => {
    render(<PresetList {...defaultProps} />);

    const deleteButtons = screen.getAllByTestId('delete-preset-button');

    expect(deleteButtons).toHaveLength(2);
    expect(deleteButtons[0]).toHaveAttribute('aria-label', 'Custom 1を削除');
    expect(deleteButtons[1]).toHaveAttribute('aria-label', 'Custom 2を削除');
  });

  it('削除ボタンクリックでonDeleteが呼ばれる', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<PresetList {...defaultProps} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByTestId('delete-preset-button');
    await user.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith(customPreset1.id);
  });

  it('削除ボタンクリック時にonSelectは呼ばれない', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    render(
      <PresetList {...defaultProps} onSelect={onSelect} onDelete={onDelete} />
    );

    const deleteButtons = screen.getAllByTestId('delete-preset-button');
    await user.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith(customPreset1.id);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('新規作成ボタンクリックでonCreateが呼ばれる', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(<PresetList {...defaultProps} onCreate={onCreate} />);

    const createButton = screen.getByTestId('create-preset-button');
    await user.click(createButton);

    expect(onCreate).toHaveBeenCalled();
  });

  it('Enterキーでプリセットを選択できる', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PresetList {...defaultProps} onSelect={onSelect} />);

    const items = screen.getAllByTestId('preset-item');
    const customItem = items.find((item) =>
      item.textContent?.includes('Custom 1')
    )!;

    customItem.focus();
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith(customPreset1.id);
  });

  it('Spaceキーでプリセットを選択できる', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PresetList {...defaultProps} onSelect={onSelect} />);

    const items = screen.getAllByTestId('preset-item');
    const customItem = items.find((item) =>
      item.textContent?.includes('Custom 1')
    )!;

    customItem.focus();
    await user.keyboard(' ');

    expect(onSelect).toHaveBeenCalledWith(customPreset1.id);
  });

  it('アクセシビリティ属性が正しく設定されている', () => {
    render(<PresetList {...defaultProps} />);

    const items = screen.getAllByTestId('preset-item');
    const standardItem = items.find((item) =>
      item.textContent?.includes('Standard')
    )!;

    expect(standardItem).toHaveAttribute('role', 'button');
    expect(standardItem).toHaveAttribute('tabIndex', '0');
    expect(standardItem).toHaveAttribute('aria-label', 'プリセット: Standard');
    expect(standardItem).toHaveAttribute('aria-current', 'true');
  });

  it('プリセットがない場合でも新規作成ボタンは表示される', () => {
    render(<PresetList {...defaultProps} presets={[]} />);

    expect(screen.getByTestId('create-preset-button')).toBeInTheDocument();
  });

  it('currentPresetIdがnullの場合、✓マークは表示されない', () => {
    render(<PresetList {...defaultProps} currentPresetId={null} />);

    const items = screen.getAllByTestId('preset-item');

    items.forEach((item) => {
      expect(item).not.toHaveTextContent('✓');
    });
  });

  it('selectedPresetIdがnullの場合、ハイライトされるアイテムはない', () => {
    render(<PresetList {...defaultProps} selectedPresetId={null} />);

    const items = screen.getAllByTestId('preset-item');

    items.forEach((item) => {
      expect(item).not.toHaveClass('selected');
    });
  });
});
