// The choice model: which restaurant a party picks. See project.md section 7, step 2.
// Each restaurant gets a score ("utility"). Higher scores are more likely to win,
// but there is always some chance for the others (a softmax, or logit, choice).

import { balance } from '../data/balance';
import type { ExtraId, MenuDish } from '../data/dishes';
import { GROUPS, type GroupId } from '../data/groups';
import { LOCATIONS, type LocationId } from '../data/locations';
import { interiorAppeal } from './interior';
import { freshOn, happyHourOn, lunchSetServing, priceMultiplier, specialOf, tagsOf, templateOf } from './menu';
import { nextFloat, type RngState } from './rng';
import type { Party, Restaurant } from './types';

/** How much a group likes one dish, from 0 (not their thing) to 1 (perfect). */
export function dishAppeal(dish: MenuDish, group: GroupId): number {
  const { likes } = GROUPS[group];
  const tags = tagsOf(dish);
  const template = templateOf(dish);
  const matches =
    likes.tags.filter((tag) => tags.includes(tag)).length +
    (likes.categories.includes(template.category) ? 1 : 0) +
    (likes.templates.includes(dish.template) ? 1 : 0);
  return Math.min(1, matches / balance.choice.matchesForFullAppeal);
}

/** What today's special on the board outside adds to how tempting the restaurant looks. */
export function specialAppeal(restaurant: Restaurant, inSeason: readonly ExtraId[]): number {
  const special = specialOf(restaurant);
  if (!special) return 0;
  const { appeal, freshAppeal } = balance.specials;
  return appeal + (freshOn(special, inSeason).length > 0 ? freshAppeal : 0);
}

/** How tempting a menu looks to a group, 0–1: the average appeal of its best few dishes. */
export function menuMatch(menu: MenuDish[], group: GroupId): number {
  const count = balance.choice.menuMatchDishes;
  const best = menu
    .map((dish) => dishAppeal(dish, group))
    .sort((a, b) => b - a)
    .slice(0, count);
  return best.reduce((sum, appeal) => sum + appeal, 0) / count;
}

/** Menu prices compared with typical Old Town prices: 1 = typical, 1.2 = 20% dearer. */
export function priceLevel(menu: MenuDish[]): number {
  if (menu.length === 0) return 1;
  const total = menu.reduce((sum, dish) => sum + dish.price / templateOf(dish).referencePrice, 0);
  return total / menu.length;
}

export function distanceMetres(a: LocationId, b: LocationId): number {
  const pa = LOCATIONS[a].mapPosition;
  const pb = LOCATIONS[b].mapPosition;
  return Math.hypot(pa.x - pb.x, pa.y - pb.y);
}

/**
 * How attractive a restaurant is to a party, or null if it is not an option
 * (out of walking range, nothing on the menu, or nobody to cook).
 */
export function utility(
  restaurant: Restaurant,
  party: Party,
  expectedWaitMinutes: number,
  full = false,
  inSeason: readonly ExtraId[] = [],
): number | null {
  const distance = distanceMetres(party.origin, restaurant.location);
  const range = balance.choice.walkRangeMetres;
  if (distance > range || restaurant.menu.length === 0 || restaurant.chefs.length === 0) return null;

  const group = GROUPS[party.group];
  const w = group.choiceWeights;
  const prices = priceLevel(restaurant.menu) * priceMultiplier(restaurant, party.arrivalMinute);
  const priceTerm = Math.max(-1, Math.min(1, 1 - prices));
  const waitTerm = -Math.min(1, expectedWaitMinutes / group.patienceMinutes);
  const lunchSetTerm = lunchSetServing(restaurant, party.arrivalMinute)
    ? balance.lunchSet.appealBonus * group.lunchSetAppeal
    : 0;

  // People who haven't heard of a restaurant mostly don't think of it; a few walk in anyway.
  const { walkInShare } = balance.choice;
  const heardOf = walkInShare + (1 - walkInShare) * (restaurant.awareness[party.group] / 100);

  return (
    Math.log(heardOf) +
    w.taste * menuMatch(restaurant.menu, party.group) +
    w.price * priceTerm +
    w.reputation * (restaurant.reputation[party.group] / 100) +
    w.awareness * (restaurant.awareness[party.group] / 100) +
    w.proximity * (1 - distance / range) +
    w.ambiance * (restaurant.ambiance / 100) +
    w.wait * waitTerm +
    lunchSetTerm +
    // The happy hour board outside.
    (happyHourOn(restaurant, party.arrivalMinute) ? balance.happyHour.appealBonus : 0) +
    // "Dziś polecamy" on the board, all the more tempting with something fresh in season.
    specialAppeal(restaurant, inSeason) +
    interiorAppeal(restaurant, party.group) -
    // Through the window, people can see when every table is taken.
    (full ? balance.choice.fullPenalty : 0)
  );
}

/**
 * Picks a restaurant for the party, returning its index in `restaurants`,
 * or null if the party goes somewhere else entirely.
 * `expectedWaits` holds each restaurant's current expected wait in minutes, and `full`
 * whether every table is taken (with people already waiting at the door).
 */
export function chooseRestaurant(
  rng: RngState,
  party: Party,
  restaurants: Restaurant[],
  expectedWaits: number[],
  full: boolean[] = [],
  inSeason: readonly ExtraId[] = [],
): number | null {
  const options: { index: number | null; score: number }[] = [
    { index: null, score: balance.choice.noRestaurantUtility },
  ];
  restaurants.forEach((restaurant, index) => {
    const score = utility(restaurant, party, expectedWaits[index], full[index] ?? false, inSeason);
    if (score !== null) options.push({ index, score });
  });

  // Softmax: subtract the best score first so the exponentials stay small.
  const best = Math.max(...options.map((o) => o.score));
  const weights = options.map((o) => Math.exp(o.score - best));
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  let roll = nextFloat(rng) * total;
  for (let i = 0; i < options.length; i++) {
    roll -= weights[i];
    if (roll < 0) return options[i].index;
  }
  return options[options.length - 1].index;
}
