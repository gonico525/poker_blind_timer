import { describe, it, expect } from 'vitest';
import {
  createDefaultStructures,
  mergeWithDefaultStructures,
} from './Structure';

describe('createDefaultStructures', () => {
  it('should create 3 default structures', () => {
    const structures = createDefaultStructures();
    expect(structures).toHaveLength(3);
  });

  it('should create standard structure', () => {
    const structures = createDefaultStructures();
    const standard = structures.find((s) => s.id === 'default-standard');
    expect(standard).toBeDefined();
    expect(standard?.name).toBe('スタンダード');
    expect(standard?.type).toBe('default');
    expect(standard?.blindLevels.length).toBeGreaterThan(0);
    expect(standard?.levelDuration).toBe(600); // 10分
  });

  it('should create turbo structure', () => {
    const structures = createDefaultStructures();
    const turbo = structures.find((s) => s.id === 'default-turbo');
    expect(turbo).toBeDefined();
    expect(turbo?.name).toBe('ターボ');
    expect(turbo?.type).toBe('default');
    expect(turbo?.levelDuration).toBe(300); // 5分
  });

  it('should create deep stack structure', () => {
    const structures = createDefaultStructures();
    const deep = structures.find((s) => s.id === 'default-deepstack');
    expect(deep).toBeDefined();
    expect(deep?.name).toBe('ディープスタック');
    expect(deep?.type).toBe('default');
  });

  it('should have valid blind structures', () => {
    const structures = createDefaultStructures();
    structures.forEach((structure) => {
      expect(structure.blindLevels.length).toBeGreaterThan(0);
      structure.blindLevels.forEach((level) => {
        expect(level.smallBlind).toBeGreaterThan(0);
        expect(level.bigBlind).toBeGreaterThanOrEqual(level.smallBlind);
        expect(level.ante).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

describe('mergeWithDefaultStructures', () => {
  it('should add missing default structures', () => {
    const userStructures = [
      {
        id: 'user-1',
        name: 'My Structure',
        type: 'custom' as const,
        blindLevels: [{ smallBlind: 25, bigBlind: 50, ante: 0 }],
        levelDuration: 600,
        breakConfig: { enabled: false, frequency: 4, duration: 600 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    const merged = mergeWithDefaultStructures(userStructures);

    expect(merged.some((s) => s.id === 'default-standard')).toBe(true);
    expect(merged.some((s) => s.id === 'default-turbo')).toBe(true);
    expect(merged.some((s) => s.id === 'default-deepstack')).toBe(true);
    expect(merged.some((s) => s.id === 'user-1')).toBe(true);
  });

  it('should not duplicate default structures', () => {
    const defaults = createDefaultStructures();
    const merged = mergeWithDefaultStructures(defaults);
    const standardCount = merged.filter(
      (s) => s.id === 'default-standard'
    ).length;
    expect(standardCount).toBe(1);
  });

  it('should preserve user structures', () => {
    const userStructures = [
      {
        id: 'user-1',
        name: 'My Structure',
        type: 'custom' as const,
        blindLevels: [{ smallBlind: 25, bigBlind: 50, ante: 0 }],
        levelDuration: 600,
        breakConfig: { enabled: false, frequency: 4, duration: 600 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'user-2',
        name: 'Another Structure',
        type: 'custom' as const,
        blindLevels: [{ smallBlind: 50, bigBlind: 100, ante: 0 }],
        levelDuration: 900,
        breakConfig: { enabled: true, frequency: 3, duration: 300 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    const merged = mergeWithDefaultStructures(userStructures);

    const user1 = merged.find((s) => s.id === 'user-1');
    expect(user1).toBeDefined();
    expect(user1?.name).toBe('My Structure');

    const user2 = merged.find((s) => s.id === 'user-2');
    expect(user2).toBeDefined();
    expect(user2?.name).toBe('Another Structure');
  });

  it('should handle empty user structures', () => {
    const merged = mergeWithDefaultStructures([]);
    expect(merged).toHaveLength(3); // Only defaults
    expect(merged.some((s) => s.id === 'default-standard')).toBe(true);
  });
});
