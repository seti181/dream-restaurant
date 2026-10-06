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
import { chefSheet, guestSheet, waiterSheet } from './sheets';
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
