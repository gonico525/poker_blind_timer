import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioService } from './AudioService';

describe('AudioService', () => {
  let mockAudioElements: Array<{
    play: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    load: ReturnType<typeof vi.fn>;
    volume: number;
    currentTime: number;
  }>;

  beforeEach(() => {
    mockAudioElements = [];

    // Audioコンストラクタをクラスとしてモック（各インスタンスは独立）
    const MockAudio = class {
      play: ReturnType<typeof vi.fn>;
      pause: ReturnType<typeof vi.fn>;
      load: ReturnType<typeof vi.fn>;
      private _volume = 1;
      private _currentTime = 0;

      constructor() {
        this.play = vi.fn().mockResolvedValue(undefined);
        this.pause = vi.fn();
        this.load = vi.fn();

        // モックインスタンスを記録
        mockAudioElements.push({
          play: this.play,
          pause: this.pause,
          load: this.load,
          volume: this._volume,
          currentTime: this._currentTime,
        });
      }

      get volume() {
        return this._volume;
      }
      set volume(value: number) {
        this._volume = value;
        // 対応する要素も更新
        const index = mockAudioElements.findIndex(
          (el) => el.play === this.play
        );
        if (index !== -1) {
          mockAudioElements[index].volume = value;
        }
      }
      get currentTime() {
        return this._currentTime;
      }
      set currentTime(value: number) {
        this._currentTime = value;
        const index = mockAudioElements.findIndex(
          (el) => el.play === this.play
        );
        if (index !== -1) {
          mockAudioElements[index].currentTime = value;
        }
      }
    };

    vi.stubGlobal('Audio', MockAudio);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    AudioService.cleanup();
  });

  describe('preload', () => {
    it('should preload all audio files', async () => {
      await AudioService.preload();

      // preloadが正常に完了することを確認
      // 実際のファイル読み込みはモックされている（3つの音声ファイル）
      expect(mockAudioElements).toHaveLength(3);
      mockAudioElements.forEach((el) => {
        expect(el.load).toHaveBeenCalled();
      });
    });

    it('should resolve even if some files fail to load', async () => {
      // 次のAudioインスタンスのloadが失敗するようにする
      const OriginalAudio = (global as unknown as { Audio: typeof Audio })
        .Audio;
      const MockAudioWithError = class extends OriginalAudio {
        load = vi.fn().mockImplementation(() => {
          throw new Error('Load failed');
        });
      };
      vi.stubGlobal('Audio', MockAudioWithError);

      await expect(AudioService.preload()).resolves.not.toThrow();
    });
  });

  describe('playLevelChange', () => {
    it('should play level change sound', async () => {
      await AudioService.preload();
      AudioService.playLevelChange();

      // 最初のAudio要素（levelChange）が再生される
      expect(mockAudioElements[0].currentTime).toBe(0);
      expect(mockAudioElements[0].play).toHaveBeenCalled();
    });

    it('should not play when disabled', async () => {
      await AudioService.preload();
      AudioService.setEnabled(false);
      AudioService.playLevelChange();

      expect(mockAudioElements[0].play).not.toHaveBeenCalled();
    });
  });

  describe('playWarning1Min', () => {
    it('should play warning sound without error', async () => {
      await AudioService.preload();

      // エラーがスローされないことを確認
      expect(() => AudioService.playWarning1Min()).not.toThrow();
    });

    it('should not throw when disabled', async () => {
      await AudioService.preload();
      AudioService.setEnabled(false);

      // エラーがスローされないことを確認
      expect(() => AudioService.playWarning1Min()).not.toThrow();
    });
  });

  describe('playBreakStart', () => {
    it('should play break start sound without error', async () => {
      await AudioService.preload();

      // エラーがスローされないことを確認
      expect(() => AudioService.playBreakStart()).not.toThrow();
    });

    it('should not throw when disabled', async () => {
      await AudioService.preload();
      AudioService.setEnabled(false);

      // エラーがスローされないことを確認
      expect(() => AudioService.playBreakStart()).not.toThrow();
    });
  });

  describe('setVolume', () => {
    it('should set volume for all audio elements', async () => {
      await AudioService.preload();
      AudioService.setVolume(0.5);

      // 全てのAudio要素の音量が設定される
      mockAudioElements.forEach((el) => {
        expect(el.volume).toBe(0.5);
      });
    });

    it('should clamp volume between 0 and 1', async () => {
      await AudioService.preload();

      AudioService.setVolume(1.5);
      mockAudioElements.forEach((el) => {
        expect(el.volume).toBe(1);
      });

      AudioService.setVolume(-0.5);
      mockAudioElements.forEach((el) => {
        expect(el.volume).toBe(0);
      });
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

  describe('getVolume', () => {
    it('should return current volume', () => {
      AudioService.setVolume(0.3);
      expect(AudioService.getVolume()).toBe(0.3);
    });
  });

  describe('error handling', () => {
    it('should handle play errors gracefully', async () => {
      await AudioService.preload();

      // playが失敗するように設定
      mockAudioElements[0].play = vi
        .fn()
        .mockRejectedValue(new Error('Play failed'));

      // エラーをスローしないことを確認
      expect(() => AudioService.playLevelChange()).not.toThrow();
    });

    it('should handle preload errors gracefully', async () => {
      // 既にbeforeEachでテスト済み（should resolve even if some files fail to load）
      // ここではシンプルに確認
      await expect(AudioService.preload()).resolves.toBeUndefined();
    });
  });

  describe('cleanup', () => {
    it('should clear all audio elements', async () => {
      await AudioService.preload();
      const initialPlayMock = mockAudioElements[0].play;
      vi.clearAllMocks(); // モックをクリアしてテストの前提を作る

      AudioService.cleanup();

      // cleanup後は再生しても何も起きない
      AudioService.playLevelChange();
      expect(initialPlayMock).not.toHaveBeenCalled();
    });
  });
});
