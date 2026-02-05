/**
 * virtual:pwa-register/react のテスト用モック
 * テスト環境ではPWA機能は不要なため、空の実装を提供
 */
import { vi } from 'vitest';

export const useRegisterSW = vi.fn(() => ({
  needRefresh: [false, vi.fn()],
  offlineReady: [false, vi.fn()],
  updateServiceWorker: vi.fn(),
}));
