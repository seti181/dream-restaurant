import { describe, expect, it } from 'vitest';
import { DECOR_IDS } from '../../data/decor';
import { EQUIPMENT_IDS } from '../../data/equipment';
import { LOCATIONS } from '../../data/locations';
import { balance } from '../../data/balance';
import type { Weather } from '../../data/weather';
import { GROUP_LOOKS, type SketchKind } from './cast';
import { frontLayout, moveWalk, PITCH, serveWalk, walkIn } from './frontRoom';
import { Painter, svgPicture } from './painter';
import { chairsPicture, hatchCounterPicture, pageFramePicture, platesPicture, roomPicture, tablePicture } from './roomArt';
import { chefSheet, guestSheet, musicianSheet, waiterSheet } from './sheets';
import { doorWalk, passerWalk, streetLayout, streetQueueSpot, terraceMove, terraceServe, terraceWalkIn, toTheDoor, whatNeedsYou } from './street';
import { streetPicture } from './streetArt';
import type { LocationId } from '../../data/locations';
import type { TableGuests } from '../../sim/day';
import { ICON_CELL, ICON_COLUMNS, ICON_ROWS, iconForEmoji, iconOf, iconSheet } from './icons';
import { WISHES } from '../../data/wishes';
import { REGULARS } from '../../data/regulars';

/** Every id defined in an SVG, in order. */
const idsOf = (svg: string) => [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);

