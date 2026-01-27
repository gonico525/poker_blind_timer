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
        <p className={styles.breakMessage}>休憩中です</p>
      </div>

      <div className={styles.breakTimer}>
        <div className={styles.breakLabel}>残り時間</div>
        <div
          className={styles.breakTime}
          data-testid="break-time"
          role="timer"
          aria-live="polite"
          aria-label={`休憩残り時間 ${formatTime(remainingTime)}`}
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
