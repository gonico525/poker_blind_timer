# 音声通知機能仕様

## 1. 概要

音声通知機能は、タイマーのイベント（レベル変更、警告）に応じて音声を再生し、ユーザーに通知します。

## 2. 機能要件

### 2.1 音声通知のタイミング

| イベント | タイミング | 音声ファイル |
|---------|-----------|------------|
| レベル変更 | 新しいレベル開始時 | `level-change.mp3` |
| 残り1分警告 | レベル終了1分前 | `warning-1min.mp3` |
| 休憩開始 | 休憩開始時 | `level-change.mp3`（同じ音） |

### 2.2 音量設定

**初期バージョン**: オン/オフのみ

- **デフォルト**: オン
- **設定**: トグルスイッチで一括オン/オフ

**将来的拡張**（優先度：中）:
- 段階調整（0-100%）
- 個別調整（レベル変更音/警告音を別々に）

## 3. 音声ファイル

### 3.1 ファイル仕様

```
public/sounds/
├── level-change.mp3    # レベル変更音（シンプルなチャイム）
└── warning-1min.mp3    # 警告音（短いビープ）
```

#### level-change.mp3
- **用途**: レベル変更、休憩開始
- **音の種類**: 2音階の優しいチャイム音（"ピンポーン"）
- **長さ**: 1-2秒
- **音量**: 適度（耳障りでない）

#### warning-1min.mp3
- **用途**: 残り1分の警告
- **音の種類**: 短いビープ音（"ピッ"）
- **長さ**: 0.5秒以内
- **音量**: 注意を引くが不快でない

### 3.2 音源の準備

**選択肢**:
1. フリー素材サイトから取得（freesound.org等）
2. Web Audio APIで生成

**推奨**: フリー素材を使用（クオリティとコスト効率のバランス）

## 4. 実装

### 4.1 AudioService

```typescript
/**
 * 音声再生サービス
 */
export class AudioService {
  private levelChangeAudio: HTMLAudioElement;
  private warningAudio: HTMLAudioElement;
  private enabled: boolean = true;

  constructor() {
    // 音声ファイルのプリロード
    this.levelChangeAudio = new Audio('/sounds/level-change.mp3');
    this.warningAudio = new Audio('/sounds/warning-1min.mp3');

    // プリロード
    this.levelChangeAudio.preload = 'auto';
    this.warningAudio.preload = 'auto';
  }

  /**
   * 音声の有効/無効を設定
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * レベル変更音を再生
   */
  async playLevelChange(): Promise<void> {
    if (!this.enabled) return;

    try {
      // 再生位置をリセット
      this.levelChangeAudio.currentTime = 0;
      await this.levelChangeAudio.play();
    } catch (error) {
      // 自動再生がブロックされた場合（ユーザー操作前）
      console.warn('Level change audio playback failed:', error);
    }
  }

  /**
   * 警告音を再生
   */
  async playWarning(): Promise<void> {
    if (!this.enabled) return;

    try {
      this.warningAudio.currentTime = 0;
      await this.warningAudio.play();
    } catch (error) {
      console.warn('Warning audio playback failed:', error);
    }
  }

  /**
   * 休憩開始音を再生（レベル変更音と同じ）
   */
  async playBreakStart(): Promise<void> {
    return this.playLevelChange();
  }

  /**
   * すべての音声を停止
   */
  stopAll(): void {
    this.levelChangeAudio.pause();
    this.warningAudio.pause();
    this.levelChangeAudio.currentTime = 0;
    this.warningAudio.currentTime = 0;
  }
}

// シングルトンインスタンス
export const audioService = new AudioService();
```

### 4.2 useAudio カスタムフック

```typescript
import { useEffect, useCallback } from 'react';
import { useSettings } from './useSettings';
import { useTournament } from './useTournament';
import { audioService } from '@/services/audio/AudioService';

export function useAudio() {
  const { state: settings } = useSettings();
  const { state: tournament } = useTournament();

  // 音声設定の変更を反映
  useEffect(() => {
    audioService.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // タイマーイベントを監視
  useEffect(() => {
    const { timer, currentLevel } = tournament;

    // 残り1分の警告
    const isWarning = timer.remainingTime <= 60 && timer.remainingTime > 59;
    if (isWarning && timer.status === 'running') {
      audioService.playWarning();
    }
  }, [tournament.timer.remainingTime, tournament.timer.status]);

  // レベル変更の監視
  useEffect(() => {
    // currentLevelが変わった時にレベル変更音を再生
    // ただし初期レンダリング時は再生しない
    if (tournament.currentLevel > 0 || tournament.isBreak) {
      audioService.playLevelChange();
    }
  }, [tournament.currentLevel, tournament.isBreak]);

  return {
    playLevelChange: useCallback(() => audioService.playLevelChange(), []),
    playWarning: useCallback(() => audioService.playWarning(), []),
    playBreakStart: useCallback(() => audioService.playBreakStart(), []),
    stopAll: useCallback(() => audioService.stopAll(), []),
  };
}
```

