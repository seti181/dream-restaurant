// The in-game clock. A day is split into ticks of a few in-game minutes,
// from opening time (tick 0) until closing time.

import { balance } from '../data/balance';

export interface ClockState {
  /** Days since the season started; day 0 is the first day. */
  day: number;
  /** Ticks since opening time today. */
  tick: number;
}

const { tickMinutes, openMinute, closeMinute } = balance.clock;

/** Number of ticks between opening and closing. */
export function ticksPerDay(): number {
  return Math.floor((closeMinute - openMinute) / tickMinutes);
}

/** Minutes after midnight for a tick of the day. */
export function minuteOfDay(tick: number): number {
  return openMinute + tick * tickMinutes;
}

/** "11:05"-style text for minutes after midnight. */
export function formatTime(minute: number): string {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function startOfDay(day: number): ClockState {
  return { day, tick: 0 };
}

export function advanceTick(clock: ClockState): ClockState {
  return { day: clock.day, tick: clock.tick + 1 };
}

/** True once the clock has reached closing time. */
export function isClosed(clock: ClockState): boolean {
  return clock.tick >= ticksPerDay();
}
