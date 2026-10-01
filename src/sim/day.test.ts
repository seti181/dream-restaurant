import { describe, expect, it } from 'vitest';
import type { MenuDish } from '../data/dishes';
import { RIVAL_IDS } from '../data/rivals';
import { floorView, runDay, startDay, stepDay } from './day';
import { newGame, playerOf } from './game';
import { createRng } from './rng';
import { createPlayerRestaurant, createRivalRestaurant } from './setup';
import type { PartyOutcome, Staff } from './types';

const average: Staff = { skill: 3, speed: 3 };
const starterMenu: MenuDish[] = [
  { template: 'zurek', variant: 'classic', price: 28 },
  { template: 'tomatoSoup', variant: 'noodles', price: 18 },
  { template: 'pierogi', variant: 'ruskie', price: 36 },
  { template: 'schabowy', variant: 'cabbage', price: 44 },
  { template: 'golabki', variant: 'tomato', price: 38 },
  { template: 'kompot', variant: 'strawberry', price: 9 },
];

function oldTown(menu = starterMenu, chefs = [average], waiters = [average]) {
  return [createPlayerRestaurant('Test Kitchen', menu, chefs, waiters), ...RIVAL_IDS.map(createRivalRestaurant)];
}

const forRestaurant = (outcomes: PartyOutcome[], id: string) => outcomes.filter((o) => o.restaurant === id);

describe('a full day', () => {
  it('plays out the same way from the same seed', () => {
    const first = runDay(createRng(3), 2, oldTown());
    const second = runDay(createRng(3), 2, oldTown());
    expect(second).toEqual(first);
  });

  it('serves guests everywhere and earns money', () => {
    const { outcomes } = runDay(createRng(5), 2, oldTown());
    for (const id of ['player', ...RIVAL_IDS]) {
      const served = forRestaurant(outcomes, id).filter((o) => o.kind === 'served');
      expect(served.length, id).toBeGreaterThan(0);
      expect(served.every((o) => o.revenue > o.ingredientCost)).toBe(true);
    }
  });

  it('gives every served party a satisfaction score from 0 to 100', () => {
    const { outcomes } = runDay(createRng(6), 2, oldTown());
    for (const o of outcomes.filter((o) => o.kind === 'served')) {
      expect(o.satisfaction).toBeGreaterThanOrEqual(0);
      expect(o.satisfaction).toBeLessThanOrEqual(100);
    }
  });

  it('sends nobody to a restaurant with an empty menu', () => {
    const { outcomes } = runDay(createRng(7), 2, oldTown([]));
    expect(forRestaurant(outcomes, 'player')).toHaveLength(0);
  });

  it('makes guests walk out of a painfully slow kitchen', () => {
    const slowChef: Staff = { skill: 3, speed: 1 };
    const { outcomes } = runDay(createRng(8), 5, oldTown(starterMenu, [slowChef]));
    const walkedOut = forRestaurant(outcomes, 'player').filter((o) => o.kind === 'walkedOut');
    expect(walkedOut.length).toBeGreaterThan(0);
  });

  it('never cooks for a table that walks out before the food is ready', () => {
    const slowChef: Staff = { skill: 3, speed: 1 };
    const { outcomes } = runDay(createRng(8), 5, oldTown(starterMenu, [slowChef]));
    const walkedOut = forRestaurant(outcomes, 'player').filter((o) => o.kind === 'walkedOut');
    expect(walkedOut.length).toBeGreaterThan(0);
    expect(walkedOut.every((o) => o.ingredientCost === 0)).toBe(true);
  });

  it('does not change the restaurants it was given', () => {
    const restaurants = oldTown();
    const before = JSON.stringify(restaurants);
    runDay(createRng(9), 2, restaurants);
    expect(JSON.stringify(restaurants)).toBe(before);
  });

  it('moves reputation after a day of service', () => {
    const restaurants = oldTown();
    const { restaurants: after } = runDay(createRng(10), 2, restaurants);
    expect(after[0].reputation).not.toEqual(restaurants[0].reputation);
  });
});

describe('the restaurant view', () => {
  it('seats every party at its own tables, never two parties at one table', () => {
    const state = newGame(31);
    const progress = startDay(state.day, state.restaurants);
    const rng = createRng(31);
    let sawGuests = false;
    while (!progress.done) {
      stepDay(rng, progress);
      const view = floorView(progress, 0);
      expect(view.tables).toHaveLength(view.insideTables + playerOf(state).terraceTables);
      const seated = view.tables.filter((t) => t !== null);
      if (seated.length > 0) sawGuests = true;
      for (const table of seated) {
        expect(table!.seated).toBeGreaterThan(0);
        expect(table!.seated).toBeLessThanOrEqual(4);
        expect(table!.impatience).toBeGreaterThanOrEqual(0);
        expect(table!.impatience).toBeLessThanOrEqual(1);
        if (table!.stage === 'eating') expect(table!.satisfaction).not.toBeNull();
      }
      expect(view.chefsBusy).toHaveLength(playerOf(state).chefs.length);
    }
    expect(sawGuests).toBe(true);
    // At closing time everyone has gone home.
    expect(floorView(progress, 0).tables.every((t) => t === null)).toBe(true);
  });
});
