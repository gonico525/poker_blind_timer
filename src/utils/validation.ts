/**
 * バリデーション関数
 */

import type { BlindLevel, Preset, BreakConfig } from '@/types';

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
 * プリセットのバリデーション
 * @param preset - 検証対象
 * @returns 有効な場合true
 */
export function isValidPreset(preset: unknown): preset is Preset {
  if (typeof preset !== 'object' || preset === null) return false;
  const p = preset as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    typeof p.type === 'string' &&
    (p.type === 'default' || p.type === 'custom') &&
    Array.isArray(p.blindLevels) &&
    p.blindLevels.every(isValidBlindLevel) &&
    typeof p.levelDuration === 'number' &&
    p.levelDuration > 0 &&
    isValidBreakConfig(p.breakConfig)
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
 * プリセット名のバリデーション
 * @param name - プリセット名
 * @returns バリデーション結果
 */
export function validatePresetName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (!name.trim()) {
    return { valid: false, error: 'プリセット名を入力してください' };
  }
  if (name.length > 50) {
    return {
      valid: false,
      error: 'プリセット名は50文字以内で入力してください',
    };
  }
  return { valid: true };
}
