// Plays one whole day for every restaurant: arrivals, choice, tables, waiters,
// the kitchen queue, eating and satisfaction. See project.md section 7, step 3.

import { balance } from '../data/balance';
import type { MenuDish } from '../data/dishes';
import { GROUPS } from '../data/groups';
import { chooseRestaurant } from './choice';
import { minuteOfDay, ticksPerDay } from './clock';
import { generateParties } from './guests';
import { ingredientCostOf, templateOf } from './menu';
import type { RngState } from './rng';
import { satisfactionFactors, satisfactionScore, updatedReputation } from './satisfaction';
import {
  averageLevel,
  chooseOrder,
  expectedWait,
  orderMinutes,
  orderQuality,
  prepMinutes,
  tablesNeeded,
} from './service';
import type { Party, PartyOutcome, Restaurant } from './types';

/** A party sitting in a restaurant. Only exists during the day, so it is never saved. */
interface Visit {
  party: Party;
  tablesUsed: number;
  order: MenuDish[];
  seatedAt: number;
  /** When the order reaches the kitchen. */
  orderedAt: number;
  /** When the food is ready; null until a chef starts cooking. */
  readyAt: number | null;
  quality: number;
  eating: boolean;
  leaveAt: number;
}

/** What is happening inside one restaurant right now. */
interface Floor {
  freeTables: number;
  visits: Visit[];
  /** Orders waiting for a chef, oldest first. */
  queue: Visit[];
  /** When each chef finishes their current order. */
  chefFreeAt: number[];
}

export interface DayResult {
  /** The restaurants after the day, with updated reputations. */
  restaurants: Restaurant[];
  outcomes: PartyOutcome[];
}

function sum(order: MenuDish[], value: (dish: MenuDish) => number): number {
  return order.reduce((total, dish) => total + value(dish), 0);
}

/** Chefs who are free take the oldest waiting orders. */
function startCooking(restaurant: Restaurant, floor: Floor, minute: number): void {
  if (floor.chefFreeAt.length === 0) return;
  while (floor.queue.length > 0) {
    const chefIndex = floor.chefFreeAt.indexOf(Math.min(...floor.chefFreeAt));
    if (floor.chefFreeAt[chefIndex] > minute) return;
    const visit = floor.queue.shift()!;
    const chef = restaurant.chefs[chefIndex];
    const start = Math.max(floor.chefFreeAt[chefIndex], visit.orderedAt);
    visit.readyAt = start + prepMinutes(visit.order, chef, restaurant.menu.length);
    visit.quality = orderQuality(visit.order, chef, restaurant.supplier);
    floor.chefFreeAt[chefIndex] = visit.readyAt;
  }
}

/** Moves every party in one restaurant along to the given minute. */
function progressRestaurant(
  restaurant: Restaurant,
  floor: Floor,
  minute: number,
  outcomes: PartyOutcome[],
): void {
  // Orders that waiters have taken reach the kitchen.
  for (const visit of floor.visits) {
    if (!visit.eating && visit.readyAt === null && visit.orderedAt <= minute && !floor.queue.includes(visit)) {
      floor.queue.push(visit);
    }
  }
  floor.queue.sort((a, b) => a.orderedAt - b.orderedAt);
  startCooking(restaurant, floor, minute);

  for (const visit of [...floor.visits]) {
    const { party } = visit;
    const leave = () => {
      floor.freeTables += visit.tablesUsed;
      floor.visits.splice(floor.visits.indexOf(visit), 1);
    };

    if (visit.eating) {
      if (visit.leaveAt <= minute) leave();
      continue;
    }

    const giveUpAt = visit.seatedAt + GROUPS[party.group].patienceMinutes;
    const readyInTime = visit.readyAt !== null && visit.readyAt <= giveUpAt;

    if (readyInTime && visit.readyAt! <= minute) {
      // The food arrives. The party eats and makes up its mind.
      const factors = satisfactionFactors({
        group: party.group,
        quality: visit.quality,
        bill: sum(visit.order, (dish) => dish.price),
        typicalBill: sum(visit.order, (dish) => templateOf(dish).referencePrice),
        waitMinutes: visit.readyAt! - visit.seatedAt,
        orderMinutes: visit.orderedAt - visit.seatedAt,
        waiterSkill: averageLevel(restaurant.waiters, 'skill'),
        ambiance: restaurant.ambiance,
      });
      const satisfaction = satisfactionScore(factors);
      restaurant.reputation[party.group] = updatedReputation(restaurant.reputation[party.group], satisfaction);
      outcomes.push({
        restaurant: restaurant.id,
        group: party.group,
        size: party.size,
        kind: 'served',
        order: visit.order,
        revenue: sum(visit.order, (dish) => dish.price),
        ingredientCost: sum(visit.order, (dish) => ingredientCostOf(dish, restaurant.supplier)),
        waitMinutes: visit.readyAt! - visit.seatedAt,
        satisfaction,
        factors,
      });
      visit.eating = true;
      visit.leaveAt = visit.readyAt! + balance.service.eatingMinutes;
    } else if (!readyInTime && giveUpAt <= minute) {
      // Out of patience: they walk out. Food already on the stove is wasted.
      const satisfaction = balance.satisfaction.walkoutScore;
      restaurant.reputation[party.group] = updatedReputation(restaurant.reputation[party.group], satisfaction);
      const queued = floor.queue.indexOf(visit);
      if (queued >= 0) floor.queue.splice(queued, 1);
      outcomes.push({
        restaurant: restaurant.id,
        group: party.group,
        size: party.size,
        kind: 'walkedOut',
        order: visit.order,
        revenue: 0,
        ingredientCost: visit.readyAt === null ? 0 : sum(visit.order, (dish) => ingredientCostOf(dish, restaurant.supplier)),
        waitMinutes: giveUpAt - visit.seatedAt,
        satisfaction,
        factors: null,
      });
      leave();
    }
  }
}

