import { describe, it, expect } from 'vitest';
import { formatBlindValue, formatBlindLevel } from './blindFormat';

describe('formatBlindValue', () => {
  it('should format values under 1000 as-is', () => {
    expect(formatBlindValue(100)).toBe('100');
    expect(formatBlindValue(500)).toBe('500');
    expect(formatBlindValue(999)).toBe('999');
  });

  it('should format 1000+ values with K suffix', () => {
    expect(formatBlindValue(1000)).toBe('1K');
    expect(formatBlindValue(2500)).toBe('2.5K');
    expect(formatBlindValue(10000)).toBe('10K');
  });

  it('should handle exact thousands', () => {
    expect(formatBlindValue(5000)).toBe('5K');
    expect(formatBlindValue(100000)).toBe('100K');
  });
});

describe('formatBlindLevel', () => {
  it('should format level without ante', () => {
    const level = { smallBlind: 100, bigBlind: 200, ante: 0 };
    expect(formatBlindLevel(level)).toBe('100/200');
  });

  it('should format level with ante', () => {
    const level = { smallBlind: 100, bigBlind: 200, ante: 25 };
    expect(formatBlindLevel(level)).toBe('100/200 (25)');
  });

  it('should format large values with K suffix', () => {
    const level = { smallBlind: 1000, bigBlind: 2000, ante: 200 };
    expect(formatBlindLevel(level)).toBe('1K/2K (200)');
  });

  it('should format mixed K and regular values', () => {
    const level = { smallBlind: 500, bigBlind: 1000, ante: 100 };
    expect(formatBlindLevel(level)).toBe('500/1K (100)');
  });

  it('should format all K values with ante', () => {
    const level = { smallBlind: 5000, bigBlind: 10000, ante: 1000 };
    expect(formatBlindLevel(level)).toBe('5K/10K (1K)');
  });
});
