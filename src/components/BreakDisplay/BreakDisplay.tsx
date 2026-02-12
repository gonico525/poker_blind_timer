import React from 'react';
import { formatTime } from '@/utils';
import styles from './BreakDisplay.module.css';

export interface BreakDisplayProps {
  remainingTime: number;
  onSkip?: () => void;
}

/**
 * 休憩表示コンポーネント
 * 休憩時間とスキップボタンを表示
 */
export const BreakDisplay: React.FC<BreakDisplayProps> = ({
  remainingTime,
  onSkip,
}) => {
  return (
    <div className={styles.breakDisplay}>
      <div className={styles.breakHeader}>
        <h2 className={styles.breakTitle}>Break Time</h2>
        <p className={styles.breakMessage}>Take a break</p>
      </div>

      <div className={styles.breakTimer}>
        <div className={styles.breakLabel}>Remaining</div>
        <div
          className={styles.breakTime}
          data-testid="break-time"
          role="timer"
          aria-live="polite"
          aria-label={`Break remaining time ${formatTime(remainingTime)}`}
        >
          {formatTime(remainingTime)}
        </div>
      </div>

      {onSkip && (
        <button
          className={styles.skipButton}
          onClick={onSkip}
          aria-label="Skip break"
        >
          Skip Break
        </button>
      )}
    </div>
  );
};
