import { describe, expect, it } from 'vitest';
import { balance } from '../../data/balance';
import { LOCATION_IDS, LOCATIONS } from '../../data/locations';
import { floorView, startDay, stepDay } from '../../sim/day';
import * as actions from '../../sim/actions';
import { newGame, openRestaurant, playTick, type GameState } from '../../sim/game';
import { drawRoom, roomLayout, scenePieces, type RoomLook } from './room';

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

  it('draws a room picture of the promised size, framed by the dark backdrop', () => {
    const layout = roomLayout(6, 2);
    const room = drawRoom(layout, look(4));
    expect(room.width).toBe(layout.width);
    expect(room.height).toBe(layout.height);
    expect(room.get(0, 0)).toEqual([0x2a, 0x1d, 0x26]);
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
    expect(keys.filter((k) => k.startsWith('waiter'))).toHaveLength(floor.waiters);
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
