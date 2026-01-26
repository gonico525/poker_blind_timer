# Team C 実装計画書：音声・キーボード

## 概要

| 項目 | 内容 |
|------|------|
| チーム名 | Team C |
| 担当領域 | 音声・キーボード |
| 主な成果物 | AudioService、KeyboardService、関連フック |
| 依存先 | Team A（型定義、Context）、Team B（タイマー状態） |
| 依存元 | なし |

---

## 担当範囲

### 成果物一覧

```
src/
├── services/
│   ├── AudioService.ts          # 音声サービス
│   ├── AudioService.test.ts
│   ├── KeyboardService.ts       # キーボードサービス
│   ├── KeyboardService.test.ts
│   └── __mocks__/
│       ├── AudioService.ts      # テスト用モック
│       └── KeyboardService.ts
├── hooks/
│   ├── useAudioNotification.ts  # 音声通知フック
│   ├── useAudioNotification.test.ts
│   ├── useKeyboardShortcuts.ts  # キーボードショートカットフック
│   └── useKeyboardShortcuts.test.ts
└── public/
    └── sounds/                  # 音声ファイル
        ├── level-change.mp3
        ├── warning-1min.mp3
        └── break-start.mp3
```

---

## 開発開始条件

### Phase 2B/2C（サービス層）開始条件

**Team A からの提供物が必要:**

| 提供物 | 提供元 | 使用箇所 |
|--------|--------|---------|
| AUDIO_FILES 定数 | Team A Phase 1 | AudioService |
| 型定義 | Team A Phase 1 | 全ファイル |

**開始可能タイミング**: Team A Phase 1 完了後（Phase 2A と並行可能）

### Phase 3B（フック層）開始条件

**追加で必要な提供物:**

| 提供物 | 提供元 | 使用箇所 |
|--------|--------|---------|
| TournamentContext | Team A Phase 2A | useAudioNotification, useKeyboardShortcuts |
| SettingsContext | Team A Phase 2A | useAudioNotification（音声ON/OFF設定） |

**開始可能タイミング**: Team A Phase 2A 完了後

---

## 実装フェーズ

### Phase 2B: AudioService

**目標**: 音声再生の基盤サービスを構築

**参照ドキュメント:**
- [features/audio.md](../specs/features/audio.md) - 音声機能仕様（**必読**）
- [04-interface-definitions.md](../specs/04-interface-definitions.md) - セクション7「音声ファイル準備方針」
- [04-interface-definitions.md](../specs/04-interface-definitions.md) - セクション2「イベント通知メカニズム」

#### Step 2B.1: AudioService 基本機能

**TDD実装順序:**

