/**
 * ストラクチャー関連のドメインロジック
 * ポーカートーナメントのブラインドストラクチャーを管理
 */

import type { Structure, StructureId } from '@/types';

/**
 * ユニークなストラクチャーIDを生成
 * @returns ストラクチャーID
 */
export function generateStructureId(): StructureId {
  return `structure-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * デフォルトストラクチャーかどうかを判定
 * @param id - ストラクチャーID
 * @returns デフォルトストラクチャーの場合true
 */
export function isDefaultStructure(id: StructureId): boolean {
  return id.startsWith('default-');
}

/**
 * デフォルトストラクチャーを作成
 * @returns デフォルトストラクチャーの配列
 */
export function createDefaultStructures(): Structure[] {
  const now = Date.now();
  return [
    {
      id: 'default-deepstack',
      name: 'Deepstack (30min/50k Start)',
      type: 'default',
      levelDuration: 1800, // 30分
      breakConfig: {
        enabled: true,
        frequency: 4,
        duration: 600, // 10分
      },
      initialStack: 50000,
      createdAt: now,
      updatedAt: now,
      blindLevels: [
        { smallBlind: 100, bigBlind: 200, ante: 200 },
        { smallBlind: 200, bigBlind: 300, ante: 300 },
        { smallBlind: 200, bigBlind: 400, ante: 400 },
        { smallBlind: 300, bigBlind: 500, ante: 500 },
        { smallBlind: 300, bigBlind: 600, ante: 600 },
        { smallBlind: 400, bigBlind: 800, ante: 800 },
        { smallBlind: 500, bigBlind: 1000, ante: 1000 },
        { smallBlind: 600, bigBlind: 1200, ante: 1200 },
        { smallBlind: 1000, bigBlind: 1500, ante: 1500 },
        { smallBlind: 1000, bigBlind: 2000, ante: 2000 },
        { smallBlind: 1500, bigBlind: 3000, ante: 3000 },
        { smallBlind: 2000, bigBlind: 4000, ante: 4000 },
        { smallBlind: 3000, bigBlind: 5000, ante: 5000 },
        { smallBlind: 3000, bigBlind: 6000, ante: 6000 },
        { smallBlind: 4000, bigBlind: 8000, ante: 8000 },
        { smallBlind: 5000, bigBlind: 10000, ante: 10000 },
        { smallBlind: 6000, bigBlind: 12000, ante: 12000 },
        { smallBlind: 10000, bigBlind: 15000, ante: 15000 },
        { smallBlind: 10000, bigBlind: 20000, ante: 20000 },
        { smallBlind: 15000, bigBlind: 30000, ante: 30000 },
        { smallBlind: 20000, bigBlind: 40000, ante: 40000 },
        { smallBlind: 30000, bigBlind: 60000, ante: 60000 },
        { smallBlind: 40000, bigBlind: 80000, ante: 80000 },
        { smallBlind: 50000, bigBlind: 100000, ante: 100000 },
      ],
    },
    {
      id: 'default-standard',
      name: 'Standard (20min/30k Start)',
      type: 'default',
      levelDuration: 1200, // 20分
      breakConfig: {
        enabled: true,
        frequency: 4,
        duration: 600, // 10分
      },
      initialStack: 30000,
      createdAt: now,
      updatedAt: now,
      blindLevels: [
        { smallBlind: 100, bigBlind: 200, ante: 200 },
        { smallBlind: 200, bigBlind: 400, ante: 400 },
        { smallBlind: 300, bigBlind: 600, ante: 600 },
        { smallBlind: 400, bigBlind: 800, ante: 800 },
        { smallBlind: 500, bigBlind: 1000, ante: 1000 },
        { smallBlind: 600, bigBlind: 1200, ante: 1200 },
        { smallBlind: 1000, bigBlind: 2000, ante: 2000 },
        { smallBlind: 1500, bigBlind: 3000, ante: 3000 },
        { smallBlind: 2000, bigBlind: 4000, ante: 4000 },
        { smallBlind: 3000, bigBlind: 6000, ante: 6000 },
        { smallBlind: 4000, bigBlind: 8000, ante: 8000 },
        { smallBlind: 5000, bigBlind: 10000, ante: 10000 },
        { smallBlind: 6000, bigBlind: 12000, ante: 12000 },
        { smallBlind: 10000, bigBlind: 20000, ante: 20000 },
        { smallBlind: 15000, bigBlind: 30000, ante: 30000 },
        { smallBlind: 20000, bigBlind: 40000, ante: 40000 },
        { smallBlind: 30000, bigBlind: 60000, ante: 60000 },
      ],
    },
    {
      id: 'default-turbo',
      name: 'Turbo (15min/25k Start)',
      type: 'default',
      levelDuration: 900, // 15分
      breakConfig: {
        enabled: true,
        frequency: 5,
        duration: 600, // 10分
      },
      initialStack: 25000,
      createdAt: now,
      updatedAt: now,
      blindLevels: [
        { smallBlind: 100, bigBlind: 200, ante: 200 },
        { smallBlind: 200, bigBlind: 400, ante: 400 },
        { smallBlind: 300, bigBlind: 600, ante: 600 },
        { smallBlind: 500, bigBlind: 1000, ante: 1000 },
        { smallBlind: 700, bigBlind: 1500, ante: 1500 },
        { smallBlind: 1000, bigBlind: 2000, ante: 2000 },
        { smallBlind: 1500, bigBlind: 3000, ante: 3000 },
        { smallBlind: 2000, bigBlind: 4000, ante: 4000 },
        { smallBlind: 3000, bigBlind: 6000, ante: 6000 },
        { smallBlind: 5000, bigBlind: 10000, ante: 10000 },
        { smallBlind: 7000, bigBlind: 15000, ante: 15000 },
        { smallBlind: 10000, bigBlind: 20000, ante: 20000 },
        { smallBlind: 15000, bigBlind: 30000, ante: 30000 },
        { smallBlind: 20000, bigBlind: 40000, ante: 40000 },
      ],
    },
    {
      id: 'default-hyperturbo',
      name: 'Hyper Turbo (10min/20k Start)',
      type: 'default',
      levelDuration: 600, // 10分
      breakConfig: {
        enabled: false,
        frequency: 6,
        duration: 300, // 5分
      },
      initialStack: 20000,
      createdAt: now,
      updatedAt: now,
      blindLevels: [
        { smallBlind: 100, bigBlind: 200, ante: 200 },
        { smallBlind: 200, bigBlind: 400, ante: 400 },
        { smallBlind: 400, bigBlind: 800, ante: 800 },
        { smallBlind: 600, bigBlind: 1200, ante: 1200 },
        { smallBlind: 1000, bigBlind: 2000, ante: 2000 },
        { smallBlind: 1500, bigBlind: 3000, ante: 3000 },
        { smallBlind: 2500, bigBlind: 5000, ante: 5000 },
        { smallBlind: 4000, bigBlind: 8000, ante: 8000 },
        { smallBlind: 6000, bigBlind: 12000, ante: 12000 },
        { smallBlind: 10000, bigBlind: 20000, ante: 20000 },
        { smallBlind: 15000, bigBlind: 30000, ante: 30000 },
        { smallBlind: 25000, bigBlind: 50000, ante: 50000 },
      ],
    },
  ];
}

/**
 * ユーザーストラクチャーとデフォルトストラクチャーをマージ
 * @param userStructures - ユーザー定義ストラクチャー
 * @returns マージされたストラクチャー配列
 */
export function mergeWithDefaultStructures(
  userStructures: Structure[]
): Structure[] {
  const defaults = createDefaultStructures();
  const userStructureIds = new Set(userStructures.map((s) => s.id));

  // デフォルトストラクチャーのうち、ユーザーストラクチャーに含まれていないものを追加
  return [
    ...defaults.filter((d) => !userStructureIds.has(d.id)),
    ...userStructures,
  ];
}
