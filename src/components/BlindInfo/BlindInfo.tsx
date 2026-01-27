import React from 'react';
import { formatBlindValue } from '@/utils';
import type { BlindLevel } from '@/types';
import styles from './BlindInfo.module.css';

export interface BlindInfoProps {
  level: number;
  blindLevel: BlindLevel;
}

/**
 * ブラインド情報表示コンポーネント
 * 現在のレベル番号とブラインド金額（SB/BB/Ante）を表示
 */
export const BlindInfo: React.FC<BlindInfoProps> = ({ level, blindLevel }) => {
  const { smallBlind, bigBlind, ante } = blindLevel;

  return (
    <div className={styles.blindInfo}>
      {/* レベル番号 */}
      <div className={styles.levelNumber} data-testid="level-number">
        Level {level + 1}
      </div>

      {/* ブラインド情報 */}
      <div className={styles.blindsWrapper}>
        <div className={styles.blinds} data-testid="blinds">
          <span className={styles.blindValue}>
            {formatBlindValue(smallBlind)}
          </span>
          <span className={styles.separator}>/</span>
          <span className={styles.blindValue}>
            {formatBlindValue(bigBlind)}
          </span>
        </div>

        <div className={styles.blindLabels}>
          <span className={styles.blindLabel}>SB</span>
          <span className={styles.separator}>/</span>
          <span className={styles.blindLabel}>BB</span>
        </div>
      </div>

      {/* アンティ情報 */}
      {ante > 0 && (
        <div className={styles.ante} data-testid="ante">
          Ante: {formatBlindValue(ante)}
        </div>
      )}
    </div>
  );
};
