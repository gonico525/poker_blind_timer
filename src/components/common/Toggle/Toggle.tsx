import styles from './Toggle.module.css';

export interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

/**
 * Toggle コンポーネント
 * ON/OFF切り替えUI（音声ON/OFF、休憩有効/無効）
 */
export function Toggle({
  label,
  value,
  onChange,
  disabled = false,
  'aria-label': ariaLabel,
}: ToggleProps) {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(!value);
    }
  };

  const switchClassName = [
    styles.switch,
    value && styles.active,
    disabled && styles.disabled,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={styles.container}>
      <span className={styles.label}>{label}</span>
      <div
        className={switchClassName}
        role="switch"
        aria-checked={value}
        aria-label={ariaLabel || label}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        data-testid="toggle-switch"
      >
        <div className={styles.thumb} aria-hidden="true" />
      </div>
    </label>
  );
}
