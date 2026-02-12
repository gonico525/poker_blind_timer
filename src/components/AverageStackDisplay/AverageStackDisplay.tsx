import React from 'react';
import { NumberInput } from '@/components/common/NumberInput';
import {
  calculateAverageStack,
  calculateAverageStackBB,
  canCalculateAverageStack,
} from '@/domain/models/AverageStack';
import { LIMITS } from '@/utils/constants';
import styles from './AverageStackDisplay.module.css';

export interface AverageStackDisplayProps {
  initialStack: number;
  totalPlayers: number;
  remainingPlayers: number;
  currentBigBlind: number;
  onPlayersChange: (totalPlayers: number, remainingPlayers: number) => void;
}

/**
 * アベレージスタック表示コンポーネント
 * プレイヤー数の管理と平均スタックの表示
 */
export const AverageStackDisplay: React.FC<AverageStackDisplayProps> = ({
  initialStack,
  totalPlayers,
  remainingPlayers,
  currentBigBlind,
  onPlayersChange,
}) => {
  // プレイヤー数が未設定の場合は非表示
  if (initialStack === 0) {
    return null;
  }

  const canCalculate = canCalculateAverageStack(
    initialStack,
    totalPlayers,
    remainingPlayers
  );

  const averageStack = canCalculate
    ? calculateAverageStack(initialStack, totalPlayers, remainingPlayers)
    : null;

  const averageStackBB =
    canCalculate && averageStack !== null
      ? calculateAverageStackBB(averageStack, currentBigBlind)
      : null;

  const handleTotalPlayersChange = (value: number) => {
    onPlayersChange(value, remainingPlayers);
  };

  const handleRemainingPlayersChange = (value: number) => {
    onPlayersChange(totalPlayers, value);
  };

  const handleDecrementRemaining = () => {
    if (remainingPlayers > 0) {
      onPlayersChange(totalPlayers, remainingPlayers - 1);
    }
  };

  return (
    <div
      className={styles.averageStackDisplay}
      data-testid="average-stack-display"
    >
      <div className={styles.inputSection}>
        <div className={styles.inputGroup}>
          <NumberInput
            label="Entries"
            value={totalPlayers}
            min={LIMITS.MIN_PLAYERS}
            max={LIMITS.MAX_PLAYERS}
            onChange={handleTotalPlayersChange}
            aria-label="Total players"
          />
        </div>

        <div className={styles.inputGroup}>
          <NumberInput
            label="Remaining"
            value={remainingPlayers}
            min={LIMITS.MIN_PLAYERS}
            max={totalPlayers}
            onChange={handleRemainingPlayersChange}
            aria-label="Remaining players"
          />
        </div>

        <button
          type="button"
          className={styles.decrementButton}
          onClick={handleDecrementRemaining}
          disabled={remainingPlayers <= 0}
          aria-label="残り人数を1減らす"
          data-testid="decrement-remaining-button"
        >
          −1
        </button>
      </div>

      {canCalculate && averageStack !== null && (
        <div className={styles.statsSection} data-testid="average-stack-stats">
          <div className={styles.label}>Avg Stack:</div>
          <div className={styles.value}>{averageStack.toLocaleString()}</div>
          {averageStackBB !== null && (
            <div className={styles.bbValue} data-testid="average-stack-bb">
              ({averageStackBB}BB)
            </div>
          )}
        </div>
      )}
    </div>
  );
};
