import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { BOOKING_KIND_IDS, BOOKING_KINDS } from '../data/bookings';
import type { MenuDish } from '../data/dishes';
import { RIVAL_IDS } from '../data/rivals';
import { acceptBooking, declineBooking } from './actions';
import { acceptedOn, bigOrderMinutes, rollRequest, wantMet, type BookingRequest } from './bookings';
import { weekdayOf } from './calendar';
import { ORDINARY_DAY } from './events';
import { runDay, startDay, stepDay } from './day';
import { closeDay, newGame, openRestaurant, playerOf, playTick, type GameState } from './game';
import { createRng } from './rng';
import { createPlayerRestaurant, createRivalRestaurant } from './setup';
import type { Booking, DayConditions, Staff } from './types';

const average: Staff = { skill: 3, speed: 3 };
const menu: MenuDish[] = [
  { template: 'zurek', variant: 'classic', price: 28 },
  { template: 'pierogi', variant: 'ruskie', price: 36 },
  { template: 'schabowy', variant: 'cabbage', price: 44 },
  { template: 'kompot', variant: 'strawberry', price: 9 },
];
const noSoup = menu.filter((dish) => dish.template !== 'zurek');

function oldTown(dishes = menu, chefs = [average]) {
  return [createPlayerRestaurant('Test Kitchen', dishes, chefs, [average]), ...RIVAL_IDS.map(createRivalRestaurant)];
}

const request = (changes: Partial<BookingRequest>): BookingRequest => ({
  id: 1,
  kind: 'wedding',
  day: 3,
  size: 12,
  text: '',
  accepted: true,
  ...changes,
});

describe('booking requests', () => {
  const player = playerOf(newGame(1));

  it('come in on about the tuned share of evenings, for a day or three ahead', () => {
    const rolls = Array.from({ length: 2_000 }, (_, seed) => rollRequest(seed, 10, [], player));
    const came = rolls.filter((r) => r !== null);
    expect(came.length / rolls.length).toBeCloseTo(balance.bookings.requestChance, 1);
    for (const r of came) {
      expect(r!.day - 10).toBeGreaterThanOrEqual(balance.bookings.daysAhead.min);
      expect(r!.day - 10).toBeLessThanOrEqual(balance.bookings.daysAhead.max);
      expect(r!.accepted).toBe(false);
      expect(r!.text).not.toContain('{size}');
      const kind = BOOKING_KINDS[r!.kind];
      if (kind.weekdays) expect(kind.weekdays).toContain(weekdayOf(r!.day));
      // Never more guests than the dining room holds.
      if (kind.kind === 'table') expect(r!.size).toBeLessThanOrEqual(player.tables * balance.service.seatsPerTable);
    }
  });

  it('never come in for a day that already has one', () => {
    const taken = [11, 12, 13].map((day) => request({ day }));
    for (let seed = 0; seed < 200; seed++) expect(rollRequest(seed, 10, taken, player)).toBeNull();
  });

  it('each tell what they want in a way the menu can answer', () => {
    for (const id of BOOKING_KIND_IDS) {
      const kind = BOOKING_KINDS[id];
      expect(kind.texts.length, id).toBeGreaterThan(0);
      expect(kind.size.min, id).toBeLessThanOrEqual(kind.size.max);
    }
    expect(wantMet(menu, { category: 'soup' })).toBe(true);
    expect(wantMet(noSoup, { category: 'soup' })).toBe(false);
    expect(wantMet(menu, { tag: 'polish' })).toBe(true);
    expect(wantMet(menu, { template: 'pierogi' })).toBe(true);
    expect(wantMet(menu, { category: 'dessert' })).toBe(false);
  });

  it('can be accepted or declined, but an accepted booking stays', () => {
    const game: GameState = { ...newGame(2), bookings: [request({ accepted: false })] };
    expect(acceptBooking(game, 1).bookings[0].accepted).toBe(true);
    expect(declineBooking(game, 1).bookings).toEqual([]);
    expect(declineBooking(acceptBooking(game, 1), 1).bookings).toHaveLength(1);
  });

  it('turn into parties and orders on their day, once accepted', () => {
    const requests = [
      request({ id: 1, day: 3 }),
      request({ id: 2, day: 3, kind: 'officeLunches', size: 20 }),
      request({ id: 3, day: 3, accepted: false, kind: 'tourBus' }),
      request({ id: 4, day: 4 }),
    ];
    const { tables, orders } = acceptedOn(requests, 3, player);
    expect(tables).toEqual([expect.objectContaining({ requestId: 1, group: 'locals', minute: 17 * 60, wish: { category: 'dessert' } })]);
    expect(orders).toEqual([expect.objectContaining({ requestId: 2, portions: 20, minute: 12 * 60 + 30 })]);
  });
});

