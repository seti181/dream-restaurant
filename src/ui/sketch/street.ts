// The street outside the restaurant, seen from across the street (project.md section 9.5, "The
// street outside"): the restaurant's townhouse among its neighbours, the pavement in front with the
// terrace, a lane just in front of the houses (to and from the door) and one along the bottom (people
// walking past). Pure arithmetic, in page units, like frontRoom.ts.

import type { LocationId } from '../../data/locations';
import type { FloorView, TableGuests } from '../../sim/day';
import { CLOTH, LAYER, PITCH, zOf, type Point, type Row, type TableSpot } from './frontRoom';

export interface House {
  x0: number;
  x1: number;
  /** Where its front wall ends at the top (its gable rises above). */
  top: number;
  /** Which of the facade colours, and which kind of gable. */
  colour: number;
  gable: 'stepped' | 'curved' | 'pointed' | 'flat';
}

export interface StreetLayout {
  width: number;
  height: number;
  location: LocationId;
  /** Where the house fronts meet the pavement. */
  ground: number;
  /** The restaurant's own house, its door, hanging sign and chalkboard. */
  home: House;
  door: { x: number; width: number; top: number };
  sign: { x: number; y: number };
  board: { x: number; y: number };
  /** The neighbours, left and right. */
  houses: House[];
  /** People going to and from the door walk here, just in front of the houses. */
  backLane: number;
  /** People walking past walk here, along the bottom. */
  frontLane: number;
  /** The quay over the river (Długie Pobrzeże, the granaries): water below the front lane. */
  river: boolean;
  /** The terrace's rows and table spots, in the order the terrace's tables fill them. */
  rows: Row[];
  tables: TableSpot[];
  musician: { x: number; y: number };
  /** Where a waiter stands with a tray of samples: by the door, past the board. */
  samples: { x: number; y: number };
}

const WIDTH = 1500;
const HOME_W = 440;

/** A little hash, so each street's houses are always the same. */
const hash = (s: string, i: number) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 2166136261 ^ (i * 977)) % 1000;

/** The street for a restaurant with `terrace` terrace tables, shaped to fill a screen `aspect` times as wide as it is tall. */
export function streetLayout(terrace: number, aspect: number, location: LocationId): StreetLayout {
  const width = WIDTH;
  const height = Math.max(603, Math.round(width / Math.max(1, aspect)));
  const rowCount = terrace > 3 ? 2 : 1;
  const perRow = Math.max(1, Math.ceil(terrace / rowCount));
  const river = location === 'pobrzeze' || location === 'spichrzow';
  const frontLane = river ? height - 92 : height - 30;
  const ground = frontLane - (rowCount === 2 ? 236 : 150);
  const backLane = ground + 18;

  // The restaurant stands a little left of the middle; its door is on its left, the terrace to the right of it.
  const homeX0 = Math.round(width * 0.42 - HOME_W / 2);
  const home: House = { x0: homeX0, x1: homeX0 + HOME_W, top: ground - 268, colour: 0, gable: 'stepped' };
  const door = { x: homeX0 + 78, width: 74, top: ground - 132 };

  // Neighbours to the left and right, each street's own.
  const houses: House[] = [];
  const gables: House['gable'][] = ['curved', 'pointed', 'stepped', 'flat'];
  // On Długie Pobrzeże the Żuraw stands at the left end of the quay, where no house is.
  const leftEnd = location === 'pobrzeze' ? 300 : -40;
  for (const [from, to, dir] of [
    [homeX0, leftEnd, -1],
    [homeX0 + HOME_W, width + 40, 1],
  ] as const) {
    let x = from;
    for (let i = 0; dir < 0 ? x > to : x < to; i++) {
      const h = hash(location, i * 2 + (dir > 0 ? 1 : 0));
      const w = 150 + (h % 50);
      const x0 = dir < 0 ? Math.max(to, x - w) : x;
      if (dir < 0 && x - to < 60) break;
      houses.push({ x0, x1: dir < 0 ? x : x0 + w, top: ground - 190 - (h % 80), colour: 1 + (h % 4), gable: gables[h % 4] });
      x += dir * w;
    }
  }

  // The terrace: one row, or two staggered rows, to the right of the door.
  const rows: Row[] = [];
  for (let r = 0; r < rowCount; r++) {
    const scale = 0.92 + 0.06 * r;
    const top = ground + 66 + r * 100;
    rows.push({ top, lane: top + CLOTH * scale + 10, scale });
  }
  const x0 = door.x + 150;
  const tables: TableSpot[] = [];
  for (let column = 0; column < perRow; column++)
    for (let r = 0; r < rowCount; r++) {
      if (tables.length >= terrace) break;
      const x = x0 + PITCH * column + (r % 2 ? PITCH / 2 : 0);
      const { top, scale: k } = rows[r];
      const y = top + 24 * k;
      tables.push({
        x,
        row: r,
        top,
        scale: k,
        seats: [
          { x: x - 36 * k, y, end: false, mirror: false },
          { x: x + 36 * k, y, end: false, mirror: true },
          { x: x - 84 * k, y, end: true, mirror: false },
          { x: x + 84 * k, y, end: true, mirror: true },
        ],
      });
    }
  if (rows.length === 0) rows.push({ top: ground + 66, lane: ground + 140, scale: 0.92 });

  return {
    width,
    height,
    location,
    ground,
    home,
    door,
    sign: { x: homeX0 + HOME_W - 70, y: ground - 150 },
    board: { x: door.x + 64, y: backLane },
    houses,
    backLane,
    frontLane,
    river,
    rows,
    tables,
    musician: { x: door.x - 200, y: backLane + 4 },
    samples: { x: door.x + 150, y: backLane + 4 },
  };
}

