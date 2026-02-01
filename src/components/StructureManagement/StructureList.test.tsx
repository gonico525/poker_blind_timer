import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StructureList } from './StructureList';
import type { Structure, StructureId } from '@/types';

// テスト用ストラクチャー作成
const createTestStructure = (
  id: string,
  name: string,
  type: 'standard' | 'custom' = 'custom'
): Structure => ({
  id: id as StructureId,
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

describe('StructureList', () => {
  const defaultStructure = createTestStructure(
    'default-standard',
    'Standard',
    'standard'
  );
  const customStructure1 = createTestStructure('custom-1', 'Custom 1');
  const customStructure2 = createTestStructure('custom-2', 'Custom 2');

  const defaultProps = {
    structures: [defaultStructure, customStructure1, customStructure2],
    currentStructureId: defaultStructure.id,
    selectedStructureId: defaultStructure.id,
    onSelect: vi.fn(),
    onCreate: vi.fn(),
    onDelete: vi.fn(),
  };

  it('ストラクチャー一覧が正しく表示される', () => {
    render(<StructureList {...defaultProps} />);

    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('Custom 1')).toBeInTheDocument();
    expect(screen.getByText('Custom 2')).toBeInTheDocument();
  });

  it('使用中ストラクチャーに✓マークが表示される', () => {
    render(<StructureList {...defaultProps} />);

    const items = screen.getAllByTestId('structure-item');
    const standardItem = items.find((item) =>
      item.textContent?.includes('Standard')
    );

    expect(standardItem).toHaveTextContent('✓');
  });

  it('選択中ストラクチャーがハイライトされる', () => {
    render(
      <StructureList
        {...defaultProps}
        selectedStructureId={customStructure1.id}
      />
    );

    const items = screen.getAllByTestId('structure-item');
    const customItem = items.find((item) =>
      item.textContent?.includes('Custom 1')
    );

    expect(customItem?.className).toContain('selected');
  });

  it('ストラクチャークリックでonSelectが呼ばれる', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<StructureList {...defaultProps} onSelect={onSelect} />);

    const items = screen.getAllByTestId('structure-item');
    const customItem = items.find((item) =>
      item.textContent?.includes('Custom 1')
    )!;

    await user.click(customItem);

    expect(onSelect).toHaveBeenCalledWith(customStructure1.id);
  });

  it('デフォルトストラクチャーには削除ボタンが表示されない', () => {
    render(<StructureList {...defaultProps} />);

    const deleteButtons = screen.queryAllByTestId('delete-structure-button');

    // defaultStructureの削除ボタンは存在しないはず
    expect(deleteButtons).toHaveLength(2); // custom1とcustom2のみ
  });

  it('カスタムストラクチャーには削除ボタンが表示される', () => {
    render(<StructureList {...defaultProps} />);

    const deleteButtons = screen.getAllByTestId('delete-structure-button');

    expect(deleteButtons).toHaveLength(2);
    expect(deleteButtons[0]).toHaveAttribute('aria-label', 'Custom 1を削除');
    expect(deleteButtons[1]).toHaveAttribute('aria-label', 'Custom 2を削除');
  });

  it('削除ボタンクリックでonDeleteが呼ばれる', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<StructureList {...defaultProps} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByTestId('delete-structure-button');
    await user.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith(customStructure1.id);
  });

  it('削除ボタンクリック時にonSelectは呼ばれない', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    render(
      <StructureList
        {...defaultProps}
        onSelect={onSelect}
        onDelete={onDelete}
      />
    );

    const deleteButtons = screen.getAllByTestId('delete-structure-button');
    await user.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith(customStructure1.id);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('新規作成ボタンクリックでonCreateが呼ばれる', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(<StructureList {...defaultProps} onCreate={onCreate} />);

    const createButton = screen.getByTestId('create-structure-button');
    await user.click(createButton);

    expect(onCreate).toHaveBeenCalled();
  });

  it('Enterキーでストラクチャーを選択できる', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<StructureList {...defaultProps} onSelect={onSelect} />);

    const items = screen.getAllByTestId('structure-item');
    const customItem = items.find((item) =>
      item.textContent?.includes('Custom 1')
    )!;

    customItem.focus();
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith(customStructure1.id);
  });

  it('Spaceキーでストラクチャーを選択できる', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<StructureList {...defaultProps} onSelect={onSelect} />);

    const items = screen.getAllByTestId('structure-item');
    const customItem = items.find((item) =>
      item.textContent?.includes('Custom 1')
    )!;

    customItem.focus();
    await user.keyboard(' ');

    expect(onSelect).toHaveBeenCalledWith(customStructure1.id);
  });

  it('アクセシビリティ属性が正しく設定されている', () => {
    render(<StructureList {...defaultProps} />);

    const items = screen.getAllByTestId('structure-item');
    const standardItem = items.find((item) =>
      item.textContent?.includes('Standard')
    )!;

    expect(standardItem).toHaveAttribute('role', 'button');
    expect(standardItem).toHaveAttribute('tabIndex', '0');
    expect(standardItem).toHaveAttribute(
      'aria-label',
      'ストラクチャー: Standard'
    );
    expect(standardItem).toHaveAttribute('aria-current', 'true');
  });

  it('ストラクチャーがない場合でも新規作成ボタンは表示される', () => {
    render(<StructureList {...defaultProps} structures={[]} />);

    expect(screen.getByTestId('create-structure-button')).toBeInTheDocument();
  });

  it('currentStructureIdがnullの場合、✓マークは表示されない', () => {
    render(<StructureList {...defaultProps} currentStructureId={null} />);

    const items = screen.getAllByTestId('structure-item');

    items.forEach((item) => {
      expect(item).not.toHaveTextContent('✓');
    });
  });

  it('selectedStructureIdがnullの場合、ハイライトされるアイテムはない', () => {
    render(<StructureList {...defaultProps} selectedStructureId={null} />);

    const items = screen.getAllByTestId('structure-item');

    items.forEach((item) => {
      expect(item).not.toHaveClass('selected');
    });
  });
});
