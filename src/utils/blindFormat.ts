/**
 * ブラインドフォーマット関数
 */

import type { BlindLevel } from '@/types';

/**
 * ブラインド金額をフォーマット（1000以上はK表記）
 * @param value - ブラインド金額
 * @returns フォーマットされた文字列
 */
export function formatBlindValue(value: number): string {
  if (value >= 1000) {
    return value % 1000 === 0
      ? `${value / 1000}K`
      : `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * ブラインドレベルをフォーマット（SB/BB (Ante)形式）
 * @param level - ブラインドレベル
 * @returns フォーマットされた文字列
 */
export function formatBlindLevel(level: BlindLevel): string {
  const sb = formatBlindValue(level.smallBlind);
  const bb = formatBlindValue(level.bigBlind);

  if (level.ante > 0) {
    const ante = formatBlindValue(level.ante);
    return `${sb}/${bb} (${ante})`;
  }
  return `${sb}/${bb}`;
}
