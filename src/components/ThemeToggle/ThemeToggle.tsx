import type { Theme } from '@/types';
import styles from './ThemeToggle.module.css';

interface ThemeToggleProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
}

/**
 * テーマ切り替えコンポーネント
 * ライト/ダークモードを切り替えるトグルボタン
 */
export function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  const handleToggle = () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    onChange(newTheme);
  };

  const themeLabel = theme === 'dark' ? 'ダークモード' : 'ライトモード';

  return (
    <button
      className={styles.toggle}
      onClick={handleToggle}
      aria-label={`テーマを切り替える（現在: ${themeLabel}）`}
      data-theme={theme}
    >
      {themeLabel}
    </button>
  );
}
