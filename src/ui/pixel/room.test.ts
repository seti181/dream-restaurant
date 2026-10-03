import { describe, expect, it } from 'vitest';
import { balance } from '../../data/balance';
import { LOCATION_IDS, LOCATIONS } from '../../data/locations';
import { REGULAR_IDS } from '../../data/regulars';
import { floorView, startDay, stepDay, type FloorView, type TableGuests } from '../../sim/day';
import * as actions from '../../sim/actions';
import { answerTheMoment, newGame, openRestaurant, playTick, type GameState } from '../../sim/game';
import { specialCandidate } from '../../sim/staff';
import { drawCloud, drawSky, drawStreet } from './street';
import { COMMUNAL_TABLE_X, PLINTH, drawRoom, guestKind, toSteps, leaveQueuePath, movePath, queueSpot, passerByPath, streetFurniture, STREET_THING_REACH, roomLayout, scenePieces, seatsAt, servePath, waiterSpot, walkPath, type RoomLook, type ScenePiece } from './room';
import { HEADROOM, lookOf, PERSON_HEIGHT, PERSON_WIDTH, personPixels, portraitPixels, PORTRAIT_ROWS, SEATED_ROWS, type PersonKind } from './sprites';

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
    for (const kind of ['walesa', 'guard', 'footballer'] as const) expect(personPixels(kind, 'front', 'sit').width).toBe(PERSON_WIDTH);
  });

  it('puts azulejo tiles on the walls when they are bought', () => {
    const layout = roomLayout(6, 2);
    const plain = drawRoom(layout, look(4));
    const tiled = drawRoom(layout, { ...look(4), decor: ['azulejoTiles'] });
    let changed = 0;
    for (let y = 0; y < plain.height; y += 2) for (let x = 0; x < plain.width; x += 2) {
      if (JSON.stringify(plain.get(x, y)) !== JSON.stringify(tiled.get(x, y))) changed++;
    }
    expect(changed).toBeGreaterThan(100);
  });

  it('starts cozy, with a fig tree and checked cloths, and bought cloths and panelling still show', () => {
    const layout = roomLayout(6, 2);
    const floor = floorView(openRestaurant(newGame(3)).progress, 0);
    const pieces = (decor: RoomLook['decor']) => scenePieces(layout, floor, { ...look(floor.insideTables), decor });
    expect(pieces([]).some((p) => p.key === 'figTree')).toBe(true);
    const table = (decor: RoomLook['decor']) => pieces(decor).find((p) => p.key.startsWith('table'))!.image.pixels.data.join();
    expect(table(['tablecloths'])).not.toBe(table([]));
    const plain = drawRoom(layout, look(4));
    const carved = drawRoom(layout, { ...look(4), decor: ['panelling'] });
    let changed = 0;
    for (let y = 0; y < plain.height; y += 2) for (let x = 0; x < plain.width; x += 2) {
      if (JSON.stringify(plain.get(x, y)) !== JSON.stringify(carved.get(x, y))) changed++;
    }
    expect(changed).toBeGreaterThan(100);
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

  /** Pixels of `front` drawn over `behind`, where both are opaque. */
  function hiddenBy(behind: ScenePiece, front: ScenePiece): number {
    let n = 0;
    const a = behind.image.pixels;
    const b = front.image.pixels;
    for (let y = 0; y < a.height; y++) {
      for (let x = 0; x < a.width; x++) {
        const bx = behind.px + x - front.px;
        const by = behind.py + y - front.py;
        if (a.get(x, y) && bx >= 0 && by >= 0 && bx < b.width && by < b.height && b.get(bx, by)) n++;
      }
    }
    return n;
  }

  it('keeps the waiters by the kitchen in full view: no chair hides them, communal table or not', () => {
    for (const tables of [6, 9, 12]) {
      for (const decor of [[], ['communalTable']] as RoomLook['decor'][]) {
        const layout = roomLayout(tables, 2);
        const floor: FloorView = {
          location: 'ogarna',
          tables: Array(tables).fill(null),
          insideTables: tables,
          terraceTables: 0,
          chefsBusy: [false],
          waiters: [null, null, null, null],
          chefLooks: [1],
          waiterLooks: [2, 3, 4, 5],
          decor,
          equipment: ['stove'],
          ordersWaiting: 0,
          walkouts: [],
          atTheDoor: [],
          leftTheDoor: [],
        };
        const pieces = scenePieces(layout, floor, { ...look(tables), decor });
        const chairs = pieces.filter((p) => p.key.startsWith('chair'));
        pieces
          .filter((p) => p.key.startsWith('waiter'))
          .forEach((waiter) => {
            const hidden = chairs.filter((c) => c.depth > waiter.depth).reduce((sum, c) => sum + hiddenBy(waiter, c), 0);
            expect(hidden, `${waiter.key} in a room for ${tables}`).toBe(0);
          });
        // Nobody waits inside the communal table, or walks through it to serve.
        for (let i = 0; i < 4; i++) {
          const spot = waiterSpot(layout, i);
          expect(spot.x - 5 > COMMUNAL_TABLE_X + 26 || spot.y - 3 > 28).toBe(true);
          for (let table = 0; table < tables; table++) {
            const path = servePath(layout, tables, table, i);
            for (const point of path.slice(1)) expect(point.y > 28 || point.x - 5 > COMMUNAL_TABLE_X + 26).toBe(true);
          }
        }
      }
    }
  });

  it('sends someone who took a flyer round the corner of the building to the steps, never through it', () => {
    for (const [tables, terrace] of [[6, 0], [9, 2], [12, 4]]) {
      const layout = roomLayout(tables, terrace);
      for (const lane of [0, 1, 2]) {
        const route = passerByPath(layout, lane, true, layout.width + 120);
        // Anywhere along their way past: a few points on every stretch.
        for (let leg = 0; leg + 1 < route.length; leg++) {
          for (const t of [0, 0.3, 0.7]) {
            const at = {
              x: route[leg].x + (route[leg + 1].x - route[leg].x) * t,
              y: route[leg].y + (route[leg + 1].y - route[leg].y) * t,
              z: route[leg].z,
            };
            const path = toSteps(layout, at);
            expect(path.at(-1)).toMatchObject({ y: layout.streetY });
            for (let i = 0; i + 1 < path.length; i++) {
              for (const s of [0, 0.25, 0.5, 0.75, 1]) {
                const x = path[i].x + (path[i + 1].x - path[i].x) * s;
                const y = path[i].y + (path[i + 1].y - path[i].y) * s;
                const inBuilding = x > 0 && x < layout.edgeX && y > 0 && y < layout.edgeY;
                expect(inBuilding, `from (${at.x}, ${at.y}) through (${x}, ${y})`).toBe(false);
              }
            }
          }
        }
      }
    }
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
    const blocked: string[] = [];
    for (const [tables, terrace] of [[12, 4], [6, 0], [9, 2]]) {
      const layout = roomLayout(tables, terrace);
      const furniture = LOCATION_IDS.flatMap((location) => streetFurniture(layout, location).map((thing) => ({ location, ...thing })));
      const routes = [
        ...Array.from({ length: tables + terrace }, (_, t) => seatsAt(layout, tables, t).map((seat) => walkPath(layout, tables, t, seat))).flat(),
        ...[0, 1, 2].flatMap((lane) => [passerByPath(layout, lane, true, 400), passerByPath(layout, lane, false, 400)]),
        // Someone handed a flyer anywhere along their way, heading for the steps.
        ...[0, 1, 2].flatMap((lane) => {
          const route = passerByPath(layout, lane, true, 400);
          return route.slice(1).flatMap((b, i) =>
            [0.2, 0.6].map((t) => toSteps(layout, { x: route[i].x + (b.x - route[i].x) * t, y: route[i].y + (b.y - route[i].y) * t, z: b.z })),
          );
        }),
      ];
      for (const route of routes) {
        for (let i = 1; i < route.length; i++) {
          const [a, b] = [route[i - 1], route[i]];
          // Only the outdoor part of each route, on the street.
          if ((a.z ?? 0) >= 0 && (b.z ?? 0) >= 0) continue;
          for (let k = 0; k <= 20; k++) {
            const x = a.x + ((b.x - a.x) * k) / 20;
            const y = a.y + ((b.y - a.y) * k) / 20;
            for (const { location, thing, x: tx, y: ty } of furniture) {
              if (Math.hypot(tx - x, ty - y) <= STREET_THING_REACH[thing]) blocked.push(`${location}: ${thing} at ${tx}, ${ty}`);
            }
          }
        }
      }
    }
    expect([...new Set(blocked)]).toEqual([]);
  });

  it('walks a party that is moved from one table to another, via the door, seat to seat', () => {
    const layout = roomLayout(6, 2);
    const from = seatsAt(layout, 6, 4)[0];
    const to = seatsAt(layout, 6, 6)[0];
    const path = movePath(layout, 6, 4, from, 6, to);
    expect(path[0]).toEqual({ x: from.x, y: from.y });
    expect(path.at(-1)).toEqual({ x: to.x, y: to.y });
    // Never out on the street.
    for (const p of path) expect(p.z ?? 0).toBe(0);
  });

  it('lines the queue up on the street beside the steps, and sends anyone who gives up off down the street', () => {
    for (const terrace of [0, 4]) {
      const layout = roomLayout(9, terrace);
      const door = (layout.door.x0 + layout.door.x1) / 2;
      for (let n = 0; n < 8; n++) {
        const spot = queueSpot(layout, n);
        expect(spot.z).toBe(-PLINTH);
        expect(spot.y).toBeGreaterThan(layout.edgeY);
        expect(spot.x).toBeGreaterThan(door + 8);
      }
      const away = leaveQueuePath(layout, 0);
      expect(away[0]).toEqual(queueSpot(layout, 0));
      expect(away.at(-1)!.x).toBeGreaterThan(away[0].x + 100);
    }
  });

  it('has no route to a table that does not exist', () => {
    expect(walkPath(roomLayout(6, 0), 4, 9, { x: 0, y: 0 })).toEqual([]);
  });
});

