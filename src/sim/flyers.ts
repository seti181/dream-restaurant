// Attracting passers-by (project.md section 6.14): while the restaurant is open, the player can
// hand a flyer to someone walking past. Some come in, and everyone who takes one has heard of you.
//
// Flyers use their own random generator, so they never change who else comes in or what they order.

import { balance } from '../data/balance';
import { GROUPS, type GroupId } from '../data/groups';
import { minuteOfDay, ticksPerDay } from './clock';
import { seat, type DayInProgress } from './day';
import { chance, createRng, nextInt, type RngState } from './rng';

/** Today's flyers. Only lives while the day runs, so it is never saved. */
export interface FlyersToday {
  rng: RngState;
  /** Flyers still in hand. */
  left: number;
  handedOut: number;
  /** Parties who came in because of a flyer, and how many people they were. */
  parties: number;
  guests: number;
}

export function planFlyers(seed: number): FlyersToday {
  return { rng: createRng(seed), left: balance.flyers.perDay, handedOut: 0, parties: 0, guests: 0 };
}

/** How likely someone from this group is to come in with a flyer: better the more they like the place. */
export function flyerChance(progress: DayInProgress, group: GroupId): number {
  const { chance: base, reputationChance } = balance.flyers;
  return base + (reputationChance * progress.restaurants[0].reputation[group]) / 100;
}

/**
 * Hands a flyer to someone from this group walking past. They've heard of the place now, whatever
 * happens. Returns true if they decide to come in, false if they walk on, or null if there are no
 * flyers left or the day is over.
 */
export function handOutFlyer(flyers: FlyersToday, progress: DayInProgress, group: GroupId): boolean | null {
  if (flyers.left <= 0 || progress.tick >= ticksPerDay()) return null;
  flyers.left--;
  flyers.handedOut++;
  const awareness = progress.restaurants[0].awareness;
  awareness[group] = Math.min(100, awareness[group] + balance.flyers.awareness);
  return chance(flyers.rng, flyerChance(progress, group));
}

/**
 * Someone who took a flyer has walked to the door: they come in with their friends, as a party of
 * their group, and sit down (or wait at the door, if every table is taken).
 */
export function flyerGuestsArrive(flyers: FlyersToday, progress: DayInProgress, group: GroupId): void {
  if (progress.tick >= ticksPerDay()) return;
  const restaurant = progress.restaurants[0];
  const { min, max } = GROUPS[group].partySize;
  const size = nextInt(flyers.rng, min, max);
  const minute = minuteOfDay(progress.tick);
  const party = { group, size, origin: restaurant.location, arrivalMinute: minute };
  seat(flyers.rng, progress, 0, party, minute);
  // They count if they sat down or are waiting at the door (not if the queue was already full).
  const floor = progress.floors[0];
  if (floor.visits.some((v) => v.party === party) || floor.door.some((w) => w.party === party)) {
    flyers.parties++;
    flyers.guests += size;
  }
}