describe('a booked party', () => {
  const wedding = (wish: Booking['wish']): DayConditions => ({
    ...ORDINARY_DAY,
    traffic: 3,
    bookings: [{ restaurant: 'player', group: 'locals', size: 16, minute: 17 * 60, critic: false, requestId: 7, wish }],
  });

  it('gets the whole dining room on a busy day: tables are held for them', () => {
    for (const seed of [1, 2, 3]) {
      const { outcomes } = runDay(createRng(seed), 5, oldTown(), wedding({ category: 'soup' }));
      const party = outcomes.find((o) => o.booking?.id === 7);
      expect(party?.kind, `seed ${seed}`).toBe('served');
    }
  });

  it('knows whether their wish was on the menu', () => {
    const met = runDay(createRng(1), 5, oldTown(), wedding({ category: 'soup' })).outcomes.find((o) => o.booking);
    const missed = runDay(createRng(1), 5, oldTown(), wedding({ category: 'dessert' })).outcomes.find((o) => o.booking);
    expect(met?.booking?.wishMet).toBe(true);
    expect(missed?.booking?.wishMet).toBe(false);
  });
});

describe('a big order', () => {
  const lunches: DayConditions = {
    ...ORDINARY_DAY,
    bigOrders: [{ restaurant: 'player', requestId: 9, minute: 12 * 60 + 30, portions: 30, needs: { category: 'soup' } }],
  };

  it('keeps a chef busy until it is ready, in time', () => {
    const progress = startDay(2, oldTown(), lunches);
    while (progress.bigOrders[0].status === 'waiting') stepDay(createRng(1), progress);
    const job = progress.bigOrders[0];
    expect(job.status).toBe('cooking');
    expect(job.dish?.template).toBe('zurek');
    expect(job.readyAt).toBeLessThanOrEqual(12 * 60 + 30);
    expect(job.readyAt! - bigOrderMinutes(30, average)).toBeGreaterThanOrEqual(11 * 60);
    expect(progress.floors[0].chefFreeAt[0]).toBeGreaterThanOrEqual(job.readyAt!);
  });

  it('falls through with nothing on the menu that fits', () => {
    const progress = startDay(2, oldTown(noSoup), lunches);
    while (!progress.done) stepDay(createRng(1), progress);
    expect(progress.bigOrders[0].status).toBe('fellThrough');
  });
});

describe('bookings over a day', () => {
  /** Plays the game's day with these requests, and closes it. */
  function playWith(requests: BookingRequest[], dishes = menu) {
    const start = newGame(5);
    const [player, ...rivals] = start.restaurants;
    const game: GameState = { ...start, bookings: requests, restaurants: [{ ...player, menu: dishes }, ...rivals] };
    const open = openRestaurant(game);
    while (!open.progress.done) playTick(open);
    return closeDay(game, open);
  }

  it('pays for a big order that went out, and reports it', () => {
    const { summary } = playWith([request({ day: 0, kind: 'museumSoups', size: 20 })]);
    expect(summary.bookings).toEqual([expect.objectContaining({ good: true, name: BOOKING_KINDS.museumSoups.name })]);
    // Paid for every portion, less the ingredients.
    const kind = BOOKING_KINDS.museumSoups;
    expect(summary.bookingsCash).toBeGreaterThan(0);
    if (kind.kind === 'order') expect(summary.bookingsCash).toBeLessThan(20 * kind.pricePerPortion);
  });

  it('disappoints the group when an order falls through', () => {
    const { summary, state } = playWith([request({ day: 0, kind: 'museumSoups', size: 20 })], noSoup);
    const without = playWith([], noSoup).state;
    expect(summary.bookings[0].good).toBe(false);
    expect(summary.bookingsCash).toBe(0);
    expect(playerOf(state).reputation.locals).toBeCloseTo(
      playerOf(without).reputation.locals - balance.bookings.letDownReputation,
    );
  });

  it('forgets requests nobody answered by the evening before, with a word in the news', () => {
    const { state } = playWith([
      request({ id: 101, day: 1, accepted: false }),
      request({ id: 102, day: 1 }),
      request({ id: 103, day: 2, accepted: false }),
    ]);
    expect(state.bookings.filter((r) => r.id > 100).map((r) => r.id)).toEqual([102, 103]);
    expect(state.news.some((n) => n.title === 'Bookings')).toBe(true);
  });
});
