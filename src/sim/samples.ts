// Samples at the door (project.md section 6.14, attracting passers-by): once a day, for an hour, a
// waiter steps out of the door with a tray of today's special (or the dish the kitchen cooks best).
// People out on the restaurant's street and the streets nearby taste it on their way past: they know
// the place now, and the better it tastes, the more of them come in. The waiter is off the floor until
// the tray is empty or the hour is up. How much is in balance.ts (balance.samples).

import { balance } from '../data/balance';
import type { MenuDish } from '../data/dishes';
import type { LocationId } from '../data/locations';
import { distanceMetres } from './choice';
import { minuteOfDay, ticksPerDay } from './clock';
import type { DayInProgress } from './day';
import { ingredientCostOf, recipeKey, specialOf } from './menu';
import { orderQuality } from './service';
import type { Party, Restaurant, Staff } from './types';

/** Today's samples at the door, once they've started. Only lives while the day runs. */
export interface SamplesToday {
  from: number;
  /** When the tray is put away: an hour later, or sooner once it's empty. */
  until: number;
  dish: MenuDish;
  /** How good the sample tastes (0–100), as the kitchen cooks it. */
  quality: number;
  /** Who's at the door with the tray (their look, for the pictures). */
  waiter: Staff;
  /** People who tasted it, and the parties (and guests) from the street who came in meanwhile. */
  tasted: number;
  parties: number;
  guests: number;
  /** What the samples cost in ingredients. */
  cost: number;
}

/** True while the samples are out (the restaurant's own copy, as the choice model sees it). */
export function samplesOn(restaurant: Restaurant, minute: number): boolean {
  const s = restaurant.samples;
  return s !== undefined && minute >= s.from && minute < s.until;
}

/** True if people out on this street walk past the restaurant's door: its own street and the ones nearby. */
export function walksPast(restaurant: Restaurant, origin: LocationId): boolean {
  return distanceMetres(origin, restaurant.location) <= balance.samples.reachMetres;
}

/** How much the samples tempt someone who tasted them on the way past: more the better they taste. */
export function samplesAppeal(restaurant: Restaurant, party: Party): number {
  if (!walksPast(restaurant, party.origin) || !samplesOn(restaurant, party.arrivalMinute)) return 0;
  const { appeal, qualityFrom, qualityFull, leastShare } = balance.samples;
  const share = (restaurant.samples!.quality - qualityFrom) / (qualityFull - qualityFrom);
  return appeal * Math.max(leastShare, Math.min(1, share));
}

/** How good a dish tastes from this kitchen today: its best chef's cooking. */
export function sampleQuality(progress: DayInProgress, dish: MenuDish): number {
  const restaurant = progress.restaurants[0];
  const { inSeason } = progress.conditions;
  const best = Math.max(0, ...restaurant.chefs.map((chef) => orderQuality([dish], chef, restaurant.supplier, inSeason)));
  return best + progress.floors[0].qualityBonus;
}

/** What goes on the tray: today's special, or else the dish the kitchen cooks best. */
export function sampleDish(progress: DayInProgress): MenuDish | null {
  const restaurant = progress.restaurants[0];
  const special = specialOf(restaurant);
  if (special) return special;
  let best: MenuDish | null = null;
  for (const dish of restaurant.menu) if (!best || sampleQuality(progress, dish) > sampleQuality(progress, best)) best = dish;
  return best;
}

/** Why samples can't go out now, or null if they can. */
export function samplesUnavailable(progress: DayInProgress): string | null {
  if (progress.samples) return 'Samples have already been out today.';
  if (progress.tick >= ticksPerDay()) return 'The restaurant has closed for today.';
  if (progress.restaurants[0].menu.length === 0) return 'There’s nothing on the menu to offer.';
  if (freeWaiter(progress) === null) return 'Nobody can step out: every waiter is busy or away.';
  return null;
}

/** A waiter who can step out: one on the floor who isn't being hurried in a rush. */
function freeWaiter(progress: DayInProgress): Staff | null {
  const hurried = progress.floors[0].hurries.flatMap((h) => (h.waiter && !h.waiter.done ? [h.waiter.hurried] : []));
  return progress.restaurants[0].waiters.find((w) => !hurried.includes(w)) ?? null;
}

/** Sends a waiter out of the door with a tray for the next hour. Returns false if they can't go. */
export function startSamples(progress: DayInProgress): boolean {
  if (samplesUnavailable(progress) !== null) return false;
  const restaurant = progress.restaurants[0];
  const dish = sampleDish(progress)!;
  const waiter = freeWaiter(progress)!;
  // From the minute on screen (the last one played), so the waiter shows at once.
  const from = minuteOfDay(Math.max(0, progress.tick - 1));
  const quality = sampleQuality(progress, dish);
  // Off the floor until the tray is put away.
  restaurant.waiters = restaurant.waiters.filter((w) => w !== waiter);
  progress.floors[0].away.push({ waiter, back: from + balance.samples.minutes });
  const until = from + balance.samples.minutes;
  restaurant.samples = { from, until, quality, dish: recipeKey(dish) };
  progress.samples = { from, until, dish, quality, waiter, tasted: 0, parties: 0, guests: 0, cost: 0 };
  return true;
}

/**
 * A party from the street walks past while the samples are out: they taste it, and have heard of the
 * place now (before they decide where to eat). Returns true if they tasted.
 */
export function tasteSamples(progress: DayInProgress, party: Party): boolean {
  const samples = progress.samples;
  const restaurant = progress.restaurants[0];
  if (!samples || !walksPast(restaurant, party.origin) || !samplesOn(restaurant, party.arrivalMinute)) return false;
  const s = balance.samples;
  // One waiter hands out only so many bites a minute: the tray lasts the hour, and anyone beyond that walks on past.
  const handedOutBy = Math.ceil(((party.arrivalMinute - samples.from + balance.clock.tickMinutes) / s.minutes) * s.tray);
  if (samples.tasted >= Math.min(s.tray, handedOutBy)) return false;
  const { inSeason, prices } = progress.conditions;
  party.tasted = true;
  const tastes = Math.min(party.size, s.tray - samples.tasted);
  samples.tasted += tastes;
  samples.cost += tastes * s.costShare * ingredientCostOf(samples.dish, restaurant.supplier, inSeason, prices);
  restaurant.awareness[party.group] = Math.min(100, restaurant.awareness[party.group] + s.awareness);
  // The tray is empty: the waiter goes back inside, and the samples are over.
  if (samples.tasted >= s.tray) endSamples(progress, party.arrivalMinute);
  return true;
}

/** The tray is empty before the hour is up: the waiter is back on the floor from the next minute. */
function endSamples(progress: DayInProgress, minute: number): void {
  const samples = progress.samples!;
  const restaurant = progress.restaurants[0];
  const away = progress.floors[0].away.find((a) => a.waiter === samples.waiter);
  if (away) away.back = minute;
  samples.until = minute + balance.clock.tickMinutes;
  if (restaurant.samples) restaurant.samples = { ...restaurant.samples, until: samples.until };
}
