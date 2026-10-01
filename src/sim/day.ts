// Plays one whole day for every restaurant: arrivals, choice, tables, waiters,
// the kitchen queue, eating, satisfaction and reviews. See project.md section 7, step 3.

import { balance } from '../data/balance';
import type { DecorId } from '../data/decor';
import type { EquipmentId, MenuDish } from '../data/dishes';
import { GROUP_IDS, GROUPS } from '../data/groups';
import { LOCATIONS, type LocationId } from '../data/locations';
import { chooseRestaurant } from './choice';
import { minuteOfDay, ticksPerDay } from './clock';
import { ORDINARY_DAY } from './events';
import { generateParties } from './guests';
import { extrasOf, ingredientCostOf, templateOf } from './menu';
import { writeReview } from './reviews';
import { chance, type RngState } from './rng';
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
import type { DayConditions, Party, PartyOutcome, Restaurant, SatisfactionFactors, Staff } from './types';
import type { GroupId } from '../data/groups';
import type { Visitor } from '../data/moments';
import type { SpecialStaffId } from '../data/personal';

/** A party sitting in a restaurant. Only exists during the day, so it is never saved. */
export interface Visit {
  party: Party;
  tablesUsed: number;
  /** Which tables they sit at: inside tables first, then the terrace. */
  tables: number[];
  order: MenuDish[];
  seatedAt: number;
  /** When the order reaches the kitchen. */
  orderedAt: number;
  /** When the food is ready; null until a chef starts cooking. */
  readyAt: number | null;
  /** True if the kitchen gave up on the order because the party would leave before it was ready. */
  skipped: boolean;
  quality: number;
  eating: boolean;
  leaveAt: number;
  /** How the meal went (0–100), once the food has arrived. */
  satisfaction: number | null;
  /** Points added to (or taken off) how happy they end up, from things that happened during their visit. */
  mood: number;
  /** Special guests who came for something other than the food (see data/moments.ts). */
  visitor?: Visitor;
  /** Minutes of patience added on top of their group's (a free drink). */
  extraPatience: number;
  /** Help the player gave while they waited. */
  drink?: boolean;
  apology?: boolean;
  /** The player showed them to another table. */
  moved?: boolean;
  /** Reputation multipliers that apply when they leave. */
  reputationAfterwards?: Partial<Record<GroupId, number>>;
}

/** A party that gave up and left, remembered briefly so the restaurant view can show them going. */
interface Walkout {
  group: GroupId;
  size: number;
  minute: number;
}

/** What is happening inside one restaurant right now. */
export interface Floor {
  freeTables: number;
  visits: Visit[];
  /** Orders waiting for a chef, oldest first. */
  queue: Visit[];
  /** When each chef finishes their current order. */
  chefFreeAt: number[];
  walkouts: Walkout[];
  /** While special guests are in, new guests stay away: walk-ins only, or everyone. */
  closed: { until: number; everyone: boolean } | null;
  /** Quality points added to everything cooked for the rest of the day. */
  qualityBonus: number;
  /** Waiters off the floor for a while, and when they're back. */
  away: { waiter: Staff; back: number }[];
  /** Parties waiting at the door for a table to free up, first come first served. */
  door: { party: Party; since: number }[];
  /** Parties that gave up waiting at the door, and when (for the restaurant view to show them going). */
  doorLeft: { group: GroupId; size: number; minute: number }[];
}

/** True while special guests keep new guests out. */
export function doorClosed(floor: Floor, minute: number): boolean {
  return floor.closed !== null && floor.closed.until > minute;
}

export interface DayResult {
  /** The restaurants after the day, with updated reputations. */
  restaurants: Restaurant[];
  outcomes: PartyOutcome[];
}

function sum(order: MenuDish[], value: (dish: MenuDish) => number): number {
  return order.reduce((total, dish) => total + value(dish), 0);
}

/** Tables inside plus any terrace tables open today. */
function allTables(restaurant: Restaurant): number {
  return restaurant.tables + restaurant.terraceTables;
}

/** When a party gives up waiting for its food. */
function giveUpAt(visit: Visit): number {
  return visit.seatedAt + GROUPS[visit.party.group].patienceMinutes + visit.extraPatience;
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
    const readyAt = start + prepMinutes(visit.order, chef, restaurant.menu.length);
    // Don't cook for a table that will have given up before the food is ready;
    // spend the time on guests who will still be there.
    if (readyAt > giveUpAt(visit)) {
      visit.skipped = true;
      continue;
    }
    visit.readyAt = readyAt;
    visit.quality = orderQuality(visit.order, chef, restaurant.supplier) + floor.qualityBonus;
    floor.chefFreeAt[chefIndex] = readyAt;
  }
}

