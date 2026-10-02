// Choice cards: small moments during service that wait for the player's answer.
// See project.md section 6.13. The moments themselves are in data/moments.ts.
//
// Moments use their own random generator, so whether one comes up, and how it is answered,
// never changes which guests arrive or what they order.

import { balance } from '../data/balance';
import { GROUP_IDS, type GroupId } from '../data/groups';
import { MOMENT_IDS, MOMENTS, type MomentEffect, type MomentId, type MomentNeed } from '../data/moments';
import { minuteOfDay, ticksPerDay } from './clock';
import { doorClosed, seat, type DayInProgress, type Visit } from './day';
import { calendarEventsOn } from './events';
import { isFairDay } from './neptune';
import { templateOf } from './menu';
import { chance, createRng, nextFloat, nextInt, pick, type RngState } from './rng';
import type { Review } from './types';

/** A moment on screen, waiting for an answer. */
export interface PendingMoment {
  id: MomentId;
  minute: number;
  /** The table a moment about one table is about, or null. */
  table: number | null;
}

/** What happened in a moment, for the day report. */
export interface MomentResult {
  id: MomentId;
  title: string;
  /** The answer chosen. */
  choice: string;
  result: string;
  /** Złoty gained or spent. */
  cash: number;
  minute: number;
  /** A review the answer earned, for the day report. */
  review: Review | null;
  /** Something that comes of the answer later. */
  followUp?: MomentEffect['followUp'];
  /** Dishes or decor the answer unlocked. */
  unlock?: string[];
}

/** Today's moments. Only lives while the day runs, so it is never saved. */
export interface MomentsToday {
  rng: RngState;
  day: number;
  /** The last day each card was shown, before today. */
  lastSeen: Partial<Record<MomentId, number>>;
  /** Follow-up cards due today (from answers on earlier days); they come before random ones. */
  queued: MomentId[];
  /** Minutes when a random moment is due, earliest first. */
  slots: number[];
  /** Moments already shown today; each comes at most once a day. */
  seen: MomentId[];
  pending: PendingMoment | null;
  results: MomentResult[];
  /** Everything the answers gained or spent today. */
  cash: number;
}

/** What a moment can see of the day, besides the day itself. */
export interface MomentContext {
  progress: DayInProgress;
  /** Adrian didn't turn up today. */
  adrianAway: boolean;
}

/** Picks how many random cards come today, and when: anywhere in the day, but not on top of each other. */
export function planMoments(
  seed: number,
  day: number,
  lastSeen: Partial<Record<MomentId, number>>,
  queued: MomentId[] = [],
): MomentsToday {
  const rng = createRng(seed);
  const { perDay, firstMinute, lastMinute, minGapMinutes } = balance.moments;
  const count = nextInt(rng, perDay.min, perDay.max);
  const times = [...Array(count)].map(() => firstMinute + nextFloat(rng) * (lastMinute - firstMinute)).sort((a, b) => a - b);
  const step = balance.clock.tickMinutes;
  const slots: number[] = [];
  for (const time of times) {
    const earliest = slots.length > 0 ? slots[slots.length - 1] + minGapMinutes : firstMinute;
    const minute = Math.round(Math.max(time, earliest) / step) * step;
    if (minute <= lastMinute) slots.push(minute);
  }
  return { rng, day, lastSeen, queued: [...queued], slots, seen: [], pending: null, results: [], cash: 0 };
}

/** Cards that can come at random (not tied to a time of day, and not only a follow-up). */
const RANDOM_CARDS = MOMENT_IDS.filter((id) => !MOMENTS[id].at && !MOMENTS[id].followUpOnly);

/**
 * How likely a random card is today, by its rarity. Not at all while it rests after coming up
 * (the usual rest, or the card's own longer one), and never again once a one-off has come up.
 */
export function weightToday(today: MomentsToday, id: MomentId): number {
  const moment = MOMENTS[id];
  const last = today.lastSeen[id];
  if (last !== undefined) {
    if (moment.once) return 0;
    if (today.day - last < (moment.cooldownDays ?? balance.moments.restDays)) return 0;
  }
  return balance.moments.rarityWeights[moment.rarity];
}

/** Picks one of the cards, by how likely each is today. */
function pickByWeight(today: MomentsToday, options: MomentId[]): MomentId {
  let roll = nextFloat(today.rng) * options.reduce((sum, id) => sum + weightToday(today, id), 0);
  return options.find((option) => (roll -= weightToday(today, option)) < 0) ?? options[options.length - 1];
}

const waiting = (visit: Visit) => !visit.eating && !visit.skipped;
const outside = (visit: Visit, insideTables: number) => visit.tables.some((table) => table >= insideTables);

