import { describe, it, expect } from 'vitest';
import { createDefaultPresets, mergeWithDefaultPresets } from './Preset';

describe('createDefaultPresets', () => {
  it('should create 3 default presets', () => {
    const presets = createDefaultPresets();
    expect(presets).toHaveLength(3);
  });

  it('should create standard preset', () => {
    const presets = createDefaultPresets();
    const standard = presets.find((p) => p.id === 'default-standard');
    expect(standard).toBeDefined();
    expect(standard?.name).toBe('スタンダード');
    expect(standard?.type).toBe('default');
    expect(standard?.blindLevels.length).toBeGreaterThan(0);
    expect(standard?.levelDuration).toBe(600); // 10分
  });

  it('should create turbo preset', () => {
    const presets = createDefaultPresets();
    const turbo = presets.find((p) => p.id === 'default-turbo');
    expect(turbo).toBeDefined();
    expect(turbo?.name).toBe('ターボ');
    expect(turbo?.type).toBe('default');
    expect(turbo?.levelDuration).toBe(300); // 5分
  });

  it('should create deep stack preset', () => {
    const presets = createDefaultPresets();
    const deep = presets.find((p) => p.id === 'default-deepstack');
    expect(deep).toBeDefined();
    expect(deep?.name).toBe('ディープスタック');
    expect(deep?.type).toBe('default');
  });

  it('should have valid blind structures', () => {
    const presets = createDefaultPresets();
    presets.forEach((preset) => {
      expect(preset.blindLevels.length).toBeGreaterThan(0);
      preset.blindLevels.forEach((level) => {
        expect(level.smallBlind).toBeGreaterThan(0);
        expect(level.bigBlind).toBeGreaterThanOrEqual(level.smallBlind);
        expect(level.ante).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

describe('mergeWithDefaultPresets', () => {
  it('should add missing default presets', () => {
    const userPresets = [
      {
        id: 'user-1',
        name: 'My Preset',
        type: 'custom' as const,
        blindLevels: [{ smallBlind: 25, bigBlind: 50, ante: 0 }],
        levelDuration: 600,
        breakConfig: { enabled: false, frequency: 4, duration: 600 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    const merged = mergeWithDefaultPresets(userPresets);

    expect(merged.some((p) => p.id === 'default-standard')).toBe(true);
    expect(merged.some((p) => p.id === 'default-turbo')).toBe(true);
    expect(merged.some((p) => p.id === 'default-deepstack')).toBe(true);
    expect(merged.some((p) => p.id === 'user-1')).toBe(true);
  });

  it('should not duplicate default presets', () => {
    const defaults = createDefaultPresets();
    const merged = mergeWithDefaultPresets(defaults);
    const standardCount = merged.filter(
      (p) => p.id === 'default-standard'
    ).length;
    expect(standardCount).toBe(1);
  });

  it('should preserve user presets', () => {
    const userPresets = [
      {
        id: 'user-1',
        name: 'My Preset',
        type: 'custom' as const,
        blindLevels: [{ smallBlind: 25, bigBlind: 50, ante: 0 }],
        levelDuration: 600,
        breakConfig: { enabled: false, frequency: 4, duration: 600 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'user-2',
        name: 'Another Preset',
        type: 'custom' as const,
        blindLevels: [{ smallBlind: 50, bigBlind: 100, ante: 0 }],
        levelDuration: 900,
        breakConfig: { enabled: true, frequency: 3, duration: 300 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    const merged = mergeWithDefaultPresets(userPresets);

    const user1 = merged.find((p) => p.id === 'user-1');
    expect(user1).toBeDefined();
    expect(user1?.name).toBe('My Preset');

    const user2 = merged.find((p) => p.id === 'user-2');
    expect(user2).toBeDefined();
    expect(user2?.name).toBe('Another Preset');
  });

  it('should handle empty user presets', () => {
    const merged = mergeWithDefaultPresets([]);
    expect(merged).toHaveLength(3); // Only defaults
    expect(merged.some((p) => p.id === 'default-standard')).toBe(true);
  });
});
