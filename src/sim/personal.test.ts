import { describe, expect, it } from 'vitest';
import type { MenuDish } from '../data/dishes';
import type { GroupId } from '../data/groups';
import { REGULAR, SECRET_RECIPE, SPECIAL_STAFF } from '../data/personal';
import { addDish, dishUnavailableReason } from './actions';
import { nextDayOn } from './calendar';
import { calendarEventsOn, conditionsFor } from './events';
import { closeDay, newGame, openRestaurant, playerOf, playTick } from './game';
import { pairingQuality } from './menu';
import { writeReview } from './reviews';
import { createRng } from './rng';
import { specialCandidate, specialsLookingForWork } from './staff';

const FRIDAY = 4;
const arroz = (extras: MenuDish['extras'] = []): MenuDish => ({ template: 'arrozDeVitela', variant: 'joana', price: 46, extras });

function playDay(state: ReturnType<typeof newGame>) {
  const open = openRestaurant(state);
  while (!open.progress.done) playTick(open);
  return closeDay(state, open);
}

describe('the secret recipe', () => {
  it('stays hidden until Mewa finds it', () => {
    const state = newGame(1);
    expect(dishUnavailableReason(state, 'arrozDeVitela', 'joana')).not.toBeNull();
    expect(dishUnavailableReason({ ...state, secretRecipe: true, menuSlots: 12 }, 'arrozDeVitela', 'joana')).toBeNull();
  });

  it('is found by week 3 at the latest, with a note in the morning news', () => {
    const state = { ...newGame(2), day: SECRET_RECIPE.unlockByDay - 1 };
    const { state: next } = playDay(state);
    expect(next.secretRecipe).toBe(true);
    expect(next.news.map((n) => n.title)).toContain(SECRET_RECIPE.news.title);
    // ...and only once.
    expect(playDay(next).state.news.map((n) => n.title)).not.toContain(SECRET_RECIPE.news.title);
  });

  it('has the biggest combo in the game with a glass of cytrynówka', () => {
    expect(pairingQuality(arroz(['cytrynowka']))).toBe(20);
    expect(pairingQuality(arroz())).toBe(0);
  });
});

describe('the Friday regular', () => {
  it('books a table every Friday, and only on Fridays', () => {
    const friday = conditionsFor({ ...newGame(3), day: FRIDAY });
    expect(friday.bookings.filter((b) => b.regular)).toHaveLength(1);
    expect(conditionsFor({ ...newGame(3), day: FRIDAY + 1 }).bookings.some((b) => b.regular)).toBe(false);
  });

  it('is delighted with cytrynówka and says so loudly without it', () => {
    const base = { group: REGULAR.group, street: 'ul. Ogarna', satisfaction: 70, critic: false, regular: true };
    const factors = { quality: 0.3, value: 0, wait: 0, ambiance: 0, service: 0 };
    const happy = writeReview(createRng(1), { ...base, factors, order: [arroz(['cytrynowka'])] });
    expect(happy.stars).toBe(5);
    expect(REGULAR.happy).toContain(happy.text);
    const grumpy = writeReview(createRng(1), { ...base, factors, order: [arroz()] });
    expect(grumpy.text.startsWith(REGULAR.shout)).toBe(true);
    expect(grumpy.stars).toBeLessThanOrEqual(3);
  });

  it('is just as happy with cytrynówka as a drink', () => {
    let state = { ...newGame(9), day: FRIDAY, menuSlots: 12 };
    state = addDish(state, 'cytrynowka', 'homemade');
    const { summary } = playDay(state);
    expect(summary.reviews.find((r) => r.reviewer === REGULAR.name)?.stars).toBe(5);
  });

  it('orders the dish with cytrynówka when there is one, and always writes a review', () => {
    let state = { ...newGame(4), day: FRIDAY, secretRecipe: true, menuSlots: 12 };
    state = addDish(state, 'zurek', 'classic', ['cytrynowka']);
    expect(playerOf(state).menu.some((d) => d.extras?.includes('cytrynowka'))).toBe(true);
    const { summary } = playDay(state);
    const review = summary.reviews.find((r) => r.reviewer === REGULAR.name);
    expect(review).toBeDefined();
    expect(review!.stars).toBe(5);
  });
});

describe('Tomek and Adrian', () => {
  it('look for work from weeks 2 and 3, and come back every few weeks until hired', () => {
    expect(specialsLookingForWork(0, [])).toEqual([]);
    expect(specialsLookingForWork(7, [])).toEqual(['tomek']);
    expect(specialsLookingForWork(14, [])).toEqual(['adrian']);
    expect(specialsLookingForWork(7 + SPECIAL_STAFF.tomek.everyDays, [])).toEqual(['tomek']);
    expect(specialsLookingForWork(7 + SPECIAL_STAFF.tomek.everyDays, [specialCandidate('tomek', 99)])).toEqual([]);
  });

  it('join the Monday candidates', () => {
    const { state } = playDay({ ...newGame(5), day: 6 });
    const tomek = state.candidates.find((c) => c.special === 'tomek');
    expect(tomek?.name).toBe('Tomek Graczyk');
    expect(tomek?.wage).toBe(SPECIAL_STAFF.tomek.wage);
    expect(Math.min(...state.candidates.filter((c) => c !== tomek).map((c) => c.wage))).toBeGreaterThan(tomek!.wage);
  });

  it('Tomek costs reputation every day he works', () => {
    const state = newGame(6);
    const withTomek = { ...state, team: [...state.team, specialCandidate('tomek', 99)] };
    const open = openRestaurant(withTomek);
    while (!open.progress.done) playTick(open);
    const { state: after, summary } = closeDay(withTomek, open);
    const loss = SPECIAL_STAFF.tomek.reputationLossPerDay!;
    for (const [group, rep] of Object.entries(open.progress.restaurants[0].reputation)) {
      expect(playerOf(after).reputation[group as GroupId]).toBeCloseTo(Math.max(0, rep - loss));
    }
    expect(summary.staffNews.some((line) => line.includes('Tomek'))).toBe(true);
  });

  it('Adrian turns up about half the time, and the restaurant manages without him when he doesn’t', () => {
    const state = newGame(7);
    const adrian = specialCandidate('adrian', 99);
    const team = [...state.team, adrian];
    let absences = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const open = openRestaurant({ ...state, team, rng: createRng(seed) });
      const waitersToday = open.progress.restaurants[0].waiters.length;
      if (open.absent.length > 0) {
        absences++;
        expect(open.absent[0].name).toBe(adrian.name);
        expect(waitersToday).toBe(1);
      } else {
        expect(waitersToday).toBe(2);
      }
    }
    expect(absences).toBeGreaterThan(15);
    expect(absences).toBeLessThan(45);
  });
});

describe('Mariacka', () => {
  it('has its amber evening on 20 May, with a crowd on the street', () => {
    const may20 = nextDayOn(5, 20, 0);
    expect(calendarEventsOn(may20)).toContain('amberEvening');
    expect(calendarEventsOn(may20 - 1)).not.toContain('amberEvening');
    expect(conditionsFor({ ...newGame(8), day: may20 }).locations.mariacka).toBeGreaterThan(1);
  });
});