### 4.3 より厳密なイベント検知（Reducer内）

```typescript
// TournamentReducer内でイベントを明示的に発火
case 'TICK': {
  const { deltaTime } = action.payload;
  const newRemainingTime = Math.max(0, state.timer.remainingTime - deltaTime);
  const oldRemainingTime = state.timer.remainingTime;

  // 残り1分を通過した瞬間を検知
  const crossedOneMinute = oldRemainingTime > 60 && newRemainingTime <= 60;
  if (crossedOneMinute && state.timer.status === 'running') {
    // イベント通知（useEffectで監視するためのフラグ）
    notifyAudioEvent('WARNING_1MIN');
  }

  // 時間切れ
  if (newRemainingTime === 0 && oldRemainingTime > 0) {
    notifyAudioEvent('LEVEL_CHANGE');
    return handleLevelChange(state, 'next');
  }

  return {
    ...state,
    timer: {
      ...state.timer,
      remainingTime: newRemainingTime,
      elapsedTime: state.timer.elapsedTime + deltaTime,
    },
  };
}
```

## 5. UI コンポーネント

### 5.1 SoundToggle コンポーネント

```typescript
import React from 'react';
import { useSettings } from '@/ui/hooks/useSettings';
import styles from './SoundToggle.module.css';

export const SoundToggle: React.FC = () => {
  const { state, dispatch } = useSettings();
  const { soundEnabled } = state;

  const handleToggle = () => {
    dispatch({ type: 'TOGGLE_SOUND' });
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={handleToggle}
          className={styles.checkbox}
        />
        <span className={styles.icon}>
          {soundEnabled ? '🔊' : '🔇'}
        </span>
        <span className={styles.text}>
          音声通知
        </span>
      </label>
    </div>
  );
};
```

### 5.2 設定画面での音声設定

```typescript
import React from 'react';
import { useSettings } from '@/ui/hooks/useSettings';
import { useAudio } from '@/ui/hooks/useAudio';
import styles from './AudioSettings.module.css';

export const AudioSettings: React.FC = () => {
  const { state, dispatch } = useSettings();
  const { playLevelChange, playWarning } = useAudio();

  const handleToggle = () => {
    dispatch({ type: 'TOGGLE_SOUND' });
  };

  return (
    <div className={styles.container}>
      <h3>音声設定</h3>

      {/* オン/オフ */}
      <div className={styles.row}>
        <label className={styles.label}>
          <input
            type="checkbox"
            checked={state.soundEnabled}
            onChange={handleToggle}
          />
          音声通知を有効にする
        </label>
      </div>

      {/* テスト再生 */}
      {state.soundEnabled && (
        <div className={styles.testSection}>
          <h4>テスト再生</h4>
          <div className={styles.testButtons}>
            <button onClick={playLevelChange} className={styles.testButton}>
              レベル変更音
            </button>
            <button onClick={playWarning} className={styles.testButton}>
              警告音
            </button>
          </div>
        </div>
      )}

      {/* 説明 */}
      <div className={styles.info}>
        <p>音声通知のタイミング:</p>
        <ul>
          <li>レベル変更時</li>
          <li>残り時間1分</li>
          <li>休憩開始時</li>
        </ul>
      </div>
    </div>
  );
};
```

## 6. ブラウザ自動再生ポリシー対応

### 6.1 自動再生の制限

モダンブラウザでは、ユーザー操作なしでの音声自動再生が制限されています。

**対策**:
1. 最初のユーザー操作（タイマー開始ボタンクリック等）で音声を一度再生試行
2. 失敗した場合はエラーを無視（警告ログのみ）

### 6.2 初回再生の準備

```typescript
// タイマー開始時に音声を準備
case 'START_TIMER': {
  // 無音で一度再生を試行（ブラウザの許可を得る）
  try {
    const silentAudio = new Audio();
    silentAudio.volume = 0;
    silentAudio.play().catch(() => {
      // 失敗しても問題なし
    });
  } catch {
    // 無視
  }

  return {
    ...state,
    timer: {
      ...state.timer,
      status: 'running',
      startTime: Date.now(),
    },
  };
}
```

## 7. Web Audio API 代替実装（オプション）

より柔軟な音声制御が必要な場合、Web Audio APIを使用できます。

