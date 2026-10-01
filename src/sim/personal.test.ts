import { describe, expect, it } from 'vitest';
import type { MenuDish } from '../data/dishes';
import { REGULAR, SECRET_RECIPE } from '../data/personal';
import { addDish, dishUnavailableReason } from './actions';
import { conditionsFor } from './events';
import { closeDay, newGame, openRestaurant, playerOf, playTick } from './game';
import { pairingQuality } from './menu';
import { writeReview } from './reviews';
import { createRng } from './rng';

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
