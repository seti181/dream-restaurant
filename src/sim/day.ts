// Plays one whole day for every restaurant: arrivals, choice, tables, waiters,
// the kitchen queue, eating, satisfaction and reviews. See project.md section 7, step 3.

import { balance } from '../data/balance';
import type { DecorId } from '../data/decor';
import type { EquipmentId, ExtraId, MenuDish, TemplateId } from '../data/dishes';
import { GROUP_IDS, GROUPS } from '../data/groups';
import { LOCATIONS, type LocationId } from '../data/locations';
import { REGULARS, type RegularId } from '../data/regulars';
import { bigOrderMinutes, matchingDishes, tablesHeld, wantMet, type BigOrderJob } from './bookings';
import { chooseRestaurant } from './choice';
import { rushAt, rushName, streakTipPerGuest } from './rush';
import { themeNightOn } from './themeNights';
import { samplesOn, tasteSamples, type SamplesToday } from './samples';
import { minuteOfDay, ticksPerDay } from './clock';
import { ORDINARY_DAY } from './events';
import { generateParties } from './guests';
import { extrasOf, ingredientCostOf, templateOf } from './menu';
import { writeReview } from './reviews';
import { wishMet } from './regulars';
import { chance, createRng, pick, type RngState } from './rng';
import { WISH_IDS, WISHES, type WishId } from '../data/wishes';
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
import type { BuildingWorkId } from '../data/works';

/** A party sitting in a restaurant. Only exists during the day, so it is never saved. */
export interface Visit {
  party: Party;
  tablesUsed: number;
  /** Sitting at the bar counter (its place is after every table), not at a table. */
  counter?: boolean;
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
  /** A party that booked: whether their wish was on the menu when they sat down. */
  wishMet?: boolean;
  /** A party that walked in hoping for something, and whether the menu had it. */
  walkInWish?: { id: WishId; met: boolean };
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
  /** Places free at the bar counter, each for a party of one or two. */
  freeCounter: number;
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
  /** Booking requests whose party has arrived (seated, or waiting at the door). */
  bookedIn: number[];
  /** Chefs and waiters the player hurried in a rush: faster until `until`, then a breather until `restUntil`. */
  hurries: Hurry[];
  /** Parties served quickly in a row, the best run today, and the tips the streak brought. */
  streak: { current: number; best: number; tips: number };
}

/** A chef or waiter hurried in a rush (see sim/rush.ts). */
export interface Hurry {
  role: 'chef' | 'waiter';
  /** Who it is (Staff.look), so nobody is hurried twice in one rush. */
  look: number;
  /** Which rush (an index into balance.rush.windows). */
  rush: number;
  until: number;
  restUntil: number;
  /** Chefs: their place in the kitchen (the index into chefFreeAt). */
  chef?: number;
  /** Waiters: who they are normally, and the hurried version working the floor meanwhile. */
  waiter?: { normal: Staff; hurried: Staff; done: boolean };
}

