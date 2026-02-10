/**
 * AverageStack ドメインモデルのユニットテスト
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAverageStack,
  calculateAverageStackBB,
  canCalculateAverageStack,
} from './AverageStack';

describe('AverageStack', () => {
  describe('calculateAverageStack', () => {
    it('正しく平均チップ数を計算する', () => {
      expect(calculateAverageStack(30000, 10, 10)).toBe(30000);
      expect(calculateAverageStack(30000, 10, 5)).toBe(60000);
      expect(calculateAverageStack(30000, 10, 2)).toBe(150000);
      expect(calculateAverageStack(50000, 8, 4)).toBe(100000);
    });

    it('リバイを含む計算が正しく行われる', () => {
      // リバイ1回（totalPlayers が 11 になる）
      expect(calculateAverageStack(30000, 11, 10)).toBe(33000);
    });

    it('端数が正しく丸められる', () => {
      // 30000 * 10 / 3 = 100000
      expect(calculateAverageStack(30000, 10, 3)).toBe(100000);
      // 25000 * 7 / 3 = 58333.333... → 58333
      expect(calculateAverageStack(25000, 7, 3)).toBe(58333);
    });

    it('initialStack が 0 の場合 null を返す', () => {
      expect(calculateAverageStack(0, 10, 10)).toBeNull();
    });

    it('totalPlayers が 0 の場合 null を返す', () => {
      expect(calculateAverageStack(30000, 0, 10)).toBeNull();
    });

    it('remainingPlayers が 0 の場合 null を返す', () => {
      expect(calculateAverageStack(30000, 10, 0)).toBeNull();
    });

    it('負の値の場合 null を返す', () => {
      expect(calculateAverageStack(-30000, 10, 10)).toBeNull();
      expect(calculateAverageStack(30000, -10, 10)).toBeNull();
      expect(calculateAverageStack(30000, 10, -10)).toBeNull();
    });

    it('残り1人の場合、全チップ量が返される', () => {
      expect(calculateAverageStack(30000, 10, 1)).toBe(300000);
    });
  });

  describe('calculateAverageStackBB', () => {
    it('正しくBB換算値を計算する', () => {
      expect(calculateAverageStackBB(30000, 200)).toBe(150.0);
      expect(calculateAverageStackBB(60000, 600)).toBe(100.0);
      expect(calculateAverageStackBB(150000, 2000)).toBe(75.0);
    });

    it('小数第1位まで表示される', () => {
      expect(calculateAverageStackBB(33000, 200)).toBe(165.0);
      expect(calculateAverageStackBB(25000, 600)).toBe(41.7);
      expect(calculateAverageStackBB(12345, 678)).toBe(18.2);
    });

    it('averageStack が 0 の場合 null を返す', () => {
      expect(calculateAverageStackBB(0, 200)).toBeNull();
    });

    it('bigBlind が 0 の場合 null を返す', () => {
      expect(calculateAverageStackBB(30000, 0)).toBeNull();
    });

    it('負の値の場合 null を返す', () => {
      expect(calculateAverageStackBB(-30000, 200)).toBeNull();
      expect(calculateAverageStackBB(30000, -200)).toBeNull();
    });
  });

  describe('canCalculateAverageStack', () => {
    it('全フィールドが正の場合 true を返す', () => {
      expect(canCalculateAverageStack(30000, 10, 10)).toBe(true);
      expect(canCalculateAverageStack(1, 1, 1)).toBe(true);
      expect(canCalculateAverageStack(10000000, 10000, 5000)).toBe(true);
    });

    it('initialStack が 0 の場合 false を返す', () => {
      expect(canCalculateAverageStack(0, 10, 10)).toBe(false);
    });

    it('totalPlayers が 0 の場合 false を返す', () => {
      expect(canCalculateAverageStack(30000, 0, 10)).toBe(false);
    });

    it('remainingPlayers が 0 の場合 false を返す', () => {
      expect(canCalculateAverageStack(30000, 10, 0)).toBe(false);
    });

    it('いずれかが負の値の場合 false を返す', () => {
      expect(canCalculateAverageStack(-30000, 10, 10)).toBe(false);
      expect(canCalculateAverageStack(30000, -10, 10)).toBe(false);
      expect(canCalculateAverageStack(30000, 10, -10)).toBe(false);
    });
  });
});
