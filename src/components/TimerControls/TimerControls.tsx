import React from 'react';
import type { TimerStatus } from '@/types';
import styles from './TimerControls.module.css';

export interface TimerControlsProps {
  status: TimerStatus;
  isOnBreak: boolean;
  hasNextLevel: boolean;
  hasPrevLevel: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onNextLevel: () => void;
  onPrevLevel: () => void;
  onSkipBreak: () => void;
}

/**
 * タイマー操作コントロールコンポーネント
 * 開始/停止/リセットボタン、レベル遷移ボタン、休憩スキップボタンを提供
 */
export const TimerControls: React.FC<TimerControlsProps> = ({
  status,
  isOnBreak,
  hasNextLevel,
  hasPrevLevel,
  onStart,
  onPause,
  onReset,
  onNextLevel,
  onPrevLevel,
  onSkipBreak,
}) => {
  // 開始/一時停止/再開ボタンのラベルとハンドラ
  const getMainButtonProps = () => {
    switch (status) {
      case 'idle':
        return { label: 'Start', handler: onStart, className: styles.primary };
      case 'running':
        return {
          label: 'Pause',
          handler: onPause,
          className: styles.warning,
        };
      case 'paused':
        return {
          label: 'Resume',
          handler: onStart,
          className: styles.success,
        };
    }
  };

  const mainButton = getMainButtonProps();

  return (
    <div className={styles.controls}>
      {/* メイン操作ボタン */}
      <div className={styles.mainButtons}>
        <button
          className={`${styles.button} ${mainButton.className}`}
          onClick={mainButton.handler}
          aria-label={mainButton.label}
        >
          {mainButton.label}
        </button>

        <button
          className={`${styles.button} ${styles.secondary}`}
          onClick={onReset}
          aria-label="Reset"
        >
          Reset
        </button>
      </div>

      {/* レベル操作ボタン */}
      <div className={styles.levelButtons}>
        <button
          className={`${styles.button} ${styles.secondary}`}
          onClick={onPrevLevel}
          disabled={!hasPrevLevel || isOnBreak}
          aria-label="Previous level"
        >
          ← Previous
        </button>

        <button
          className={`${styles.button} ${styles.secondary}`}
          onClick={onNextLevel}
          disabled={!hasNextLevel || isOnBreak}
          aria-label="Next level"
        >
          Next →
        </button>
      </div>

      {/* 休憩スキップボタン */}
      {isOnBreak && (
        <div className={styles.breakButtons}>
          <button
            className={`${styles.button} ${styles.accent}`}
            onClick={onSkipBreak}
            aria-label="Skip break"
          >
            Skip Break
          </button>
        </div>
      )}
    </div>
  );
};