function needMet(need: MomentNeed, { progress, adrianAway }: MomentContext): boolean {
  const restaurant = progress.restaurants[0];
  const floor = progress.floors[0];
  const open = !doorClosed(floor, minuteOfDay(progress.tick));
  switch (need) {
    case 'dessertOnMenu':
      return restaurant.menu.some((dish) => templateOf(dish).category === 'dessert');
    case 'soupOnMenu':
      return restaurant.menu.some((dish) => templateOf(dish).category === 'soup');
    case 'guestsWaiting':
      return floor.visits.some((visit) => waiting(visit) && visit.tables.length > 0);
    case 'guestsIn':
      return floor.visits.length >= 2;
    case 'terraceGuests':
      return floor.visits.some((visit) => outside(visit, restaurant.tables));
    case 'cloudy':
      return progress.conditions.weather === 'cloudy';
    case 'regularHere':
      return floor.visits.some((visit) => visit.party.regular);
    case 'adrianAway':
      return adrianAway;
    case 'tomekWorking':
      return restaurant.waiters.some((waiter) => waiter.special === 'tomek');
    case 'doorOpen':
      return open;
    case 'freeTable':
      return open && floor.freeTables >= 1;
    case 'duringFair':
      return isFairDay(progress.day);
    case 'tallShipsWeek':
      return calendarEventsOn(progress.day).includes('tallShips');
    case 'heatwave':
      return progress.conditions.weather === 'heatwave';
    case 'rainy':
      return progress.conditions.weather === 'rain';
    case 'evening':
      return minuteOfDay(progress.tick) >= 17 * 60;
  }
}

const canHappen = (id: MomentId, context: MomentContext) => MOMENTS[id].needs.every((need) => needMet(need, context));

/** Whether one of a card's needs is met right now in an open day (for tests and tools). */
export function checkNeed(open: { progress: DayInProgress; absent: { special?: string }[] }, need: MomentNeed): boolean {
  return needMet(need, { progress: open.progress, adrianAway: open.absent.some((a) => a.special === 'adrian') });
}

function show(today: MomentsToday, id: MomentId, minute: number, context: MomentContext): void {
  today.seen.push(id);
  // A moment about one table picks a table that is waiting for its food.
  const aboutOne = MOMENTS[id].choices.some((c) => c.effect.mood?.who === 'one');
  const candidates = context.progress.floors[0].visits.filter((v) => waiting(v) && v.tables.length > 0);
  const table = aboutOne && candidates.length > 0 ? candidates[nextInt(today.rng, 0, candidates.length - 1)].tables[0] : null;
  today.pending = { id, minute, table };
}

/**
 * Checks whether a moment comes up before the next tick is played. Returns true if one did:
 * the day should then wait until it is answered.
 */
export function checkMoments(today: MomentsToday, context: MomentContext): boolean {
  const { progress } = context;
  if (today.pending) return true;
  if (progress.tick >= ticksPerDay()) return false;
  const minute = minuteOfDay(progress.tick);

  // Moments that belong to a time of day come then, and take the place of a random one.
  for (const id of MOMENT_IDS) {
    const at = MOMENTS[id].at;
    if (!at || at.hour * 60 + at.minute !== minute || today.seen.includes(id)) continue;
    if (!canHappen(id, context)) continue;
    show(today, id, minute, context);
    today.slots.pop();
    return true;
  }

  if (today.slots.length === 0 || today.slots[0] > minute) return false;
  // A follow-up due today comes first, if it can.
  const followUp = today.queued.find((id) => !today.seen.includes(id) && canHappen(id, context));
  if (followUp) {
    today.queued = today.queued.filter((id) => id !== followUp);
    today.slots.shift();
    show(today, followUp, minute, context);
    return true;
  }
  // Cards resting after coming up don't count: if nothing else fits, no card comes now.
  const fitting = RANDOM_CARDS.filter((id) => !today.seen.includes(id) && weightToday(today, id) > 0 && canHappen(id, context));
  if (fitting.length === 0) {
    // Nothing fits right now: try again a little later, if there's still time today.
    today.slots[0] += balance.moments.retryMinutes;
    if (today.slots[0] > balance.moments.lastMinute) today.slots.shift();
    return false;
  }
  today.slots.shift();
  show(today, pickByWeight(today, fitting), minute, context);
  return true;
}

const clamp100 = (value: number) => Math.max(0, Math.min(100, value));

function addPoints(points: Record<GroupId, number>, change: Partial<Record<GroupId, number>>): Record<GroupId, number> {
  const result = { ...points };
  for (const group of GROUP_IDS) result[group] = clamp100(result[group] + (change[group] ?? 0));
  return result;
}

