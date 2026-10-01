import { describe, expect, it } from 'vitest';
import { balance } from '../../data/balance';
import { LOCATION_IDS, LOCATIONS } from '../../data/locations';
import { floorView, startDay, stepDay } from '../../sim/day';
import * as actions from '../../sim/actions';
import { answerTheMoment, newGame, openRestaurant, playTick, type GameState } from '../../sim/game';
import { specialCandidate } from '../../sim/staff';
import { drawCloud, drawSky, drawStreet } from './street';
import { PLINTH, drawRoom, guestKind, passerByPath, streetFurniture, roomLayout, scenePieces, seatsAt, servePath, waiterSpot, walkPath, type RoomLook } from './room';
import { HEADROOM, PERSON, personPixels, SEATED_ROWS, type PersonKind } from './sprites';

const look = (insideTables: number): RoomLook => ({ decor: [], equipment: ['stove'], weather: 'sunny', dusk: false, insideTables });

describe('the pixel-art room layout', () => {
  it.each(LOCATION_IDS)('fits every table %s can hold, chairs and all, without overlaps', (id) => {
    const maxTables = Math.floor(LOCATIONS[id].maxSeats / balance.service.seatsPerTable);
    const terraceTables = Math.floor(LOCATIONS[id].terraceSeats / balance.service.seatsPerTable);
    const layout = roomLayout(maxTables, terraceTables);
    expect(layout.inside.length).toBeGreaterThanOrEqual(maxTables);
    expect(layout.terrace).toHaveLength(terraceTables);

    // A table with its four chairs takes this much floor.
    const footprint = (s: { x: number; y: number }) => ({ x0: s.x - 8, x1: s.x + 24, y0: s.y - 8, y1: s.y + 24 });
    const inside = layout.inside.slice(0, maxTables).map(footprint);
    const terrace = layout.terrace.map(footprint);
    for (const f of inside) {
      expect(f.x0).toBeGreaterThanOrEqual(0);
      expect(f.x1).toBeLessThanOrEqual(layout.roomX);
      expect(f.y1).toBeLessThanOrEqual(layout.roomY);
      // Never in the kitchen corner.
      expect(f.x1 <= layout.kitchenX || f.y0 >= 44).toBe(true);
    }
    for (const f of terrace) {
      expect(f.y0).toBeGreaterThanOrEqual(layout.roomY);
      expect(f.x1).toBeLessThanOrEqual(layout.roomX);
      expect(f.y1).toBeLessThanOrEqual(layout.roomY + layout.terraceDepth);
    }
    const all = [...inside, ...terrace];
    all.forEach((a, i) =>
      all.slice(i + 1).forEach((b) => {
        const overlap = a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
        expect(overlap).toBe(false);
      }),
    );
    // Table corners land on whole pixel rows, so the art stays crisp.
    for (const s of [...layout.inside, ...layout.terrace]) expect((s.x + s.y) % 2).toBe(0);
  });

  it('draws a room picture of the promised size, see-through around the room so the street shows', () => {
    const layout = roomLayout(6, 2);
    const room = drawRoom(layout, look(4));
    expect(room.width).toBe(layout.width);
    expect(room.height).toBe(layout.height);
    expect(room.get(0, 0)).toBeNull();
  });

  it('dresses special guests: Wałęsa with his three bodyguards, and a footballer', () => {
    const open = openRestaurant(newGame(17));
    open.moments.pending = { id: 'walesa', minute: 11 * 60, table: null };
    answerTheMoment(open, 0);
    const table = floorView(open.progress, 0).tables.find((t) => t?.visitor === 'walesa')!;
    expect([0, 1, 2, 3].map((seat) => guestKind(table, seat))).toEqual(['walesa', 'guard', 'guard', 'guard']);
    for (const kind of ['walesa', 'guard', 'footballer'] as const) expect(personPixels(kind, 'front', 'sit').width).toBe(PERSON[0].length);
  });

  it('draws the street and the sky big enough to fill the frame together', () => {
    const layout = roomLayout(6, 2);
    const street = drawStreet(layout, look(4), layout.width + 80, layout.height + 40, 40, 20);
    const sky = drawSky(look(4), layout.width + 80, layout.height + 40);
    expect(street.width).toBe(layout.width + 80);
    for (let y = 0; y < street.height; y += 7) {
      for (let x = 0; x < street.width; x += 7) expect(street.get(x, y) ?? sky.get(x, y)).not.toBeNull();
    }
    // The bottom of the picture is street, the top corner is sky (with houses in between).
    expect(street.get(street.width / 2, street.height - 1)).not.toBeNull();
    expect(street.get(0, 0)).toBeNull();
  });

  it('puts the weather in the sky: a sun on clear days, the moon at dusk, nothing on a grey day', () => {
    const sun = (weather: RoomLook['weather'], dusk = false) => {
      const sky = drawSky({ ...look(4), weather, dusk }, 200, 100);
      return sky.get(Math.round(200 * 0.27), 10);
    };
    expect(sun('sunny')).not.toEqual(sun('cloudy'));
    expect(sun('sunny', true)).not.toEqual(sun('sunny'));
    expect(drawCloud({ ...look(4), weather: 'rain' }, 40, 1).bounds()).not.toBeNull();
  });

  it('turns a real moment of the day into furniture and people, back to front', () => {
    let state: GameState = { ...newGame(3), day: 62, cash: 1e6, weather: 'sunny' };
    state = actions.buyTerracePermit(state);
    state = actions.buyDecor(actions.buyDecor(state, 'pendantLights'), 'tablecloths');
    const open = openRestaurant(state);
    for (let i = 0; i < 40; i++) playTick(open);
    const floor = floorView(open.progress, 0);
    const layout = roomLayout(6, floor.tables.length - floor.insideTables);
    const pieces = scenePieces(layout, floor, { ...look(floor.insideTables), decor: state.restaurants[0].decor });

    const keys = pieces.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.filter((k) => k.startsWith('table'))).toHaveLength(floor.tables.length);
    expect(keys.filter((k) => k.startsWith('chef'))).toHaveLength(floor.chefsBusy.length);
    expect(keys.filter((k) => k.startsWith('waiter'))).toHaveLength(floor.waiters.length);
    const seated = floor.tables.reduce((sum, t) => sum + (t?.seated ?? 0), 0);
    expect(keys.filter((k) => k.startsWith('guest'))).toHaveLength(seated);
    // Sorted back to front.
    pieces.forEach((p, i) => i > 0 && expect(p.depth).toBeGreaterThanOrEqual(pieces[i - 1].depth));
  });

  it('copes with every moment of a whole day', () => {
    const state = newGame(4);
    const progress = startDay(state.day, state.restaurants);
    const layout = roomLayout(6, 0);
    const rng = { s: 4 };
    while (!progress.done) {
      stepDay(rng, progress);
      expect(() => scenePieces(layout, floorView(progress, 0), look(4))).not.toThrow();
    }
  });
});