```typescript
export class WebAudioService {
  private audioContext: AudioContext;
  private levelChangeBuffer: AudioBuffer | null = null;
  private warningBuffer: AudioBuffer | null = null;
  private enabled: boolean = true;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.loadSounds();
  }

  private async loadSounds() {
    // 音声ファイルをロード
    const [levelChangeResponse, warningResponse] = await Promise.all([
      fetch('/sounds/level-change.mp3'),
      fetch('/sounds/warning-1min.mp3'),
    ]);

    const [levelChangeData, warningData] = await Promise.all([
      levelChangeResponse.arrayBuffer(),
      warningResponse.arrayBuffer(),
    ]);

    this.levelChangeBuffer = await this.audioContext.decodeAudioData(levelChangeData);
    this.warningBuffer = await this.audioContext.decodeAudioData(warningData);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  async playLevelChange(): Promise<void> {
    if (!this.enabled || !this.levelChangeBuffer) return;
    this.playBuffer(this.levelChangeBuffer);
  }

  async playWarning(): Promise<void> {
    if (!this.enabled || !this.warningBuffer) return;
    this.playBuffer(this.warningBuffer);
  }

  private playBuffer(buffer: AudioBuffer): void {
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start(0);
  }
}
```

**利点**:
- より細かい音量制御
- 複数音声の同時再生
- エフェクトの追加

**欠点**:
- 実装が複雑
- 初期バージョンでは不要

## 8. テストケース

### 8.1 AudioService テスト

```typescript
import { describe, it, expect, vi } from 'vitest';
import { AudioService } from '@/services/audio/AudioService';

describe('AudioService', () => {
  it('音声を無効にすると再生されない', async () => {
    const service = new AudioService();
    service.setEnabled(false);

    const playSpy = vi.spyOn(HTMLAudioElement.prototype, 'play');

    await service.playLevelChange();
    expect(playSpy).not.toHaveBeenCalled();
  });

  it('音声を有効にすると再生される', async () => {
    const service = new AudioService();
    service.setEnabled(true);

    const playSpy = vi.spyOn(HTMLAudioElement.prototype, 'play')
      .mockResolvedValue(undefined);

    await service.playLevelChange();
    expect(playSpy).toHaveBeenCalled();
  });
});
```

## 9. エラーハンドリング

### 9.1 音声ファイル読み込み失敗

```typescript
constructor() {
  this.levelChangeAudio = new Audio('/sounds/level-change.mp3');
  this.warningAudio = new Audio('/sounds/warning-1min.mp3');

  // エラーハンドリング
  this.levelChangeAudio.onerror = () => {
    console.error('Failed to load level change audio');
  };

  this.warningAudio.onerror = () => {
    console.error('Failed to load warning audio');
  };
}
```

### 9.2 再生失敗

```typescript
async playLevelChange(): Promise<void> {
  if (!this.enabled) return;

  try {
    this.levelChangeAudio.currentTime = 0;
    await this.levelChangeAudio.play();
  } catch (error) {
    // ブラウザの自動再生ポリシーでブロックされた場合
    // ユーザーに通知せず、ログのみ記録
    console.warn('Audio playback blocked:', error);
  }
}
```

## 10. パフォーマンス考慮事項

### 10.1 音声ファイルのプリロード

```typescript
constructor() {
  this.levelChangeAudio = new Audio('/sounds/level-change.mp3');
  this.warningAudio = new Audio('/sounds/warning-1min.mp3');

  // プリロード設定
  this.levelChangeAudio.preload = 'auto';
  this.warningAudio.preload = 'auto';

  // 初回ロード
  this.levelChangeAudio.load();
  this.warningAudio.load();
}
```

### 10.2 ファイルサイズの最適化

- **フォーマット**: MP3（広いブラウザサポート）
- **ビットレート**: 128kbps（音声通知には十分）
- **ファイルサイズ目安**: 各ファイル10-50KB

## 11. アクセシビリティ

### 11.1 視覚的な通知との併用

音声通知だけでなく、視覚的な通知も提供：

- レベル変更時: 画面のフラッシュ効果
- 警告時: タイマーの色変更（黄色/オレンジ）

### 11.2 設定の明示

音声通知の有効/無効を明確に表示し、ユーザーが制御できるようにする。

## 12. まとめ

音声通知機能の主要な実装ポイント：

1. **シンプルな実装**: HTML5 Audio APIを使用
2. **適切なタイミング**: レベル変更、残り1分のみ
3. **設定可能**: オン/オフ切り替え
4. **エラー耐性**: 再生失敗時も動作継続
5. **プリロード**: スムーズな再生のための事前読み込み

---

## 関連ドキュメント

- [timer.md](./timer.md) - タイマーイベントとの連携
- [02-data-models.md](../02-data-models.md) - 設定データモデル

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2026-01-26 | 初版作成 | AI System Architect |