```typescript
// src/services/AudioService.test.ts
describe('AudioService', () => {
  let mockAudioElement: {
    play: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    load: ReturnType<typeof vi.fn>;
    volume: number;
    currentTime: number;
  };

  beforeEach(() => {
    mockAudioElement = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      load: vi.fn(),
      volume: 1,
      currentTime: 0,
    };

    vi.spyOn(window, 'Audio').mockImplementation(() => mockAudioElement as unknown as HTMLAudioElement);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    AudioService.cleanup();
  });

  describe('preload', () => {
    it('should preload all audio files', async () => {
      await AudioService.preload();

      expect(window.Audio).toHaveBeenCalledWith('/sounds/level-change.mp3');
      expect(window.Audio).toHaveBeenCalledWith('/sounds/warning-1min.mp3');
      expect(window.Audio).toHaveBeenCalledWith('/sounds/break-start.mp3');
    });

    it('should resolve even if some files fail to load', async () => {
      mockAudioElement.load = vi.fn().mockImplementation(() => {
        throw new Error('Load failed');
      });

      await expect(AudioService.preload()).resolves.not.toThrow();
    });
  });

  describe('playLevelChange', () => {
    it('should play level change sound', async () => {
      await AudioService.preload();
      AudioService.playLevelChange();

      expect(mockAudioElement.play).toHaveBeenCalled();
    });

    it('should not play when disabled', async () => {
      await AudioService.preload();
      AudioService.setEnabled(false);
      AudioService.playLevelChange();

      expect(mockAudioElement.play).not.toHaveBeenCalled();
    });
  });

  describe('playWarning1Min', () => {
    it('should play warning sound', async () => {
      await AudioService.preload();
      AudioService.playWarning1Min();

      expect(mockAudioElement.play).toHaveBeenCalled();
    });
  });

  describe('playBreakStart', () => {
    it('should play break start sound', async () => {
      await AudioService.preload();
      AudioService.playBreakStart();

      expect(mockAudioElement.play).toHaveBeenCalled();
    });
  });

  describe('setVolume', () => {
    it('should set volume for all audio elements', async () => {
      await AudioService.preload();
      AudioService.setVolume(0.5);

      expect(mockAudioElement.volume).toBe(0.5);
    });

    it('should clamp volume between 0 and 1', async () => {
      await AudioService.preload();

      AudioService.setVolume(1.5);
      expect(mockAudioElement.volume).toBe(1);

      AudioService.setVolume(-0.5);
      expect(mockAudioElement.volume).toBe(0);
    });
  });

  describe('setEnabled', () => {
    it('should enable/disable audio playback', async () => {
      await AudioService.preload();

      AudioService.setEnabled(false);
      expect(AudioService.isEnabled()).toBe(false);

      AudioService.setEnabled(true);
      expect(AudioService.isEnabled()).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle play errors gracefully', async () => {
      mockAudioElement.play = vi.fn().mockRejectedValue(new Error('Play failed'));
      await AudioService.preload();

      // エラーをスローしないことを確認
      expect(() => AudioService.playLevelChange()).not.toThrow();
    });
  });
});
```

#### Step 2B.2: AudioService の実装

```typescript
// src/services/AudioService.ts
import { AUDIO_FILES } from '@/utils/constants';

interface AudioElements {
  levelChange: HTMLAudioElement | null;
  warning1Min: HTMLAudioElement | null;
  breakStart: HTMLAudioElement | null;
}

class AudioServiceImpl {
  private audioElements: AudioElements = {
    levelChange: null,
    warning1Min: null,
    breakStart: null,
  };

  private enabled = true;
  private volume = 0.7;

  async preload(): Promise<void> {
    const loadAudio = (src: string): Promise<HTMLAudioElement> => {
      return new Promise((resolve) => {
        try {
          const audio = new Audio(src);
          audio.load();
          resolve(audio);
        } catch (error) {
          console.warn(`Failed to load audio: ${src}`, error);
          resolve(new Audio()); // 空のAudioを返す
        }
      });
    };

    const [levelChange, warning1Min, breakStart] = await Promise.all([
      loadAudio(AUDIO_FILES.LEVEL_CHANGE),
      loadAudio(AUDIO_FILES.WARNING_1MIN),
      loadAudio(AUDIO_FILES.BREAK_START),
    ]);

    this.audioElements = { levelChange, warning1Min, breakStart };
    this.applyVolume();
  }

  playLevelChange(): void {
    this.play(this.audioElements.levelChange);
  }

  playWarning1Min(): void {
    this.play(this.audioElements.warning1Min);
  }

  playBreakStart(): void {
    this.play(this.audioElements.breakStart);
  }

  private play(audio: HTMLAudioElement | null): void {
    if (!this.enabled || !audio) return;

    audio.currentTime = 0;
    audio.play().catch((error) => {
      console.warn('Audio playback failed:', error);
    });
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    this.applyVolume();
  }

  private applyVolume(): void {
    Object.values(this.audioElements).forEach((audio) => {
      if (audio) {
        audio.volume = this.volume;
      }
    });
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getVolume(): number {
    return this.volume;
  }

  cleanup(): void {
    this.audioElements = {
      levelChange: null,
      warning1Min: null,
      breakStart: null,
    };
  }
}

export const AudioService = new AudioServiceImpl();
```

#### Step 2B.3: モックの作成

```typescript
// src/services/__mocks__/AudioService.ts
export const AudioService = {
  preload: vi.fn().mockResolvedValue(undefined),
  playLevelChange: vi.fn(),
  playWarning1Min: vi.fn(),
  playBreakStart: vi.fn(),
  setVolume: vi.fn(),
  setEnabled: vi.fn(),
  isEnabled: vi.fn().mockReturnValue(true),
  getVolume: vi.fn().mockReturnValue(0.7),
  cleanup: vi.fn(),
};
```

