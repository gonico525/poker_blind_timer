# データ永続化機能仕様

## 1. 概要

データ永続化機能は、ユーザーの設定とプリセットをlocalStorageに保存し、次回起動時に復元します。

## 2. 機能要件

### 2.1 保存対象

| データ | キー | 自動保存 | 初期値 |
|--------|------|---------|--------|
| プリセット一覧 | `poker-timer:presets` | ✓ | デフォルトプリセット |
| テーマ設定 | `poker-timer:settings` | ✓ | `system` |
| 音声設定 | `poker-timer:settings` | ✓ | `true` |
| 休憩設定 | `poker-timer:settings` | ✓ | デフォルト値 |

### 2.2 保存しないデータ

以下はセッション限りで、永続化しません：

- タイマー状態（running/paused/idle）
- 残り時間
- 現在のレベル
- 経過時間

**理由**: ブラウザを閉じたら、次回は新しいトーナメントとして開始するのが自然。

## 3. localStorage スキーマ

### 3.1 キー命名規則

すべてのキーに `poker-timer:` プレフィックスを付けます。

```typescript
export const STORAGE_KEYS = {
  PRESETS: 'poker-timer:presets',
  SETTINGS: 'poker-timer:settings',
  VERSION: 'poker-timer:version',
} as const;
```

### 3.2 バージョン管理

```typescript
export const STORAGE_VERSION = 1;

export interface StorageVersion {
  version: number;
  lastUpdated: number;
}
```

