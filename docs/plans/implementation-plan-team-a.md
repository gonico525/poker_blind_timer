# Team A 実装計画書：基盤・状態管理

## 概要

| 項目 | 内容 |
|------|------|
| チーム名 | Team A |
| 担当領域 | 基盤・状態管理 |
| 主な成果物 | 型定義、ユーティリティ、Context、StorageService |
| 依存先 | なし（他チームの基盤となる） |
| 依存元 | Team B, C, D |

---

## 担当範囲

### 成果物一覧

```
src/
├── types/                    # 型定義
│   ├── index.ts
│   ├── domain.ts
│   ├── context.ts
│   ├── notification.ts
│   └── storage.ts
├── utils/                    # ユーティリティ
│   ├── index.ts
│   ├── constants.ts
│   ├── timeFormat.ts
│   ├── blindFormat.ts
│   └── validation.ts
├── services/
│   └── StorageService.ts     # ストレージサービス
├── contexts/                 # Context層
│   ├── TournamentContext.tsx
│   ├── SettingsContext.tsx
│   └── NotificationContext.tsx
├── domain/
│   └── models/               # ドメインロジック
│       ├── BlindLevel.ts
│       ├── Timer.ts
│       ├── Preset.ts
│       └── Break.ts
└── components/               # 基盤コンポーネント
    ├── App.tsx
    ├── MainLayout.tsx
    ├── ErrorScreen.tsx
    └── LoadingScreen.tsx
```

---

## 実装フェーズ

### Phase 1: 基盤構築

**目標**: 他チームが開発を開始できる基盤を提供する

#### Step 1.1: 型定義

**参照ドキュメント:**
- [02-data-models.md](../specs/02-data-models.md) - 全ての型定義
- [04-interface-definitions.md](../specs/04-interface-definitions.md) - セクション8「型エクスポート戦略」

**TDD実装順序:**

```
1. src/types/domain.ts
   ├── BlindLevel
   ├── Timer, TimerStatus
   ├── Preset, PresetId, PresetType
   ├── BreakConfig
   ├── TournamentState
   └── Settings

2. src/types/context.ts
   ├── TournamentAction
   ├── SettingsAction
   ├── TournamentContextValue
   └── SettingsContextValue

3. src/types/notification.ts
   ├── Notification
   ├── NotificationType
   ├── ConfirmOptions
   └── NotificationContextValue

4. src/types/storage.ts
   ├── StorageSchema
   └── StorageKey

5. src/types/index.ts
   └── 全型の re-export
```

**テスト方針:**
- 型定義自体はテスト不要（TypeScriptコンパイラが検証）
- 型ガード関数はユニットテスト作成

#### Step 1.2: 定数定義

**参照ドキュメント:**
- [04-interface-definitions.md](../specs/04-interface-definitions.md) - セクション3.2「src/utils/constants.ts」

**TDD実装順序:**

```typescript
// src/utils/constants.ts

// 1. STORAGE_KEYS - テストで使用確認
describe('STORAGE_KEYS', () => {
  it('should have all required keys', () => {
    expect(STORAGE_KEYS.SETTINGS).toBe('poker-timer-settings');
    expect(STORAGE_KEYS.PRESETS).toBe('poker-timer-presets');
    expect(STORAGE_KEYS.TOURNAMENT_STATE).toBe('poker-timer-tournament');
  });
});

// 2. LIMITS - 境界値テスト
describe('LIMITS', () => {
  it('should have valid limit values', () => {
    expect(LIMITS.MAX_PRESETS).toBeGreaterThan(0);
    expect(LIMITS.MIN_LEVEL_DURATION).toBeLessThan(LIMITS.MAX_LEVEL_DURATION);
  });
});

// 3. DEFAULTS - デフォルト値テスト
describe('DEFAULTS', () => {
  it('should have sensible default values', () => {
    expect(DEFAULTS.LEVEL_DURATION).toBe(600); // 10分
    expect(DEFAULTS.VOLUME).toBeGreaterThan(0);
    expect(DEFAULTS.VOLUME).toBeLessThanOrEqual(1);
  });
});

// 4. AUDIO_FILES - パス存在確認
describe('AUDIO_FILES', () => {
  it('should have valid file paths', () => {
    expect(AUDIO_FILES.LEVEL_CHANGE).toMatch(/\.mp3$/);
  });
});
```

