/**
 * 時間フォーマット関数
 */

/**
 * 秒数を MM:SS 形式にフォーマット
 * @param seconds - 秒数
 * @returns MM:SS形式の文字列
 */
export function formatTime(seconds: number): string {
  if (seconds < 0) return '00:00';

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 秒数を H:MM:SS 形式にフォーマット（経過時間用）
 * @param seconds - 秒数
 * @returns H:MM:SS形式の文字列（1時間未満の場合はMM:SS）
 */
export function formatLongTime(seconds: number): string {
  if (seconds < 0) return '00:00';

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return formatTime(seconds);
}
