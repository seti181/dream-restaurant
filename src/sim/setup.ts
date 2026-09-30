// Builds the restaurants at the start of a season.

import { balance } from '../data/balance';
import { DISH_TEMPLATES, type EquipmentId, type MenuDish } from '../data/dishes';
import { GROUP_IDS, type GroupId } from '../data/groups';
import { RIVALS, type RivalId } from '../data/rivals';
import type { Restaurant, Staff } from './types';

function forEveryGroup(value: number): Record<GroupId, number> {
  return Object.fromEntries(GROUP_IDS.map((group) => [group, value])) as Record<GroupId, number>;
}

/** The equipment a menu needs. */
function equipmentFor(menu: readonly MenuDish[]): EquipmentId[] {
  const needed = menu.map((dish) => DISH_TEMPLATES[dish.template].equipment);
  return [...new Set(needed.filter((item): item is EquipmentId => item !== null))];
}

function tablesFor(seats: number): number {
  return Math.floor(seats / balance.service.seatsPerTable);
}

export function createRivalRestaurant(id: RivalId): Restaurant {
  const rival = RIVALS[id];
  const averageWaiter: Staff = { skill: balance.staff.averageLevel, speed: balance.staff.averageLevel };
  return {
    id,
    name: rival.name,
    location: rival.location,
    menu: rival.menu.map((dish) => ({ ...dish })),
    equipment: equipmentFor(rival.menu),
    supplier: 'market',
    lunchSet: null,
    tables: tablesFor(rival.seats),
    chefs: Array.from({ length: rival.chefs }, () => ({ skill: rival.chefSkill, speed: rival.chefSpeed })),
    waiters: Array.from({ length: rival.waiters }, () => ({ ...averageWaiter })),
    ambiance: rival.ambiance,
    reputation: { ...rival.startingReputation },
    awareness: forEveryGroup(balance.rivals.awareness),
  };
}

/** The player's restaurant on day one. Menu and staff are chosen by the player (or a test strategy). */
export function createPlayerRestaurant(
  name: string,
  menu: readonly MenuDish[],
  chefs: readonly Staff[],
  waiters: readonly Staff[],
): Restaurant {
  const start = balance.start;
  return {
    id: 'player',
    name,
    location: start.location,
    menu: menu.map((dish) => ({ ...dish })),
    equipment: [...start.equipment],
    supplier: 'market',
    lunchSet: null,
    tables: tablesFor(start.seats),
    chefs: chefs.map((chef) => ({ ...chef })),
    waiters: waiters.map((waiter) => ({ ...waiter })),
    ambiance: start.ambiance,
    reputation: forEveryGroup(start.reputation),
    awareness: forEveryGroup(start.awareness),
  };
}
