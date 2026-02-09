# データモデル仕様

## 1. 概要

本ドキュメントでは、ポーカーブラインドタイマーのデータモデル、TypeScript型定義、localStorage スキーマについて詳細に説明します。

## 2. ドメインモデル概要

### 2.1 エンティティとバリューオブジェクト

```
Tournament (Entity)
  ├─ Timer (Entity)
  ├─ BlindLevel[] (Value Object)
  ├─ BreakConfig (Value Object)
  └─ currentLevel: number

Preset (Entity)
  ├─ id: string
  ├─ name: string
  ├─ blindLevels: BlindLevel[]
  ├─ levelDuration: number
  └─ breakConfig: BreakConfig

Settings (Entity)
  ├─ theme: Theme
  ├─ soundEnabled: boolean
  └─ presets: Preset[]
```

## 3. TypeScript型定義

### 3.1 基本型

#### BlindLevel (Value Object)

```typescript
/**
 * ブラインドレベルの値オブジェクト
 * イミュータブルなデータ構造
 */
export interface BlindLevel {
  readonly smallBlind: number; // スモールブラインド（正の整数）
  readonly bigBlind: number; // ビッグブラインド（正の整数、SB以上）
  readonly ante: number; // アンティ（0以上の整数）
}

/**
 * ブラインドレベルのバリデーション
 */
export function isValidBlindLevel(level: BlindLevel): boolean {
  return (
    Number.isInteger(level.smallBlind) &&
    level.smallBlind > 0 &&
    Number.isInteger(level.bigBlind) &&
    level.bigBlind >= level.smallBlind &&
    Number.isInteger(level.ante) &&
    level.ante >= 0
  );
}

/**
 * ブラインドレベルのフォーマット
 * @returns "SB/BB" or "SB/BB (Ante: X)"
 */
export function formatBlindLevel(level: BlindLevel): string {
  const base = `${level.smallBlind}/${level.bigBlind}`;
  return level.ante > 0 ? `${base} (Ante: ${level.ante})` : base;
}
```

#### BreakConfig (Value Object)

```typescript
/**
 * 休憩設定
 */
export interface BreakConfig {
  readonly enabled: boolean; // 休憩機能の有効/無効
  readonly frequency: number; // 休憩頻度（Xレベルごと、1-10）
  readonly duration: number; // 休憩時間（分、5-30）
}

/**
 * デフォルト休憩設定
 */
export const DEFAULT_BREAK_CONFIG: BreakConfig = {
  enabled: false, // デフォルトは無効
  frequency: 4, // 4レベルごと
  duration: 10, // 10分
};

/**
 * 休憩設定のバリデーション
 */
export function isValidBreakConfig(config: BreakConfig): boolean {
  if (!config.enabled) return true;
  return (
    Number.isInteger(config.frequency) &&
    config.frequency >= 1 &&
    config.frequency <= 10 &&
    Number.isInteger(config.duration) &&
    config.duration >= 5 &&
    config.duration <= 30
  );
}
```

### 3.2 エンティティ型

#### Timer

```typescript
/**
 * タイマーの状態
 */
export type TimerStatus = 'idle' | 'running' | 'paused';

/**
 * タイマーエンティティ
 */
export interface Timer {
  status: TimerStatus;
  remainingTime: number; // 残り時間（秒）
  elapsedTime: number; // 経過時間（秒）
  startTime: number | null; // 開始時刻（Date.now()）
  pausedAt: number | null; // 一時停止時刻（Date.now()）
}

/**
 * タイマーの初期状態を作成
 */
export function createInitialTimer(levelDuration: number): Timer {
  return {
    status: 'idle',
    remainingTime: levelDuration,
    elapsedTime: 0,
    startTime: null,
    pausedAt: null,
  };
}
```

#### Tournament