/**
 * What wants the player on each side of the door, for the badge on the Inside/Outside switch: a table
 * that needs help inside; outside a gull, then a queue, then a terrace table that needs help.
 */
export function whatNeedsYou(
  floor: Pick<FloorView, 'tables' | 'insideTables' | 'counterFrom' | 'gull' | 'atTheDoor'>,
  needsHelp: (guests: TableGuests | null) => boolean,
): { inside: 'help' | null; outside: 'mewa' | 'hourglass' | 'help' | null } {
  const { tables, insideTables, counterFrom } = floor;
  // Inside: the room's tables and the bar counter; outside: the terrace's tables between them.
  const outsideTable = (t: number) => t >= insideTables && t < counterFrom;
  return {
    inside: tables.some((g, t) => !outsideTable(t) && needsHelp(g)) ? 'help' : null,
    outside: floor.gull ? 'mewa' : floor.atTheDoor.length > 0 ? 'hourglass' : tables.some((g, t) => outsideTable(t) && needsHelp(g)) ? 'help' : null,
  };
}

/** The street's lamps (two on the pavement, one by the door), where their light is, and how far it reaches. */
export function streetLamps(L: StreetLayout): { x: number; y: number; r: number }[] {
  const { x, width, top } = L.door;
  return [
    { x: L.home.x0 - 60, y: L.ground - 160, r: 90 },
    { x: L.width - 120, y: L.ground - 160, r: 90 },
    { x: x - width / 2 - 22, y: top + 21, r: 55 },
  ];
}

/** How big someone is drawn standing at depth y: smaller by the houses, bigger near us. */
export function streetDepth(L: StreetLayout, y: number): number {
  const t = Math.max(0, Math.min(1.1, (y - L.backLane) / Math.max(1, L.frontLane - L.backLane)));
  return 0.8 + t * 0.26;
}

/** Stacking: the lane by the houses is behind the terrace, the lane along the bottom in front of it. */
export const BACK_Z = 9;
export const FRONT_Z = 60;

/** Which side of the street someone comes from: the nearer edge. */
const edgeFor = (L: StreetLayout, x: number) => (x < L.width / 2 ? -70 : L.width + 70);

