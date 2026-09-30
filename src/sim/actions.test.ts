import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { DECOR } from '../data/decor';
import { DISH_TEMPLATES, type ExtraId, type MenuDish } from '../data/dishes';
import { EQUIPMENT } from '../data/equipment';
import { CAMPAIGNS } from '../data/marketing';
import {
  addDish,
  buyDecor,
  buyEquipment,
  buyTable,
  buyTerracePermit,
  campaignEndDay,
  campaignUnavailableReason,
  decorUnavailableReason,
  clearLunchSet,
  dishUnavailableReason,
  equipmentUnavailableReason,
  extraUnavailableReason,
  launchCampaign,
  menuBoardUnavailableReason,
  removeDish,
  setDishPrice,
  setHappyHour,
  setLunchSet,
  setLunchSetPrice,
  setSupplier,
  tableUnavailableReason,
  terraceUnavailableReason,
  upgradeMenuBoard,
} from './actions';
import { utility } from './choice';
import {
  awarenessToday,
  closeDay,
  newGame,
  openRestaurant,
  playerOf,
  playTick,
  terraceOpenOn,
  type GameState,
} from './game';
import { decorStyleOf, interiorAppeal } from './interior';
import { ingredientCostOf, pairingsOf, priceMultiplier, recipeKey, tagsOf } from './menu';
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

describe('the lunch set', () => {
  // Starter menu: 0 tomato soup, 1 żurek, 2 pierogi, 3 schabowy, 4 gołąbki, 5 kompot.
  it('pairs a soup and a main, a little cheaper than buying both', () => {
    const state = setLunchSet(fresh(), 0, 2);
    const set = playerOf(state).lunchSet!;
    const [soup, , main] = menuOf(state);
    expect(set.soup).toBe(recipeKey(soup));
    expect(set.main).toBe(recipeKey(main));
    expect(set.price).toBe(Math.round((soup.price + main.price) * balance.lunchSet.startingPriceShare));
  });

  it('needs a soup and a main, in that order', () => {
    const state = fresh();
    expect(setLunchSet(state, 2, 0)).toBe(state);
    expect(setLunchSet(state, 0, 5)).toBe(state);
  });

  it('keeps its price when swapping a dish, and can be repriced or removed', () => {
    let state = setLunchSetPrice(setLunchSet(fresh(), 0, 2), 33);
    state = setLunchSet(state, 1, 3);
    expect(playerOf(state).lunchSet!.price).toBe(33);
    expect(playerOf(clearLunchSet(state)).lunchSet).toBeNull();
  });

  it('disappears when one of its dishes leaves the menu', () => {
    const state = setLunchSet(fresh(), 0, 2);
    expect(playerOf(removeDish(state, 4)).lunchSet).not.toBeNull();
    expect(playerOf(removeDish(state, 2)).lunchSet).toBeNull();
  });
});

describe('interior and terrace', () => {
  const rich = () => ({ ...fresh(), cash: 1_000_000 });

  it('adds tables until the room is full', () => {
    let state = rich();
    const start = playerOf(state).tables;
    state = buyTable(state);
    expect(playerOf(state).tables).toBe(start + 1);
    expect(state.cash).toBe(1_000_000 - balance.interior.tableCost);
    for (let i = 0; i < 20; i++) state = buyTable(state);
    // Ogarna holds 24 seats: 6 tables of 4.
    expect(playerOf(state).tables).toBe(6);
    expect(tableUnavailableReason(state)).toBe('The room is full');
  });

  it('makes the room cosier with decor, and gives it a style', () => {
    let state = buyDecor(rich(), 'shipsInBottles');
    expect(playerOf(state).ambiance).toBe(balance.start.ambiance + DECOR.shipsInBottles.ambiance);
    expect(decorStyleOf(playerOf(state).decor)).toBeNull(); // one item isn't a style yet
    expect(decorUnavailableReason(state, 'shipsInBottles')).toBe('Already in your dining room');

    state = buyDecor(state, 'lanterns');
    expect(decorStyleOf(playerOf(state).decor)).toBe('maritime');
    expect(interiorAppeal(playerOf(state), 'tourists')).toBe(balance.decor.styleBonus);
    expect(interiorAppeal(playerOf(state), 'office')).toBe(0);
  });

  it('opens the terrace from May to the end of September with a permit', () => {
    const state = buyTerracePermit(rich());
    const FIRST_OF_MAY = 30;
    const LAST_OF_SEPTEMBER = 182;
    expect(state.terracePermitUntilDay).toBe(LAST_OF_SEPTEMBER);
    expect(terraceOpenOn(state, 0)).toBe(false); // April
    expect(terraceOpenOn(state, FIRST_OF_MAY)).toBe(true);
    expect(terraceOpenOn(state, LAST_OF_SEPTEMBER)).toBe(true);
    expect(terraceOpenOn(state, LAST_OF_SEPTEMBER + 1)).toBe(false);
    expect(terraceUnavailableReason(state)).toBe('You already have this season’s permit');
  });

  it('puts terrace tables out on open days', () => {
    const inMay = { ...buyTerracePermit(rich()), day: 30 };
    const open = openRestaurant(inMay);
    // Ogarna's terrace has 8 seats: 2 tables.
    expect(open.progress.restaurants[0].terraceTables).toBe(2);
    expect(open.progress.floors[0].freeTables).toBe(playerOf(inMay).tables + 2);
    expect(openRestaurant(fresh()).progress.restaurants[0].terraceTables).toBe(0);
  });
});

