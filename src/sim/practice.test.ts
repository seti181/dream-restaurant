import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import type { MenuDish } from '../data/dishes';
import { closeDay, newGame, openRestaurant, playerOf, playTick } from './game';
import { tagsOf } from './menu';
import { MAX_STARS, portionsToNextStar, practiceAfterDay, starsFor, withStars } from './practice';
import { orderQuality } from './service';
import type { PartyOutcome } from './types';

const [one, two, three] = balance.dishLevels.starsAt;
const pierogi: MenuDish = { template: 'pierogi', variant: 'ruskie', price: 36 };
const pasta: MenuDish = { template: 'pasta', variant: 'pesto', price: 34 };

const served = (order: MenuDish[], restaurant = 'player'): PartyOutcome => ({
  restaurant,
  group: 'locals',
  size: order.length,
  kind: 'served',
  order,
  revenue: 0,
  ingredientCost: 0,
  waitMinutes: 10,
  satisfaction: 60,
  factors: null,
  review: null,
});

describe('dish stars', () => {
  it('come with portions served, up to three', () => {
    expect(MAX_STARS).toBe(3);
    expect([0, one - 1, one, two, three, three * 10].map(starsFor)).toEqual([0, 0, 1, 2, 3, 3]);
    expect(portionsToNextStar(one + 5)).toBe(two - one - 5);
    expect(portionsToNextStar(three)).toBeNull();
  });

  it('are counted for a kind of dish, whatever its variant or extras', () => {
    const menu = withStars([pierogi, { ...pierogi, variant: 'meat', extras: ['dill'] }, pasta], { pierogi: two });
    expect(menu.map((dish) => dish.stars ?? 0)).toEqual([2, 2, 0]);
  });

  it('make the kitchen cook a dish better', () => {
    const chef = { skill: 3, speed: 3 };
    const [starred] = withStars([pierogi], { pierogi: three });
    expect(orderQuality([starred], chef) - orderQuality([pierogi], chef)).toBeCloseTo(3 * balance.dishLevels.qualityPerStar);
  });

  it('earn a taste tag at three stars: homemade, or creative for a dish that already is', () => {
    const [starredPasta, starredPierogi] = withStars([pasta, pierogi], { pasta: three, pierogi: three });
    expect(tagsOf(pasta)).not.toContain('homemade');
    expect(tagsOf(starredPasta)).toContain('homemade');
    expect(tagsOf(pierogi)).not.toContain('creative');
    expect(tagsOf(starredPierogi)).toContain('creative');
    expect(tagsOf(withStars([pasta], { pasta: two })[0])).not.toContain('homemade');
  });

  it('count only the player’s served portions, and tell when a star is earned', () => {
    const outcomes = [
      served([pierogi, pierogi, pasta]),
      served([pierogi], 'nonnaRosa'),
      { ...served([pierogi]), kind: 'walkedOut' as const },
    ];
    const { practice, earned } = practiceAfterDay({ pierogi: one - 2, pasta: 4 }, outcomes, 'player', 'Pani Krystyna');
    expect(practice).toEqual({ pierogi: one, pasta: 5 });
    expect(earned).toEqual([expect.objectContaining({ template: 'pierogi', stars: 1 })]);
    expect(earned[0].text).toContain('Pierogi');
  });
});

describe('dish stars over a day', () => {
  it('reach the report, and the kitchen cooks with them the next day', () => {
    const start = { ...newGame(7), dishPractice: { zurek: two - 1, pierogi: two - 1, schabowy: two - 1 } };
    const open = openRestaurant(start);
    while (!open.progress.done) playTick(open);
    const { state, summary } = closeDay(start, open);
    expect(summary.starsEarned.length).toBeGreaterThan(0);
    expect(summary.starsEarned.every((e) => e.stars === 2)).toBe(true);
    const tomorrow = openRestaurant(state).progress.restaurants[0];
    const earned = summary.starsEarned.map((e) => e.template);
    expect(tomorrow.menu.filter((dish) => earned.includes(dish.template)).every((dish) => dish.stars === 2)).toBe(true);
    // The saved menu stays as the player made it.
    expect(playerOf(state).menu.every((dish) => dish.stars === undefined)).toBe(true);
    // The rivals don't keep count.
    expect(openRestaurant(state).progress.restaurants.slice(1).every((r) => r.menu.every((d) => d.stars === undefined))).toBe(true);
  });
});
