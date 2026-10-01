import { describe, expect, it } from 'vitest';
import type { MenuDish } from '../data/dishes';
import { RIVAL_IDS } from '../data/rivals';
import { balance } from '../data/balance';
import type { GroupId } from '../data/groups';
import { utility } from './choice';
import { floorView, runDay, seat, startDay, stepDay } from './day';
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

describe('the queue at the door', () => {
  /** A restaurant with every table taken by a party that has just sat down. */
  function fullHouse() {
    const progress = startDay(2, oldTown());
    const player = progress.restaurants[0];
    const floor = progress.floors[0];
    for (let t = 0; t < player.tables; t++) {
      seat(createRng(t), progress, 0, { group: 'locals', size: 4, origin: player.location, arrivalMinute: 660, bookedAt: 'player' }, 660);
    }
    expect(floor.freeTables).toBe(0);
    return { progress, floor };
  }
  /** People walking up to the door, without a booking. */
  const party = (group: GroupId) => ({ group, size: 2, origin: 'ogarna' as const, arrivalMinute: 660 });

  it('lets a few parties wait for a table, and turns the rest away', () => {
    const { progress, floor } = fullHouse();
    for (let i = 0; i < balance.service.doorQueueMax + 2; i++) seat(createRng(i), progress, 0, party('tourists'), 660);
    expect(floor.door).toHaveLength(balance.service.doorQueueMax);
    expect(progress.outcomes.filter((o) => o.kind === 'noTable')).toHaveLength(2);
    expect(floorView(progress, 0).atTheDoor).toHaveLength(balance.service.doorQueueMax);
  });

  it('seats the first in line as soon as a table frees up', () => {
    const { progress, floor } = fullHouse();
    const waiting = party('students');
    seat(createRng(1), progress, 0, waiting, 660);
    // A table frees up.
    floor.visits[0].eating = true;
    floor.visits[0].leaveAt = 665;
    while (floor.door.length > 0 && progress.tick < 3) stepDay(createRng(2), progress);
    expect(floor.door).toHaveLength(0);
    expect(floor.visits.some((v) => v.party === waiting)).toBe(true);
  });

  it('sends people elsewhere if they wait too long', () => {
    const { progress, floor } = fullHouse();
    seat(createRng(1), progress, 0, party('office'), 660);
    for (const visit of floor.visits) visit.leaveAt = 9999;
    for (let i = 0; i * balance.clock.tickMinutes <= balance.service.doorWaitMinutes; i++) stepDay(createRng(i), progress);
    expect(floor.door).toHaveLength(0);
    expect(progress.outcomes.some((o) => o.restaurant === 'player' && o.kind === 'noTable' && o.group === 'office')).toBe(true);
  });

  it('puts guests who booked at the front of the queue, and they wait longer', () => {
    const { progress, floor } = fullHouse();
    for (let i = 0; i < balance.service.doorQueueMax; i++) seat(createRng(i), progress, 0, party('tourists'), 660);
    const critic = { ...party('foodies'), bookedAt: 'player', critic: true };
    seat(createRng(9), progress, 0, critic, 660);
    expect(floor.door[0].party).toBe(critic);
    for (const visit of floor.visits) visit.leaveAt = 9999;
    for (let i = 0; i * balance.clock.tickMinutes <= balance.service.doorWaitMinutes; i++) stepDay(createRng(i), progress);
    // The walk-ups have given up; the critic is still waiting for the next table.
    expect(floor.door.map((w) => w.party)).toEqual([critic]);
  });

  it('a full restaurant with a queue looks much less tempting', () => {
    const restaurant = oldTown()[0];
    const p = { group: 'locals' as const, size: 2, origin: restaurant.location, arrivalMinute: 700 };
    expect(utility(restaurant, p, 10, true)! - utility(restaurant, p, 10, false)!).toBeCloseTo(-balance.choice.fullPenalty);
  });

  it('keeps turned-away guests to a sensible number on a busy day', () => {
    const { outcomes } = runDay(createRng(8), 75, oldTown());
    const player = forRestaurant(outcomes, 'player');
    const count = (kind: PartyOutcome['kind']) => player.filter((o) => o.kind === kind).reduce((sum, o) => sum + o.size, 0);
    expect(count('noTable')).toBeLessThan(count('served'));
  });
});
