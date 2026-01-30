import styles from './Slider.module.css';

export interface SliderProps {
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  showValue?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
}

/**
 * Slider コンポーネント
 * 音量調整スライダー
 */
export function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  showValue = true,
  disabled = false,
  'aria-label': ariaLabel,
}: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.sliderContainer}>
        <input
          type="range"
          className={styles.slider}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-label={ariaLabel || label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          data-testid="slider-input"
          style={
            {
              '--slider-percentage': `${percentage}%`,
            } as React.CSSProperties
          }
        />
        {showValue && (
          <span className={styles.value} data-testid="slider-value">
            {Math.round(value)}
          </span>
        )}
      </div>
    </div>
  );
}