#### Step 1.3: ユーティリティ関数

**参照ドキュメント:**
- [04-interface-definitions.md](../specs/04-interface-definitions.md) - セクション3.2「ユーティリティ関数の配置」
- [02-data-models.md](../specs/02-data-models.md) - ヘルパー関数の仕様

**TDD実装順序:**

##### 1.3.1 timeFormat.ts

```typescript
// RED: 失敗するテストを書く
describe('formatTime', () => {
  it('should format 0 seconds as "00:00"', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('should format 65 seconds as "01:05"', () => {
    expect(formatTime(65)).toBe('01:05');
  });

  it('should format 600 seconds as "10:00"', () => {
    expect(formatTime(600)).toBe('10:00');
  });

  it('should format 3599 seconds as "59:59"', () => {
    expect(formatTime(3599)).toBe('59:59');
  });

  it('should handle negative values by returning "00:00"', () => {
    expect(formatTime(-1)).toBe('00:00');
  });
});

describe('formatLongTime', () => {
  it('should format time under 1 hour as MM:SS', () => {
    expect(formatLongTime(3599)).toBe('59:59');
  });

  it('should format time over 1 hour as H:MM:SS', () => {
    expect(formatLongTime(3661)).toBe('1:01:01');
  });
});
```

##### 1.3.2 blindFormat.ts

```typescript
describe('formatBlindValue', () => {
  it('should format values under 1000 as-is', () => {
    expect(formatBlindValue(100)).toBe('100');
    expect(formatBlindValue(500)).toBe('500');
  });

  it('should format 1000+ values with K suffix', () => {
    expect(formatBlindValue(1000)).toBe('1K');
    expect(formatBlindValue(2500)).toBe('2.5K');
    expect(formatBlindValue(10000)).toBe('10K');
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
});
```

##### 1.3.3 validation.ts

```typescript
describe('isValidBlindLevel', () => {
  it('should return true for valid blind level', () => {
    expect(isValidBlindLevel({ smallBlind: 100, bigBlind: 200, ante: 0 })).toBe(true);
  });

  it('should return false for invalid smallBlind', () => {
    expect(isValidBlindLevel({ smallBlind: 0, bigBlind: 200, ante: 0 })).toBe(false);
    expect(isValidBlindLevel({ smallBlind: -1, bigBlind: 200, ante: 0 })).toBe(false);
  });

  it('should return false for non-object', () => {
    expect(isValidBlindLevel(null)).toBe(false);
    expect(isValidBlindLevel('string')).toBe(false);
  });
});

describe('isValidPreset', () => {
  it('should return true for valid preset', () => {
    const preset = {
      id: 'test-id',
      name: 'Test',
      blindLevels: [{ smallBlind: 100, bigBlind: 200, ante: 0 }],
    };
    expect(isValidPreset(preset)).toBe(true);
  });

  it('should return false for preset with invalid blind levels', () => {
    const preset = {
      id: 'test-id',
      name: 'Test',
      blindLevels: [{ smallBlind: 0, bigBlind: 200, ante: 0 }],
    };
    expect(isValidPreset(preset)).toBe(false);
  });
});

describe('validatePresetName', () => {
  it('should return valid for proper name', () => {
    expect(validatePresetName('My Preset')).toEqual({ valid: true });
  });

  it('should return error for empty name', () => {
    expect(validatePresetName('')).toEqual({
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
});
```

---

### Phase 2A: Context層

**目標**: アプリケーションの状態管理基盤を構築

#### Step 2.1: StorageService

**参照ドキュメント:**
- [features/storage.md](../specs/features/storage.md) - ストレージ機能仕様
- [04-interface-definitions.md](../specs/04-interface-definitions.md) - セクション4「初期化シーケンス」

**TDD実装順序:**

