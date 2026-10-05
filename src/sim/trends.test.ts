import { describe, expect, it } from 'vitest';
import type { MenuDish } from '../data/dishes';
import { TREND_IDS, TRENDS } from '../data/trends';
import { dishAppeal, utility } from './choice';
import { conditionsFor } from './events';
import { closeDay, newGame, openRestaurant, playerOf, playTick, type GameState } from './game';
import { rollTrend, trendOn } from './trends';

const fishSoup: MenuDish = { template: 'fishSoup', variant: 'classic', price: 30 };
const pierogi: MenuDish = { template: 'pierogi', variant: 'ruskie', price: 36 };
const seafood = { group: 'locals' as const, wants: TRENDS.seafood.wants };

describe('weekly trends', () => {
  it('last a week from Monday, and never repeat last week’s', () => {
    for (let seed = 0; seed < 100; seed++) {
      const trend = rollTrend(seed, 7, 'seafood');
      expect(trend.id).not.toBe('seafood');
      expect(trend.untilDay).toBe(13);
    }
    const all = new Set(Array.from({ length: 300 }, (_, seed) => rollTrend(seed, 0, null).id));
    expect(all.size).toBe(TREND_IDS.length);
    expect(trendOn({ id: 'seafood', untilDay: 13 }, 13)).toEqual(seafood);
    expect(trendOn({ id: 'seafood', untilDay: 13 }, 14)).toBeNull();
  });

  it('make one group crave the trending dishes, and nobody else', () => {
    expect(dishAppeal(fishSoup, 'locals', seafood)).toBeGreaterThan(dishAppeal(fishSoup, 'locals'));
    expect(dishAppeal(fishSoup, 'locals', seafood)).toBe(1);
    expect(dishAppeal(pierogi, 'locals', seafood)).toBe(dishAppeal(pierogi, 'locals'));
    expect(dishAppeal(fishSoup, 'students', seafood)).toBe(dishAppeal(fishSoup, 'students'));
  });

  it('draw that group to a restaurant that has them', () => {
    const player = playerOf(newGame(1));
    const withFish = { ...player, menu: [...player.menu, fishSoup] };
    const local = { group: 'locals' as const, size: 2, origin: player.location, arrivalMinute: 12 * 60 };
    expect(utility(withFish, local, 10, false, [], seafood)!).toBeGreaterThan(utility(withFish, local, 10, false, [])!);
  });

  it('come with the day’s conditions, and a new one every Monday with a word in the news', () => {
    const start: GameState = { ...newGame(2), day: 6, trend: { id: 'pizza', untilDay: 6 } };
    expect(conditionsFor(start).trend).toEqual({ group: 'locals', wants: TRENDS.pizza.wants });
    const open = openRestaurant(start);
    while (!open.progress.done) playTick(open);
    const { state } = closeDay(start, open);
    expect(state.trend?.id).not.toBe('pizza');
    expect(state.trend?.untilDay).toBe(13);
    expect(state.news.some((n) => n.title.includes(TRENDS[state.trend!.id].name))).toBe(true);
  });
});