---

### Phase 2C: KeyboardService

**目標**: キーボードイベントの管理サービスを構築

**参照ドキュメント:**
- [features/keyboard.md](../specs/features/keyboard.md) - キーボード機能仕様（**必読**）
- [urs/requirements.md](../urs/requirements.md) - セクション3.1.4「キーボードショートカット」

#### Step 2C.1: KeyboardService 基本機能

**TDD実装順序:**

```typescript
// src/services/KeyboardService.test.ts
describe('KeyboardService', () => {
  beforeEach(() => {
    KeyboardService.cleanup();
  });

  afterEach(() => {
    KeyboardService.cleanup();
  });

  describe('initialize', () => {
    it('should add keydown event listener', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      KeyboardService.initialize();

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('cleanup', () => {
    it('should remove keydown event listener', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      KeyboardService.initialize();
      KeyboardService.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('subscribe', () => {
    it('should call handler when key matches', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      KeyboardService.subscribe('Space', handler);

      fireEvent.keyDown(document, { code: 'Space' });

      expect(handler).toHaveBeenCalled();
    });

    it('should not call handler when key does not match', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      KeyboardService.subscribe('Space', handler);

      fireEvent.keyDown(document, { code: 'KeyA' });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      const unsubscribe = KeyboardService.subscribe('Space', handler);

      unsubscribe();
      fireEvent.keyDown(document, { code: 'Space' });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('modifier keys', () => {
    it('should handle Ctrl modifier', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      KeyboardService.subscribe('Ctrl+KeyS', handler);

      fireEvent.keyDown(document, { code: 'KeyS', ctrlKey: true });
      expect(handler).toHaveBeenCalled();

      handler.mockClear();
      fireEvent.keyDown(document, { code: 'KeyS', ctrlKey: false });
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle Shift modifier', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      KeyboardService.subscribe('Shift+KeyR', handler);

      fireEvent.keyDown(document, { code: 'KeyR', shiftKey: true });
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('input focus handling', () => {
    it('should not trigger shortcuts when input is focused', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      KeyboardService.subscribe('Space', handler);

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      fireEvent.keyDown(input, { code: 'Space' });

      expect(handler).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });

    it('should not trigger shortcuts when textarea is focused', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      KeyboardService.subscribe('Space', handler);

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      fireEvent.keyDown(textarea, { code: 'Space' });

      expect(handler).not.toHaveBeenCalled();
      document.body.removeChild(textarea);
    });
  });

  describe('prevent default', () => {
    it('should prevent default for handled keys', () => {
      const handler = vi.fn();
      KeyboardService.initialize();
      KeyboardService.subscribe('Space', handler, { preventDefault: true });

      const event = new KeyboardEvent('keydown', { code: 'Space' });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });
});
```

#### Step 2C.2: KeyboardService の実装

```typescript
// src/services/KeyboardService.ts
type KeyHandler = (event: KeyboardEvent) => void;

interface Subscription {
  key: string;
  handler: KeyHandler;
  options?: {
    preventDefault?: boolean;
  };
}

class KeyboardServiceImpl {
  private subscriptions: Subscription[] = [];
  private boundHandleKeyDown: ((event: KeyboardEvent) => void) | null = null;

  initialize(): void {
    if (this.boundHandleKeyDown) return; // Already initialized

    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.boundHandleKeyDown);
  }

  cleanup(): void {
    if (this.boundHandleKeyDown) {
      document.removeEventListener('keydown', this.boundHandleKeyDown);
      this.boundHandleKeyDown = null;
    }
    this.subscriptions = [];
  }

  subscribe(
    key: string,
    handler: KeyHandler,
    options?: { preventDefault?: boolean }
  ): () => void {
    const subscription: Subscription = { key, handler, options };
    this.subscriptions.push(subscription);

    return () => {
      const index = this.subscriptions.indexOf(subscription);
      if (index > -1) {
        this.subscriptions.splice(index, 1);
      }
    };
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // 入力フォーカス時はショートカット無効
    if (this.isInputFocused(event)) return;

    for (const subscription of this.subscriptions) {
      if (this.matchesKey(event, subscription.key)) {
        if (subscription.options?.preventDefault) {
          event.preventDefault();
        }
        subscription.handler(event);
      }
    }
  }

  private isInputFocused(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      target.isContentEditable
    );
  }

  private matchesKey(event: KeyboardEvent, keyPattern: string): boolean {
    const parts = keyPattern.split('+');
    const keyCode = parts[parts.length - 1];

    const requiresCtrl = parts.includes('Ctrl');
    const requiresShift = parts.includes('Shift');
    const requiresAlt = parts.includes('Alt');

    return (
      event.code === keyCode &&
      event.ctrlKey === requiresCtrl &&
      event.shiftKey === requiresShift &&
      event.altKey === requiresAlt
    );
  }
}

export const KeyboardService = new KeyboardServiceImpl();
```