```typescript
/**
 * トーナメントエンティティ
 */
export interface Tournament {
  // レベル情報
  currentLevel: number; // 現在のレベル（0-indexed）
  blindLevels: BlindLevel[]; // ブラインドレベル配列
  levelDuration: number; // レベル時間（秒）

  // タイマー
  timer: Timer;

  // 休憩
  breakConfig: BreakConfig;
  isBreak: boolean; // 現在休憩中か

  // プリセット参照
  activePresetId: string | null; // アクティブなプリセットID
}

/**
 * 次の休憩までのレベル数を計算
 */
export function getLevelsUntilNextBreak(tournament: Tournament): number | null {
  if (!tournament.breakConfig.enabled) return null;
  if (tournament.isBreak) return 0;

  const { currentLevel, breakConfig } = tournament;
  const { frequency } = breakConfig;

  // 次の休憩レベル = ((currentLevel / frequency) + 1) * frequency
  const nextBreakLevel = Math.ceil((currentLevel + 1) / frequency) * frequency;
  return nextBreakLevel - currentLevel;
}

/**
 * 休憩判定
 */
export function shouldTakeBreak(
  currentLevel: number,
  breakConfig: BreakConfig
): boolean {
  if (!breakConfig.enabled) return false;
  // レベル番号は0-indexedだが、頻度は1-indexedで考える
  // Level 0, 1, 2, 3 → Level 4で休憩（frequency=4）
  return (currentLevel + 1) % breakConfig.frequency === 0;
}
```

#### Preset

```typescript
/**
 * プリセットID（ブランド型）
 */
export type PresetId = string & { readonly __brand: 'PresetId' };

/**
 * プリセットタイプ
 */
export type PresetType = 'standard' | 'turbo' | 'deepstack' | 'custom';

/**
 * プリセットエンティティ
 */
export interface Preset {
  id: PresetId;
  name: string;
  type: PresetType;
  blindLevels: BlindLevel[];
  levelDuration: number; // 秒
  breakConfig: BreakConfig;
  createdAt: number; // タイムスタンプ
  updatedAt: number; // タイムスタンプ
}

/**
 * プリセットIDの生成
 */
export function generatePresetId(): PresetId {
  return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as PresetId;
}

/**
 * プリセットのバリデーション
 */
export function isValidPreset(preset: Preset): boolean {
  return (
    preset.id.length > 0 &&
    preset.name.trim().length > 0 &&
    preset.blindLevels.length > 0 &&
    preset.blindLevels.every(isValidBlindLevel) &&
    preset.levelDuration >= 60 && // 最低1分
    preset.levelDuration <= 3600 && // 最大60分
    isValidBreakConfig(preset.breakConfig)
  );
}
```

### 3.3 設定型

#### Settings

```typescript
/**
 * テーマ設定
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * 設定エンティティ
 */
export interface Settings {
  theme: Theme;
  soundEnabled: boolean;
  presets: Preset[];
}

/**
 * デフォルト設定
 */
export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  soundEnabled: true,
  presets: [], // デフォルトプリセットは初期化時に追加
};
```

### 3.4 イベント型

```typescript
/**
 * ドメインイベント
 */
export type TournamentEvent =
  | { type: 'LEVEL_STARTED'; payload: { level: number; isBreak: boolean } }
  | { type: 'LEVEL_CHANGED'; payload: { from: number; to: number } }
  | { type: 'BREAK_STARTED'; payload: { duration: number } }
  | { type: 'TIMER_TICK'; payload: { remainingTime: number } }
  | { type: 'WARNING_1MIN'; payload: { level: number } };
```

## 4. デフォルトプリセット

### 4.1 ディープスタックトーナメント

```typescript
export const DEEPSTACK_PRESET: Preset = {
  id: 'preset_default_deepstack' as PresetId,
  name: 'Deepstack (30min/50k Start)',
  type: 'deepstack',
  levelDuration: 30 * 60, // 30分
  breakConfig: {
    enabled: true,
    frequency: 4,
    duration: 600, // 10分
  },
  blindLevels: [
    { smallBlind: 100, bigBlind: 200, ante: 200 },
    { smallBlind: 200, bigBlind: 300, ante: 300 },
    { smallBlind: 200, bigBlind: 400, ante: 400 },
    { smallBlind: 300, bigBlind: 500, ante: 500 },
    { smallBlind: 300, bigBlind: 600, ante: 600 },
    { smallBlind: 400, bigBlind: 800, ante: 800 },
    { smallBlind: 500, bigBlind: 1000, ante: 1000 },
    { smallBlind: 600, bigBlind: 1200, ante: 1200 },
    { smallBlind: 1000, bigBlind: 1500, ante: 1500 },
    { smallBlind: 1000, bigBlind: 2000, ante: 2000 },
    { smallBlind: 1500, bigBlind: 3000, ante: 3000 },
    { smallBlind: 2000, bigBlind: 4000, ante: 4000 },
    { smallBlind: 3000, bigBlind: 5000, ante: 5000 },
    { smallBlind: 3000, bigBlind: 6000, ante: 6000 },
    { smallBlind: 4000, bigBlind: 8000, ante: 8000 },
    { smallBlind: 5000, bigBlind: 10000, ante: 10000 },
    { smallBlind: 6000, bigBlind: 12000, ante: 12000 },
    { smallBlind: 10000, bigBlind: 15000, ante: 15000 },
    { smallBlind: 10000, bigBlind: 20000, ante: 20000 },
    { smallBlind: 15000, bigBlind: 30000, ante: 30000 },
    { smallBlind: 20000, bigBlind: 40000, ante: 40000 },
    { smallBlind: 30000, bigBlind: 60000, ante: 60000 },
    { smallBlind: 40000, bigBlind: 80000, ante: 80000 },
    { smallBlind: 50000, bigBlind: 100000, ante: 100000 },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
```

