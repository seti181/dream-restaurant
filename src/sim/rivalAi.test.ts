import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { RIVALS } from '../data/rivals';
import { newGame, type GameState } from './game';
import { recipeKey } from './menu';
import { favouriteGroups, planRivalWeek, rivalAwarenessToday } from './rivalAi';
import { createRng } from './rng';

const MONDAY_IN_JUNE = 63;

/** A game where last week each rival served `served` of each of its favourite groups. */
function afterAWeek(changes: Partial<GameState> = {}, served = 100): GameState {
  const state = newGame(1);
  const week: GameState['week'] = { served: {}, turnedAway: {} };
  for (const rival of state.restaurants.slice(1)) {
    const favourites = favouriteGroups(rival.id as keyof typeof RIVALS);
    week.served[rival.id] = Object.fromEntries(favourites.map((g) => [g, served]));
  }
  return { ...state, week, ...changes };
}

describe('the rivals’ week', () => {
  it('makes one move per rival, each with a line of news', () => {
    const { restaurants, news } = planRivalWeek(afterAWeek(), createRng(1));
    expect(restaurants).toHaveLength(5);
    expect(news).toHaveLength(4);
    expect(news.every((line) => line.length > 20 && !line.includes('{dish}'))).toBe(true);
  });

  it('leaves the player’s restaurant alone', () => {
    const state = afterAWeek();
    expect(planRivalWeek(state, createRng(2)).restaurants[0]).toBe(state.restaurants[0]);
  });

  it('reacts with lower prices when the player wins over its favourite guests', () => {
    const state = afterAWeek();
    const nonnasFavourites = favouriteGroups('nonnaRosa');
    state.week.served.player = Object.fromEntries(nonnasFavourites.map((g) => [g, 80]));
    const { restaurants, news } = planRivalWeek(state, createRng(3));
    const before = state.restaurants[1];
    const after = restaurants[1];
    expect(RIVALS.nonnaRosa.lines.reactToPlayer).toContain(news[0]);
    expect(after.menu[0].price).toBeLessThan(before.menu[0].price);
  });

  it('adds a table when it had to turn many guests away', () => {
    const state = afterAWeek();
    const blyskawica = state.restaurants[2];
    state.restaurants[2] = { ...blyskawica, tables: 8 };
    state.week.turnedAway.blyskawica = 100;
    const { restaurants, news } = planRivalWeek(state, createRng(4));
    expect(restaurants[2].tables).toBe(9);
    expect(RIVALS.blyskawica.lines.upgrade).toContain(news[1]);
  });

  it('adds its seasonal dishes as the months go by', () => {
    const rng = createRng(5);
    let state = afterAWeek({ day: MONDAY_IN_JUNE });
    for (let week = 0; week < 12; week++) {
      state = { ...state, restaurants: planRivalWeek(state, rng).restaurants };
    }
    const nonna = state.restaurants[1];
    const menu = new Set(nonna.menu.map(recipeKey));
    for (const { dish } of RIVALS.nonnaRosa.seasonalDishes) expect(menu.has(recipeKey(dish))).toBe(true);
    expect(nonna.equipment).toContain('dessertDisplay');
  });

  it('keeps prices within bounds however long it goes on', () => {
    const rng = createRng(6);
    let state = afterAWeek();
    state.week.served.player = { tourists: 1000, students: 1000, locals: 1000, office: 1000, foodies: 1000 };
    for (let week = 0; week < 30; week++) state = { ...state, restaurants: planRivalWeek(state, rng).restaurants };
    for (const rival of state.restaurants.slice(1)) {
      const original = new Map(RIVALS[rival.id as keyof typeof RIVALS].menu.map((d) => [recipeKey(d), d.price]));
      for (const dish of rival.menu) {
        const base = original.get(recipeKey(dish));
        if (base) expect(dish.price).toBeGreaterThanOrEqual(Math.round(base * balance.rivals.minPriceFactor) - 1);
      }
    }
  });

  it('lets promotions wear off', () => {
    const rival = { ...newGame(1).restaurants[1] };
    rival.awareness = { ...rival.awareness, foodies: 90 };
    expect(rivalAwarenessToday(rival).foodies).toBeLessThan(90);
    expect(rivalAwarenessToday(rival).foodies).toBeGreaterThan(balance.rivals.awareness);
  });
});

describe('difficulty', () => {
  it('makes Relaxed rivals slower to react to the player', () => {
    const nonnasFavourites = favouriteGroups('nonnaRosa');
    const threat = (difficulty: 'relaxed' | 'normal') => {
      const state = afterAWeek({ difficulty });
      state.week.served.player = Object.fromEntries(nonnasFavourites.map((g) => [g, 45]));
      return planRivalWeek(state, createRng(9)).news[0];
    };
    expect(RIVALS.nonnaRosa.lines.reactToPlayer).toContain(threat('normal'));
    expect(RIVALS.nonnaRosa.lines.reactToPlayer).not.toContain(threat('relaxed'));
  });
});