#### Step 2C.3: モックの作成

```typescript
// src/services/__mocks__/KeyboardService.ts
export const KeyboardService = {
  initialize: vi.fn(),
  cleanup: vi.fn(),
  subscribe: vi.fn().mockReturnValue(vi.fn()), // unsubscribe関数を返す
};
```

---

### Phase 3B: 連携フック

**目標**: Context と Service を連携させるフックを構築

#### Step 3B.1: useAudioNotification

**参照ドキュメント:**
- [04-interface-definitions.md](../specs/04-interface-definitions.md) - セクション2「イベント通知メカニズム」（**必読**）
- [features/audio.md](../specs/features/audio.md) - 音声通知タイミング

**TDD実装順序:**

```typescript
// src/hooks/useAudioNotification.test.ts
import { renderHook } from '@testing-library/react';
import { useAudioNotification } from './useAudioNotification';
import { AudioService } from '@/services/AudioService';

vi.mock('@/services/AudioService');

describe('useAudioNotification', () => {
  const createWrapper = (tournamentState: Partial<TournamentState>, settingsState?: Partial<SettingsState>) => {
    return ({ children }: { children: React.ReactNode }) => (
      <SettingsProvider initialState={{ soundEnabled: true, ...settingsState }}>
        <TournamentProvider initialState={tournamentState}>
          {children}
        </TournamentProvider>
      </SettingsProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('warning at 1 minute', () => {
    it('should play warning sound when remainingTime crosses 60 seconds', () => {
      const { rerender } = renderHook(
        () => useAudioNotification(),
        { wrapper: createWrapper({ timer: { remainingTime: 61, status: 'running' } }) }
      );

      // 61秒 → 60秒の変化をシミュレート
      rerender();
      // TournamentContextの状態を60秒に更新

      expect(AudioService.playWarning1Min).toHaveBeenCalled();
    });

    it('should not play warning when remainingTime is already below 60', () => {
      renderHook(
        () => useAudioNotification(),
        { wrapper: createWrapper({ timer: { remainingTime: 30, status: 'running' } }) }
      );

      expect(AudioService.playWarning1Min).not.toHaveBeenCalled();
    });

    it('should not play warning when sound is disabled', () => {
      const { rerender } = renderHook(
        () => useAudioNotification(),
        {
          wrapper: createWrapper(
            { timer: { remainingTime: 61, status: 'running' } },
            { soundEnabled: false }
          ),
        }
      );

      rerender();

      expect(AudioService.playWarning1Min).not.toHaveBeenCalled();
    });
  });

  describe('level change notification', () => {
    it('should play level change sound when remainingTime reaches 0', () => {
      const { rerender } = renderHook(
        () => useAudioNotification(),
        { wrapper: createWrapper({ timer: { remainingTime: 1, status: 'running' } }) }
      );

      // 1秒 → 0秒の変化をシミュレート
      rerender();

      expect(AudioService.playLevelChange).toHaveBeenCalled();
    });
  });

  describe('break start notification', () => {
    it('should play break start sound when entering break', () => {
      const { rerender } = renderHook(
        () => useAudioNotification(),
        { wrapper: createWrapper({ isOnBreak: false }) }
      );

      // isOnBreak: false → true の変化をシミュレート
      rerender();

      expect(AudioService.playBreakStart).toHaveBeenCalled();
    });

    it('should not play when exiting break', () => {
      const { rerender } = renderHook(
        () => useAudioNotification(),
        { wrapper: createWrapper({ isOnBreak: true }) }
      );

      // isOnBreak: true → false の変化をシミュレート
      rerender();

      expect(AudioService.playBreakStart).not.toHaveBeenCalled();
    });
  });

  describe('volume sync', () => {
    it('should sync volume with settings', () => {
      renderHook(
        () => useAudioNotification(),
        { wrapper: createWrapper({}, { volume: 0.5 }) }
      );

      expect(AudioService.setVolume).toHaveBeenCalledWith(0.5);
    });
  });
});
```

