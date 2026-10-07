import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { DISH_TEMPLATES, EXTRAS, type MenuDish, type TemplateId } from '../data/dishes';
import { DISH_GOODS, EXTRA_GOODS, GOOD_IDS } from '../data/market';
import { specialAppeal } from './choice';
import { conditionsFor } from './events';
import { closeDay, newGame, openRestaurant, playerOf, playTick, type GameState } from './game';
import { dealHeadline, fromTheMarket, goodOf, marketDeals, marketPrices, rollMarket, type MarketState } from './market';
import { ingredientCostOf, recipeKey } from './menu';

const friedCod: MenuDish = { template: 'friedCod', variant: 'classic', price: 42 };
const ruskie: MenuDish = { template: 'pierogi', variant: 'ruskie', price: 36, extras: ['sourCream', 'dill'] };

describe('the morning market', () => {
  it('knows what every dish and extra in it is made of', () => {
    for (const key of Object.keys(DISH_GOODS)) {
      const [template, variant] = key.split('.') as [TemplateId, string?];
      expect(DISH_TEMPLATES[template], key).toBeDefined();
      if (variant) expect(DISH_TEMPLATES[template].variants.some((v) => v.id === variant), key).toBe(true);
    }
    for (const extra of Object.keys(EXTRA_GOODS)) expect(EXTRAS[extra as keyof typeof EXTRAS], extra).toBeDefined();
    expect(goodOf(friedCod)).toBe('fish');
    expect(goodOf(ruskie)).toBe('potatoes');
    expect(goodOf({ template: 'pierogi', variant: 'meat', price: 40 })).toBe('pork');
    expect(goodOf({ template: 'cabritoAssado', variant: 'arroz', price: 60 })).toBeNull();
  });

  it('has a deal or two every morning, sometimes a dear good, and prices that wander only a little', () => {
    let market: MarketState | null = null;
    let total = 0;
    let count = 0;
    for (let day = 0; day < 400; day++) {
      market = rollMarket(day * 7919, day, market, []);
      const goods = market.deals.map((d) => d.good);
      expect(goods.length).toBeGreaterThanOrEqual(1);
      expect(goods.length).toBeLessThanOrEqual(2);
      expect(new Set(goods).size).toBe(goods.length);
      if (market.dear) expect(goods).not.toContain(market.dear.good);
      for (const good of GOOD_IDS) {
        expect(Math.abs(market.drift[good] - 1)).toBeLessThanOrEqual(balance.market.driftLimit + 1e-9);
        total += marketPrices(market, day)[good]!;
        count++;
      }
    }
    // Over a season the market costs about the same as usual prices, a little less.
    expect(total / count).toBeGreaterThan(0.93);
    expect(total / count).toBeLessThan(1.01);
    expect(rollMarket(5, 3, null, [])).toEqual(rollMarket(5, 3, null, []));
  });

  it('favours fresh produce in season for its deals, by name', () => {
    const fruitDeals = (inSeason: Parameters<typeof rollMarket>[3]) =>
      Array.from({ length: 500 }, (_, seed) => rollMarket(seed, 0, null, inSeason)).filter((m) => m.deals.some((d) => d.good === 'fruit')).length;
    expect(fruitDeals(['strawberries'])).toBeGreaterThan(fruitDeals([]));
    expect(dealHeadline('fruit', ['strawberries'])).toBe('Kashubian strawberries going cheap at the market!');
    expect(dealHeadline('fish', ['strawberries'])).toBe('Cheap cod at the harbour today!');
  });

  it('makes a dish cheaper to cook on a deal, and dearer when its good is dear', () => {
    const market: MarketState = {
      day: 4,
      drift: Object.fromEntries(GOOD_IDS.map((g) => [g, 1])) as MarketState['drift'],
      deals: [{ good: 'fish', story: 0 }],
      dear: { good: 'dairy', story: 0 },
    };
    const prices = marketPrices(market, 4);
    expect(ingredientCostOf(friedCod, 'market', [], prices)).toBeCloseTo(16 * balance.market.dealPrice);
    // Ruskie: potatoes as usual, dill keeps its price, the sour cream is dear.
    expect(ingredientCostOf(ruskie, 'market', [], prices)).toBeCloseTo(8 + 1 + 2 * balance.market.dearPrice);
    expect(ingredientCostOf(friedCod, 'premium', [], prices)).toBeCloseTo(16 * balance.market.dealPrice * balance.supplier.premiumCostMultiplier);
    // Another day's market (an older save) changes nothing.
    expect(marketPrices(market, 5)).toEqual({});
    expect(marketDeals(market, 5)).toEqual([]);
    expect(marketDeals(market, 4)).toEqual(['fish']);
  });

  it('puts a special made of a deal on the board as fresh from the market', () => {
    const player = playerOf(newGame(1));
    const withCod = { ...player, menu: [...player.menu, friedCod], special: recipeKey(friedCod) };
    expect(fromTheMarket(friedCod, ['fish'])).toBe(true);
    expect(fromTheMarket(friedCod, ['pork'])).toBe(false);
    const plain = specialAppeal(withCod, [], []);
    expect(specialAppeal(withCod, [], ['fish']) - plain).toBeCloseTo(balance.specials.freshAppeal);
    expect(specialAppeal(withCod, [], ['pork'])).toBe(plain);
  });

  it('comes with the day’s conditions, and a new one every morning, saved for the day report', () => {
    const start: GameState = newGame(3);
    expect(start.market?.day).toBe(0);
    const conditions = conditionsFor(start);
    expect(conditions.prices).toEqual(marketPrices(start.market, 0));
    expect(conditions.deals).toEqual(start.market!.deals.map((d) => d.good));
    const open = openRestaurant(start);
    while (!open.progress.done) playTick(open);
    const { state, summary } = closeDay(start, open);
    expect(state.market?.day).toBe(1);
    expect(summary.market).not.toBeNull();
    // What was saved is what the usual prices would have cost, less what was paid.
    expect(Number.isInteger(summary.market!.saved)).toBe(true);
    expect(conditionsFor({ ...start, market: null }).prices).toEqual({});
  });
});
