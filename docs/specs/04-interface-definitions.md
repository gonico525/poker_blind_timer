# インターフェース定義書

本ドキュメントは、並行開発における機能間の結合を円滑にするためのインターフェース定義を記載します。
各機能の実装者は、本ドキュメントの定義に従って実装してください。

---

## 目次

1. [Context間アクション責務マトリクス](#1-context間アクション責務マトリクス)
2. [イベント通知メカニズム](#2-イベント通知メカニズム)
3. [共通モジュール配置](#3-共通モジュール配置)
4. [初期化シーケンス](#4-初期化シーケンス)
5. [グローバル通知システム](#5-グローバル通知システム)
6. [休憩フローの状態遷移](#6-休憩フローの状態遷移)
7. [音声ファイル準備方針](#7-音声ファイル準備方針)
8. [型エクスポート戦略](#8-型エクスポート戦略)
9. [機能間依存関係図](#9-機能間依存関係図)

---

## 1. Context間アクション責務マトリクス

### 1.1 Contextの役割分担

| Context | 責務 | 管理する状態 |
|---------|------|-------------|
| **TournamentContext** | トーナメントの進行状態を管理 | timer, currentLevel, blindLevels, breakConfig, isOnBreak |
| **SettingsContext** | アプリ設定・プリセットを管理 | presets, settings (theme, sound, volume) |

### 1.2 アクション発行元と処理先

以下のマトリクスに従ってアクションを実装してください。

#### TournamentContext のアクション

| アクション | 発行元 | 処理内容 | 副作用 |
|-----------|--------|---------|--------|
| `START` | TimerControls, KeyboardService | タイマー開始 | - |
| `PAUSE` | TimerControls, KeyboardService | タイマー一時停止 | - |
| `RESET` | TimerControls, KeyboardService | 現在レベルのタイマーリセット | - |
| `TICK` | useTimer内部（setInterval） | 残り時間を1秒減らす | 警告・レベル変更を検知 |
| `NEXT_LEVEL` | TimerControls, KeyboardService, 自動進行 | 次のレベルに進む | 休憩判定を実行 |
| `PREV_LEVEL` | TimerControls, KeyboardService | 前のレベルに戻る | - |
| `START_BREAK` | TICK/NEXT_LEVEL の処理内 | 休憩を開始 | - |
| `END_BREAK` | 休憩タイマー終了時 | 休憩を終了 | - |
| `SKIP_BREAK` | BreakDisplay | 休憩をスキップ | - |
| `LOAD_PRESET` | SettingsContext経由 | プリセットのブラインド構造を適用 | タイマーをリセット、プレイヤー数を0にリセット |
| `UPDATE_BLIND_LEVELS` | BlindEditor | ブラインドレベルを更新 | - |
| `UPDATE_BREAK_CONFIG` | BreakSettings | 休憩設定を更新 | - |
| `UPDATE_LEVEL_DURATION` | TimerSettings | レベル時間を更新 | - |
| `SET_PLAYERS` | AverageStackDisplay | 参加人数・残り人数を設定 | アベレージスタック表示を更新 |

#### SettingsContext のアクション

| アクション | 発行元 | 処理内容 | 副作用 |
|-----------|--------|---------|--------|
| `SET_THEME` | ThemeToggle | テーマ切り替え | localStorage保存 |
| `SET_SOUND_ENABLED` | SoundToggle | 音声ON/OFF | localStorage保存 |
| `SET_VOLUME` | VolumeSlider | 音量設定 | localStorage保存 |
| `ADD_PRESET` | PresetManager | プリセット追加 | localStorage保存 |
| `UPDATE_PRESET` | PresetManager | プリセット更新 | localStorage保存 |
| `DELETE_PRESET` | PresetManager | プリセット削除 | localStorage保存 |
| `IMPORT_PRESETS` | ImportExport | プリセットインポート | localStorage保存 |

### 1.3 LOAD_PRESETの処理フロー

`LOAD_PRESET` は複数のContextに跨る処理のため、特別なフローを定義します。

```
[ユーザーがプリセットを選択]
         │
         ▼
[SettingsContext: loadPreset() 呼び出し]
         │
         ├─→ 選択されたプリセットを current として記録
         │
         ▼
[TournamentContext: dispatch({ type: 'LOAD_PRESET', payload: { preset } })]
         │
         ├─→ blindLevels を preset.blindLevels で上書き
         ├─→ breakConfig を preset.breakConfig で上書き
         ├─→ levelDuration を preset.levelDuration で上書き
         ├─→ initialStack を preset.initialStack で上書き
         ├─→ currentLevel を 0 にリセット
         ├─→ totalPlayers を 0 にリセット
         ├─→ remainingPlayers を 0 にリセット
         └─→ timer を idle 状態にリセット
```

**実装コード例**:

```typescript
// src/contexts/SettingsContext.tsx
const loadPreset = useCallback((presetId: PresetId) => {
  const preset = state.presets.find(p => p.id === presetId);
  if (!preset) return;

  // SettingsContext内で現在選択中のプリセットを記録
  dispatch({ type: 'SET_CURRENT_PRESET', payload: { presetId } });

  // TournamentContextに通知（親コンポーネントでconnect）
  onPresetLoad?.(preset);
}, [state.presets, onPresetLoad]);

// src/App.tsx
const handlePresetLoad = useCallback((preset: Preset) => {
  tournamentDispatch({ type: 'LOAD_PRESET', payload: { preset } });
}, [tournamentDispatch]);

<SettingsProvider onPresetLoad={handlePresetLoad}>
  ...
</SettingsProvider>
```

---

## 2. イベント通知メカニズム

### 2.1 採用する方式

**フック内監視方式（方式A）** を採用します。

Reducer内からの直接呼び出しは行わず、useEffect でタイマー状態を監視して副作用を発火させます。

**理由**:
- Reducerを純粋関数に保てる
- テストが容易
- デバッグしやすい

### 2.2 イベント通知のシーケンス

#### タイマー → 音声通知

```
[useTimer: TICK dispatch]
         │
         ▼
[TournamentContext: state.timer.remainingTime 更新]
         │
         ▼
[useAudioNotification: useEffect で remainingTime を監視]
         │
         ├─ remainingTime === 60 && prevRemainingTime > 60
         │    └─→ playWarning1Min()
         │
         ├─ remainingTime === 0 && prevRemainingTime > 0
         │    └─→ playLevelChange()
         │
         └─ isOnBreak === true && prevIsOnBreak === false
              └─→ playBreakStart()
```

**実装コード例**:

```typescript
// src/hooks/useAudioNotification.ts
export function useAudioNotification() {
  const { state } = useTournament();
  const { settings } = useSettings();
  const prevRemainingTime = useRef(state.timer.remainingTime);
  const prevIsOnBreak = useRef(state.isOnBreak);

  useEffect(() => {
    if (!settings.soundEnabled) return;

    const prev = prevRemainingTime.current;
    const current = state.timer.remainingTime;

    // 残り1分警告（61秒以上 → 60秒以下に変化）
    if (prev > 60 && current <= 60 && current > 0) {
      AudioService.playWarning1Min();
    }

    // レベル変更通知（1秒以上 → 0秒に変化）
    if (prev > 0 && current === 0) {
      AudioService.playLevelChange();
    }

    prevRemainingTime.current = current;
  }, [state.timer.remainingTime, settings.soundEnabled]);

  useEffect(() => {
    if (!settings.soundEnabled) return;

    // 休憩開始通知
    if (!prevIsOnBreak.current && state.isOnBreak) {
      AudioService.playBreakStart();
    }

    prevIsOnBreak.current = state.isOnBreak;
  }, [state.isOnBreak, settings.soundEnabled]);
}
```

### 2.3 イベント一覧

| イベント | トリガー条件 | 処理 |
|---------|-------------|------|
| WARNING_1MIN | remainingTime が 60 を下回った | 警告音再生 |
| LEVEL_CHANGE | remainingTime が 0 になった | レベル変更音再生 |
| BREAK_START | isOnBreak が false → true | 休憩開始音再生 |
| BREAK_END | isOnBreak が true → false（任意） | 休憩終了音再生（オプション） |

---

## 3. 共通モジュール配置

### 3.1 ディレクトリ構造

```
src/
├── utils/
│   ├── index.ts              # 全ユーティリティの re-export
│   ├── timeFormat.ts         # 時間フォーマット関数
│   ├── blindFormat.ts        # ブラインドフォーマット関数
│   ├── validation.ts         # バリデーション関数
│   └── constants.ts          # 定数定義
├── types/
│   ├── index.ts              # 全型の re-export
│   └── domain.ts             # ドメイン型定義
├── services/
│   ├── index.ts              # 全サービスの re-export
│   ├── AudioService.ts       # 音声サービス
│   ├── StorageService.ts     # ストレージサービス
│   └── KeyboardService.ts    # キーボードサービス
└── ...
```

### 3.2 ユーティリティ関数の配置

#### src/utils/timeFormat.ts

```typescript
/**
 * 秒数を MM:SS 形式にフォーマット
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 秒数を H:MM:SS 形式にフォーマット（経過時間用）
 */
export function formatLongTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return formatTime(seconds);
}
```

#### src/utils/blindFormat.ts

```typescript
import type { BlindLevel } from '@/types';

/**
 * ブラインド金額をフォーマット（1000以上はK表記）
 */
export function formatBlindValue(value: number): string {
  if (value >= 1000) {
    return value % 1000 === 0
      ? `${value / 1000}K`
      : `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * ブラインドレベルをフォーマット（SB/BB (Ante)形式）
 */
export function formatBlindLevel(level: BlindLevel): string {
  const sb = formatBlindValue(level.smallBlind);
  const bb = formatBlindValue(level.bigBlind);

  if (level.ante > 0) {
    const ante = formatBlindValue(level.ante);
    return `${sb}/${bb} (${ante})`;
  }
  return `${sb}/${bb}`;
}
```

#### src/utils/validation.ts

```typescript
import type { BlindLevel, Preset, BreakConfig } from '@/types';

export function isValidBlindLevel(level: unknown): level is BlindLevel {
  if (typeof level !== 'object' || level === null) return false;
  const l = level as Record<string, unknown>;
  return (
    typeof l.smallBlind === 'number' && l.smallBlind > 0 &&
    typeof l.bigBlind === 'number' && l.bigBlind > 0 &&
    typeof l.ante === 'number' && l.ante >= 0
  );
}

export function isValidPreset(preset: unknown): preset is Preset {
  if (typeof preset !== 'object' || preset === null) return false;
  const p = preset as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    Array.isArray(p.blindLevels) &&
    p.blindLevels.every(isValidBlindLevel)
  );
}

export function validatePresetName(name: string): { valid: boolean; error?: string } {
  if (!name.trim()) {
    return { valid: false, error: 'プリセット名を入力してください' };
  }
  if (name.length > 50) {
    return { valid: false, error: 'プリセット名は50文字以内で入力してください' };
  }
  return { valid: true };
}

export function isValidBreakConfig(config: unknown): config is BreakConfig {
  if (typeof config !== 'object' || config === null) return false;
  const c = config as Record<string, unknown>;
  return (
    typeof c.enabled === 'boolean' &&
    typeof c.frequency === 'number' && c.frequency > 0 &&
    typeof c.duration === 'number' && c.duration > 0
  );
}
```

#### src/utils/constants.ts

```typescript
// ストレージキー
export const STORAGE_KEYS = {
  SETTINGS: 'poker-timer-settings',
  PRESETS: 'poker-timer-presets',
  TOURNAMENT_STATE: 'poker-timer-tournament',
} as const;

// 制限値
export const LIMITS = {
  MAX_PRESETS: 20,
  MAX_BLIND_LEVELS: 50,
  MIN_LEVEL_DURATION: 60,      // 1分
  MAX_LEVEL_DURATION: 3600,    // 60分
  MIN_BREAK_DURATION: 60,      // 1分
  MAX_BREAK_DURATION: 1800,    // 30分
  MIN_BREAK_FREQUENCY: 1,
  MAX_BREAK_FREQUENCY: 20,
} as const;

// デフォルト値
export const DEFAULTS = {
  LEVEL_DURATION: 600,         // 10分
  BREAK_DURATION: 600,         // 10分
  BREAK_FREQUENCY: 4,          // 4レベルごと
  VOLUME: 0.7,
} as const;

// 音声ファイルパス
export const AUDIO_FILES = {
  LEVEL_CHANGE: '/sounds/level-change.mp3',
  WARNING_1MIN: '/sounds/warning-1min.mp3',
  BREAK_START: '/sounds/break-start.mp3',
} as const;
```

#### src/utils/index.ts

```typescript
// 時間フォーマット
export { formatTime, formatLongTime } from './timeFormat';

// ブラインドフォーマット
export { formatBlindValue, formatBlindLevel } from './blindFormat';

// バリデーション
export {
  isValidBlindLevel,
  isValidPreset,
  isValidBreakConfig,
  validatePresetName,
} from './validation';

// 定数
export { STORAGE_KEYS, LIMITS, DEFAULTS, AUDIO_FILES } from './constants';
```

### 3.3 インポート方法

全てのインポートは `@/utils` からの統一パスを使用します。

```typescript
// ◎ 推奨
import { formatTime, formatBlindLevel, STORAGE_KEYS } from '@/utils';

// × 非推奨（直接参照は避ける）
import { formatTime } from '@/utils/timeFormat';
```

---

## 4. 初期化シーケンス

### 4.1 アプリ起動時のシーケンス図

```
App.tsx マウント
    │
    ▼
┌─────────────────────────────────────────┐
│ Phase 1: ストレージ可用性チェック           │
├─────────────────────────────────────────┤
│ StorageService.isAvailable()             │
│   └─ false の場合: 警告表示＋メモリのみモード │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ Phase 2: SettingsContext 初期化          │
├─────────────────────────────────────────┤
│ 1. settingsStorage.loadSettings()        │
│    └─ 失敗時: デフォルト設定を使用          │
│ 2. presetStorage.loadPresets()           │
│    └─ 失敗時: デフォルトプリセットのみ       │
│ 3. デフォルトプリセットをマージ             │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ Phase 3: TournamentContext 初期化        │
├─────────────────────────────────────────┤
│ 1. デフォルトプリセット（Standard）をロード  │
│ 2. timer を idle 状態で初期化             │
│ 3. currentLevel を 0 で初期化             │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ Phase 4: サービス初期化                   │
├─────────────────────────────────────────┤
│ 1. AudioService.preload()               │
│    └─ 音声ファイルをプリロード（非同期）     │
│ 2. KeyboardService.initialize()          │
│    └─ グローバルキーリスナー登録           │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ Phase 5: UI 準備完了                     │
├─────────────────────────────────────────┤
│ 1. ローディング表示を解除                  │
│ 2. メイン画面を表示                       │
└─────────────────────────────────────────┘
```

### 4.2 実装コード例

```typescript
// src/App.tsx
function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        // Phase 1: ストレージチェック
        if (!StorageService.isAvailable()) {
          console.warn('localStorage is not available. Data will not persist.');
        }

        // Phase 4: サービス初期化（Context初期化は Provider 内で自動実行）
        await AudioService.preload();
        KeyboardService.initialize();

        setIsInitialized(true);
      } catch (error) {
        setInitError('アプリの初期化に失敗しました');
        console.error('Initialization error:', error);
      }
    }

    initialize();

    // クリーンアップ
    return () => {
      KeyboardService.cleanup();
    };
  }, []);

  if (initError) {
    return <ErrorScreen message={initError} />;
  }

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <SettingsProvider>
      <TournamentProvider>
        <NotificationProvider>
          <MainLayout />
        </NotificationProvider>
      </TournamentProvider>
    </SettingsProvider>
  );
}
```

### 4.3 Context 初期化の詳細

#### SettingsContext の初期化

```typescript
// src/contexts/SettingsContext.tsx
function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(settingsReducer, null, () => {
    // 遅延初期化
    const savedSettings = settingsStorage.loadSettings();
    const savedPresets = presetStorage.loadPresets();

    // デフォルトプリセットをマージ
    const presets = mergeWithDefaultPresets(savedPresets);

    return {
      settings: savedSettings ?? DEFAULT_SETTINGS,
      presets,
      currentPresetId: presets[0]?.id ?? null,
    };
  });

  // ...
}
```

#### TournamentContext の初期化

```typescript
// src/contexts/TournamentContext.tsx
function TournamentProvider({ children }: { children: React.ReactNode }) {
  const { presets } = useSettings();

  const [state, dispatch] = useReducer(tournamentReducer, null, () => {
    // デフォルトプリセットで初期化
    const defaultPreset = presets.find(p => p.type === 'default') ?? presets[0];

    return {
      timer: {
        status: 'idle',
        remainingTime: defaultPreset?.levelDuration ?? DEFAULTS.LEVEL_DURATION,
        elapsedTime: 0,
      },
      currentLevel: 0,
      blindLevels: defaultPreset?.blindLevels ?? [],
      breakConfig: defaultPreset?.breakConfig ?? DEFAULT_BREAK_CONFIG,
      levelDuration: defaultPreset?.levelDuration ?? DEFAULTS.LEVEL_DURATION,
      isOnBreak: false,
    };
  });

  // ...
}
```

---

## 5. グローバル通知システム

### 5.1 NotificationContext の設計

ブラウザの `alert()` / `confirm()` を使用せず、カスタム通知UIを提供します。

#### 型定義

```typescript
// src/types/notification.ts
export type NotificationType = 'success' | 'warning' | 'error' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;  // ms, undefined = 手動で閉じるまで表示
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
}