### 4.2 スタンダードトーナメント

```typescript
export const STANDARD_PRESET: Preset = {
  id: 'preset_default_standard' as PresetId,
  name: 'Standard (20min/30k Start)',
  type: 'standard',
  levelDuration: 20 * 60, // 20分
  breakConfig: {
    enabled: true,
    frequency: 4,
    duration: 600, // 10分
  },
  blindLevels: [
    { smallBlind: 100, bigBlind: 200, ante: 200 },
    { smallBlind: 200, bigBlind: 400, ante: 400 },
    { smallBlind: 300, bigBlind: 600, ante: 600 },
    { smallBlind: 400, bigBlind: 800, ante: 800 },
    { smallBlind: 500, bigBlind: 1000, ante: 1000 },
    { smallBlind: 600, bigBlind: 1200, ante: 1200 },
    { smallBlind: 1000, bigBlind: 2000, ante: 2000 },
    { smallBlind: 1500, bigBlind: 3000, ante: 3000 },
    { smallBlind: 2000, bigBlind: 4000, ante: 4000 },
    { smallBlind: 3000, bigBlind: 6000, ante: 6000 },
    { smallBlind: 4000, bigBlind: 8000, ante: 8000 },
    { smallBlind: 5000, bigBlind: 10000, ante: 10000 },
    { smallBlind: 6000, bigBlind: 12000, ante: 12000 },
    { smallBlind: 10000, bigBlind: 20000, ante: 20000 },
    { smallBlind: 15000, bigBlind: 30000, ante: 30000 },
    { smallBlind: 20000, bigBlind: 40000, ante: 40000 },
    { smallBlind: 30000, bigBlind: 60000, ante: 60000 },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
```

### 4.3 ターボトーナメント

```typescript
export const TURBO_PRESET: Preset = {
  id: 'preset_default_turbo' as PresetId,
  name: 'Turbo (15min/25k Start)',
  type: 'turbo',
  levelDuration: 15 * 60, // 15分
  breakConfig: {
    enabled: true,
    frequency: 5,
    duration: 600, // 10分
  },
  blindLevels: [
    { smallBlind: 100, bigBlind: 200, ante: 200 },
    { smallBlind: 200, bigBlind: 400, ante: 400 },
    { smallBlind: 300, bigBlind: 600, ante: 600 },
    { smallBlind: 500, bigBlind: 1000, ante: 1000 },
    { smallBlind: 700, bigBlind: 1500, ante: 1500 },
    { smallBlind: 1000, bigBlind: 2000, ante: 2000 },
    { smallBlind: 1500, bigBlind: 3000, ante: 3000 },
    { smallBlind: 2000, bigBlind: 4000, ante: 4000 },
    { smallBlind: 3000, bigBlind: 6000, ante: 6000 },
    { smallBlind: 5000, bigBlind: 10000, ante: 10000 },
    { smallBlind: 7000, bigBlind: 15000, ante: 15000 },
    { smallBlind: 10000, bigBlind: 20000, ante: 20000 },
    { smallBlind: 15000, bigBlind: 30000, ante: 30000 },
    { smallBlind: 20000, bigBlind: 40000, ante: 40000 },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
```

### 4.4 ハイパーターボトーナメント

