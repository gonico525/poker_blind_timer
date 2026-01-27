import React from 'react';
import { formatBlindValue } from '@/utils';
import type { BlindLevel } from '@/types';
import styles from './NextLevelInfo.module.css';

export interface NextLevelInfoProps {
  nextBlind: BlindLevel | undefined;
  levelsUntilBreak: number | null;
}

/**
 * 次レベル情報表示コンポーネント
 * 次のレベルのブラインド情報と休憩までのレベル数を表示
 */
export const NextLevelInfo: React.FC<NextLevelInfoProps> = ({
  nextBlind,
  levelsUntilBreak,
}) => {
  // 次のレベルがない場合（最後のレベル）
  if (!nextBlind) {
    return (
      <div className={styles.nextLevelInfo}>
        <div className={styles.lastLevel}>Last Level</div>
      </div>
    );
  }

  const { smallBlind, bigBlind, ante } = nextBlind;
  const hasBreakInfo = levelsUntilBreak !== null && levelsUntilBreak > 0;

  return (
    <div className={styles.nextLevelInfo}>
      <div className={styles.header}>
        <h3 className={styles.title}>Next Level</h3>
      </div>

      <div className={styles.blinds} data-testid="next-blinds">
        <span className={styles.blindValue}>
          {formatBlindValue(smallBlind)}
        </span>
        <span className={styles.separator}>/</span>
        <span className={styles.blindValue}>{formatBlindValue(bigBlind)}</span>
      </div>

      {ante > 0 && (
        <div className={styles.ante} data-testid="next-ante">
          Ante: {formatBlindValue(ante)}
        </div>
      )}

      {hasBreakInfo && (
        <div className={styles.breakInfo} data-testid="break-info">
          {levelsUntilBreak === 1
            ? `${levelsUntilBreak} level until break`
            : `${levelsUntilBreak} levels until break`}
        </div>
      )}
    </div>
  );
};