export interface NotificationContextValue {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}
```

#### 使用例

```typescript
// 通知を表示
const { showNotification, showConfirm } = useNotification();

// 成功通知（3秒後に自動消去）
showNotification({
  type: 'success',
  message: 'プリセットを保存しました',
  duration: 3000,
});

// エラー通知（手動で閉じるまで表示）
showNotification({
  type: 'error',
  message: 'ストレージ容量が不足しています',
});

// 確認ダイアログ
const confirmed = await showConfirm({
  title: 'タイマーをリセット',
  message: '現在の進行状況がリセットされます。よろしいですか？',
  confirmLabel: 'リセット',
  cancelLabel: 'キャンセル',
  variant: 'warning',
});

if (confirmed) {
  dispatch({ type: 'RESET' });
}
```

### 5.2 デフォルトの表示時間

| 通知タイプ | デフォルト表示時間 |
|-----------|------------------|
| success | 3000ms |
| info | 4000ms |
| warning | 5000ms |
| error | 手動で閉じる |

---

## 6. 休憩フローの状態遷移

### 6.1 ステートマシン図

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
┌──────────────────────────────────┐                         │
│          レベル進行中              │                         │
│  (isOnBreak: false)              │                         │
│  (timer.status: running/paused)  │                         │
└──────────────────────────────────┘                         │
            │                                                 │
            │ remainingTime === 0                            │
            │ (自動進行 or NEXT_LEVEL)                        │
            ▼                                                 │
┌──────────────────────────────────┐                         │
│         休憩判定                  │                         │
│  shouldTakeBreak(currentLevel)   │                         │
└──────────────────────────────────┘                         │
            │                                                 │
     ┌──────┴──────┐                                         │
     │             │                                          │
  休憩なし       休憩あり                                      │
     │             │                                          │
     ▼             ▼                                          │
┌─────────┐  ┌──────────────────────────────────┐            │
│次レベル │  │           休憩開始                │            │
│ 準備    │  │  (isOnBreak: true)               │            │
│         │  │  (timer.remainingTime: duration) │            │
│ idle状態│  │  (timer.status: idle)            │            │
│ で待機  │  └──────────────────────────────────┘            │
└─────────┘               │                                   │
     │                    │                                   │
     │             ┌──────┴──────┐                            │
     │             │             │                            │
     │       ユーザー開始     スキップ                         │
     │             │             │                            │
     │             ▼             │                            │
     │    ┌────────────────┐     │                            │
     │    │  休憩タイマー   │     │                            │
     │    │  カウントダウン │     │                            │
     │    └────────────────┘     │                            │
     │             │             │                            │
     │             │ 終了        │                            │
     │             ▼             │                            │
     │    ┌────────────────┐     │                            │
     │    │   休憩終了      │◄────┘                            │
     │    │ (END_BREAK)    │                                  │
     │    └────────────────┘                                  │
     │             │                                          │
     │             ▼                                          │
     │    ┌────────────────┐                                  │
     │    │  次レベル準備   │                                  │
     │    │  idle状態で待機 │                                  │
     │    └────────────────┘                                  │
     │             │                                          │
     └──────┬──────┘                                          │
            │                                                 │
            │ ユーザーが開始ボタン押下                          │
            │ (START アクション)                               │
            │                                                 │
            └─────────────────────────────────────────────────┘
```

