// Seeded random number generator (mulberry32).
// The same seed always gives the same sequence, so a whole season can be replayed.
// The state is a plain object with one number, so it can be saved as JSON.
// Use this everywhere in the simulation instead of Math.random().

export interface RngState {
  s: number;
}

export function createRng(seed: number): RngState {
  return { s: seed >>> 0 };
}

/** A float in [0, 1). Advances the generator. */
export function nextFloat(rng: RngState): number {
  rng.s = (rng.s + 0x6d2b79f5) >>> 0;
  let t = rng.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** An integer from min to max, both included. */
export function nextInt(rng: RngState, min: number, max: number): number {
  return min + Math.floor(nextFloat(rng) * (max - min + 1));
}

/** True with the given probability (0–1). */
export function chance(rng: RngState, probability: number): boolean {
  return nextFloat(rng) < probability;
}

/** A random whole number that averages `mean` over many draws (Poisson distribution). */
export function poisson(rng: RngState, mean: number): number {
  if (mean <= 0) return 0;
  const limit = Math.exp(-mean);
  let count = 0;
  let product = nextFloat(rng);
  while (product > limit) {
    count++;
    product *= nextFloat(rng);
  }
  return count;
}

/** A random item from a non-empty list. */
export function pick<T>(rng: RngState, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick() needs at least one item');
  return items[nextInt(rng, 0, items.length - 1)];
}
