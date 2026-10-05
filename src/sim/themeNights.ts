// Theme nights: booking one for an evening this week, and what it does that evening.
// The themes themselves are in data/themeNights.ts. See project.md section 6.15, A4.

import { balance } from '../data/balance';
import type { GroupId } from '../data/groups';
import { THEME_NIGHTS, type ThemeNightId } from '../data/themeNights';
import type { Restaurant, TrendToday } from './types';

/** A theme night booked for one evening. Saved with the game. */
export interface ThemeNightBooking {
  id: ThemeNightId;
  day: number;
}

/** The week a day falls in (day 0 is a Monday). */
export const weekOf = (day: number) => Math.floor(day / 7);

/** True while a restaurant's theme night is on, for this group (any group if none is given). */
export function themeNightOn(restaurant: Restaurant, minute: number, group?: GroupId): boolean {
  const night = restaurant.themeNight;
  return night !== undefined && minute >= night.from && (group === undefined || night.groups.includes(group));
}

/** For a guest the theme night is for: what they came for, as a perfect match (like a trend). */
export function themeCraving(restaurant: Restaurant, minute: number, group: GroupId): TrendToday | null {
  const night = restaurant.themeNight;
  if (!night?.wants || !themeNightOn(restaurant, minute, group)) return null;
  return { group, wants: night.wants };
}

/** What the restaurant looks like for the day of a booked theme night: the evening it's on. */
export function themeNightFor(booking: ThemeNightBooking | null, day: number): Restaurant['themeNight'] {
  if (!booking || booking.day !== day) return undefined;
  const { groups, wants, mood } = THEME_NIGHTS[booking.id];
  return { from: balance.themeNights.fromMinute, groups, wants, mood };
}
