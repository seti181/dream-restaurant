// Shapes of the simulation's state. Everything here is plain data so it can be saved as JSON.

import type { MenuDish } from '../data/dishes';
import type { GroupId } from '../data/groups';
import type { LocationId } from '../data/locations';

/** A chef or waiter. Skill and speed run from 1 to 5. Names, traits and wages arrive with hiring in M2. */
export interface Staff {
  skill: number;
  speed: number;
}

/** The player's restaurant or a rival. Both follow exactly the same rules. */
export interface Restaurant {
  /** 'player' or a rival id. */
  id: string;
  name: string;
  location: LocationId;
  menu: MenuDish[];
  tables: number;
  chefs: Staff[];
  waiters: Staff[];
  /** 0–100. */
  ambiance: number;
  /** 0–100 for each group. */
  reputation: Record<GroupId, number>;
  /** 0–100 for each group: how many have heard of this place. */
  awareness: Record<GroupId, number>;
}

/** A group of guests walking through the Old Town, looking for a meal. */
export interface Party {
  group: GroupId;
  size: number;
  /** The street where they start looking. */
  origin: LocationId;
  /** Minutes after midnight. */
  arrivalMinute: number;
}

/** Each factor runs from -1 (awful) through 0 (fine) to +1 (wonderful). */
export interface SatisfactionFactors {
  quality: number;
  value: number;
  wait: number;
  ambiance: number;
  service: number;
}

/**
 * What happened to one party. Logged for every party so reports and reviews
 * can explain why things happened.
 */
export interface PartyOutcome {
  /** Restaurant id, or null if the party went somewhere else entirely. */
  restaurant: string | null;
  group: GroupId;
  size: number;
  kind: 'served' | 'walkedOut' | 'noTable' | 'elsewhere';
  order: MenuDish[];
  revenue: number;
  ingredientCost: number;
  /** Minutes from sitting down to the food arriving (or to giving up). */
  waitMinutes: number;
  /** 0–100; null when the party never sat down. */
  satisfaction: number | null;
  /** Only for served parties. */
  factors: SatisfactionFactors | null;
}
