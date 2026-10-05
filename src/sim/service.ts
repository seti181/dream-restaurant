// Service formulas: tables, waiters, the kitchen and what guests order.
// See project.md section 7, step 3.

import { balance } from '../data/balance';
import type { ExtraId, MenuDish } from '../data/dishes';
import type { Weather } from '../data/weather';
import { GROUPS, type GroupId } from '../data/groups';
import { dishAppeal } from './choice';
import { freshOn, lunchSetServing, pairingQuality, priceMultiplier, specialOf, templateOf } from './menu';
import { chance, nextFloat, type RngState } from './rng';
import type { Party, Restaurant, Staff, Supplier, TrendToday } from './types';

const average = (values: number[], fallback: number) =>
  values.length === 0 ? fallback : values.reduce((sum, v) => sum + v, 0) / values.length;

/** Someone's skill or speed at work, including their trait. */
export function effectiveLevel(person: Staff, stat: 'skill' | 'speed'): number {
  const change = person.trait ? balance.staff.traitEffects[person.trait][stat] : 0;
  return Math.max(balance.staff.minEffectiveLevel, person[stat] + change);
}

export function averageLevel(staff: Staff[], stat: 'skill' | 'speed'): number {
  // With nobody on the job, it is as if the least able person were doing it.
  return average(staff.map((person) => effectiveLevel(person, stat)), 1);
}

export function tablesNeeded(partySize: number): number {
  return Math.ceil(partySize / balance.service.seatsPerTable);
}

/** How the weather changes the appetite for a dish: soup on a rainy day, ice cream in a heatwave. */
export function weatherAppetite(dish: MenuDish, weather: Weather): number {
  if (templateOf(dish).category === 'soup') return balance.weather.soupOrders[weather];
  if (dish.template === 'iceCream' || dish.template === 'lemonade') return balance.weather.coolTreatOrders[weather];
  return 1;
}

/** Picks a dish, favouring the ones this group likes and the weather suits. */
export function pickByAppeal(
  rng: RngState,
  dishes: MenuDish[],
  group: GroupId,
  weather: Weather = 'cloudy',
  /** Today's special: the board outside talks guests into it. */
  special: MenuDish | null = null,
  /** This week's trend: the group that craves it orders it more. */
  trend: TrendToday | null = null,
): MenuDish {
  const weights = dishes.map(
    (dish) =>
      (balance.orders.baseDishWeight + dishAppeal(dish, group, trend)) *
      weatherAppetite(dish, weather) *
      (dish === special ? balance.specials.orderWeight : 1),
  );
  let roll = nextFloat(rng) * weights.reduce((sum, w) => sum + w, 0);
  for (let i = 0; i < dishes.length; i++) {
    roll -= weights[i];
    if (roll < 0) return dishes[i];
  }
  return dishes[dishes.length - 1];
}

/** The lunch set's soup and main, priced so they add up to the set price. */
function lunchSetOrder(set: { soup: MenuDish; main: MenuDish; price: number }): MenuDish[] {
  const separate = set.soup.price + set.main.price;
  return [set.soup, set.main].map((dish) => ({ ...dish, price: (set.price * dish.price) / separate, fromLunchSet: true }));
}

/**
 * Each guest orders a soup or main (or the lunch set, if it's lunchtime and they
 * fancy it), and maybe a drink and a dessert.
 */