```typescript
describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(StorageService.isAvailable()).toBe(true);
    });
  });

  describe('get/set', () => {
    it('should save and retrieve data', () => {
      const data = { test: 'value' };
      StorageService.set('test-key', data);
      expect(StorageService.get('test-key')).toEqual(data);
    });

    it('should return null for non-existent key', () => {
      expect(StorageService.get('non-existent')).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove data', () => {
      StorageService.set('test-key', { test: 'value' });
      StorageService.remove('test-key');
      expect(StorageService.get('test-key')).toBeNull();
    });
  });

  describe('settings storage', () => {
    it('should save and load settings', () => {
      const settings = { theme: 'dark', soundEnabled: true, volume: 0.7 };
      StorageService.saveSettings(settings);
      expect(StorageService.loadSettings()).toEqual(settings);
    });
  });

  describe('presets storage', () => {
    it('should save and load presets', () => {
      const presets = [{ id: '1', name: 'Test', blindLevels: [] }];
      StorageService.savePresets(presets);
      expect(StorageService.loadPresets()).toEqual(presets);
    });
  });
});
```

#### Step 2.2: TournamentContext

**参照ドキュメント:**
- [04-interface-definitions.md](../specs/04-interface-definitions.md) - セクション1「Context間アクション責務マトリクス」
- [04-interface-definitions.md](../specs/04-interface-definitions.md) - セクション6「休憩フローの状態遷移」
- [01-architecture.md](../specs/01-architecture.md) - TournamentContext の設計

**TDD実装順序:**

```typescript
describe('tournamentReducer', () => {
  const initialState: TournamentState = {
    timer: { status: 'idle', remainingTime: 600, elapsedTime: 0 },
    currentLevel: 0,
    blindLevels: [{ smallBlind: 25, bigBlind: 50, ante: 0 }],
    breakConfig: { enabled: false, frequency: 4, duration: 600 },
    levelDuration: 600,
    isOnBreak: false,
    breakRemainingTime: 0,
  };

  describe('START action', () => {
    it('should change timer status to running', () => {
      const state = tournamentReducer(initialState, { type: 'START' });
      expect(state.timer.status).toBe('running');
    });

    it('should not start if already running', () => {
      const runningState = {
        ...initialState,
        timer: { ...initialState.timer, status: 'running' as const },
      };
      const state = tournamentReducer(runningState, { type: 'START' });
      expect(state).toBe(runningState);
    });
  });

  describe('PAUSE action', () => {
    it('should change timer status to paused', () => {
      const runningState = {
        ...initialState,
        timer: { ...initialState.timer, status: 'running' as const },
      };
      const state = tournamentReducer(runningState, { type: 'PAUSE' });
      expect(state.timer.status).toBe('paused');
    });
  });

  describe('TICK action', () => {
    it('should decrement remainingTime by 1', () => {
      const runningState = {
        ...initialState,
        timer: { status: 'running' as const, remainingTime: 100, elapsedTime: 0 },
      };
      const state = tournamentReducer(runningState, { type: 'TICK' });
      expect(state.timer.remainingTime).toBe(99);
      expect(state.timer.elapsedTime).toBe(1);
    });

    it('should not tick below 0', () => {
      const runningState = {
        ...initialState,
        timer: { status: 'running' as const, remainingTime: 0, elapsedTime: 600 },
      };
      const state = tournamentReducer(runningState, { type: 'TICK' });
      expect(state.timer.remainingTime).toBe(0);
    });
  });

  describe('NEXT_LEVEL action', () => {
    it('should advance to next level', () => {
      const state = tournamentReducer(initialState, { type: 'NEXT_LEVEL' });
      expect(state.currentLevel).toBe(1);
      expect(state.timer.remainingTime).toBe(initialState.levelDuration);
      expect(state.timer.elapsedTime).toBe(0);
      expect(state.timer.status).toBe('idle');
    });
  });

  describe('PREV_LEVEL action', () => {
    it('should go back to previous level', () => {
      const state = { ...initialState, currentLevel: 2 };
      const newState = tournamentReducer(state, { type: 'PREV_LEVEL' });
      expect(newState.currentLevel).toBe(1);
    });

    it('should not go below 0', () => {
      const state = tournamentReducer(initialState, { type: 'PREV_LEVEL' });
      expect(state.currentLevel).toBe(0);
    });
  });

  describe('RESET action', () => {
    it('should reset timer for current level', () => {
      const state = {
        ...initialState,
        timer: { status: 'running' as const, remainingTime: 100, elapsedTime: 500 },
      };
      const newState = tournamentReducer(state, { type: 'RESET' });
      expect(newState.timer.remainingTime).toBe(initialState.levelDuration);
      expect(newState.timer.elapsedTime).toBe(0);
      expect(newState.timer.status).toBe('idle');
    });
  });

  describe('LOAD_PRESET action', () => {
    it('should load preset data', () => {
      const preset = {
        id: 'test',
        name: 'Test',
        blindLevels: [{ smallBlind: 50, bigBlind: 100, ante: 10 }],
        breakConfig: { enabled: true, frequency: 3, duration: 300 },
        levelDuration: 900,
      };
      const state = tournamentReducer(initialState, {
        type: 'LOAD_PRESET',
        payload: { preset },
      });
      expect(state.blindLevels).toEqual(preset.blindLevels);
      expect(state.breakConfig).toEqual(preset.breakConfig);
      expect(state.levelDuration).toBe(900);
      expect(state.currentLevel).toBe(0);
      expect(state.timer.status).toBe('idle');
    });
  });

  describe('Break handling', () => {
    it('should start break when conditions are met', () => {
      const stateWithBreak = {
        ...initialState,
        currentLevel: 3,
        breakConfig: { enabled: true, frequency: 4, duration: 600 },
      };
      const state = tournamentReducer(stateWithBreak, { type: 'START_BREAK' });
      expect(state.isOnBreak).toBe(true);
      expect(state.breakRemainingTime).toBe(600);
    });

    it('should end break', () => {
      const onBreakState = {
        ...initialState,
        isOnBreak: true,
        breakRemainingTime: 100,
      };
      const state = tournamentReducer(onBreakState, { type: 'END_BREAK' });
      expect(state.isOnBreak).toBe(false);
      expect(state.breakRemainingTime).toBe(0);
    });

    it('should skip break', () => {
      const onBreakState = {
        ...initialState,
        isOnBreak: true,
        breakRemainingTime: 300,
      };
      const state = tournamentReducer(onBreakState, { type: 'SKIP_BREAK' });
      expect(state.isOnBreak).toBe(false);
    });
  });
});
```

