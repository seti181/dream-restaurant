import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import type { MenuDish } from '../data/dishes';
import { RIVAL_IDS } from '../data/rivals';
import { minuteOfDay } from './clock';
import { hurryState, hurryStaff, seat, startDay, stepDay, type DayInProgress } from './day';
import { ORDINARY_DAY } from './events';
import { closeDay, newGame, openRestaurant, playTick } from './game';
import { createRng } from './rng';
import { rushAt, rushName, streakTipPerGuest } from './rush';
import { createPlayerRestaurant, createRivalRestaurant } from './setup';
import type { Staff } from './types';

const average: Staff = { skill: 3, speed: 3, look: 1 };
const menu: MenuDish[] = [
  { template: 'pierogi', variant: 'ruskie', price: 36 },
  { template: 'schabowy', variant: 'cabbage', price: 44 },
];
const lunch = balance.rush.windows[0];

/** A quiet day (nobody walks in by themselves), played until the given minute is on screen. */
function dayAt(minute: number): DayInProgress {
  const restaurants = [
    createPlayerRestaurant('Test Kitchen', menu, [average], [{ skill: 3, speed: 3, look: 2 }]),
    ...RIVAL_IDS.map(createRivalRestaurant),
  ];
  const progress = startDay(2, restaurants, { ...ORDINARY_DAY, traffic: 0 });
  while (minuteOfDay(progress.tick - 1) < minute) stepDay(createRng(1), progress);
  return progress;
}

/** Seats a party of four and plays until their food is ready: how long the kitchen took. */
function cookingMinutes(progress: DayInProgress): number {
  seat(createRng(2), progress, 0, { group: 'locals', size: 4, origin: 'ogarna', arrivalMinute: 0 }, minuteOfDay(progress.tick));
  const visit = progress.floors[0].visits.at(-1)!;
  while (visit.readyAt === null) stepDay(createRng(3), progress);
  return visit.readyAt - Math.max(visit.orderedAt, minuteOfDay(progress.tick - 1));
}

describe('rush hours', () => {
  it('come at lunch and dinner', () => {
    expect(rushAt(lunch.from)).toBe(0);
    expect(rushName(13 * 60)).toBe('Lunch rush');
    expect(rushAt(16 * 60)).toBeNull();
    expect(rushName(19 * 60)).toBe('Dinner rush');
  });

  it('let the player hurry a chef once a rush, who then cooks faster', () => {
    const calm = cookingMinutes(dayAt(lunch.from));
    const progress = dayAt(lunch.from);
    expect(hurryState(progress, 0, 'chef', 0)).toBe('ready');
    expect(hurryStaff(progress, 0, 'chef', 0)).toBe(true);
    expect(hurryStaff(progress, 0, 'chef', 0)).toBe(false);
    expect(hurryState(progress, 0, 'chef', 0)).toBe('hurrying');
    expect(cookingMinutes(progress)).toBeLessThan(calm);
  });

  it('give a hurried chef a breather afterwards, when they start nothing new', () => {
    const progress = dayAt(lunch.from);
    hurryStaff(progress, 0, 'chef', 0);
    const breather = lunch.from + balance.rush.hurryMinutes;
    while (minuteOfDay(progress.tick - 1) < breather) stepDay(createRng(1), progress);
    expect(hurryState(progress, 0, 'chef', 0)).toBe('resting');
    seat(createRng(2), progress, 0, { group: 'locals', size: 2, origin: 'ogarna', arrivalMinute: 0 }, minuteOfDay(progress.tick));
    const visit = progress.floors[0].visits.at(-1)!;
    while (visit.readyAt === null) stepDay(createRng(3), progress);
    expect(visit.readyAt).toBeGreaterThan(breather + balance.rush.restMinutes);
  });

  it('send a hurried waiter off the floor for a breather once the spurt is over', () => {
    const progress = dayAt(lunch.from);
    expect(hurryStaff(progress, 0, 'waiter', 0)).toBe(true);
    expect(progress.restaurants[0].waiters[0].speed).toBe(3 + balance.rush.waiterSpeedBonus);
    while (minuteOfDay(progress.tick - 1) < lunch.from + balance.rush.hurryMinutes) stepDay(createRng(1), progress);
    expect(progress.restaurants[0].waiters).toHaveLength(0);
    while (minuteOfDay(progress.tick - 1) < lunch.from + balance.rush.hurryMinutes + balance.rush.restMinutes) {
      stepDay(createRng(1), progress);
    }
    expect(progress.restaurants[0].waiters).toEqual([{ skill: 3, speed: 3, look: 2 }]);
  });

  it('can’t be used outside the rushes', () => {
    const progress = dayAt(16 * 60);
    expect(hurryState(progress, 0, 'chef', 0)).toBe('none');
    expect(hurryStaff(progress, 0, 'chef', 0)).toBe(false);
  });
});

describe('the quick-service streak', () => {
  it('tips from five quick tables in a row, and more from ten', () => {
    expect(streakTipPerGuest(4)).toBe(0);
    expect(streakTipPerGuest(5)).toBe(balance.rush.streakTips[0].tipPerGuest);
    expect(streakTipPerGuest(12)).toBe(balance.rush.streakTips[1].tipPerGuest);
    expect(streakTipPerGuest(12)).toBeGreaterThan(streakTipPerGuest(5));
  });

  it('reaches the day report and the till', () => {
    const state = newGame(8);
    const open = openRestaurant(state);
    while (!open.progress.done) playTick(open);
    const { summary } = closeDay(state, open);
    expect(summary.rush.bestStreak).toBe(open.progress.floors[0].streak.best);
    expect(summary.rush.tips).toBe(open.progress.floors[0].streak.tips);
    if (summary.rush.bestStreak < 5) expect(summary.rush.tips).toBe(0);
  });
});
