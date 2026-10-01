import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import * as actions from './actions';
import { runDay } from './day';
import {
  closeDay,
  dayBreakdown,
  happyHourToday,
  newGame,
  openRestaurant,
  playerOf,
  playTick,
  restingFloor,
  starRating,
  startHappyHour,
  tallyFor,
  teamWages,
  updateToday,
} from './game';

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
    // Without a terrace, so no gulls (they come on top of the day itself).
    const state = { ...newGame(4), terracePermitUntilDay: null };
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

  it('opens the terrace from the first day once the permit is bought, and draws it even when it rains', () => {
    const permit = { ...actions.buyTerracePermit(newGame(14)), weather: 'sunny' as const };
    expect(restingFloor(permit).tables.length).toBeGreaterThan(restingFloor(permit).insideTables);
    const rainy = { ...permit, weather: 'rain' as const };
    const floor = restingFloor(rainy);
    expect(floor.terraceTables).toBeGreaterThan(0);
    expect(floor.tables).toHaveLength(floor.insideTables);
    expect(restingFloor({ ...newGame(14), terracePermitUntilDay: null }).terraceTables).toBe(0);
    expect(openRestaurant(rainy).terraceBuilt).toBe(floor.terraceTables);
  });

  it('includes the terrace on days it is open', () => {
    const june = { ...newGame(13), day: 62, weather: 'sunny' as const, terracePermitUntilDay: 200 };
    const floor = restingFloor(june);
    expect(floor.tables.length).toBeGreaterThan(floor.insideTables);
    expect(restingFloor({ ...june, weather: 'rain' }).tables).toHaveLength(floor.insideTables);
  });
});

describe('the live happy hour', () => {
  it('starts when the player taps it, once a day, and lasts an hour', () => {
    const state = newGame(40);
    const open = openRestaurant(state);
    expect(happyHourToday(open)).toBeNull();
    while (open.progress.tick < 30) playTick(open);
    expect(startHappyHour(open)).toBe(true);
    const hour = happyHourToday(open)!;
    expect(hour.until - hour.from).toBe(balance.happyHour.minutes);
    expect(startHappyHour(open)).toBe(false);
    while (!open.progress.done) playTick(open);
    const { state: next, summary } = closeDay(state, open);
    expect(summary.happyHour).toEqual(hour);
    // Tomorrow starts without one.
    expect(playerOf(next).happyHourFrom).toBeUndefined();
    expect(happyHourToday(openRestaurant(next))).toBeNull();
  });
});

describe('changes made during the day', () => {
  it('keep purchases made during the day, and the day’s effect on reputation', () => {
    const state = { ...newGame(43), cash: 1e6 };
    const open = openRestaurant(state);
    for (let i = 0; i < 40; i++) playTick(open);
    // A table bought at lunchtime: paid now, there tomorrow.
    const bought = actions.buyTable(state);
    while (!open.progress.done) playTick(open);
    const { state: next } = closeDay(bought, open);
    expect(playerOf(next).tables).toBe(playerOf(state).tables + 1);
    expect(next.cash).toBeLessThan(state.cash);
    expect(playerOf(next).reputation).toEqual(open.progress.restaurants[0].reputation);
  });

  it('pays the morning’s team; someone hired at lunchtime starts tomorrow', () => {
    const state = newGame(44);
    const open = openRestaurant(state);
    while (!open.progress.done) playTick(open);
    const hired = actions.hire({ ...state, cash: 1e6 }, state.candidates[0].id);
    const { summary } = closeDay(hired, open);
    expect(summary.wages).toBe(teamWages(state));
  });

  it('brings a new menu into today’s kitchen straight away', () => {
    const state = newGame(45);
    const open = openRestaurant(state);
    const cheaper = actions.setDishPrice(state, 0, 5);
    updateToday(open, cheaper);
    expect(open.progress.restaurants[0].menu[0].price).toBe(5);
  });
});

describe('the day broken down', () => {
  it('adds up to the day’s numbers: guests by group, and takings by dish', () => {
    const state = newGame(46);
    const open = openRestaurant(state);
    while (!open.progress.done) playTick(open);
    const tally = tallyFor(open.progress.outcomes, 'player');
    const parts = dayBreakdown(open.progress.outcomes, 'player');
    const sum = (counts: Record<string, number | undefined>) => Object.values(counts).reduce((a, n) => a! + (n ?? 0), 0);
    expect(sum(parts.served)).toBe(tally.guestsServed);
    expect(sum(parts.walkedOut)).toBe(tally.guestsWalkedOut);
    expect(sum(parts.turnedAway)).toBe(tally.guestsTurnedAway);
    expect(parts.dishes.reduce((a, d) => a + d.revenue, 0)).toBeCloseTo(tally.revenue);
    // Best sellers first.
    parts.dishes.forEach((d, i) => i > 0 && expect(d.revenue).toBeLessThanOrEqual(parts.dishes[i - 1].revenue));
  });
});
