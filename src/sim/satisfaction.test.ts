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

describe('satisfaction', () => {
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
