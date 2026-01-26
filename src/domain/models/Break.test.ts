import { describe, it, expect } from 'vitest';
import { shouldTakeBreak, getLevelsUntilBreak } from './Break';

describe('shouldTakeBreak', () => {
  it('should return false when break is disabled', () => {
    const config = { enabled: false, frequency: 4, duration: 600 };
    expect(shouldTakeBreak(3, config)).toBe(false);
    expect(shouldTakeBreak(7, config)).toBe(false);
  });

  it('should return false for first level (level 0)', () => {
    const config = { enabled: true, frequency: 4, duration: 600 };
    expect(shouldTakeBreak(0, config)).toBe(false);
  });

  it('should return true at break frequency', () => {
    const config = { enabled: true, frequency: 4, duration: 600 };
    // Level indices are 0-based, so level 3 is the 4th level
    expect(shouldTakeBreak(3, config)).toBe(true); // level 4 (0-indexed: 3)
    expect(shouldTakeBreak(7, config)).toBe(true); // level 8 (0-indexed: 7)
    expect(shouldTakeBreak(11, config)).toBe(true); // level 12 (0-indexed: 11)
  });

  it('should return false between breaks', () => {
    const config = { enabled: true, frequency: 4, duration: 600 };
    expect(shouldTakeBreak(1, config)).toBe(false);
    expect(shouldTakeBreak(2, config)).toBe(false);
    expect(shouldTakeBreak(4, config)).toBe(false);
    expect(shouldTakeBreak(5, config)).toBe(false);
    expect(shouldTakeBreak(6, config)).toBe(false);
  });

  it('should work with different frequencies', () => {
    const config3 = { enabled: true, frequency: 3, duration: 600 };
    expect(shouldTakeBreak(2, config3)).toBe(true); // level 3
    expect(shouldTakeBreak(5, config3)).toBe(true); // level 6

    const config5 = { enabled: true, frequency: 5, duration: 600 };
    expect(shouldTakeBreak(4, config5)).toBe(true); // level 5
    expect(shouldTakeBreak(9, config5)).toBe(true); // level 10
  });
});

describe('getLevelsUntilBreak', () => {
  it('should return correct levels until next break', () => {
    const config = { enabled: true, frequency: 4, duration: 600 };
    expect(getLevelsUntilBreak(0, config)).toBe(4); // 0 -> 4 levels until break
    expect(getLevelsUntilBreak(1, config)).toBe(3); // 1 -> 3 levels
    expect(getLevelsUntilBreak(2, config)).toBe(2); // 2 -> 2 levels
    expect(getLevelsUntilBreak(3, config)).toBe(1); // 3 -> 1 level (next is break)
    expect(getLevelsUntilBreak(4, config)).toBe(4); // 4 -> 4 levels until next break
  });

  it('should return null when break is disabled', () => {
    const config = { enabled: false, frequency: 4, duration: 600 };
    expect(getLevelsUntilBreak(0, config)).toBeNull();
    expect(getLevelsUntilBreak(5, config)).toBeNull();
  });

  it('should work with different frequencies', () => {
    const config3 = { enabled: true, frequency: 3, duration: 600 };
    expect(getLevelsUntilBreak(0, config3)).toBe(3);
    expect(getLevelsUntilBreak(1, config3)).toBe(2);
    expect(getLevelsUntilBreak(2, config3)).toBe(1);
    expect(getLevelsUntilBreak(3, config3)).toBe(3);
  });
});
