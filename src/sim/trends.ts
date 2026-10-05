// Weekly trends: every Monday Gdańsk goes crazy about something new, and for the week one group
// craves it. The trends themselves are in data/trends.ts. See project.md section 6.15, B6.

import { GROUPS } from '../data/groups';
import { TREND_IDS, TRENDS, type TrendId } from '../data/trends';
import { createRng, pick } from './rng';
import type { TrendToday } from './types';

/** This week's trend. Saved with the game. */
export interface TrendState {
  id: TrendId;
  /** The last day it lasts (a Sunday). */
  untilDay: number;
}

/** A trend for the week starting on `monday`, never last week's again. Its own dice, so nothing else changes. */
export function rollTrend(seed: number, monday: number, lastWeek: TrendId | null): TrendState {
  const id = pick(createRng(seed), TREND_IDS.filter((t) => t !== lastWeek));
  return { id, untilDay: monday + 6 };
}

/** What the trend does on this day, or null if none is on. */
export function trendOn(trend: TrendState | null, day: number): TrendToday | null {
  if (!trend || day > trend.untilDay) return null;
  const { group, wants } = TRENDS[trend.id];
  return { group, wants };
}

/** "Locals and families want anything from the sea this week." */
export function trendLine(id: TrendId): string {
  const trend = TRENDS[id];
  return `${GROUPS[trend.group].name} want ${trend.wantText} this week.`;
}
