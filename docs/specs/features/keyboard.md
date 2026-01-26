# キーボードショートカット機能仕様

## 1. 概要

キーボードショートカット機能により、マウスを使わずにすべての主要操作を実行できます。ディーラーが効率的にタイマーを操作するための重要な機能です。

## 2. 機能要件

### 2.1 キーバインディング一覧

| キー | 動作 | 条件 |
|------|------|------|
| **Space** | タイマー開始/一時停止 | 入力フィールド以外 |
| **←** (Left Arrow) | 前のレベルに戻る | 入力フィールド以外 |
| **→** (Right Arrow) | 次のレベルに進む | 入力フィールド以外 |
| **R** | タイマーリセット | 入力フィールド以外 |
| **F** | フルスクリーン切り替え | 常時 |
| **Esc** | 設定を閉じる/フルスクリーン解除 | 常時 |
| **?** | ショートカットヘルプ表示 | 常時 |

### 2.2 優先順位

1. **モーダル/ダイアログが開いている**: Escでモーダルを閉じる
2. **フルスクリーン中**: Escでフルスクリーン解除
3. **入力フィールドにフォーカス**: タイマー操作系を無効化
4. **通常時**: すべてのショートカット有効

## 3. 実装

### 3.1 KeyboardService

```typescript
/**
 * キーボードショートカットサービス
 */
export class KeyboardService {
  private handlers: Map<string, () => void> = new Map();
  private isInputFocused: boolean = false;
  private isModalOpen: boolean = false;
  private isFullscreen: boolean = false;

  constructor() {
    this.setupEventListener();
    this.setupFocusTracking();
  }

  /**
   * グローバルキーボードイベントリスナー
   */
  private setupEventListener(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      this.handleKeyPress(event);
    });
  }

  /**
   * 入力フィールドのフォーカスを追跡
   */
  private setupFocusTracking(): void {
    document.addEventListener('focusin', (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      this.isInputFocused = this.isInputElement(target);
    });

    document.addEventListener('focusout', () => {
      this.isInputFocused = false;
    });
  }

  /**
   * 要素が入力要素かを判定
   */
  private isInputElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      element.contentEditable === 'true'
    );
  }

  /**
   * キー押下ハンドラ
   */
  private handleKeyPress(event: KeyboardEvent): void {
    const key = event.key;

    // モーダル状態の更新（外部から注入）
    // 実際の実装ではContextから取得

    // Escキーの特別処理
    if (key === 'Escape') {
      this.handleEscape(event);
      return;
    }

    // ? キー（ヘルプ）は常に有効
    if (key === '?') {
      this.executeHandler('help', event);
      return;
    }

    // Fキー（フルスクリーン）は常に有効
    if (key === 'f' || key === 'F') {
      this.executeHandler('fullscreen', event);
      return;
    }

    // 入力フィールドにフォーカスがある場合、タイマー操作系を無効化
    if (this.isInputFocused) {
      return;
    }

    // キーバインディングの実行
    switch (key) {
      case ' ':
        this.executeHandler('toggle-timer', event);
        break;
      case 'ArrowLeft':
        this.executeHandler('previous-level', event);
        break;
      case 'ArrowRight':
        this.executeHandler('next-level', event);
        break;
      case 'r':
      case 'R':
        this.executeHandler('reset-timer', event);
        break;
    }
  }

  /**
   * Escキーの処理（優先順位あり）
   */
  private handleEscape(event: KeyboardEvent): void {
    // 1. モーダルが開いている → モーダルを閉じる
    if (this.isModalOpen) {
      this.executeHandler('close-modal', event);
      return;
    }

    // 2. フルスクリーン中 → フルスクリーン解除
    if (this.isFullscreen) {
      this.executeHandler('exit-fullscreen', event);
      return;
    }

    // 3. それ以外は何もしない
  }

  /**
   * ハンドラを実行
   */
  private executeHandler(action: string, event: KeyboardEvent): void {
    const handler = this.handlers.get(action);
    if (handler) {
      event.preventDefault();
      handler();
    }
  }

  /**
   * ショートカットハンドラを登録
   */
  registerHandler(action: string, handler: () => void): void {
    this.handlers.set(action, handler);
  }

  /**
   * ショートカットハンドラを解除
   */
  unregisterHandler(action: string): void {
    this.handlers.delete(action);
  }

  /**
   * モーダル状態を設定
   */
  setModalOpen(isOpen: boolean): void {
    this.isModalOpen = isOpen;
  }

  /**
   * フルスクリーン状態を設定
   */
  setFullscreen(isFullscreen: boolean): void {
    this.isFullscreen = isFullscreen;
  }

  /**
   * クリーンアップ
   */
  destroy(): void {
    this.handlers.clear();
  }
}

// シングルトンインスタンス
export const keyboardService = new KeyboardService();
```

