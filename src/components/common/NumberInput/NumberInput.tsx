import { useState, useEffect } from 'react';
import styles from './NumberInput.module.css';

export interface NumberInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

/**
 * NumberInput コンポーネント
 * 数値入力UI（レベル時間、休憩頻度、休憩時間）
 */
export function NumberInput({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit,
  disabled = false,
  'aria-label': ariaLabel,
}: NumberInputProps) {
  const [inputValue, setInputValue] = useState(String(value));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const validateValue = (numValue: number): boolean => {
    if (isNaN(numValue)) {
      setError('数値を入力してください');
      return false;
    }

    if (min !== undefined && numValue < min) {
      setError(`最小値は${min}です`);
      return false;
    }

    if (max !== undefined && numValue > max) {
      setError(`最大値は${max}です`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const numValue = parseFloat(newValue);
    if (validateValue(numValue)) {
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    const numValue = parseFloat(inputValue);

    if (isNaN(numValue)) {
      setInputValue(String(value));
      setError(null);
      return;
    }

    // Clamp value to min/max
    let clampedValue = numValue;
    if (min !== undefined && clampedValue < min) {
      clampedValue = min;
    }
    if (max !== undefined && clampedValue > max) {
      clampedValue = max;
    }

    if (clampedValue !== numValue) {
      setInputValue(String(clampedValue));
      onChange(clampedValue);
    }

    setError(null);
  };

  const handleIncrement = () => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue)) return;

    const newValue = numValue + step;
    if (max === undefined || newValue <= max) {
      setInputValue(String(newValue));
      onChange(newValue);
      setError(null);
    }
  };

  const handleDecrement = () => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue)) return;

    const newValue = numValue - step;
    if (min === undefined || newValue >= min) {
      setInputValue(String(newValue));
      onChange(newValue);
      setError(null);
    }
  };

  const inputClassName = [styles.input, error && styles.error]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.container}>
      <label className={styles.label} htmlFor={`number-input-${label}`}>
        {label}
      </label>
      <div className={styles.inputGroup}>
        <input
          id={`number-input-${label}`}
          type="number"
          className={inputClassName}
          value={inputValue}
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          aria-label={ariaLabel || label}
          aria-invalid={!!error}
          aria-describedby={error ? `number-input-error-${label}` : undefined}
          data-testid="number-input"
        />
        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.incrementButton}
            onClick={handleIncrement}
            disabled={
              disabled || (max !== undefined && parseFloat(inputValue) >= max)
            }
            aria-label="増やす"
            data-testid="increment-button"
          >
            ▲
          </button>
          <button
            type="button"
            className={styles.decrementButton}
            onClick={handleDecrement}
            disabled={
              disabled || (min !== undefined && parseFloat(inputValue) <= min)
            }
            aria-label="減らす"
            data-testid="decrement-button"
          >
            ▼
          </button>
        </div>
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      {error && (
        <span
          className={styles.errorMessage}
          id={`number-input-error-${label}`}
          role="alert"
          data-testid="error-message"
        >
          {error}
        </span>
      )}
    </div>
  );
}
