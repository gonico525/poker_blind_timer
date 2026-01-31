/**
 * バリデーション関数
 */

import type { BlindLevel, Structure, BreakConfig } from '@/types';

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
    isValidBreakConfig(s.breakConfig)
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