describe('walking in and out', () => {
  it('brings inside guests along the street, up the steps and in through the front door', () => {
    const layout = roomLayout(12, 4);
    const door = (layout.door.x0 + layout.door.x1) / 2;
    for (let table = 0; table < 12; table++) {
      for (const seat of seatsAt(layout, 12, table)) {
        const path = walkPath(layout, 12, table, seat);
        expect(path[0]).toMatchObject({ y: layout.streetY, z: -PLINTH });
        expect(path[1]).toEqual({ x: door, y: layout.streetY, z: -PLINTH });
        expect(path.at(-1)).toEqual({ x: seat.x, y: seat.y });
        // Once through the door, they stay inside the room.
        const inside = path.slice(path.findIndex((p) => p.y < layout.roomY));
        for (const p of inside) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(layout.roomX);
          expect(p.y).toBeLessThanOrEqual(layout.roomY);
        }
        // Through the door's opening, not the wall.
        const crossing = path.findIndex((p) => p.y < layout.roomY);
        expect(path[crossing].x).toBe(door);
        expect(path[crossing - 1].x).toBe(door);
      }
    }
  });

  it('brings terrace guests in from the street', () => {
    const layout = roomLayout(6, 2);
    const seat = seatsAt(layout, 6, 6)[0];
    const path = walkPath(layout, 6, 6, seat);
    expect(path[0].y).toBeGreaterThan(layout.roomY + layout.terraceDepth);
    expect(path.at(-1)).toEqual({ x: seat.x, y: seat.y });
  });

  it('sends a waiter from their spot by the kitchen to the side of the table', () => {
    const layout = roomLayout(6, 2);
    for (let table = 0; table < 8; table++) {
      const path = servePath(layout, 6, table, 1);
      expect(path[0]).toEqual(waiterSpot(layout, 1));
      const last = path.at(-1)!;
      const seat = seatsAt(layout, 6, table)[2]; // the left-hand seat, beside the aisle
      expect(Math.abs(last.y - seat.y)).toBeLessThanOrEqual(1);
      expect(last.x).toBeLessThan(seat.x);
    }
  });

  it('keeps the street furniture off every route guests and passers-by take', () => {
    for (const [tables, terrace] of [[12, 4], [6, 0], [9, 2]]) {
      const layout = roomLayout(tables, terrace);
      const routes = [
        ...Array.from({ length: tables + terrace }, (_, t) => seatsAt(layout, tables, t).map((seat) => walkPath(layout, tables, t, seat))).flat(),
        ...[0, 1, 2].flatMap((lane) => [passerByPath(layout, lane, true, 400), passerByPath(layout, lane, false, 400)]),
      ];
      for (const route of routes) {
        for (let i = 1; i < route.length; i++) {
          const [a, b] = [route[i - 1], route[i]];
          // Only the outdoor part of each route, on the street.
          if ((a.z ?? 0) >= 0 && (b.z ?? 0) >= 0) continue;
          for (let k = 0; k <= 20; k++) {
            const x = a.x + ((b.x - a.x) * k) / 20;
            const y = a.y + ((b.y - a.y) * k) / 20;
            for (const thing of streetFurniture(layout)) expect(Math.hypot(thing.x - x, thing.y - y), thing.thing).toBeGreaterThan(3);
          }
        }
      }
    }
  });

  it('has no route to a table that does not exist', () => {
    expect(walkPath(roomLayout(6, 0), 4, 9, { x: 0, y: 0 })).toEqual([]);
  });
});

describe('characters', () => {
  const kinds: PersonKind[] = ['tourists', 'students', 'locals', 'office', 'foodies', 'critic', 'regular', 'waiter', 'tomek', 'adrian', 'chef'];
  it.each(kinds)('%s can be drawn from the front and back, standing, walking and sitting', (kind) => {
    for (const facing of ['front', 'back'] as const) {
      for (const pose of ['stand', 'walk1', 'walk2'] as const) {
        const image = personPixels(kind, facing, pose, 1);
        expect(image.width).toBe(16);
        expect(image.height).toBe(PERSON.length + HEADROOM);
      }
      expect(personPixels(kind, facing, 'sit').height).toBe(SEATED_ROWS + HEADROOM);
    }
  });

  it('shows Tomek and Adrian among the waiters as themselves', () => {
    const state = newGame(5);
    const team = [...state.team, specialCandidate('tomek', 98), specialCandidate('adrian', 99)];
    const open = openRestaurant({ ...state, team, rng: { s: 3 } });
    playTick(open);
    const waiters = floorView(open.progress, 0).waiters;
    expect(waiters).toContain('tomek');
    expect(waiters.filter((w) => w === null)).toHaveLength(1);
  });
});
