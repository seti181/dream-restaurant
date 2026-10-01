// Choice cards: small moments during service that wait for the player's answer.
// See project.md section 6.13. The moments themselves are in data/moments.ts.
//
// Moments use their own random generator, so whether one comes up, and how it is answered,
// never changes which guests arrive or what they order.

import { balance } from '../data/balance';
import { GROUP_IDS, type GroupId } from '../data/groups';
import { MOMENT_IDS, MOMENTS, type MomentEffect, type MomentId, type MomentNeed } from '../data/moments';
import { minuteOfDay, ticksPerDay } from './clock';
import { seat, type DayInProgress, type Visit } from './day';
import { templateOf } from './menu';
import { chance, createRng, nextFloat, nextInt, type RngState } from './rng';

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
}

/** Today's moments. Only lives while the day runs, so it is never saved. */
export interface MomentsToday {
  rng: RngState;
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

/** Picks today's times for the random moments. */
export function planMoments(seed: number): MomentsToday {
  const rng = createRng(seed);
  const { perDay, firstMinute, lastMinute } = balance.moments;
  const count = nextInt(rng, perDay.min, perDay.max);
  // One in each equal part of the day, so they don't bunch up.
  const part = (lastMinute - firstMinute) / count;
  const step = balance.clock.tickMinutes;
  const slots = [...Array(count).keys()].map(
    (i) => Math.round((firstMinute + (i + nextFloat(rng)) * part) / step) * step,
  );
  return { rng, slots, seen: [], pending: null, results: [], cash: 0 };
}

const waiting = (visit: Visit) => !visit.eating && !visit.skipped;
const outside = (visit: Visit, insideTables: number) => visit.tables.some((table) => table >= insideTables);

function needMet(need: MomentNeed, { progress, adrianAway }: MomentContext): boolean {
  const restaurant = progress.restaurants[0];
  const floor = progress.floors[0];
  switch (need) {
    case 'dessertOnMenu':
      return restaurant.menu.some((dish) => templateOf(dish).category === 'dessert');
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
    case 'roomForSix':
      return floor.freeTables >= 2;
  }
}

const canHappen = (id: MomentId, context: MomentContext) => MOMENTS[id].needs.every((need) => needMet(need, context));

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
  const possible = MOMENT_IDS.filter((id) => !MOMENTS[id].at && !today.seen.includes(id) && canHappen(id, context));
  if (possible.length === 0) {
    // Nothing fits right now: try again a little later, if there's still time today.
    today.slots[0] += balance.moments.retryMinutes;
    if (today.slots[0] > balance.moments.lastMinute) today.slots.shift();
    return false;
  }
  today.slots.shift();
  let roll = nextFloat(today.rng) * possible.reduce((sum, id) => sum + MOMENTS[id].weight, 0);
  const id = possible.find((option) => (roll -= MOMENTS[option].weight) < 0) ?? possible[possible.length - 1];
  show(today, id, minute, context);
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
): { result: string; cash: number } {
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
  if (effect.walkIn) {
    const { group, size } = effect.walkIn;
    seat(today.rng, progress, 0, {
      group,
      size,
      origin: restaurant.location,
      arrivalMinute: minute,
      bookedAt: restaurant.id,
    }, minute);
  }
  return { result: effect.result, cash };
}

/** Answers the moment on screen with its first (0) or second (1) choice. */
export function answerMoment(today: MomentsToday, progress: DayInProgress, choice: 0 | 1): MomentResult | null {
  const pending = today.pending;
  if (!pending) return null;
  const moment = MOMENTS[pending.id];
  const { result, cash } = apply(moment.choices[choice].effect, today, progress, pending);
  const entry: MomentResult = {
    id: pending.id,
    title: moment.title,
    choice: moment.choices[choice].label,
    result,
    cash,
    minute: pending.minute,
  };
  today.results.push(entry);
  today.cash += cash;
  today.pending = null;
  return entry;
}