#### Step 3B.2: useAudioNotification の実装

```typescript
// src/hooks/useAudioNotification.ts
import { useEffect, useRef } from 'react';
import { useTournament } from '@/contexts/TournamentContext';
import { useSettings } from '@/contexts/SettingsContext';
import { AudioService } from '@/services/AudioService';

export function useAudioNotification(): void {
  const { state } = useTournament();
  const { settings } = useSettings();

  const prevRemainingTime = useRef(state.timer.remainingTime);
  const prevIsOnBreak = useRef(state.isOnBreak);

  // 音量の同期
  useEffect(() => {
    AudioService.setVolume(settings.volume);
  }, [settings.volume]);

  // 音声有効/無効の同期
  useEffect(() => {
    AudioService.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // 残り時間の監視（警告音、レベル変更音）
  useEffect(() => {
    if (!settings.soundEnabled) {
      prevRemainingTime.current = state.timer.remainingTime;
      return;
    }

    const prev = prevRemainingTime.current;
    const current = state.timer.remainingTime;

    // 残り1分警告（61秒以上 → 60秒以下に変化、かつ0より大きい）
    if (prev > 60 && current <= 60 && current > 0) {
      AudioService.playWarning1Min();
    }

    // レベル変更通知（1秒以上 → 0秒に変化）
    if (prev > 0 && current === 0) {
      AudioService.playLevelChange();
    }

    prevRemainingTime.current = current;
  }, [state.timer.remainingTime, settings.soundEnabled]);

  // 休憩状態の監視
  useEffect(() => {
    if (!settings.soundEnabled) {
      prevIsOnBreak.current = state.isOnBreak;
      return;
    }

    // 休憩開始通知（false → true）
    if (!prevIsOnBreak.current && state.isOnBreak) {
      AudioService.playBreakStart();
    }

    prevIsOnBreak.current = state.isOnBreak;
  }, [state.isOnBreak, settings.soundEnabled]);
}
```

#### Step 3B.3: useKeyboardShortcuts

**参照ドキュメント:**
- [features/keyboard.md](../specs/features/keyboard.md) - キーボードショートカット仕様（**必読**）
- [04-interface-definitions.md](../specs/04-interface-definitions.md) - セクション1「Context間アクション責務マトリクス」

**TDD実装順序:**

