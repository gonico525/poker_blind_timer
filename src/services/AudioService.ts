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
          let resolved = false;

          // タイムアウト（2秒後に強制解決）
          const timeout = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              console.warn(`Audio load timeout: ${src}`);
              resolve(new Audio());
            }
          }, 2000);

          // エラーイベントをキャッチ
          audio.addEventListener('error', () => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              console.warn(`Failed to load audio: ${src}`);
              resolve(new Audio()); // 空のAudioを返す
            }
          });

          // 読み込み成功
          audio.addEventListener(
            'canplaythrough',
            () => {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                resolve(audio);
              }
            },
            { once: true }
          );

          audio.load();
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
