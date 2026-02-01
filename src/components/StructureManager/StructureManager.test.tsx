import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StructureManager } from './StructureManager';
import type { Structure } from '@/types';

describe('StructureManager', () => {
  const mockStructures: Structure[] = [
    {
      id: 'default-standard',
      name: 'Standard',
      type: 'standard',
      blindLevels: [],
      levelDuration: 900,
      breakConfig: { enabled: true, frequency: 4, duration: 600 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'custom-1',
      name: 'My Structure',
      type: 'custom',
      blindLevels: [],
      levelDuration: 600,
      breakConfig: { enabled: false, frequency: 4, duration: 600 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  it('should display structure list', () => {
    render(<StructureManager structures={mockStructures} />);

    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('My Structure')).toBeInTheDocument();
  });

  it('should highlight current structure', () => {
    render(
      <StructureManager
        structures={mockStructures}
        currentStructureId="custom-1"
      />
    );

    const customItem = screen
      .getByText('My Structure')
      .closest('[data-testid="structure-item"]');
    // CSS Modulesはハッシュ付きクラス名を生成するため、クラス名に'selected'が含まれることを確認
    expect(customItem?.className).toMatch(/selected/);
  });

  it('should call onLoad when structure is clicked', async () => {
    const onLoad = vi.fn();
    render(<StructureManager structures={mockStructures} onLoad={onLoad} />);

    await userEvent.click(screen.getByText('My Structure'));
    expect(onLoad).toHaveBeenCalledWith('custom-1');
  });

  it('should show edit/delete buttons only for custom structures', () => {
    render(<StructureManager structures={mockStructures} />);

    const standardItem = screen
      .getByText('Standard')
      .closest('[data-testid="structure-item"]');
    const customItem = screen
      .getByText('My Structure')
      .closest('[data-testid="structure-item"]');

    expect(
      standardItem?.querySelector('[data-testid="edit-button"]')
    ).not.toBeInTheDocument();
    expect(
      standardItem?.querySelector('[data-testid="delete-button"]')
    ).not.toBeInTheDocument();

    expect(
      customItem?.querySelector('[data-testid="edit-button"]')
    ).toBeInTheDocument();
    expect(
      customItem?.querySelector('[data-testid="delete-button"]')
    ).toBeInTheDocument();
  });

  it('should show default badge for default structures', () => {
    render(<StructureManager structures={mockStructures} />);

    const standardItem = screen
      .getByText('Standard')
      .closest('[data-testid="structure-item"]');
    expect(standardItem?.textContent).toMatch(/デフォルト/);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn();
    render(
      <StructureManager structures={mockStructures} onDelete={onDelete} />
    );

    const customItem = screen
      .getByText('My Structure')
      .closest('[data-testid="structure-item"]');
    const deleteButton = customItem?.querySelector(
      '[data-testid="delete-button"]'
    ) as HTMLElement;

    await userEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith('custom-1');
  });

  it('should call onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn();
    render(<StructureManager structures={mockStructures} onEdit={onEdit} />);

    const customItem = screen
      .getByText('My Structure')
      .closest('[data-testid="structure-item"]');
    const editButton = customItem?.querySelector(
      '[data-testid="edit-button"]'
    ) as HTMLElement;

    await userEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledWith('custom-1');
  });
});
