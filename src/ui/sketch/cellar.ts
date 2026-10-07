// The cellar room (piwnica) seen from the front, like the room upstairs (project.md section 6.14,
// "Bigger premises"; chosen 2026-10-07: a view of its own, down the stairs). The stairs come down on
// the left, the tables stand in one row under brick vaults, barrels in the corner on the right.
// Pure arithmetic, in page units, like frontRoom.ts.

import { CLOTH, LAYER, PITCH, zOf, type Point, type TableSpot } from './frontRoom';

export interface CellarLayout {
  width: number;
  height: number;
  /** Where the back wall meets the floor. */
  floorY: number;
  /** The stairs down from the room: from the top of the page at the left to the floor at `x1`. */
  stairs: { x1: number; top: number };
  /** The vaulted stretch of wall between the stairs and the barrels. */
  vaults: { x0: number; x1: number };
  /** The barrels' corner on the right. */
  barrels: { x0: number };
  tables: TableSpot[];
  /** Where people walking along the front of the tables put their feet. */
  lane: number;
}

const STAIRS_W = 240;
const BARRELS_W = 250;
const BOTTOM_PAD = 24;
/** The floor shows this deep in front of the back wall, behind the tables. */
const FLOOR_DEPTH = 120;

/** The cellar for `count` tables (one row), shaped to fill a screen `aspect` times as wide as it is tall. */
export function cellarLayout(count: number, aspect: number): CellarLayout {
  const height = 603;
  const content = STAIRS_W + Math.max(2, count) * (PITCH + 20) + BARRELS_W;
  const width = Math.max(content, Math.round(height * Math.max(1, aspect)));
  const scale = 1.06;
  const top = height - BOTTOM_PAD - 22 - CLOTH * scale;
  const floorY = top - FLOOR_DEPTH;
  const zone = { x0: STAIRS_W + 20, x1: width - BARRELS_W };
  const pitch = Math.min(PITCH + 60, (zone.x1 - zone.x0) / Math.max(1, count));
  const first = (zone.x0 + zone.x1) / 2 - (pitch * (count - 1)) / 2;
  const tables: TableSpot[] = Array.from({ length: count }, (_, i) => {
    const x = first + i * pitch;
    const y = top + 24 * scale;
    return {
      x,
      row: 0,
      top,
      scale,
      seats: [
        { x: x - 36 * scale, y, end: false, mirror: false },
        { x: x + 36 * scale, y, end: false, mirror: true },
        { x: x - 84 * scale, y, end: true, mirror: false },
        { x: x + 84 * scale, y, end: true, mirror: true },
      ],
    };
  });
  return { width, height, floorY, stairs: { x1: STAIRS_W, top: 40 }, vaults: { x0: STAIRS_W - 10, x1: width - BARRELS_W + 40 }, barrels: { x0: width - BARRELS_W }, tables, lane: top + CLOTH * scale + 14 };
}

/** How big someone is drawn standing at depth y: smaller by the back wall, full size along the front. */
export function cellarDepth(L: CellarLayout, y: number): number {
  const t = Math.max(0, Math.min(1.1, (y - L.floorY) / Math.max(1, L.lane - L.floorY)));
  return 0.82 + t * (1.06 - 0.82);
}

/** The foot of the stairs, and a point part way up them (people come down from the room this way). */
function stairsWay(L: CellarLayout): Point[] {
  const aisle = zOf(0, LAYER.aisle);
  return [
    { x: 30, y: L.floorY - 150, z: aisle },
    { x: L.stairs.x1 - 20, y: L.floorY + 8, z: aisle },
  ];
}

/** Down the stairs, along the front and round behind the table to a seat. */
export function cellarWalkIn(L: CellarLayout, table: number, seat: number): Point[] {
  const spot = L.tables[table];
  if (!spot) return [];
  const s = spot.seats[seat];
  const aisle = zOf(0, LAYER.aisle);
  const lane = L.lane + seat * 6;
  return [...stairsWay(L), { x: L.stairs.x1 + 10, y: lane, z: aisle }, { x: s.x, y: lane, z: aisle }, { x: s.x, y: s.y, z: zOf(0, LAYER.behind) }];
}

/** A waiter's way down the stairs to the front of a table. */
export function cellarServe(L: CellarLayout, table: number): Point[] {
  const spot = L.tables[table];
  if (!spot) return [];
  const aisle = zOf(0, LAYER.aisle);
  return [...stairsWay(L), { x: L.stairs.x1 + 10, y: L.lane, z: aisle }, { x: spot.x + 24, y: L.lane, z: aisle }];
}

/** A party shown to another table in the cellar: up, along the front, and down at the new one. */
export function cellarMove(L: CellarLayout, from: number, fromSeat: number, to: number, toSeat: number): Point[] {
  const a = L.tables[from];
  const b = L.tables[to];
  if (!a || !b) return [];
  const sa = a.seats[fromSeat];
  const sb = b.seats[toSeat];
  const aisle = zOf(0, LAYER.aisle);
  const behind = zOf(0, LAYER.behind);
  return [
    { x: sa.x, y: sa.y, z: behind },
    { x: sa.x, y: L.lane, z: aisle },
    { x: sb.x, y: L.lane, z: aisle },
    { x: sb.x, y: sb.y, z: behind },
  ];
}