/** A party's verdict moves reputation; a food critic's moves it with everyone, and far more. */
function updateReputation(restaurant: Restaurant, party: Party, satisfaction: number): void {
  if (party.critic) {
    for (const group of GROUP_IDS) {
      restaurant.reputation[group] = updatedReputation(
        restaurant.reputation[group],
        satisfaction,
        balance.reviews.criticWeight,
      );
    }
  } else {
    restaurant.reputation[party.group] = updatedReputation(restaurant.reputation[party.group], satisfaction);
  }
}

/** A review for some parties (always for a critic), or null. */
function maybeReview(
  rng: RngState,
  restaurant: Restaurant,
  visit: Visit,
  factors: SatisfactionFactors | null,
  satisfaction: number,
): PartyOutcome['review'] {
  const critic = visit.party.critic ?? false;
  const regular = visit.party.regular ?? false;
  if (!critic && !regular && !chance(rng, balance.reviews.chance)) return null;
  return writeReview(rng, {
    group: visit.party.group,
    order: visit.order,
    street: LOCATIONS[restaurant.location].name,
    factors,
    satisfaction,
    critic,
    regular,
  });
}

/** Moves every party in one restaurant along to the given minute. */
function progressRestaurant(
  rng: RngState,
  restaurant: Restaurant,
  floor: Floor,
  minute: number,
  outcomes: PartyOutcome[],
  conditions: DayConditions,
): void {
  // Waiters who were off the floor come back.
  for (const away of [...floor.away]) {
    if (away.back > minute) continue;
    restaurant.waiters = [...restaurant.waiters, away.waiter];
    floor.away.splice(floor.away.indexOf(away), 1);
  }
  // Orders that waiters have taken reach the kitchen.
  for (const visit of floor.visits) {
    const waitingForKitchen = !visit.eating && !visit.skipped && visit.readyAt === null;
    if (waitingForKitchen && visit.orderedAt <= minute && !floor.queue.includes(visit)) {
      floor.queue.push(visit);
    }
  }
  // Oldest orders first, except that the chef cooks for a table they've apologised to next.
  floor.queue.sort((a, b) => Number(b.apology ?? false) - Number(a.apology ?? false) || a.orderedAt - b.orderedAt);
  startCooking(restaurant, floor, minute);

  const costMultiplier = conditions.ingredientCost[restaurant.id] ?? 1;
  const ingredients = (order: MenuDish[]) =>
    sum(order, (dish) => ingredientCostOf(dish, restaurant.supplier)) * costMultiplier;

  for (const visit of [...floor.visits]) {
    const { party } = visit;
    const leave = () => {
      floor.freeTables += visit.tablesUsed;
      floor.visits.splice(floor.visits.indexOf(visit), 1);
      // A visit people talk about afterwards.
      for (const [group, times] of Object.entries(visit.reputationAfterwards ?? {})) {
        const g = group as GroupId;
        restaurant.reputation[g] = Math.min(100, restaurant.reputation[g] * times);
      }
    };

    if (visit.eating) {
      if (visit.leaveAt <= minute) leave();
      continue;
    }

    const gives = giveUpAt(visit);
    const readyInTime = visit.readyAt !== null && visit.readyAt <= gives;

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
      const satisfaction = Math.max(0, Math.min(100, satisfactionScore(factors) + visit.mood));
      updateReputation(restaurant, party, satisfaction);
      outcomes.push({
        restaurant: restaurant.id,
        group: party.group,
        size: party.size,
        kind: 'served',
        order: visit.order,
        revenue: sum(visit.order, (dish) => dish.price),
        ingredientCost: ingredients(visit.order),
        waitMinutes: visit.readyAt! - visit.seatedAt,
        satisfaction,
        factors,
        review: maybeReview(rng, restaurant, visit, factors, satisfaction),
      });
      visit.eating = true;
      visit.satisfaction = satisfaction;
      visit.leaveAt = visit.readyAt! + balance.service.eatingMinutes;
    } else if (!readyInTime && gives <= minute) {
      // Out of patience: they walk out.
      const satisfaction = balance.satisfaction.walkoutScore;
      updateReputation(restaurant, party, satisfaction);
      const queued = floor.queue.indexOf(visit);
      if (queued >= 0) floor.queue.splice(queued, 1);
      outcomes.push({
        restaurant: restaurant.id,
        group: party.group,
        size: party.size,
        kind: 'walkedOut',
        order: visit.order,
        revenue: 0,
        ingredientCost: visit.readyAt === null ? 0 : ingredients(visit.order),
        waitMinutes: gives - visit.seatedAt,
        satisfaction,
        factors: null,
        review: maybeReview(rng, restaurant, visit, null, satisfaction),
      });
      floor.walkouts.push({ group: party.group, size: party.size, minute });
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
    review: null,
  };
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
  /** Weather, events and bookings for the day. */
  conditions: DayConditions;
  /** True once the restaurants have closed and the last guest has left. */
  done: boolean;
}