/** Terrace guests move to free tables inside, as far as they go. */
function moveInside(progress: DayInProgress): void {
  const restaurant = progress.restaurants[0];
  const floor = progress.floors[0];
  const taken = new Set(floor.visits.flatMap((visit) => visit.tables));
  const free = [...Array(restaurant.tables).keys()].filter((table) => !taken.has(table));
  for (const visit of floor.visits) {
    if (!outside(visit, restaurant.tables) || free.length < visit.tables.length) continue;
    visit.tables = free.splice(0, visit.tables.length);
  }
}

/** Carries out an answer. Returns what happened and the money gained or spent. */
function apply(
  effect: MomentEffect,
  today: MomentsToday,
  progress: DayInProgress,
  pending: PendingMoment,
): { result: string; cash: number; review: Review | null; followUp?: MomentEffect['followUp']; unlock?: string[] } {
  if (effect.chance !== undefined && effect.otherwise && !chance(today.rng, effect.chance)) {
    return apply(effect.otherwise, today, progress, pending);
  }
  const restaurant = progress.restaurants[0];
  const floor = progress.floors[0];
  const { minute } = pending;
  let cash = effect.cash ?? 0;
  if (effect.cashPerGuest) {
    cash += effect.cashPerGuest * floor.visits.reduce((sum, visit) => sum + visit.party.size, 0);
  }
  if (effect.moveInside) moveInside(progress);
  if (effect.mood) {
    const { who, amount } = effect.mood;
    for (const visit of floor.visits) {
      if (!waiting(visit)) continue;
      const affected =
        who === 'waiting' ||
        (who === 'terrace' && outside(visit, restaurant.tables)) ||
        (who === 'one' && visit.tables[0] === pending.table);
      if (affected) visit.mood += amount;
    }
  }
  if (effect.reputation) restaurant.reputation = addPoints(restaurant.reputation, effect.reputation);
  if (effect.awareness) restaurant.awareness = addPoints(restaurant.awareness, effect.awareness);
  if (effect.helper) restaurant.waiters = [...restaurant.waiters, { ...effect.helper }];
  if (effect.kitchenPause) {
    floor.chefFreeAt = floor.chefFreeAt.map((freeAt) => Math.max(freeAt, minute) + effect.kitchenPause!);
  }
  if (effect.visitors) {
    const { who, group, size, minutes, closesDoor, reputationAfterwards } = effect.visitors;
    const party = { group, size, origin: restaurant.location, arrivalMinute: minute, bookedAt: restaurant.id };
    seat(today.rng, progress, 0, party, minute, false);
    // They didn't come for the kitchen. They stay their time, until closing at the latest.
    const visit = floor.visits.find((v) => v.party === party);
    if (visit) {
      const leaveAt = Math.min(minute + minutes, balance.clock.closeMinute);
      Object.assign(visit, { order: [], eating: true, readyAt: minute, leaveAt, visitor: who, reputationAfterwards });
      if (closesDoor) floor.closed = { until: leaveAt, everyone: closesDoor === 'everyone' };
    }
  }
  if (effect.qualityBoost) floor.qualityBonus += effect.qualityBoost;
  if (effect.waiterAway && restaurant.waiters.length > 0) {
    // The last waiter in the list goes; they're back after a while.
    const waiter = restaurant.waiters[restaurant.waiters.length - 1];
    restaurant.waiters = restaurant.waiters.slice(0, -1);
    floor.away.push({ waiter, back: minute + effect.waiterAway });
  }
  if (effect.walkIn) {
    const { group, size } = effect.walkIn;
    // With every table taken, they wait at the front of the queue at the door, like guests who booked.
    seat(today.rng, progress, 0, {
      group,
      size,
      origin: restaurant.location,
      arrivalMinute: minute,
      bookedAt: restaurant.id,
    }, minute);
  }
  const review: Review | null = effect.review
    ? {
        stars: effect.review.stars,
        text: pick(today.rng, effect.review.texts),
        reviewer: pick(today.rng, effect.review.reviewers),
        critic: false,
      }
    : null;
  return { result: effect.result, cash, review, followUp: effect.followUp, unlock: effect.unlock };
}

/** Answers the moment on screen with its first (0) or second (1) choice. */
export function answerMoment(today: MomentsToday, progress: DayInProgress, choice: 0 | 1): MomentResult | null {
  const pending = today.pending;
  if (!pending) return null;
  const moment = MOMENTS[pending.id];
  const { result, cash, review, followUp, unlock } = apply(moment.choices[choice].effect, today, progress, pending);
  const entry: MomentResult = {
    id: pending.id,
    title: moment.title,
    choice: moment.choices[choice].label,
    result,
    cash,
    minute: pending.minute,
    review,
    followUp,
    unlock,
  };
  today.results.push(entry);
  today.cash += cash;
  today.pending = null;
  return entry;
}
