// The Golden Neptune: awarded on the last day of St. Dominic's Fair, every summer.
// See project.md section 5.

import { balance } from '../data/balance';
import { CALENDAR_EVENTS } from '../data/events';
import { dateOf } from './calendar';
import type { Restaurant } from './types';

const fair = CALENDAR_EVENTS.fair;
const dateNumber = (month: number, day: number) => month * 100 + day;

export function isFairDay(day: number): boolean {
  const { month, dayOfMonth } = dateOf(day);
  const today = dateNumber(month, dayOfMonth);
  return today >= dateNumber(fair.start.month, fair.start.day) && today <= dateNumber(fair.end.month, fair.end.day);
}

/** The last day of the Fair, when the Golden Neptune is awarded. */
export function isNeptuneDay(day: number): boolean {
  const { month, dayOfMonth } = dateOf(day);
  return month === fair.end.month && dayOfMonth === fair.end.day;
}

/**
 * Neptune Score, 0–100.
 * @param averageRating average guest satisfaction over the season, 0–100
 * @param fairShare share of all Old Town guests served during the Fair, 0–1
 */
export function neptuneScore(averageRating: number, fairShare: number): number {
  const n = balance.neptune;
  return n.ratingWeight * averageRating + n.shareWeight * fairShare * 100;
}

/** Everyone's ratings and Fair guests since the last Golden Neptune. */
export interface SeasonTally {
  ratings: Record<string, { total: number; count: number }>;
  fairGuests: Record<string, number>;
}

export interface NeptuneResult {
  /** Best first. */
  scores: { id: string; name: string; score: number; rating: number; fairShare: number }[];
  playerWon: boolean;
}

export function neptuneResult(season: SeasonTally, restaurants: Restaurant[]): NeptuneResult {
  const allFairGuests = Object.values(season.fairGuests).reduce((sum, n) => sum + n, 0);
  const scores = restaurants
    .map((restaurant) => {
      const r = season.ratings[restaurant.id];
      const rating = r && r.count > 0 ? r.total / r.count : 0;
      const fairShare = allFairGuests > 0 ? (season.fairGuests[restaurant.id] ?? 0) / allFairGuests : 0;
      return { id: restaurant.id, name: restaurant.name, score: neptuneScore(rating, fairShare), rating, fairShare };
    })
    .sort((a, b) => b.score - a.score);
  return { scores, playerWon: scores[0].id === 'player' };
}
