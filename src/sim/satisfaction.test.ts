import { describe, expect, it } from 'vitest';
import { satisfactionFactors, satisfactionScore, updatedReputation, type VisitDetails } from './satisfaction';

const ordinaryVisit: VisitDetails = {
  group: 'locals',
  quality: 60,
  bill: 100,
  typicalBill: 100,
  waitMinutes: 15,
  orderMinutes: 5,
  waiterSkill: 3,
  ambiance: 50,
};

const score = (changes: Partial<VisitDetails>) =>
  satisfactionScore(satisfactionFactors({ ...ordinaryVisit, ...changes }));

describe('satisfaction factors', () => {
  const factors = (changes: Partial<VisitDetails>) => satisfactionFactors({ ...ordinaryVisit, ...changes });

  it('scores food against what the group expects', () => {
    // Locals expect quality 60.
    expect(factors({ quality: 60 }).quality).toBe(0);
    expect(factors({ quality: 90 }).quality).toBe(1);
    expect(factors({ quality: 30 }).quality).toBe(-1);
    expect(factors({ quality: 100 }).quality).toBe(1);
  });

  it('scores typical prices as neutral value', () => {
    expect(factors({ bill: 100, typicalBill: 100 }).value).toBeCloseTo(0);
  });

  it('scores waits against the group’s patience', () => {
    // Locals wait up to 45 minutes.
    expect(factors({ waitMinutes: 0 }).wait).toBe(1);
    expect(factors({ waitMinutes: 22.5 }).wait).toBeCloseTo(0);
    expect(factors({ waitMinutes: 45 }).wait).toBe(-1);
  });

  it('scores ambiance around a middle of 50', () => {
    expect(factors({ ambiance: 50 }).ambiance).toBe(0);
    expect(factors({ ambiance: 100 }).ambiance).toBe(1);
  });
});

describe('satisfaction', () => {
  it('turns all-neutral factors into exactly 50', () => {
    expect(satisfactionScore({ quality: 0, value: 0, wait: 0, ambiance: 0, service: 0 })).toBe(50);
    expect(satisfactionScore({ quality: 1, value: 1, wait: 1, ambiance: 1, service: 1 })).toBeCloseTo(100);
  });

  it('rates an ordinary visit as roughly fine', () => {
    const base = score({});
    expect(base).toBeGreaterThan(45);
    expect(base).toBeLessThan(70);
  });

  it('rises with better food, lower prices and shorter waits', () => {
    const base = score({});
    expect(score({ quality: 80 })).toBeGreaterThan(base);
    expect(score({ bill: 80 })).toBeGreaterThan(base);
    expect(score({ waitMinutes: 5 })).toBeGreaterThan(base);
    expect(score({ ambiance: 90 })).toBeGreaterThan(base);
  });

  it('bothers students about prices more than foodies', () => {
    const studentValue = satisfactionFactors({ ...ordinaryVisit, group: 'students', bill: 130 }).value;
    const foodieValue = satisfactionFactors({ ...ordinaryVisit, group: 'foodies', bill: 130 }).value;
    expect(studentValue).toBeLessThan(foodieValue);
  });

  it('stays between 0 and 100 even for extreme visits', () => {
    const worst = score({ quality: 0, bill: 500, waitMinutes: 200, orderMinutes: 60, waiterSkill: 1, ambiance: 0 });
    const best = score({ quality: 100, bill: 10, waitMinutes: 0, orderMinutes: 0, waiterSkill: 5, ambiance: 100 });
    expect(worst).toBeGreaterThanOrEqual(0);
    expect(best).toBeLessThanOrEqual(100);
  });
});

describe('reputation', () => {
  it('moves slowly towards satisfaction', () => {
    const after = updatedReputation(50, 90);
    expect(after).toBeGreaterThan(50);
    expect(after).toBeLessThan(55);
    expect(updatedReputation(50, 10)).toBeLessThan(50);
  });
});
