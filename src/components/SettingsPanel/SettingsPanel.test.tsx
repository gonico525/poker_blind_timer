import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsPanel } from './SettingsPanel';

describe('SettingsPanel', () => {
  it('should render settings panel', () => {
    render(<SettingsPanel />);

    expect(
      screen.getByRole('heading', { name: /設定|settings/i })
    ).toBeInTheDocument();
  });

  it('should display placeholder content', () => {
    render(<SettingsPanel />);

    expect(screen.getByText(/設定パネル/i)).toBeInTheDocument();
  });

  it('should have proper structure', () => {
    render(<SettingsPanel />);

    const panel = screen.getByTestId('settings-panel');
    expect(panel).toBeInTheDocument();
    // CSS Modulesはハッシュ付きクラス名を生成するため、クラス名に'panel'が含まれることを確認
    expect(panel.className).toMatch(/panel/);
  });
});