### 6.2 休憩判定ロジック

```typescript
// src/domain/models/Break.ts
export function shouldTakeBreak(
  currentLevel: number,
  breakConfig: BreakConfig
): boolean {
  if (!breakConfig.enabled) return false;
  if (currentLevel === 0) return false;  // 最初のレベル終了後は休憩なし

  // レベル番号は0始まり、frequency回ごとに休憩
  // currentLevel=3, frequency=4 → (3+1) % 4 === 0 → true
  return (currentLevel + 1) % breakConfig.frequency === 0;
}
```

### 6.3 重要な仕様決定

| 項目 | 決定事項 |
|------|---------|
| 休憩開始時のタイマー状態 | `idle`（ユーザーが開始ボタンを押すまで待機） |
| 休憩終了後のタイマー状態 | `idle`（ユーザーが開始ボタンを押すまで待機） |
| 休憩中の音声通知 | 休憩開始時のみ通知音を再生 |
| 休憩スキップ | 可能（SKIP_BREAKアクション） |
| 休憩中のレベル変更 | 不可（UIで無効化） |

---

## 7. 音声ファイル準備方針

### 7.1 ファイル配置

```
public/
└── sounds/
    ├── level-change.mp3     # レベル変更通知音
    ├── warning-1min.mp3     # 残り1分警告音
    └── break-start.mp3      # 休憩開始通知音
```