export function chooseOrder(
  rng: RngState,
  restaurant: Restaurant,
  party: Party,
  minute: number,
  weather: Weather = 'cloudy',
  trend: TrendToday | null = null,
): MenuDish[] {
  const { menu } = restaurant;
  const lunchSet = lunchSetServing(restaurant, minute);
  const inCategory = (...categories: string[]) =>
    menu.filter((dish) => categories.includes(templateOf(dish).category));
  const food = inCategory('soup', 'main');
  const drinks = inCategory('drink');
  const desserts = inCategory('dessert');
  const order: MenuDish[] = [];
  const multiplier = priceMultiplier(restaurant, minute);
  const special = specialOf(restaurant);
  for (let guest = 0; guest < party.size; guest++) {
    if (lunchSet && chance(rng, GROUPS[party.group].lunchSetAppeal)) {
      order.push(...lunchSetOrder(lunchSet));
    } else {
      order.push(pickByAppeal(rng, food.length > 0 ? food : menu, party.group, weather, special, trend));
    }
    if (drinks.length > 0 && chance(rng, balance.orders.drinkChance)) {
      order.push(pickByAppeal(rng, drinks, party.group, weather, special, trend));
    }
    if (desserts.length > 0 && chance(rng, balance.orders.dessertChance)) {
      order.push(pickByAppeal(rng, desserts, party.group, weather, special, trend));
    }
  }
  return multiplier === 1 ? order : order.map((dish) => ({ ...dish, price: dish.price * multiplier }));
}

/** Minutes until a newly seated party's order reaches the kitchen. */
export function orderMinutes(restaurant: Restaurant, busyTables: number): number {
  const s = balance.service;
  const capacity = Math.max(0.5, restaurant.waiters.length) * s.tablesPerWaiter;
  const load = Math.max(1, busyTables / capacity);
  const speedFactor = averageLevel(restaurant.waiters, 'speed') / balance.staff.averageLevel;
  return (s.orderMinutes / speedFactor) * load;
}

/** Big menus slow the kitchen a little: 1 = no slowdown. */
export function menuSlowdown(menuSize: number): number {
  const k = balance.kitchen;
  return 1 + k.slowdownPerExtraDish * Math.max(0, menuSize - k.menuSizeBeforeSlowdown);
}

/** Minutes one chef needs to cook a whole order. */
export function prepMinutes(order: MenuDish[], chef: Staff, menuSize: number): number {
  const longest = Math.max(...order.map((dish) => templateOf(dish).prepMinutes));
  const base = longest + balance.kitchen.extraPortionMinutes * (order.length - 1);
  const speedFactor = effectiveLevel(chef, 'speed') / balance.staff.averageLevel;
  return (base / speedFactor) * menuSlowdown(menuSize);
}

/** Average quality (0–100) of an order cooked by this chef; fresh produce in season tastes better. */
export function orderQuality(
  order: MenuDish[],
  chef: Staff,
  supplier: Supplier = 'market',
  inSeason: readonly ExtraId[] = [],
): number {
  const k = balance.kitchen;
  const supplierBonus = supplier === 'premium' ? balance.supplier.premiumQualityBonus : 0;
  const skillBonus = (effectiveLevel(chef, 'skill') - balance.staff.averageLevel) * k.qualityPerSkillPoint;
  const dishQuality = (dish: MenuDish) => {
    const template = templateOf(dish);
    const specialty = chef.specialty !== undefined && chef.specialty === template.cuisine ? k.specialtyBonus : 0;
    const fresh = freshOn(dish, inSeason).length > 0 ? balance.seasonal.freshQuality : 0;
    // A kitchen that has cooked a dish many times cooks it better (sim/practice.ts).
    const practised = (dish.stars ?? 0) * balance.dishLevels.qualityPerStar;
    return template.baseQuality + skillBonus + specialty + supplierBonus + pairingQuality(dish) + fresh + practised;
  };
  const quality = average(order.map(dishQuality), 0);
  return Math.max(0, Math.min(100, quality));
}

/** What a party looking in from the street guesses the wait for food will be. */
export function expectedWait(restaurant: Restaurant, busyTables: number, ordersWaiting: number): number {
  if (restaurant.chefs.length === 0 || restaurant.menu.length === 0) return Infinity;
  const speedFactor = averageLevel(restaurant.chefs, 'speed') / balance.staff.averageLevel;
  const typicalPrep =
    (average(restaurant.menu.map((dish) => templateOf(dish).prepMinutes), 0) / speedFactor) *
    menuSlowdown(restaurant.menu.length);
  const ordersAhead = ordersWaiting / restaurant.chefs.length;
  return orderMinutes(restaurant, busyTables) + (ordersAhead + 1) * typicalPrep;
}
