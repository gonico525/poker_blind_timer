import type { Settings, Preset, TournamentState } from '@/types';
import { STORAGE_KEYS } from '@/utils';

/**
 * StorageService
 * localStorage を使用したデータ永続化サービス
 */
export const StorageService = {
  /**
   * localStorage が利用可能かチェック
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
  },

  /**
   * データを保存
   */
  set<T>(key: string, value: T): void {
    try {
      const json = JSON.stringify(value);
      localStorage.setItem(key, json);
    } catch (error) {
      console.error(
        `Failed to save data to localStorage (key: ${key}):`,
        error
      );
    }
  },

  /**
   * データを取得
   */
  get<T>(key: string): T | null {
    try {
      const json = localStorage.getItem(key);
      if (json === null) {
        return null;
      }
      return JSON.parse(json) as T;
    } catch (error) {
      console.error(
        `Failed to load data from localStorage (key: ${key}):`,
        error
      );
      return null;
    }
  },

  /**
   * データを削除
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(
        `Failed to remove data from localStorage (key: ${key}):`,
        error
      );
    }
  },

  /**
   * 全データをクリア
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },

  /**
   * 設定を保存
   */
  saveSettings(settings: Settings): void {
    this.set(STORAGE_KEYS.SETTINGS, settings);
  },

  /**
   * 設定を読み込み
   */
  loadSettings(): Settings | null {
    return this.get<Settings>(STORAGE_KEYS.SETTINGS);
  },

  /**
   * プリセット一覧を保存
   */
  savePresets(presets: Preset[]): void {
    this.set(STORAGE_KEYS.PRESETS, presets);
  },

  /**
   * プリセット一覧を読み込み
   */
  loadPresets(): Preset[] | null {
    return this.get<Preset[]>(STORAGE_KEYS.PRESETS);
  },

  /**
   * トーナメント状態を保存
   */
  saveTournamentState(state: TournamentState): void {
    this.set(STORAGE_KEYS.TOURNAMENT_STATE, state);
  },

  /**
   * トーナメント状態を読み込み
   */
  loadTournamentState(): TournamentState | null {
    return this.get<TournamentState>(STORAGE_KEYS.TOURNAMENT_STATE);
  },

  /**
   * トーナメント状態を削除
   */
  removeTournamentState(): void {
    this.remove(STORAGE_KEYS.TOURNAMENT_STATE);
  },
};
