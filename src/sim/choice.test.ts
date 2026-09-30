import { describe, expect, it } from 'vitest';
import type { MenuDish } from '../data/dishes';
import { chooseRestaurant, dishAppeal, menuMatch, priceLevel, utility } from './choice';
import { createRng } from './rng';
import { createPlayerRestaurant } from './setup';
import type { Party, Restaurant } from './types';

const average = { skill: 3, speed: 3 };
const polishMenu: MenuDish[] = [
  { template: 'zurek', variant: 'classic', price: 28 },
  { template: 'pierogi', variant: 'ruskie', price: 36 },
  { template: 'schabowy', variant: 'cabbage', price: 44 },
];

function restaurantAt(location: Restaurant['location'], menu = polishMenu): Restaurant {
  return { ...createPlayerRestaurant('Test', menu, [average], [average]), location };
}

const localsOnOgarna: Party = { group: 'locals', size: 2, origin: 'ogarna', arrivalMinute: 720 };

describe('dish appeal', () => {
  it('matches dishes to what each group likes', () => {
    // Students like pizza and cheap food: a margherita is a perfect match.
    expect(dishAppeal({ template: 'pizza', variant: 'margherita', price: 40 }, 'students')).toBe(1);
    // Foodies want premium, creative or seafood: plain tomato soup does nothing for them.
    expect(dishAppeal({ template: 'tomatoSoup', variant: 'noodles', price: 18 }, 'foodies')).toBe(0);
  });

  it('scores a Polish menu higher for locals than for foodies', () => {
    expect(menuMatch(polishMenu, 'locals')).toBeGreaterThan(menuMatch(polishMenu, 'foodies'));
  });
});

describe('price level', () => {
  it('is 1 at typical prices and higher when dearer', () => {
    const typical: MenuDish[] = [{ template: 'zurek', variant: 'classic', price: 28 }];
    const dear: MenuDish[] = [{ template: 'zurek', variant: 'classic', price: 42 }];
    expect(priceLevel(typical)).toBeCloseTo(1);
    expect(priceLevel(dear)).toBeCloseTo(1.5);
  });
});

describe('utility', () => {
  it('rules out restaurants with an empty menu', () => {
    expect(utility(restaurantAt('ogarna', []), localsOnOgarna, 0)).toBeNull();
  });

  it('prefers nearby, cheaper and quicker restaurants', () => {
    const near = utility(restaurantAt('ogarna'), localsOnOgarna, 10)!;
    const far = utility(restaurantAt('mariacka'), localsOnOgarna, 10)!;
    expect(near).toBeGreaterThan(far);

    const cheaperMenu = polishMenu.map((dish) => ({ ...dish, price: dish.price * 0.8 }));
    expect(utility(restaurantAt('ogarna', cheaperMenu), localsOnOgarna, 10)!).toBeGreaterThan(near);

    expect(utility(restaurantAt('ogarna'), localsOnOgarna, 40)!).toBeLessThan(near);
  });
});

describe('choosing a restaurant', () => {
  it('picks the more attractive restaurant more often', () => {
    const rng = createRng(21);
    const restaurants = [restaurantAt('ogarna'), restaurantAt('mariacka')];
    const picks = [0, 0];
    for (let i = 0; i < 2_000; i++) {
      const choice = chooseRestaurant(rng, localsOnOgarna, restaurants, [10, 10]);
      if (choice !== null) picks[choice]++;
    }
    expect(picks[0]).toBeGreaterThan(picks[1]);
  });

  it('never picks a restaurant that is not an option', () => {
    const rng = createRng(22);
    const restaurants = [restaurantAt('ogarna', [])];
    for (let i = 0; i < 200; i++) {
      expect(chooseRestaurant(rng, localsOnOgarna, restaurants, [0])).toBeNull();
    }
  });
});