### 7.2 開発時のスタブファイル

開発初期は以下のダミーファイルを使用します。

**ダミーファイルの作成方法**:

```bash
# 無音の0.5秒MP3を生成（ffmpegを使用）
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.5 -q:a 9 public/sounds/level-change.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.5 -q:a 9 public/sounds/warning-1min.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.5 -q:a 9 public/sounds/break-start.mp3
```

または、フリー音源サイトからダウンロード:
- [Freesound.org](https://freesound.org/) - CC0ライセンスの音源
- [Mixkit](https://mixkit.co/free-sound-effects/) - 無料商用利用可

### 7.3 テスト時のモック

```typescript
// src/services/__mocks__/AudioService.ts
export const AudioService = {
  preload: jest.fn().mockResolvedValue(undefined),
  playLevelChange: jest.fn(),
  playWarning1Min: jest.fn(),
  playBreakStart: jest.fn(),
  setVolume: jest.fn(),
  setEnabled: jest.fn(),
};
```

```typescript
// テストファイル
jest.mock('@/services/AudioService');

describe('useAudioNotification', () => {
  it('should play warning sound at 1 minute remaining', () => {
    // ...
    expect(AudioService.playWarning1Min).toHaveBeenCalled();
  });
});
```

---

## 8. 型エクスポート戦略

### 8.1 ディレクトリ構造

```
src/
├── types/
│   ├── index.ts          # 全型の re-export（公開API）
│   ├── domain.ts         # ドメイン型（BlindLevel, Timer, Preset等）
│   ├── context.ts        # Context関連の型（State, Action等）
│   ├── notification.ts   # 通知関連の型
│   └── storage.ts        # ストレージ関連の型
└── domain/
    └── models/           # ビジネスロジック（型とセットで関数も定義）
        ├── BlindLevel.ts
        ├── Timer.ts
        ├── Preset.ts
        └── Break.ts
```

### 8.2 インポートルール

```typescript
// ◎ 推奨: @/types から型をインポート
import type { BlindLevel, Timer, Preset } from '@/types';

// ◎ 推奨: ビジネスロジック関数は domain から
import { shouldTakeBreak, createDefaultPreset } from '@/domain/models/Break';

// × 非推奨: 内部ファイルから直接インポート
import type { BlindLevel } from '@/types/domain';
```

### 8.3 re-export の実装

```typescript
// src/types/index.ts
// ドメイン型
export type {
  BlindLevel,
  Timer,
  TimerStatus,
  Preset,
  PresetId,
  PresetType,
  BreakConfig,
  TournamentState,
  Settings,
} from './domain';

// Context型
export type {
  TournamentAction,
  SettingsAction,
  TournamentContextValue,
  SettingsContextValue,
} from './context';

// 通知型
export type {
  Notification,
  NotificationType,
  ConfirmOptions,
  NotificationContextValue,
} from './notification';

// ストレージ型
export type {
  StorageSchema,
  StorageKey,
} from './storage';
```

---

## 9. 機能間依存関係図

### 9.1 コンポーネント依存関係

```
                           App
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
      SettingsProvider  TournamentProvider  NotificationProvider
              │             │             │
              └──────┬──────┘             │
                     │                    │
                     ▼                    │
              ┌──────────────┐            │
              │  MainLayout  │◄───────────┘
              └──────────────┘
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
    TimerDisplay  Settings    Header
          │       Panel
          │          │
    ┌─────┴─────┐    │
    │           │    │
    ▼           ▼    ▼
 BlindInfo  TimerControls  SettingsTabs
    │           │             │
    │     ┌─────┼─────────────┼────────┐
    │     │     │             │        │
    │     ▼     ▼             ▼        ▼
    │  BlindEditor  PresetManager  AudioSettings  ...
    │
    └────────────────────────────────────────────────
                        │
                        ▼
                  BreakDisplay
```

### 9.2 フック依存関係

```
useTimer
    │
    ├─── useTournament (TournamentContext)
    │
    └─── useCallback, useEffect (React)

usePresets
    │
    ├─── useSettings (SettingsContext)
    │
    └─── useTournament (for loadPreset callback)

useAudioNotification
    │
    ├─── useTournament (state.timer, state.isOnBreak)
    │
    ├─── useSettings (settings.soundEnabled)
    │
    └─── AudioService

useKeyboardShortcuts
    │
    ├─── useTournament (dispatch)
    │
    ├─── useSettings (for fullscreen)
    │
    └─── KeyboardService
```

### 9.3 サービス依存関係

```
AudioService
    │
    └─── AUDIO_FILES (constants)

StorageService
    │
    └─── STORAGE_KEYS (constants)

KeyboardService
    │
    └─── (依存なし)
```

---

## 10. アベレージスタック関連のインターフェース

### 10.1 SET_PLAYERS アクションの処理フロー

```
[ユーザーがタイマー画面でプレイヤー数を変更]
         │
         ▼
[AverageStackDisplay: dispatch({ type: 'SET_PLAYERS', payload: { totalPlayers, remainingPlayers } })]
         │
         ├─→ totalPlayers を更新
         ├─→ remainingPlayers を更新（totalPlayers を超えないよう制約）
         └─→ アベレージスタック表示が自動的に再計算される
```

**アクション型定義:**

```typescript
| { type: 'SET_PLAYERS'; payload: { totalPlayers: number; remainingPlayers: number } }
```

**バリデーション:**

- `totalPlayers >= 0`
- `remainingPlayers >= 0`
- `remainingPlayers <= totalPlayers`

### 10.2 LOAD_PRESET 時のプレイヤー数リセット

ストラクチャー（プリセット）をロードした際、プレイヤー数は 0 にリセットされる。
これは新しいトーナメント構成への切り替えを意味するため。

### 10.3 RESET 時の remainingPlayers リセット

タイマーリセット時に `remainingPlayers` を `totalPlayers` に戻す。
これはトーナメントの再開（最初のレベルからやり直し）を意味するため。

### 10.4 アベレージスタック表示のデータフロー

```
Structure.initialStack ─┐
                        ├─→ calculateAverageStack() ─→ AverageStackDisplay
TournamentState ────────┘
  ├─ totalPlayers
  ├─ remainingPlayers
  └─ blindLevels[currentLevel].bigBlind ─→ calculateAverageStackBB()
```

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2026-01-26 | 初版作成（レビュー報告書の指摘事項に対応） | システムアーキテクト |
| 1.1 | 2026-02-09 | アベレージスタック関連のインターフェース追加（セクション10） | システムアーキテクト |
