// Plays one whole day for every restaurant: arrivals, choice, tables, waiters,
// the kitchen queue, eating and satisfaction. See project.md section 7, step 3.

import { balance } from '../data/balance';
import type { MenuDish } from '../data/dishes';
import { GROUPS, type GroupId } from '../data/groups';
import { chooseRestaurant, dishAppeal } from './choice';
import { minuteOfDay, ticksPerDay } from './clock';
import { generateParties } from './guests';
import { templateOf, variantOf } from './menu';
import { chance, nextFloat, type RngState } from './rng';
import { satisfactionFactors, satisfactionScore, updatedReputation } from './satisfaction';
import type { Party, PartyOutcome, Restaurant, Staff } from './types';

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

const average = (values: number[], fallback: number) =>
  values.length === 0 ? fallback : values.reduce((sum, v) => sum + v, 0) / values.length;

function averageLevel(staff: Staff[], stat: 'skill' | 'speed'): number {
  // With nobody on the job, it is as if the least able person were doing it.
  return average(staff.map((person) => person[stat]), 1);
}

function tablesNeeded(partySize: number): number {
  return Math.ceil(partySize / balance.service.seatsPerTable);
}

/** Picks a dish, favouring the ones this group likes. */
function pickByAppeal(rng: RngState, dishes: MenuDish[], group: GroupId): MenuDish {
  const weights = dishes.map((dish) => balance.orders.baseDishWeight + dishAppeal(dish, group));
  let roll = nextFloat(rng) * weights.reduce((sum, w) => sum + w, 0);
  for (let i = 0; i < dishes.length; i++) {
    roll -= weights[i];
    if (roll < 0) return dishes[i];
  }
  return dishes[dishes.length - 1];
}

/** Each guest orders a soup or main, and maybe a drink and a dessert. */
function chooseOrder(rng: RngState, menu: MenuDish[], party: Party): MenuDish[] {
  const inCategory = (...categories: string[]) =>
    menu.filter((dish) => categories.includes(templateOf(dish).category));
  const food = inCategory('soup', 'main');
  const drinks = inCategory('drink');
  const desserts = inCategory('dessert');
  const order: MenuDish[] = [];
  for (let guest = 0; guest < party.size; guest++) {
    order.push(pickByAppeal(rng, food.length > 0 ? food : menu, party.group));
    if (drinks.length > 0 && chance(rng, balance.orders.drinkChance)) {
      order.push(pickByAppeal(rng, drinks, party.group));
    }
    if (desserts.length > 0 && chance(rng, balance.orders.dessertChance)) {
      order.push(pickByAppeal(rng, desserts, party.group));
    }
  }
  return order;
}

/** Minutes until a newly seated party's order reaches the kitchen. */
function orderMinutes(restaurant: Restaurant, floor: Floor): number {
  const s = balance.service;
  const busyTables = restaurant.tables - floor.freeTables;
  const capacity = Math.max(0.5, restaurant.waiters.length) * s.tablesPerWaiter;
  const load = Math.max(1, busyTables / capacity);
  const speedFactor = averageLevel(restaurant.waiters, 'speed') / balance.staff.averageLevel;
  return (s.orderMinutes / speedFactor) * load;
}

function menuSlowdown(menuSize: number): number {
  const k = balance.kitchen;
  return 1 + k.slowdownPerExtraDish * Math.max(0, menuSize - k.menuSizeBeforeSlowdown);
}

/** Minutes one chef needs to cook a whole order. */
function prepMinutes(order: MenuDish[], chef: Staff, menuSize: number): number {
  const longest = Math.max(...order.map((dish) => templateOf(dish).prepMinutes));
  const base = longest + balance.kitchen.extraPortionMinutes * (order.length - 1);
  const speedFactor = chef.speed / balance.staff.averageLevel;
  return (base / speedFactor) * menuSlowdown(menuSize);
}

function orderQuality(order: MenuDish[], chef: Staff): number {
  const skillBonus = (chef.skill - balance.staff.averageLevel) * balance.kitchen.qualityPerSkillPoint;
  const quality = average(order.map((dish) => templateOf(dish).baseQuality + skillBonus), 0);
  return Math.max(0, Math.min(100, quality));
}

/** What a party looking in from the street guesses the wait for food will be. */
function expectedWait(restaurant: Restaurant, floor: Floor): number {
  if (restaurant.chefs.length === 0 || restaurant.menu.length === 0) return Infinity;
  const speedFactor = averageLevel(restaurant.chefs, 'speed') / balance.staff.averageLevel;
  const typicalPrep =
    (average(restaurant.menu.map((dish) => templateOf(dish).prepMinutes), 0) / speedFactor) *
    menuSlowdown(restaurant.menu.length);
  const ordersAhead = floor.queue.length / restaurant.chefs.length;
  return orderMinutes(restaurant, floor) + (ordersAhead + 1) * typicalPrep;
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
    visit.quality = orderQuality(visit.order, chef);
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
        ingredientCost: sum(visit.order, (dish) => variantOf(dish).ingredientCost),
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
        ingredientCost: visit.readyAt === null ? 0 : sum(visit.order, (dish) => variantOf(dish).ingredientCost),
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

/** Plays one day from opening until the last guest leaves. The input restaurants are not changed. */
export function runDay(rng: RngState, day: number, restaurants: Restaurant[]): DayResult {
  const working = restaurants.map((r) => ({ ...r, reputation: { ...r.reputation } }));
  const floors: Floor[] = working.map((r) => ({
    freeTables: r.tables,
    visits: [],
    queue: [],
    chefFreeAt: r.chefs.map(() => 0),
  }));
  const outcomes: PartyOutcome[] = [];
  const closingTick = ticksPerDay();

  for (let tick = 0; ; tick++) {
    const minute = minuteOfDay(tick);
    working.forEach((restaurant, i) => progressRestaurant(restaurant, floors[i], minute, outcomes));

    if (tick >= closingTick) {
      // Closed: no new guests, but everyone inside finishes their visit.
      if (floors.every((floor) => floor.visits.length === 0)) break;
      continue;
    }

    const waits = working.map((restaurant, i) => expectedWait(restaurant, floors[i]));
    for (const party of generateParties(rng, day, tick)) {
      const index = chooseRestaurant(rng, party, working, waits);
      if (index === null) {
        outcomes.push(lostOutcome(party, null, 'elsewhere'));
        continue;
      }
      const restaurant = working[index];
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
        order: chooseOrder(rng, restaurant.menu, party),
        seatedAt: minute,
        orderedAt: minute + orderMinutes(restaurant, floor),
        readyAt: null,
        quality: 0,
        eating: false,
        leaveAt: 0,
      });
    }
  }

  return { restaurants: working, outcomes };
}
