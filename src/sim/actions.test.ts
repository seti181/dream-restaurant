import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { DISH_TEMPLATES } from '../data/dishes';
import { addDish, dishUnavailableReason, removeDish, setDishPrice } from './actions';
import { newGame, playerOf } from './game';

const fresh = () => newGame(1);
const menuOf = (state: ReturnType<typeof newGame>) => playerOf(state).menu;

describe('menu actions', () => {
  it('adds a dish at the typical price without changing the old state', () => {
    const state = removeDish(fresh(), 0); // make room
    const after = addDish(state, 'barszcz', 'uszka');
    expect(menuOf(after)).toHaveLength(menuOf(state).length + 1);
    expect(menuOf(after).at(-1)).toEqual({
      template: 'barszcz',
      variant: 'uszka',
      price: DISH_TEMPLATES.barszcz.referencePrice,
    });
    expect(menuOf(state).some((d) => d.template === 'barszcz')).toBe(false);
  });

  it('refuses dishes the kitchen has no equipment for, and says why', () => {
    const state = removeDish(fresh(), 0);
    expect(dishUnavailableReason(state, 'pizza', 'margherita')).toBe('Needs a pizza oven');
    expect(addDish(state, 'pizza', 'margherita')).toBe(state);
  });

  it('allows dishes that need no equipment at all', () => {
    const state = removeDish(fresh(), 0);
    expect(dishUnavailableReason(state, 'lemonade', 'mint')).toBeNull();
  });

  it('refuses duplicates and a full menu', () => {
    const state = fresh();
    expect(menuOf(state)).toHaveLength(balance.menu.startingSlots);
    expect(dishUnavailableReason(state, 'barszcz', 'uszka')).toBe('Your menu is full');
    const roomy = removeDish(state, 5);
    const first = menuOf(roomy)[0];
    expect(dishUnavailableReason(roomy, first.template, first.variant)).toBe('Already on your menu');
  });

  it('removes a dish by its position', () => {
    const state = fresh();
    const after = removeDish(state, 1);
    expect(menuOf(after)).toEqual(menuOf(state).filter((_, i) => i !== 1));
  });

  it('sets prices as whole złoty and never below the minimum', () => {
    const state = fresh();
    expect(menuOf(setDishPrice(state, 0, 21.4))[0].price).toBe(21);
    expect(menuOf(setDishPrice(state, 0, -5))[0].price).toBe(balance.menu.minPrice);
  });

  it('caps dessert prices', () => {
    const state = addDish(removeDish(fresh(), 0), 'lemonade', 'mint');
    // Give the player a dessert display to test the cap.
    const withDisplay = {
      ...state,
      restaurants: [{ ...playerOf(state), equipment: [...playerOf(state).equipment, 'dessertDisplay' as const] }, ...state.restaurants.slice(1)],
    };
    const roomy = removeDish(withDisplay, 0);
    const withCake = addDish(roomy, 'sernik', 'classic');
    const index = menuOf(withCake).length - 1;
    expect(menuOf(setDishPrice(withCake, index, 80))[index].price).toBe(balance.menu.maxDessertPrice);
  });
});