#### Step 2.3: SettingsContext

**参照ドキュメント:**
- [04-interface-definitions.md](../specs/04-interface-definitions.md) - セクション1.2「SettingsContext のアクション」
- [features/presets.md](../specs/features/presets.md) - プリセット管理

**TDD実装順序:**

```typescript
describe('settingsReducer', () => {
  const initialState: SettingsState = {
    settings: { theme: 'dark', soundEnabled: true, volume: 0.7 },
    presets: [],
    currentPresetId: null,
  };

  describe('SET_THEME action', () => {
    it('should change theme', () => {
      const state = settingsReducer(initialState, {
        type: 'SET_THEME',
        payload: { theme: 'light' },
      });
      expect(state.settings.theme).toBe('light');
    });
  });

  describe('SET_SOUND_ENABLED action', () => {
    it('should toggle sound', () => {
      const state = settingsReducer(initialState, {
        type: 'SET_SOUND_ENABLED',
        payload: { enabled: false },
      });
      expect(state.settings.soundEnabled).toBe(false);
    });
  });

  describe('SET_VOLUME action', () => {
    it('should set volume', () => {
      const state = settingsReducer(initialState, {
        type: 'SET_VOLUME',
        payload: { volume: 0.5 },
      });
      expect(state.settings.volume).toBe(0.5);
    });

    it('should clamp volume between 0 and 1', () => {
      let state = settingsReducer(initialState, {
        type: 'SET_VOLUME',
        payload: { volume: 1.5 },
      });
      expect(state.settings.volume).toBe(1);

      state = settingsReducer(initialState, {
        type: 'SET_VOLUME',
        payload: { volume: -0.5 },
      });
      expect(state.settings.volume).toBe(0);
    });
  });

  describe('Preset actions', () => {
    it('should add preset', () => {
      const preset = { id: '1', name: 'Test', blindLevels: [] };
      const state = settingsReducer(initialState, {
        type: 'ADD_PRESET',
        payload: { preset },
      });
      expect(state.presets).toContainEqual(preset);
    });

    it('should update preset', () => {
      const stateWithPreset = {
        ...initialState,
        presets: [{ id: '1', name: 'Old', blindLevels: [] }],
      };
      const state = settingsReducer(stateWithPreset, {
        type: 'UPDATE_PRESET',
        payload: { preset: { id: '1', name: 'New', blindLevels: [] } },
      });
      expect(state.presets[0].name).toBe('New');
    });

    it('should delete preset', () => {
      const stateWithPreset = {
        ...initialState,
        presets: [{ id: '1', name: 'Test', blindLevels: [] }],
      };
      const state = settingsReducer(stateWithPreset, {
        type: 'DELETE_PRESET',
        payload: { presetId: '1' },
      });
      expect(state.presets).toHaveLength(0);
    });
  });
});
```