/** From the street to a seat at a terrace table: along the row's aisle from the nearer edge. */
export function terraceWalkIn(L: StreetLayout, spot: number, seat: number): Point[] {
  const t = L.tables[spot];
  if (!t) return [];
  const s = t.seats[seat];
  const aisle = zOf(t.row, LAYER.aisle);
  const lane = L.rows[t.row].lane + seat * 5;
  return [
    { x: edgeFor(L, t.x), y: lane, z: aisle },
    { x: s.x, y: lane, z: aisle },
    { x: s.x, y: s.y, z: zOf(t.row, LAYER.behind) },
  ];
}

/** A waiter's way out of the door to the front of a terrace table. */
export function terraceServe(L: StreetLayout, spot: number): Point[] {
  const t = L.tables[spot];
  if (!t) return [];
  const aisle = zOf(t.row, LAYER.aisle);
  const lane = L.rows[t.row].lane;
  return [
    { x: L.door.x, y: L.ground + 4, z: BACK_Z },
    { x: L.door.x, y: lane, z: aisle },
    { x: t.x + 24, y: lane, z: aisle },
  ];
}

/** A party shown from one terrace table to another. */
export function terraceMove(L: StreetLayout, from: number, fromSeat: number, to: number, toSeat: number): Point[] {
  const a = L.tables[from];
  const b = L.tables[to];
  if (!a || !b) return [];
  const sa = a.seats[fromSeat];
  const sb = b.seats[toSeat];
  const laneA = L.rows[a.row].lane;
  const laneB = L.rows[b.row].lane;
  const side = L.door.x + 70;
  return [
    { x: sa.x, y: sa.y, z: zOf(a.row, LAYER.behind) },
    { x: sa.x, y: laneA, z: zOf(a.row, LAYER.aisle) },
    ...(a.row === b.row ? [] : [{ x: side, y: laneA, z: zOf(a.row, LAYER.aisle) }, { x: side, y: laneB, z: zOf(b.row, LAYER.aisle) }]),
    { x: sb.x, y: laneB, z: zOf(b.row, LAYER.aisle) },
    { x: sb.x, y: sb.y, z: zOf(b.row, LAYER.behind) },
  ];
}

/** Into the restaurant from the street (or, reversed, out of it): along the houses to the door. */
export function doorWalk(L: StreetLayout, person: number, fromLeft: boolean): Point[] {
  const lane = L.backLane + person * 4;
  return [
    { x: fromLeft ? -70 : L.width + 70, y: lane, z: BACK_Z },
    { x: L.door.x + (person - 1.5) * 10, y: lane, z: BACK_Z },
    { x: L.door.x + (person - 1.5) * 6, y: L.ground + 2, z: BACK_Z },
  ];
}

/** Someone walking past, along the bottom (or along the houses), one way or the other. */
export function passerWalk(L: StreetLayout, back: boolean, leftToRight: boolean): Point[] {
  const y = back ? L.backLane + 8 : L.frontLane;
  const z = back ? BACK_Z : FRONT_Z;
  const ends = [-80, L.width + 80];
  if (!leftToRight) ends.reverse();
  return [
    { x: ends[0], y, z },
    { x: ends[1], y, z },
  ];
}

/** Someone handed a flyer turns from where they are and goes in at the door. */
export function toTheDoor(L: StreetLayout, here: Point): Point[] {
  return [
    here,
    { x: here.x, y: L.backLane + 6, z: BACK_Z },
    { x: L.door.x, y: L.backLane + 6, z: BACK_Z },
    { x: L.door.x, y: L.ground + 2, z: BACK_Z },
  ];
}

/** Parties waiting for a table stand on the pavement by the door, one behind the other. */
export function streetQueueSpot(L: StreetLayout, place: number, person: number): Point {
  return { x: L.door.x - 30 - place * 46 - person * 22, y: L.backLane + 6 + person * 3, z: BACK_Z + place };
}
