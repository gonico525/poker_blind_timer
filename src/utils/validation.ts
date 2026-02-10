/**
 * バリデーション関数
 */

import type { BlindLevel, Structure, BreakConfig } from '@/types';
import { LIMITS } from './constants';

/**
 * ブラインドレベルのバリデーション
 * @param level - 検証対象
 * @returns 有効な場合true
 */
export function isValidBlindLevel(level: unknown): level is BlindLevel {
  if (typeof level !== 'object' || level === null) return false;
  const l = level as Record<string, unknown>;
  return (
    typeof l.smallBlind === 'number' &&
    l.smallBlind > 0 &&
    typeof l.bigBlind === 'number' &&
    l.bigBlind > 0 &&
    l.bigBlind >= l.smallBlind &&
    typeof l.ante === 'number' &&
    l.ante >= 0
  );
}

/**
 * ストラクチャーのバリデーション
 * @param structure - 検証対象
 * @returns 有効な場合true
 */
export function isValidStructure(structure: unknown): structure is Structure {
  if (typeof structure !== 'object' || structure === null) return false;
  const s = structure as Record<string, unknown>;
  const validTypes = ['default', 'standard', 'turbo', 'deepstack', 'custom'];
  return (
    typeof s.id === 'string' &&
    typeof s.name === 'string' &&
    typeof s.type === 'string' &&
    validTypes.includes(s.type) &&
    Array.isArray(s.blindLevels) &&
    s.blindLevels.every(isValidBlindLevel) &&
    typeof s.levelDuration === 'number' &&
    s.levelDuration > 0 &&
    isValidBreakConfig(s.breakConfig) &&
    typeof s.initialStack === 'number' &&
    s.initialStack >= 0
  );
}

/**
 * 休憩設定のバリデーション
 * @param config - 検証対象
 * @returns 有効な場合true
 */
export function isValidBreakConfig(config: unknown): config is BreakConfig {
  if (typeof config !== 'object' || config === null) return false;
  const c = config as Record<string, unknown>;
  return (
    typeof c.enabled === 'boolean' &&
    typeof c.frequency === 'number' &&
    c.frequency > 0 &&
    typeof c.duration === 'number' &&
    c.duration > 0
  );
}

/**
 * ストラクチャー名のバリデーション
 * @param name - ストラクチャー名
 * @returns バリデーション結果
 */
export function validateStructureName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (!name.trim()) {
    return { valid: false, error: 'ストラクチャー名を入力してください' };
  }
  if (name.length > 50) {
    return {
      valid: false,
      error: 'ストラクチャー名は50文字以内で入力してください',
    };
  }
  return { valid: true };
}

/**
 * 初期スタックのバリデーション
 * @param initialStack - 初期スタック
 * @returns バリデーション結果
 */
export function validateInitialStack(initialStack: number): {
  valid: boolean;
  error?: string;
} {
  if (initialStack < LIMITS.MIN_INITIAL_STACK) {
    return {
      valid: false,
      error: `初期スタックは${LIMITS.MIN_INITIAL_STACK}以上で入力してください`,
    };
  }
  if (initialStack > LIMITS.MAX_INITIAL_STACK) {
    return {
      valid: false,
      error: `初期スタックは${LIMITS.MAX_INITIAL_STACK.toLocaleString()}以下で入力してください`,
    };
  }
  return { valid: true };
}

/**
 * プレイヤー数のバリデーション
 * @param totalPlayers - 参加人数
 * @param remainingPlayers - 残り人数
 * @returns バリデーション結果
 */
export function validatePlayers(
  totalPlayers: number,
  remainingPlayers: number
): {
  valid: boolean;
  error?: string;
} {
  if (totalPlayers < LIMITS.MIN_PLAYERS) {
    return {
      valid: false,
      error: `参加人数は${LIMITS.MIN_PLAYERS}以上で入力してください`,
    };
  }
  if (totalPlayers > LIMITS.MAX_PLAYERS) {
    return {
      valid: false,
      error: `参加人数は${LIMITS.MAX_PLAYERS.toLocaleString()}以下で入力してください`,
    };
  }
  if (remainingPlayers < LIMITS.MIN_PLAYERS) {
    return {
      valid: false,
      error: `残り人数は${LIMITS.MIN_PLAYERS}以上で入力してください`,
    };
  }
  if (remainingPlayers > totalPlayers) {
    return {
      valid: false,
      error: '残り人数は参加人数以下で入力してください',
    };
  }
  return { valid: true };
}
