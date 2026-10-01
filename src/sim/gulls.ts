// The gulls on the terrace: on days the terrace is open, a gull sometimes lands by a plate.
// Shooed away in time, the guests laugh; too late, it takes the plate. See project.md section 6.13.
//
// Gulls use their own random generator, so they never change who comes in or what they order.

import { balance } from '../data/balance';
import type { GroupId } from '../data/groups';
import { GULLS } from '../data/gulls';
import { minuteOfDay, ticksPerDay } from './clock';
import type { DayInProgress } from './day';
import { createRng, nextFloat, nextInt, pick, type RngState } from './rng';
import type { Review } from './types';

/** Today's gulls. Only lives while the day runs, so it is never saved. */
export interface GullsToday {
  rng: RngState;
  /** Minutes when a gull comes looking for food, earliest first. */
  slots: number[];
  /** The gull on the terrace now: which table it's after, and the tick by which it grabs the plate. */
  active: { table: number; group: GroupId; since: number; untilTick: number } | null;
  shooed: number;
  stolen: number;
  /** Reviews from tables that lost their food. */
  reviews: Review[];
  /** What the last gull did, for a note on screen. */
  last: { minute: number; text: string; shooed: boolean } | null;
}

/** Picks when gulls come today: only when the terrace is open. */
export function planGulls(seed: number, terraceTables: number): GullsToday {
  const rng = createRng(seed);
  const { perDay, firstMinute, lastMinute } = balance.gulls;
  const count = terraceTables > 0 ? nextInt(rng, perDay.min, perDay.max) : 0;
  const step = balance.clock.tickMinutes;
  const slots = Array.from({ length: count }, () => Math.round((firstMinute + nextFloat(rng) * (lastMinute - firstMinute)) / step) * step).sort(
    (a, b) => a - b,
  );
  return { rng, slots, active: null, shooed: 0, stolen: 0, reviews: [], last: null };
}

function changeReputation(progress: DayInProgress, group: GroupId, points: number): void {
  const reputation = progress.restaurants[0].reputation;
  reputation[group] = Math.max(0, Math.min(100, reputation[group] + points));
}

/** Moves the gulls along before each tick: one may land, or grab the plate it's been eyeing. */
export function stepGulls(today: GullsToday, progress: DayInProgress): void {
  const floor = progress.floors[0];
  const restaurant = progress.restaurants[0];
  const minute = minuteOfDay(progress.tick);

  if (today.active) {
    const { table, group } = today.active;
    const still = floor.visits.some((v) => v.tables.includes(table) && v.eating);
    if (!still) {
      // The plate went before the gull got to it.
      today.active = null;
    } else if (progress.tick >= today.active.untilTick) {
      today.active = null;
      today.stolen++;
      changeReputation(progress, group, -balance.gulls.stolenReputation);
      const review = pick(today.rng, GULLS.reviews);
      today.reviews.push({ stars: review.stars, text: review.text, reviewer: pick(today.rng, GULLS.reviewers), critic: false });
      today.last = { minute, text: pick(today.rng, GULLS.stolen), shooed: false };
    }
    return;
  }

  if (today.slots.length === 0 || today.slots[0] > minute || progress.tick >= ticksPerDay()) return;
  // Gulls go for food: a terrace table that is eating.
  const eating = floor.visits.filter((v) => v.eating && v.tables.length > 0 && v.tables[0] >= restaurant.tables && !v.visitor);
  if (eating.length === 0) {
    today.slots[0] += balance.gulls.retryMinutes;
    if (today.slots[0] > balance.gulls.lastMinute) today.slots.shift();
    return;
  }
  today.slots.shift();
  const visit = eating[nextInt(today.rng, 0, eating.length - 1)];
  today.active = { table: visit.tables[0], group: visit.party.group, since: minute, untilTick: progress.tick + balance.gulls.windowTicks };
}

/** The player taps the gull. Returns true if there was one to shoo. */
export function shooGull(today: GullsToday, progress: DayInProgress): boolean {
  if (!today.active) return false;
  changeReputation(progress, today.active.group, balance.gulls.shooedReputation);
  today.active = null;
  today.shooed++;
  today.last = { minute: minuteOfDay(progress.tick), text: pick(today.rng, GULLS.shooed), shooed: true };
  return true;
}
