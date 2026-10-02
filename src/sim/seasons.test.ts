import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { EXTRAS, type MenuDish } from '../data/dishes';
import { removeDish, toggleSpecial } from './actions';
import { nextDayOn } from './calendar';
import { specialAppeal } from './choice';
import { newGame, openRestaurant, playerOf, updateToday } from './game';
import { extraCost, freshOn, ingredientCostOf, inSeasonOn, recipeKey, seasonNews, specialOf } from './menu';
import { createRng } from './rng';
import { orderQuality, pickByAppeal } from './service';

const average = { skill: 3, speed: 3 };
const chanterelleSoup: MenuDish = { template: 'zurek', variant: 'classic', price: 28, extras: ['chanterelles'] };
const plainSoup: MenuDish = { template: 'zurek', variant: 'classic', price: 28 };

describe('fresh produce in season', () => {
  it('follows the summer: strawberries early in July, new potatoes in July, plums from mid-August', () => {
    const july8 = inSeasonOn(0);
    expect(july8).toEqual(expect.arrayContaining(['strawberries', 'newPotatoes', 'blueberries', 'chanterelles']));
    expect(july8).not.toContain('plums');
    expect(inSeasonOn(nextDayOn(7, 21, 0))).not.toContain('strawberries');
    expect(inSeasonOn(nextDayOn(8, 1, 0))).not.toContain('newPotatoes');
    expect(inSeasonOn(nextDayOn(8, 15, 0))).toContain('plums');
    expect(inSeasonOn(nextDayOn(8, 15, 0))).toContain('chanterelles');
  });

  it('tastes better in season, and costs more out of season', () => {
    const fresh = orderQuality([chanterelleSoup], average, 'market', ['chanterelles']);
    const notFresh = orderQuality([chanterelleSoup], average, 'market', []);
    expect(fresh - notFresh).toBe(balance.seasonal.freshQuality);
    expect(orderQuality([plainSoup], average, 'market', ['chanterelles'])).toBe(orderQuality([plainSoup], average));

    expect(extraCost('chanterelles', [])).toBe(EXTRAS.chanterelles.ingredientCost * balance.seasonal.outOfSeasonCost);
    expect(extraCost('chanterelles', ['chanterelles'])).toBe(EXTRAS.chanterelles.ingredientCost);
    // Things that keep all year cost the same whatever the season.
    expect(extraCost('dill', [])).toBe(EXTRAS.dill.ingredientCost);
    expect(ingredientCostOf(chanterelleSoup, 'market', [])).toBeGreaterThan(ingredientCostOf(chanterelleSoup, 'market', ['chanterelles']));
    expect(freshOn(chanterelleSoup, ['chanterelles'])).toEqual(['chanterelles']);
  });

  it('are in the morning news when they come in and when they go', () => {
    const lastStrawberries = nextDayOn(7, 20, 0);
    expect(seasonNews(lastStrawberries, lastStrawberries + 1).map((n) => n.title)).toEqual(['Out of season']);
    const firstPlums = nextDayOn(8, 15, 0);
    expect(seasonNews(firstPlums - 1, firstPlums)).toEqual([expect.objectContaining({ title: 'Fresh at the market' })]);
    expect(seasonNews(3, 4)).toEqual([]);
  });
});

describe('today’s special (“Dziś polecamy”)', () => {
  it('is chosen with the star, and the star again takes it off the board', () => {
    const state = newGame(1);
    const on = toggleSpecial(state, 2);
    expect(specialOf(playerOf(on))).toBe(playerOf(on).menu[2]);
    expect(playerOf(on).special).toBe(recipeKey(playerOf(state).menu[2]));
    expect(specialOf(playerOf(toggleSpecial(on, 2)))).toBeNull();
    // Choosing another dish moves the board to it; a dish taken off the menu leaves the board empty.
    expect(specialOf(playerOf(toggleSpecial(on, 3)))).toBe(playerOf(on).menu[3]);
    expect(specialOf(playerOf(removeDish(on, 2)))).toBeNull();
  });

  it('is ordered more often', () => {
    const menu: MenuDish[] = [plainSoup, { template: 'tomatoSoup', variant: 'noodles', price: 18 }];
    const count = (special: MenuDish | null) => {
      let picked = 0;
      for (let seed = 1; seed <= 400; seed++) if (pickByAppeal(createRng(seed), menu, 'locals', 'cloudy', special) === menu[1]) picked++;
      return picked;
    };
    expect(count(menu[1])).toBeGreaterThan(count(null) * 1.3);
  });

  it('makes the restaurant more tempting from the street, more so with something fresh on it', () => {
    const player = { ...playerOf(newGame(1)), menu: [chanterelleSoup, plainSoup] };
    expect(specialAppeal(player, ['chanterelles'])).toBe(0);
    const plain = specialAppeal({ ...player, special: recipeKey(plainSoup) }, ['chanterelles']);
    const fresh = specialAppeal({ ...player, special: recipeKey(chanterelleSoup) }, ['chanterelles']);
    expect(plain).toBe(balance.specials.appeal);
    expect(fresh).toBe(balance.specials.appeal + balance.specials.freshAppeal);
  });

  it('changes straight away during the day', () => {
    const state = newGame(1);
    const open = openRestaurant(state);
    updateToday(open, toggleSpecial(state, 1));
    expect(specialOf(open.progress.restaurants[0])).toBe(playerOf(state).menu[1]);
  });
});