```typescript
// src/hooks/useKeyboardShortcuts.test.ts
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { KeyboardService } from '@/services/KeyboardService';

vi.mock('@/services/KeyboardService');

describe('useKeyboardShortcuts', () => {
  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <SettingsProvider>
        <TournamentProvider>
          {children}
        </TournamentProvider>
      </SettingsProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should subscribe to keyboard events on mount', () => {
      renderHook(() => useKeyboardShortcuts(), { wrapper: createWrapper() });

      expect(KeyboardService.subscribe).toHaveBeenCalledWith('Space', expect.any(Function), expect.any(Object));
      expect(KeyboardService.subscribe).toHaveBeenCalledWith('ArrowLeft', expect.any(Function), expect.any(Object));
      expect(KeyboardService.subscribe).toHaveBeenCalledWith('ArrowRight', expect.any(Function), expect.any(Object));
      expect(KeyboardService.subscribe).toHaveBeenCalledWith('KeyR', expect.any(Function), expect.any(Object));
      expect(KeyboardService.subscribe).toHaveBeenCalledWith('KeyF', expect.any(Function), expect.any(Object));
      expect(KeyboardService.subscribe).toHaveBeenCalledWith('Escape', expect.any(Function), expect.any(Object));
      expect(KeyboardService.subscribe).toHaveBeenCalledWith('Slash', expect.any(Function), expect.any(Object));
    });

    it('should unsubscribe on unmount', () => {
      const unsubscribe = vi.fn();
      vi.mocked(KeyboardService.subscribe).mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useKeyboardShortcuts(), { wrapper: createWrapper() });
      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Space key', () => {
    it('should toggle timer on Space', () => {
      const { result } = renderHook(
        () => {
          useKeyboardShortcuts();
          return useTournament();
        },
        { wrapper: createWrapper() }
      );

      // Spaceキーのハンドラを取得して呼び出し
      const spaceHandler = vi.mocked(KeyboardService.subscribe).mock.calls.find(
        call => call[0] === 'Space'
      )?.[1];

      spaceHandler?.(new KeyboardEvent('keydown', { code: 'Space' }));

      // toggle が呼ばれたことを確認
      expect(result.current.state.timer.status).toBe('running');
    });
  });

  describe('Arrow keys', () => {
    it('should go to next level on ArrowRight', () => {
      // ...
    });

    it('should go to previous level on ArrowLeft', () => {
      // ...
    });
  });

  describe('R key', () => {
    it('should reset timer on R', () => {
      // ...
    });
  });

  describe('F key', () => {
    it('should toggle fullscreen on F', () => {
      const requestFullscreen = vi.fn();
      document.documentElement.requestFullscreen = requestFullscreen;

      // ...

      expect(requestFullscreen).toHaveBeenCalled();
    });
  });

  describe('Escape key', () => {
    it('should exit fullscreen on Escape', () => {
      const exitFullscreen = vi.fn();
      document.exitFullscreen = exitFullscreen;
      Object.defineProperty(document, 'fullscreenElement', { value: document.body });

      // ...

      expect(exitFullscreen).toHaveBeenCalled();
    });
  });

  describe('? key (Slash)', () => {
    it('should show help modal on ?', () => {
      // ...
    });
  });
});
```

#### Step 3B.4: useKeyboardShortcuts の実装

```typescript
// src/hooks/useKeyboardShortcuts.ts
import { useEffect, useCallback } from 'react';
import { useTournament } from '@/contexts/TournamentContext';
import { KeyboardService } from '@/services/KeyboardService';

export function useKeyboardShortcuts(): void {
  const { state, dispatch } = useTournament();

  // タイマートグル
  const handleToggle = useCallback(() => {
    if (state.timer.status === 'running') {
      dispatch({ type: 'PAUSE' });
    } else {
      dispatch({ type: 'START' });
    }
  }, [state.timer.status, dispatch]);

  // 次のレベル
  const handleNextLevel = useCallback(() => {
    if (state.isOnBreak) return;
    if (state.currentLevel < state.blindLevels.length - 1) {
      dispatch({ type: 'NEXT_LEVEL' });
    }
  }, [state.isOnBreak, state.currentLevel, state.blindLevels.length, dispatch]);

  // 前のレベル
  const handlePrevLevel = useCallback(() => {
    if (state.isOnBreak) return;
    if (state.currentLevel > 0) {
      dispatch({ type: 'PREV_LEVEL' });
    }
  }, [state.isOnBreak, state.currentLevel, dispatch]);

  // リセット
  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  // フルスクリーントグル
  const handleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  // フルスクリーン解除
  const handleEscape = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, []);

  // ヘルプ表示
  const handleHelp = useCallback(() => {
    // TODO: ヘルプモーダルを表示
    console.log('Help requested');
  }, []);

  useEffect(() => {
    const unsubscribers = [
      KeyboardService.subscribe('Space', handleToggle, { preventDefault: true }),
      KeyboardService.subscribe('ArrowRight', handleNextLevel, { preventDefault: true }),
      KeyboardService.subscribe('ArrowLeft', handlePrevLevel, { preventDefault: true }),
      KeyboardService.subscribe('KeyR', handleReset),
      KeyboardService.subscribe('KeyF', handleFullscreen),
      KeyboardService.subscribe('Escape', handleEscape),
      KeyboardService.subscribe('Slash', handleHelp), // ? キー
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [handleToggle, handleNextLevel, handlePrevLevel, handleReset, handleFullscreen, handleEscape, handleHelp]);
}
```

