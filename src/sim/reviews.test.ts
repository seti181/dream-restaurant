import { describe, expect, it } from 'vitest';
import type { MenuDish } from '../data/dishes';
import { CRITIC_NAME, REVIEWER, WALKOUT_LINES } from '../data/reviews';
import { writeReview, type ReviewInput } from './reviews';
import { createRng } from './rng';

const pierogi: MenuDish = { template: 'pierogi', variant: 'ruskie', price: 36 };
const neutral = { quality: 0, value: 0, wait: 0, ambiance: 0, service: 0 };

const input = (changes: Partial<ReviewInput>): ReviewInput => ({
  group: 'locals',
  order: [pierogi],
  street: 'ul. Piwna',
  factors: neutral,
  satisfaction: 50,
  critic: false,
  ...changes,
});

describe('reviews', () => {
  it('turn satisfaction into 1–5 stars', () => {
    const rng = createRng(1);
    expect(writeReview(rng, input({ satisfaction: 5 })).stars).toBe(1);
    expect(writeReview(rng, input({ satisfaction: 50 })).stars).toBe(3);
    expect(writeReview(rng, input({ satisfaction: 95 })).stars).toBe(5);
    expect(writeReview(rng, input({ satisfaction: 100 })).stars).toBe(5);
  });

  it('praise what went well and grumble about what didn’t', () => {
    const review = writeReview(
      createRng(2),
      input({ factors: { ...neutral, quality: 0.8, service: -0.7 }, satisfaction: 60 }),
    );
    expect(review.text).toContain('pierogi');
    expect(review.text).toMatch(/, but .*(waiter|order|bill)/);
  });

  it('vary what they talk about', () => {
    const factors = { quality: 0.6, value: 0.5, wait: -0.5, ambiance: -0.6, service: 0 };
    const texts = new Set(Array.from({ length: 40 }, (_, i) => writeReview(createRng(i), input({ factors })).text));
    expect(texts.size).toBeGreaterThan(10);
  });

  it('use the player’s own name for a dish', () => {
    const named: MenuDish = { ...pierogi, name: 'Babcia’s Best' };
    const review = writeReview(createRng(3), input({ order: [named], factors: { ...neutral, quality: 0.9 } }));
    if (review.text.includes('Babcia')) expect(review.text).toContain('“Babcia’s Best”');
  });

  it('give one star to guests who walked out', () => {
    const review = writeReview(createRng(4), input({ factors: null, satisfaction: 10 }));
    expect(review.stars).toBe(1);
    expect(WALKOUT_LINES).toContain(review.text);
  });

  it('say who wrote them', () => {
    expect(writeReview(createRng(5), input({ group: 'students' })).reviewer).toBe(REVIEWER.students);
    expect(writeReview(createRng(5), input({ critic: true })).reviewer).toBe(CRITIC_NAME);
  });

  it('sometimes drop a hint about a pairing', () => {
    const withDill: MenuDish = { template: 'fishSoup', variant: 'classic', price: 34, extras: ['dill'] };
    const texts = Array.from({ length: 30 }, (_, i) => writeReview(createRng(i), input({ order: [withDill] })).text);
    expect(texts).toContain('The dill and the fish were made for each other.');
  });
});
