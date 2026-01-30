import { useState, useRef, useEffect } from 'react';
import { Slider } from '@/components/common/Slider';
import { Toggle } from '@/components/common/Toggle';
import styles from './VolumeControl.module.css';

export interface VolumeControlProps {
  volume: number; // 0-1の範囲
  isSoundEnabled: boolean;
  onVolumeChange: (volume: number) => void;
  onSoundEnabledChange: (enabled: boolean) => void;
}

/**
 * VolumeControl コンポーネント
 * ヘッダーの音量コントロール（アイコン + ポップアップ）
 */
export function VolumeControl({
  volume,
  isSoundEnabled,
  onVolumeChange,
  onSoundEnabledChange,
}: VolumeControlProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 音量レベルに応じたアイコンを取得
  const getVolumeIcon = (): string => {
    if (!isSoundEnabled || volume === 0) {
      return '🔇';
    }
    if (volume < 0.33) {
      return '🔈';
    }
    if (volume < 0.66) {
      return '🔉';
    }
    return '🔊';
  };

  // ポップアップ外クリックで閉じる
  useEffect(() => {
    if (!isPopoverOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  // Escキーで閉じる
  useEffect(() => {
    if (!isPopoverOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPopoverOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isPopoverOpen]);

  const handleTogglePopover = () => {
    setIsPopoverOpen((prev) => !prev);
  };

  const handleVolumeChange = (newVolume: number) => {
    // SliderはパーセンテージなのでDecimalに変換（0-100 -> 0-1）
    onVolumeChange(newVolume / 100);
  };

  const handleSoundToggle = (enabled: boolean) => {
    onSoundEnabledChange(enabled);
  };

  return (
    <div className={styles.container}>
      <button
        ref={buttonRef}
        className={styles.trigger}
        onClick={handleTogglePopover}
        aria-label="音量設定"
        aria-expanded={isPopoverOpen}
        aria-haspopup="true"
        type="button"
      >
        <span className={styles.icon} aria-hidden="true">
          {getVolumeIcon()}
        </span>
      </button>

      {isPopoverOpen && (
        <div
          ref={popoverRef}
          className={styles.popover}
          role="dialog"
          aria-label="音量設定"
        >
          <div className={styles.popoverContent}>
            <div className={styles.sliderSection}>
              <label htmlFor="volume-slider" className={styles.label}>
                音量
              </label>
              <Slider
                id="volume-slider"
                min={0}
                max={100}
                step={1}
                value={Math.round(volume * 100)}
                onChange={handleVolumeChange}
                showValue={true}
                disabled={!isSoundEnabled}
              />
            </div>

            <div className={styles.toggleSection}>
              <Toggle
                label="音声ON"
                value={isSoundEnabled}
                onChange={handleSoundToggle}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
