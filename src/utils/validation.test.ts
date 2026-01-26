import { describe, it, expect } from 'vitest';
import {
  isValidBlindLevel,
  isValidPreset,
  isValidBreakConfig,
  validatePresetName,
} from './validation';

describe('isValidBlindLevel', () => {
  it('should return true for valid blind level', () => {
    expect(isValidBlindLevel({ smallBlind: 100, bigBlind: 200, ante: 0 })).toBe(
      true
    );
    expect(isValidBlindLevel({ smallBlind: 50, bigBlind: 100, ante: 10 })).toBe(
      true
    );
  });

  it('should return false for invalid smallBlind', () => {
    expect(isValidBlindLevel({ smallBlind: 0, bigBlind: 200, ante: 0 })).toBe(
      false
    );
    expect(isValidBlindLevel({ smallBlind: -1, bigBlind: 200, ante: 0 })).toBe(
      false
    );
  });

  it('should return false for invalid bigBlind', () => {
    expect(isValidBlindLevel({ smallBlind: 100, bigBlind: 0, ante: 0 })).toBe(
      false
    );
    expect(isValidBlindLevel({ smallBlind: 100, bigBlind: 50, ante: 0 })).toBe(
      false
    ); // BB < SB
  });

  it('should return false for negative ante', () => {
    expect(
      isValidBlindLevel({ smallBlind: 100, bigBlind: 200, ante: -1 })
    ).toBe(false);
  });

  it('should return false for non-object', () => {
    expect(isValidBlindLevel(null)).toBe(false);
    expect(isValidBlindLevel('string')).toBe(false);
    expect(isValidBlindLevel(123)).toBe(false);
  });
});

describe('isValidPreset', () => {
  it('should return true for valid preset', () => {
    const preset = {
      id: 'test-id',
      name: 'Test',
      type: 'custom' as const,
      blindLevels: [{ smallBlind: 100, bigBlind: 200, ante: 0 }],
      levelDuration: 600,
      breakConfig: { enabled: false, frequency: 4, duration: 600 },
    };
    expect(isValidPreset(preset)).toBe(true);
  });

  it('should return false for preset with invalid blind levels', () => {
    const preset = {
      id: 'test-id',
      name: 'Test',
      type: 'custom' as const,
      blindLevels: [{ smallBlind: 0, bigBlind: 200, ante: 0 }],
      levelDuration: 600,
      breakConfig: { enabled: false, frequency: 4, duration: 600 },
    };
    expect(isValidPreset(preset)).toBe(false);
  });

  it('should return false for missing required fields', () => {
    const preset = {
      id: 'test-id',
      blindLevels: [{ smallBlind: 100, bigBlind: 200, ante: 0 }],
    };
    expect(isValidPreset(preset)).toBe(false);
  });

  it('should return false for non-array blindLevels', () => {
    const preset = {
      id: 'test-id',
      name: 'Test',
      type: 'custom' as const,
      blindLevels: 'not an array',
      levelDuration: 600,
      breakConfig: { enabled: false, frequency: 4, duration: 600 },
    };
    expect(isValidPreset(preset)).toBe(false);
  });
});

describe('isValidBreakConfig', () => {
  it('should return true for valid config', () => {
    expect(
      isValidBreakConfig({ enabled: true, frequency: 4, duration: 600 })
    ).toBe(true);
    expect(
      isValidBreakConfig({ enabled: false, frequency: 4, duration: 600 })
    ).toBe(true);
  });

  it('should return false for invalid frequency', () => {
    expect(
      isValidBreakConfig({ enabled: true, frequency: 0, duration: 600 })
    ).toBe(false);
    expect(
      isValidBreakConfig({ enabled: true, frequency: -1, duration: 600 })
    ).toBe(false);
  });

  it('should return false for invalid duration', () => {
    expect(
      isValidBreakConfig({ enabled: true, frequency: 4, duration: 0 })
    ).toBe(false);
    expect(
      isValidBreakConfig({ enabled: true, frequency: 4, duration: -1 })
    ).toBe(false);
  });

  it('should return false for non-object', () => {
    expect(isValidBreakConfig(null)).toBe(false);
    expect(isValidBreakConfig('string')).toBe(false);
  });
});

describe('validatePresetName', () => {
  it('should return valid for proper name', () => {
    expect(validatePresetName('My Preset')).toEqual({ valid: true });
    expect(validatePresetName('Tournament')).toEqual({ valid: true });
  });

  it('should return error for empty name', () => {
    expect(validatePresetName('')).toEqual({
      valid: false,
      error: 'プリセット名を入力してください',
    });
    expect(validatePresetName('   ')).toEqual({
      valid: false,
      error: 'プリセット名を入力してください',
    });
  });

  it('should return error for name over 50 characters', () => {
    const longName = 'a'.repeat(51);
    expect(validatePresetName(longName)).toEqual({
      valid: false,
      error: 'プリセット名は50文字以内で入力してください',
    });
  });

  it('should accept name with exactly 50 characters', () => {
    const maxName = 'a'.repeat(50);
    expect(validatePresetName(maxName)).toEqual({ valid: true });
  });
});
