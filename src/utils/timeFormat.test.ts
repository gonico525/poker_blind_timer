import { describe, it, expect } from 'vitest';
import { formatTime, formatLongTime } from './timeFormat';

describe('formatTime', () => {
  it('should format 0 seconds as "00:00"', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('should format 65 seconds as "01:05"', () => {
    expect(formatTime(65)).toBe('01:05');
  });

  it('should format 600 seconds as "10:00"', () => {
    expect(formatTime(600)).toBe('10:00');
  });

  it('should format 3599 seconds as "59:59"', () => {
    expect(formatTime(3599)).toBe('59:59');
  });

  it('should handle negative values by returning "00:00"', () => {
    expect(formatTime(-1)).toBe('00:00');
  });

  it('should pad single digits with zero', () => {
    expect(formatTime(5)).toBe('00:05');
    expect(formatTime(60)).toBe('01:00');
  });
});

describe('formatLongTime', () => {
  it('should format time under 1 hour as MM:SS', () => {
    expect(formatLongTime(0)).toBe('00:00');
    expect(formatLongTime(3599)).toBe('59:59');
  });

  it('should format time over 1 hour as H:MM:SS', () => {
    expect(formatLongTime(3600)).toBe('1:00:00');
    expect(formatLongTime(3661)).toBe('1:01:01');
    expect(formatLongTime(7200)).toBe('2:00:00');
  });

  it('should handle negative values by returning "00:00"', () => {
    expect(formatLongTime(-1)).toBe('00:00');
  });
});