/** A chef's hurry today, if they were hurried. The latest one counts. */
function chefHurry(floor: Floor, chef: number): Hurry | undefined {
  return floor.hurries.filter((h) => h.role === 'chef' && h.chef === chef).at(-1);
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

/** Places at the bar counter, if it's been built: each seats a party of one or two. */
export function counterPlaces(restaurant: Restaurant): number {
  return restaurant.works?.includes('counter') ? balance.works.counterPlaces : 0;
}

/** True if this party can sit at the counter: few enough of them, and a place free. */
function fitsAtCounter(floor: Floor, party: Party): boolean {
  return floor.freeCounter > 0 && party.size <= balance.works.counterPartyMax;
}

/** When a party gives up waiting for its food. */
function giveUpAt(visit: Visit): number {
  return visit.seatedAt + GROUPS[visit.party.group].patienceMinutes + visit.extraPatience;
}

/** Chefs who are free take the oldest waiting orders. */
function startCooking(restaurant: Restaurant, floor: Floor, minute: number, inSeason: readonly ExtraId[]): void {
  if (floor.chefFreeAt.length === 0) return;
  // Oldest orders first. An order that's waiting for a particular chef lets the next one go ahead.
  for (const visit of [...floor.queue]) {
    if (!floor.chefFreeAt.some((freeAt) => freeAt <= minute)) return;
    // A party that booked agreed its dishes ahead, so the kitchen is quicker with them.
    const ahead = visit.party.requestId === undefined ? 1 : balance.bookings.prepFactor;
    // When each chef would have this order ready, and whether that's before the table gives up.
    // A hurried chef cooks faster; after the hurry they take a breather and start nothing new.
    const chefs = restaurant.chefs.map((chef, i) => {
      const hurry = chefHurry(floor, i);
      const resting = hurry !== undefined && minute >= hurry.until && minute < hurry.restUntil;
      let start = Math.max(floor.chefFreeAt[i], visit.orderedAt);
      if (hurry && start >= hurry.until && start < hurry.restUntil) start = hurry.restUntil;
      const faster = hurry && start < hurry.until ? 1 / balance.rush.chefSpeedFactor : 1;
      const readyAt = start + prepMinutes(visit.order, chef, restaurant.menu.length) * ahead * faster;
      return { i, chef, readyAt, free: floor.chefFreeAt[i] <= minute && !resting, inTime: readyAt <= giveUpAt(visit) };
    });
    // A free chef who can have it ready in time cooks it, the quickest of them first...
    const cook = chefs.filter((c) => c.free && c.inTime).sort((a, b) => a.readyAt - b.readyAt)[0];
    if (!cook) {
      // ...or else it waits for a busy chef who still can, or nobody can: don't cook for a table
      // that will have given up before the food is ready, and spend the time on guests who will still be there.
      if (chefs.some((c) => c.inTime)) continue;
      floor.queue.splice(floor.queue.indexOf(visit), 1);
      visit.skipped = true;
      continue;
    }
    floor.queue.splice(floor.queue.indexOf(visit), 1);
    visit.readyAt = cook.readyAt;
    visit.quality = orderQuality(visit.order, cook.chef, restaurant.supplier, inSeason) + floor.qualityBonus;
    floor.chefFreeAt[cook.i] = cook.readyAt;
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
  // A hurried waiter's spurt is over: they step off the floor for a breather.
  for (const hurry of floor.hurries) {
    if (!hurry.waiter || hurry.waiter.done || hurry.until > minute) continue;
    hurry.waiter.done = true;
    restaurant.waiters = restaurant.waiters.filter((waiter) => waiter !== hurry.waiter!.hurried);
    floor.away.push({ waiter: hurry.waiter.normal, back: hurry.restUntil });
  }
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
  startCooking(restaurant, floor, minute, conditions.inSeason);

  const costMultiplier = conditions.ingredientCost[restaurant.id] ?? 1;
  const ingredients = (order: MenuDish[]) =>
    sum(order, (dish) => ingredientCostOf(dish, restaurant.supplier, conditions.inSeason, conditions.prices)) * costMultiplier;

  for (const visit of [...floor.visits]) {
    const { party } = visit;
    const leave = () => {
      floor.freeTables += visit.tablesUsed;
      if (visit.counter) floor.freeCounter++;
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
      // Quick service keeps the streak going, and a long streak brings tips.
      const patience = GROUPS[party.group].patienceMinutes + visit.extraPatience;
      if (visit.readyAt! - visit.seatedAt <= patience * balance.rush.streakFastShare) {
        floor.streak.current++;
        floor.streak.best = Math.max(floor.streak.best, floor.streak.current);
        floor.streak.tips += streakTipPerGuest(floor.streak.current) * party.size;
      } else {
        floor.streak.current = 0;
      }
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
        ...regularVisit(party, restaurant, visit.seatedAt),
        ...bookingVisit(party, visit.wishMet ?? false),
        servedAt: visit.readyAt!,
        ...(visit.walkInWish ? { wish: visit.walkInWish } : {}),
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
        ...regularVisit(party, null),
        ...bookingVisit(party, visit.wishMet ?? false),
        ...(visit.walkInWish ? { wish: visit.walkInWish } : {}),
      });
      floor.walkouts.push({ group: party.group, size: party.size, minute });
      floor.streak.current = 0;
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
    ...regularVisit(party, null),
    ...bookingVisit(party, false),
  };
}

/** For a party that booked through a request: which one, and whether their wish was on the menu. */
function bookingVisit(party: Party, wishMet: boolean): Pick<PartyOutcome, 'booking'> {
  return party.requestId === undefined ? {} : { booking: { id: party.requestId, wishMet } };
}

/** For a named regular's outcome: who it was, and whether their wish came true (only if they ate). */
function regularVisit(party: Party, restaurant: Restaurant | null, minute = 0): Pick<PartyOutcome, 'regularVisit'> {
  if (!party.regularId) return {};
  const met = restaurant !== null && wishMet(restaurant, REGULARS[party.regularId].wish, minute);
  return { regularVisit: { id: party.regularId, wishMet: met } };
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
  /** Big orders the kitchens cook today. */
  bigOrders: BigOrderJob[];
  /** Dice for guests' wishes, kept apart so they never change who comes or what they order. */
  wishRng: RngState;
  /** The player's samples at the door, once they've gone out today (sim/samples.ts). */
  samples?: SamplesToday | null;
  /** True once the restaurants have closed and the last guest has left. */
  done: boolean;
}

/** Sets up a day before opening. The input restaurants are not changed. */
export function startDay(
  day: number,
  restaurants: Restaurant[],
  conditions: DayConditions = ORDINARY_DAY,
  /** Seeds the dice for guests' wishes (the same for a day however it's played). */
  wishSeed = Math.imul(day + 1, 0x632be5ab) >>> 0,
): DayInProgress {
  const working = restaurants.map((r) => ({ ...r, reputation: { ...r.reputation } }));
  return {
    day,
    tick: 0,
    restaurants: working,
    floors: working.map((r) => ({
      freeTables: allTables(r),
      freeCounter: counterPlaces(r),
      visits: [],
      queue: [],
      chefFreeAt: r.chefs.map(() => 0),
      walkouts: [],
      closed: null,
      qualityBonus: 0,
      away: [],
      door: [],
      doorLeft: [],
      bookedIn: [],
      hurries: [],
      streak: { current: 0, best: 0, tips: 0 },
    })),
    outcomes: [],
    conditions,
    bigOrders: (conditions.bigOrders ?? []).map((order) => ({ order, status: 'waiting' })),
    wishRng: createRng(wishSeed),
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
  if (party.requestId !== undefined && !floor.bookedIn.includes(party.requestId)) floor.bookedIn.push(party.requestId);
  // Tables held for a booked party due soon are not for anyone else.
  const free = floor.freeTables - (party.requestId === undefined ? heldTables(progress, index, minute) : 0);
  // The regular never gets turned away: with every table taken, he squeezes in at the bar.
  // Someone on their own or a pair takes a place at the bar counter if there's one free.
  const counter = fitsAtCounter(floor, party);
  const atTheBar = !counter && party.regular && free < 1;
  const tablesUsed = atTheBar || counter ? 0 : tablesNeeded(party.size);
  if (free < tablesUsed) {
    // Every table is taken: wait at the door if there's room in the queue, or go elsewhere.
    // Guests who booked always wait, at the front of the queue: their table is the next one free.
    const booked = party.bookedAt !== undefined && mayQueue;
    if (booked) floor.door.unshift({ party, since: minute });
    else if (mayQueue && floor.door.length < balance.service.doorQueueMax) floor.door.push({ party, since: minute });
    else progress.outcomes.push(lostOutcome(party, restaurant.id, 'noTable'));
    return;
  }
  floor.freeTables -= tablesUsed;
  if (counter) floor.freeCounter--;
  let order = chooseOrder(rng, restaurant, party, minute, progress.conditions.weather, progress.conditions.trend ?? null);
  if (party.regular) order = regularsOrder(restaurant, order);
  const taken = new Set(floor.visits.flatMap((v) => v.tables));
  const places = counter
    ? [...Array(counterPlaces(restaurant)).keys()].map((c) => allTables(restaurant) + c)
    : [...Array(allTables(restaurant)).keys()];
  const tables = places.filter((t) => !taken.has(t)).slice(0, counter ? 1 : tablesUsed);
  // A party that booked hoped for something on the menu.
  const wishMet = party.wish ? wantMet(restaurant.menu, party.wish) : undefined;
  const wishMood = wishMet === undefined ? 0 : wishMet ? balance.bookings.wishMetMood : balance.bookings.wishMissedMood;
  // Now and then a party walks into the player's restaurant hoping for something on the menu.
  let walkInWish: Visit['walkInWish'];
  if (index === 0 && !party.bookedAt && !party.regular && !party.regularId && chance(progress.wishRng, balance.wishes.chance)) {
    const options = WISH_IDS.filter((id) => WISHES[id].groups.includes(party.group));
    if (options.length > 0) {
      const id = pick(progress.wishRng, options);
      walkInWish = { id, met: wantMet(restaurant.menu, WISHES[id].want) };
    }
  }
  const walkInMood = walkInWish ? (walkInWish.met ? balance.wishes.metMood : balance.wishes.missedMood) : 0;
  // Tonight's theme night: live music cheers everyone up; those who came for the theme hope to find it.
  const night = restaurant.themeNight;
  let themeMood = themeNightOn(restaurant, minute) ? (night?.mood ?? 0) : 0;
  if (night?.wants && themeNightOn(restaurant, minute, party.group) && !wantMet(restaurant.menu, night.wants)) {
    themeMood += balance.themeNights.missingMood;
  }
  floor.visits.push({
    party,
    tablesUsed,
    counter: counter || undefined,
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
    // Regulars feel at home here.
    mood:
      (party.regularId ? balance.regulars.atHomeMood : 0) +
      wishMood +
      themeMood +
      walkInMood +
      (restaurant.moodBonus ?? 0) +
      (restaurant.works?.includes('toilet') ? balance.works.toiletMood : 0),
    walkInWish,
    extraPatience: party.requestId === undefined ? 0 : balance.bookings.extraPatienceMinutes,
    wishMet,
  });
}

/**
 * The queue at the door: parties are seated in turn as tables free up. Anyone who has
 * waited too long, or is still waiting at closing time, goes somewhere else.
 */
function serveTheDoor(rng: RngState, progress: DayInProgress, index: number, minute: number, closed: boolean): void {
  const floor = progress.floors[index];
  for (const waiting of [...floor.door]) {
    const held = waiting.party.requestId === undefined ? heldTables(progress, index, minute) : 0;
    const fits = fitsAtCounter(floor, waiting.party) || floor.freeTables - held >= tablesNeeded(waiting.party.size);
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

/** Tables kept for booked parties due in soon, or waiting at the door. */
function heldTables(progress: DayInProgress, index: number, minute: number): number {
  const floor = progress.floors[index];
  const due = progress.conditions.bookings.filter((b) => b.requestId === undefined || !floor.bookedIn.includes(b.requestId));
  return tablesHeld(due, floor.door.map((waiting) => waiting.party), progress.restaurants[index].id, minute);
}

/**
 * A chef starts on a big order at the last moment that still gets it ready in time (or as soon
 * as they're free), cooking the cheapest dish on the menu that fits. With nothing that fits,
 * or nobody in the kitchen, the order falls through.
 */
function cookBigOrders(progress: DayInProgress, index: number, minute: number): void {
  const restaurant = progress.restaurants[index];
  const floor = progress.floors[index];
  const { supplier } = restaurant;
  const { inSeason, prices } = progress.conditions;
  for (const job of progress.bigOrders) {
    if (job.status !== 'waiting' || job.order.restaurant !== restaurant.id) continue;
    if (floor.chefFreeAt.length === 0) {
      if (minute >= job.order.minute) Object.assign(job, { status: 'fellThrough', noChef: true });
      continue;
    }
    const chefIndex = floor.chefFreeAt.indexOf(Math.min(...floor.chefFreeAt));
    const minutes = bigOrderMinutes(job.order.portions, restaurant.chefs[chefIndex]);
    const start = Math.max(minute, floor.chefFreeAt[chefIndex]);
    if (start + minutes + balance.clock.tickMinutes <= job.order.minute) continue;
    const [dish] = matchingDishes(restaurant.menu, job.order.needs).sort(
      (a, b) => ingredientCostOf(a, supplier, inSeason, prices) - ingredientCostOf(b, supplier, inSeason, prices),
    );
    if (!dish) {
      job.status = 'fellThrough';
      continue;
    }
    job.status = 'cooking';
    job.dish = dish;
    job.readyAt = start + minutes;
    floor.chefFreeAt[chefIndex] = job.readyAt;
  }
}

/** Plays one tick of the day. */
export function stepDay(rng: RngState, progress: DayInProgress): void {
  if (progress.done) return;
  const { day, tick, restaurants, floors, outcomes, conditions } = progress;
  const minute = minuteOfDay(tick);
  restaurants.forEach((restaurant, i) => {
    cookBigOrders(progress, i, minute);
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
      regularId: booking.regularId,
      requestId: booking.requestId,
      wish: booking.wish,
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
    // Someone from the player's street tastes the samples on the way past, before deciding.
    const tasted = tasteSamples(progress, party);
    const index = chooseRestaurant(rng, party, restaurants, waits, full, conditions.inSeason, conditions.trend ?? null, conditions.deals);
    if (index === null) {
      outcomes.push(lostOutcome(party, null, 'elsewhere'));
      continue;
    }
    seat(rng, progress, index, party, minute);
    if (tasted && index === 0 && progress.samples) {
      progress.samples.parties++;
      progress.samples.guests += party.size;
    }
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
    (v) => v.tables.length === 1 && v.tables[0] === from && !v.eating && !v.skipped && !v.visitor && !v.moved && !v.counter,
  );
  const free = to >= 0 && to < allTables(restaurant) && !floor.visits.some((v) => v.tables.includes(to));
  if (!visit || !free) return null;
  visit.tables = [to];
  visit.moved = true;
  return visit;
}

/** Where a chef or waiter is with hurrying: free to hurry, hurrying, catching their breath, done for this rush, or no rush on. */
export type HurryState = 'ready' | 'hurrying' | 'resting' | 'used' | 'none';

/** The minute the restaurant view shows (the last tick played), which the player's taps go by. */
const shownMinute = (progress: DayInProgress) => minuteOfDay(Math.max(0, progress.tick - 1));

function hurryOf(floor: Floor, role: Hurry['role'], look: number, rush: number): Hurry | undefined {
  return floor.hurries.find((h) => h.role === role && h.look === look && h.rush === rush);
}

/** How it stands with hurrying the chef or waiter at this place in the kitchen or on the floor. */
export function hurryState(progress: DayInProgress, index: number, role: Hurry['role'], at: number): HurryState {
  const minute = shownMinute(progress);
  const rush = rushAt(minute);
  const restaurant = progress.restaurants[index];
  const person = (role === 'chef' ? restaurant.chefs : restaurant.waiters)[at];
  if (rush === null || !person || progress.tick > ticksPerDay()) return 'none';
  const hurry = hurryOf(progress.floors[index], role, person.look ?? at, rush);
  if (!hurry) return 'ready';
  return minute < hurry.until ? 'hurrying' : minute < hurry.restUntil ? 'resting' : 'used';
}

/**
 * The player hurries a chef or a waiter during a rush, once each per rush: for a while a chef
 * cooks faster and a waiter takes orders faster, and then they need a breather. Returns false
 * if they can't be hurried now.
 */
export function hurryStaff(progress: DayInProgress, index: number, role: Hurry['role'], at: number): boolean {
  if (hurryState(progress, index, role, at) !== 'ready') return false;
  const minute = shownMinute(progress);
  const rush = rushAt(minute)!;
  const restaurant = progress.restaurants[index];
  const floor = progress.floors[index];
  const until = minute + balance.rush.hurryMinutes;
  const restUntil = until + balance.rush.restMinutes;
  if (role === 'chef') {
    floor.hurries.push({ role, look: restaurant.chefs[at].look ?? at, rush, until, restUntil, chef: at });
    return true;
  }
  const normal = restaurant.waiters[at];
  const hurried: Staff = { ...normal, speed: Math.min(5, normal.speed + balance.rush.waiterSpeedBonus) };
  restaurant.waiters = restaurant.waiters.map((waiter) => (waiter === normal ? hurried : waiter));
  floor.hurries.push({ role, look: normal.look ?? at, rush, until, restUntil, waiter: { normal, hurried, done: false } });
  return true;
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
  /** What the party paid when its food arrived, on its first table only (0 elsewhere, and before). */
  bill: number;
  critic: boolean;
  regular: boolean;
  /** One of the named regulars with a story, or null. */
  regularId: RegularId | null;
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
  /** What they hoped for (its bubble), and whether the menu had it. */
  wish?: { bubble: string; met: boolean } | null;
}

export interface FloorView {
  /** The street the restaurant is on: it decides the size of the room. */
  location: LocationId;
  /** Inside tables first, then terrace tables open today; null for an empty table. */
  tables: (TableGuests | null)[];
  insideTables: number;
  /** Where the bar counter's places start in `tables` (after the terrace's); the same as its length without a counter. */
  counterFrom: number;
  /** Terrace tables to draw: all of them with a permit, even on days the terrace is closed. */
  terraceTables: number;
  /** For each chef: busy cooking right now? */
  chefsBusy: boolean[];
  /** One entry per waiter on today: null, or which of the special waiters it is. */
  waiters: (SpecialStaffId | null)[];
  /** Each chef's and each waiter's face (see Staff.look), in the same order. */
  chefLooks: number[];
  waiterLooks: number[];
  decor: DecorId[];
  equipment: EquipmentId[];
  /** Building works done on the premises (the bar counter's stools, the toilet door). */
  works?: BuildingWorkId[];
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
  /** The rush on right now ("Lunch rush"), if any. */
  rush?: string | null;
  /** For each chef and each waiter on the floor, in the same order: how it stands with hurrying them. */
  chefHurry?: HurryState[];
  waiterHurry?: HurryState[];
  /** Parties served quickly in a row, so far. */
  streak?: number;
  /** A musician playing by the door (a theme night with live music). */
  musician?: boolean;
  /** The waiter out by the door with a tray of samples, while they're out: which special waiter (if one) and their face. */
  samplesWaiter?: { special: SpecialStaffId | null; look: number; dish: TemplateId } | null;
}

/** A snapshot of one restaurant for the restaurant view. Reads the day; changes nothing. */
export function floorView(progress: DayInProgress, index: number, recentMinutes = 10): FloorView {
  const restaurant = progress.restaurants[index];
  const floor = progress.floors[index];
  const minute = minuteOfDay(Math.max(0, progress.tick - 1));
  // The tables (inside, then the terrace's open today), then the places at the bar counter.
  const tables: (TableGuests | null)[] = Array(allTables(restaurant) + counterPlaces(restaurant)).fill(null);

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
        bill: visit.eating && i === 0 ? sum(visit.order, (dish) => dish.price) : 0,
        critic: party.critic ?? false,
        regular: party.regular ?? false,
        regularId: party.regularId ?? null,
        visitor: visit.visitor ?? null,
        drink: visit.drink ?? false,
        apology: visit.apology ?? false,
        moved: visit.moved ?? false,
        tablesUsed: visit.tablesUsed,
        since: visit.seatedAt,
        wish: visit.walkInWish ? { bubble: WISHES[visit.walkInWish.id].bubble, met: visit.walkInWish.met } : null,
      };
    });
  }

  return {
    location: restaurant.location,
    tables,
    insideTables: restaurant.tables,
    counterFrom: allTables(restaurant),
    terraceTables: restaurant.terraceTables,
    chefsBusy: floor.chefFreeAt.map((freeAt) => freeAt > minute),
    waiters: restaurant.waiters.map((waiter) => waiter.special ?? null),
    chefLooks: restaurant.chefs.map((chef, i) => chef.look ?? i),
    waiterLooks: restaurant.waiters.map((waiter, i) => waiter.look ?? i),
    decor: restaurant.decor,
    works: restaurant.works,
    equipment: restaurant.equipment,
    ordersWaiting: floor.queue.length,
    walkouts: floor.walkouts
      .filter((w) => minute - w.minute < recentMinutes)
      .map(({ group, size }) => ({ group, size })),
    atTheDoor: floor.door.map(({ party, since }) => ({ group: party.group, size: party.size, since })),
    leftTheDoor: floor.doorLeft.filter((left) => minute - left.minute < recentMinutes),
    rush: progress.tick > ticksPerDay() ? null : rushName(minute),
    chefHurry: restaurant.chefs.map((_, i) => hurryState(progress, index, 'chef', i)),
    waiterHurry: restaurant.waiters.map((_, i) => hurryState(progress, index, 'waiter', i)),
    streak: floor.streak.current,
    musician: (restaurant.themeNight?.mood ?? 0) > 0 && themeNightOn(restaurant, minute) && progress.tick <= ticksPerDay(),
    samplesWaiter:
      index === 0 && progress.samples && samplesOn(restaurant, minute) && progress.tick <= ticksPerDay()
        ? { special: progress.samples.waiter.special ?? null, look: progress.samples.waiter.look ?? 0, dish: progress.samples.dish.template }
        : null,
  };
}
