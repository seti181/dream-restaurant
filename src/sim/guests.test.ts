import { describe, expect, it } from 'vitest';
import { dateOf, nextDayOn } from './calendar';
import { balance } from '../data/balance';
import { GROUP_IDS, GROUPS } from '../data/groups';
import { LOCATIONS } from '../data/locations';
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
    // Both on a Thursday: 1 August, and 3 April in free play the next spring.
    const firstOfAugust = nextDayOn(8, 1, 0);
    const aprilThursday = nextDayOn(4, 3, 0);
    expect(expectedGuests('dluga', 'tourists', firstOfAugust, NOON)).toBeGreaterThan(
      expectedGuests('dluga', 'tourists', aprilThursday, NOON),
    );
  });

  it('multiplies street and group weekend factors on Saturdays', () => {
    const SATURDAY = 5; // same month as MONDAY, so only the weekend differs
    const ratio = expectedGuests('ogarna', 'locals', SATURDAY, NOON) / expectedGuests('ogarna', 'locals', MONDAY, NOON);
    expect(ratio).toBeCloseTo(LOCATIONS.ogarna.weekendFactor * GROUPS.locals.weekendFactor);
  });

  it('matches the street’s peak traffic at its busiest hour', () => {
    // 13:00 is Ogarna's peak hour. Summing every group gives the whole street.
    const ONE_PM = 24;
    const total = GROUP_IDS.reduce((sum, g) => {
      const people = GROUPS[g];
      const month = dateOf(MONDAY).month - 1;
      return sum + expectedGuests('ogarna', g, MONDAY, ONE_PM) / (people.timeOfDay.lunch * people.monthFactors[month]);
    }, 0);
    expect(total).toBeCloseTo(LOCATIONS.ogarna.peakGuestsPerHour * (balance.clock.tickMinutes / 60));
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
