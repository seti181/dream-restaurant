import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import type { MenuDish } from '../data/dishes';
import { templateOf } from './menu';
import { createRng } from './rng';
import {
  averageLevel,
  chooseOrder,
  expectedWait,
  menuSlowdown,
  orderMinutes,
  orderQuality,
  prepMinutes,
  tablesNeeded,
} from './service';
import { createPlayerRestaurant } from './setup';
import type { Staff } from './types';

const average: Staff = { skill: 3, speed: 3 };
const pierogi: MenuDish = { template: 'pierogi', variant: 'ruskie', price: 36 };
const soup: MenuDish = { template: 'tomatoSoup', variant: 'noodles', price: 18 };
const kompot: MenuDish = { template: 'kompot', variant: 'strawberry', price: 9 };

describe('tables', () => {
  it('seats up to four guests per table', () => {
    expect(tablesNeeded(1)).toBe(1);
    expect(tablesNeeded(4)).toBe(1);
    expect(tablesNeeded(5)).toBe(2);
  });
});

describe('staff levels', () => {
  it('averages the team, and treats an empty team as the weakest level', () => {
    expect(averageLevel([{ skill: 2, speed: 5 }, { skill: 4, speed: 3 }], 'skill')).toBe(3);
    expect(averageLevel([], 'speed')).toBe(1);
  });
});

describe('kitchen', () => {
  it('takes a dish’s base time with an average chef', () => {
    expect(prepMinutes([pierogi], average, 6)).toBeCloseTo(templateOf(pierogi).prepMinutes);
  });

  it('adds a little time for each extra portion, not a whole dish', () => {
    const one = prepMinutes([pierogi], average, 6);
    const four = prepMinutes([pierogi, pierogi, pierogi, pierogi], average, 6);
    expect(four - one).toBeCloseTo(3 * balance.kitchen.extraPortionMinutes);
  });

  it('cooks twice as fast with a chef twice as quick', () => {
    const fast: Staff = { skill: 3, speed: 6 };
    expect(prepMinutes([pierogi], fast, 6)).toBeCloseTo(prepMinutes([pierogi], average, 6) / 2);
  });

  it('slows down a little for menus above the base size', () => {
    expect(menuSlowdown(6)).toBe(1);
    expect(menuSlowdown(12)).toBeCloseTo(1 + 6 * balance.kitchen.slowdownPerExtraDish);
    expect(prepMinutes([pierogi], average, 12)).toBeGreaterThan(prepMinutes([pierogi], average, 6));
  });

  it('cooks better food with a more skilled chef, within 0–100', () => {
    const base = templateOf(pierogi).baseQuality;
    expect(orderQuality([pierogi], average)).toBe(base);
    expect(orderQuality([pierogi], { skill: 5, speed: 3 })).toBe(base + 2 * balance.kitchen.qualityPerSkillPoint);
    expect(orderQuality([pierogi], { skill: 100, speed: 3 })).toBe(100);
  });
});

describe('waiters', () => {
  const restaurant = (waiters: Staff[]) => createPlayerRestaurant('Test', [pierogi], [average], waiters);

  it('take orders at the base speed when not overloaded', () => {
    expect(orderMinutes(restaurant([average]), 2)).toBeCloseTo(balance.service.orderMinutes);
  });

  it('slow down when they have too many tables', () => {
    const overloaded = balance.service.tablesPerWaiter * 2;
    expect(orderMinutes(restaurant([average]), overloaded)).toBeCloseTo(balance.service.orderMinutes * 2);
    expect(orderMinutes(restaurant([average, average]), overloaded)).toBeCloseTo(balance.service.orderMinutes);
  });

  it('are very slow when nobody is serving', () => {
    expect(orderMinutes(restaurant([]), 1)).toBeGreaterThan(orderMinutes(restaurant([average]), 1));
  });
});

describe('expected wait', () => {
  it('grows with the queue and is endless with no chef', () => {
    const open = createPlayerRestaurant('Test', [pierogi], [average], [average]);
    expect(expectedWait(open, 0, 4)).toBeGreaterThan(expectedWait(open, 0, 0));
    const noChef = createPlayerRestaurant('Test', [pierogi], [], [average]);
    expect(expectedWait(noChef, 0, 0)).toBe(Infinity);
  });
});

describe('ordering', () => {
  const party = { group: 'locals' as const, size: 3, origin: 'ogarna' as const, arrivalMinute: 720 };

  it('gives every guest exactly one soup or main', () => {
    const rng = createRng(2);
    for (let i = 0; i < 50; i++) {
      const order = chooseOrder(rng, [pierogi, soup, kompot], party);
      const food = order.filter((dish) => dish !== kompot);
      expect(food).toHaveLength(party.size);
    }
  });

  it('only orders drinks and desserts that are on the menu', () => {
    const rng = createRng(3);
    for (let i = 0; i < 50; i++) {
      const order = chooseOrder(rng, [pierogi, soup], party);
      expect(order.every((dish) => dish === pierogi || dish === soup)).toBe(true);
    }
  });
});
