// Rush hour: at the lunch and dinner peaks the player can hurry a chef or a waiter (who then
// needs a breather), and quick service all day builds a streak with tips. See project.md section 6.15, D11.

import { balance } from '../data/balance';

/** Which rush is on at this minute (an index into balance.rush.windows), or null. */
export function rushAt(minute: number): number | null {
  const index = balance.rush.windows.findIndex((w) => minute >= w.from && minute < w.until);
  return index < 0 ? null : index;
}

/** The rush's name for the screen ("Lunch rush"), or null outside the rushes. */
export function rushName(minute: number): string | null {
  const index = rushAt(minute);
  return index === null ? null : balance.rush.windows[index].name;
}

/** The tip per guest for a party that makes the streak this long. */
export function streakTipPerGuest(streak: number): number {
  return balance.rush.streakTips.filter((tier) => streak >= tier.from).reduce((tip, tier) => Math.max(tip, tier.tipPerGuest), 0);
}