---

## 音声ファイルの準備

### ダミーファイルの作成

開発初期は無音ファイルで代用:

```bash
# ffmpeg を使用して無音ファイルを生成
mkdir -p public/sounds

ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.5 -q:a 9 public/sounds/level-change.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.3 -q:a 9 public/sounds/warning-1min.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.5 -q:a 9 public/sounds/break-start.mp3
```

### 本番用音声ファイル

推奨音源サイト:
- [Freesound.org](https://freesound.org/) - CC0ライセンス
- [Mixkit](https://mixkit.co/free-sound-effects/) - 無料商用利用可
- [Zapsplat](https://www.zapsplat.com/) - 登録後無料

音声ファイル要件:
- フォーマット: MP3
- サンプルレート: 44100Hz
- 長さ: 0.3〜1秒程度
- 音量: 適度に正規化

---

## 完了条件

### Phase 2B 完了条件

- [ ] AudioService が実装され、全テストがパス
- [ ] preload, play*, setVolume, setEnabled が動作
- [ ] エラーハンドリングが実装されている
- [ ] モックファイルが作成されている
- [ ] ダミー音声ファイルが配置されている

### Phase 2C 完了条件

- [ ] KeyboardService が実装され、全テストがパス
- [ ] initialize, cleanup, subscribe が動作
- [ ] 修飾キー（Ctrl, Shift, Alt）が処理できる
- [ ] 入力フォーカス時はショートカットが無効になる
- [ ] モックファイルが作成されている

### Phase 3B 完了条件

- [ ] useAudioNotification が実装され、全テストがパス
- [ ] 残り1分警告、レベル変更音、休憩開始音が正しいタイミングで再生
- [ ] 音声ON/OFF設定が反映される
- [ ] 音量設定が反映される
- [ ] useKeyboardShortcuts が実装され、全テストがパス
- [ ] 全ショートカット（Space, 矢印, R, F, Esc, ?）が動作

---

## Team B との連携

### 必要な状態（Team B から提供）

| 状態 | 用途 |
|------|------|
| `state.timer.remainingTime` | 警告音トリガー |
| `state.timer.status` | タイマー状態確認 |
| `state.isOnBreak` | 休憩開始音トリガー |
| `state.currentLevel` | レベル変更判定 |
| `state.blindLevels.length` | レベル上限確認 |

### 連携テスト

Team B と共同で結合テストを実施:

```typescript
describe('Timer + Audio + Keyboard integration', () => {
  it('should play warning and allow keyboard control', async () => {
    render(<App />);

    // スペースキーでタイマー開始
    fireEvent.keyDown(document, { code: 'Space' });
    expect(screen.getByTestId('timer-status')).toHaveTextContent('running');

    // タイマーを60秒まで進める
    act(() => {
      vi.advanceTimersByTime(540000); // 9分経過
    });

    // 警告音が再生されることを確認
    expect(AudioService.playWarning1Min).toHaveBeenCalled();
  });
});
```

---

## 参照ドキュメント一覧

| ドキュメント | 必須度 | 内容 |
|------------|--------|------|
| [features/audio.md](../specs/features/audio.md) | **必読** | 音声機能の詳細仕様 |
| [features/keyboard.md](../specs/features/keyboard.md) | **必読** | キーボード機能の詳細仕様 |
| [04-interface-definitions.md](../specs/04-interface-definitions.md) | **必読** | イベント通知メカニズム |
| [02-data-models.md](../specs/02-data-models.md) | 参照 | 型定義 |
| [urs/requirements.md](../urs/requirements.md) | 参照 | ショートカットキー一覧 |

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2026-01-26 | 初版作成 | システムアーキテクト |
