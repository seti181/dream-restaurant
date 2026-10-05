import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { GROUP_IDS } from '../data/groups';
import { MOMENT_IDS, MOMENTS } from '../data/moments';
import { RANKS } from '../data/ranks';
import { upgradeMenuBoard } from './actions';
import { closeDay, newGame, openRestaurant, playerOf, playTick, type GameState } from './game';
import { checkNeed } from './moments';
import { KNOWN_PLACE_RANK, maxMenuSlots, rankFor, TOP_RANK, totalGuests } from './ranks';

const [, bistro, restaurant, favourite] = RANKS;

describe('restaurant ranks', () => {
  it('go up with enough guests and stars together, and never down', () => {
    expect(rankFor(0, bistro.guests, bistro.stars)).toBe(1);
    expect(rankFor(0, bistro.guests - 1, 5)).toBe(0);
    expect(rankFor(0, 1_000_000, bistro.stars - 0.01)).toBe(0);
    // Two ranks at once, if both are met.
    expect(rankFor(0, restaurant.guests, restaurant.stars)).toBe(2);
    expect(rankFor(3, 0, 1)).toBe(3);
    expect(rankFor(0, favourite.guests, 5)).toBe(TOP_RANK);
  });

  it('get harder each time', () => {
    for (let r = 1; r < RANKS.length; r++) {
      expect(RANKS[r].guests).toBeGreaterThan(RANKS[r - 1].guests);
      expect(RANKS[r].stars).toBeGreaterThan(RANKS[r - 1].stars);
    }
  });

  it('make room for one more dish than the biggest menu board, from Bistro', () => {
    expect(maxMenuSlots(0)).toBe(balance.menu.maxSlots);
    expect(maxMenuSlots(1)).toBe(balance.menu.maxSlots + 1);
    const full: GameState = { ...newGame(1), menuSlots: balance.menu.maxSlots, cash: 100_000 };
    expect(upgradeMenuBoard(full)).toBe(full);
    expect(upgradeMenuBoard({ ...full, menuSlots: balance.menu.maxSlots - 1, rank: 1 }).menuSlots).toBe(balance.menu.maxSlots + 1);
  });

  it('let bigger names come calling once the restaurant is a Restaurant', () => {
    const cards = MOMENT_IDS.filter((id) => MOMENTS[id].needs.includes('knownPlace'));
    expect(cards.length).toBe(3);
    const open = openRestaurant(newGame(2));
    expect(checkNeed({ ...open, rank: KNOWN_PLACE_RANK - 1 }, 'knownPlace')).toBe(false);
    expect(checkNeed({ ...open, rank: KNOWN_PLACE_RANK }, 'knownPlace')).toBe(true);
  });
});

describe('ranking up at the end of a day', () => {
  /** A game that has served nearly enough guests for a rank, with the stars for it. */
  function nearly(rank: number): GameState {
    const start = newGame(3);
    const [player, ...rivals] = start.restaurants;
    const reputation = Object.fromEntries(GROUP_IDS.map((g) => [g, 90])) as typeof player.reputation;
    return {
      ...start,
      rank: rank - 1,
      guestsServed: { tourists: RANKS[rank].guests - 1 },
      restaurants: [{ ...player, reputation }, ...rivals],
    };
  }
  const play = (state: GameState) => {
    const open = openRestaurant(state);
    while (!open.progress.done) playTick(open);
    return closeDay(state, open);
  };

  it('counts every guest served, and ranks up with what the rank unlocks', () => {
    const start = nearly(1);
    const { state, summary } = play(start);
    expect(totalGuests(state.guestsServed)).toBe(totalGuests(start.guestsServed) + summary.guestsServed);
    expect(summary.rankUp).toBe(1);
    expect(state.rank).toBe(1);
    expect(state.menuSlots).toBe(start.menuSlots + 1);
    // The next day it's still a Bistro, and nothing more happens.
    expect(play(state).summary.rankUp).toBeNull();
  });

  it('spreads the word at the top', () => {
    const start = nearly(TOP_RANK);
    const { state, summary } = play(start);
    expect(summary.rankUp).toBe(TOP_RANK);
    const without = play({ ...start, guestsServed: {} }).state;
    for (const g of GROUP_IDS) {
      expect(playerOf(state).awareness[g]).toBeCloseTo(Math.min(100, playerOf(without).awareness[g] + favourite.awareness!));
    }
  });
});
