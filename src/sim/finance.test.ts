import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { dailyWages, wageOf, weeklyBillsDue } from './finance';
import { isFairDay, neptuneScore } from './neptune';
import { createPlayerRestaurant } from './setup';

const average = { skill: 3, speed: 3 };

describe('wages', () => {
  it('pays average staff the base wage and better staff more', () => {
    expect(wageOf('chef', average)).toBe(balance.staff.chefWage);
    expect(wageOf('waiter', average)).toBe(balance.staff.waiterWage);
    expect(wageOf('chef', { skill: 5, speed: 4 })).toBeGreaterThan(balance.staff.chefWage);
    expect(wageOf('chef', { skill: 1, speed: 2 })).toBeLessThan(balance.staff.chefWage);
  });

  it('adds up the whole team', () => {
    const restaurant = createPlayerRestaurant('Test', [], [average, average], [average]);
    expect(dailyWages(restaurant)).toBe(2 * balance.staff.chefWage + balance.staff.waiterWage);
  });
});

describe('weekly bills', () => {
  it('charges a week of rent and utilities on Mondays only', () => {
    const restaurant = createPlayerRestaurant('Test', [], [], []);
    expect(weeklyBillsDue(restaurant, 0)).toEqual({ rent: 300 * 7, utilities: balance.finance.weeklyUtilities });
    expect(weeklyBillsDue(restaurant, 1)).toEqual({ rent: 0, utilities: 0 });
    expect(weeklyBillsDue(restaurant, 7).rent).toBe(300 * 7);
  });
});

describe('Golden Neptune', () => {
  it('runs the Fair from Saturday 27 July to the last day of the season', () => {
    expect(isFairDay(116)).toBe(false); // Friday 26 July
    expect(isFairDay(117)).toBe(true); // Saturday 27 July
    expect(isFairDay(139)).toBe(true); // Sunday 18 August
    expect(isFairDay(140)).toBe(false); // free play
  });

  it('weighs rating 60% and Fair share 40%', () => {
    expect(neptuneScore(100, 1)).toBeCloseTo(100);
    expect(neptuneScore(50, 0)).toBeCloseTo(30);
    expect(neptuneScore(0, 0.5)).toBeCloseTo(20);
  });
});
