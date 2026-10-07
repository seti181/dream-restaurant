// The restaurant seen from the front, like a stage (project.md section 9.5): where everything goes.
// The back wall faces the street, with the windows and the door; the bar is on the left and the
// kitchen hatch on the right. Tables stand in two or three staggered rows, each guest's face to us,
// and guests walk along the aisle in front of their row. Pure arithmetic, in page units.

/** One seat at a table: where the guest sits, and whether they sit at the end (legs showing) or face the other way. */
export interface Seat {
  x: number;
  y: number;
  /** At the end of the table, turned towards it with their legs under it, rather than behind it. */
  end: boolean;
  /** Turned to the left (drawn mirrored). */
  mirror: boolean;
}

export interface TableSpot {
  x: number;
  row: number;
  /** The table top's middle line. */
  top: number;
  /** Rows nearer us are drawn a little bigger. */
  scale: number;
  /** Behind it left and right, then the left and right ends: the order a party sits down in. */
  seats: Seat[];
}

export interface Row {
  top: number;
  /** Where people walking along this row's aisle put their feet. */
  lane: number;
  scale: number;
}

export interface FrontLayout {
  width: number;
  height: number;
  /** Where the back wall meets the floor. */
  floorY: number;
  rows: Row[];
  /** Every table spot, in the order the restaurant's tables fill them. */
  tables: TableSpot[];
  bar: { x0: number; x1: number };
  /** The kitchen hatch: its opening (top to counter), and where the counter's front ends on the floor. */
  hatch: { x0: number; x1: number; top: number; counter: number; front: number };
  /** The door in the back wall, out to the street. */
  door: { x: number; width: number; top: number };
  windows: { x: number; w: number; top: number; sill: number }[];
  /** Where waiters pick up plates. */
  pass: { x: number; y: number };
}

export interface Point {
  x: number;
  y: number;
  /** The stacking layer while walking there (see zOf). */
  z: number;
}

const SIDE = 40;
const BAR_W = 240;
const DOOR_W = 120;
const HATCH_W = 270;
/** Table to table along a row. */
export const PITCH = 230;
/** Table top to table top, row to row. */
const ROW_GAP = 104;
/** From the table top down to the hem of the cloth. */
export const CLOTH = 70;
/** The least wall above the floor: the windows, the bar's shelves and the hatch need this much. */
const WALL_HEIGHT = 330;
/** Below the page's bottom edge, which the sketchbook frame covers. */
const BOTTOM_PAD = 24;

/** Stacking order: each row has its layers, and nearer rows stack over farther ones. */
export const LAYER = { chairs: 0, behind: 1, table: 2, plates: 3, aisle: 5 } as const;
export const zOf = (row: number, layer: number) => 10 + row * 10 + layer;

/**
 * The room for a restaurant with `slots` table spots (its most tables), shaped to fill a screen
 * `aspect` times as wide as it is tall.
 */
