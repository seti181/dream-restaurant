// The Golden Neptune: awarded at the end of St. Dominic's Fair. See project.md section 5.

import { balance } from '../data/balance';

export function isFairDay(day: number): boolean {
  const { seasonLengthDays, fairLengthDays } = balance.calendar;
  return day >= seasonLengthDays - fairLengthDays && day < seasonLengthDays;
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
