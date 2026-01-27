import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PresetManager } from './PresetManager';
import type { Preset } from '@/types';

describe('PresetManager', () => {
  const mockPresets: Preset[] = [
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
      name: 'My Preset',
      type: 'custom',
      blindLevels: [],
      levelDuration: 600,
      breakConfig: { enabled: false, frequency: 4, duration: 600 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  it('should display preset list', () => {
    render(<PresetManager presets={mockPresets} />);

    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('My Preset')).toBeInTheDocument();
  });

  it('should highlight current preset', () => {
    render(<PresetManager presets={mockPresets} currentPresetId="custom-1" />);

    const customItem = screen
      .getByText('My Preset')
      .closest('[data-testid="preset-item"]');
    // CSS Modulesはハッシュ付きクラス名を生成するため、クラス名に'selected'が含まれることを確認
    expect(customItem?.className).toMatch(/selected/);
  });

  it('should call onLoad when preset is clicked', async () => {
    const onLoad = vi.fn();
    render(<PresetManager presets={mockPresets} onLoad={onLoad} />);

    await userEvent.click(screen.getByText('My Preset'));
    expect(onLoad).toHaveBeenCalledWith('custom-1');
  });

  it('should show edit/delete buttons only for custom presets', () => {
    render(<PresetManager presets={mockPresets} />);

    const standardItem = screen
      .getByText('Standard')
      .closest('[data-testid="preset-item"]');
    const customItem = screen
      .getByText('My Preset')
      .closest('[data-testid="preset-item"]');

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

  it('should show default badge for default presets', () => {
    render(<PresetManager presets={mockPresets} />);

    const standardItem = screen
      .getByText('Standard')
      .closest('[data-testid="preset-item"]');
    expect(standardItem?.textContent).toMatch(/デフォルト/);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn();
    render(<PresetManager presets={mockPresets} onDelete={onDelete} />);

    const customItem = screen
      .getByText('My Preset')
      .closest('[data-testid="preset-item"]');
    const deleteButton = customItem?.querySelector(
      '[data-testid="delete-button"]'
    ) as HTMLElement;

    await userEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith('custom-1');
  });

  it('should call onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn();
    render(<PresetManager presets={mockPresets} onEdit={onEdit} />);

    const customItem = screen
      .getByText('My Preset')
      .closest('[data-testid="preset-item"]');
    const editButton = customItem?.querySelector(
      '[data-testid="edit-button"]'
    ) as HTMLElement;

    await userEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledWith('custom-1');
  });
});