/** Sets up a day before opening. The input restaurants are not changed. */
export function startDay(
  day: number,
  restaurants: Restaurant[],
  conditions: DayConditions = ORDINARY_DAY,
): DayInProgress {
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
      walkouts: [],
      closed: null,
      qualityBonus: 0,
      away: [],
      door: [],
      doorLeft: [],
    })),
    outcomes: [],
    conditions,
    done: false,
  };
}

/**
 * The regular always gets his cytrynówka if the menu has it: a dish that comes with a glass
 * on the side takes the place of his main, or the drink takes the place of his drink.
 */
function regularsOrder(restaurant: Restaurant, order: MenuDish[]): MenuDish[] {
  const withGlass = restaurant.menu.find((dish) => extrasOf(dish).includes('cytrynowka'));
  if (withGlass) return [withGlass, ...order.filter((dish) => !['soup', 'main'].includes(templateOf(dish).category))];
  const drink = restaurant.menu.find((dish) => dish.template === 'cytrynowka');
  if (drink) return [...order.filter((dish) => templateOf(dish).category !== 'drink'), drink];
  return order;
}

/** Seats a party that has chosen (or booked) a restaurant, if there's a free table. */
export function seat(
  rng: RngState,
  progress: DayInProgress,
  index: number,
  party: Party,
  minute: number,
  /** False for parties that may not wait at the door for a table (they're already there, or a special case). */
  mayQueue = true,
): void {
  const restaurant = progress.restaurants[index];
  const floor = progress.floors[index];
  // With special guests in, people peek through the door and go somewhere else.
  // Only Pan Cytrynówka always gets in: everybody knows him, security included.
  const keptOut = !party.bookedAt || floor.closed?.everyone;
  if (doorClosed(floor, minute) && keptOut && !party.regular) {
    progress.outcomes.push(lostOutcome(party, restaurant.id, 'noTable'));
    return;
  }
  // The regular never gets turned away: with every table taken, he squeezes in at the bar.
  const atTheBar = party.regular && floor.freeTables < 1;
  const tablesUsed = atTheBar ? 0 : tablesNeeded(party.size);
  if (floor.freeTables < tablesUsed) {
    // Every table is taken: wait at the door if there's room in the queue, or go elsewhere.
    // Guests who booked always wait, at the front of the queue: their table is the next one free.
    const booked = party.bookedAt !== undefined && mayQueue;
    if (booked) floor.door.unshift({ party, since: minute });
    else if (mayQueue && floor.door.length < balance.service.doorQueueMax) floor.door.push({ party, since: minute });
    else progress.outcomes.push(lostOutcome(party, restaurant.id, 'noTable'));
    return;
  }
  floor.freeTables -= tablesUsed;
  let order = chooseOrder(rng, restaurant, party, minute, progress.conditions.weather);
  if (party.regular) order = regularsOrder(restaurant, order);
  const taken = new Set(floor.visits.flatMap((v) => v.tables));
  const tables = [...Array(allTables(restaurant)).keys()].filter((t) => !taken.has(t)).slice(0, tablesUsed);
  floor.visits.push({
    party,
    tablesUsed,
    tables,
    order,
    seatedAt: minute,
    orderedAt: minute + orderMinutes(restaurant, allTables(restaurant) - floor.freeTables),
    readyAt: null,
    skipped: false,
    quality: 0,
    eating: false,
    leaveAt: 0,
    satisfaction: null,
    mood: 0,
    extraPatience: 0,
  });
}

/**
 * The queue at the door: parties are seated in turn as tables free up. Anyone who has
 * waited too long, or is still waiting at closing time, goes somewhere else.
 */
