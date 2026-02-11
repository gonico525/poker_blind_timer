import { describe, it, expect } from 'vitest';
import {
  createDefaultStructures,
  mergeWithDefaultStructures,
} from './Structure';

describe('createDefaultStructures', () => {
  it('should create 4 default structures', () => {
    const structures = createDefaultStructures();
    expect(structures).toHaveLength(4);
  });

  it('should create deepstack structure', () => {
    const structures = createDefaultStructures();
    const deep = structures.find((s) => s.id === 'default-deepstack');
    expect(deep).toBeDefined();
    expect(deep?.name).toBe('Deepstack (30min/50k Start)');
    expect(deep?.type).toBe('default');
    expect(deep?.blindLevels.length).toBe(24);
    expect(deep?.levelDuration).toBe(1800); // 30分
  });

  it('should create standard structure', () => {
    const structures = createDefaultStructures();
    const standard = structures.find((s) => s.id === 'default-standard');
    expect(standard).toBeDefined();
    expect(standard?.name).toBe('Standard (20min/30k Start)');
    expect(standard?.type).toBe('default');
    expect(standard?.blindLevels.length).toBe(17);
    expect(standard?.levelDuration).toBe(1200); // 20分
  });

  it('should create turbo structure', () => {
    const structures = createDefaultStructures();
    const turbo = structures.find((s) => s.id === 'default-turbo');
    expect(turbo).toBeDefined();
    expect(turbo?.name).toBe('Turbo (15min/25k Start)');
    expect(turbo?.type).toBe('default');
    expect(turbo?.blindLevels.length).toBe(14);
    expect(turbo?.levelDuration).toBe(900); // 15分
  });

  it('should create hyper turbo structure', () => {
    const structures = createDefaultStructures();
    const hyper = structures.find((s) => s.id === 'default-hyperturbo');
    expect(hyper).toBeDefined();
    expect(hyper?.name).toBe('Hyper Turbo (10min/20k Start)');
    expect(hyper?.type).toBe('default');
    expect(hyper?.blindLevels.length).toBe(12);
    expect(hyper?.levelDuration).toBe(600); // 10分
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

  it('should have initialStack defined for all default structures', () => {
    const structures = createDefaultStructures();
    const deepstack = structures.find((s) => s.id === 'default-deepstack');
    const standard = structures.find((s) => s.id === 'default-standard');
    const turbo = structures.find((s) => s.id === 'default-turbo');
    const hyperturbo = structures.find((s) => s.id === 'default-hyperturbo');

    expect(deepstack?.initialStack).toBe(50000);
    expect(standard?.initialStack).toBe(30000);
    expect(turbo?.initialStack).toBe(25000);
    expect(hyperturbo?.initialStack).toBe(20000);
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
        initialStack: 10000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    const merged = mergeWithDefaultStructures(userStructures);

    expect(merged.some((s) => s.id === 'default-deepstack')).toBe(true);
    expect(merged.some((s) => s.id === 'default-standard')).toBe(true);
    expect(merged.some((s) => s.id === 'default-turbo')).toBe(true);
    expect(merged.some((s) => s.id === 'default-hyperturbo')).toBe(true);
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
        initialStack: 10000,
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
        initialStack: 20000,
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
    expect(merged).toHaveLength(4); // Only defaults
    expect(merged.some((s) => s.id === 'default-standard')).toBe(true);
  });

  it('should add initialStack to structures missing the field (backward compatibility)', () => {
    // Simulate legacy data structure without initialStack
    interface LegacyStructure {
      id: string;
      name: string;
      type: 'custom';
      blindLevels: Array<{
        smallBlind: number;
        bigBlind: number;
        ante: number;
      }>;
      levelDuration: number;
      breakConfig: { enabled: boolean; frequency: number; duration: number };
      createdAt: number;
      updatedAt: number;
    }

    const legacyStructures: LegacyStructure[] = [
      {
        id: 'legacy-1',
        name: 'Legacy Structure',
        type: 'custom' as const,
        blindLevels: [{ smallBlind: 25, bigBlind: 50, ante: 0 }],
        levelDuration: 600,
        breakConfig: { enabled: false, frequency: 4, duration: 600 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    // mergeWithDefaultStructures accepts the partial type
    const merged = mergeWithDefaultStructures(
      legacyStructures as unknown as typeof legacyStructures &
        { initialStack: number }[]
    );
    const legacy = merged.find((s) => s.id === 'legacy-1');

    expect(legacy).toBeDefined();
    expect(legacy?.initialStack).toBe(0); // Should be filled with default value
  });

  it('should preserve existing initialStack values', () => {
    const structuresWithStack = [
      {
        id: 'user-1',
        name: 'Structure With Stack',
        type: 'custom' as const,
        blindLevels: [{ smallBlind: 25, bigBlind: 50, ante: 0 }],
        levelDuration: 600,
        breakConfig: { enabled: false, frequency: 4, duration: 600 },
        initialStack: 50000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const merged = mergeWithDefaultStructures(structuresWithStack);
    const user = merged.find((s) => s.id === 'user-1');

    expect(user).toBeDefined();
    expect(user?.initialStack).toBe(50000); // Should preserve existing value
  });
});
