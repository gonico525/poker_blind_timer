/**
 * KeyboardService
 * キーボードイベントの管理サービス
 */

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

        try {
          subscription.handler(event);
        } catch (error) {
          console.error('Keyboard handler error:', error);
        }
      }
    }
  }

  private isInputFocused(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement | null;
    if (!target || !target.tagName) return false;

    const tagName = target.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      target.contentEditable === 'true'
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
