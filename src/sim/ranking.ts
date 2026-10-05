// Dziennik Bałtycki's Old Town top five: every Monday, the player and the rivals ranked by the
// Golden Neptune score so far, so the race is visible all season. See project.md section 6.15, B8.

import type { GroupId } from '../data/groups';
import { PLACES, RANKING_HEADLINES } from '../data/ranking';
import { neptuneScore, type SeasonTally } from './neptune';
import type { Restaurant } from './types';

export interface RankingRow {
  id: string;
  name: string;
  /** The star rating (1–5), as the top of the screen shows the player's. */
  stars: number;
  /** Guests served last week. */
  guests: number;
  /** The Neptune score so far (0–100). */
  score: number;
}

/** One week's top five. Saved with the game until the next one. */
export interface OldTownRanking {
  /** The Monday it came out. */
  day: number;
  /** Best first. */
  rows: RankingRow[];
  /** Each restaurant's place the week before (0 = first), if there was a ranking then. */
  before: Record<string, number> | null;
  /** During the Fair: the days left until the Golden Neptune is awarded. */
  daysToNeptune: number | null;
  headline: string;
}

/** The place in words: "third". */
export const placeName = (index: number) => PLACES[index] ?? `${index + 1}th`;

export interface RankingInput {
  day: number;
  restaurants: Restaurant[];
  /** Each restaurant's star rating. */
  stars: (restaurant: Restaurant) => number;
  /** Guests each restaurant served last week, by group. */
  weekServed: Record<string, Partial<Record<GroupId, number>>>;
  season: SeasonTally;
  /** Days left until the Golden Neptune, while the Fair is on (its guests then count instead of last week's). */
  daysToNeptune: number | null;
  previous: OldTownRanking | null;
}

const total = (served: Partial<Record<GroupId, number>> | undefined) =>
  Object.values(served ?? {}).reduce((sum, n) => sum + (n ?? 0), 0);

/**
 * The week's top five: the Neptune score so far, from the season's average rating and the share
 * of Old Town guests (last week's, or during the Fair the Fair's so far, as the Neptune counts them).
 */
export function weeklyRanking(input: RankingInput): OldTownRanking {
  const { restaurants, season, weekServed, previous, daysToNeptune } = input;
  const fair = daysToNeptune !== null;
  const guests = (id: string) => (fair ? (season.fairGuests[id] ?? 0) : total(weekServed[id]));
  const allGuests = restaurants.reduce((sum, r) => sum + guests(r.id), 0);
  const rows = restaurants
    .map((restaurant) => {
      const r = season.ratings[restaurant.id];
      const rating = r && r.count > 0 ? r.total / r.count : 0;
      const share = allGuests > 0 ? guests(restaurant.id) / allGuests : 0;
      return {
        id: restaurant.id,
        name: restaurant.name,
        stars: input.stars(restaurant),
        guests: total(weekServed[restaurant.id]),
        score: neptuneScore(rating, share),
      };
    })
    .sort((a, b) => b.score - a.score);
  const before = previous ? Object.fromEntries(previous.rows.map((row, i) => [row.id, i])) : null;
  return { day: input.day, rows, before, daysToNeptune, headline: headlineFor(rows, before) };
}

function headlineFor(rows: RankingRow[], before: Record<string, number> | null): string {
  const h = RANKING_HEADLINES;
  const player = rows.find((row) => row.id === 'player');
  const place = rows.findIndex((row) => row.id === 'player');
  const fill = (text: string) =>
    text.replace('{player}', player?.name ?? '').replace('{leader}', rows[0].name).replace('{place}', placeName(place));
  if (!before) return fill(place === 0 ? h.playerTop : h.first);
  const was = before.player;
  if (place === 0) return fill(was === 0 ? h.playerStaysTop : h.playerTop);
  if (was !== undefined && place < was) return fill(h.playerUp);
  if (was !== undefined && place > was) return fill(h.playerDown);
  return fill(before[rows[0].id] === 0 ? h.leaderStays : h.leaderNew);
}