### 3.2 useKeyboard カスタムフック

```typescript
import { useEffect } from 'react';
import { keyboardService } from '@/services/keyboard/KeyboardService';
import { useTimer } from './useTimer';
import { useTournament } from './useTournament';
import { useSettings } from './useSettings';

export function useKeyboard() {
  const { timer, start, pause, resume, reset } = useTimer();
  const { dispatch: tournamentDispatch } = useTournament();
  const { state: settings } = useSettings();

  useEffect(() => {
    // タイマー開始/一時停止/再開
    keyboardService.registerHandler('toggle-timer', () => {
      if (timer.status === 'idle') {
        start();
      } else if (timer.status === 'running') {
        pause();
      } else if (timer.status === 'paused') {
        resume();
      }
    });

    // 前のレベル
    keyboardService.registerHandler('previous-level', () => {
      tournamentDispatch({ type: 'PREVIOUS_LEVEL' });
    });

    // 次のレベル
    keyboardService.registerHandler('next-level', () => {
      tournamentDispatch({ type: 'NEXT_LEVEL' });
    });

    // リセット
    keyboardService.registerHandler('reset-timer', () => {
      if (window.confirm('タイマーをリセットしますか?')) {
        reset();
      }
    });

    // フルスクリーン切り替え
    keyboardService.registerHandler('fullscreen', () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    });

    // ヘルプ表示
    keyboardService.registerHandler('help', () => {
      // ヘルプモーダルを表示
      // 実装は後述
    });

    // クリーンアップ
    return () => {
      keyboardService.unregisterHandler('toggle-timer');
      keyboardService.unregisterHandler('previous-level');
      keyboardService.unregisterHandler('next-level');
      keyboardService.unregisterHandler('reset-timer');
      keyboardService.unregisterHandler('fullscreen');
      keyboardService.unregisterHandler('help');
    };
  }, [timer.status, start, pause, resume, reset, tournamentDispatch]);

  // モーダル状態の同期
  useEffect(() => {
    // 実際にはUIContextなどから取得
    const isModalOpen = false; // 仮
    keyboardService.setModalOpen(isModalOpen);
  }, []);

  // フルスクリーン状態の同期
  useEffect(() => {
    const updateFullscreenState = () => {
      keyboardService.setFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', updateFullscreenState);
    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreenState);
    };
  }, []);
}
```

### 3.3 アプリケーションルートでの初期化

```typescript
// App.tsx
import { useKeyboard } from '@/ui/hooks/useKeyboard';

export function App() {
  // グローバルにキーボードショートカットを有効化
  useKeyboard();

  return (
    <div className="app">
      {/* アプリケーションのコンテンツ */}
    </div>
  );
}
```

## 4. UI コンポーネント

### 4.1 KeyboardShortcutsHelp コンポーネント

```typescript
import React from 'react';
import styles from './KeyboardShortcutsHelp.module.css';

interface Shortcut {
  key: string;
  description: string;
}

const shortcuts: Shortcut[] = [
  { key: 'Space', description: 'タイマーを開始/一時停止' },
  { key: '←', description: '前のレベルに戻る' },
  { key: '→', description: '次のレベルに進む' },
  { key: 'R', description: 'タイマーをリセット' },
  { key: 'F', description: 'フルスクリーン切り替え' },
  { key: 'Esc', description: '設定を閉じる/フルスクリーン解除' },
  { key: '?', description: 'このヘルプを表示' },
];

export const KeyboardShortcutsHelp: React.FC = () => {
  return (
    <div className={styles.container}>
      <h2>キーボードショートカット</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>キー</th>
            <th>動作</th>
          </tr>
        </thead>
        <tbody>
          {shortcuts.map((shortcut) => (
            <tr key={shortcut.key}>
              <td className={styles.key}>
                <kbd>{shortcut.key}</kbd>
              </td>
              <td>{shortcut.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.note}>
        <p>
          ※ 入力フィールドにフォーカスがある場合、
          タイマー操作系のショートカットは無効化されます。
        </p>
      </div>
    </div>
  );
};
```

### 4.2 KeyboardHint コンポーネント（メイン画面）

```typescript
import React, { useState } from 'react';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { Modal } from '../common/Modal';
import styles from './KeyboardHint.module.css';

export const KeyboardHint: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <div className={styles.hint}>
        <button
          onClick={() => setShowHelp(true)}
          className={styles.helpButton}
          aria-label="キーボードショートカットを表示"
        >
          <kbd>?</kbd> ショートカット
        </button>
      </div>

      {showHelp && (
        <Modal onClose={() => setShowHelp(false)}>
          <KeyboardShortcutsHelp />
        </Modal>
      )}
    </>
  );
};
```