function lostOutcome(party: Party, restaurant: string | null, kind: 'noTable' | 'elsewhere'): PartyOutcome {
  return {
    restaurant,
    group: party.group,
    size: party.size,
    kind,
    order: [],
    revenue: 0,
    ingredientCost: 0,
    waitMinutes: 0,
    satisfaction: null,
    factors: null,
  };
}

/** Tables inside plus any terrace tables open today. */
function allTables(restaurant: Restaurant): number {
  return restaurant.tables + restaurant.terraceTables;
}

/** A day being played, one tick at a time. It only lives while the day runs, so it is never saved. */
export interface DayInProgress {
  day: number;
  /** The next tick to play. */
  tick: number;
  /** Working copies of the restaurants; reputations change as the day goes on. */
  restaurants: Restaurant[];
  floors: Floor[];
  outcomes: PartyOutcome[];
  /** True once the restaurants have closed and the last guest has left. */
  done: boolean;
}

/** Sets up a day before opening. The input restaurants are not changed. */
export function startDay(day: number, restaurants: Restaurant[]): DayInProgress {
  const working = restaurants.map((r) => ({ ...r, reputation: { ...r.reputation } }));
  return {
    day,
    tick: 0,
    restaurants: working,
    floors: working.map((r) => ({
      freeTables: allTables(r),
      visits: [],
      queue: [],
      chefFreeAt: r.chefs.map(() => 0),
    })),
    outcomes: [],
    done: false,
  };
}

/** Plays one tick of the day. */
export function stepDay(rng: RngState, progress: DayInProgress): void {
  if (progress.done) return;
  const { day, tick, restaurants, floors, outcomes } = progress;
  const minute = minuteOfDay(tick);
  restaurants.forEach((restaurant, i) => progressRestaurant(restaurant, floors[i], minute, outcomes));
  progress.tick++;

  if (tick >= ticksPerDay()) {
    // Closed: no new guests, but everyone inside finishes their visit.
    if (floors.every((floor) => floor.visits.length === 0)) progress.done = true;
    return;
  }

  const waits = restaurants.map((restaurant, i) =>
    expectedWait(restaurant, allTables(restaurant) - floors[i].freeTables, floors[i].queue.length),
  );
  for (const party of generateParties(rng, day, tick)) {
    const index = chooseRestaurant(rng, party, restaurants, waits);
    if (index === null) {
      outcomes.push(lostOutcome(party, null, 'elsewhere'));
      continue;
    }
    const restaurant = restaurants[index];
    const floor = floors[index];
    const tablesUsed = tablesNeeded(party.size);
    if (floor.freeTables < tablesUsed) {
      outcomes.push(lostOutcome(party, restaurant.id, 'noTable'));
      continue;
    }
    floor.freeTables -= tablesUsed;
    floor.visits.push({
      party,
      tablesUsed,
      order: chooseOrder(rng, restaurant, party, minute),
      seatedAt: minute,
      orderedAt: minute + orderMinutes(restaurant, allTables(restaurant) - floor.freeTables),
      readyAt: null,
      quality: 0,
      eating: false,
      leaveAt: 0,
    });
  }
}

/** Plays one day from opening until the last guest leaves. The input restaurants are not changed. */
export function runDay(rng: RngState, day: number, restaurants: Restaurant[]): DayResult {
  const progress = startDay(day, restaurants);
  while (!progress.done) stepDay(rng, progress);
  return { restaurants: progress.restaurants, outcomes: progress.outcomes };
}
