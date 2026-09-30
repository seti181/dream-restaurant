import { describe, expect, it } from 'vitest';
import { advanceTick, formatTime, isClosed, minuteOfDay, startOfDay, ticksPerDay } from './clock';

describe('clock', () => {
  it('runs from 11:00 to 22:00 in 5-minute ticks', () => {
    expect(ticksPerDay()).toBe(132);
    expect(formatTime(minuteOfDay(0))).toBe('11:00');
    expect(formatTime(minuteOfDay(1))).toBe('11:05');
    expect(formatTime(minuteOfDay(ticksPerDay()))).toBe('22:00');
  });

  it('formats times with leading zeros', () => {
    expect(formatTime(9 * 60 + 5)).toBe('09:05');
  });

  it('closes after a full day of ticks, not before', () => {
    let clock = startOfDay(3);
    for (let i = 0; i < ticksPerDay() - 1; i++) clock = advanceTick(clock);
    expect(isClosed(clock)).toBe(false);
    clock = advanceTick(clock);
    expect(isClosed(clock)).toBe(true);
    expect(clock.day).toBe(3);
  });
});
