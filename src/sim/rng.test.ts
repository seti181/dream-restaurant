import { describe, expect, it } from 'vitest';
import { chance, createRng, nextFloat, nextInt, pick } from './rng';

function firstFloats(seed: number, count: number): number[] {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => nextFloat(rng));
}

describe('rng', () => {
  it('gives the same sequence for the same seed', () => {
    expect(firstFloats(42, 20)).toEqual(firstFloats(42, 20));
  });

  it('gives different sequences for different seeds', () => {
    expect(firstFloats(1, 20)).not.toEqual(firstFloats(2, 20));
  });

  it('continues identically after a save and load', () => {
    const rng = createRng(7);
    for (let i = 0; i < 5; i++) nextFloat(rng);
    const loaded = JSON.parse(JSON.stringify(rng));
    expect(nextFloat(loaded)).toBe(nextFloat(rng));
  });

  it('keeps floats in [0, 1) and roughly evenly spread', () => {
    const values = firstFloats(123, 10_000);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    expect(mean).toBeCloseTo(0.5, 1);
  });

  it('gives integers within both bounds and reaches each of them', () => {
    const rng = createRng(99);
    const seen = new Set<number>();
    for (let i = 0; i < 1_000; i++) seen.add(nextInt(rng, 1, 6));
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('respects certain and impossible chances', () => {
    const rng = createRng(5);
    for (let i = 0; i < 100; i++) {
      expect(chance(rng, 1)).toBe(true);
      expect(chance(rng, 0)).toBe(false);
    }
  });

  it('picks items from the list and refuses an empty list', () => {
    const rng = createRng(3);
    const items = ['żurek', 'pierogi', 'sernik'];
    for (let i = 0; i < 50; i++) expect(items).toContain(pick(rng, items));
    expect(() => pick(rng, [])).toThrow();
  });
});