```typescript
export const HYPER_TURBO_PRESET: Preset = {
  id: 'preset_default_hyperturbo' as PresetId,
  name: 'Hyper Turbo (10min/20k Start)',
  type: 'custom',
  levelDuration: 10 * 60, // 10分
  breakConfig: {
    enabled: false,
    frequency: 6,
    duration: 300, // 5分
  },
  blindLevels: [
    { smallBlind: 100, bigBlind: 200, ante: 200 },
    { smallBlind: 200, bigBlind: 400, ante: 400 },
    { smallBlind: 400, bigBlind: 800, ante: 800 },
    { smallBlind: 600, bigBlind: 1200, ante: 1200 },
    { smallBlind: 1000, bigBlind: 2000, ante: 2000 },
    { smallBlind: 1500, bigBlind: 3000, ante: 3000 },
    { smallBlind: 2500, bigBlind: 5000, ante: 5000 },
    { smallBlind: 4000, bigBlind: 8000, ante: 8000 },
    { smallBlind: 6000, bigBlind: 12000, ante: 12000 },
    { smallBlind: 10000, bigBlind: 20000, ante: 20000 },
    { smallBlind: 15000, bigBlind: 30000, ante: 30000 },
    { smallBlind: 25000, bigBlind: 50000, ante: 50000 },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
```

### 4.5 デフォルトプリセット配列

```typescript
/**
 * すべてのデフォルトプリセット
 */
export const DEFAULT_PRESETS: Preset[] = [
  DEEPSTACK_PRESET,
  STANDARD_PRESET,
  TURBO_PRESET,
  HYPER_TURBO_PRESET,
];

/**
 * デフォルトプリセットかどうかを判定
 */
export function isDefaultPreset(presetId: PresetId): boolean {
  return presetId.startsWith('preset_default_');
}
```

## 5. localStorage スキーマ

### 5.1 キー命名規則

すべてのキーは `poker-timer:` プレフィックスを持ちます。

```typescript
export const STORAGE_KEYS = {
  PRESETS: 'poker-timer:presets',
  SETTINGS: 'poker-timer:settings',
  VERSION: 'poker-timer:version',
} as const;
```

### 5.2 バージョニング

```typescript
/**
 * ストレージスキーマバージョン
 */
export const STORAGE_VERSION = 1;

/**
 * バージョン情報
 */
export interface StorageVersion {
  version: number;
  lastUpdated: number;
}
```

### 5.3 プリセットストレージスキーマ

```typescript
/**
 * プリセット保存形式
 */
export interface StoredPresets {
  version: number;
  presets: Preset[];
  lastUpdated: number;
}

/**
 * プリセットのシリアライズ
 */
export function serializePresets(presets: Preset[]): string {
  const data: StoredPresets = {
    version: STORAGE_VERSION,
    presets,
    lastUpdated: Date.now(),
  };
  return JSON.stringify(data);
}

/**
 * プリセットのデシリアライズ
 */
export function deserializePresets(json: string): Preset[] {
  try {
    const data: StoredPresets = JSON.parse(json);

    // バージョンチェック
    if (data.version !== STORAGE_VERSION) {
      // マイグレーション処理（必要に応じて）
      return migratePresets(data);
    }

    // バリデーション
    if (!Array.isArray(data.presets)) {
      throw new Error('Invalid presets format');
    }

    return data.presets.filter(isValidPreset);
  } catch (error) {
    console.error('Failed to deserialize presets:', error);
    return DEFAULT_PRESETS;
  }
}

/**
 * プリセットのマイグレーション（将来のバージョンアップ用）
 */
function migratePresets(data: StoredPresets): Preset[] {
  // 現在はバージョン1のみなので、そのまま返す
  return data.presets;
}
```

### 5.4 設定ストレージスキーマ

```typescript
/**
 * 設定保存形式
 */
export interface StoredSettings {
  version: number;
  theme: Theme;
  soundEnabled: boolean;
  lastUpdated: number;
}

/**
 * 設定のシリアライズ
 */
export function serializeSettings(settings: Settings): string {
  const data: StoredSettings = {
    version: STORAGE_VERSION,
    theme: settings.theme,
    soundEnabled: settings.soundEnabled,
    lastUpdated: Date.now(),
  };
  return JSON.stringify(data);
}

/**
 * 設定のデシリアライズ
 */
export function deserializeSettings(json: string): Partial<Settings> {
  try {
    const data: StoredSettings = JSON.parse(json);

    // バージョンチェック
    if (data.version !== STORAGE_VERSION) {
      // マイグレーション処理
      return migrateSettings(data);
    }

    return {
      theme: data.theme,
      soundEnabled: data.soundEnabled,
    };
  } catch (error) {
    console.error('Failed to deserialize settings:', error);
    return {};
  }
}

/**
 * 設定のマイグレーション
 */
function migrateSettings(data: StoredSettings): Partial<Settings> {
  return {
    theme: data.theme,
    soundEnabled: data.soundEnabled,
  };
}
```

