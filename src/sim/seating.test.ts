import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { FAVOURITE_SPOTS, GROUP_IDS } from '../data/groups';
import { LOCATION_IDS } from '../data/locations';
import { floorView } from './day';
import { closeDay, moveGuests, newGame, openRestaurant, playTick, type OpenDay } from './game';
import { isFavourite, maxTablesAt, spotsOf } from './seating';

/** A day with a party sitting at table `table`, not yet served. */
function seatedAt(table: number, group: (typeof GROUP_IDS)[number] = 'locals', size = 2): OpenDay {
  const open = openRestaurant({ ...newGame(41), day: 62, weather: 'sunny', terracePermitUntilDay: 200 });
  const player = open.progress.restaurants[0];
  open.progress.floors[0].visits.push({
    party: { group, size, origin: player.location, arrivalMinute: 660 },
    tablesUsed: Math.ceil(size / 4),
    tables: size > 4 ? [table, table + 1] : [table],
    order: player.menu.slice(0, 1),
    seatedAt: 660,
    orderedAt: 670,
    readyAt: null,
    skipped: false,
    quality: 0,
    eating: false,
    leaveAt: 0,
    satisfaction: null,
    mood: 0,
    extraPatience: 0,
  });
  open.progress.floors[0].freeTables -= Math.ceil(size / 4);
  return open;
}

describe('favourite spots', () => {
  it('every group has one, and every room has somewhere for each', () => {
    for (const location of LOCATION_IDS) {
      const tables = maxTablesAt(location);
      const spots = new Set([...Array(tables + 2).keys()].flatMap((t) => spotsOf(location, tables, t)));
      for (const group of GROUP_IDS) {
        expect(FAVOURITE_SPOTS[group].length).toBeGreaterThan(0);
        expect(FAVOURITE_SPOTS[group].some((spot) => spots.has(spot)), `${group} in ${location}`).toBe(true);
      }
    }
  });

  it('knows the terrace, the window wall, the back and the front', () => {
    // Ogarna holds 6 tables inside: two rows of three. Table 0 is back by the window.
    expect(maxTablesAt('ogarna')).toBe(6);
    expect(spotsOf('ogarna', 6, 0)).toEqual(['window', 'back']);
    expect(spotsOf('ogarna', 6, 4)).toEqual(['front']);
    expect(spotsOf('ogarna', 6, 6)).toEqual(['terrace']);
    expect(isFavourite('tourists', 'ogarna', 6, 6)).toBe(true);
    expect(isFavourite('locals', 'ogarna', 6, 1)).toBe(true);
    expect(isFavourite('locals', 'ogarna', 6, 4)).toBe(false);
  });
});

describe('showing guests to another table', () => {
  it('moves a party to a free table, happier if it is a favourite spot', () => {
    const open = seatedAt(4, 'locals');
    const result = moveGuests(open, 4, 1);
    expect(result).toEqual({ favourite: true });
    const visit = open.progress.floors[0].visits.at(-1)!;
    expect(visit.tables).toEqual([1]);
    expect(visit.mood).toBe(balance.seating.favouriteMood);
    expect(floorView(open.progress, 0).tables[1]?.moved).toBe(true);
    expect(open.seating).toEqual({ moved: 1, favourites: 1 });
  });

  it('only to a free table, once per party, and not once the food has come', () => {
    // A new game has 4 tables inside (0–3) and, with the permit, 2 on the terrace (4–5).
    const open = seatedAt(0, 'office');
    const other = seatedAt(2, 'students');
    open.progress.floors[0].visits.push(other.progress.floors[0].visits.at(-1)!);
    expect(moveGuests(open, 0, 2)).toBeNull();
    // Table 3 is in the front row, by the door: office workers like it there.
    expect(moveGuests(open, 0, 3)).toEqual({ favourite: true });
    expect(moveGuests(open, 3, 1)).toBeNull();
    const eating = seatedAt(4);
    eating.progress.floors[0].visits.at(-1)!.eating = true;
    expect(moveGuests(eating, 4, 1)).toBeNull();
  });

  it('big parties at two tables stay where they are', () => {
    const open = seatedAt(0, 'tourists', 6);
    expect(moveGuests(open, 0, 4)).toBeNull();
  });

  it('a move to an ordinary table changes nothing but the table', () => {
    const open = seatedAt(4, 'foodies');
    expect(moveGuests(open, 4, 5)).toEqual({ favourite: false });
    expect(open.progress.floors[0].visits.at(-1)!.mood).toBe(0);
  });

  it('counts in the day report', () => {
    const state = newGame(42);
    const open = seatedAt(4, 'locals');
    moveGuests(open, 4, 1);
    while (!open.progress.done) playTick(open);
    expect(closeDay(state, open).summary.seating).toEqual({ moved: 1, favourites: 1 });
  });
});