describe('marketing', () => {
  const rich = () => ({ ...fresh(), cash: 1_000_000 });
  const playDay = (state: GameState) => {
    const open = openRestaurant(state);
    while (!open.progress.done) playTick(open);
    return closeDay(state, open).state;
  };

  it('launches a campaign for its length, and pays for it', () => {
    const state = launchCampaign(rich(), 'flyers');
    expect(state.cash).toBe(1_000_000 - CAMPAIGNS.flyers.cost);
    expect(state.campaigns).toEqual([{ id: 'flyers', untilDay: 2 }]);
    expect(campaignUnavailableReason(state, 'flyers')).toBe('Already running');
    expect(campaignEndDay(rich(), 'guideListing')).toBe(balance.calendar.seasonLengthDays - 1);
  });

  it('raises awareness with the targeted groups only', () => {
    const state = launchCampaign(rich(), 'flyers');
    const today = awarenessToday(state);
    const before = playerOf(state).awareness;
    expect(today.students).toBeGreaterThan(before.students);
    expect(today.locals).toBeGreaterThan(before.locals);
    expect(today.tourists).toBe(before.tourists);
  });

  it('keeps working for its days, then ends and slowly fades', () => {
    let state = launchCampaign(rich(), 'flyers');
    for (let i = 0; i < 3; i++) state = playDay(state);
    expect(state.campaigns).toHaveLength(0);
    const peak = playerOf(state).awareness.students;
    expect(peak).toBeGreaterThan(balance.start.awareness + 10);
    for (let i = 0; i < 10; i++) state = playDay(state);
    const later = playerOf(state).awareness.students;
    expect(later).toBeLessThan(peak);
    expect(later).toBeGreaterThan(balance.start.awareness);
  });

  it('never pushes awareness past 100', () => {
    let state = { ...rich(), campaigns: [{ id: 'radio' as const, untilDay: 10_000 }] };
    for (let i = 0; i < 200; i++) {
      const today = awarenessToday(state);
      state = { ...state, restaurants: [{ ...playerOf(state), awareness: today }, ...state.restaurants.slice(1)] };
    }
    expect(Math.max(...Object.values(playerOf(state).awareness))).toBeLessThanOrEqual(100);
  });

  it('happy hour makes everything cheaper from 15:00 to 18:00 only', () => {
    const player = playerOf(setHappyHour(fresh(), true));
    expect(priceMultiplier(player, 16 * 60)).toBeCloseTo(1 - balance.happyHour.discount);
    expect(priceMultiplier(player, 14 * 60)).toBe(1);
    expect(priceMultiplier(player, 18 * 60)).toBe(1);
    expect(priceMultiplier(playerOf(fresh()), 16 * 60)).toBe(1);
  });

  it('happy hour tempts price-sensitive students', () => {
    const on = playerOf(setHappyHour(fresh(), true));
    const off = playerOf(fresh());
    const students = { group: 'students' as const, size: 2, origin: 'ogarna' as const, arrivalMinute: 16 * 60 };
    expect(utility(on, students, 10)!).toBeGreaterThan(utility(off, students, 10)!);
  });
});