function serveTheDoor(rng: RngState, progress: DayInProgress, index: number, minute: number, closed: boolean): void {
  const floor = progress.floors[index];
  for (const waiting of [...floor.door]) {
    const fits = floor.freeTables >= tablesNeeded(waiting.party.size);
    // Guests who booked wait longer for their table than people who just walked up.
    const patience = balance.service.doorWaitMinutes * (waiting.party.bookedAt ? balance.service.bookedWaitFactor : 1);
    const gaveUp = closed || minute - waiting.since >= patience;
    if (!fits && !gaveUp) continue;
    floor.door.splice(floor.door.indexOf(waiting), 1);
    if (fits && !closed) seat(rng, progress, index, waiting.party, minute, false);
    else {
      progress.outcomes.push(lostOutcome(waiting.party, progress.restaurants[index].id, 'noTable'));
      floor.doorLeft.push({ group: waiting.party.group, size: waiting.party.size, minute });
    }
  }
}

/** Plays one tick of the day. */
export function stepDay(rng: RngState, progress: DayInProgress): void {
  if (progress.done) return;
  const { day, tick, restaurants, floors, outcomes, conditions } = progress;
  const minute = minuteOfDay(tick);
  restaurants.forEach((restaurant, i) => {
    progressRestaurant(rng, restaurant, floors[i], minute, outcomes, conditions);
    serveTheDoor(rng, progress, i, minute, tick >= ticksPerDay());
  });
  progress.tick++;

  if (tick >= ticksPerDay()) {
    // Closed: no new guests, but everyone inside finishes their visit.
    if (floors.every((floor) => floor.visits.length === 0)) progress.done = true;
    return;
  }

  // Guests who booked ahead arrive at their time and go straight to their table.
  const tickEnd = minute + balance.clock.tickMinutes;
  for (const booking of conditions.bookings) {
    if (booking.minute < minute || booking.minute >= tickEnd) continue;
    const index = restaurants.findIndex((r) => r.id === booking.restaurant);
    if (index < 0) continue;
    const party: Party = {
      group: booking.group,
      size: booking.size,
      origin: restaurants[index].location,
      arrivalMinute: minute,
      bookedAt: booking.restaurant,
      critic: booking.critic,
      regular: booking.regular,
    };
    seat(rng, progress, index, party, minute);
  }

  const waits = restaurants.map((restaurant, i) =>
    expectedWait(restaurant, allTables(restaurant) - floors[i].freeTables, floors[i].queue.length),
  );
  // People can see when every table is taken and the queue at the door is as long as it gets.
  const isFull = (floor: Floor) => floor.freeTables < 1 && floor.door.length >= balance.service.doorQueueMax;
  const full = floors.map(isFull);
  for (const party of generateParties(rng, day, tick, conditions)) {
    const index = chooseRestaurant(rng, party, restaurants, waits, full);
    if (index === null) {
      outcomes.push(lostOutcome(party, null, 'elsewhere'));
      continue;
    }
    seat(rng, progress, index, party, minute);
    // The next people walking by see it as it is now.
    full[index] = isFull(floors[index]);
  }
}

export type Help = 'drink' | 'apology';

/**
 * The player helps the party at a table that's still waiting for its food: a free drink buys
 * them patience; the chef's apology puts their order first in the kitchen. Each kind of help
 * once per party. Returns the party helped, or null if there was nobody to help.
 */
export function helpTable(progress: DayInProgress, index: number, table: number, help: Help): Visit | null {
  const visit = progress.floors[index].visits.find((v) => v.tables.includes(table) && !v.eating && !v.skipped);
  if (!visit || (help === 'drink' ? visit.drink : visit.apology)) return null;
  if (help === 'drink') {
    visit.drink = true;
    visit.extraPatience += balance.help.drinkPatienceMinutes;
    visit.mood += balance.help.drinkMood;
  } else {
    visit.apology = true;
    visit.mood += balance.help.apologyMood;
  }
  return visit;
}

/**
 * The player shows the party at one table to a free table instead, before their food arrives.
 * Only parties at a single table, once each. Returns the party moved, or null.
 */
export function moveParty(progress: DayInProgress, index: number, from: number, to: number): Visit | null {
  const floor = progress.floors[index];
  const restaurant = progress.restaurants[index];
  const visit = floor.visits.find(
    (v) => v.tables.length === 1 && v.tables[0] === from && !v.eating && !v.skipped && !v.visitor && !v.moved,
  );
  const free = to >= 0 && to < allTables(restaurant) && !floor.visits.some((v) => v.tables.includes(to));
  if (!visit || !free) return null;
  visit.tables = [to];
  visit.moved = true;
  return visit;
}

/** Plays one day from opening until the last guest leaves. The input restaurants are not changed. */
export function runDay(
  rng: RngState,
  day: number,
  restaurants: Restaurant[],
  conditions: DayConditions = ORDINARY_DAY,
): DayResult {
  const progress = startDay(day, restaurants, conditions);
  while (!progress.done) stepDay(rng, progress);
  return { restaurants: progress.restaurants, outcomes: progress.outcomes };
}

