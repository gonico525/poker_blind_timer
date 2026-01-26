/**
 * 休憩関連のドメインロジック
 */

import type { BreakConfig } from '@/types';

/**
 * 休憩判定
 * @param currentLevel - 現在のレベル（0-indexed）
 * @param breakConfig - 休憩設定
 * @returns 休憩を取るべき場合true
 */
export function shouldTakeBreak(
  currentLevel: number,
  breakConfig: BreakConfig
): boolean {
  if (!breakConfig.enabled) return false;
  if (currentLevel === 0) return false; // 最初のレベル終了後は休憩なし

  // レベル番号は0-indexedだが、頻度は1-indexedで考える
  // currentLevel=3, frequency=4 → (3+1) % 4 === 0 → true (4レベル目で休憩)
  return (currentLevel + 1) % breakConfig.frequency === 0;
}

/**
 * 次の休憩までのレベル数を計算
 * @param currentLevel - 現在のレベル（0-indexed）
 * @param breakConfig - 休憩設定
 * @returns 次の休憩までのレベル数、休憩無効の場合null
 */
export function getLevelsUntilBreak(
  currentLevel: number,
  breakConfig: BreakConfig
): number | null {
  if (!breakConfig.enabled) return null;

  const { frequency } = breakConfig;
  // 次の休憩レベル = ceil((currentLevel + 1) / frequency) * frequency
  const nextBreakLevel = Math.ceil((currentLevel + 1) / frequency) * frequency;
  return nextBreakLevel - currentLevel;
}
