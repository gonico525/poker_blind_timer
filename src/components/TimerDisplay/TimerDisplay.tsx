import React from 'react';
import { formatTime } from '@/utils';
import type { TimerStatus } from '@/types';
import styles from './TimerDisplay.module.css';

export interface TimerDisplayProps {
  remainingTime: number;
  elapsedTime: number;
  status: TimerStatus;
  isOnBreak: boolean;
}

/**
 * タイマー表示コンポーネント
 * 残り時間と経過時間を表示し、状態に応じてスタイルを変更
 */
export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  remainingTime,
  elapsedTime,
  status,
  isOnBreak,
}) => {
  // 警告状態の判定
  const isWarning = remainingTime <= 60 && remainingTime > 30;
  const isCritical = remainingTime <= 30;

  // クラス名の組み立て
  const displayClasses = [
    styles.timerDisplay,
    styles[status], // idle, running, paused
    isWarning && styles.warning,
    isCritical && styles.critical,
    isOnBreak && styles.break,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={displayClasses}
      data-testid="timer-display"
      data-status={status}
      data-warning={isWarning ? 'true' : undefined}
      data-critical={isCritical ? 'true' : undefined}
    >
      {/* 休憩インジケーター */}
      {isOnBreak && (
        <div className={styles.breakIndicator} data-testid="break-indicator">
          BREAK
        </div>
      )}

      {/* 残り時間 */}
      <div className={styles.timerWrapper}>
        <div className={styles.label}>残り時間</div>
        <div
          className={styles.timer}
          data-testid="remaining-time"
          role="timer"
          aria-live="polite"
          aria-label={`残り時間 ${formatTime(remainingTime)}`}
        >
          {formatTime(remainingTime)}
        </div>
      </div>

      {/* 経過時間 */}
      <div className={styles.elapsedWrapper}>
        <div className={styles.elapsedLabel}>経過時間</div>
        <div className={styles.elapsed} data-testid="elapsed-time">
          {formatTime(elapsedTime)}
        </div>
      </div>

      {/* 状態インジケーター */}
      {status === 'paused' && (
        <div className={styles.pausedIndicator}>一時停止中</div>
      )}
    </div>
  );
};