// ---------- What the restaurant view shows ----------

export type GuestStage = 'ordering' | 'waiting' | 'eating';

export interface TableGuests {
  group: GroupId;
  /** People at this table (a big party spreads over two tables). */
  seated: number;
  stage: GuestStage;
  /** How much of their patience they've used up so far, 0–1. */
  impatience: number;
  /** How the meal went (0–100), once the food has arrived. */
  satisfaction: number | null;
  /** Minutes since the food arrived. */
  eatingFor: number;
  critic: boolean;
  regular: boolean;
  /** Special guests: the merry group, a footballer, Lech Wałęsa... */
  visitor: Visitor | null;
  /** Help already given while they wait. */
  drink: boolean;
  apology: boolean;
  /** Already shown to another table (once per party). */
  moved: boolean;
  /** Tables the whole party uses (big parties take two). */
  tablesUsed: number;
  /** When they sat down: tells one party at this table from the next. */
  since: number;
}

export interface FloorView {
  /** The street the restaurant is on: it decides the size of the room. */
  location: LocationId;
  /** Inside tables first, then terrace tables open today; null for an empty table. */
  tables: (TableGuests | null)[];
  insideTables: number;
  /** Terrace tables to draw: all of them with a permit, even on days the terrace is closed. */
  terraceTables: number;
  /** For each chef: busy cooking right now? */
  chefsBusy: boolean[];
  /** One entry per waiter on today: null, or which of the special waiters it is. */
  waiters: (SpecialStaffId | null)[];
  decor: DecorId[];
  equipment: EquipmentId[];
  /** Orders waiting for a free chef. */
  ordersWaiting: number;
  /** Parties that walked out in the last few minutes. */
  walkouts: { group: GroupId; size: number }[];
  /** Parties waiting at the door for a table, first in line first. */
  atTheDoor: { group: GroupId; size: number; since: number }[];
  /** Parties that gave up waiting at the door in the last few minutes. */
  leftTheDoor: { group: GroupId; size: number; minute: number }[];
  /** A gull on the terrace, after the plate at this table (filled in by the game, not the day). */
  gull?: { table: number } | null;
}

/** A snapshot of one restaurant for the restaurant view. Reads the day; changes nothing. */
export function floorView(progress: DayInProgress, index: number, recentMinutes = 10): FloorView {
  const restaurant = progress.restaurants[index];
  const floor = progress.floors[index];
  const minute = minuteOfDay(Math.max(0, progress.tick - 1));
  const tables: (TableGuests | null)[] = Array(allTables(restaurant)).fill(null);

  for (const visit of floor.visits) {
    const { party } = visit;
    const patience = GROUPS[party.group].patienceMinutes + visit.extraPatience;
    const stage: GuestStage = visit.eating ? 'eating' : minute < visit.orderedAt ? 'ordering' : 'waiting';
    visit.tables.forEach((table, i) => {
      if (table >= tables.length) return;
      tables[table] = {
        group: party.group,
        seated: Math.min(balance.service.seatsPerTable, party.size - i * balance.service.seatsPerTable),
        stage,
        impatience: visit.eating ? 0 : Math.min(1, (minute - visit.seatedAt) / patience),
        satisfaction: visit.satisfaction,
        eatingFor: visit.eating && visit.readyAt !== null ? minute - visit.readyAt : 0,
        critic: party.critic ?? false,
        regular: party.regular ?? false,
        visitor: visit.visitor ?? null,
        drink: visit.drink ?? false,
        apology: visit.apology ?? false,
        moved: visit.moved ?? false,
        tablesUsed: visit.tablesUsed,
        since: visit.seatedAt,
      };
    });
  }

  return {
    location: restaurant.location,
    tables,
    insideTables: restaurant.tables,
    terraceTables: restaurant.terraceTables,
    chefsBusy: floor.chefFreeAt.map((freeAt) => freeAt > minute),
    waiters: restaurant.waiters.map((waiter) => waiter.special ?? null),
    decor: restaurant.decor,
    equipment: restaurant.equipment,
    ordersWaiting: floor.queue.length,
    walkouts: floor.walkouts
      .filter((w) => minute - w.minute < recentMinutes)
      .map(({ group, size }) => ({ group, size })),
    atTheDoor: floor.door.map(({ party, since }) => ({ group: party.group, size: party.size, since })),
    leftTheDoor: floor.doorLeft.filter((left) => minute - left.minute < recentMinutes),
  };
}