## 5. フォーカス管理

### 5.1 モーダル内のフォーカストラップ

```typescript
import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // 初期フォーカス
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return containerRef;
}
```

### 5.2 Modal でのフォーカストラップ使用

```typescript
import React, { useEffect } from 'react';
import { useFocusTrap } from '@/ui/hooks/useFocusTrap';
import styles from './Modal.module.css';

interface Props {
  children: React.ReactNode;
  onClose: () => void;
}

export const Modal: React.FC<Props> = ({ children, onClose }) => {
  const containerRef = useFocusTrap(true);

  // Escキーでモーダルを閉じる（KeyboardServiceが処理）
  useEffect(() => {
    keyboardService.setModalOpen(true);
    keyboardService.registerHandler('close-modal', onClose);

    return () => {
      keyboardService.setModalOpen(false);
      keyboardService.unregisterHandler('close-modal');
    };
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={containerRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
};
```

## 6. アクセシビリティ

### 6.1 ARIA属性

```tsx
// ボタンにショートカットを明示
<button
  onClick={handleStart}
  aria-keyshortcuts="Space"
  aria-label="タイマーを開始 (Space)"
>
  開始
</button>

<button
  onClick={handlePrevious}
  aria-keyshortcuts="ArrowLeft"
  aria-label="前のレベル (←)"
>
  ← 前へ
</button>
```

### 6.2 視覚的なヒント

```css
/* kbdタグのスタイリング */
kbd {
  display: inline-block;
  padding: 2px 6px;
  font-family: var(--font-family-mono);
  font-size: 0.9em;
  color: var(--color-text-primary);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
}
```

## 7. テストケース

### 7.1 KeyboardService テスト

```typescript
import { describe, it, expect, vi } from 'vitest';
import { KeyboardService } from '@/services/keyboard/KeyboardService';

describe('KeyboardService', () => {
  it('ハンドラを登録・実行できる', () => {
    const service = new KeyboardService();
    const handler = vi.fn();

    service.registerHandler('test-action', handler);

    // キーイベントをシミュレート
    const event = new KeyboardEvent('keydown', { key: ' ' });
    document.dispatchEvent(event);

    // ハンドラが呼ばれない（Spaceはtoggle-timerにマッピングされているため）
    // 実際のテストではより詳細な検証が必要
  });

  it('入力フィールドにフォーカスがある時は無効化', () => {
    const service = new KeyboardService();
    const handler = vi.fn();

    service.registerHandler('toggle-timer', handler);

    // 入力フィールドにフォーカス
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    // キーイベント
    const event = new KeyboardEvent('keydown', { key: ' ' });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });
});
```

## 8. エッジケース

### 8.1 複数のモーダルが開いている場合

```typescript
// モーダルスタックで管理
class ModalStack {
  private stack: string[] = [];

  push(modalId: string): void {
    this.stack.push(modalId);
    keyboardService.setModalOpen(true);
  }

  pop(): string | undefined {
    const modalId = this.stack.pop();
    if (this.stack.length === 0) {
      keyboardService.setModalOpen(false);
    }
    return modalId;
  }

  get current(): string | undefined {
    return this.stack[this.stack.length - 1];
  }
}
```

### 8.2 長押し対応（オプション）

```typescript
private keyPressStart: Map<string, number> = new Map();

private handleKeyDown(event: KeyboardEvent): void {
  const key = event.key;
  this.keyPressStart.set(key, Date.now());
}

private handleKeyUp(event: KeyboardEvent): void {
  const key = event.key;
  const startTime = this.keyPressStart.get(key);

  if (startTime) {
    const duration = Date.now() - startTime;
    if (duration > 500) {
      // 長押しとして扱う
      this.executeHandler(`long-press-${key}`, event);
    }
    this.keyPressStart.delete(key);
  }
}
```

## 9. パフォーマンス考慮事項

### 9.1 イベントリスナーの最適化

- グローバルリスナーは1つのみ（documentレベル）
- コンポーネントごとにリスナーを追加しない

### 9.2 ハンドラの登録/解除

- useEffectのクリーンアップで確実に解除
- メモリリークを防ぐ

## 10. まとめ

キーボードショートカット機能の主要な実装ポイント：

1. **グローバルリスナー**: 1つのサービスで集中管理
2. **入力フィールド対応**: フォーカス時は無効化
3. **優先順位**: Esc、?、Fは常時有効
4. **フォーカス管理**: モーダル内のフォーカストラップ
5. **アクセシビリティ**: ARIA属性と視覚的ヒント

---

## 関連ドキュメント

- [timer.md](./timer.md) - タイマー操作との連携
- [03-design-system.md](../03-design-system.md) - kbdタグのスタイリング

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2026-01-26 | 初版作成 | AI System Architect |
