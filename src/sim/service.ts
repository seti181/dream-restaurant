// Service formulas: tables, waiters, the kitchen and what guests order.
// See project.md section 7, step 3.

import { balance } from '../data/balance';
import type { MenuDish } from '../data/dishes';
import type { GroupId } from '../data/groups';
import { dishAppeal } from './choice';
import { templateOf } from './menu';
import { chance, nextFloat, type RngState } from './rng';
import type { Party, Restaurant, Staff } from './types';

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

/** Picks a dish, favouring the ones this group likes. */
export function pickByAppeal(rng: RngState, dishes: MenuDish[], group: GroupId): MenuDish {
  const weights = dishes.map((dish) => balance.orders.baseDishWeight + dishAppeal(dish, group));
  let roll = nextFloat(rng) * weights.reduce((sum, w) => sum + w, 0);
  for (let i = 0; i < dishes.length; i++) {
    roll -= weights[i];
    if (roll < 0) return dishes[i];
  }
  return dishes[dishes.length - 1];
}

/** Each guest orders a soup or main, and maybe a drink and a dessert. */
export function chooseOrder(rng: RngState, menu: MenuDish[], party: Party): MenuDish[] {
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

/** Average quality (0–100) of an order cooked by this chef. */
export function orderQuality(order: MenuDish[], chef: Staff): number {
  const k = balance.kitchen;
  const skillBonus = (effectiveLevel(chef, 'skill') - balance.staff.averageLevel) * k.qualityPerSkillPoint;
  const dishQuality = (dish: MenuDish) => {
    const template = templateOf(dish);
    const specialty = chef.specialty !== undefined && chef.specialty === template.cuisine ? k.specialtyBonus : 0;
    return template.baseQuality + skillBonus + specialty;
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