#### Step 2.4: NotificationContext

**参照ドキュメント:**
- [04-interface-definitions.md](../specs/04-interface-definitions.md) - セクション5「グローバル通知システム」

**TDD実装順序:**

```typescript
describe('NotificationContext', () => {
  describe('showNotification', () => {
    it('should add notification to list', () => {
      // ... renderHookを使用したテスト
    });

    it('should auto-dismiss after duration', async () => {
      // ... vi.useFakeTimers()を使用したテスト
    });
  });

  describe('dismissNotification', () => {
    it('should remove notification by id', () => {
      // ...
    });
  });

  describe('showConfirm', () => {
    it('should return true when confirmed', async () => {
      // ...
    });

    it('should return false when cancelled', async () => {
      // ...
    });
  });
});
```

---

### Phase 3A: ドメインロジック

**目標**: ビジネスロジックを純粋関数として実装

#### Step 3.1: Break ロジック

**参照ドキュメント:**
- [04-interface-definitions.md](../specs/04-interface-definitions.md) - セクション6.2「休憩判定ロジック」

```typescript
describe('shouldTakeBreak', () => {
  it('should return false when break is disabled', () => {
    const config = { enabled: false, frequency: 4, duration: 600 };
    expect(shouldTakeBreak(3, config)).toBe(false);
  });

  it('should return false for first level', () => {
    const config = { enabled: true, frequency: 4, duration: 600 };
    expect(shouldTakeBreak(0, config)).toBe(false);
  });

  it('should return true at break frequency', () => {
    const config = { enabled: true, frequency: 4, duration: 600 };
    expect(shouldTakeBreak(3, config)).toBe(true);  // level 4 (0-indexed: 3)
    expect(shouldTakeBreak(7, config)).toBe(true);  // level 8 (0-indexed: 7)
  });

  it('should return false between breaks', () => {
    const config = { enabled: true, frequency: 4, duration: 600 };
    expect(shouldTakeBreak(1, config)).toBe(false);
    expect(shouldTakeBreak(2, config)).toBe(false);
    expect(shouldTakeBreak(4, config)).toBe(false);
  });
});

describe('getLevelsUntilBreak', () => {
  it('should return correct levels until next break', () => {
    const config = { enabled: true, frequency: 4, duration: 600 };
    expect(getLevelsUntilBreak(0, config)).toBe(4);
    expect(getLevelsUntilBreak(1, config)).toBe(3);
    expect(getLevelsUntilBreak(3, config)).toBe(1);
    expect(getLevelsUntilBreak(4, config)).toBe(4);
  });

  it('should return null when break is disabled', () => {
    const config = { enabled: false, frequency: 4, duration: 600 };
    expect(getLevelsUntilBreak(0, config)).toBeNull();
  });
});
```

#### Step 3.2: Preset ロジック

