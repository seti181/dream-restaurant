import { describe, expect, it } from 'vitest';
import { GROUPS } from '../data/groups';
import { expectedGuests, generateParties } from './guests';
import { createRng } from './rng';

const MONDAY = 0;
const SUNDAY = 6;
const NOON = 12; // tick 12 = 12:00
const EVENING = 96; // tick 96 = 19:00

describe('guest generation', () => {
  it('sends office workers out for weekday lunch, not on Sundays or in the evening', () => {
    expect(expectedGuests('spichrzow', 'office', MONDAY, NOON)).toBeGreaterThan(0);
    expect(expectedGuests('spichrzow', 'office', SUNDAY, NOON)).toBe(0);
    expect(expectedGuests('spichrzow', 'office', MONDAY, EVENING)).toBe(0);
  });

  it('brings more tourists to Długa than to quiet Ogarna', () => {
    expect(expectedGuests('dluga', 'tourists', MONDAY, NOON)).toBeGreaterThan(
      expectedGuests('ogarna', 'tourists', MONDAY, NOON) * 5,
    );
  });

  it('brings more tourists in summer than in April', () => {
    const firstOfAugust = 122;
    expect(expectedGuests('dluga', 'tourists', firstOfAugust, NOON)).toBeGreaterThan(
      expectedGuests('dluga', 'tourists', MONDAY, NOON),
    );
  });

  it('makes the same parties from the same seed', () => {
    expect(generateParties(createRng(8), 3, NOON)).toEqual(generateParties(createRng(8), 3, NOON));
  });

  it('makes parties of the right size for their group', () => {
    const rng = createRng(4);
    for (let tick = 0; tick < 132; tick += 6) {
      for (const party of generateParties(rng, 5, tick)) {
        const { min, max } = GROUPS[party.group].partySize;
        expect(party.size).toBeGreaterThanOrEqual(min);
        expect(party.size).toBeLessThanOrEqual(max);
      }
    }
  });
});