export function frontLayout(slots: number, aspect: number): FrontLayout {
  const rowCount = slots <= 8 ? 2 : 3;
  const perRow = Math.max(1, Math.ceil(slots / rowCount));
  const tableZone = perRow * PITCH + PITCH / 2;
  const width = SIDE + BAR_W + tableZone + DOOR_W + HATCH_W + SIDE;
  const height = Math.max(603, Math.round(width / Math.max(1, aspect)));

  // Rows from the front back: the front row's aisle runs along the bottom of the page. On a
  // screen taller than the room needs, the rows spread out a little and the wall takes the rest.
  const frontScale = 1 + 0.06 * (rowCount - 1);
  const needed = BOTTOM_PAD + 22 + CLOTH * frontScale + (rowCount - 1) * ROW_GAP + 44 + WALL_HEIGHT;
  const gap = ROW_GAP + Math.min(60, (Math.max(0, height - needed) * 0.3) / Math.max(1, rowCount - 1));
  const rows: Row[] = [];
  let top = 0;
  for (let r = rowCount - 1; r >= 0; r--) {
    const scale = 1 + 0.06 * r;
    top = r === rowCount - 1 ? height - BOTTOM_PAD - 22 - CLOTH * scale : top - gap;
    rows[r] = { top, lane: top + CLOTH * scale + 14, scale };
  }
  const floorY = rows[0].top - 44;

  // Every spot, then ordered from the middle of the room out, so a restaurant with fewer tables
  // than spots has them together in the middle rather than bunched at one end.
  const x0 = SIDE + BAR_W;
  const middle = x0 + tableZone / 2;
  const spots: { column: number; row: number }[] = [];
  for (let column = 0; column < perRow; column++) for (let row = 0; row < rowCount; row++) spots.push({ column, row });
  const xOf = ({ column, row }: { column: number; row: number }) => x0 + PITCH * (column + 0.5) + (row % 2 ? PITCH / 2 : 0);
  spots.sort((a, b) => Math.abs(xOf(a) - middle) - Math.abs(xOf(b) - middle) || a.row - b.row || a.column - b.column);
  const tables: TableSpot[] = [];
  for (const { column, row } of spots) {
    if (tables.length >= slots) break;
    const x = xOf({ column, row });
    const { top: t, scale: k } = rows[row];
    const y = t + 24 * k;
    tables.push({
      x,
      row,
      top: t,
      scale: k,
      seats: [
        { x: x - 36 * k, y, end: false, mirror: false },
        { x: x + 36 * k, y, end: false, mirror: true },
        { x: x - 84 * k, y, end: true, mirror: false },
        { x: x + 84 * k, y, end: true, mirror: true },
      ],
    });
  }

  const doorX = x0 + tableZone + DOOR_W / 2;
  const hatchX0 = x0 + tableZone + DOOR_W;
  const sill = floorY - 70;
  const windowTop = Math.max(70, sill - 300);
  // One window fewer than columns of tables, spread evenly, so there's wall between them for pictures.
  const count = Math.max(1, perRow - 1);
  const spacing = tableZone / count;
  const windows = Array.from({ length: count }, (_, i) => ({ x: x0 + spacing * (i + 0.5) - 65, w: 130, top: windowTop, sill }));

  return {
    width,
    height,
    floorY,
    rows,
    tables,
    bar: { x0: SIDE, x1: SIDE + BAR_W },
    hatch: { x0: hatchX0, x1: hatchX0 + HATCH_W, top: floorY - 250, counter: floorY - 56, front: floorY + 30 },
    door: { x: doorX, width: 92, top: floorY - 178 },
    windows,
    pass: { x: hatchX0 + 40, y: floorY + 46 },
  };
}

/** The way from the door to a seat, aisle by aisle. */
export function walkIn(layout: FrontLayout, table: number, seat: number): Point[] {
  const spot = layout.tables[table];
  if (!spot) return [];
  const s = spot.seats[seat];
  const aisle = zOf(spot.row, LAYER.aisle);
  const lane = layout.rows[spot.row].lane;
  // A party comes through the door side by side, not in single file.
  const side = layout.door.x + (seat - 1.5) * 20;
  return [
    { x: side, y: layout.floorY + 4, z: aisle },
    { x: side, y: lane + seat * 6, z: aisle },
    { x: s.x, y: lane + seat * 6, z: aisle },
    // The last steps take them round behind the table.
    { x: s.x, y: s.y, z: zOf(spot.row, LAYER.behind) },
  ];
}

/** A waiter's way from the pass to the front of a table. */
export function serveWalk(layout: FrontLayout, table: number): Point[] {
  const spot = layout.tables[table];
  if (!spot) return [];
  const aisle = zOf(spot.row, LAYER.aisle);
  const lane = layout.rows[spot.row].lane;
  return [
    { x: layout.pass.x, y: layout.pass.y, z: zOf(0, LAYER.aisle) },
    { x: layout.pass.x, y: lane, z: aisle },
    { x: spot.x + 24, y: lane, z: aisle },
  ];
}

/** A party shown to another table: up from their seats, along the aisles, and down at the new one. */
export function moveWalk(layout: FrontLayout, from: number, fromSeat: number, to: number, toSeat: number): Point[] {
  const a = layout.tables[from];
  const b = layout.tables[to];
  if (!a || !b) return [];
  const sa = a.seats[fromSeat];
  const sb = b.seats[toSeat];
  const laneA = layout.rows[a.row].lane;
  const laneB = layout.rows[b.row].lane;
  const za = zOf(a.row, LAYER.aisle);
  const zb = zOf(b.row, LAYER.aisle);
  const side = layout.door.x;
  return [
    { x: sa.x, y: sa.y, z: zOf(a.row, LAYER.behind) },
    { x: sa.x, y: laneA, z: za },
    ...(a.row === b.row ? [] : [{ x: side, y: laneA, z: za }, { x: side, y: laneB, z: zb }]),
    { x: sb.x, y: laneB, z: zb },
    { x: sb.x, y: sb.y, z: zOf(b.row, LAYER.behind) },
  ];
}

