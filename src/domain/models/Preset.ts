/**
 * プリセット関連のドメインロジック
 */

import type { Preset, PresetId } from '@/types';

/**
 * ユニークなプリセットIDを生成
 * @returns プリセットID
 */
export function generatePresetId(): PresetId {
  return `preset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * デフォルトプリセットかどうかを判定
 * @param id - プリセットID
 * @returns デフォルトプリセットの場合true
 */
export function isDefaultPreset(id: PresetId): boolean {
  return id.startsWith('default-');
}

/**
 * デフォルトプリセットを作成
 * @returns デフォルトプリセットの配列
 */
export function createDefaultPresets(): Preset[] {
  const now = Date.now();
  return [
    {
      id: 'default-standard',
      name: 'スタンダード',
      type: 'default',
      levelDuration: 600, // 10分
      breakConfig: {
        enabled: true,
        frequency: 4,
        duration: 600, // 10分
      },
      createdAt: now,
      updatedAt: now,
      blindLevels: [
        { smallBlind: 25, bigBlind: 50, ante: 50 },
        { smallBlind: 50, bigBlind: 100, ante: 100 },
        { smallBlind: 75, bigBlind: 150, ante: 150 },
        { smallBlind: 100, bigBlind: 200, ante: 200 },
        { smallBlind: 150, bigBlind: 300, ante: 300 },
        { smallBlind: 200, bigBlind: 400, ante: 400 },
        { smallBlind: 300, bigBlind: 600, ante: 600 },
        { smallBlind: 400, bigBlind: 800, ante: 800 },
        { smallBlind: 500, bigBlind: 1000, ante: 1000 },
        { smallBlind: 600, bigBlind: 1200, ante: 1200 },
        { smallBlind: 800, bigBlind: 1600, ante: 1600 },
        { smallBlind: 1000, bigBlind: 2000, ante: 2000 },
      ],
    },
    {
      id: 'default-turbo',
      name: 'ターボ',
      type: 'default',
      levelDuration: 300, // 5分
      breakConfig: {
        enabled: true,
        frequency: 6,
        duration: 300, // 5分
      },
      createdAt: now,
      updatedAt: now,
      blindLevels: [
        { smallBlind: 25, bigBlind: 50, ante: 50 },
        { smallBlind: 50, bigBlind: 100, ante: 100 },
        { smallBlind: 100, bigBlind: 200, ante: 200 },
        { smallBlind: 150, bigBlind: 300, ante: 300 },
        { smallBlind: 200, bigBlind: 400, ante: 400 },
        { smallBlind: 300, bigBlind: 600, ante: 600 },
        { smallBlind: 500, bigBlind: 1000, ante: 1000 },
        { smallBlind: 800, bigBlind: 1600, ante: 1600 },
        { smallBlind: 1000, bigBlind: 2000, ante: 2000 },
        { smallBlind: 1500, bigBlind: 3000, ante: 3000 },
        { smallBlind: 2000, bigBlind: 4000, ante: 4000 },
        { smallBlind: 3000, bigBlind: 6000, ante: 6000 },
      ],
    },
    {
      id: 'default-deepstack',
      name: 'ディープスタック',
      type: 'default',
      levelDuration: 900, // 15分
      breakConfig: {
        enabled: true,
        frequency: 4,
        duration: 900, // 15分
      },
      createdAt: now,
      updatedAt: now,
      blindLevels: [
        { smallBlind: 25, bigBlind: 50, ante: 50 },
        { smallBlind: 50, bigBlind: 100, ante: 100 },
        { smallBlind: 75, bigBlind: 150, ante: 150 },
        { smallBlind: 100, bigBlind: 200, ante: 200 },
        { smallBlind: 150, bigBlind: 300, ante: 300 },
        { smallBlind: 200, bigBlind: 400, ante: 400 },
        { smallBlind: 250, bigBlind: 500, ante: 500 },
        { smallBlind: 300, bigBlind: 600, ante: 600 },
        { smallBlind: 400, bigBlind: 800, ante: 800 },
        { smallBlind: 500, bigBlind: 1000, ante: 1000 },
        { smallBlind: 600, bigBlind: 1200, ante: 1200 },
        { smallBlind: 800, bigBlind: 1600, ante: 1600 },
        { smallBlind: 1000, bigBlind: 2000, ante: 2000 },
        { smallBlind: 1200, bigBlind: 2400, ante: 2400 },
        { smallBlind: 1500, bigBlind: 3000, ante: 3000 },
      ],
    },
  ];
}

/**
 * ユーザープリセットとデフォルトプリセットをマージ
 * @param userPresets - ユーザー定義プリセット
 * @returns マージされたプリセット配列
 */
export function mergeWithDefaultPresets(userPresets: Preset[]): Preset[] {
  const defaults = createDefaultPresets();
  const userPresetIds = new Set(userPresets.map((p) => p.id));

  // デフォルトプリセットのうち、ユーザープリセットに含まれていないものを追加
  return [...defaults.filter((d) => !userPresetIds.has(d.id)), ...userPresets];
}
