import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { DISH_TEMPLATES, type ExtraId, type MenuDish } from '../data/dishes';
import { EQUIPMENT } from '../data/equipment';
import {
  addDish,
  buyEquipment,
  dishUnavailableReason,
  equipmentUnavailableReason,
  extraUnavailableReason,
  menuBoardUnavailableReason,
  removeDish,
  setDishPrice,
  setSupplier,
  upgradeMenuBoard,
} from './actions';
import { newGame, playerOf } from './game';
import { ingredientCostOf, pairingsOf, tagsOf } from './menu';
import { orderQuality } from './service';

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

describe('kitchen actions', () => {
  it('buys equipment, pays for it, and unlocks its dishes', () => {
    const state = removeDish(fresh(), 0);
    const after = buyEquipment(state, 'pizzaOven');
    expect(playerOf(after).equipment).toContain('pizzaOven');
    expect(after.cash).toBe(state.cash - EQUIPMENT.pizzaOven.cost);
    expect(dishUnavailableReason(after, 'pizza', 'margherita')).toBeNull();
  });

  it('refuses equipment already owned, without room, or without cash', () => {
    const state = fresh();
    expect(equipmentUnavailableReason(state, 'stove')).toBe('Already in your kitchen');
    expect(equipmentUnavailableReason({ ...state, cash: 100 }, 'grill')).toBe('Not enough cash');
    // Ogarna's kitchen has 3 slots: the stove plus two more.
    const full = buyEquipment(buyEquipment(state, 'fryer'), 'grill');
    expect(equipmentUnavailableReason(full, 'espresso')).toBe('No room left in this kitchen');
    expect(buyEquipment(full, 'espresso')).toBe(full);
  });

  it('enlarges the menu board up to the maximum', () => {
    let state = { ...fresh(), cash: 1_000_000 };
    state = upgradeMenuBoard(state);
    expect(state.menuSlots).toBe(balance.menu.startingSlots + balance.menu.slotUpgrade.slots);
    for (let i = 0; i < 10; i++) state = upgradeMenuBoard(state);
    expect(state.menuSlots).toBe(balance.menu.maxSlots);
    expect(menuBoardUnavailableReason(state)).not.toBeNull();
  });

  it('switches supplier, which changes cost and quality', () => {
    const premium = setSupplier(fresh(), 'premium');
    expect(playerOf(premium).supplier).toBe('premium');
    const dish = playerOf(premium).menu[0];
    expect(ingredientCostOf(dish, 'premium')).toBeCloseTo(
      ingredientCostOf(dish, 'market') * balance.supplier.premiumCostMultiplier,
    );
    const chef = { skill: 3, speed: 3 };
    expect(orderQuality([dish], chef, 'premium')).toBe(
      orderQuality([dish], chef, 'market') + balance.supplier.premiumQualityBonus,
    );
  });
});

describe('the dish creator', () => {
  const roomy = () => removeDish(fresh(), 0);

  it('adds a dish with extras and a name, counting extras in cost and tags', () => {
    const state = addDish(roomy(), 'pierogi', 'meat', ['friedOnions', 'skwarki'], '  Babcia’s Pierogi  ');
    const dish = menuOf(state).at(-1)!;
    expect(dish.extras).toEqual(['friedOnions', 'skwarki']);
    expect(dish.name).toBe('Babcia’s Pierogi');
    expect(ingredientCostOf(dish, 'market')).toBe(11 + 1 + 2);
    expect(tagsOf(dish)).toContain('hearty');
    expect(new Set(tagsOf(dish)).size).toBe(tagsOf(dish).length);
  });

  it('treats the same dish with different extras as a different recipe', () => {
    const state = addDish(roomy(), 'pierogi', 'ruskie', ['friedOnions']);
    expect(menuOf(state).filter((d) => d.template === 'pierogi' && d.variant === 'ruskie')).toHaveLength(2);
    expect(dishUnavailableReason(state, 'pierogi', 'ruskie', ['friedOnions'])).toBe('Already on your menu');
  });

  it('refuses extras that don’t suit the dish, or too many', () => {
    const state = roomy();
    expect(extraUnavailableReason('kompot', [], 'dill')).toBe('Doesn’t suit this dish');
    expect(extraUnavailableReason('pierogi', ['dill', 'chili', 'honey'], 'skwarki')).toBe('Up to 3 extras');
    expect(addDish(state, 'kompot', 'cherry', ['dill'])).toBe(state);
    expect(addDish(state, 'pierogi', 'meat', ['dill', 'chili', 'honey', 'skwarki'])).toBe(state);
  });

  it('keeps names short', () => {
    const dish = menuOf(addDish(roomy(), 'barszcz', 'mug', [], 'A'.repeat(100))).at(-1)!;
    expect(dish.name).toHaveLength(balance.menu.maxNameLength);
  });
});

describe('hidden pairings', () => {
  const chef = { skill: 3, speed: 3 };
  const dish = (template: MenuDish['template'], variant: string, extras: ExtraId[]): MenuDish => ({
    template,
    variant,
    price: 30,
    extras,
  });

  it('reward perfect pairings', () => {
    const withDill = dish('fishSoup', 'classic', ['dill']);
    expect(pairingsOf(withDill)).toHaveLength(1);
    expect(orderQuality([withDill], chef)).toBeGreaterThan(orderQuality([dish('fishSoup', 'classic', [])], chef));
    expect(pairingsOf(dish('pierogi', 'meat', ['oscypek', 'cranberry']))[0].quality).toBeGreaterThan(0);
  });

  it('punish clashes', () => {
    const clash = dish('iceCream', 'vanilla', ['chili', 'whippedCream']);
    expect(pairingsOf(clash).some((p) => p.quality < 0)).toBe(true);
    expect(orderQuality([clash], chef)).toBeLessThan(orderQuality([dish('iceCream', 'vanilla', [])], chef));
  });

  it('need the right dish: dill does nothing special for pierogi', () => {
    expect(pairingsOf(dish('pierogi', 'ruskie', ['dill']))).toHaveLength(0);
  });

  it('can stack', () => {
    expect(pairingsOf(dish('pierogi', 'meat', ['friedOnions', 'oscypek', 'cranberry']))).toHaveLength(2);
  });
});