// ---------- The bar counter (bigger premises, section 6.14) ----------

/** Where people sit at the bar counter: on stools in front of it, a few steps out from the back wall. */
const COUNTER_SEAT = 46;
/** How far apart the two places at the counter are, and the two stools of a place. */
const COUNTER_PITCH = 112;
const STOOL_GAP = 30;

/**
 * The bar counter's places, each for one or two on a pair of stools, turned to each other. Shaped like a
 * table spot (its `top` is the counter's top, where the plates go), so a party there is drawn like one at a table.
 */
export function counterSpots(layout: FrontLayout, places: number): TableSpot[] {
  const y = layout.floorY + COUNTER_SEAT;
  const k = depthScale(layout, y + 30);
  return Array.from({ length: places }, (_, c) => {
    const x = layout.bar.x0 + 72 + c * COUNTER_PITCH;
    return {
      x,
      row: -1,
      top: layout.floorY - 40,
      scale: k,
      seats: [
        { x: x - STOOL_GAP * k, y, end: true, mirror: false },
        { x: x + STOOL_GAP * k, y, end: true, mirror: true },
      ],
    };
  });
}

/** The counter's guests stack just in front of the bar, behind every row of tables. */
export const COUNTER_Z = 3;

/** In at the door and along the back wall to a stool at the counter. */
export function counterWalkIn(layout: FrontLayout, spot: TableSpot, seat: number): Point[] {
  const s = spot.seats[seat] ?? spot.seats[0];
  const along = layout.floorY + COUNTER_SEAT + 26 + seat * 6;
  return [
    { x: layout.door.x + (seat - 0.5) * 20, y: layout.floorY + 4, z: COUNTER_Z + 2 },
    { x: layout.door.x + (seat - 0.5) * 20, y: along, z: COUNTER_Z + 2 },
    { x: s.x, y: along, z: COUNTER_Z + 2 },
    { x: s.x, y: s.y, z: COUNTER_Z },
  ];
}

/** A waiter's way from the pass along the back of the room to the counter. */
export function counterServe(layout: FrontLayout, spot: TableSpot): Point[] {
  const along = layout.floorY + COUNTER_SEAT + 34;
  return [
    { x: layout.pass.x, y: layout.pass.y, z: COUNTER_Z + 2 },
    { x: layout.pass.x, y: along, z: COUNTER_Z + 2 },
    { x: spot.x + 60, y: along, z: COUNTER_Z + 2 },
  ];
}

/** How big someone is drawn standing at depth y: smaller by the back wall, bigger near us, like the rows. */
export function depthScale(layout: FrontLayout, y: number): number {
  const front = layout.rows[layout.rows.length - 1];
  const t = Math.max(0, Math.min(1.1, (y - layout.floorY) / Math.max(1, front.lane - layout.floorY)));
  return 0.82 + t * (front.scale - 0.82);
}

/** Where idle waiters wait: in front of the bar, or with guests at a bar counter, at the kitchen's pass. */
export function waiterSpot(layout: FrontLayout, i: number, byThePass = false): Point {
  if (byThePass) return { x: layout.pass.x + 30 + (i % 4) * 50, y: layout.hatch.front + 26 + (i >= 4 ? 24 : 0), z: 8 };
  return { x: layout.bar.x0 + 70 + (i % 4) * 52, y: layout.rows[0].lane + (i >= 4 ? 30 : 0), z: zOf(0, LAYER.aisle) };
}

/** Where each chef stands behind the hatch's counter. */
export function chefSpot(layout: FrontLayout, count: number, i: number): { x: number; y: number } {
  const { x0, x1 } = layout.hatch;
  const span = x1 - x0 - 120;
  return { x: x0 + 70 + (count <= 1 ? span / 2 : (span * i) / (count - 1)), y: layout.floorY };
}

/** Parties waiting for a table stand by the door, one behind the other. */
export function queueSpot(layout: FrontLayout, place: number, person: number): Point {
  return { x: layout.door.x - 20 + person * 30 - place * 14, y: layout.floorY + 30 + place * 22, z: zOf(0, LAYER.aisle) };
}
