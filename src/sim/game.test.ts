import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { runDay } from './day';
import { dailyWages } from './finance';
import { closeDay, newGame, openRestaurant, playerOf, playTick, starRating, tallyFor } from './game';

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
    expect(state.cash).toBe(balance.finance.startingCash);
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
    const { state, open } = playWholeDay(4);
    const inOneGo = runDay({ ...state.rng }, state.day, state.restaurants);
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
    expect(summary.wages).toBe(dailyWages(playerOf(state)));
    expect(summary.profit).toBeCloseTo(
      summary.revenue - summary.ingredientCost - summary.wages - summary.rent - summary.utilities,
    );
    expect(next.cash).toBeCloseTo(state.cash + summary.profit);
    expect(next.day).toBe(state.day + 1);
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
