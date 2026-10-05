import { describe, expect, it } from 'vitest';
import { nextDayOn } from './calendar';
import { balance } from '../data/balance';
import type { MenuDish } from '../data/dishes';
import { GROUP_IDS } from '../data/groups';
import { runDay } from './day';
import { calendarEventsOn, conditionsFor, ORDINARY_DAY, rollRandomEvent, rollWeather } from './events';
import { expectedGuests } from './guests';
import { newGame, playerOf, terraceOpenOn, type GameState } from './game';
import { createRng } from './rng';
import { weatherAppetite } from './service';
import type { DayConditions } from './types';

// The season starts on 8 July, so April and May come round in free play.
const FIRST_OF_APRIL = nextDayOn(4, 1, 0);
const FIRST_OF_MAY = nextDayOn(5, 1, 0);
const FIRST_OF_AUGUST = nextDayOn(8, 1, 0);

describe('weather', () => {
  it('never brings a heatwave in April, and sometimes does in August', () => {
    const rng = createRng(1);
    const april = Array.from({ length: 500 }, () => rollWeather(rng, FIRST_OF_APRIL));
    const august = Array.from({ length: 500 }, () => rollWeather(rng, FIRST_OF_AUGUST));
    expect(april).not.toContain('heatwave');
    expect(august).toContain('heatwave');
    expect(april).toContain('rain');
  });

  it('keeps people indoors when it rains', () => {
    const rainy: DayConditions = { ...ORDINARY_DAY, weather: 'rain' };
    expect(expectedGuests('dluga', 'tourists', FIRST_OF_APRIL, 24, rainy)).toBeLessThan(
      expectedGuests('dluga', 'tourists', FIRST_OF_APRIL, 24),
    );
  });

  it('sells ice cream in a heatwave and soup in the rain', () => {
    const iceCream: MenuDish = { template: 'iceCream', variant: 'vanilla', price: 16 };
    const soup: MenuDish = { template: 'zurek', variant: 'classic', price: 28 };
    expect(weatherAppetite(iceCream, 'heatwave')).toBeGreaterThan(1);
    expect(weatherAppetite(soup, 'heatwave')).toBeLessThan(1);
    expect(weatherAppetite(soup, 'rain')).toBeGreaterThan(1);
  });

  it('closes the terrace in the rain', () => {
    const inAugust: GameState = { ...newGame(1), day: FIRST_OF_AUGUST, terracePermitUntilDay: FIRST_OF_AUGUST + 30 };
    expect(terraceOpenOn({ ...inAugust, weather: 'sunny' }, FIRST_OF_AUGUST)).toBe(true);
    expect(terraceOpenOn({ ...inAugust, weather: 'rain' }, FIRST_OF_AUGUST)).toBe(false);
  });
});

describe('calendar events', () => {
  it('fall on their dates', () => {
    expect(calendarEventsOn(FIRST_OF_APRIL)).toEqual([]);
    expect(calendarEventsOn(FIRST_OF_MAY)).toContain('majowka');
    expect(calendarEventsOn(FIRST_OF_AUGUST)).toEqual(expect.arrayContaining(['fair', 'summerHolidays']));
    expect(calendarEventsOn(balance.calendar.seasonLengthDays - 1)).toContain('fair');
  });

  it('bring more guests, combining when they overlap', () => {
    const majowka = conditionsFor({ ...newGame(1), day: FIRST_OF_MAY, weather: 'cloudy' });
    expect(majowka.groups.tourists).toBeGreaterThan(1);
    const fairInSummer = conditionsFor({ ...newGame(1), day: FIRST_OF_AUGUST, weather: 'cloudy' });
    expect(fairInSummer.traffic).toBeGreaterThan(1);
    expect(fairInSummer.groups.tourists).toBeGreaterThan(1);
  });
});

describe('random events', () => {
  it('happen on about the tuned share of days', () => {
    const rng = createRng(3);
    const days = 5_000;
    const happened = Array.from({ length: days }, () => rollRandomEvent(rng)).filter((e) => e !== null).length;
    expect(happened / days).toBeCloseTo(balance.events.randomChancePerDay, 1);
  });

  const withEvent = (id: GameState['events'][number]['id'], days = 1): GameState => ({
    ...newGame(4),
    weather: 'cloudy',
    events: [{ id, fromDay: 0, untilDay: days - 1 }],
  });

  it('send a food critic straight to the player at 19:00', () => {
    expect(conditionsFor(withEvent('foodCritic')).bookings).toEqual([
      { restaurant: 'player', group: 'foodies', size: 1, minute: 19 * 60, critic: true },
    ]);
  });

  it('make ingredients cheaper during a supplier discount', () => {
    expect(conditionsFor(withEvent('supplierDiscount', 7)).ingredientCost.player).toBeCloseTo(0.7);
  });

  it('slow the player’s street during street works', () => {
    expect(conditionsFor(withEvent('streetWorks', 3)).locations.ogarna).toBeCloseTo(0.6);
  });

  it('let a food critic move every group’s opinion at once', () => {
    const state = withEvent('foodCritic');
    const conditions = conditionsFor(state);
    const { outcomes, restaurants } = runDay(createRng(6), 0, state.restaurants, conditions);
    const critic = outcomes.find((o) => o.restaurant === 'player' && o.review?.critic);
    expect(critic).toBeDefined();
    // The critic is a foodie, but every group's reputation moved.
    for (const g of GROUP_IDS) expect(restaurants[0].reputation[g]).not.toBe(playerOf(state).reputation[g]);
  });
});