### 5.5 ストレージ容量管理

```typescript
/**
 * プリセット最大保存数
 */
export const MAX_PRESETS = 50;

/**
 * ストレージ容量チェック
 */
export function checkStorageQuota(presets: Preset[]): boolean {
  if (presets.length > MAX_PRESETS) {
    return false;
  }

  try {
    const serialized = serializePresets(presets);
    // localStorage の一般的な制限は5MB
    // 余裕を持って1MB以下に抑える
    return serialized.length < 1024 * 1024;
  } catch {
    return false;
  }
}
```

## 6. データバリデーション

### 6.1 入力バリデーション関数

```typescript
/**
 * ブラインド値のバリデーション
 */
export interface BlindValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateBlindInput(
  sb: string,
  bb: string,
  ante: string
): BlindValidationResult {
  const errors: string[] = [];

  const sbNum = parseInt(sb, 10);
  const bbNum = parseInt(bb, 10);
  const anteNum = parseInt(ante, 10);

  if (isNaN(sbNum) || sbNum <= 0) {
    errors.push('スモールブラインドは正の整数である必要があります');
  }

  if (isNaN(bbNum) || bbNum <= 0) {
    errors.push('ビッグブラインドは正の整数である必要があります');
  }

  if (isNaN(anteNum) || anteNum < 0) {
    errors.push('アンティは0以上の整数である必要があります');
  }

  if (!isNaN(sbNum) && !isNaN(bbNum) && bbNum < sbNum) {
    errors.push('ビッグブラインドはスモールブラインド以上である必要があります');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * プリセット名のバリデーション
 */
export function validatePresetName(name: string): BlindValidationResult {
  const errors: string[] = [];

  if (name.trim().length === 0) {
    errors.push('プリセット名を入力してください');
  }

  if (name.length > 50) {
    errors.push('プリセット名は50文字以内で入力してください');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * レベル時間のバリデーション
 */
export function validateLevelDuration(minutes: number): BlindValidationResult {
  const errors: string[] = [];

  if (!Number.isInteger(minutes)) {
    errors.push('レベル時間は整数で入力してください');
  }

  if (minutes < 1) {
    errors.push('レベル時間は1分以上である必要があります');
  }

  if (minutes > 60) {
    errors.push('レベル時間は60分以下である必要があります');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### 6.2 インポートデータのバリデーション

```typescript
/**
 * インポートデータの型ガード
 */
export function isImportedPreset(data: unknown): data is Preset {
  if (typeof data !== 'object' || data === null) return false;

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.levelDuration === 'number' &&
    Array.isArray(obj.blindLevels) &&
    obj.blindLevels.every((level: unknown) => {
      const l = level as Record<string, unknown>;
      return (
        typeof l.smallBlind === 'number' &&
        typeof l.bigBlind === 'number' &&
        typeof l.ante === 'number'
      );
    })
  );
}

/**
 * インポートデータのバリデーション
 */