詳細は [02-data-models.md](../02-data-models.md#5-localstorage-スキーマ) を参照。

## 4. StorageService 実装

### 4.1 基本実装

```typescript
/**
 * localStorage操作を抽象化するサービス
 */
export class StorageService {
  /**
   * データを保存
   */
  setItem<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded');
        throw new Error('ストレージ容量が不足しています');
      }
      throw error;
    }
  }

  /**
   * データを取得
   */
  getItem<T>(key: string): T | null {
    try {
      const serialized = localStorage.getItem(key);
      if (serialized === null) {
        return null;
      }
      return JSON.parse(serialized) as T;
    } catch (error) {
      console.error(`Failed to parse localStorage item: ${key}`, error);
      return null;
    }
  }

  /**
   * データを削除
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * すべてのアプリデータを削除
   */
  clear(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      this.removeItem(key);
    });
  }

  /**
   * ストレージが利用可能かチェック
   */
  isAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 使用容量を取得（概算）
   */
  getUsageBytes(): number {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('poker-timer:')) {
        const value = localStorage.getItem(key);
        if (value) {
          total += key.length + value.length;
        }
      }
    }
    return total * 2; // JavaScriptの文字列はUTF-16（2バイト/文字）
  }
}

export const storageService = new StorageService();
```

### 4.2 PresetStorage

```typescript
import { Preset, PresetId } from '@/types/domain';
import { StorageService } from './StorageService';
import {
  serializePresets,
  deserializePresets,
  DEFAULT_PRESETS,
} from '@/domain/models/Preset';
import { STORAGE_KEYS } from '@/utils/constants';

export class PresetStorage {
  constructor(private storage: StorageService) {}

  /**
   * プリセット一覧を保存
   */
  savePresets(presets: Preset[]): void {
    const serialized = serializePresets(presets);
    this.storage.setItem(STORAGE_KEYS.PRESETS, serialized);
  }

  /**
   * プリセット一覧を読み込み
   */
  loadPresets(): Preset[] {
    const serialized = this.storage.getItem<string>(STORAGE_KEYS.PRESETS);

    if (!serialized) {
      // 初回起動時はデフォルトプリセットのみ
      return DEFAULT_PRESETS;
    }

    const customPresets = deserializePresets(serialized);

    // デフォルトプリセットとマージ
    return this.mergeWithDefaults(customPresets);
  }

  /**
   * デフォルトプリセットとカスタムプリセットを統合
   */
  private mergeWithDefaults(customPresets: Preset[]): Preset[] {
    // デフォルトプリセット以外を抽出
    const nonDefaultPresets = customPresets.filter(
      (p) => !p.id.startsWith('preset_default_')
    );

    // デフォルトプリセットを先頭に配置
    return [...DEFAULT_PRESETS, ...nonDefaultPresets];
  }

  /**
   * 特定のプリセットを削除
   */
  deletePreset(presets: Preset[], presetId: PresetId): Preset[] {
    const updated = presets.filter((p) => p.id !== presetId);
    this.savePresets(updated);
    return updated;
  }
}

export const presetStorage = new PresetStorage(storageService);
```

### 4.3 SettingsStorage

```typescript
import { Settings, Theme } from '@/types/domain';
import { StorageService } from './StorageService';
import {
  serializeSettings,
  deserializeSettings,
  DEFAULT_SETTINGS,
} from '@/domain/models/Settings';
import { STORAGE_KEYS } from '@/utils/constants';

export class SettingsStorage {
  constructor(private storage: StorageService) {}

  /**
   * 設定を保存
   */
  saveSettings(settings: Settings): void {
    const serialized = serializeSettings(settings);
    this.storage.setItem(STORAGE_KEYS.SETTINGS, serialized);
  }

  /**
   * 設定を読み込み
   */
  loadSettings(): Settings {
    const serialized = this.storage.getItem<string>(STORAGE_KEYS.SETTINGS);

    if (!serialized) {
      return this.getDefaultSettings();
    }

    const partial = deserializeSettings(serialized);

    // デフォルト値とマージ
    return {
      ...DEFAULT_SETTINGS,
      ...partial,
    };
  }

  /**
   * デフォルト設定を取得
   */
  private getDefaultSettings(): Settings {
    // システムのカラースキームを検出
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    return {
      ...DEFAULT_SETTINGS,
      theme: 'system', // 初回はシステム設定に従う
    };
  }
}

export const settingsStorage = new SettingsStorage(storageService);
```

## 5. Context での自動保存

### 5.1 SettingsContext

```typescript
import { createContext, useContext, useReducer, useEffect } from 'react';
import { settingsStorage } from '@/services/storage/SettingsStorage';
import { presetStorage } from '@/services/storage/PresetStorage';

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(settingsReducer, null, () => {
    // 初期化時にlocalStorageから読み込み
    const settings = settingsStorage.loadSettings();
    const presets = presetStorage.loadPresets();

    return {
      ...settings,
      presets,
    };
  });

  // 設定の自動保存
  useEffect(() => {
    settingsStorage.saveSettings({
      theme: state.theme,
      soundEnabled: state.soundEnabled,
    });
  }, [state.theme, state.soundEnabled]);

  // プリセットの自動保存
  useEffect(() => {
    presetStorage.savePresets(state.presets);
  }, [state.presets]);

  return (
    <SettingsContext.Provider value={{ state, dispatch }}>
      {children}
    </SettingsContext.Provider>
  );
}
```

### 5.2 デバウンス処理（オプション）

頻繁な保存を避けるため、デバウンス処理を追加できます。

```typescript
import { useEffect, useRef } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 使用例
const debouncedPresets = useDebounce(state.presets, 500);

useEffect(() => {
  presetStorage.savePresets(debouncedPresets);
}, [debouncedPresets]);
```

## 6. マイグレーション

### 6.1 バージョン管理

```typescript
/**
 * ストレージバージョンをチェックしてマイグレーション
 */
export function migrateStorage(): void {
  const currentVersion = storageService.getItem<StorageVersion>(STORAGE_KEYS.VERSION);

  if (!currentVersion) {
    // 初回起動
    storageService.setItem(STORAGE_KEYS.VERSION, {
      version: STORAGE_VERSION,
      lastUpdated: Date.now(),
    });
    return;
  }

  if (currentVersion.version < STORAGE_VERSION) {
    // マイグレーション実行
    performMigration(currentVersion.version, STORAGE_VERSION);

    // バージョン更新
    storageService.setItem(STORAGE_KEYS.VERSION, {
      version: STORAGE_VERSION,
      lastUpdated: Date.now(),
    });
  }
}

/**
 * バージョン間のマイグレーション
 */
function performMigration(fromVersion: number, toVersion: number): void {
  console.log(`Migrating storage from v${fromVersion} to v${toVersion}`);

  // バージョン1→2のマイグレーション例
  if (fromVersion === 1 && toVersion === 2) {
    // 新しいフィールドを追加、など
  }
}
```

### 6.2 アプリ起動時の初期化

```typescript
// main.tsx または App.tsx
import { migrateStorage } from '@/services/storage/migration';

// アプリ起動時に実行
migrateStorage();
```

## 7. エラーハンドリング

### 7.1 容量超過エラー

```typescript
try {
  presetStorage.savePresets(presets);
} catch (error) {
  if (error.message.includes('容量')) {
    alert(
      'ストレージ容量が不足しています。\n' +
      '不要なプリセットを削除するか、データをエクスポートしてください。'
    );
  }
}
```

### 7.2 データ破損

```typescript
/**
 * ストレージデータの整合性チェック
 */
export function validateStorage(): boolean {
  try {
    const presets = presetStorage.loadPresets();
    const settings = settingsStorage.loadSettings();

    // 基本的なバリデーション
    if (!Array.isArray(presets)) {
      throw new Error('Invalid presets data');
    }

    if (typeof settings.theme !== 'string') {
      throw new Error('Invalid settings data');
    }

    return true;
  } catch (error) {
    console.error('Storage validation failed:', error);
    return false;
  }
}

/**
 * ストレージをリセット
 */
export function resetStorage(): void {
  if (window.confirm('すべての設定をリセットしますか？\nこの操作は取り消せません。')) {
    storageService.clear();
    window.location.reload();
  }
}
```

## 8. インポート/エクスポート

### 8.1 すべてのデータをエクスポート

```typescript
/**
 * すべての設定をJSONでエクスポート
 */
export function exportAllData(): string {
  const presets = presetStorage.loadPresets();
  const settings = settingsStorage.loadSettings();

  const data = {
    version: STORAGE_VERSION,
    exportedAt: Date.now(),
    presets,
    settings,
  };

  return JSON.stringify(data, null, 2);
}

/**
 * エクスポートデータをダウンロード
 */
export function downloadExport(): void {
  const json = exportAllData();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `poker-timer-backup-${Date.now()}.json`;
  a.click();

  URL.revokeObjectURL(url);
}
```

### 8.2 データをインポート

```typescript
/**
 * バックアップデータをインポート
 */
export function importAllData(json: string): void {
  try {
    const data = JSON.parse(json);

    // バリデーション
    if (!data.presets || !data.settings) {
      throw new Error('Invalid backup data');
    }

    // インポート
    presetStorage.savePresets(data.presets);
    settingsStorage.saveSettings(data.settings);

    alert('データをインポートしました。ページを再読み込みします。');
    window.location.reload();
  } catch (error) {
    alert('インポートに失敗しました。ファイルが正しいか確認してください。');
    console.error('Import error:', error);
  }
}
```

## 9. ストレージ容量管理

### 9.1 使用量の監視

```typescript
/**
 * ストレージ使用状況を取得
 */
export function getStorageInfo(): {
  usedBytes: number;
  usedKB: number;
  usedMB: number;
  estimatedLimit: number;
} {
  const usedBytes = storageService.getUsageBytes();

  return {
    usedBytes,
    usedKB: Math.round(usedBytes / 1024),
    usedMB: Math.round(usedBytes / 1024 / 1024 * 100) / 100,
    estimatedLimit: 5 * 1024 * 1024, // 一般的な制限: 5MB
  };
}
```

### 9.2 UI での表示

```typescript
import React from 'react';
import { getStorageInfo } from '@/services/storage/utils';

export const StorageInfo: React.FC = () => {
  const info = getStorageInfo();
  const percentage = (info.usedBytes / info.estimatedLimit) * 100;

  return (
    <div className={styles.storageInfo}>
      <h4>ストレージ使用状況</h4>
      <div className={styles.progress}>
        <div
          className={styles.progressBar}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p>
        {info.usedKB} KB / 約 5 MB 使用中
      </p>
    </div>
  );
};
```

## 10. テストケース

### 10.1 StorageService テスト

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '@/services/storage/StorageService';

describe('StorageService', () => {
  let storage: StorageService;

  beforeEach(() => {
    localStorage.clear();
    storage = new StorageService();
  });

  it('データを保存・取得できる', () => {
    const data = { foo: 'bar' };
    storage.setItem('test-key', data);

    const retrieved = storage.getItem<{ foo: string }>('test-key');
    expect(retrieved).toEqual(data);
  });

  it('存在しないキーはnullを返す', () => {
    const retrieved = storage.getItem('non-existent');
    expect(retrieved).toBeNull();
  });

  it('データを削除できる', () => {
    storage.setItem('test-key', { foo: 'bar' });
    storage.removeItem('test-key');

    const retrieved = storage.getItem('test-key');
    expect(retrieved).toBeNull();
  });
});
```

## 11. セキュリティ考慮事項

### 11.1 データの暗号化

**初期バージョンでは不要**

理由:
- すべてローカルに保存（外部送信なし）
- 機密情報を含まない（ブラインド構造のみ）

### 11.2 XSS対策

- localStorage から読み込んだデータは必ずバリデーション
- JSONパース時のエラーハンドリング

## 12. まとめ

データ永続化機能の主要な実装ポイント：

1. **localStorage 抽象化**: StorageServiceで操作を集約
2. **自動保存**: Context の useEffect で変更を監視
3. **バージョン管理**: スキーマ変更時のマイグレーション
4. **エラーハンドリング**: 容量超過、データ破損への対応
5. **インポート/エクスポート**: バックアップとリストア機能

---

## 関連ドキュメント

- [02-data-models.md](../02-data-models.md) - localStorage スキーマ詳細
- [presets.md](./presets.md) - プリセット管理との連携

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2026-01-26 | 初版作成 | AI System Architect |
