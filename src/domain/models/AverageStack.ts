/**
 * アベレージスタック（平均チップ数）計算ロジック
 */

/**
 * アベレージスタック（平均チップ数）を計算する
 *
 * @param initialStack - 初期スタック（チップ数）
 * @param totalPlayers - 参加人数
 * @param remainingPlayers - 残り人数
 * @returns 平均チップ数（整数）。計算不可の場合は null
 */
export function calculateAverageStack(
  initialStack: number,
  totalPlayers: number,
  remainingPlayers: number
): number | null {
  if (!canCalculateAverageStack(initialStack, totalPlayers, remainingPlayers)) {
    return null;
  }

  const totalChips = initialStack * totalPlayers;
  const averageStack = totalChips / remainingPlayers;

  return Math.round(averageStack);
}

/**
 * アベレージスタックのBB（ビッグブラインド）換算値を計算する
 *
 * @param averageStack - 平均チップ数
 * @param bigBlind - 現在のビッグブラインド
 * @returns BB換算値（小数第1位まで）。計算不可の場合は null
 */
export function calculateAverageStackBB(
  averageStack: number,
  bigBlind: number
): number | null {
  if (averageStack <= 0 || bigBlind <= 0) {
    return null;
  }

  const averageStackBB = averageStack / bigBlind;

  // 小数第1位まで表示
  return Math.round(averageStackBB * 10) / 10;
}

/**
 * アベレージスタックが計算可能かどうかを判定する
 *
 * @param initialStack - 初期スタック（チップ数）
 * @param totalPlayers - 参加人数
 * @param remainingPlayers - 残り人数
 * @returns 計算可能な場合は true
 */
export function canCalculateAverageStack(
  initialStack: number,
  totalPlayers: number,
  remainingPlayers: number
): boolean {
  return initialStack > 0 && totalPlayers > 0 && remainingPlayers > 0;
}
