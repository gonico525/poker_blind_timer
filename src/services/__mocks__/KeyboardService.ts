/**
 * KeyboardService モック
 * テスト用のモック実装
 */

import { vi } from 'vitest';

export const KeyboardService = {
  initialize: vi.fn(),
  cleanup: vi.fn(),
  subscribe: vi.fn().mockReturnValue(vi.fn()), // unsubscribe関数を返す
};
