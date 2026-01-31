import { describe, it, expect } from 'vitest';
import {
  isValidBlindLevel,
  isValidStructure,
  isValidBreakConfig,
  validateStructureName,
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

describe('isValidStructure', () => {
  it('should return true for valid structure', () => {
    const structure = {
      id: 'test-id',
      name: 'Test',
      type: 'custom' as const,
      blindLevels: [{ smallBlind: 100, bigBlind: 200, ante: 0 }],
      levelDuration: 600,
      breakConfig: { enabled: false, frequency: 4, duration: 600 },
    };
    expect(isValidStructure(structure)).toBe(true);
  });

  it('should return false for structure with invalid blind levels', () => {
    const structure = {
      id: 'test-id',
      name: 'Test',
      type: 'custom' as const,
      blindLevels: [{ smallBlind: 0, bigBlind: 200, ante: 0 }],
      levelDuration: 600,
      breakConfig: { enabled: false, frequency: 4, duration: 600 },
    };
    expect(isValidStructure(structure)).toBe(false);
  });

  it('should return false for missing required fields', () => {
    const structure = {
      id: 'test-id',
      blindLevels: [{ smallBlind: 100, bigBlind: 200, ante: 0 }],
    };
    expect(isValidStructure(structure)).toBe(false);
  });

  it('should return false for non-array blindLevels', () => {
    const structure = {
      id: 'test-id',
      name: 'Test',
      type: 'custom' as const,
      blindLevels: 'not an array',
      levelDuration: 600,
      breakConfig: { enabled: false, frequency: 4, duration: 600 },
    };
    expect(isValidStructure(structure)).toBe(false);
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

describe('validateStructureName', () => {
  it('should return valid for proper name', () => {
    expect(validateStructureName('My Structure')).toEqual({ valid: true });
    expect(validateStructureName('Tournament')).toEqual({ valid: true });
  });

  it('should return error for empty name', () => {
    expect(validateStructureName('')).toEqual({
      valid: false,
      error: 'ストラクチャー名を入力してください',
    });
    expect(validateStructureName('   ')).toEqual({
      valid: false,
      error: 'ストラクチャー名を入力してください',
    });
  });

  it('should return error for name over 50 characters', () => {
    const longName = 'a'.repeat(51);
    expect(validateStructureName(longName)).toEqual({
      valid: false,
      error: 'ストラクチャー名は50文字以内で入力してください',
    });
  });

  it('should accept name with exactly 50 characters', () => {
    const maxName = 'a'.repeat(50);
    expect(validateStructureName(maxName)).toEqual({ valid: true });
  });
});