export function validateImportData(json: string): {
  valid: boolean;
  preset?: Preset;
  error?: string;
} {
  try {
    const data = JSON.parse(json);

    if (!isImportedPreset(data)) {
      return { valid: false, error: '無効なファイル形式です' };
    }

    if (!isValidPreset(data)) {
      return { valid: false, error: 'データの整合性チェックに失敗しました' };
    }

    // インポート時は新しいIDを生成
    const preset: Preset = {
      ...data,
      id: generatePresetId(),
      type: 'custom',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return { valid: true, preset };
  } catch (error) {
    return { valid: false, error: 'JSONの解析に失敗しました' };
  }
}
```

## 7. ユーティリティ関数

### 7.1 時間フォーマット

```typescript
/**
 * 秒をMM:SS形式にフォーマット
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 秒を分に変換（表示用）
 */
export function secondsToMinutes(seconds: number): number {
  return Math.floor(seconds / 60);
}

/**
 * 分を秒に変換（保存用）
 */
export function minutesToSeconds(minutes: number): number {
  return minutes * 60;
}
```

### 7.2 数値フォーマット

```typescript
/**
 * ブラインド値をカンマ区切りでフォーマット
 */
export function formatBlindValue(value: number): string {
  return value.toLocaleString('ja-JP');
}
```

## 8. テストデータ

### 8.1 モックデータ

```typescript
/**
 * テスト用トーナメント
 */
export function createMockTournament(): Tournament {
  return {
    currentLevel: 0,
    blindLevels: STANDARD_PRESET.blindLevels,
    levelDuration: 15 * 60,
    timer: createInitialTimer(15 * 60),
    breakConfig: DEFAULT_BREAK_CONFIG,
    isBreak: false,
    activePresetId: STANDARD_PRESET.id,
  };
}

/**
 * テスト用プリセット
 */
export function createMockPreset(overrides?: Partial<Preset>): Preset {
  return {
    id: generatePresetId(),
    name: 'Test Preset',
    type: 'custom',
    levelDuration: 10 * 60,
    breakConfig: DEFAULT_BREAK_CONFIG,
    blindLevels: [
      { smallBlind: 25, bigBlind: 50, ante: 0 },
      { smallBlind: 50, bigBlind: 100, ante: 0 },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}
```

## 9. 型安全性のベストプラクティス

### 9.1 Readonly の活用

```typescript
// ❌ 悪い例
export interface BlindLevel {
  smallBlind: number;
  bigBlind: number;
  ante: number;
}

// ✅ 良い例
export interface BlindLevel {
  readonly smallBlind: number;
  readonly bigBlind: number;
  readonly ante: number;
}
```

### 9.2 Union Types の活用

```typescript
// ✅ 状態を型で表現
export type TimerStatus = 'idle' | 'running' | 'paused';

// ❌ マジックストリングは避ける
if (timer.status === 'running') { ... }
```

### 9.3 Type Guards の活用

```typescript
export function isBreakLevel(tournament: Tournament): boolean {
  return tournament.isBreak;
}

export function hasNextLevel(tournament: Tournament): boolean {
  return tournament.currentLevel < tournament.blindLevels.length - 1;
}
```

## 10. アベレージスタック関連のデータモデル

### 10.1 Structure（ストラクチャー）型への初期スタック追加

トーナメントのアベレージスタック（平均チップ量）を算出するため、ストラクチャーに初期スタックフィールドを追加する。

```typescript
export interface Preset {
  id: PresetId;
  name: string;
  type: PresetType;
  blindLevels: BlindLevel[];
  levelDuration: number;      // 秒
  breakConfig: BreakConfig;
  initialStack: number;       // 初期スタック（チップ数）。0 = 未設定
  createdAt: number;
  updatedAt: number;
}
```

**`initialStack` フィールド仕様:**

| 項目 | 値 |
|------|-----|
| 型 | `number` |
| 最小値 | 0（未設定を意味する） |
| 最大値 | 10,000,000 |
| デフォルト値 | 0 |
| バリデーション | 0以上の整数 |

**バリデーション関数:**

```typescript
export function isValidInitialStack(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 10_000_000;
}
```

### 10.2 デフォルトストラクチャーの初期スタック値

各デフォルトストラクチャーには名前に記載されている初期スタック値を設定する。

| ストラクチャー | 名前 | initialStack |
|---|---|---|
| Deepstack | Deepstack (30min/50k Start) | 50000 |
| Standard | Standard (20min/30k Start) | 30000 |
| Turbo | Turbo (15min/25k Start) | 25000 |
| Hyper Turbo | Hyper Turbo (10min/20k Start) | 20000 |

### 10.3 TournamentState へのプレイヤー数追加

トーナメント進行中のプレイヤー数を管理するため、TournamentState にフィールドを追加する。

```typescript
export interface Tournament {
  // 既存フィールド
  currentLevel: number;
  blindLevels: BlindLevel[];
  levelDuration: number;
  timer: Timer;
  breakConfig: BreakConfig;
  isBreak: boolean;
  activePresetId: string | null;

  // 追加フィールド
  totalPlayers: number;       // 参加人数（0 = 未設定）
  remainingPlayers: number;   // 残り人数
  initialStack: number;       // 現在のストラクチャーの初期スタック（参照用）
}
```

**`totalPlayers` フィールド仕様:**

| 項目 | 値 |
|------|-----|
| 型 | `number` |
| 最小値 | 0（未設定を意味する） |
| 最大値 | 10,000 |
| デフォルト値 | 0 |
| バリデーション | 0以上の整数 |

**`remainingPlayers` フィールド仕様:**

| 項目 | 値 |
|------|-----|
| 型 | `number` |
| 最小値 | 0 |
| 最大値 | totalPlayers 以下 |
| デフォルト値 | totalPlayers と同値 |
| バリデーション | 0以上かつ totalPlayers 以下の整数 |

**動作仕様:**

- `totalPlayers` を設定すると `remainingPlayers` も同値に初期化される
- `remainingPlayers` は `totalPlayers` を超えることができない（リバイ時は `totalPlayers` を先に増やす）
- ストラクチャーをロード（`LOAD_STRUCTURE`）すると `totalPlayers`, `remainingPlayers` は 0 にリセットされる
- タイマーリセット（`RESET`）では `remainingPlayers` を `totalPlayers` にリセットする

### 10.4 アベレージスタック計算（ドメインロジック）

```typescript
/**
 * アベレージスタックを計算
 * @returns 平均チップ数（整数）。計算不可の場合は null
 */
export function calculateAverageStack(
  initialStack: number,
  totalPlayers: number,
  remainingPlayers: number
): number | null {
  if (initialStack <= 0 || totalPlayers <= 0 || remainingPlayers <= 0) {
    return null;
  }
  return Math.round((initialStack * totalPlayers) / remainingPlayers);
}

/**
 * アベレージスタックのBB換算
 * @returns BB数（小数第1位まで）。計算不可の場合は null
 */
export function calculateAverageStackBB(
  averageStack: number,
  bigBlind: number
): number | null {
  if (averageStack <= 0 || bigBlind <= 0) {
    return null;
  }
  return Math.round((averageStack / bigBlind) * 10) / 10;
}

/**
 * アベレージスタック表示の可否判定
 */
export function canCalculateAverageStack(
  initialStack: number,
  totalPlayers: number,
  remainingPlayers: number
): boolean {
  return initialStack > 0 && totalPlayers > 0 && remainingPlayers > 0;
}
```

### 10.5 localStorage スキーマの後方互換性

既存の localStorage データには `initialStack`, `totalPlayers`, `remainingPlayers` フィールドが存在しない。デシリアライズ時にこれらのフィールドがない場合はデフォルト値（0）で補完する。

```typescript
// ストラクチャーのデシリアライズ時
function deserializeStructure(data: unknown): Preset {
  const structure = data as Preset;
  return {
    ...structure,
    initialStack: structure.initialStack ?? 0,  // 後方互換性
  };
}

// トーナメント状態のデシリアライズ時
function deserializeTournamentState(data: unknown): Tournament {
  const state = data as Tournament;
  return {
    ...state,
    totalPlayers: state.totalPlayers ?? 0,            // 後方互換性
    remainingPlayers: state.remainingPlayers ?? 0,     // 後方互換性
    initialStack: state.initialStack ?? 0,             // 後方互換性
  };
}
```

## 11. まとめ

本データモデル仕様では以下を定義しました：

1. **型定義**: すべてのドメインモデルのTypeScript型
2. **デフォルトデータ**: 4つのプリセット（ディープスタック、スタンダード、ターボ、ハイパーターボ）
3. **localStorage スキーマ**: データ永続化の形式
4. **バリデーション**: 入力とインポートデータの検証
5. **ユーティリティ**: 時間・数値フォーマット関数
6. **アベレージスタック**: 初期スタック・プレイヤー数のデータモデルと計算ロジック

---

## 関連ドキュメント

- [01-architecture.md](./01-architecture.md) - システムアーキテクチャ
- [features/storage.md](./features/storage.md) - データ永続化の実装詳細
- [features/presets.md](./features/presets.md) - プリセット管理機能
- [features/average-stack.md](./features/average-stack.md) - アベレージスタック機能

---

## 改訂履歴

| バージョン | 日付       | 変更内容 | 作成者              |
| ---------- | ---------- | -------- | ------------------- |
| 1.0        | 2026-01-26 | 初版作成 | AI System Architect |
| 1.1        | 2026-02-09 | アベレージスタック関連のデータモデル追加（セクション10） | AI System Architect |