describe('characters', () => {
  const kinds: PersonKind[] = [
    ...['tourists', 'students', 'locals', 'office', 'foodies', 'critic', 'regular', 'waiter', 'tomek', 'adrian', 'chef'] as const,
    ...REGULAR_IDS,
  ];
  it.each(kinds)('%s can be drawn from the front and back, standing, walking, sitting and eating', (kind) => {
    for (const facing of ['front', 'back'] as const) {
      for (const pose of ['stand', 'walk1', 'walk2', 'stir1', 'stir2'] as const) {
        const image = personPixels(kind, facing, pose, 1);
        expect(image.width).toBe(PERSON_WIDTH);
        expect(image.height).toBe(PERSON_HEIGHT + HEADROOM);
      }
      for (const pose of ['sit', 'eat', 'bite', 'menu'] as const) expect(personPixels(kind, facing, pose).height).toBe(SEATED_ROWS + HEADROOM);
    }
  });

  it('shows guests reading the menu, then eating a forkful now and then, and busy chefs stirring', () => {
    const layout = roomLayout(6, 0);
    const at = (stage: TableGuests['stage']): TableGuests => ({
      group: 'locals',
      seated: 4,
      stage,
      impatience: 0,
      satisfaction: stage === 'eating' ? 70 : null,
      eatingFor: 0,
      bill: 0,
      critic: false,
      regular: false,
      regularId: null,
      visitor: null,
      drink: false,
      apology: false,
      moved: false,
      tablesUsed: 1,
      since: 660,
    });
    const floor: FloorView = {
      location: 'ogarna',
      tables: [at('ordering'), at('waiting'), at('eating')],
      insideTables: 3,
      terraceTables: 0,
      chefsBusy: [true, false],
      waiters: [null],
      chefLooks: [0, 1],
      waiterLooks: [2],
      decor: [],
      equipment: ['stove'],
      ordersWaiting: 1,
      walkouts: [],
      atTheDoor: [],
      leftTheDoor: [],
    };
    const pieces = scenePieces(layout, floor, look(3));
    const guest = (table: number, seat: number) => {
      const slot = layout.inside[table];
      return pieces.find((p) => p.key === `guest${slot.x},${slot.y},${seat}`)!;
    };
    // Eating: two poses side by side, a forkful now and then.
    expect(guest(2, 0).frames).toMatchObject({ count: 2, rhythm: 'bite' });
    expect(guest(2, 0).image.pixels.width).toBe(2 * PERSON_WIDTH);
    // Ordering, facing us: the menu in their hands, unlike while they wait for the food.
    expect(guest(0, 0).frames).toBeUndefined();
    expect(guest(0, 0).image.pixels.data.join()).not.toBe(guest(1, 0).image.pixels.data.join());
    // The busy chef stirs; the idle one stands ready.
    expect(pieces.find((p) => p.key === 'chef0')!.frames).toMatchObject({ count: 2, rhythm: 'stir' });
    expect(pieces.find((p) => p.key === 'chef1')!.frames).toBeUndefined();
  });

  it('gives guests seven hairstyles, and office workers their glasses', () => {
    const groups = ['tourists', 'students', 'locals', 'office', 'foodies'] as const;
    const styles = new Set(groups.flatMap((group) => [0, 1, 2, 3].map((variant) => lookOf(group, variant).hair)));
    expect([...styles].sort()).toEqual(['bald', 'bob', 'bun', 'cap', 'long', 'short', 'spiky']);
    expect([0, 1, 2, 3].every((variant) => lookOf('office', variant).glasses)).toBe(true);
  });

  it('draws a portrait of anyone on the team: head and shoulders, with a face for their mood', () => {
    const fine = portraitPixels('waiter', 2, 'fine');
    expect(fine.width).toBe(PERSON_WIDTH);
    expect(fine.height).toBe(PORTRAIT_ROWS);
    const same = (a: typeof fine, b: typeof fine) => {
      for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) if (String(a.get(x, y)) !== String(b.get(x, y))) return false;
      return true;
    };
    expect(same(fine, portraitPixels('waiter', 2, 'tired'))).toBe(false);
    expect(same(fine, portraitPixels('waiter', 3, 'fine'))).toBe(false);
    // Tomek is always happy.
    expect(same(portraitPixels('tomek', 0, 'fine'), portraitPixels('tomek', 0, 'wornOut'))).toBe(true);
  });

  it('gives each chef and waiter their own face, the same in the restaurant as on their card', () => {
    const state = newGame(5);
    const view = floorView(openRestaurant(state).progress, 0);
    expect(view.chefLooks).toEqual(state.team.filter((p) => p.role === 'chef').map((p) => p.id));
    expect(view.waiterLooks).toEqual(state.team.filter((p) => p.role === 'waiter').map((p) => p.id));
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
