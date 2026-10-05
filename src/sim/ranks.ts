// Restaurant rank-ups: from Bar to Old Town Favourite, with guests served and stars, each rank
// unlocking something. The ranks themselves are in data/ranks.ts. See project.md section 6.15, B7.

import { balance } from '../data/balance';
import type { GroupId } from '../data/groups';
import { RANKS } from '../data/ranks';

export const TOP_RANK = RANKS.length - 1;

/** The rank from which bigger names notice the restaurant (choice cards that need a known place). */
export const KNOWN_PLACE_RANK = RANKS.findIndex((rank) => rank.knownPlace);

/** All the guests served, whatever their group. */
export function totalGuests(served: Partial<Record<GroupId, number>>): number {
  return Object.values(served).reduce((sum, n) => sum + (n ?? 0), 0);
}

/** The rank reached with these guests and stars: never lower than the one already held. */
export function rankFor(current: number, guests: number, stars: number): number {
  let rank = current;
  while (rank < TOP_RANK && guests >= RANKS[rank + 1].guests && stars >= RANKS[rank + 1].stars) rank++;
  return rank;
}

/** How big the menu can get: the biggest menu board, plus slots the ranks reached have added. */
export function maxMenuSlots(rank: number): number {
  return balance.menu.maxSlots + RANKS.slice(1, rank + 1).reduce((sum, r) => sum + (r.menuSlots ?? 0), 0);
}
