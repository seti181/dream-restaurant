import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { runDay } from './day';
import { closeDay, newGame, openRestaurant, playerOf, playTick, restingFloor, starRating, tallyFor, teamWages } from './game';

function playWholeDay(seed: number) {
  const state = newGame(seed);
  const open = openRestaurant(state);
  while (!open.progress.done) playTick(open);
  return { state, open };
}

describe('a new game', () => {
  it('starts on day 0 with the starting cash and all five restaurants', () => {
    const state = newGame(1);
    expect(state.day).toBe(0);
    expect(state.cash).toBe(balance.difficulty.normal.startingCash);
    expect(newGame(1, 'relaxed').cash).toBe(balance.difficulty.relaxed.startingCash);
    expect(state.restaurants).toHaveLength(5);
    expect(playerOf(state).name).toBe(balance.start.name);
    expect(playerOf(state).menu).toHaveLength(balance.start.menu.length);
  });

  it('is plain data that survives a save and load', () => {
    const state = newGame(1);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });

  it('rates the player from their reputation', () => {
    expect(starRating(playerOf(newGame(1)))).toBeCloseTo(balance.start.reputation / 20);
  });
});

describe('a day played tick by tick', () => {
  it('ends exactly as if it had been played in one go', () => {
    const state = newGame(4);
    const open = openRestaurant(state);
    const atOpening = structuredClone(open.progress.restaurants);
    while (!open.progress.done) playTick(open);
    const inOneGo = runDay({ ...state.rng }, state.day, atOpening, open.progress.conditions);
    expect(open.progress.outcomes).toEqual(inOneGo.outcomes);
    expect(open.progress.restaurants).toEqual(inOneGo.restaurants);
  });

  it('does not touch the game state while the day runs', () => {
    const state = newGame(5);
    const before = JSON.stringify(state);
    const open = openRestaurant(state);
    for (let i = 0; i < 50; i++) playTick(open);
    expect(JSON.stringify(state)).toBe(before);
  });
});

describe('closing the day', () => {
  it('adds the profit to cash and moves to the next day', () => {
    const { state, open } = playWholeDay(6);
    const { state: next, summary } = closeDay(state, open);
    const tally = tallyFor(open.progress.outcomes, 'player');
    expect(summary.revenue).toBe(tally.revenue);
    expect(summary.wages).toBe(teamWages(state));
    expect(summary.profit).toBeCloseTo(
      summary.revenue - summary.ingredientCost - summary.wages - summary.rent - summary.utilities,
    );
    expect(next.cash).toBeCloseTo(state.cash + summary.profit);
    expect(next.day).toBe(state.day + 1);
  });

  it('ends the game when the money runs out', () => {
    const { state, open } = playWholeDay(8);
    expect(closeDay(state, open).state.gameOver).toBe(false);
    const { state: broke } = closeDay({ ...state, cash: -1_000_000 }, open);
    expect(broke.gameOver).toBe(true);
  });

  it('charges rent on Monday but not on Tuesday', () => {
    const { state, open } = playWholeDay(7);
    const monday = closeDay(state, open);
    expect(monday.summary.rent).toBeGreaterThan(0);

    const tuesdayOpen = openRestaurant(monday.state);
    while (!tuesdayOpen.progress.done) playTick(tuesdayOpen);
    expect(closeDay(monday.state, tuesdayOpen).summary.rent).toBe(0);
  });
});

describe('the daily report', () => {
  it('adds up the groups, dishes and rivals', () => {
    const { state, open } = playWholeDay(8);
    const { summary } = closeDay(state, open);
    const groupServed = Object.values(summary.groups).reduce((sum, g) => sum + g.served, 0);
    const groupLost = Object.values(summary.groups).reduce((sum, g) => sum + g.lost, 0);
    expect(groupServed).toBe(summary.guestsServed);
    expect(groupLost).toBe(summary.guestsWalkedOut + summary.guestsTurnedAway);
    expect(summary.groups.locals.reputationAfter).toBe(open.progress.restaurants[0].reputation.locals);

    const portions = summary.dishesSold.reduce((sum, d) => sum + d.count, 0);
    expect(portions).toBeGreaterThanOrEqual(summary.guestsServed);
    const counts = summary.dishesSold.map((d) => d.count);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));

    expect(summary.rivals).toHaveLength(4);
    expect(summary.feedback).not.toBeNull();
  });
});

describe('the restaurant before opening', () => {
  it('shows the tables, the team and what was bought, with no guests yet', () => {
    const state = newGame(12);
    const floor = restingFloor(state);
    const player = playerOf(state);
    expect(floor.location).toBe(player.location);
    expect(floor.insideTables).toBe(player.tables);
    expect(floor.tables.every((t) => t === null)).toBe(true);
    expect(floor.chefsBusy).toHaveLength(player.chefs.length);
    expect(floor.waiters).toHaveLength(player.waiters.length);
    expect(floor.decor).toEqual(player.decor);
  });

  it('shows the terrace as soon as the permit is bought, even before it opens in May', () => {
    const april = { ...newGame(14), terracePermitUntilDay: 200 };
    const floor = restingFloor(april);
    expect(floor.terraceTables).toBeGreaterThan(0);
    expect(floor.tables).toHaveLength(floor.insideTables);
    expect(restingFloor(newGame(14)).terraceTables).toBe(0);
    expect(openRestaurant(april).terraceBuilt).toBe(floor.terraceTables);
  });

  it('includes the terrace on days it is open', () => {
    const june = { ...newGame(13), day: 62, weather: 'sunny' as const, terracePermitUntilDay: 200 };
    const floor = restingFloor(june);
    expect(floor.tables.length).toBeGreaterThan(floor.insideTables);
    expect(restingFloor({ ...june, weather: 'rain' }).tables).toHaveLength(floor.insideTables);
  });
});