/** A picture that will bake: no broken numbers, its own ids, and only pointing at ids it has. */
function expectSound(svg: string) {
  expect(svg).not.toMatch(/NaN|undefined|Infinity/);
  const ids = idsOf(svg);
  expect(new Set(ids).size).toBe(ids.length);
  for (const [, ref] of svg.matchAll(/url\(#([^)]+)\)/g)) expect(ids).toContain(ref);
}

const SLOTS = [...new Set(Object.values(LOCATIONS).map((l) => Math.floor(l.maxSeats / balance.service.seatsPerTable)))];
const ASPECTS = [1364 / 603, 850 / 530];

describe('the room seen from the front', () => {
  it('has a spot for every table the premises can hold, inside the room', () => {
    for (const slots of SLOTS)
      for (const aspect of ASPECTS) {
        const L = frontLayout(slots, aspect);
        expect(L.tables).toHaveLength(slots);
        expect(L.height).toBeGreaterThanOrEqual(603);
        for (const t of L.tables) {
          for (const s of t.seats) {
            expect(s.x).toBeGreaterThan(L.bar.x1 - 20);
            expect(s.x).toBeLessThan(L.door.x - L.door.width / 2);
            expect(s.y).toBeGreaterThan(L.floorY);
            expect(s.y).toBeLessThan(L.height);
          }
        }
      }
  });

  it('keeps tables in a row apart, and rows nearer us lower and bigger', () => {
    for (const slots of SLOTS) {
      const L = frontLayout(slots, ASPECTS[0]);
      for (const a of L.tables)
        for (const b of L.tables) if (a !== b && a.row === b.row) expect(Math.abs(a.x - b.x)).toBeGreaterThanOrEqual(PITCH - 1);
      for (let r = 1; r < L.rows.length; r++) {
        expect(L.rows[r].top).toBeGreaterThan(L.rows[r - 1].top);
        expect(L.rows[r].scale).toBeGreaterThan(L.rows[r - 1].scale);
      }
    }
  });

  it('fills the screen it is shaped for', () => {
    for (const slots of SLOTS)
      for (const aspect of ASPECTS) {
        const L = frontLayout(slots, aspect);
        expect(Math.abs(L.width / L.height - aspect) < 0.05 || L.height === 603).toBe(true);
      }
  });

  it('walks every guest from the door to their seat, and waiters from the pass to the table', () => {
    for (const slots of SLOTS) {
      const L = frontLayout(slots, ASPECTS[0]);
      L.tables.forEach((t, table) => {
        t.seats.forEach((s, seat) => {
          const path = walkIn(L, table, seat);
          expect(Math.abs(path[0].x - L.door.x)).toBeLessThan(L.door.width / 2);
          expect(path.at(-1)).toMatchObject({ x: s.x, y: s.y });
        });
        expect(serveWalk(L, table)[0]).toMatchObject(L.pass);
        const moved = moveWalk(L, table, 0, (table + 1) % slots, 1);
        expect(moved.at(-1)).toMatchObject({ x: L.tables[(table + 1) % slots].seats[1].x });
      });
    }
  });
});

describe('the street outside', () => {
  const streets = (Object.keys(LOCATIONS) as LocationId[]).flatMap((id) =>
    [0, Math.floor(LOCATIONS[id].terraceSeats / balance.service.seatsPerTable)].flatMap((terrace) => ASPECTS.map((aspect) => ({ id, terrace, aspect }))),
  );

  it('has a spot for every terrace table, on the pavement to the right of the door', () => {
    for (const { id, terrace, aspect } of streets) {
      const L = streetLayout(terrace, aspect, id);
      expect(L.tables).toHaveLength(terrace);
      expect(L.height).toBeGreaterThanOrEqual(603);
      for (const t of L.tables) {
        expect(t.x).toBeGreaterThan(L.door.x + L.door.width);
        for (const s of t.seats) {
          expect(s.x).toBeGreaterThan(0);
          expect(s.x).toBeLessThan(L.width);
          expect(s.y).toBeGreaterThan(L.backLane);
          expect(s.y).toBeLessThan(L.frontLane);
        }
      }
      for (const a of L.tables) for (const b of L.tables) if (a !== b && a.row === b.row) expect(Math.abs(a.x - b.x)).toBeGreaterThanOrEqual(PITCH - 1);
    }
  });

  it('lines the street with houses that never overlap, leaving the Żuraw its quay', () => {
    for (const { id, terrace, aspect } of streets) {
      const L = streetLayout(terrace, aspect, id);
      const all = [L.home, ...L.houses].sort((a, b) => a.x0 - b.x0);
      for (let i = 1; i < all.length; i++) expect(all[i].x0).toBeGreaterThanOrEqual(all[i - 1].x1 - 1);
      expect(all.at(-1)!.x1).toBeGreaterThanOrEqual(L.width);
      for (const h of all) expect(h.top).toBeLessThan(L.ground);
      if (id === 'pobrzeze') expect(all[0].x0).toBeGreaterThanOrEqual(300);
      else expect(all[0].x0).toBeLessThanOrEqual(0);
      expect(L.river).toBe(id === 'pobrzeze' || id === 'spichrzow');
    }
  });

  it('walks guests to the terrace and the door, waiters out of the door, and passers right across', () => {
    for (const { id, terrace } of streets) {
      const L = streetLayout(terrace, ASPECTS[0], id);
      L.tables.forEach((t, spot) => {
        t.seats.forEach((s, seat) => {
          const path = terraceWalkIn(L, spot, seat);
          expect(path[0].x < 0 || path[0].x > L.width).toBe(true);
          expect(path.at(-1)).toMatchObject({ x: s.x, y: s.y });
        });
        expect(terraceServe(L, spot)[0].x).toBe(L.door.x);
        const next = (spot + 1) % terrace;
        expect(terraceMove(L, spot, 0, next, 1).at(-1)).toMatchObject({ x: L.tables[next].seats[1].x, y: L.tables[next].seats[1].y });
      });
      for (const fromLeft of [true, false]) expect(Math.abs(doorWalk(L, 2, fromLeft).at(-1)!.x - L.door.x)).toBeLessThan(L.door.width / 2);
      for (const back of [true, false])
        for (const ltr of [true, false]) {
          const [a, b] = passerWalk(L, back, ltr);
          expect(Math.min(a.x, b.x)).toBeLessThan(0);
          expect(Math.max(a.x, b.x)).toBeGreaterThan(L.width);
          expect(a.x < b.x).toBe(ltr);
        }
      const handed = toTheDoor(L, { x: 900, y: L.frontLane, z: 60 });
      expect(handed.at(-1)!.x).toBe(L.door.x);
      for (let place = 0; place < 4; place++) expect(streetQueueSpot(L, place, 3).x).toBeGreaterThan(0);
    }
  });

  it('badges the switch with what needs the player on the other side', () => {
    const waiting = { stage: 'waiting' } as TableGuests;
    const help = (g: TableGuests | null) => g !== null && g.stage === 'waiting';
    const floor = { tables: [null, waiting, null], insideTables: 2, gull: null, atTheDoor: [] };
    expect(whatNeedsYou(floor, help)).toEqual({ inside: 'help', outside: null });
    expect(whatNeedsYou({ ...floor, tables: [null, null, waiting] }, help)).toEqual({ inside: null, outside: 'help' });
    expect(whatNeedsYou({ ...floor, atTheDoor: [{}] } as never, help).outside).toBe('hourglass');
    expect(whatNeedsYou({ ...floor, gull: {}, atTheDoor: [{}] } as never, help).outside).toBe('mewa');
  });
});

describe('the pictures', () => {
  const weathers: Weather[] = ['sunny', 'heatwave', 'cloudy', 'rain'];

  it('draw the room for every premises, with all decor or none, in every weather', () => {
    for (const slots of SLOTS)
      for (const [i, weather] of weathers.entries()) {
        const L = frontLayout(slots, ASPECTS[i % 2]);
        const look = {
          decor: i % 2 ? DECOR_IDS : [],
          equipment: i % 2 ? EQUIPMENT_IDS : [],
          weather,
          dusk: i === 3,
          plaque: i % 2 === 1,
          specials: [{ name: 'Żurek', price: 28 }],
        };
        expectSound(svgPicture(L.width, L.height, roomPicture(new Painter(), L, look)));
        expectSound(svgPicture(L.width, L.height, hatchCounterPicture(new Painter(), L) + pageFramePicture(new Painter(), L.width, L.height)));
      }
  });

  it('draw every street, with or without a terrace, in every weather, by day and at dusk', () => {
    for (const id of Object.keys(LOCATIONS) as LocationId[])
      for (const [i, weather] of weathers.entries()) {
        const L = streetLayout(i % 2 ? Math.floor(LOCATIONS[id].terraceSeats / balance.service.seatsPerTable) : 0, ASPECTS[i % 2], id);
        const look = { weather, dusk: i >= 2, name: 'Joanna’s & Co <Kitchen>', special: i % 2 ? 'Żurek' : null, terraceOpen: i % 2 === 1 };
        const svg = svgPicture(L.width, L.height, streetPicture(new Painter(), L, look));
        expectSound(svg);
        expect(svg).not.toContain('<Kitchen>');
      }
    const L = streetLayout(4, ASPECTS[0], 'dluga');
    const look = { weather: 'sunny' as const, dusk: false, name: 'Kitchen', special: 'Pierogi', terraceOpen: true };
    // Held upright the page is taller, and the towers and the sky stay just above the roofs, not stretched up from the top.
    for (const id of Object.keys(LOCATIONS) as LocationId[]) {
      const tall = streetLayout(0, 0.6, id);
      const svg = streetPicture(new Painter(), tall, look);
      expectSound(svgPicture(tall.width, tall.height, svg));
      // A tower is a brick path 120 (St Mary's) or 56 (the Town Hall) wide; its height must stay a tower's, not the page's.
      const towers = [...svg.matchAll(/h(?:120|56) v([\d.]+) h-(?:120|56) Z" fill="#b9694c"/g)].map((m) => Number(m[1]));
      if (['dluga', 'mariacka', 'ogarna', 'piwna'].includes(id)) expect(towers.length).toBeGreaterThan(0);
      for (const height of towers) expect(height).toBeLessThan(500);
    }
    expect(streetPicture(new Painter(), L, look)).toBe(streetPicture(new Painter(), L, look));
  });

  it('draw the same room the same way every time', () => {
    const L = frontLayout(8, ASPECTS[0]);
    const look = { decor: DECOR_IDS, equipment: EQUIPMENT_IDS, weather: 'sunny' as const, dusk: false, plaque: true, specials: [] };
    expect(roomPicture(new Painter(), L, look)).toBe(roomPicture(new Painter(), L, look));
  });

  it('draw tables, chairs and plates', () => {
    for (const embroidered of [false, true]) for (const oak of [false, true]) expectSound(svgPicture(268, 220, tablePicture(new Painter(), embroidered, oak)));
    expectSound(svgPicture(268, 220, chairsPicture(new Painter())));
    expectSound(svgPicture(320, 40, platesPicture(new Painter())));
  });

  it('draw everyone in every pose', () => {
    const kinds: SketchKind[] = ['tourists', 'students', 'locals', 'office', 'foodies', 'critic', 'regular', 'filip', 'fletcher', 'henryk', 'weronika', 'walesa', 'guard', 'footballer'];
    for (const kind of kinds) for (let v = 0; v < GROUP_LOOKS; v++) expectSound(svgPicture(2860, 340, guestSheet(new Painter(), kind, v)));
    for (const kind of ['waiter', 'tomek', 'adrian'] as const) expectSound(svgPicture(1100, 340, waiterSheet(new Painter(), kind, 2)));
    for (let v = 0; v < 6; v++) expectSound(svgPicture(750, 340, chefSheet(new Painter(), v)));
    expectSound(svgPicture(500, 340, musicianSheet(new Painter())));
  });
});

describe('the icons', () => {
  it('are drawn soundly', () => {
    expectSound(svgPicture(ICON_COLUMNS * ICON_CELL, ICON_ROWS * ICON_CELL, iconSheet(new Painter())));
  });

  it('have a drawing for every emoji the game writes anywhere', () => {
    // Every source file of the game, as text.
    const sources = import.meta.glob(['/src/**/*.ts', '/src/**/*.tsx', '!/src/**/*.test.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    expect(Object.keys(sources).length).toBeGreaterThan(100);
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    const missing = new Set<string>();
    for (const [file, text] of Object.entries(sources))
      for (const { segment } of segmenter.segment(text))
        if (/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(segment) && !iconForEmoji(segment)) missing.add(`${segment} (${file})`);
    expect([...missing]).toEqual([]);
  });

  it('have a drawing for every wish and every regular', () => {
    for (const wish of Object.values(WISHES)) expect(iconOf(wish.bubble)?.after).toMatch(/^[?!]$/);
    for (const regular of Object.values(REGULARS)) expect(iconOf(regular.emoji)).not.toBeNull();
  });
});