```typescript
describe('createDefaultPresets', () => {
  it('should create standard preset', () => {
    const presets = createDefaultPresets();
    const standard = presets.find(p => p.id === 'default-standard');
    expect(standard).toBeDefined();
    expect(standard?.blindLevels.length).toBeGreaterThan(0);
  });

  it('should create turbo preset', () => {
    const presets = createDefaultPresets();
    const turbo = presets.find(p => p.id === 'default-turbo');
    expect(turbo).toBeDefined();
  });

  it('should create deep stack preset', () => {
    const presets = createDefaultPresets();
    const deep = presets.find(p => p.id === 'default-deepstack');
    expect(deep).toBeDefined();
  });
});

describe('mergeWithDefaultPresets', () => {
  it('should add missing default presets', () => {
    const userPresets = [{ id: 'user-1', name: 'My Preset', blindLevels: [] }];
    const merged = mergeWithDefaultPresets(userPresets);
    expect(merged.some(p => p.id === 'default-standard')).toBe(true);
    expect(merged.some(p => p.id === 'user-1')).toBe(true);
  });

  it('should not duplicate default presets', () => {
    const defaults = createDefaultPresets();
    const merged = mergeWithDefaultPresets(defaults);
    const standardCount = merged.filter(p => p.id === 'default-standard').length;
    expect(standardCount).toBe(1);
  });
});
```

---

### Phase 4: 基盤UIコンポーネント

#### Step 4.1: App.tsx

**参照ドキュメント:**
- [04-interface-definitions.md](../specs/04-interface-definitions.md) - セクション4「初期化シーケンス」

```typescript
describe('App', () => {
  it('should show loading screen initially', () => {
    render(<App />);
    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
  });

  it('should show main layout after initialization', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });
  });

  it('should show error screen on initialization failure', async () => {
    // StorageServiceのモックでエラーを発生させる
    vi.mocked(StorageService.isAvailable).mockReturnValue(false);
    // ...
  });
});
```

---

## 完了条件

### Phase 1 完了条件

- [ ] 全ての型定義が完了
- [ ] 全ての定数が定義され、テストがパス
- [ ] 全てのユーティリティ関数が実装され、テストがパス
- [ ] `src/types/index.ts` から全型がエクスポート可能
- [ ] `src/utils/index.ts` から全ユーティリティがエクスポート可能
- [ ] 他チームが `@/types`, `@/utils` をインポートして使用可能

### Phase 2A 完了条件

- [ ] StorageService が実装され、テストがパス
- [ ] TournamentContext が実装され、テストがパス
- [ ] SettingsContext が実装され、テストがパス
- [ ] NotificationContext が実装され、テストがパス
- [ ] Context間の連携（LOAD_PRESET）がテストされている

### Phase 3A 完了条件

- [ ] 休憩判定ロジックが実装され、テストがパス
- [ ] プリセット生成ロジックが実装され、テストがパス
- [ ] デフォルトプリセットマージロジックが実装され、テストがパス

### Phase 4 完了条件

- [ ] App.tsx が実装され、初期化シーケンスが動作
- [ ] MainLayout が実装され、Provider が正しくネスト
- [ ] LoadingScreen、ErrorScreen が実装

---

## 他チームへの提供物

### Phase 1 完了時に提供

| 提供物 | 使用方法 | 使用チーム |
|--------|---------|-----------|
| 型定義 | `import type { ... } from '@/types'` | 全チーム |
| 定数 | `import { DEFAULTS, LIMITS } from '@/utils'` | 全チーム |
| フォーマット関数 | `import { formatTime } from '@/utils'` | Team B, D |
| バリデーション関数 | `import { isValidPreset } from '@/utils'` | Team D |

### Phase 2A 完了時に提供

| 提供物 | 使用方法 | 使用チーム |
|--------|---------|-----------|
| useTournament | `const { state, dispatch } = useTournament()` | Team B, C |
| useSettings | `const { settings } = useSettings()` | Team C, D |
| useNotification | `const { showNotification } = useNotification()` | Team D |
| StorageService | モック: `vi.mock('@/services/StorageService')` | Team D |

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2026-01-26 | 初版作成 | システムアーキテクト |
